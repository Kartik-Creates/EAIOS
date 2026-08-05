import enum
import uuid
from datetime import datetime, timezone
from typing import Any, Dict, Optional
from pydantic import BaseModel, Field


class WorkflowEventType(str, enum.Enum):
    PLAN_CREATED = "PLAN_CREATED"
    VALIDATION_COMPLETED = "VALIDATION_COMPLETED"
    APPROVAL_REQUESTED = "APPROVAL_REQUESTED"
    APPROVAL_GRANTED = "APPROVAL_GRANTED"
    APPROVAL_REJECTED = "APPROVAL_REJECTED"
    EXECUTION_STARTED = "EXECUTION_STARTED"
    STEP_STARTED = "STEP_STARTED"
    STEP_COMPLETED = "STEP_COMPLETED"
    STEP_FAILED = "STEP_FAILED"
    EXECUTION_COMPLETED = "EXECUTION_COMPLETED"
    EXECUTION_FAILED = "EXECUTION_FAILED"
    EXECUTION_CANCELLED = "EXECUTION_CANCELLED"


class WorkflowEvent(BaseModel):
    event_id: str = Field(default_factory=lambda: f"evt_{uuid.uuid4().hex[:12]}")
    event_type: WorkflowEventType
    timestamp: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())
    correlation_id: str
    execution_id: Optional[str] = None
    workflow_id: str
    workflow_version: str = "1.0.0"
    step_id: Optional[str] = None
    actor: str = "system"
    metadata: Dict[str, Any] = Field(default_factory=dict)

    class Config:
        frozen = True  # Enforce event immutability
