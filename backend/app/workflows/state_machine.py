import enum
from typing import Set


class WorkflowState(str, enum.Enum):
    CREATED = "CREATED"
    VALIDATED = "VALIDATED"
    READY = "READY"
    RUNNING = "RUNNING"
    PAUSED = "PAUSED"
    WAITING_CONFIRMATION = "WAITING_CONFIRMATION"
    COMPLETED = "COMPLETED"
    FAILED = "FAILED"
    CANCELLED = "CANCELLED"


class InvalidStateTransitionError(Exception):
    """Raised when an invalid state transition is attempted."""
    def __init__(self, current_state: WorkflowState, target_state: WorkflowState):
        super().__init__(f"Cannot transition workflow from '{current_state.value}' to '{target_state.value}'.")
        self.current_state = current_state
        self.target_state = target_state


class WorkflowStateMachine:
    """
    Explicit lifecycle state machine enforcing valid workflow state transitions.
    """

    ALLOWED_TRANSITIONS: dict[WorkflowState, Set[WorkflowState]] = {
        WorkflowState.CREATED: {WorkflowState.VALIDATED, WorkflowState.CANCELLED, WorkflowState.FAILED},
        WorkflowState.VALIDATED: {WorkflowState.READY, WorkflowState.CANCELLED, WorkflowState.FAILED},
        WorkflowState.READY: {WorkflowState.RUNNING, WorkflowState.WAITING_CONFIRMATION, WorkflowState.CANCELLED},
        WorkflowState.RUNNING: {
            WorkflowState.PAUSED,
            WorkflowState.WAITING_CONFIRMATION,
            WorkflowState.COMPLETED,
            WorkflowState.FAILED,
            WorkflowState.CANCELLED,
        },
        WorkflowState.PAUSED: {WorkflowState.RUNNING, WorkflowState.CANCELLED},
        WorkflowState.WAITING_CONFIRMATION: {WorkflowState.RUNNING, WorkflowState.CANCELLED, WorkflowState.FAILED},
        WorkflowState.COMPLETED: set(),
        WorkflowState.FAILED: set(),
        WorkflowState.CANCELLED: set(),
    }

    def __init__(self, initial_state: WorkflowState = WorkflowState.CREATED) -> None:
        self._current_state = initial_state

    @property
    def current_state(self) -> WorkflowState:
        return self._current_state

    def transition_to(self, target_state: WorkflowState) -> WorkflowState:
        """Attempt to transition to target_state. Raises InvalidStateTransitionError if invalid."""
        if target_state not in self.ALLOWED_TRANSITIONS[self._current_state]:
            raise InvalidStateTransitionError(self._current_state, target_state)

        self._current_state = target_state
        return self._current_state
