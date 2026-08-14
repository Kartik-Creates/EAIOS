import logging
from typing import Any, Dict, List, Optional

from app.workflows.plan import ExecutionPlan
from app.workflows.planner import planner
from app.workflows.registry import workflow_registry

logger = logging.getLogger("eaios.workflows.sub_workflow")


class CircularSubWorkflowError(Exception):
    """Raised when a sub-workflow causes a circular reference chain."""
    pass


class SubWorkflowEngine:
    """
    Sub-Workflow & Workflow Composition Engine.
    Enables workflow steps to invoke other registered workflows while detecting and preventing circular references.
    """

    def expand_sub_workflow(
        self,
        sub_workflow_id: str,
        parameters: Dict[str, Any],
        call_stack: Optional[List[str]] = None,
    ) -> ExecutionPlan:
        stack = list(call_stack or [])
        if sub_workflow_id in stack:
            chain = " -> ".join(stack + [sub_workflow_id])
            raise CircularSubWorkflowError(f"Circular sub-workflow invocation chain detected: {chain}")

        stack.append(sub_workflow_id)
        sub_def = workflow_registry.get(sub_workflow_id)
        if not sub_def:
            raise ValueError(f"Sub-workflow '{sub_workflow_id}' not found in registry.")

        logger.info("Expanding sub-workflow '%s' (depth=%d)", sub_workflow_id, len(stack))
        return planner.create_plan(workflow_id=sub_workflow_id, parameters=parameters)


# Global Singleton SubWorkflowEngine Instance
sub_workflow_engine = SubWorkflowEngine()
