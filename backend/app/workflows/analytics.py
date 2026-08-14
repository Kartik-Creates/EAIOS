from typing import Any, Dict, List, Optional
from pydantic import BaseModel, Field

from app.workflows.event_store import event_store
from app.workflows.events import WorkflowEventType


class WorkflowAnalyticsSummary(BaseModel):
    total_executions: int = 0
    successful_executions: int = 0
    failed_executions: int = 0
    cancelled_executions: int = 0
    success_rate: float = 0.0
    average_duration: float = 0.0
    total_retries: int = 0
    approval_latency_avg: float = 0.0
    circuit_breaker_trips: int = 0


class AnalyticsEngine:
    """
    Analytics & Monitoring Engine.
    Computes workflow metrics, success rates, average duration, and error analytics from Event Store.
    """

    def compute_metrics(self, workflow_id: Optional[str] = None) -> WorkflowAnalyticsSummary:
        events = event_store.list_events(workflow_id=workflow_id)
        if not events:
            return WorkflowAnalyticsSummary()

        completed_events = [e for e in events if e.event_type == WorkflowEventType.EXECUTION_COMPLETED]
        failed_events = [e for e in events if e.event_type == WorkflowEventType.EXECUTION_FAILED]
        cancelled_events = [e for e in events if e.event_type == WorkflowEventType.EXECUTION_CANCELLED]

        total_execs = len(completed_events) + len(failed_events) + len(cancelled_events)
        success_rate = (len(completed_events) / total_execs * 100.0) if total_execs > 0 else 0.0

        durations = [e.metadata.get("total_duration", 0.0) for e in completed_events if "total_duration" in e.metadata]
        avg_dur = (sum(durations) / len(durations)) if durations else 0.0

        return WorkflowAnalyticsSummary(
            total_executions=total_execs,
            successful_executions=len(completed_events),
            failed_executions=len(failed_events),
            cancelled_executions=len(cancelled_events),
            success_rate=round(success_rate, 2),
            average_duration=round(avg_dur, 4),
            total_retries=len([e for e in events if e.metadata.get("is_retry")]),
            approval_latency_avg=0.0,
            circuit_breaker_trips=0,
        )


# Global Singleton AnalyticsEngine Instance
analytics_engine = AnalyticsEngine()
