from abc import ABC, abstractmethod
from typing import Optional

from app.schemas.workflow import WorkflowDefinition
from app.workflows.enums import RiskLevel
from app.workflows.plan import ExecutionPlan


class BasePolicyRule(ABC):
    """Abstract base rule contract for Policy Engine."""

    @property
    @abstractmethod
    def rule_name(self) -> str:
        pass

    @abstractmethod
    def evaluate(self, plan: ExecutionPlan, workflow_def: Optional[WorkflowDefinition]) -> Optional[str]:
        """
        Evaluate rule. Returns reason string if approval is required, otherwise None.
        """
        pass


class HighRiskRule(BasePolicyRule):
    @property
    def rule_name(self) -> str:
        return "HIGH_RISK_RULE"

    def evaluate(self, plan: ExecutionPlan, workflow_def: Optional[WorkflowDefinition]) -> Optional[str]:
        if plan.risk_level == RiskLevel.HIGH:
            return "Approval required due to HIGH risk classification."
        return None


class CriticalRiskRule(BasePolicyRule):
    @property
    def rule_name(self) -> str:
        return "CRITICAL_RISK_RULE"

    def evaluate(self, plan: ExecutionPlan, workflow_def: Optional[WorkflowDefinition]) -> Optional[str]:
        if plan.risk_level == RiskLevel.CRITICAL:
            return "Privileged Admin approval required due to CRITICAL risk classification."
        return None


class ExplicitConfirmationRule(BasePolicyRule):
    @property
    def rule_name(self) -> str:
        return "EXPLICIT_CONFIRMATION_RULE"

    def evaluate(self, plan: ExecutionPlan, workflow_def: Optional[WorkflowDefinition]) -> Optional[str]:
        if plan.requires_confirmation:
            return "Workflow definition explicitly requires human confirmation before execution."
        return None


class AdminRoleRule(BasePolicyRule):
    @property
    def rule_name(self) -> str:
        return "ADMIN_ROLE_RULE"

    def evaluate(self, plan: ExecutionPlan, workflow_def: Optional[WorkflowDefinition]) -> Optional[str]:
        if workflow_def and workflow_def.required_role == "admin":
            return "Approval required for Admin-scoped workflow operations."
        return None
