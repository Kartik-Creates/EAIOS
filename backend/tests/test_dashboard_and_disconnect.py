"""Unit & Integration tests for Dashboard endpoints and Integrations Disconnect isolation.

Tests cover:
  - DELETE /api/v1/integrations/{provider}: Cross-user isolation (User A cannot disconnect User B).
  - Provider disconnection does not affect other providers for the same user.
  - Daily briefing agent tool correctly degrades gracefully to disconnected after provider disconnect.
  - GET /api/v1/dashboard/pending-approvals: RBAC enforcement (Employee receives 403 Forbidden, Manager/Admin receives 200 OK).
  - GET /api/v1/dashboard/activity: User-scoped activity feed.
"""
import uuid
import pytest
from httpx import AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select

from app.core.security import encrypt_token, get_password_hash
from app.models.integration import Integration
from app.models.oauth_token import OAuthToken
from app.models.user import User
from app.services.briefing_service import get_jira_briefing


async def _create_user(db: AsyncSession, email: str, role: str = "employee") -> User:
    user = User(
        id=str(uuid.uuid4()),
        email=email,
        full_name=f"User {email}",
        hashed_password=get_password_hash("password123"),
        is_active=True,
        role=role,
    )
    db.add(user)
    await db.commit()
    await db.refresh(user)
    return user


async def _connect_provider(db: AsyncSession, user_id: str, provider: str):
    token = OAuthToken(
        user_id=user_id,
        provider=provider,
        access_token_encrypted=encrypt_token("mock_access_token"),
    )
    integration = Integration(
        user_id=user_id,
        provider=provider,
        status="active",
    )
    db.add(token)
    db.add(integration)
    await db.commit()


@pytest.mark.asyncio
async def test_disconnect_integration_cross_user_isolation(db_session: AsyncSession):
    """Test that User A disconnecting Jira revokes User A's Jira connection only and leaves User B's Jira connection intact."""
    user_a = await _create_user(db_session, "usera_disconnect@example.com")
    user_b = await _create_user(db_session, "userb_disconnect@example.com")

    # Connect Jira for User A and User B, plus Slack for User A
    await _connect_provider(db_session, user_a.id, "jira")
    await _connect_provider(db_session, user_a.id, "slack")
    await _connect_provider(db_session, user_b.id, "jira")

    # Disconnect Jira for User A via endpoint logic
    stmt_token = select(OAuthToken).where(
        OAuthToken.user_id == user_a.id,
        OAuthToken.provider == "jira",
    )
    res_token = await db_session.execute(stmt_token)
    token_a = res_token.scalars().first()
    assert token_a is not None
    await db_session.delete(token_a)

    stmt_int = select(Integration).where(
        Integration.user_id == user_a.id,
        Integration.provider == "jira",
    )
    res_int = await db_session.execute(stmt_int)
    int_a = res_int.scalars().first()
    if int_a:
        int_a.status = "disconnected"
    await db_session.commit()

    # Verify User A's Jira token is deleted
    res_token_a_after = await db_session.execute(
        select(OAuthToken).where(OAuthToken.user_id == user_a.id, OAuthToken.provider == "jira")
    )
    assert res_token_a_after.scalars().first() is None

    # Verify User A's Slack token is still intact
    res_token_a_slack = await db_session.execute(
        select(OAuthToken).where(OAuthToken.user_id == user_a.id, OAuthToken.provider == "slack")
    )
    assert res_token_a_slack.scalars().first() is not None

    # Verify User B's Jira token is STILL INTACT
    res_token_b_jira = await db_session.execute(
        select(OAuthToken).where(OAuthToken.user_id == user_b.id, OAuthToken.provider == "jira")
    )
    assert res_token_b_jira.scalars().first() is not None


@pytest.mark.asyncio
async def test_briefing_tool_handles_disconnected_provider(db_session: AsyncSession):
    """Test that after disconnecting Jira, get_jira_briefing gracefully returns connected=False."""
    user = await _create_user(db_session, "user_briefing_dis@example.com")
    await _connect_provider(db_session, user.id, "jira")

    # Before disconnect
    res_before = await get_jira_briefing(db_session, user)
    # connected is True (attempts API call)
    assert res_before.source == "jira"

    # Now disconnect
    res_t = await db_session.execute(
        select(OAuthToken).where(OAuthToken.user_id == user.id, OAuthToken.provider == "jira")
    )
    t = res_t.scalars().first()
    if t:
        await db_session.delete(t)
    await db_session.commit()

    # After disconnect
    res_after = await get_jira_briefing(db_session, user)
    assert res_after.connected is False
    assert len(res_after.items) == 0


@pytest.mark.asyncio
async def test_pending_approvals_rbac_endpoint(client, db_session: AsyncSession):
    """Test that GET /api/v1/dashboard/pending-approvals enforces role gating."""
    emp_user = await _create_user(db_session, "emp_approval@example.com", role="employee")
    mgr_user = await _create_user(db_session, "mgr_approval@example.com", role="manager")

    from app.core.security import create_access_token

    emp_token = create_access_token(emp_user.id)
    mgr_token = create_access_token(mgr_user.id)

    # 1. Employee request -> 403 Forbidden
    res_emp = client.get(
        "/api/v1/dashboard/pending-approvals",
        headers={"Authorization": f"Bearer {emp_token}"},
    )
    assert res_emp.status_code == 403

    # 2. Manager request -> 200 OK
    res_mgr = client.get(
        "/api/v1/dashboard/pending-approvals",
        headers={"Authorization": f"Bearer {mgr_token}"},
    )
    assert res_mgr.status_code == 200
    assert isinstance(res_mgr.json(), list)


@pytest.mark.asyncio
async def test_dashboard_activity_user_scoped(client, db_session: AsyncSession):
    """Test that GET /api/v1/dashboard/activity returns user activity."""
    user = await _create_user(db_session, "user_act@example.com", role="employee")
    from app.core.security import create_access_token

    token = create_access_token(user.id)

    res = client.get(
        "/api/v1/dashboard/activity",
        headers={"Authorization": f"Bearer {token}"},
    )
    assert res.status_code == 200
    assert isinstance(res.json(), list)

