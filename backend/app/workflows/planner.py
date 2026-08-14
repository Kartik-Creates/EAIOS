from typing import Any, Dict, Optional
import logging

from app.workflows.audit_service import audit_service
from app.workflows.events import WorkflowEventType
from app.workflows.exceptions import WorkflowNotFoundError
from app.workflows.plan import ExecutionPlan, ExecutionPlanStep
from app.workflows.registry import workflow_registry
from app.workflows.validator import ParameterValidator

logger = logging.getLogger("eaios.workflows.planner")


class WorkflowPlanner:
    """
    Deterministic Pure Planning Engine.
    Converts a static WorkflowDefinition into an immutable ExecutionPlan.
    Records planning events in AuditService.
    """

    def create_plan(
        self,
        workflow_id: str,
        parameters: Dict[str, Any],
        user_id: Optional[str] = "system",
        version: Optional[str] = None,
    ) -> ExecutionPlan:
        """
        Build an ExecutionPlan for the specified workflow definition and inputs.
        """
        workflow_def = workflow_registry.get(workflow_id, version=version)
        if not workflow_def:
            raise WorkflowNotFoundError(workflow_id, version)

        # 1. Validate Input Parameters
        validation_summary = ParameterValidator.validate(
            schema=workflow_def.parameter_schema,
            inputs=parameters,
        )

        # 2. Map Execution Steps
        steps = [
            ExecutionPlanStep(
                step_id=step.id,
                order=idx + 1,
                title=step.title,
                description=step.description,
                service=step.service,
                action=step.action,
                requires_confirmation=step.requires_confirmation or workflow_def.requires_confirmation,
            )
            for idx, step in enumerate(workflow_def.execution_steps)
        ]

        # 3. Construct Immutable ExecutionPlan
        plan = ExecutionPlan(
            workflow_id=workflow_def.id,
            workflow_version=workflow_def.version,
            workflow_name=workflow_def.name,
            generated_by=user_id or "system",
            parameters=parameters,
            estimated_runtime=workflow_def.estimated_runtime,
            risk_level=workflow_def.risk_level,
            requires_confirmation=workflow_def.requires_confirmation,
            integrations=workflow_def.integrations,
            capabilities=workflow_def.capabilities,
            execution_steps=steps,
            validation_summary=validation_summary,
        )

        # Record Events
        audit_service.record_event(
            event_type=WorkflowEventType.PLAN_CREATED,
            correlation_id=plan.correlation_id,
            workflow_id=plan.workflow_id,
            workflow_version=plan.workflow_version,
            actor=user_id or "system",
            metadata={"plan_id": plan.plan_id, "workflow_name": plan.workflow_name},
        )
        audit_service.record_event(
            event_type=WorkflowEventType.VALIDATION_COMPLETED,
            correlation_id=plan.correlation_id,
            workflow_id=plan.workflow_id,
            workflow_version=plan.workflow_version,
            actor=user_id or "system",
            metadata={"is_valid": validation_summary.is_valid, "errors_count": len(validation_summary.errors)},
        )

        logger.info("Generated execution plan '%s' for workflow '%s' (v%s)", plan.plan_id, plan.workflow_id, plan.workflow_version)
        return plan


# Global Singleton Planner Instance
planner = WorkflowPlanner()
