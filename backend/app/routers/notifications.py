"""Notifications API router.

All endpoints require authentication and are strictly scoped to the
requesting user only — a user can only see/manage their own notifications.
"""
from typing import Annotated, List, Optional

from fastapi import APIRouter, Depends
from pydantic import BaseModel
from sqlalchemy import update
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select

from app.core.deps import get_current_user, get_db
from app.models.notification import UserNotification
from app.models.user import User

router = APIRouter()


class NotificationRead(BaseModel):
    id: str
    source: str
    title: str
    description: str
    is_read: bool
    created_at: str  # ISO string


class MarkReadRequest(BaseModel):
    notification_ids: List[str]


class UnreadCountResponse(BaseModel):
    unread_count: int


@router.get("/notifications", response_model=List[NotificationRead])
async def get_notifications(
    current_user: Annotated[User, Depends(get_current_user)],
    db: Annotated[AsyncSession, Depends(get_db)],
):
    """Retrieve the requesting user's notifications (last 20, newest first).

    Strictly scoped to current_user.id — no cross-user leakage possible.
    """
    stmt = (
        select(UserNotification)
        .where(UserNotification.user_id == current_user.id)
        .order_by(UserNotification.created_at.desc())
        .limit(20)
    )
    result = await db.execute(stmt)
    notifications = result.scalars().all()

    return [
        NotificationRead(
            id=n.id,
            source=n.source,
            title=n.title,
            description=n.description or "",
            is_read=n.is_read,
            created_at=n.created_at.isoformat() if n.created_at else "",
        )
        for n in notifications
    ]


@router.post("/notifications/mark-read")
async def mark_notifications_read(
    body: MarkReadRequest,
    current_user: Annotated[User, Depends(get_current_user)],
    db: Annotated[AsyncSession, Depends(get_db)],
):
    """Mark specific notifications as read. Only affects the current user's notifications."""
    stmt = (
        update(UserNotification)
        .where(
            UserNotification.user_id == current_user.id,
            UserNotification.id.in_(body.notification_ids),
        )
        .values(is_read=True)
    )
    await db.execute(stmt)
    await db.commit()
    return {"status": "ok"}


@router.post("/notifications/mark-all-read")
async def mark_all_notifications_read(
    current_user: Annotated[User, Depends(get_current_user)],
    db: Annotated[AsyncSession, Depends(get_db)],
):
    """Mark ALL of the current user's notifications as read."""
    stmt = (
        update(UserNotification)
        .where(UserNotification.user_id == current_user.id)
        .values(is_read=True)
    )
    await db.execute(stmt)
    await db.commit()
    return {"status": "ok"}
