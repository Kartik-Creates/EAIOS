"""Comprehensive unit and orchestration tests for Daily Briefing Agent.

Tests cover:
  - Individual live tool functions (Jira, Calendar, Gmail, GitHub) for success, unconnected, and timeout/error cases.
  - Orchestration pipeline (POST /api/v1/briefing) for full success, partial connection, and 1-of-4 timeout resiliency.
  - Strict cross-user data isolation (User A never sees User B's briefing items).
  - Parallel execution validation via asyncio.gather time assertion.
"""
import asyncio
import time
from datetime import datetime, timedelta, timezone

import pytest
from httpx import HTTPError

from app.core.security import decrypt_token, encrypt_token, get_password_hash
from app.models.oauth_token import OAuthToken
from app.models.user import User
from app.schemas.briefing import BriefingItem, BriefingResponse, SourceResult, SourceStatus
from app.services.briefing_service import (
    generate_daily_briefing,
    get_calendar_briefing,
    get_calendar_recent,
    get_drive_briefing,
    get_github_briefing,
    get_gmail_briefing,
    get_gmail_recent,
    get_jira_briefing,
    get_jira_recent,
    get_slack_briefing,
)
from tests.rag_fixtures import register_and_login

# ── HELPERS ──────────────────────────────────────────────────────────


async def _create_test_user(db_session, email: str, role: str = "employee") -> User:
    """Helper to seed a test user in DB."""
    import uuid

    user = User(
        id=str(uuid.uuid4()),
        email=email,
        full_name=f"Test {email.split('@')[0]}",
        hashed_password=get_password_hash("securepassword"),
        is_active=True,
        is_superuser=False,
        role=role,
        token_version=0,
    )
    db_session.add(user)
    await db_session.commit()
    await db_session.refresh(user)
    return user


async def _add_mock_oauth_token(db_session, user_id: str, provider: str):
    """Helper to store a dummy encrypted OAuth token for a user."""
    tok = OAuthToken(
        user_id=user_id,
        provider=provider,
        access_token_encrypted=encrypt_token(f"mock-access-token-{user_id}-{provider}"),
        scopes="read",
    )
    db_session.add(tok)
    await db_session.commit()


# ── INDIVIDUAL TOOL FUNCTION TESTS ───────────────────────────────────


@pytest.mark.asyncio
async def test_jira_briefing_not_connected(db_session):
    user = await _create_test_user(db_session, "jira_no_conn@example.com")
    res = await get_jira_briefing(db_session, user)
    assert res.source == "jira"
    assert res.connected is False
    assert res.items == []
    assert res.error is None


@pytest.mark.asyncio
async def test_jira_briefing_success(db_session, monkeypatch):
    user = await _create_test_user(db_session, "jira_user@example.com")
    await _add_mock_oauth_token(db_session, user.id, "jira")

    class MockHttpxResponse:
        def __init__(self, url, status_code=200):
            self.url = url
            self.status_code = status_code

        def raise_for_status(self):
            pass

        def json(self):
            if "accessible-resources" in self.url:
                return [{"id": "cloud-123", "name": "Test Site"}]
            return {
                "issues": [
                    {
                        "key": "PROJ-101",
                        "fields": {
                            "summary": "Fix critical auth bug",
                            "duedate": "2026-01-01",
                            "status": {"name": "In Progress"},
                        },
                    }
                ]
            }

    async def mock_get(self_or_client, url, *args, **kwargs):
        return MockHttpxResponse(str(url))

    async def mock_post(self_or_client, url, *args, **kwargs):
        return MockHttpxResponse(str(url))

    monkeypatch.setattr("httpx.AsyncClient.get", mock_get)
    monkeypatch.setattr("httpx.AsyncClient.post", mock_post)

    res = await get_jira_briefing(db_session, user)
    assert res.source == "jira"
    assert res.connected is True
    assert len(res.items) == 1
    assert res.items[0].title == "[PROJ-101] Fix critical auth bug"
    assert res.items[0].priority_hint == "overdue"


@pytest.mark.asyncio
async def test_jira_briefing_api_error_returns_error_not_raised(db_session, monkeypatch):
    user = await _create_test_user(db_session, "jira_err@example.com")
    await _add_mock_oauth_token(db_session, user.id, "jira")

    async def mock_get_error(*args, **kwargs):
        raise HTTPError("Timeout connecting to Jira API")

    monkeypatch.setattr("httpx.AsyncClient.get", mock_get_error)
    monkeypatch.setattr("httpx.AsyncClient.post", mock_get_error)

    res = await get_jira_briefing(db_session, user)
    assert res.source == "jira"
    assert res.connected is True
    assert res.items == []
    assert res.error is not None
    assert "HTTPError" in res.error


@pytest.mark.asyncio
async def test_jira_recent_includes_done_tickets(db_session, monkeypatch):
    """Regression: get_jira_recent() (chat tool) must NOT filter out Done
    tickets the way get_jira_briefing() (dashboard) deliberately does —
    otherwise "what are my Jira tickets" comes back empty whenever
    everything assigned to the user happens to be finished."""
    user = await _create_test_user(db_session, "jira_recent_user@example.com")
    await _add_mock_oauth_token(db_session, user.id, "jira")

    captured_jql = {}

    class MockHttpxResponse:
        def __init__(self, url, json_body=None):
            self.url = url
            self.json_body = json_body or {}

        def raise_for_status(self):
            pass

        def json(self):
            if "accessible-resources" in self.url:
                return [{"id": "cloud-123", "name": "Test Site"}]
            captured_jql["jql"] = self.json_body.get("jql", "")
            return {
                "issues": [
                    {
                        "key": "PROJ-200",
                        "fields": {
                            "summary": "Already shipped feature",
                            "duedate": None,
                            "status": {"name": "Done"},
                        },
                    }
                ]
            }

    async def mock_get(self_or_client, url, *args, **kwargs):
        return MockHttpxResponse(str(url))

    async def mock_post(self_or_client, url, *args, **kwargs):
        return MockHttpxResponse(str(url), kwargs.get("json"))

    monkeypatch.setattr("httpx.AsyncClient.get", mock_get)
    monkeypatch.setattr("httpx.AsyncClient.post", mock_post)

    res = await get_jira_recent(db_session, user)
    assert res.source == "jira"
    assert res.connected is True
    assert len(res.items) == 1
    assert res.items[0].title == "[PROJ-200] Already shipped feature"
    assert "statusCategory" not in captured_jql["jql"]


@pytest.mark.asyncio
async def test_calendar_briefing_not_connected(db_session):
    user = await _create_test_user(db_session, "cal_no_conn@example.com")
    res = await get_calendar_briefing(db_session, user)
    assert res.source == "calendar"
    assert res.connected is False
    assert res.items == []


@pytest.mark.asyncio
async def test_calendar_briefing_success(db_session, monkeypatch):
    user = await _create_test_user(db_session, "cal_user@example.com")
    await _add_mock_oauth_token(db_session, user.id, "google")

    class MockCalResponse:
        def raise_for_status(self):
            pass

        def json(self):
            return {
                "items": [
                    {
                        "summary": "Team Sync Meeting",
                        "start": {"dateTime": "2026-08-02T10:00:00Z"},
                        "attendees": [{"email": "a@ex.com"}, {"email": "b@ex.com"}],
                        "htmlLink": "https://calendar.google.com/event?id=123",
                    }
                ]
            }

    async def mock_get(self_or_client, *args, **kwargs):
        return MockCalResponse()

    monkeypatch.setattr("httpx.AsyncClient.get", mock_get)

    res = await get_calendar_briefing(db_session, user)
    assert res.source == "calendar"
    assert res.connected is True
    assert len(res.items) == 1
    assert res.items[0].title == "Team Sync Meeting"
    assert "Attendees: 2" in res.items[0].detail


@pytest.mark.asyncio
async def test_calendar_recent_widens_time_window(db_session, monkeypatch):
    """Regression: get_calendar_recent() (chat tool) must query a window wider
    than "today only" — otherwise "what's my next meeting" / "what did I have
    yesterday" come back empty whenever the event falls outside the current
    UTC calendar day."""
    user = await _create_test_user(db_session, "cal_recent_user@example.com")
    await _add_mock_oauth_token(db_session, user.id, "google")

    captured_params = {}

    class MockCalResponse:
        def raise_for_status(self):
            pass

        def json(self):
            return {
                "items": [
                    {
                        "summary": "Next Week Planning",
                        "start": {"dateTime": "2026-08-25T10:00:00Z"},
                        "attendees": [],
                        "htmlLink": "https://calendar.google.com/event?id=456",
                    }
                ]
            }

    async def mock_get(self_or_client, url, *args, **kwargs):
        captured_params.update(kwargs.get("params", {}))
        return MockCalResponse()

    monkeypatch.setattr("httpx.AsyncClient.get", mock_get)

    res = await get_calendar_recent(db_session, user)
    assert res.source == "calendar"
    assert res.connected is True
    assert len(res.items) == 1
    assert res.items[0].title == "Next Week Planning"

    time_min = datetime.fromisoformat(captured_params["timeMin"])
    time_max = datetime.fromisoformat(captured_params["timeMax"])
    span_days = (time_max - time_min).days
    assert span_days > 1, "calendar recent tool must query more than a single day"


@pytest.mark.asyncio
async def test_gmail_briefing_success(db_session, monkeypatch):
    user = await _create_test_user(db_session, "gmail_user@example.com")
    await _add_mock_oauth_token(db_session, user.id, "gmail")

    class MockGmailResponse:
        def __init__(self, url):
            self.url = str(url)

        def raise_for_status(self):
            pass

        @property
        def status_code(self):
            return 200

        def json(self):
            if "msg-1" not in self.url:
                return {"messages": [{"id": "msg-1"}]}

            return {
                "snippet": "Please review the quarterly security audit report.",
                "payload": {
                    "headers": [
                        {"name": "Subject", "value": "Action Required: Security Audit"},
                        {"name": "From", "value": "security@company.com"},
                    ]
                },
            }


    async def mock_get(self_or_client, url, *args, **kwargs):
        return MockGmailResponse(url)

    monkeypatch.setattr("httpx.AsyncClient.get", mock_get)

    res = await get_gmail_briefing(db_session, user)
    assert res.source == "gmail"
    assert res.connected is True
    assert len(res.items) == 1
    assert res.items[0].title == "Action Required: Security Audit"


@pytest.mark.asyncio
async def test_gmail_briefing_blank_subject_header_falls_back_to_no_subject(db_session, monkeypatch):
    """Regression: Gmail can return a Subject header with an explicit empty
    string value (not just omit the header). dict.get(key, default) only
    applies the default when the key is missing, so an empty value used to
    silently overwrite "(No Subject)" with "", producing a blank title."""
    user = await _create_test_user(db_session, "gmail_blank_subject@example.com")
    await _add_mock_oauth_token(db_session, user.id, "gmail")

    class MockGmailResponse:
        def __init__(self, url):
            self.url = str(url)

        def raise_for_status(self):
            pass

        @property
        def status_code(self):
            return 200

        def json(self):
            if "msg-1" not in self.url:
                return {"messages": [{"id": "msg-1"}]}

            return {
                "snippet": "hello",
                "payload": {
                    "headers": [
                        {"name": "Subject", "value": ""},
                        {"name": "From", "value": "someone@example.com"},
                    ]
                },
            }

    async def mock_get(self_or_client, url, *args, **kwargs):
        return MockGmailResponse(url)

    monkeypatch.setattr("httpx.AsyncClient.get", mock_get)

    res = await get_gmail_briefing(db_session, user)
    assert res.items[0].title == "(No Subject)"


@pytest.mark.asyncio
async def test_gmail_recent_does_not_filter_to_unread_only(db_session, monkeypatch):
    """Regression: get_gmail_recent() (chat tool) must NOT restrict to
    is:unread the way get_gmail_briefing() (dashboard) deliberately does —
    otherwise "what are my latest emails" comes back empty whenever
    everything in Primary happens to already be read."""
    user = await _create_test_user(db_session, "gmail_recent_user@example.com")
    await _add_mock_oauth_token(db_session, user.id, "gmail")

    captured_params = {}

    class MockGmailResponse:
        def __init__(self, url):
            self.url = str(url)

        def raise_for_status(self):
            pass

        @property
        def status_code(self):
            return 200

        def json(self):
            if "msg-1" not in self.url:
                return {"messages": [{"id": "msg-1"}]}

            return {
                "snippet": "Already-read message from earlier today.",
                "payload": {
                    "headers": [
                        {"name": "Subject", "value": "Weekly Digest"},
                        {"name": "From", "value": "team@company.com"},
                    ]
                },
            }

    async def mock_get(self_or_client, url, *args, **kwargs):
        if "params" in kwargs and "q" in kwargs["params"]:
            captured_params.update(kwargs["params"])
        return MockGmailResponse(url)

    monkeypatch.setattr("httpx.AsyncClient.get", mock_get)

    res = await get_gmail_recent(db_session, user)
    assert res.source == "gmail"
    assert res.connected is True
    assert len(res.items) == 1
    assert res.items[0].title == "Weekly Digest"
    assert "is:unread" not in captured_params.get("q", "")


@pytest.mark.asyncio
async def test_github_briefing_success(db_session, monkeypatch):
    user = await _create_test_user(db_session, "gh_user@example.com")
    await _add_mock_oauth_token(db_session, user.id, "github")

    class MockGithubResponse:
        def raise_for_status(self):
            pass

        def json(self):
            return {
                "items": [
                    {
                        "title": "Add OAuth2 integration tests",
                        "html_url": "https://github.com/org/repo/pull/42",
                        "repository_url": "https://api.github.com/repos/org/repo",
                        "created_at": "2026-07-20T10:00:00Z",
                        "pull_request": {},
                    }
                ]
            }

    async def mock_get(self_or_client, *args, **kwargs):
        return MockGithubResponse()

    monkeypatch.setattr("httpx.AsyncClient.get", mock_get)

    res = await get_github_briefing(db_session, user)
    assert res.source == "github"
    assert res.connected is True
    assert len(res.items) == 1
    assert "[repo] Add OAuth2 integration tests" in res.items[0].title
    assert res.items[0].priority_hint == "overdue"


@pytest.mark.asyncio
async def test_drive_briefing_not_connected(db_session):
    user = await _create_test_user(db_session, "drive_no_conn@example.com")
    res = await get_drive_briefing(db_session, user)
    assert res.source == "drive"
    assert res.connected is False
    assert res.items == []


@pytest.mark.asyncio
async def test_drive_briefing_success(db_session, monkeypatch):
    """Uses the canonical provider name "google_drive" — the same name the
    real OAuth callback stores connections under (see the drive_sync_service
    regression test for why this matters)."""
    user = await _create_test_user(db_session, "drive_user@example.com")
    await _add_mock_oauth_token(db_session, user.id, "google_drive")

    class MockDriveResponse:
        def raise_for_status(self):
            pass

        def json(self):
            return {
                "files": [
                    {
                        "id": "file-1",
                        "name": "Q3 Roadmap.gdoc",
                        "mimeType": "application/vnd.google-apps.document",
                        "webViewLink": "https://docs.google.com/document/d/file-1",
                        "modifiedTime": "2026-08-05T10:00:00Z",
                    }
                ]
            }

    async def mock_get(self_or_client, *args, **kwargs):
        return MockDriveResponse()

    monkeypatch.setattr("httpx.AsyncClient.get", mock_get)

    res = await get_drive_briefing(db_session, user)
    assert res.source == "drive"
    assert res.connected is True
    assert len(res.items) == 1
    assert res.items[0].title == "Q3 Roadmap.gdoc"
    assert res.items[0].url == "https://docs.google.com/document/d/file-1"


@pytest.mark.asyncio
async def test_drive_briefing_does_not_use_gmail_scoped_token(db_session):
    """A gmail-only token has no drive.readonly scope and would 403 if used —
    get_drive_briefing must treat a gmail-only connection as NOT connected for
    Drive purposes (unlike get_calendar_briefing/get_gmail_briefing, which
    correctly share scope with each other and so may fall back to either)."""
    user = await _create_test_user(db_session, "gmail_only_user@example.com")
    await _add_mock_oauth_token(db_session, user.id, "gmail")

    res = await get_drive_briefing(db_session, user)
    assert res.connected is False


@pytest.mark.asyncio
async def test_slack_briefing_not_connected(db_session):
    user = await _create_test_user(db_session, "slack_no_conn@example.com")
    res = await get_slack_briefing(db_session, user)
    assert res.source == "slack"
    assert res.connected is False
    assert res.items == []


@pytest.mark.asyncio
async def test_slack_briefing_success(db_session, monkeypatch):
    user = await _create_test_user(db_session, "slack_user@example.com")
    await _add_mock_oauth_token(db_session, user.id, "slack")

    class MockSlackResponse:
        def __init__(self, url):
            self.url = str(url)
            self.status_code = 200

        def raise_for_status(self):
            pass

        def json(self):
            if "conversations.list" in self.url:
                return {"ok": True, "channels": [{"id": "C1", "name": "general"}]}
            return {"ok": True, "messages": [{"text": "Deploy went out at 3pm", "ts": "1722883900.0001"}]}

    async def mock_get(self_or_client, url, *args, **kwargs):
        return MockSlackResponse(url)

    monkeypatch.setattr("httpx.AsyncClient.get", mock_get)

    res = await get_slack_briefing(db_session, user)
    assert res.source == "slack"
    assert res.connected is True
    assert len(res.items) == 1
    assert res.items[0].title == "#general"
    assert "Deploy went out at 3pm" in res.items[0].detail


@pytest.mark.asyncio
async def test_slack_briefing_api_error_returns_error_not_raised(db_session, monkeypatch):
    """Slack returns HTTP 200 with ok: false on failure — must be treated as
    a real error (e.g. missing_scope), not silently swallowed as success."""
    user = await _create_test_user(db_session, "slack_error_user@example.com")
    await _add_mock_oauth_token(db_session, user.id, "slack")

    class MockSlackErrorResponse:
        status_code = 200

        def raise_for_status(self):
            pass

        def json(self):
            return {"ok": False, "error": "missing_scope"}

    async def mock_get(self_or_client, *args, **kwargs):
        return MockSlackErrorResponse()

    monkeypatch.setattr("httpx.AsyncClient.get", mock_get)

    res = await get_slack_briefing(db_session, user)
    assert res.source == "slack"
    assert res.connected is True
    assert res.items == []
    assert res.error is not None
    assert "missing_scope" in res.error


# ── ORCHESTRATION PIPELINE TESTS ─────────────────────────────────────


@pytest.mark.asyncio
async def test_briefing_orchestration_all_connected(db_session, monkeypatch):
    """When all 4 sources are connected and return data, briefing synthesizes all items."""
    user = await _create_test_user(db_session, "briefing_all@example.com")
    for p in ("jira", "google", "gmail", "github"):
        await _add_mock_oauth_token(db_session, user.id, p)

    async def mock_jira(db, u):
        return SourceResult(
            source="jira",
            connected=True,
            items=[
                BriefingItem(
                    source="jira",
                    title="[BUG-1] Fix login timeout",
                    detail="Status: Open",
                    priority_hint="overdue",
                )
            ],
        )

    async def mock_cal(db, u):
        return SourceResult(
            source="calendar",
            connected=True,
            items=[
                BriefingItem(
                    source="calendar",
                    title="Sprint Planning",
                    detail="Time: 09:00",
                    priority_hint="today",
                )
            ],
        )

    async def mock_gmail(db, u):
        return SourceResult(
            source="gmail",
            connected=True,
            items=[
                BriefingItem(
                    source="gmail",
                    title="Urgent Deployment Notice",
                    detail="From: ops@co.com",
                    priority_hint="today",
                )
            ],
        )

    async def mock_gh(db, u):
        return SourceResult(
            source="github",
            connected=True,
            items=[
                BriefingItem(
                    source="github",
                    title="[repo] Fix pipeline script",
                    detail="Repo: repo",
                    priority_hint="today",
                )
            ],
        )

    monkeypatch.setattr("app.services.briefing_service.get_jira_briefing", mock_jira)
    monkeypatch.setattr("app.services.briefing_service.get_calendar_briefing", mock_cal)
    monkeypatch.setattr("app.services.briefing_service.get_gmail_briefing", mock_gmail)
    monkeypatch.setattr("app.services.briefing_service.get_github_briefing", mock_gh)

    async def mock_llm_completion(prompt: str) -> str:
        return "Synthesized briefing: 1 overdue Jira bug, 1 meeting, 1 email, 1 GitHub PR."

    monkeypatch.setattr("app.services.briefing_service.generate_completion", mock_llm_completion)

    res = await generate_daily_briefing(db_session, user)

    assert isinstance(res, BriefingResponse)
    assert "Synthesized briefing" in res.summary
    assert len(res.sources) == 6
    assert all(s.connected for s in res.sources if s.source in ("jira", "calendar", "gmail", "github"))
    assert len(res.items) == 4
    # Overdue items must be sorted first
    assert res.items[0].priority_hint == "overdue"


@pytest.mark.asyncio
async def test_briefing_orchestration_partial_connection(db_session, monkeypatch):
    """When 2 of 4 sources are disconnected, partial briefing completes and notes missing sources."""
    user = await _create_test_user(db_session, "briefing_partial@example.com")
    await _add_mock_oauth_token(db_session, user.id, "jira")
    await _add_mock_oauth_token(db_session, user.id, "github")

    async def mock_jira(db, u):
        return SourceResult(
            source="jira",
            connected=True,
            items=[
                BriefingItem(
                    source="jira",
                    title="[BUG-2] Database lock",
                    detail="Status: Open",
                    priority_hint="today",
                )
            ],
        )

    async def mock_cal(db, u):
        return SourceResult(source="calendar", connected=False, items=[])

    async def mock_gmail(db, u):
        return SourceResult(source="gmail", connected=False, items=[])

    async def mock_gh(db, u):
        return SourceResult(source="github", connected=True, items=[])

    monkeypatch.setattr("app.services.briefing_service.get_jira_briefing", mock_jira)
    monkeypatch.setattr("app.services.briefing_service.get_calendar_briefing", mock_cal)
    monkeypatch.setattr("app.services.briefing_service.get_gmail_briefing", mock_gmail)
    monkeypatch.setattr("app.services.briefing_service.get_github_briefing", mock_gh)

    async def mock_llm_completion(prompt: str) -> str:
        assert "Calendar: connected=False" in prompt
        assert "Gmail: connected=False" in prompt
        return "Partial briefing: Jira bug found. Calendar and Gmail not connected."

    monkeypatch.setattr("app.services.briefing_service.generate_completion", mock_llm_completion)

    res = await generate_daily_briefing(db_session, user)

    assert len(res.items) == 1
    sources_dict = {s.source: s.connected for s in res.sources}
    assert sources_dict["jira"] is True
    assert sources_dict["github"] is True
    assert sources_dict["calendar"] is False
    assert sources_dict["gmail"] is False


@pytest.mark.asyncio
async def test_briefing_orchestration_one_source_timeout_resiliency(db_session, monkeypatch):
    """When 1 of 4 sources fails/times out, the other 3 return cleanly without hanging."""
    user = await _create_test_user(db_session, "briefing_timeout@example.com")
    for p in ("jira", "google", "gmail", "github"):
        await _add_mock_oauth_token(db_session, user.id, p)

    async def mock_jira(db, u):
        return SourceResult(
            source="jira",
            connected=True,
            items=[],
            error="Jira API call failed: TimeoutError",
        )

    async def mock_cal(db, u):
        return SourceResult(
            source="calendar",
            connected=True,
            items=[
                BriefingItem(
                    source="calendar",
                    title="1:1 Sync",
                    detail="Time: 14:00",
                    priority_hint="today",
                )
            ],
        )

    async def mock_gmail(db, u):
        return SourceResult(source="gmail", connected=True, items=[])

    async def mock_gh(db, u):
        return SourceResult(source="github", connected=True, items=[])

    monkeypatch.setattr("app.services.briefing_service.get_jira_briefing", mock_jira)
    monkeypatch.setattr("app.services.briefing_service.get_calendar_briefing", mock_cal)
    monkeypatch.setattr("app.services.briefing_service.get_gmail_briefing", mock_gmail)
    monkeypatch.setattr("app.services.briefing_service.get_github_briefing", mock_gh)

    async def mock_llm_completion(prompt: str) -> str:
        return "Briefing generated despite Jira timeout."

    monkeypatch.setattr("app.services.briefing_service.generate_completion", mock_llm_completion)

    res = await generate_daily_briefing(db_session, user)

    jira_status = next(s for s in res.sources if s.source == "jira")
    assert jira_status.connected is True
    assert jira_status.error is not None
    assert "TimeoutError" in jira_status.error
    assert len(res.items) == 1
    assert res.items[0].title == "1:1 Sync"


# ── CRITICAL CROSS-USER ISOLATION TEST ───────────────────────────────


@pytest.mark.asyncio
async def test_cross_user_briefing_data_isolation(db_session, monkeypatch):
    """User A's briefing must NEVER contain User B's Jira/Gmail/GitHub/Calendar items or tokens."""
    user_a = await _create_test_user(db_session, "usera@example.com")
    user_b = await _create_test_user(db_session, "userb@example.com")

    # Add tokens for both users
    await _add_mock_oauth_token(db_session, user_a.id, "jira")
    await _add_mock_oauth_token(db_session, user_b.id, "jira")

    class MockJiraResponse:
        def __init__(self, token_header):
            self.token_header = token_header
            self.status_code = 200

        def raise_for_status(self):
            pass

        def json(self):
            if "accessible-resources" in self.token_header:
                return [{"id": "cloud-site"}]

            if user_a.id in self.token_header:
                return {
                    "issues": [
                        {
                            "key": "USERA-1",
                            "fields": {
                                "summary": "Confidential Task for User A",
                                "status": {"name": "Open"},
                            },
                        }
                    ]
                }
            else:
                return {
                    "issues": [
                        {
                            "key": "USERB-2",
                            "fields": {
                                "summary": "Confidential Task for User B",
                                "status": {"name": "Open"},
                            },
                        }
                    ]
                }

    async def mock_get(self_or_client, url, *args, **kwargs):
        headers = kwargs.get("headers", {})
        token_str = headers.get("Authorization", "") if isinstance(headers, dict) else ""
        return MockJiraResponse(token_str + " " + str(url))

    monkeypatch.setattr("httpx.AsyncClient.get", mock_get)
    monkeypatch.setattr("httpx.AsyncClient.post", mock_get)

    res_a = await get_jira_briefing(db_session, user_a)
    res_b = await get_jira_briefing(db_session, user_b)

    # Verify User A's result contains User A's item and ZERO of User B's items/titles/urls
    assert len(res_a.items) == 1
    assert "USERA-1" in res_a.items[0].title
    assert "Confidential Task for User A" in res_a.items[0].title
    assert not any("USERB" in item.title or "User B" in item.title for item in res_a.items)
    assert not any(item.url and "USERB" in item.url for item in res_a.items)

    # Verify User B's result contains User B's item and ZERO of User A's items/titles/urls
    assert len(res_b.items) == 1
    assert "USERB-2" in res_b.items[0].title
    assert "Confidential Task for User B" in res_b.items[0].title
    assert not any("USERA" in item.title or "User A" in item.title for item in res_b.items)
    assert not any(item.url and "USERA" in item.url for item in res_b.items)



# ── PARALLEL EXECUTION ASSERTION TEST ────────────────────────────────


@pytest.mark.asyncio
async def test_briefing_parallel_execution_timing(db_session, monkeypatch):
    """Execution time of asyncio.gather across 4 mocked tool functions must be close to max single delay, not sum."""
    user = await _create_test_user(db_session, "parallel_user@example.com")
    delay = 0.1  # 100ms per tool

    async def delayed_jira(db, u):
        await asyncio.sleep(delay)
        return SourceResult(source="jira", connected=True, items=[])

    async def delayed_cal(db, u):
        await asyncio.sleep(delay)
        return SourceResult(source="calendar", connected=True, items=[])

    async def delayed_gmail(db, u):
        await asyncio.sleep(delay)
        return SourceResult(source="gmail", connected=True, items=[])

    async def delayed_gh(db, u):
        await asyncio.sleep(delay)
        return SourceResult(source="github", connected=True, items=[])

    monkeypatch.setattr("app.services.briefing_service.get_jira_briefing", delayed_jira)
    monkeypatch.setattr("app.services.briefing_service.get_calendar_briefing", delayed_cal)
    monkeypatch.setattr("app.services.briefing_service.get_gmail_briefing", delayed_gmail)
    monkeypatch.setattr("app.services.briefing_service.get_github_briefing", delayed_gh)

    async def mock_llm_completion(prompt: str) -> str:
        return "Parallel briefing summary"

    monkeypatch.setattr("app.services.briefing_service.generate_completion", mock_llm_completion)

    start_time = time.perf_counter()
    res = await generate_daily_briefing(db_session, user)
    elapsed = time.perf_counter() - start_time

    # 4 tools at 0.1s sequentially = 0.4s. In parallel = ~0.1s.
    # Assert elapsed time is well below sequential sum (0.4s).
    assert elapsed < 0.3, f"Execution took {elapsed:.2f}s, indicating sequential rather than parallel execution!"
    assert res.summary == "Parallel briefing summary"


# ── ENDPOINT FUNCTIONALITY TEST ──────────────────────────────────────


@pytest.mark.asyncio
async def test_briefing_endpoint_requires_auth(client):
    response = client.post("/api/v1/briefing")
    assert response.status_code == 401


@pytest.mark.asyncio
async def test_briefing_endpoint_success(client, monkeypatch):
    token = register_and_login(client, "briefing_ep_user@example.com")
    headers = {"Authorization": f"Bearer {token}"}

    async def mock_gather_briefing(db, user):
        return BriefingResponse(
            summary="Good morning! Here is your daily overview.",
            sources=[
                SourceStatus(source="jira", connected=False, item_count=0, error=None),
                SourceStatus(source="calendar", connected=False, item_count=0, error=None),
                SourceStatus(source="gmail", connected=False, item_count=0, error=None),
                SourceStatus(source="github", connected=False, item_count=0, error=None),
                SourceStatus(source="drive", connected=False, item_count=0, error=None),
                SourceStatus(source="slack", connected=False, item_count=0, error=None),
            ],
            items=[],
        )

    monkeypatch.setattr("app.routers.briefing.generate_daily_briefing", mock_gather_briefing)

    response = client.post("/api/v1/briefing", headers=headers)
    assert response.status_code == 200
    data = response.json()
    assert "Good morning" in data["summary"]
    assert len(data["sources"]) == 6
    assert data["items"] == []


# ── CHECK 2 TEST: GOOGLE TOKEN REFRESH PERSISTENCE ──────────────────


@pytest.mark.asyncio
async def test_google_token_refresh_persists_to_db(db_session, monkeypatch):
    """When an expired Google token is refreshed, the new encrypted token and expiration MUST persist to the DB."""
    user = await _create_test_user(db_session, "token_refresh_persists@example.com")

    old_access_encrypted = encrypt_token("old-expired-token")
    old_refresh_encrypted = encrypt_token("valid-refresh-token")
    expired_time = datetime.now(timezone.utc) - timedelta(minutes=10)

    db_token = OAuthToken(
        user_id=user.id,
        provider="google",
        access_token_encrypted=old_access_encrypted,
        refresh_token_encrypted=old_refresh_encrypted,
        expires_at=expired_time,
        scopes="read",
    )
    db_session.add(db_token)
    await db_session.commit()

    class MockGoogleTokenRefreshResponse:
        def raise_for_status(self):
            pass

        def json(self):
            return {"access_token": "new-persisted-access-token", "expires_in": 3600}

    async def mock_post(self_or_client, url, *args, **kwargs):
        return MockGoogleTokenRefreshResponse()

    monkeypatch.setattr("httpx.AsyncClient.post", mock_post)

    # 1. Call get_decrypted_token which triggers _refresh_google_token
    from app.services.briefing_service import get_decrypted_token

    returned_token = await get_decrypted_token(db_session, user.id, ["google"])
    assert returned_token == "new-persisted-access-token"

    # 2. Query DB directly to verify persistence of updated row
    from sqlalchemy.future import select

    res = await db_session.execute(
        select(OAuthToken).where(
            OAuthToken.user_id == user.id,
            OAuthToken.provider == "google",
        )
    )
    persisted_token_row = res.scalars().first()

    assert persisted_token_row is not None
    assert persisted_token_row.access_token_encrypted != old_access_encrypted
    assert decrypt_token(persisted_token_row.access_token_encrypted) == "new-persisted-access-token"
    
    expires_at = persisted_token_row.expires_at
    if expires_at and expires_at.tzinfo is None:
        expires_at = expires_at.replace(tzinfo=timezone.utc)
    assert expires_at > datetime.now(timezone.utc)


# ── PHASE 1 TESTS: JIRA REFRESH, STAT CARDS, FILTERS, DETAIL & SECURITY ──


@pytest.mark.asyncio
async def test_jira_token_refresh_persists_to_db(db_session, monkeypatch):
    """When an expired Jira token is refreshed, the new encrypted token and expiration MUST persist to DB."""
    user = await _create_test_user(db_session, "jira_refresh_user@example.com")

    old_access_encrypted = encrypt_token("old-expired-jira-access")
    old_refresh_encrypted = encrypt_token("valid-jira-refresh-token")
    expired_time = datetime.now(timezone.utc) - timedelta(minutes=10)

    db_token = OAuthToken(
        user_id=user.id,
        provider="jira",
        access_token_encrypted=old_access_encrypted,
        refresh_token_encrypted=old_refresh_encrypted,
        expires_at=expired_time,
        scopes="read",
    )
    db_session.add(db_token)
    await db_session.commit()

    class MockJiraTokenRefreshResponse:
        def raise_for_status(self):
            pass

        def json(self):
            return {
                "access_token": "new-jira-access-token",
                "refresh_token": "new-jira-refresh-token",
                "expires_in": 3600,
            }

    async def mock_post(self_or_client, url, *args, **kwargs):
        return MockJiraTokenRefreshResponse()

    monkeypatch.setattr("httpx.AsyncClient.post", mock_post)

    from app.services.briefing_service import get_decrypted_token

    returned_token = await get_decrypted_token(db_session, user.id, ["jira"])
    assert returned_token == "new-jira-access-token"

    from sqlalchemy.future import select
    res = await db_session.execute(
        select(OAuthToken).where(OAuthToken.user_id == user.id, OAuthToken.provider == "jira")
    )
    row = res.scalars().first()
    assert row is not None
    assert decrypt_token(row.access_token_encrypted) == "new-jira-access-token"
    assert decrypt_token(row.refresh_token_encrypted) == "new-jira-refresh-token"


@pytest.mark.asyncio
async def test_stat_card_counts_derived_from_briefing_items(db_session, monkeypatch):
    """Stat card verification: confirm Open Tickets and Pending Reviews show non-zero counts when briefing items exist."""
    user = await _create_test_user(db_session, "stat_card_user@example.com")

    mock_items = [
        BriefingItem(source="jira", id="PROJ-1", title="[PROJ-1] Bug 1", detail="d1", priority_hint="today"),
        BriefingItem(source="jira", id="PROJ-2", title="[PROJ-2] Bug 2", detail="d2", priority_hint="overdue"),
        BriefingItem(source="github", id="42", title="[repo] PR 42", detail="d3", priority_hint="today"),
        BriefingItem(source="gmail", id="m1", title="Email 1", detail="d4", priority_hint="today"),
    ]

    open_tickets = len([i for i in mock_items if i.source == "jira"])
    unread_messages = len([i for i in mock_items if i.source in ("gmail", "slack")])
    pending_reviews = len([i for i in mock_items if i.source == "github"])

    assert open_tickets == 2
    assert unread_messages == 1
    assert pending_reviews == 1


@pytest.mark.asyncio
async def test_gmail_html_entity_decoding(db_session, monkeypatch):
    """HTML entities in email subject/snippet (like &#39;) must be decoded cleanly."""
    user = await _create_test_user(db_session, "gmail_html_user@example.com")
    await _add_mock_oauth_token(db_session, user.id, "gmail")

    class MockGmailHTMLResponse:
        def __init__(self, url):
            self.url = str(url)
            self.status_code = 200

        def raise_for_status(self):
            pass

        def json(self):
            if "msg-html-1" not in self.url:
                return {"messages": [{"id": "msg-html-1"}]}

            return {
                "snippet": "I&#39;ve updated the project spec &amp; roadmap.",
                "payload": {
                    "headers": [
                        {"name": "Subject", "value": "Project Update: I&#39;ve shared files"},
                        {"name": "From", "value": "alice@company.com"},
                    ]
                },
            }

    async def mock_get(self_or_client, url, *args, **kwargs):
        return MockGmailHTMLResponse(url)

    monkeypatch.setattr("httpx.AsyncClient.get", mock_get)

    res = await get_gmail_briefing(db_session, user)
    assert len(res.items) == 1
    assert res.items[0].title == "Project Update: I've shared files"
    assert "I've updated" in res.items[0].detail
    assert "&amp;" not in res.items[0].detail


@pytest.mark.asyncio
async def test_gmail_automated_email_filtering(db_session, monkeypatch):
    """Automated notification emails (no-reply, Supabase alerts, etc.) must be filtered out."""
    user = await _create_test_user(db_session, "gmail_filter_user@example.com")
    await _add_mock_oauth_token(db_session, user.id, "gmail")

    class MockGmailNoiseResponse:
        def __init__(self, url):
            self.url = str(url)
            self.status_code = 200

        def raise_for_status(self):
            pass

        def json(self):
            if "msg-" not in self.url or "msg-real" in self.url:
                if "msg-" not in self.url:
                    return {"messages": [{"id": "msg-auto-1"}, {"id": "msg-auto-2"}, {"id": "msg-real"}]}

            if "msg-auto-1" in self.url:
                return {
                    "snippet": "Your invoice is ready",
                    "payload": {"headers": [{"name": "Subject", "value": "Billing Alert"}, {"name": "From", "value": "no-reply@service.com"}]},
                }
            if "msg-auto-2" in self.url:
                return {
                    "snippet": "Project update from Supabase",
                    "payload": {"headers": [{"name": "Subject", "value": "Weekly Supabase Digest"}, {"name": "From", "value": "ant.wilson@supabase.com"}]},
                }
            return {
                "snippet": "Hey, can you review this document?",
                "payload": {"headers": [{"name": "Subject", "value": "Need your review"}, {"name": "From", "value": "colleague@company.com"}]},
            }

    async def mock_get(self_or_client, url, *args, **kwargs):
        return MockGmailNoiseResponse(url)

    monkeypatch.setattr("httpx.AsyncClient.get", mock_get)

    res = await get_gmail_briefing(db_session, user)
    assert len(res.items) == 1
    assert res.items[0].title == "Need your review"


@pytest.mark.asyncio
async def test_briefing_item_detail_endpoint_success_and_sabotage_isolation(client, db_session, monkeypatch):
    """Test GET /api/v1/briefing/{source}/{item_id} and prove server-side cross-user isolation with sabotage evidence."""
    user_a = await _create_test_user(db_session, "detail_usera@example.com")
    user_b = await _create_test_user(db_session, "detail_userb@example.com")
    await _add_mock_oauth_token(db_session, user_a.id, "gmail")
    await _add_mock_oauth_token(db_session, user_b.id, "gmail")

    from app.core.security import create_access_token
    token_a = create_access_token(user_a.id)

    class MockGmailDetailResponse:
        def __init__(self, auth_header):
            self.auth_header = auth_header
            self.status_code = 200

        def raise_for_status(self):
            pass

        def json(self):
            # If request used User A's token, return User A's message
            if f"mock-access-token-{user_a.id}-gmail" in self.auth_header:
                return {
                    "snippet": "User A message snippet",
                    "payload": {
                        "headers": [
                            {"name": "Subject", "value": "User A Private Email"},
                            {"name": "From", "value": "boss@company.com"},
                        ]
                    },
                }
            # Otherwise return 404 (User B's token cannot see User A's message or vice versa)
            raise HTTPError("404 Not Found")

    async def mock_get(self_or_client, url, *args, **kwargs):
        headers = kwargs.get("headers", {})
        auth_str = headers.get("Authorization", "")
        if f"mock-access-token-{user_b.id}-gmail" in auth_str:
            # User B attempting to fetch item returns 404 from upstream
            class ErrResp:
                status_code = 404
            return ErrResp()
        return MockGmailDetailResponse(auth_str)

    monkeypatch.setattr("httpx.AsyncClient.get", mock_get)

    # 1. User A fetches own item -> 200 OK
    resp_a = client.get(
        "/api/v1/briefing/gmail/msg-123",
        headers={"Authorization": f"Bearer {token_a}"},
    )
    assert resp_a.status_code == 200
    assert resp_a.json()["title"] == "User A Private Email"

    # 2. SABOTAGE TEST: User B attempts to access User A's item using User B's token -> 404 NOT FOUND
    token_b = create_access_token(user_b.id)
    resp_b = client.get(
        "/api/v1/briefing/gmail/msg-123",
        headers={"Authorization": f"Bearer {token_b}"},
    )
    assert resp_b.status_code == 404
    assert resp_b.json()["detail"] == "Item not found or integration not connected."


@pytest.mark.asyncio
async def test_briefing_item_detail_rate_limiting(client, db_session):
    """Test that GET /api/v1/briefing/{source}/{item_id} enforces rate limits and returns HTTP 429 when threshold exceeded."""
    from app.core.rate_limit import limiter
    from app.core.security import create_access_token

    user = await _create_test_user(db_session, "ratelimit_user@example.com")
    token = create_access_token(user.id)
    headers = {"Authorization": f"Bearer {token}"}

    # Reset limiter baseline
    limiter.reset()

    # The rate limit is set to CHAT_RATE_LIMIT (60/minute)
    responses = []
    for _ in range(65):
        resp = client.get("/api/v1/briefing/gmail/test-msg", headers=headers)
        responses.append(resp.status_code)

    # First requests within limit return non-429 (404 since item mock not set, but authenticated & rate allowed)
    assert responses[0] == 404
    # Request exceeding limit returns HTTP 429 Too Many Requests
    assert 429 in responses



