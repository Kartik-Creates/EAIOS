"""Tests for POST /api/v1/chat.

See tests/rag_fixtures.py for why retrieval is faked instead of hitting a
real pgvector query in this test suite.
"""
import pytest
from app.models.unanswered_query import UnansweredQuery
from sqlalchemy import select

from tests.rag_fixtures import (
    captured_search_calls,
    fake_generate_answer,
    fake_semantic_search,
    register_and_login,
)


@pytest.fixture(autouse=True)
def _patch_pipeline(monkeypatch):
    captured_search_calls.clear()
    monkeypatch.setattr("app.routers.chat.semantic_search", fake_semantic_search)
    monkeypatch.setattr("app.routers.chat.generate_answer", fake_generate_answer)


@pytest.mark.asyncio
async def test_chat_matching_query_returns_answer_with_citations(client):
    token = register_and_login(client, "chatuser@example.com")
    headers = {"Authorization": f"Bearer {token}"}

    response = client.post(
        "/api/v1/chat",
        json={"query": "What's our leave policy?"},
        headers=headers,
    )

    assert response.status_code == 200
    data = response.json()
    assert data["flagged_for_review"] is False
    assert data["answer"]
    assert data["confidence"] > 0
    assert len(data["citations"]) == 1
    assert data["citations"][0]["document_title"] == "Employee_Handbook.pdf"
    assert data["citations"][0]["document_id"] == "doc-public-1"
    assert data.get("conversation_id")

    # allowed_roles must be derived from the authenticated user, not omitted/None
    assert captured_search_calls[-1]["allowed_roles"] == ["employee"]


@pytest.mark.asyncio
async def test_chat_echoes_provided_conversation_id(client):
    token = register_and_login(client, "convo@example.com")
    headers = {"Authorization": f"Bearer {token}"}

    response = client.post(
        "/api/v1/chat",
        json={"query": "leave policy", "conversation_id": "my-convo-123"},
        headers=headers,
    )
    assert response.status_code == 200
    assert response.json()["conversation_id"] == "my-convo-123"


@pytest.mark.asyncio
async def test_chat_no_match_returns_fallback_and_flags_for_review(client, db_session):
    token = register_and_login(client, "nomatch@example.com")
    headers = {"Authorization": f"Bearer {token}"}

    response = client.post(
        "/api/v1/chat",
        json={"query": "how do black holes evaporate"},
        headers=headers,
    )

    assert response.status_code == 200
    data = response.json()
    assert data["flagged_for_review"] is True
    assert data["answer"] == "I couldn't find this in company documents — I've flagged it for review."
    assert data["citations"] == []
    assert data["confidence"] == 0.0

    stmt = select(UnansweredQuery).where(
        UnansweredQuery.query_text == "how do black holes evaporate"
    )
    row = (await db_session.execute(stmt)).scalars().first()
    assert row is not None
    assert row.status == "pending"


@pytest.mark.asyncio
async def test_chat_unauthenticated_returns_401(client):
    response = client.post("/api/v1/chat", json={"query": "What's our leave policy?"})
    assert response.status_code == 401


@pytest.mark.asyncio
async def test_chat_blocks_restricted_document_for_unauthorized_role(client):
    """An employee asking about HR-restricted content must not see it anywhere."""
    token = register_and_login(client, "employee2@example.com")
    headers = {"Authorization": f"Bearer {token}"}

    response = client.post(
        "/api/v1/chat",
        json={"query": "what are the HR salary bands?"},
        headers=headers,
    )

    assert response.status_code == 200
    data = response.json()

    # No accessible match for this role -> fallback, not a fabricated/leaked answer
    assert data["flagged_for_review"] is True
    assert data["citations"] == []
    assert "HR_Salary_Bands" not in data["answer"]
    assert "L1 to L6" not in data["answer"]

    assert captured_search_calls[-1]["allowed_roles"] == ["employee"]


@pytest.mark.asyncio
async def test_chat_allows_restricted_document_for_authorized_role(client, db_session):
    """The same query, asked by an hr-role user, must surface the restricted doc."""
    import uuid

    from app.core.security import get_password_hash
    from app.models.user import User

    hr_user = User(
        id=str(uuid.uuid4()),
        email="hruser@example.com",
        full_name="HR User",
        hashed_password=get_password_hash("securepassword"),
        is_active=True,
        is_superuser=False,
        role="hr",
        token_version=0,
    )
    db_session.add(hr_user)
    await db_session.commit()

    login_resp = client.post(
        "/api/v1/auth/login", data={"username": "hruser@example.com", "password": "securepassword"}
    )
    token = login_resp.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    response = client.post(
        "/api/v1/chat",
        json={"query": "what are the HR salary bands?"},
        headers=headers,
    )

    assert response.status_code == 200
    data = response.json()
    assert data["flagged_for_review"] is False
    assert any(c["document_title"] == "HR_Salary_Bands.pdf" for c in data["citations"])

    assert captured_search_calls[-1]["allowed_roles"] == ["hr"]


@pytest.mark.asyncio
async def test_chat_rate_limit_returns_429(client):
    from app.core.config import settings

    token = register_and_login(client, "ratelimited@example.com")
    headers = {"Authorization": f"Bearer {token}"}

    limit = int(settings.CHAT_RATE_LIMIT.split("/")[0])
    statuses = []
    for _ in range(limit + 3):
        resp = client.post(
            "/api/v1/chat",
            json={"query": "leave policy"},
            headers=headers,
        )
        statuses.append(resp.status_code)

    assert statuses.count(200) == limit
    assert statuses.count(429) == 3
    assert statuses[-1] == 429
