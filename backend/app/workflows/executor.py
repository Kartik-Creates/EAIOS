import logging
from typing import Any, Dict

from app.workflows.handlers import get_step_handler
from app.workflows.plan import ExecutionPlanStep
from app.workflows.step_result import StepResult

logger = logging.getLogger("eaios.workflows.executor")


class WorkflowExecutor:
    """
    Executes exactly one ExecutionPlanStep.
    Delegates to registered step handler.
    Does NOT manage workflow state, retries, or approvals.
    """

    def execute_step(
        self,
        step: ExecutionPlanStep,
        parameters: Dict[str, Any],
    ) -> StepResult:
        """Execute a single step using its corresponding handler."""
        logger.info("Executor executing step '%s' (%s → %s)", step.step_id, step.service, step.action)
        handler = get_step_handler(step.service)
        result = handler.execute(step, parameters)
        return result


# Global Singleton Executor Instance
executor = WorkflowExecutor()
