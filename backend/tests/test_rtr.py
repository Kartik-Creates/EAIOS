import pytest


@pytest.mark.asyncio
async def test_rtr_replay_fails(client):
    # 1. Register and login to get refresh token
    client.post("/api/v1/auth/register", json={
        "email": "rtr_replay@example.com", "password": "securepassword", "full_name": "RTR Replay User"
    })
    login_resp = client.post("/api/v1/auth/login", data={
        "username": "rtr_replay@example.com", "password": "securepassword"
    })
    tokens = login_resp.json()
    refresh_token = tokens["refresh_token"]

    # 2. Use refresh token the first time — should succeed
    refresh_resp_1 = client.post("/api/v1/auth/refresh", json={
        "refresh_token": refresh_token
    })
    assert refresh_resp_1.status_code == 200
    new_tokens_1 = refresh_resp_1.json()
    assert "access_token" in new_tokens_1
    assert "refresh_token" in new_tokens_1

    # 3. Use the same old refresh token a second time — must fail with 401
    refresh_resp_2 = client.post("/api/v1/auth/refresh", json={
        "refresh_token": refresh_token
    })
    assert refresh_resp_2.status_code == 401
    assert refresh_resp_2.json()["detail"] == "Invalid or expired refresh token"

@pytest.mark.asyncio
async def test_rtr_rotated_token_works(client):
    # 1. Register and login to get initial refresh token
    client.post("/api/v1/auth/register", json={
        "email": "rtr_rotated@example.com", "password": "securepassword", "full_name": "RTR Rotated User"
    })
    login_resp = client.post("/api/v1/auth/login", data={
        "username": "rtr_rotated@example.com", "password": "securepassword"
    })
    tokens = login_resp.json()
    refresh_token = tokens["refresh_token"]

    # 2. Use refresh token once to rotate it
    refresh_resp_1 = client.post("/api/v1/auth/refresh", json={
        "refresh_token": refresh_token
    })
    assert refresh_resp_1.status_code == 200
    new_tokens_1 = refresh_resp_1.json()
    rotated_refresh_token = new_tokens_1["refresh_token"]

    # 3. Use the new rotated refresh token — should succeed
    refresh_resp_2 = client.post("/api/v1/auth/refresh", json={
        "refresh_token": rotated_refresh_token
    })
    assert refresh_resp_2.status_code == 200
    new_tokens_2 = refresh_resp_2.json()
    assert "access_token" in new_tokens_2

@pytest.mark.asyncio
async def test_rtr_logout_revokes_current_refresh(client):
    # 1. Register and login
    client.post("/api/v1/auth/register", json={
        "email": "rtr_logout@example.com", "password": "securepassword", "full_name": "RTR Logout User"
    })
    login_resp = client.post("/api/v1/auth/login", data={
        "username": "rtr_logout@example.com", "password": "securepassword"
    })
    tokens = login_resp.json()
    access_token = tokens["access_token"]
    refresh_token = tokens["refresh_token"]

    # 2. Call logout with access token
    logout_resp = client.post(
        "/api/v1/auth/logout",
        headers={"Authorization": f"Bearer {access_token}"}
    )
    assert logout_resp.status_code == 200

    # 3. Old refresh token should be revoked and rejected on refresh call
    refresh_resp = client.post("/api/v1/auth/refresh", json={
        "refresh_token": refresh_token
    })
    assert refresh_resp.status_code == 401
