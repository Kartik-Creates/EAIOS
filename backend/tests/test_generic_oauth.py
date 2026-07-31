"""Tests for the generic OAuth 2.0 Connect Engine across all 5 providers:

Gmail, Google Drive, GitHub, Slack, and Jira.
"""
import urllib.parse
import pytest
from sqlalchemy.future import select

from app.core.security import decrypt_token
from app.models.integration import Integration
from app.models.oauth_token import OAuthToken
from tests.rag_fixtures import register_and_login

ALL_PROVIDERS = ["gmail", "google_drive", "github", "slack", "jira"]


@pytest.mark.asyncio
@pytest.mark.parametrize("provider", ALL_PROVIDERS)
async def test_oauth_connect_builds_valid_url(client, provider):
    """GET /api/v1/integrations/{provider}/connect builds a valid auth URL for each provider."""
    token = register_and_login(client, f"oauth_{provider}@example.com")
    headers = {"Authorization": f"Bearer {token}"}

    response = client.get(f"/api/v1/integrations/{provider}/connect", headers=headers)
    assert response.status_code == 200

    data = response.json()
    assert "url" in data
    url = data["url"]

    # Verify authorization URL components
    assert "response_type=code" in url
    assert "client_id=" in url
    assert "scope=" in url
    assert "state=" in url
    assert f"/api/v1/integrations/{provider}/callback" in urllib.parse.unquote(url)

    # Jira-specific requirement: audience=api.atlassian.com
    if provider == "jira":
        assert "audience=api.atlassian.com" in url


@pytest.mark.asyncio
async def test_oauth_connect_invalid_provider_returns_400(client):
    """An unapproved/unknown provider name in the path must return 400 Bad Request."""
    token = register_and_login(client, "unknown_provider@example.com")
    headers = {"Authorization": f"Bearer {token}"}

    response = client.get("/api/v1/integrations/malicious_provider/connect", headers=headers)
    assert response.status_code == 400
    assert "Unsupported integration provider" in response.json()["detail"]


@pytest.mark.asyncio
@pytest.mark.parametrize("provider", ALL_PROVIDERS)
async def test_oauth_callback_rejects_forged_or_missing_state(client, provider):
    """A callback with a missing or forged CSRF state token redirects with an error."""
    # Invalid state
    resp = client.get(
        f"/api/v1/integrations/{provider}/callback",
        params={"code": "fake_code", "state": "forged.jwt.state"},
        follow_redirects=False,
    )
    assert resp.status_code == 307
    assert "/integrations?error=" in resp.headers["Location"]


@pytest.mark.asyncio
@pytest.mark.parametrize("provider", ALL_PROVIDERS)
async def test_oauth_callback_success_stores_encrypted_tokens(client, db_session, monkeypatch, provider):
    """A valid OAuth authorization code exchange creates encrypted OAuthToken & Integration DB rows."""
    # 1. Connect to get a valid CSRF state token
    user_email = f"success_{provider}@example.com"
    token = register_and_login(client, user_email)
    headers = {"Authorization": f"Bearer {token}"}

    connect_resp = client.get(f"/api/v1/integrations/{provider}/connect", headers=headers)
    assert connect_resp.status_code == 200
    auth_url = connect_resp.json()["url"]

    # Extract state parameter from generated auth_url
    parsed = urllib.parse.urlparse(auth_url)
    query_params = urllib.parse.parse_qs(parsed.query)
    state_token = query_params["state"][0]

    # 2. Mock external HTTP call to provider token_url
    class MockTokenResponse:
        def __init__(self):
            self.status_code = 200
        def json(self):
            return {
                "access_token": f"mock-access-token-for-{provider}",
                "refresh_token": f"mock-refresh-token-for-{provider}",
                "expires_in": 3600,
                "scope": "read_test",
            }

    async def mock_post(self, url, *args, **kwargs):
        return MockTokenResponse()

    monkeypatch.setattr("httpx.AsyncClient.post", mock_post)

    # 3. Simulate provider redirect back to callback endpoint
    callback_resp = client.get(
        f"/api/v1/integrations/{provider}/callback",
        params={"code": "valid_oauth_code", "state": state_token},
        follow_redirects=False,
    )
    assert callback_resp.status_code == 307
    location = callback_resp.headers["Location"]
    assert f"/integrations?connected={provider}" in location

    # 4. Verify single-use state token: replayed state callback must fail
    replay_resp = client.get(
        f"/api/v1/integrations/{provider}/callback",
        params={"code": "valid_oauth_code", "state": state_token},
        follow_redirects=False,
    )
    assert replay_resp.status_code == 307
    assert "error=State+token+already+used+or+expired" in replay_resp.headers["Location"]

    # 5. Verify database records
    stmt_token = select(OAuthToken).where(OAuthToken.provider == provider)
    res_token = await db_session.execute(stmt_token)
    db_token = res_token.scalars().first()
    assert db_token is not None

    # Stored token must be encrypted, not plain text
    assert db_token.access_token_encrypted != f"mock-access-token-for-{provider}"
    assert decrypt_token(db_token.access_token_encrypted) == f"mock-access-token-for-{provider}"
    assert decrypt_token(db_token.refresh_token_encrypted) == f"mock-refresh-token-for-{provider}"

    # Verify Integration row is marked active
    stmt_int = select(Integration).where(Integration.provider == provider)
    res_int = await db_session.execute(stmt_int)
    db_int = res_int.scalars().first()
    assert db_int is not None
    assert db_int.status == "active"
