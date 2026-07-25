import uuid

from sqlalchemy import Column, DateTime, ForeignKey, String, Text, func
from sqlalchemy.orm import relationship

from app.db.base import Base


class WorkflowRun(Base):
    """Immutable audit trail for agent workflow executions.

    Each row records one workflow invocation (e.g. leave request, ticket creation)
    including who triggered it, the input parameters, and the final outcome.
    Rows are append-only — never updated or deleted — per the security baseline.
    """

    __tablename__ = "workflow_runs"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = Column(
        String, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True
    )
    workflow_name = Column(String, nullable=False)  # e.g. "leave_request", "create_ticket"
    status = Column(
        String, nullable=False, default="pending", server_default="pending"
    )  # pending | confirmed | executed | failed | cancelled
    trigger_params = Column(Text, nullable=True)  # JSON-serialized input parameters
    result_summary = Column(Text, nullable=True)
    started_at = Column(DateTime(timezone=True), server_default=func.now())
    completed_at = Column(DateTime(timezone=True), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    user = relationship("User", backref="workflow_runs")
