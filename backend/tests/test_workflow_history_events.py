import pytest
from app.models.workflow import WorkflowRunStatus
from app.workflows.audit_service import audit_service
from app.workflows.event_store import event_store
from app.workflows.events import WorkflowEvent, WorkflowEventType
from app.workflows.history_service import history_service
from app.workflows.orchestrator import WorkflowOrchestrator
from app.workflows.planner import WorkflowPlanner


def test_event_creation_and_append_only():
    event_store.clear()
    event = audit_service.record_event(
        event_type=WorkflowEventType.PLAN_CREATED,
        correlation_id="cid_test_123",
        workflow_id="daily_brief",
        workflow_version="1.0.0",
        actor="test_user",
    )

    assert isinstance(event, WorkflowEvent)
    assert event.correlation_id == "cid_test_123"

    # Event immutability test
    with pytest.raises(Exception):
        event.workflow_id = "mutated_id"

    stored_events = event_store.get_by_correlation_id("cid_test_123")
    assert len(stored_events) == 1
    assert stored_events[0].event_id == event.event_id


def test_correlation_id_propagation_across_lifecycle():
    event_store.clear()
    planner = WorkflowPlanner()
    orchestrator = WorkflowOrchestrator()

    plan = planner.create_plan(
        workflow_id="daily_brief",
        parameters={"timeframe": "last_24h", "channel": "#general"},
    )
    correlation_id = plan.correlation_id
    assert correlation_id.startswith("cid_")

    res = orchestrator.execute_plan(plan)
    assert res.correlation_id == correlation_id

    events = event_store.get_by_correlation_id(correlation_id)
    assert len(events) >= 4  # PLAN_CREATED, VALIDATION_COMPLETED, EXECUTION_STARTED, STEP_STARTED...
    event_types = [e.event_type for e in events]
    assert WorkflowEventType.PLAN_CREATED in event_types
    assert WorkflowEventType.EXECUTION_STARTED in event_types
    assert WorkflowEventType.EXECUTION_COMPLETED in event_types


def test_execution_history_derivation():
    event_store.clear()
    planner = WorkflowPlanner()
    orchestrator = WorkflowOrchestrator()

    plan = planner.create_plan(
        workflow_id="daily_brief",
        parameters={"timeframe": "last_24h", "channel": "#general"},
    )
    res = orchestrator.execute_plan(plan)

    hist = history_service.get_execution_history(res.execution_id)
    assert hist is not None
    assert hist.execution_id == res.execution_id
    assert hist.correlation_id == res.correlation_id
    assert hist.status == WorkflowRunStatus.COMPLETED
    assert hist.completed_steps == 2
