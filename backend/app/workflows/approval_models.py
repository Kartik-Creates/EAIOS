import enum
import uuid
from datetime import datetime, timezone

from pydantic import BaseModel, Field

from app.workflows.plan import ExecutionPlan


class ApprovalLifecycleState(str, enum.Enum):
    PENDING = "PENDING"
    APPROVED = "APPROVED"
    REJECTED = "REJECTED"
    EXPIRED = "EXPIRED"
    CANCELLED = "CANCELLED"


class ApprovalDecision(BaseModel):
    requires_approval: bool
    approval_reason: str | None = None
    approval_level: int = 1  # 1-based level for multi-level approval support
    approver_role: str = "manager"
    required_approvals: int = 1
    evaluated_rules: list[str] = Field(default_factory=list)
    evaluated_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())

    class Config:
        frozen = True


class ApprovalRequestModel(BaseModel):
    request_id: str = Field(default_factory=lambda: f"req_{uuid.uuid4().hex[:12]}")
    execution_id: str | None = None
    plan_id: str
    workflow_id: str
    workflow_name: str
    approver_role: str = "manager"
    approver_user_id: str | None = None
    reason: str
    status: ApprovalLifecycleState = ApprovalLifecycleState.PENDING
    created_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())
    expires_at: str | None = None
    decision_at: str | None = None
    comments: str | None = None
    plan: ExecutionPlan
