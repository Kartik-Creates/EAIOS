import logging
import threading
from typing import Any, Dict, List, Optional

from app.models.workflow import WorkflowRunStatus
from app.workflows.background_runner import background_runner
from app.workflows.execution import ExecutionResult
from app.workflows.orchestrator import orchestrator
from app.workflows.plan import ExecutionPlan
from app.workflows.planner import planner
from app.workflows.triggers import TriggerContext, TriggerType
from app.workflows.workflow_instance import WorkflowInstance

logger = logging.getLogger("eaios.workflows.trigger_engine")


class TriggerEngine:
    """
    Generic Trigger Engine.
    Receives trigger events from multiple sources (MANUAL, SCHEDULED, WEBHOOK, EVENT, etc.),
    creates a WorkflowInstance, generates an ExecutionPlan, and executes either synchronously or via BackgroundRunner.
    """

    def __init__(self) -> None:
        self._instances: Dict[str, WorkflowInstance] = {}
        self._lock = threading.Lock()

    def trigger_workflow(
        self,
        workflow_id: str,
        parameters: Dict[str, Any],
        context: TriggerContext,
        async_background: bool = False,
    ) -> Dict[str, Any]:
        """
        Trigger workflow invocation from any trigger source.
        Returns instance metadata and execution/background task results.
        """
        # 1. Create ExecutionPlan via Planner (Planner remains trigger-agnostic)
        plan = planner.create_plan(
            workflow_id=workflow_id,
            parameters=parameters,
            user_id=context.initiating_user or "system",
        )

        # 2. Construct parent WorkflowInstance
        instance = WorkflowInstance(
            workflow_id=plan.workflow_id,
            workflow_version=plan.workflow_version,
            trigger_type=context.trigger_type,
            trigger_context=context,
            correlation_id=plan.correlation_id,
            created_by=context.initiating_user or "system",
            current_status=WorkflowRunStatus.PENDING,
        )

        with self._lock:
            self._instances[instance.instance_id] = instance

        logger.info("Trigger Engine created WorkflowInstance '%s' via %s trigger", instance.instance_id, context.trigger_type.value)

        # 3. Dispatch execution
        if async_background:
            task_id = background_runner.queue_execution(plan)
            return {
                "instance_id": instance.instance_id,
                "correlation_id": instance.correlation_id,
                "background_task_id": task_id,
                "status": "QUEUED_BACKGROUND",
            }
        else:
            exec_result = orchestrator.execute_plan(plan)
            return {
                "instance_id": instance.instance_id,
                "correlation_id": instance.correlation_id,
                "execution_result": exec_result,
            }

    def list_instances(self, workflow_id: Optional[str] = None) -> List[WorkflowInstance]:
        with self._lock:
            instances = list(self._instances.values())
            if workflow_id:
                instances = [i for i in instances if i.workflow_id == workflow_id]
            return instances


# Global Singleton TriggerEngine Instance
trigger_engine = TriggerEngine()
