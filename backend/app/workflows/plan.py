import uuid
from datetime import datetime, timezone
from typing import Any

from pydantic import BaseModel, Field

from app.workflows.enums import CapabilityType, IntegrationType, RiskLevel


class FieldValidationError(BaseModel):
    field_id: str
    field_label: str
    message: str


class ValidationSummary(BaseModel):
    is_valid: bool
    errors: list[FieldValidationError] = []


class ExecutionPlanStep(BaseModel):
    step_id: str
    order: int
    title: str
    description: str
    service: str
    action: str
    requires_confirmation: bool = False


class ExecutionPlan(BaseModel):
    plan_id: str = Field(default_factory=lambda: f"plan_{uuid.uuid4().hex[:12]}")
    correlation_id: str = Field(default_factory=lambda: f"cid_{uuid.uuid4().hex[:12]}")
    workflow_id: str
    workflow_version: str
    workflow_name: str
    generated_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())
    generated_by: str | None = "system"
    parameters: dict[str, Any] = Field(default_factory=dict)
    estimated_runtime: str
    risk_level: RiskLevel
    requires_confirmation: bool
    integrations: list[IntegrationType]
    capabilities: list[CapabilityType]
    execution_steps: list[ExecutionPlanStep]
    validation_summary: ValidationSummary

    class Config:
        frozen = True  # Immutable model design
