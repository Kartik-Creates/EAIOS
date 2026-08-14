import uuid
from datetime import datetime, timezone
from typing import Any, Dict, Optional
from pydantic import BaseModel, Field

from app.models.workflow import WorkflowRunStatus
from app.workflows.triggers import TriggerContext, TriggerType


class WorkflowInstance(BaseModel):
    instance_id: str = Field(default_factory=lambda: f"inst_{uuid.uuid4().hex[:12]}")
    workflow_id: str
    workflow_version: str = "1.0.0"
    trigger_type: TriggerType
    trigger_context: TriggerContext
    correlation_id: str
    created_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())
    created_by: str = "system"
    current_status: WorkflowRunStatus = WorkflowRunStatus.PENDING

    class Config:
        frozen = True
