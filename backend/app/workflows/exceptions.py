from typing import Any, Dict, List, Optional


class WorkflowPlanningError(Exception):
    """Base exception for workflow planning errors."""
    pass


class WorkflowNotFoundError(WorkflowPlanningError):
    """Raised when requested workflow ID is not registered."""
    def __init__(self, workflow_id: str, version: Optional[str] = None):
        msg = f"Workflow '{workflow_id}'" + (f" version '{version}'" if version else "") + " not found in registry."
        super().__init__(msg)
        self.workflow_id = workflow_id
        self.version = version


class ParameterValidationError(WorkflowPlanningError):
    """Raised when parameter input validation fails."""
    def __init__(self, errors: List[Dict[str, Any]]):
        self.errors = errors
        msg = f"Parameter validation failed with {len(errors)} error(s)."
        super().__init__(msg)
