from typing import Any

from pydantic import BaseModel, Field

from app.models.workflow import WorkflowRunStatus


class StepResult(BaseModel):
    step_id: str
    status: WorkflowRunStatus
    started_at: str
    finished_at: str
    duration: float  # In seconds
    outputs: dict[str, Any] = Field(default_factory=dict)
    warnings: list[str] = Field(default_factory=list)
    error: str | None = None
    retryable: bool = False

    class Config:
        frozen = True  # Immutable model design
