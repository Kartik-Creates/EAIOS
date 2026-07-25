import pytest
from sqlalchemy.future import select
from app.models.oauth_token import OAuthToken
from app.core.security import encrypt_token, decrypt_token

def test_token_encryption_decryption():
    plain = "super-secret-oauth-token-12345"
    encrypted = encrypt_token(plain)
    assert encrypted != plain
    
    decrypted = decrypt_token(encrypted)
    assert decrypted == plain
    
    # Encrypting twice should result in different ciphertexts (due to random nonce)
    encrypted_2 = encrypt_token(plain)
    assert encrypted != encrypted_2
    assert decrypt_token(encrypted_2) == plain

@pytest.mark.asyncio
async def test_register_and_login(client):
    # Register
    reg_data = {"email": "test@example.com", "password": "securepassword", "full_name": "Test User"}
    response = client.post("/api/v1/auth/register", json=reg_data)
    assert response.status_code == 201
    data = response.json()
    assert data["email"] == "test@example.com"
    assert data["full_name"] == "Test User"
    assert data["role"] == "employee"
    assert "id" in data
    assert "password" not in data
    assert "hashed_password" not in data
    
    # Duplicate email registration fails
    response = client.post("/api/v1/auth/register", json=reg_data)
    assert response.status_code == 400
    assert response.json()["detail"] == "The user with this email already exists."
    
    # Login — now returns both access_token and refresh_token
    login_data = {"username": "test@example.com", "password": "securepassword"}
    response = client.post("/api/v1/auth/login", data=login_data)
    assert response.status_code == 200
    token_data = response.json()
    assert "access_token" in token_data
    assert "refresh_token" in token_data
    assert token_data["token_type"] == "bearer"
    
    # Get current user profile using access token
    token = token_data["access_token"]
    headers = {"Authorization": f"Bearer {token}"}
    response = client.get("/api/v1/auth/me", headers=headers)
    assert response.status_code == 200
    me_data = response.json()
    assert me_data["email"] == "test@example.com"
    assert me_data["full_name"] == "Test User"
    assert me_data["role"] == "employee"

@pytest.mark.asyncio
async def test_refresh_flow(client):
    """Login → use refresh token → get new access token → verify it works."""
    # Register and login
    client.post("/api/v1/auth/register", json={
        "email": "refresh@example.com", "password": "securepassword", "full_name": "Refresh User"
    })
    login_resp = client.post("/api/v1/auth/login", data={
        "username": "refresh@example.com", "password": "securepassword"
    })
    tokens = login_resp.json()
    refresh_token = tokens["refresh_token"]

    # Use refresh token to get new tokens
    refresh_resp = client.post("/api/v1/auth/refresh", json={
        "refresh_token": refresh_token
    })
    assert refresh_resp.status_code == 200
    new_tokens = refresh_resp.json()
    assert "access_token" in new_tokens
    assert "refresh_token" in new_tokens

    # Verify the new access token works
    headers = {"Authorization": f"Bearer {new_tokens['access_token']}"}
    me_resp = client.get("/api/v1/auth/me", headers=headers)
    assert me_resp.status_code == 200
    assert me_resp.json()["email"] == "refresh@example.com"

@pytest.mark.asyncio
async def test_logout_revokes_refresh(client):
    """Login → logout → confirm old refresh token is rejected."""
    # Register and login
    client.post("/api/v1/auth/register", json={
        "email": "logout@example.com", "password": "securepassword", "full_name": "Logout User"
    })
    login_resp = client.post("/api/v1/auth/login", data={
        "username": "logout@example.com", "password": "securepassword"
    })
    tokens = login_resp.json()
    access_token = tokens["access_token"]
    refresh_token = tokens["refresh_token"]

    # Logout (revokes refresh tokens by incrementing token_version)
    logout_resp = client.post(
        "/api/v1/auth/logout",
        headers={"Authorization": f"Bearer {access_token}"}
    )
    assert logout_resp.status_code == 200

    # Old refresh token must now be rejected
    refresh_resp = client.post("/api/v1/auth/refresh", json={
        "refresh_token": refresh_token
    })
    assert refresh_resp.status_code == 401

@pytest.mark.asyncio
async def test_refresh_with_access_token_rejected(client):
    """An access token must not be accepted at the /refresh endpoint."""
    client.post("/api/v1/auth/register", json={
        "email": "norefresh@example.com", "password": "securepassword", "full_name": "No Refresh"
    })
    login_resp = client.post("/api/v1/auth/login", data={
        "username": "norefresh@example.com", "password": "securepassword"
    })
    access_token = login_resp.json()["access_token"]

    # Try using access token as refresh token — must be rejected
    refresh_resp = client.post("/api/v1/auth/refresh", json={
        "refresh_token": access_token
    })
    assert refresh_resp.status_code == 401

@pytest.mark.asyncio
async def test_refresh_token_cannot_access_protected_route(client):
    """A refresh token must not be accepted as a Bearer token on /me."""
    client.post("/api/v1/auth/register", json={
        "email": "tokentype@example.com", "password": "securepassword", "full_name": "Token Type"
    })
    login_resp = client.post("/api/v1/auth/login", data={
        "username": "tokentype@example.com", "password": "securepassword"
    })
    refresh_token = login_resp.json()["refresh_token"]

    # Use refresh token as Bearer — must be rejected by get_current_user
    me_resp = client.get("/api/v1/auth/me", headers={
        "Authorization": f"Bearer {refresh_token}"
    })
    assert me_resp.status_code == 401

@pytest.mark.asyncio
async def test_oauth_login_redirect(client):
    # Register and log in
    reg_data = {"email": "oauth@example.com", "password": "securepassword", "full_name": "OAuth User"}
    client.post("/api/v1/auth/register", json=reg_data)
    
    login_data = {"username": "oauth@example.com", "password": "securepassword"}
    response = client.post("/api/v1/auth/login", data=login_data)
    token = response.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}
    
    # Request Google login redirect
    response = client.get("/api/v1/auth/oauth/google/login", headers=headers, follow_redirects=False)
    assert response.status_code == 307
    location = response.headers["Location"]
    assert "accounts.google.com" in location
    assert "state=" in location
    
    # Request GitHub login redirect
    response = client.get("/api/v1/auth/oauth/github/login", headers=headers, follow_redirects=False)
    assert response.status_code == 307
    location = response.headers["Location"]
    assert "github.com/login/oauth/authorize" in location
    assert "state=" in location
    
    # Verify invalid provider fails
    response = client.get("/api/v1/auth/oauth/invalid_provider/login", headers=headers, follow_redirects=False)
    assert response.status_code == 400

@pytest.mark.asyncio
async def test_manual_connections(client, db_session):
    # Register and log in
    reg_data = {"email": "manual@example.com", "password": "securepassword", "full_name": "Manual User"}
    client.post("/api/v1/auth/register", json=reg_data)
    
    login_data = {"username": "manual@example.com", "password": "securepassword"}
    response = client.post("/api/v1/auth/login", data=login_data)
    token = response.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}
    
    # Connect Slack manually
    slack_payload = {
        "provider": "slack",
        "access_token": "xoxb-test-token",
        "refresh_token": "xoxr-refresh-token"
    }
    response = client.post("/api/v1/auth/connections/token", json=slack_payload, headers=headers)
    assert response.status_code == 200
    assert response.json()["status"] == "success"
    
    # Connect Jira manually
    jira_payload = {
        "provider": "jira",
        "access_token": "jira-api-token-value"
    }
    response = client.post("/api/v1/auth/connections/token", json=jira_payload, headers=headers)
    assert response.status_code == 200
    
    # Try invalid manual provider
    invalid_payload = {
        "provider": "google",
        "access_token": "some-token"
    }
    response = client.post("/api/v1/auth/connections/token", json=invalid_payload, headers=headers)
    assert response.status_code == 400
    
    # List active connections
    response = client.get("/api/v1/auth/connections", headers=headers)
    assert response.status_code == 200
    connections = response.json()
    assert len(connections) == 2
    providers = [c["provider"] for c in connections]
    assert "slack" in providers
    assert "jira" in providers
    
    # Verify encryption at rest in DB
    stmt = select(OAuthToken).where(OAuthToken.provider == "slack")
    res = await db_session.execute(stmt)
    db_token = res.scalars().first()
    assert db_token is not None
    
    # Stored value should NOT be plain text
    assert db_token.access_token_encrypted != "xoxb-test-token"
    
    # Decrypting should yield plain text
    assert decrypt_token(db_token.access_token_encrypted) == "xoxb-test-token"
    assert decrypt_token(db_token.refresh_token_encrypted) == "xoxr-refresh-token"
