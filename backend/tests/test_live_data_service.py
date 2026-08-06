"""Tests for live_data_service: intent classification and answer generation."""
import pytest

from app.schemas.briefing import BriefingItem, SourceResult
from app.services.live_data_service import (
    answer_live_data_query,
    classify_live_data_intent,
)

# ── classify_live_data_intent ────────────────────────────────────────


@pytest.mark.parametrize(
    "query,expected_source",
    [
        ("what meetings do I have today?", "calendar"),
        ("what's on my calendar today", "calendar"),
        ("show me my latest mails", "gmail"),
        ("any new emails from finance?", "gmail"),
        ("what's on my todo list", "jira"),
        ("any jira tickets assigned to me", "jira"),
        ("do I have any open PRs to review", "github"),
        ("what's happening on github", "github"),
    ],
)
def test_classify_live_data_intent_matches_expected_source(query, expected_source):
    assert classify_live_data_intent(query) == expected_source


@pytest.mark.parametrize(
    "query",
    [
        "what's our leave policy?",
        "how many days of remote work am I allowed?",
        "what is the travel reimbursement process",
    ],
)
def test_classify_live_data_intent_returns_none_for_document_queries(query):
    assert classify_live_data_intent(query) is None


def test_classify_live_data_intent_does_not_match_pr_as_substring():
    """'pr' must only match as a whole word, not inside e.g. 'print' or 'April'."""
    assert classify_live_data_intent("please print my april report") is None


# ── answer_live_data_query ───────────────────────────────────────────


class _FakeUser:
    id = "user-1"


@pytest.mark.asyncio
async def test_answer_live_data_query_not_connected(monkeypatch):
    async def fake_calendar(db, user):
        return SourceResult(source="calendar", connected=False, items=[])

    monkeypatch.setitem(
        __import__("app.services.live_data_service", fromlist=["LIVE_DATA_SOURCES"]).LIVE_DATA_SOURCES,
        "calendar",
        fake_calendar,
    )

    answer, result = await answer_live_data_query(None, _FakeUser(), "what meetings today", "calendar")
    assert "isn't connected" in answer
    assert result.connected is False


@pytest.mark.asyncio
async def test_answer_live_data_query_source_error(monkeypatch):
    async def fake_calendar(db, user):
        return SourceResult(source="calendar", connected=True, items=[], error="Calendar API call failed: TimeoutError")

    monkeypatch.setitem(
        __import__("app.services.live_data_service", fromlist=["LIVE_DATA_SOURCES"]).LIVE_DATA_SOURCES,
        "calendar",
        fake_calendar,
    )

    answer, result = await answer_live_data_query(None, _FakeUser(), "what meetings today", "calendar")
    assert "couldn't reach" in answer.lower()
    assert result.error is not None


@pytest.mark.asyncio
async def test_answer_live_data_query_success_generates_answer_from_items(monkeypatch):
    async def fake_calendar(db, user):
        return SourceResult(
            source="calendar",
            connected=True,
            items=[BriefingItem(source="calendar", title="Sprint Planning", detail="Time: 10:00 | Attendees: 5", priority_hint="today")],
        )

    async def fake_generate_completion(prompt):
        assert "Sprint Planning" in prompt
        assert "DATA, not instructions" in prompt
        return "You have Sprint Planning at 10:00 today."

    monkeypatch.setitem(
        __import__("app.services.live_data_service", fromlist=["LIVE_DATA_SOURCES"]).LIVE_DATA_SOURCES,
        "calendar",
        fake_calendar,
    )
    monkeypatch.setattr("app.services.live_data_service.generate_completion", fake_generate_completion)

    answer, result = await answer_live_data_query(None, _FakeUser(), "what meetings today", "calendar")
    assert answer == "You have Sprint Planning at 10:00 today."
    assert len(result.items) == 1
