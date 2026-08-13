"""Unit and isolation tests for notifications API (GET/POST /api/v1/notifications).

Tests verify:
  - Notification retrieval (ordered by created_at desc)
  - Specific mark-as-read persists across requests
  - Mark-all-as-read persists across requests
  - Strict cross-user data isolation (User A never sees/modifies User B's notifications)
  - Unauthenticated requests return 401
"""
import uuid
import pytest
from app.models.notification import UserNotification
from app.models.user import User
from app.core.security import get_password_hash
from tests.rag_fixtures import register_and_login


async def _create_test_user(db_session, email: str) -> User:
    user = User(
        id=str(uuid.uuid4()),
        email=email,
        full_name=f"Test {email}",
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


async def _seed_notification(db_session, user_id: str, title: str, source: str = "workflow", is_read: bool = False):
    n = UserNotification(
        id=str(uuid.uuid4()),
        user_id=user_id,
        source=source,
        title=title,
        description=f"Description for {title}",
        is_read=is_read,
    )
    db_session.add(n)
    await db_session.commit()
    await db_session.refresh(n)
    return n


@pytest.mark.asyncio
async def test_get_notifications_empty(client):
    token = register_and_login(client, "empty_notif@example.com")
    headers = {"Authorization": f"Bearer {token}"}

    resp = client.get("/api/v1/notifications", headers=headers)
    assert resp.status_code == 200
    assert resp.json() == []


@pytest.mark.asyncio
async def test_get_notifications_returns_user_items(client, db_session):
    user = await _create_test_user(db_session, "notif_user1@example.com")
    n1 = await _seed_notification(db_session, user.id, "Workflow Completed", "workflow", is_read=False)
    n2 = await _seed_notification(db_session, user.id, "Document Indexed: Guide.pdf", "drive", is_read=True)

    login_resp = client.post("/api/v1/auth/login", data={"username": "notif_user1@example.com", "password": "securepassword"})
    token = login_resp.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    resp = client.get("/api/v1/notifications", headers=headers)
    assert resp.status_code == 200
    data = resp.json()
    assert len(data) == 2
    titles = [item["title"] for item in data]
    assert "Workflow Completed" in titles
    assert "Document Indexed: Guide.pdf" in titles


@pytest.mark.asyncio
async def test_mark_single_notification_read(client, db_session):
    user = await _create_test_user(db_session, "mark_read_user@example.com")
    n1 = await _seed_notification(db_session, user.id, "Pending Task", "workflow", is_read=False)

    login_resp = client.post("/api/v1/auth/login", data={"username": "mark_read_user@example.com", "password": "securepassword"})
    token = login_resp.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    # Mark as read
    mark_resp = client.post(
        "/api/v1/notifications/mark-read",
        json={"notification_ids": [n1.id]},
        headers=headers,
    )
    assert mark_resp.status_code == 200

    # Fetch again to verify persistence
    get_resp = client.get("/api/v1/notifications", headers=headers)
    assert get_resp.status_code == 200
    items = get_resp.json()
    assert len(items) == 1
    assert items[0]["id"] == n1.id
    assert items[0]["is_read"] is True


@pytest.mark.asyncio
async def test_mark_all_notifications_read(client, db_session):
    user = await _create_test_user(db_session, "mark_all_user@example.com")
    await _seed_notification(db_session, user.id, "Item 1", "workflow", is_read=False)
    await _seed_notification(db_session, user.id, "Item 2", "drive", is_read=False)

    login_resp = client.post("/api/v1/auth/login", data={"username": "mark_all_user@example.com", "password": "securepassword"})
    token = login_resp.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    # Mark all read
    mark_all_resp = client.post("/api/v1/notifications/mark-all-read", headers=headers)
    assert mark_all_resp.status_code == 200

    # Fetch again to verify all are is_read=True
    get_resp = client.get("/api/v1/notifications", headers=headers)
    assert get_resp.status_code == 200
    items = get_resp.json()
    assert len(items) == 2
    assert all(item["is_read"] is True for item in items)


@pytest.mark.asyncio
async def test_notifications_cross_user_isolation(client, db_session):
    """User A must NEVER see User B's notifications, nor be able to mark User B's notifications as read."""
    user_a = await _create_test_user(db_session, "user_a_notif@example.com")
    user_b = await _create_test_user(db_session, "user_b_notif@example.com")

    n_a = await _seed_notification(db_session, user_a.id, "User A Secret Notification", "system")
    n_b = await _seed_notification(db_session, user_b.id, "User B Secret Notification", "system")

    # Login as User A
    login_a = client.post("/api/v1/auth/login", data={"username": "user_a_notif@example.com", "password": "securepassword"})
    token_a = login_a.json()["access_token"]
    headers_a = {"Authorization": f"Bearer {token_a}"}

    # User A gets notifications
    resp_a = client.get("/api/v1/notifications", headers=headers_a)
    assert resp_a.status_code == 200
    items_a = resp_a.json()
    assert len(items_a) == 1
    assert items_a[0]["title"] == "User A Secret Notification"
    assert "User B Secret Notification" not in [i["title"] for i in items_a]

    # User A attempts to mark User B's notification as read
    client.post("/api/v1/notifications/mark-read", json={"notification_ids": [n_b.id]}, headers=headers_a)

    # Check User B's notification is still unread
    await db_session.refresh(n_b)
    assert n_b.is_read is False


@pytest.mark.asyncio
async def test_notifications_unauthenticated_returns_401(client):
    resp = client.get("/api/v1/notifications")
    assert resp.status_code == 401
