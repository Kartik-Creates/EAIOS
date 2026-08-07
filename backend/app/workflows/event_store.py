import logging
import threading
from typing import Dict, List, Optional

from app.workflows.events import WorkflowEvent, WorkflowEventType

logger = logging.getLogger("eaios.workflows.event_store")


class EventStore:
    """
    Append-Only Event Store.
    Preserves chronological order, thread safety, and immutability.
    Never updates existing events.
    """

    def __init__(self) -> None:
        self._events: List[WorkflowEvent] = []
        self._lock = threading.Lock()

    def append(self, event: WorkflowEvent) -> None:
        """Append an immutable event to the store."""
        with self._lock:
            self._events.append(event)
        logger.info("EventStore logged event '%s' [%s] for workflow '%s'", event.event_id, event.event_type.value, event.workflow_id)

    def get_by_correlation_id(self, correlation_id: str) -> List[WorkflowEvent]:
        """Return all events associated with a correlation_id in chronological order."""
        with self._lock:
            return [e for e in self._events if e.correlation_id == correlation_id]

    def get_by_execution_id(self, execution_id: str) -> List[WorkflowEvent]:
        """Return all events associated with an execution_id in chronological order."""
        with self._lock:
            return [e for e in self._events if e.execution_id == execution_id]

    def list_events(
        self,
        workflow_id: Optional[str] = None,
        event_type: Optional[WorkflowEventType] = None,
        actor: Optional[str] = None,
    ) -> List[WorkflowEvent]:
        """List events with optional filtering."""
        with self._lock:
            events = list(self._events)
            if workflow_id:
                events = [e for e in events if e.workflow_id == workflow_id]
            if event_type:
                events = [e for e in events if e.event_type == event_type]
            if actor:
                events = [e for e in events if e.actor == actor]
            return events

    def clear(self) -> None:
        """Clear store (primarily for unit tests)."""
        with self._lock:
            self._events.clear()


# Global Singleton EventStore Instance
event_store = EventStore()
