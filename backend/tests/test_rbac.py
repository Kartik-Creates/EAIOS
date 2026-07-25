"""RBAC boundary tests — prove require_role() enforcement works.

These tests verify the security baseline requirements:
1. Admin-only routes reject lower-permission roles with 403
2. Unauthenticated requests to protected routes return 401
3. Invalid/garbage tokens return 401 (not a crash or silent pass-through)
"""
import pytest
from sqlalchemy.future import select
from app.models.user import User


def _register_and_login(client, email: str, password: str = "securepassword", full_name: str = "Test"):
    """Helper: register a user and login, returning (access_token, user_data)."""
    client.post("/api/v1/auth/register", json={
        "email": email, "password": password, "full_name": full_name
    })
    login_resp = client.post("/api/v1/auth/login", data={
        "username": email, "password": password
    })
    tokens = login_resp.json()
    return tokens["access_token"]


@pytest.mark.asyncio
async def test_admin_route_accessible_by_admin(client, db_session):
    """An admin user can access GET /api/v1/admin/users."""
    access_token = _register_and_login(client, "admin@example.com")

    # Promote this user to admin directly in the DB
    stmt = select(User).where(User.email == "admin@example.com")
    res = await db_session.execute(stmt)
    user = res.scalars().first()
    user.role = "admin"
    await db_session.commit()

    headers = {"Authorization": f"Bearer {access_token}"}
    response = client.get("/api/v1/admin/users", headers=headers)
    assert response.status_code == 200
    users = response.json()
    assert isinstance(users, list)
    assert len(users) >= 1
    # Verify no sensitive fields leak
    for u in users:
        assert "hashed_password" not in u
        assert "token_version" not in u


@pytest.mark.asyncio
async def test_admin_route_rejected_for_employee(client):
    """An employee (default role) must be rejected with 403 on admin routes."""
    access_token = _register_and_login(client, "employee@example.com")

    headers = {"Authorization": f"Bearer {access_token}"}
    response = client.get("/api/v1/admin/users", headers=headers)
    assert response.status_code == 403
    assert response.json()["detail"] == "Insufficient permissions"


@pytest.mark.asyncio
async def test_admin_route_rejected_for_manager(client, db_session):
    """A manager role must also be rejected on admin-only routes."""
    import uuid
    from app.core.security import get_password_hash

    # Create user directly with role='manager'
    mgr = User(
        id=str(uuid.uuid4()),
        email="manager@example.com",
        full_name="Manager User",
        hashed_password=get_password_hash("securepassword"),
        is_active=True,
        is_superuser=False,
        role="manager",
        token_version=0,
    )
    db_session.add(mgr)
    await db_session.commit()

    # Login as manager
    login_resp = client.post("/api/v1/auth/login", data={
        "username": "manager@example.com", "password": "securepassword"
    })
    access_token = login_resp.json()["access_token"]

    headers = {"Authorization": f"Bearer {access_token}"}
    response = client.get("/api/v1/admin/users", headers=headers)
    assert response.status_code == 403


@pytest.mark.asyncio
async def test_protected_route_unauthenticated_returns_401(client):
    """A request with no token to a protected route returns 401, not a crash."""
    response = client.get("/api/v1/admin/users")
    assert response.status_code == 401


@pytest.mark.asyncio
async def test_protected_route_invalid_token_returns_401(client):
    """A garbage Bearer token returns 401, not a 500 or silent pass-through."""
    headers = {"Authorization": "Bearer this-is-not-a-valid-jwt"}
    response = client.get("/api/v1/admin/users", headers=headers)
    assert response.status_code == 401
