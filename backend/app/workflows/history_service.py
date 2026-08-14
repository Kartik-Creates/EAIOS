from typing import List, Optional

from app.models.workflow import WorkflowRunStatus
from app.workflows.event_store import event_store
from app.workflows.events import WorkflowEventType
from app.workflows.history_models import ExecutionHistorySummary


class HistoryService:
    """
    Service for building and deriving summarized execution histories directly from stored events.
    """

    def get_execution_history(self, execution_id: str) -> Optional[ExecutionHistorySummary]:
        events = event_store.get_by_execution_id(execution_id)
        if not events:
            return None

        first_event = events[0]
        last_event = events[-1]

        workflow_id = first_event.workflow_id
        version = first_event.workflow_version
        correlation_id = first_event.correlation_id
        actor = first_event.actor

        # Derive status & metrics from event trail
        completed_steps = len([e for e in events if e.event_type == WorkflowEventType.STEP_COMPLETED])
        total_steps = len([e for e in events if e.event_type == WorkflowEventType.STEP_STARTED])

        status = WorkflowRunStatus.COMPLETED
        if any(e.event_type == WorkflowEventType.EXECUTION_FAILED for e in events):
            status = WorkflowRunStatus.FAILED
        elif any(e.event_type == WorkflowEventType.APPROVAL_REQUESTED for e in events) and not any(
            e.event_type == WorkflowEventType.APPROVAL_GRANTED for e in events
        ):
            status = WorkflowRunStatus.AWAITING_APPROVAL

        approval_summary = None
        app_events = [e for e in events if e.event_type in (WorkflowEventType.APPROVAL_REQUESTED, WorkflowEventType.APPROVAL_GRANTED, WorkflowEventType.APPROVAL_REJECTED)]
        if app_events:
            app_req = app_events[0]
            approval_summary = {
                "request_id": app_req.metadata.get("approval_request_id"),
                "reason": app_req.metadata.get("approval_reason"),
                "status": app_events[-1].event_type.value,
            }

        step_summary = []
        for e in events:
            if e.event_type in (WorkflowEventType.STEP_COMPLETED, WorkflowEventType.STEP_FAILED):
                step_summary.append({
                    "step_id": e.step_id,
                    "status": e.event_type.value,
                    "metadata": e.metadata,
                })

        return ExecutionHistorySummary(
            execution_id=execution_id,
            correlation_id=correlation_id,
            workflow_id=workflow_id,
            workflow_version=version,
            workflow_name=first_event.metadata.get("workflow_name", workflow_id),
            status=status,
            started_at=first_event.timestamp,
            completed_at=last_event.timestamp if status in (WorkflowRunStatus.COMPLETED, WorkflowRunStatus.FAILED) else None,
            total_duration=last_event.metadata.get("total_duration", 0.0),
            actor=actor,
            approval_summary=approval_summary,
            step_summary=step_summary,
            total_steps=total_steps,
            completed_steps=completed_steps,
        )

    def list_histories(
        self,
        workflow_id: Optional[str] = None,
        status: Optional[WorkflowRunStatus] = None,
        correlation_id: Optional[str] = None,
    ) -> List[ExecutionHistorySummary]:
        if correlation_id:
            events = event_store.get_by_correlation_id(correlation_id)
            exec_ids = list({e.execution_id for e in events if e.execution_id})
        else:
            all_events = event_store.list_events(workflow_id=workflow_id)
            exec_ids = list({e.execution_id for e in all_events if e.execution_id})

        summaries = []
        for eid in exec_ids:
            hist = self.get_execution_history(eid)
            if hist:
                if status and hist.status != status:
                    continue
                summaries.append(hist)

        return sorted(summaries, key=lambda h: h.started_at, reverse=True)


# Global Singleton HistoryService Instance
history_service = HistoryService()
