from datetime import datetime, timezone
from typing import Any, Dict, List, Optional
from pydantic import BaseModel, Field

from app.models.workflow import WorkflowRunStatus


class ExecutionHistorySummary(BaseModel):
    execution_id: str
    correlation_id: str
    workflow_id: str
    workflow_version: str
    workflow_name: str
    status: WorkflowRunStatus
    started_at: str
    completed_at: Optional[str] = None
    total_duration: float = 0.0
    actor: str = "system"
    approval_summary: Optional[Dict[str, Any]] = None
    step_summary: List[Dict[str, Any]] = Field(default_factory=list)
    total_steps: int = 0
    completed_steps: int = 0

    class Config:
        frozen = True
