import uuid
from datetime import datetime, timezone
from typing import Any, Dict, List, Optional
from pydantic import BaseModel, Field

from app.models.workflow import WorkflowRunStatus
from app.workflows.step_result import StepResult


class ExecutionResult(BaseModel):
    execution_id: str = Field(default_factory=lambda: f"exec_{uuid.uuid4().hex[:12]}")
    correlation_id: str
    workflow_id: str
    workflow_version: str
    overall_status: WorkflowRunStatus
    total_duration: float  # In seconds
    completed_steps: int = 0
    failed_steps: int = 0
    skipped_steps: int = 0
    step_results: List[StepResult] = Field(default_factory=list)
    execution_summary: Dict[str, Any] = Field(default_factory=dict)
    executed_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())

    class Config:
        frozen = True  # Immutable model design
