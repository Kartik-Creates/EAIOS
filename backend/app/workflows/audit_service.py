from typing import Any

from app.workflows.event_store import event_store
from app.workflows.events import WorkflowEvent, WorkflowEventType


class AuditService:
    """
    Audit Service for recording lifecycle events and querying audit logs.
    Does NOT contain business execution logic.
    """

    def record_event(
        self,
        event_type: WorkflowEventType,
        correlation_id: str,
        workflow_id: str,
        workflow_version: str = "1.0.0",
        execution_id: str | None = None,
        step_id: str | None = None,
        actor: str = "system",
        metadata: dict[str, Any] | None = None,
    ) -> WorkflowEvent:
        event = WorkflowEvent(
            event_type=event_type,
            correlation_id=correlation_id,
            workflow_id=workflow_id,
            workflow_version=workflow_version,
            execution_id=execution_id,
            step_id=step_id,
            actor=actor,
            metadata=metadata or {},
        )
        event_store.append(event)
        return event

    def query_audit_logs(
        self,
        workflow_id: str | None = None,
        event_type: WorkflowEventType | None = None,
        actor: str | None = None,
        correlation_id: str | None = None,
    ) -> list[WorkflowEvent]:
        if correlation_id:
            return event_store.get_by_correlation_id(correlation_id)
        return event_store.list_events(workflow_id=workflow_id, event_type=event_type, actor=actor)


# Global Singleton AuditService Instance
audit_service = AuditService()
