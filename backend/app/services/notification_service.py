"""Notification creation utility — called from actual event write paths.

Notifications are created at the moment events happen (workflow completion,
document ingestion, meeting creation), NOT when the dashboard is queried.
"""
import logging
import uuid

from sqlalchemy.ext.asyncio import AsyncSession

from app.models.notification import UserNotification

logger = logging.getLogger("eaios.notifications")


async def create_notification(
    db: AsyncSession,
    user_id: str,
    source: str,
    title: str,
    description: str = "",
) -> UserNotification:
    """Create a notification for a specific user at the moment an event occurs.

    Args:
        db: Database session
        user_id: The user to notify (strict per-user scoping)
        source: Event source type ("workflow" | "drive" | "meeting" | "system")
        title: Short notification title
        description: Optional detail text
    """
    notification = UserNotification(
        id=str(uuid.uuid4()),
        user_id=user_id,
        source=source,
        title=title,
        description=description,
        is_read=False,
    )
    db.add(notification)
    # Note: caller is responsible for committing the transaction
    # (usually happens as part of the same transaction that created the event)
    return notification
