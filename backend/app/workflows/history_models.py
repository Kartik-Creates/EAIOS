from typing import Any

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
    completed_at: str | None = None
    total_duration: float = 0.0
    actor: str = "system"
    approval_summary: dict[str, Any] | None = None
    step_summary: list[dict[str, Any]] = Field(default_factory=list)
    total_steps: int = 0
    completed_steps: int = 0

    class Config:
        frozen = True
