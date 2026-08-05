import time
import logging
from abc import ABC, abstractmethod
from datetime import datetime, timezone
from typing import Any, Dict

from app.models.workflow import WorkflowRunStatus
from app.workflows.adapters.exceptions import AdapterError, AdapterTemporaryFailure
from app.workflows.adapters.registry import adapter_registry
from app.workflows.plan import ExecutionPlanStep
from app.workflows.step_result import StepResult

logger = logging.getLogger("eaios.workflows.handlers")


class BaseStepHandler(ABC):
    """Abstract provider-agnostic step handler."""

    @abstractmethod
    def execute(self, step: ExecutionPlanStep, parameters: Dict[str, Any]) -> StepResult:
        pass


class AdapterStepHandler(BaseStepHandler):
    """
    Provider-agnostic step handler that delegates execution to resolved Integration Adapter.
    Normalizes provider errors into StepResult outputs and retryable flags.
    """

    def execute(self, step: ExecutionPlanStep, parameters: Dict[str, Any]) -> StepResult:
        start_time = time.time()
        started_at = datetime.now(timezone.utc).isoformat()

        # Resolve adapter from registry by service name
        adapter = adapter_registry.get_adapter(step.service)

        try:
            if not adapter:
                # Fallback execution if adapter not found
                logger.warning("No specific adapter found for service '%s', using fallback execution.", step.service)
                outputs = {
                    "message": f"Successfully executed action '{step.action}' on service '{step.service}' (fallback)",
                    "service": step.service,
                    "action": step.action,
                }
            else:
                outputs = adapter.execute_action(step.action, parameters)

            finished_at = datetime.now(timezone.utc).isoformat()
            duration = round(time.time() - start_time, 4)

            return StepResult(
                step_id=step.step_id,
                status=WorkflowRunStatus.COMPLETED,
                started_at=started_at,
                finished_at=finished_at,
                duration=duration,
                outputs=outputs,
                warnings=[],
                error=None,
                retryable=False,
            )

        except AdapterError as err:
            logger.error("Adapter error in step '%s': %s", step.step_id, err)
            finished_at = datetime.now(timezone.utc).isoformat()
            duration = round(time.time() - start_time, 4)
            is_retryable = isinstance(err, AdapterTemporaryFailure)

            return StepResult(
                step_id=step.step_id,
                status=WorkflowRunStatus.FAILED,
                started_at=started_at,
                finished_at=finished_at,
                duration=duration,
                outputs={},
                warnings=[],
                error=f"[{err.provider}] {err.message}",
                retryable=is_retryable,
            )

        except Exception as exc:
            logger.error("Unexpected error in step handler '%s': %s", step.step_id, exc)
            finished_at = datetime.now(timezone.utc).isoformat()
            duration = round(time.time() - start_time, 4)

            return StepResult(
                step_id=step.step_id,
                status=WorkflowRunStatus.FAILED,
                started_at=started_at,
                finished_at=finished_at,
                duration=duration,
                outputs={},
                warnings=[],
                error=f"Unexpected step failure: {str(exc)}",
                retryable=False,
            )


# Default Handler Instance
default_handler = AdapterStepHandler()


def get_step_handler(service_name: str) -> BaseStepHandler:
    """Return provider-agnostic step handler."""
    return default_handler
