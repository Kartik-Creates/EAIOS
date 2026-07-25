import uuid

from sqlalchemy import Column, DateTime, ForeignKey, String, Text, func

from app.db.base import Base


class UnansweredQuery(Base):
    """Chat queries the RAG pipeline couldn't confidently answer.

    Feeds the Admin Queue feature (unanswered-questions feedback loop).
    """

    __tablename__ = "unanswered_queries"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = Column(String, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    query_text = Column(Text, nullable=False)
    timestamp = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    status = Column(String, nullable=False, default="pending", server_default="pending")
