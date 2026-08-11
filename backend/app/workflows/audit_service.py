from typing import Any, Dict, List, Optional

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
        execution_id: Optional[str] = None,
        step_id: Optional[str] = None,
        actor: str = "system",
        metadata: Optional[Dict[str, Any]] = None,
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
        workflow_id: Optional[str] = None,
        event_type: Optional[WorkflowEventType] = None,
        actor: Optional[str] = None,
        correlation_id: Optional[str] = None,
    ) -> List[WorkflowEvent]:
        if correlation_id:
            return event_store.get_by_correlation_id(correlation_id)
        return event_store.list_events(workflow_id=workflow_id, event_type=event_type, actor=actor)


# Global Singleton AuditService Instance
audit_service = AuditService()
