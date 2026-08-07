import logging
from typing import List, Optional

from app.schemas.workflow import WorkflowDefinition
from app.workflows.approval_models import ApprovalDecision
from app.workflows.approval_rules import (
    AdminRoleRule,
    BasePolicyRule,
    CriticalRiskRule,
    ExplicitConfirmationRule,
    HighRiskRule,
)
from app.workflows.enums import RiskLevel
from app.workflows.plan import ExecutionPlan
from app.workflows.registry import workflow_registry

logger = logging.getLogger("eaios.workflows.policy")


class PolicyEngine:
    """
    Deterministic Policy Engine.
    Evaluates policy rules against an ExecutionPlan and WorkflowDefinition.
    Does NOT create approval requests or manage execution state.
    """

    def __init__(self, rules: Optional[List[BasePolicyRule]] = None) -> None:
        self._rules = rules or [
            CriticalRiskRule(),
            HighRiskRule(),
            ExplicitConfirmationRule(),
            AdminRoleRule(),
        ]

    def evaluate(self, plan: ExecutionPlan) -> ApprovalDecision:
        """Evaluate registered policy rules and produce an ApprovalDecision."""
        workflow_def = workflow_registry.get(plan.workflow_id, version=plan.workflow_version)

        reasons: List[str] = []
        evaluated_rules: List[str] = []
        approver_role = "manager"

        for rule in self._rules:
            evaluated_rules.append(rule.rule_name)
            reason = rule.evaluate(plan, workflow_def)
            if reason:
                reasons.append(reason)
                if plan.risk_level == RiskLevel.CRITICAL or (workflow_def and workflow_def.required_role == "admin"):
                    approver_role = "admin"

        requires_approval = len(reasons) > 0
        approval_reason = " | ".join(reasons) if requires_approval else None

        decision = ApprovalDecision(
            requires_approval=requires_approval,
            approval_reason=approval_reason,
            approval_level=1,
            approver_role=approver_role,
            required_approvals=1,
            evaluated_rules=evaluated_rules,
        )

        logger.info("Evaluated Policy Engine for plan '%s': requires_approval=%s", plan.plan_id, requires_approval)
        return decision


# Global Singleton Policy Engine Instance
policy_engine = PolicyEngine()
