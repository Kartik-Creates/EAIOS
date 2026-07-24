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
    assert "id" in data
    assert "password" not in data
    assert "hashed_password" not in data
    
    # Duplicate email registration fails
    response = client.post("/api/v1/auth/register", json=reg_data)
    assert response.status_code == 400
    assert response.json()["detail"] == "The user with this email already exists."
    
    # Login
    login_data = {"username": "test@example.com", "password": "securepassword"}
    response = client.post("/api/v1/auth/login", data=login_data)
    assert response.status_code == 200
    token_data = response.json()
    assert "access_token" in token_data
    assert token_data["token_type"] == "bearer"
    
    # Get current user profile
    token = token_data["access_token"]
    headers = {"Authorization": f"Bearer {token}"}
    response = client.get("/api/v1/auth/me", headers=headers)
    assert response.status_code == 200
    me_data = response.json()
    assert me_data["email"] == "test@example.com"
    assert me_data["full_name"] == "Test User"

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
