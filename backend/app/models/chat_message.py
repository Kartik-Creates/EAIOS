"""ChatMessage model — persists user chat queries for the activity feed.

Stores each user's chat interactions so they appear in the Dashboard's
Recent Activity feed (e.g. "Asked AI: 'What's my latest email?'").
"""
import uuid

from sqlalchemy import Column, DateTime, ForeignKey, String, Text, func

from app.db.base import Base


class ChatMessage(Base):
    __tablename__ = "chat_messages"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = Column(String, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    query_text = Column(Text, nullable=False)
    conversation_id = Column(String, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
