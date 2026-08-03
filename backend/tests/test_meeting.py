"""Tests for POST /api/v1/meeting/summarize and the extraction service.

LLM calls and embedding calls are mocked (no live Ollama/Gemini in this
environment) — see tests/rag_fixtures.py for the same pattern used by chat/search.
"""
import pytest
from app.models.meeting import Meeting
from app.services.meeting_service import MeetingIntelligenceError, _extract_json_object
from sqlalchemy import select

from tests.rag_fixtures import register_and_login

SAMPLE_TRANSCRIPT = (
    "Alice: We need to decide on the Q3 launch date.\n"
    "Bob: Let's push it to October since the API isn't ready.\n"
    "Alice: Agreed. Bob, can you update the roadmap doc by Friday?\n"
    "Bob: Sure, I'll have it done."
)

VALID_LLM_JSON = """{
  "title": "Q3 Planning Sync",
  "summary": "The team agreed to push the Q3 launch to October due to API readiness.",
  "decisions": ["Push Q3 launch to October"],
  "action_items": [{"description": "Update roadmap doc", "assignee": "Bob", "due_date": "Friday"}]
}"""

FAKE_EMBEDDING = [0.01] * 768


async def fake_generate_completion(prompt: str) -> str:
    return VALID_LLM_JSON


async def fake_embed_text(text: str) -> list[float]:
    return FAKE_EMBEDDING


@pytest.fixture(autouse=True)
def _patch_llm_and_embedding(monkeypatch):
    monkeypatch.setattr("app.services.meeting_service.generate_completion", fake_generate_completion)
    monkeypatch.setattr("app.services.meeting_service.embed_text", fake_embed_text)


@pytest.mark.asyncio
async def test_meeting_summarize_returns_structured_extraction(client):
    token = register_and_login(client, "meeting1@example.com")
    headers = {"Authorization": f"Bearer {token}"}

    response = client.post(
        "/api/v1/meeting/summarize",
        json={"transcript": SAMPLE_TRANSCRIPT},
        headers=headers,
    )

    assert response.status_code == 200
    data = response.json()
    assert data["summary"] == "The team agreed to push the Q3 launch to October due to API readiness."
    assert len(data["decisions"]) == 1
    assert data["decisions"][0]["description"] == "Push Q3 launch to October"
    assert len(data["action_items"]) == 1
    action_item = data["action_items"][0]
    assert action_item["description"] == "Update roadmap doc"
    assert action_item["assignee"] == "Bob"
    assert action_item["due_date"] == "Friday"
    assert action_item["completed"] is False
    assert action_item.get("id")
    assert 0 < data["confidence"] <= 1


@pytest.mark.asyncio
async def test_meeting_summarize_unauthenticated_returns_401(client):
    response = client.post("/api/v1/meeting/summarize", json={"transcript": SAMPLE_TRANSCRIPT})
    assert response.status_code == 401


@pytest.mark.asyncio
async def test_meeting_summarize_missing_transcript_returns_422(client):
    token = register_and_login(client, "meeting2@example.com")
    headers = {"Authorization": f"Bearer {token}"}

    response = client.post("/api/v1/meeting/summarize", json={"transcript": ""}, headers=headers)
    assert response.status_code == 422


@pytest.mark.asyncio
async def test_meeting_summarize_bad_llm_output_returns_502(client, monkeypatch):
    async def broken_completion(prompt: str) -> str:
        return "Sorry, I can't help with that."  # no JSON object at all

    monkeypatch.setattr("app.services.meeting_service.generate_completion", broken_completion)

    token = register_and_login(client, "meeting3@example.com")
    headers = {"Authorization": f"Bearer {token}"}

    response = client.post(
        "/api/v1/meeting/summarize",
        json={"transcript": SAMPLE_TRANSCRIPT},
        headers=headers,
    )
    assert response.status_code == 502


@pytest.mark.asyncio
async def test_meeting_summarize_never_persists_raw_transcript(client, db_session):
    token = register_and_login(client, "meeting4@example.com")
    headers = {"Authorization": f"Bearer {token}"}

    response = client.post(
        "/api/v1/meeting/summarize",
        json={"transcript": SAMPLE_TRANSCRIPT},
        headers=headers,
    )
    assert response.status_code == 200

    stmt = select(Meeting).order_by(Meeting.created_at.desc())
    row = (await db_session.execute(stmt)).scalars().first()
    assert row is not None
    assert row.raw_transcript_ref is None
    assert row.title == "Q3 Planning Sync"


def test_extract_json_object_handles_markdown_fenced_response():
    raw = '```json\n{"summary": "ok", "decisions": [], "action_items": []}\n```'
    data = _extract_json_object(raw)
    assert data["summary"] == "ok"


def test_extract_json_object_raises_on_no_json():
    with pytest.raises(MeetingIntelligenceError):
        _extract_json_object("no json here at all")
