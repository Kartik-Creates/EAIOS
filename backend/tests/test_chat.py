"""Tests for POST /api/v1/chat.

`retrieval_service.semantic_search()` runs a raw pgvector `<=>` cosine-distance
query, which has no equivalent in SQLite (verified: SQLite raises a syntax
error on `<=>`) — and this test suite runs against an in-memory SQLite DB
(see conftest.py), with no Postgres/pgvector available in this environment.
So these tests monkeypatch `semantic_search` with a fake that reproduces its
real contract (role-based filtering via `allowed_roles`, distance-ordered
results) using an in-memory fixture "index" instead of a live pgvector query.
This proves the *endpoint* correctly derives and passes the user's role
through to retrieval and correctly handles what comes back — it does not
exercise the real SQL WHERE-clause execution, which needs a real Postgres
instance to test.
"""
import pytest
from app.models.unanswered_query import UnansweredQuery
from app.services.retrieval_service import RetrievedChunk
from sqlalchemy import select

# A tiny fake document index: one unrestricted doc, one hr-restricted doc.
_FAKE_INDEX = [
    {
        "chunk_id": "chunk-public-1",
        "document_id": "doc-public-1",
        "document_title": "Employee_Handbook.pdf",
        "content": "Employees are entitled to 20 days of paid leave per year.",
        "distance": 0.10,
        "restricted_role": None,
        "keywords": ("leave", "policy"),
    },
    {
        "chunk_id": "chunk-hr-1",
        "document_id": "doc-hr-1",
        "document_title": "HR_Salary_Bands.pdf",
        "content": "Confidential: HR salary bands range from L1 to L6.",
        "distance": 0.12,
        "restricted_role": "hr",
        "keywords": ("salary", "bands"),
    },
]

captured_search_calls: list[dict] = []


async def fake_semantic_search(db, query, *, allowed_roles=None, top_k=5, max_distance=0.45):
    captured_search_calls.append({"query": query, "allowed_roles": allowed_roles})

    query_lower = query.lower()
    matches = []
    for entry in _FAKE_INDEX:
        if entry["distance"] >= max_distance:
            continue
        if not any(kw in query_lower for kw in entry["keywords"]):
            continue
        if entry["restricted_role"] is not None and (
            allowed_roles is None or entry["restricted_role"] not in allowed_roles
        ):
            continue
        matches.append(
            RetrievedChunk(
                chunk_id=entry["chunk_id"],
                document_id=entry["document_id"],
                document_title=entry["document_title"],
                content=entry["content"],
                distance=entry["distance"],
            )
        )

    matches.sort(key=lambda c: c.distance)
    return matches[:top_k]


async def fake_generate_answer(query, chunks):
    sources = ", ".join(c.document_title for c in chunks)
    return f"Based on {sources}: here is the answer."


def _register_and_login(client, email: str, password: str = "securepassword", full_name: str = "Test"):
    client.post(
        "/api/v1/auth/register",
        json={"email": email, "password": password, "full_name": full_name},
    )
    login_resp = client.post(
        "/api/v1/auth/login", data={"username": email, "password": password}
    )
    return login_resp.json()["access_token"]


@pytest.fixture(autouse=True)
def _patch_pipeline(monkeypatch):
    captured_search_calls.clear()
    monkeypatch.setattr("app.routers.chat.semantic_search", fake_semantic_search)
    monkeypatch.setattr("app.routers.chat.generate_answer", fake_generate_answer)


@pytest.mark.asyncio
async def test_chat_matching_query_returns_answer_with_citations(client):
    token = _register_and_login(client, "chatuser@example.com")
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
    token = _register_and_login(client, "convo@example.com")
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
    token = _register_and_login(client, "nomatch@example.com")
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
    token = _register_and_login(client, "employee2@example.com")
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

    token = _register_and_login(client, "ratelimited@example.com")
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
