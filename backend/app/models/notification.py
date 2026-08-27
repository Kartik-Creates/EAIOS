"""UserNotification model — per-user dismissible notification with read state.

Separate from the activity feed (WorkflowRun/Document/Meeting have no read-state
concept).  Notifications are created at actual event write paths (workflow
completion, document ingestion, meeting creation), not at query time.
"""
import uuid

from sqlalchemy import Boolean, Column, DateTime, ForeignKey, String, func

from app.db.base import Base


class UserNotification(Base):
    __tablename__ = "user_notifications"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = Column(String, ForeignKey("users.id"), nullable=False, index=True)
    source = Column(String, nullable=False)  # "workflow" | "drive" | "meeting" | "system"
    title = Column(String, nullable=False)
    description = Column(String, nullable=True, default="")
    is_read = Column(Boolean, nullable=False, default=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
