"""Shared fake retrieval index for tests that can't hit a real pgvector DB.

`retrieval_service.semantic_search()` runs a raw pgvector `<=>` cosine-distance
query, which has no equivalent in SQLite (verified: SQLite raises a syntax
error on `<=>`) — and this test suite runs against an in-memory SQLite DB
(see conftest.py), with no Postgres/pgvector available in this environment.
So tests that need retrieval behavior monkeypatch `semantic_search` with the
fake below, which reproduces its real contract (role-based filtering via
`allowed_roles`, distance-ordered results) using an in-memory fixture "index"
instead of a live pgvector query. This proves the *endpoint* correctly
derives and passes the user's role through to retrieval and correctly
handles what comes back — it does not exercise the real SQL WHERE-clause
execution, which needs a real Postgres instance to test.
"""
from app.services.retrieval_service import RetrievedChunk, RetrievedMeetingSummary

# A tiny fake document index: one unrestricted doc, one hr-restricted doc.
FAKE_INDEX = [
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
    for entry in FAKE_INDEX:
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


# A tiny fake meeting-summary index: one meeting owned by "organizer-1".
FAKE_MEETING_INDEX = [
    {
        "meeting_id": "meeting-1",
        "meeting_title": "Q3 Planning Sync",
        "summary_text": "The team agreed to push the launch date to October and assigned follow-ups.",
        "distance": 0.15,
        "organizer_user_id": "organizer-1",
        "keywords": ("launch", "planning", "roadmap"),
    },
]

captured_meeting_search_calls: list[dict] = []


async def fake_semantic_search_meetings(
    db, query, *, organizer_user_id=None, top_k=5, max_distance=0.45
):
    captured_meeting_search_calls.append(
        {"query": query, "organizer_user_id": organizer_user_id}
    )

    query_lower = query.lower()
    matches = []
    for entry in FAKE_MEETING_INDEX:
        if entry["distance"] >= max_distance:
            continue
        if not any(kw in query_lower for kw in entry["keywords"]):
            continue
        if organizer_user_id is not None and entry["organizer_user_id"] != organizer_user_id:
            continue
        matches.append(
            RetrievedMeetingSummary(
                meeting_id=entry["meeting_id"],
                meeting_title=entry["meeting_title"],
                summary_text=entry["summary_text"],
                distance=entry["distance"],
            )
        )

    matches.sort(key=lambda m: m.distance)
    return matches[:top_k]


def register_and_login(client, email: str, password: str = "securepassword", full_name: str = "Test"):
    client.post(
        "/api/v1/auth/register",
        json={"email": email, "password": password, "full_name": full_name},
    )
    login_resp = client.post("/api/v1/auth/login", data={"username": email, "password": password})
    return login_resp.json()["access_token"]
