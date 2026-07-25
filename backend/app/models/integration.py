import uuid

from sqlalchemy import Column, String, Text, DateTime, ForeignKey, func
from sqlalchemy.orm import relationship

from app.db.base import Base


class Integration(Base):
    """Tracks OAuth-connected services per user (Google Drive, Gmail, Slack, etc.)."""

    __tablename__ = "integrations"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = Column(
        String, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True
    )
    provider = Column(String, nullable=False)  # "google_drive", "gmail", "slack", "github", "jira"
    status = Column(String, nullable=False, default="active", server_default="active")
    config_json = Column(Text, nullable=True)  # Provider-specific settings (JSON string)
    last_sync_at = Column(DateTime(timezone=True), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    user = relationship("User", backref="integrations")
