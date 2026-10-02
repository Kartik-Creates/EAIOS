"""Tests for email_draft_service.create_gmail_draft() — UnifyAI's first
"write" capability. Covers: invalid address short-circuits before any
network call, missing/wrong-scope Gmail connection is reported clearly,
successful draft creation builds a real MIME message and calls Gmail's
drafts.create endpoint (never send), and Gmail/LLM failures degrade to a
clean error instead of raising.
"""
import base64
import uuid

import pytest
from app.core.security import encrypt_token, get_password_hash
from app.models.oauth_token import OAuthToken
from app.models.user import User
from app.services.email_draft_service import create_gmail_draft


async def _create_test_user(db_session, email: str) -> User:
    user = User(
        id=str(uuid.uuid4()),
        email=email,
        full_name=f"Test {email.split('@')[0]}",
        hashed_password=get_password_hash("securepassword"),
        is_active=True,
        is_superuser=False,
        role="employee",
        token_version=0,
    )
    db_session.add(user)
    await db_session.commit()
    await db_session.refresh(user)
    return user


async def _add_oauth_token(db_session, user_id: str, provider: str, scopes: str):
    tok = OAuthToken(
        user_id=user_id,
        provider=provider,
        access_token_encrypted=encrypt_token(f"mock-token-{user_id}"),
        scopes=scopes,
    )
    db_session.add(tok)
    await db_session.commit()


_COMPOSE_SCOPE = (
    "https://www.googleapis.com/auth/gmail.readonly "
    "https://www.googleapis.com/auth/calendar.readonly "
    "https://www.googleapis.com/auth/gmail.compose"
)
_READONLY_SCOPE = (
    "https://www.googleapis.com/auth/gmail.readonly "
    "https://www.googleapis.com/auth/calendar.readonly"
)


@pytest.mark.asyncio
async def test_create_gmail_draft_rejects_invalid_email_before_any_network_call(db_session, monkeypatch):
    """An obviously malformed address must fail fast with no token lookup or
    API call at all — not a confusing downstream Gmail error."""
    user = await _create_test_user(db_session, "sender@example.com")

    async def fail_if_called(*args, **kwargs):
        raise AssertionError("must not make any HTTP call for an invalid address")

    monkeypatch.setattr("httpx.AsyncClient.post", fail_if_called)
    monkeypatch.setattr("httpx.AsyncClient.get", fail_if_called)

    res = await create_gmail_draft(db_session, user, "not-an-email", "Test subject")
    assert res.success is False
    assert res.connected is True
    assert "valid email" in res.error.lower()


@pytest.mark.asyncio
async def test_create_gmail_draft_not_connected(db_session):
    """No Gmail connection at all → clearly reported as not connected."""
    user = await _create_test_user(db_session, "sender2@example.com")

    res = await create_gmail_draft(db_session, user, "boss@company.com", "Status update")
    assert res.connected is False
    assert res.success is False


@pytest.mark.asyncio
async def test_create_gmail_draft_readonly_token_cannot_draft(db_session):
    """Regression: a Gmail connection that only has read-only scope (the
    original, pre-compose connection every existing user has) must NOT be
    allowed to silently attempt draft creation — Google would reject it
    with a confusing 403. The fix requires the specific "compose" scope,
    not just any token that happens to be provider="gmail"."""
    user = await _create_test_user(db_session, "sender3@example.com")
    await _add_oauth_token(db_session, user.id, "gmail", _READONLY_SCOPE)

    res = await create_gmail_draft(db_session, user, "boss@company.com", "Status update")
    assert res.connected is False
    assert res.success is False
    assert "reconnect" in res.error.lower()


@pytest.mark.asyncio
async def test_create_gmail_draft_success_builds_real_mime_and_never_calls_send(db_session, monkeypatch):
    """With a properly-scoped connection, the service must: generate a body
    via the LLM, build a real base64url-encoded MIME message containing the
    exact To/Subject, POST it to Gmail's drafts.create endpoint, and return
    the new draft id. Also asserts the send endpoint is never touched."""
    user = await _create_test_user(db_session, "sender4@example.com")
    await _add_oauth_token(db_session, user.id, "gmail", _COMPOSE_SCOPE)

    async def fake_generate_email_draft_body(to, subject):
        return "Hi there,\n\nJust checking in on this.\n\nBest regards,"

    monkeypatch.setattr(
        "app.services.email_draft_service.generate_email_draft_body",
        fake_generate_email_draft_body,
    )

    captured = {}

    class MockResponse:
        status_code = 201

        def json(self):
            return {"id": "draft_abc123"}

    async def mock_post(self_or_client, url, *args, **kwargs):
        captured["url"] = url
        captured["json"] = kwargs.get("json")
        return MockResponse()

    monkeypatch.setattr("httpx.AsyncClient.post", mock_post)

    res = await create_gmail_draft(db_session, user, "boss@company.com", "Status update")

    assert res.connected is True
    assert res.success is True
    assert res.draft_id == "draft_abc123"
    assert res.to == "boss@company.com"
    assert res.subject == "Status update"
    assert "checking in" in res.body

    # Hit the drafts endpoint, never anything with "send" in the path.
    assert captured["url"] == "https://gmail.googleapis.com/gmail/v1/users/me/drafts"
    assert "send" not in captured["url"]

    # The raw MIME payload actually contains the real To/Subject/body —
    # prove it by decoding exactly what would be sent to Gmail.
    raw = captured["json"]["message"]["raw"]
    decoded = base64.urlsafe_b64decode(raw.encode("ascii")).decode("utf-8")
    assert "To: boss@company.com" in decoded
    assert "Subject: Status update" in decoded
    assert "checking in" in decoded


@pytest.mark.asyncio
async def test_create_gmail_draft_gmail_api_error_does_not_raise(db_session, monkeypatch):
    """A non-2xx response from Gmail must degrade to a clean error result,
    not an unhandled exception."""
    user = await _create_test_user(db_session, "sender5@example.com")
    await _add_oauth_token(db_session, user.id, "gmail", _COMPOSE_SCOPE)

    async def fake_body(to, subject):
        return "Body text."

    monkeypatch.setattr("app.services.email_draft_service.generate_email_draft_body", fake_body)

    class MockResponse:
        status_code = 500
        text = "internal server error"

        def json(self):
            return {}

    async def mock_post(self_or_client, url, *args, **kwargs):
        return MockResponse()

    monkeypatch.setattr("httpx.AsyncClient.post", mock_post)

    res = await create_gmail_draft(db_session, user, "boss@company.com", "Status update")
    assert res.connected is True
    assert res.success is False
    assert "error" in res.error.lower()


@pytest.mark.asyncio
async def test_create_gmail_draft_llm_failure_does_not_raise(db_session, monkeypatch):
    """If body generation fails, the function must still return a clean
    result rather than propagating the exception — and must never attempt
    the Gmail API call with no body."""
    user = await _create_test_user(db_session, "sender6@example.com")
    await _add_oauth_token(db_session, user.id, "gmail", _COMPOSE_SCOPE)

    async def failing_body(to, subject):
        raise RuntimeError("simulated LLM failure")

    monkeypatch.setattr("app.services.email_draft_service.generate_email_draft_body", failing_body)

    async def fail_if_called(self_or_client, url, *args, **kwargs):
        raise AssertionError("must not call Gmail API if body generation failed")

    monkeypatch.setattr("httpx.AsyncClient.post", fail_if_called)

    res = await create_gmail_draft(db_session, user, "boss@company.com", "Status update")
    assert res.success is False
    assert res.connected is True
