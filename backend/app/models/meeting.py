import uuid

from sqlalchemy import Column, DateTime, ForeignKey, String, func

from app.db.base import Base


class Meeting(Base):
    __tablename__ = "meetings"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    source = Column(String, nullable=False, default="manual")  # "zoom" | "teams" | "google_meet" | "manual"
    title = Column(String, nullable=False)
    # Pointer to raw-transcript storage for future platform connectors (Zoom/Teams).
    # Phase A (manual paste) never populates this — raw transcript text is processed
    # in-memory and discarded, per the plan's recommended retention policy.
    raw_transcript_ref = Column(String, nullable=True)
    started_at = Column(DateTime(timezone=True), nullable=True)
    ended_at = Column(DateTime(timezone=True), nullable=True)
    organizer_user_id = Column(String, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
