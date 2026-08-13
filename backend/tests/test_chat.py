"""Tests for POST /api/v1/chat — greeting heuristic, tool-calling, and RAG retrieval.

See tests/rag_fixtures.py for why retrieval is faked instead of hitting a
real pgvector query in this test suite.
"""
import uuid
import pytest
from app.core.security import encrypt_token, get_password_hash
from app.models.oauth_token import OAuthToken
from app.models.unanswered_query import UnansweredQuery
from app.models.user import User
from app.schemas.briefing import BriefingItem, SourceResult
from sqlalchemy import select

from tests.rag_fixtures import (
    captured_search_calls,
    fake_generate_answer,
    fake_semantic_search,
    register_and_login,
)


async def fake_generate_greeting(query: str) -> str:
    return "Hello! How can I help you today?"


async def fake_generate_tool_response(query: str, tool_data: str) -> str:
    return f"Here is your answer based on tool data:\n{tool_data}"


async def fake_generate_with_tools(query: str, tool_schemas: list[dict]):
    q_lower = query.lower()
    if any(k in q_lower for k in ["email", "inbox", "gmail"]):
        return [{"name": "get_gmail_briefing", "args": {"query": query}}]
    if any(k in q_lower for k in ["github", "commit", "pr", "pull request"]):
        return [{"name": "get_github_briefing", "args": {"query": query}}]
    if any(k in q_lower for k in ["jira", "ticket", "issue"]):
        return [{"name": "get_jira_briefing", "args": {"query": query}}]
    if any(k in q_lower for k in ["calendar", "schedule"]):
        return [{"name": "get_calendar_briefing", "args": {"query": query}}]
    # For documents / policies / general questions, return None so it falls through to RAG
    return None


@pytest.fixture(autouse=True)
def _patch_pipeline(monkeypatch):
    captured_search_calls.clear()
    monkeypatch.setattr("app.routers.chat.semantic_search", fake_semantic_search)
    monkeypatch.setattr("app.routers.chat.generate_answer", fake_generate_answer)
    monkeypatch.setattr("app.routers.chat.generate_greeting", fake_generate_greeting)
    monkeypatch.setattr("app.routers.chat.generate_with_tools", fake_generate_with_tools)
    monkeypatch.setattr("app.routers.chat.generate_tool_response", fake_generate_tool_response)


# ── 1. GREETING HEURISTIC TESTS ─────────────────────────────────────


@pytest.mark.asyncio
async def test_chat_greeting_heuristic_returns_warm_reply(client, db_session):
    token = register_and_login(client, "greetinguser@example.com")
    headers = {"Authorization": f"Bearer {token}"}

    greetings = ["Hi", "Hello!", "Good morning", "thanks", "bye"]
    for g in greetings:
        response = client.post("/api/v1/chat", json={"query": g}, headers=headers)
        assert response.status_code == 200
        data = response.json()
        assert data["flagged_for_review"] is False
        assert data["source"] == "none"
        assert data["citations"] == []
        assert len(data["answer"]) > 0

    # Ensure NO unanswered queries were logged for greetings
    stmt = select(UnansweredQuery)
    rows = (await db_session.execute(stmt)).scalars().all()
    assert len(rows) == 0


# ── 2. TOOL-CALLING TESTS ───────────────────────────────────────────


@pytest.mark.asyncio
async def test_chat_routes_to_gmail_briefing(client, monkeypatch, db_session):
    async def mock_get_gmail_briefing(db, user):
        return SourceResult(
            source="gmail",
            connected=True,
            items=[
                BriefingItem(
                    source="gmail",
                    title="Q3 Strategy Update",
                    detail="From: ceo@company.com | Please review the attached slide deck",
                    priority_hint="today",
                    url="https://mail.google.com/mail/u/0/#inbox/msg123",
                )
            ],
        )

    monkeypatch.setattr("app.services.chat_tools.get_gmail_briefing", mock_get_gmail_briefing)

    token = register_and_login(client, "gmailuser@example.com")
    headers = {"Authorization": f"Bearer {token}"}

    response = client.post(
        "/api/v1/chat",
        json={"query": "What's my latest email?"},
        headers=headers,
    )
    assert response.status_code == 200
    data = response.json()
    assert data["source"] == "gmail"
    assert data["flagged_for_review"] is False
    assert "Q3 Strategy Update" in data["answer"] or "ceo@company.com" in data["answer"]

    # Ensure not logged to unanswered queries
    stmt = select(UnansweredQuery)
    rows = (await db_session.execute(stmt)).scalars().all()
    assert len(rows) == 0


@pytest.mark.asyncio
async def test_chat_routes_to_github_briefing(client, monkeypatch, db_session):
    async def mock_get_github_briefing(db, user):
        return SourceResult(
            source="github",
            connected=True,
            items=[
                BriefingItem(
                    source="github",
                    title="[backend] Fix memory leak in auth middleware",
                    detail="Repo: backend | PR open 1d",
                    priority_hint="today",
                    url="https://github.com/org/backend/pull/42",
                )
            ],
        )

    monkeypatch.setattr("app.services.chat_tools.get_github_briefing", mock_get_github_briefing)

    token = register_and_login(client, "githubuser@example.com")
    headers = {"Authorization": f"Bearer {token}"}

    response = client.post(
        "/api/v1/chat",
        json={"query": "What's my most recent GitHub commit?"},
        headers=headers,
    )
    assert response.status_code == 200
    data = response.json()
    assert data["source"] == "github"
    assert data["flagged_for_review"] is False
    assert "[backend] Fix memory leak in auth middleware" in data["answer"]


@pytest.mark.asyncio
async def test_chat_routes_to_jira_briefing(client, monkeypatch, db_session):
    async def mock_get_jira_briefing(db, user):
        return SourceResult(
            source="jira",
            connected=True,
            items=[
                BriefingItem(
                    source="jira",
                    title="[PROJ-101] Fix database deadlocks",
                    detail="Status: In Progress | Due: 2026-08-15",
                    priority_hint="overdue",
                    url="https://jira.atlassian.com/browse/PROJ-101",
                )
            ],
        )

    monkeypatch.setattr("app.services.chat_tools.get_jira_briefing", mock_get_jira_briefing)

    token = register_and_login(client, "jirauser@example.com")
    headers = {"Authorization": f"Bearer {token}"}

    response = client.post(
        "/api/v1/chat",
        json={"query": "What's my most urgent Jira ticket?"},
        headers=headers,
    )
    assert response.status_code == 200
    data = response.json()
    assert data["source"] == "jira"
    assert data["flagged_for_review"] is False
    assert "PROJ-101" in data["answer"]


@pytest.mark.asyncio
async def test_chat_disconnected_integration_guidance(client, monkeypatch, db_session):
    """When a provider is not connected, chat tells the user clearly without flagging for review."""
    async def mock_get_gmail_disconnected(db, user):
        return SourceResult(source="gmail", connected=False, items=[])

    monkeypatch.setattr("app.services.chat_tools.get_gmail_briefing", mock_get_gmail_disconnected)

    token = register_and_login(client, "disconnecteduser@example.com")
    headers = {"Authorization": f"Bearer {token}"}

    response = client.post(
        "/api/v1/chat",
        json={"query": "What's my latest email?"},
        headers=headers,
    )
    assert response.status_code == 200
    data = response.json()
    assert data["source"] == "gmail"
    assert data["flagged_for_review"] is False
    assert "not connected" in data["answer"].lower() or "connect" in data["answer"].lower()

    # Not logged to unanswered_queries
    stmt = select(UnansweredQuery)
    rows = (await db_session.execute(stmt)).scalars().all()
    assert len(rows) == 0


@pytest.mark.asyncio
async def test_chat_cross_user_token_isolation(client, db_session):
    """User B asking about emails must NOT access User A's Gmail token."""
    user_a = User(
        id=str(uuid.uuid4()),
        email="user_a_gmail@example.com",
        full_name="User A",
        hashed_password=get_password_hash("securepassword"),
        is_active=True,
        is_superuser=False,
        role="employee",
        token_version=0,
    )
    user_b = User(
        id=str(uuid.uuid4()),
        email="user_b_gmail@example.com",
        full_name="User B",
        hashed_password=get_password_hash("securepassword"),
        is_active=True,
        is_superuser=False,
        role="employee",
        token_version=0,
    )
    db_session.add_all([user_a, user_b])
    await db_session.commit()

    # Add OAuth token strictly for User A
    tok_a = OAuthToken(
        user_id=user_a.id,
        provider="gmail",
        access_token_encrypted=encrypt_token("mock-token-user-a"),
        scopes="read",
    )
    db_session.add(tok_a)
    await db_session.commit()

    # Login as User B (who has NO tokens)
    login_b = client.post("/api/v1/auth/login", data={"username": "user_b_gmail@example.com", "password": "securepassword"})
    token_b = login_b.json()["access_token"]
    headers_b = {"Authorization": f"Bearer {token_b}"}

    response = client.post(
        "/api/v1/chat",
        json={"query": "What's my latest email?"},
        headers=headers_b,
    )
    assert response.status_code == 200
    data = response.json()
    # User B should see that their Gmail is not connected
    assert "not connected" in data["answer"].lower() or "connect" in data["answer"].lower()


# ── 3. RAG REGRESSION TESTS ─────────────────────────────────────────


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
    assert data["source"] == "documents"
    assert data["flagged_for_review"] is False
    assert data["answer"]
    assert data["confidence"] > 0
    assert len(data["citations"]) == 1
    assert data["citations"][0]["document_title"] == "Employee_Handbook.pdf"
    assert data["citations"][0]["document_id"] == "doc-public-1"
    assert data.get("conversation_id")

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
    assert data["source"] == "documents"
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
    token = register_and_login(client, "employee2@example.com")
    headers = {"Authorization": f"Bearer {token}"}

    response = client.post(
        "/api/v1/chat",
        json={"query": "what are the HR salary bands?"},
        headers=headers,
    )

    assert response.status_code == 200
    data = response.json()
    assert data["flagged_for_review"] is True
    assert data["citations"] == []
    assert "HR_Salary_Bands" not in data["answer"]
    assert "L1 to L6" not in data["answer"]

    assert captured_search_calls[-1]["allowed_roles"] == ["employee"]


@pytest.mark.asyncio
async def test_chat_allows_restricted_document_for_authorized_role(client, db_session):
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
