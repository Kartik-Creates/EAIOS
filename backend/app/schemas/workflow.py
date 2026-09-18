from datetime import datetime
from typing import Any

from pydantic import BaseModel, model_validator

from app.models.workflow import (
    WorkflowApprovalStatus,
    WorkflowRunStatus,
)
from app.workflows.enums import (
    CapabilityType,
    IntegrationType,
    ParameterType,
    RiskLevel,
    WorkflowCategory,
)


class ValidationRules(BaseModel):
    min_length: int | None = None
    max_length: int | None = None
    min_value: float | None = None
    max_value: float | None = None
    regex_pattern: str | None = None
    options: list[str] | None = None


class WorkflowParameter(BaseModel):
    id: str
    label: str
    description: str
    type: ParameterType = ParameterType.STRING
    required: bool = True
    placeholder: str | None = None
    default_value: Any | None = None
    validation_rules: ValidationRules | None = None


class WorkflowStepDefinition(BaseModel):
    id: str
    title: str
    description: str
    service: str
    action: str
    requires_confirmation: bool = False


class WorkflowDefinition(BaseModel):
    id: str
    version: str = "1.0.0"
    name: str
    description: str
    category: WorkflowCategory
    icon: str = "Wand2"
    required_role: str = "employee"
    risk_level: RiskLevel = RiskLevel.LOW
    estimated_runtime: str = "Instant"
    requires_confirmation: bool = False
    integrations: list[IntegrationType] = []
    capabilities: list[CapabilityType] = []
    parameter_schema: list[WorkflowParameter] = []
    execution_steps: list[WorkflowStepDefinition] = []

    @model_validator(mode="after")
    def validate_workflow(self):
        # Ensure non-empty ID and Name
        if not self.id or not self.id.strip():
            raise ValueError("Workflow ID cannot be empty.")
        if not self.name or not self.name.strip():
            raise ValueError("Workflow Name cannot be empty.")

        # Ensure unique parameter IDs
        param_ids = set()
        for p in self.parameter_schema:
            if p.id in param_ids:
                raise ValueError(f"Duplicate parameter ID '{p.id}' in workflow '{self.id}'.")
            param_ids.add(p.id)

        # Ensure unique step IDs
        step_ids = set()
        for s in self.execution_steps:
            if s.id in step_ids:
                raise ValueError(f"Duplicate step ID '{s.id}' in workflow '{self.id}'.")
            step_ids.add(s.id)

        return self


# ─────────────────────────────────────────────
# Execution & Runtime Schemas (Lightweight)
# ─────────────────────────────────────────────

class WorkflowStepRunRead(BaseModel):
    id: str
    workflow_run_id: str
    step_key: str
    step_type: str
    status: WorkflowRunStatus
    input_data: dict[str, Any] | None = None
    output_data: dict[str, Any] | None = None
    error_message: str | None = None
    started_at: datetime | None = None
    completed_at: datetime | None = None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class WorkflowApprovalRead(BaseModel):
    id: str
    workflow_run_id: str
    step_key: str
    approver_id: str | None = None
    status: WorkflowApprovalStatus
    prompt: str
    comment: str | None = None
    decided_at: datetime | None = None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class WorkflowRunRead(BaseModel):
    id: str
    workflow_id: str
    workflow_version: str | None = "1.0.0"
    triggered_by_id: str | None = None
    status: WorkflowRunStatus
    inputs: dict[str, Any] | None = None
    outputs: dict[str, Any] | None = None
    error_message: str | None = None
    started_at: datetime | None = None
    completed_at: datetime | None = None
    created_at: datetime
    updated_at: datetime
    steps: list[WorkflowStepRunRead] = []
    approvals: list[WorkflowApprovalRead] = []

    class Config:
        from_attributes = True
