from datetime import datetime
from typing import Any, Dict, List, Optional
from pydantic import BaseModel, Field, model_validator

from app.models.workflow import (
    WorkflowApprovalStatus,
    WorkflowRunStatus,
    WorkflowStatus,
    WorkflowTriggerType,
)
from app.workflows.enums import (
    CapabilityType,
    IntegrationType,
    ParameterType,
    RiskLevel,
    WorkflowCategory,
)


class ValidationRules(BaseModel):
    min_length: Optional[int] = None
    max_length: Optional[int] = None
    min_value: Optional[float] = None
    max_value: Optional[float] = None
    regex_pattern: Optional[str] = None
    options: Optional[List[str]] = None


class WorkflowParameter(BaseModel):
    id: str
    label: str
    description: str
    type: ParameterType = ParameterType.STRING
    required: bool = True
    placeholder: Optional[str] = None
    default_value: Optional[Any] = None
    validation_rules: Optional[ValidationRules] = None


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
    integrations: List[IntegrationType] = []
    capabilities: List[CapabilityType] = []
    parameter_schema: List[WorkflowParameter] = []
    execution_steps: List[WorkflowStepDefinition] = []

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
    input_data: Optional[Dict[str, Any]] = None
    output_data: Optional[Dict[str, Any]] = None
    error_message: Optional[str] = None
    started_at: Optional[datetime] = None
    completed_at: Optional[datetime] = None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class WorkflowApprovalRead(BaseModel):
    id: str
    workflow_run_id: str
    step_key: str
    approver_id: Optional[str] = None
    status: WorkflowApprovalStatus
    prompt: str
    comment: Optional[str] = None
    decided_at: Optional[datetime] = None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class WorkflowRunRead(BaseModel):
    id: str
    workflow_id: str
    workflow_version: Optional[str] = "1.0.0"
    triggered_by_id: Optional[str] = None
    status: WorkflowRunStatus
    inputs: Optional[Dict[str, Any]] = None
    outputs: Optional[Dict[str, Any]] = None
    error_message: Optional[str] = None
    started_at: Optional[datetime] = None
    completed_at: Optional[datetime] = None
    created_at: datetime
    updated_at: datetime
    steps: List[WorkflowStepRunRead] = []
    approvals: List[WorkflowApprovalRead] = []

    class Config:
        from_attributes = True
