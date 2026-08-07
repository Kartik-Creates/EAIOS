import pytest
from app.models.workflow import WorkflowRunStatus
from app.workflows.executor import WorkflowExecutor
from app.workflows.orchestrator import WorkflowOrchestrator
from app.workflows.plan import ExecutionPlanStep
from app.workflows.planner import WorkflowPlanner
from app.workflows.state_machine import InvalidStateTransitionError, WorkflowState, WorkflowStateMachine


def test_state_machine_valid_transitions():
    sm = WorkflowStateMachine(WorkflowState.CREATED)
    assert sm.current_state == WorkflowState.CREATED
    sm.transition_to(WorkflowState.VALIDATED)
    assert sm.current_state == WorkflowState.VALIDATED
    sm.transition_to(WorkflowState.READY)
    assert sm.current_state == WorkflowState.READY
    sm.transition_to(WorkflowState.RUNNING)
    assert sm.current_state == WorkflowState.RUNNING
    sm.transition_to(WorkflowState.COMPLETED)
    assert sm.current_state == WorkflowState.COMPLETED


def test_state_machine_invalid_transition_raises():
    sm = WorkflowStateMachine(WorkflowState.CREATED)
    with pytest.raises(InvalidStateTransitionError):
        sm.transition_to(WorkflowState.COMPLETED)  # Cannot jump from CREATED directly to COMPLETED


def test_executor_single_step():
    executor = WorkflowExecutor()
    step = ExecutionPlanStep(
        step_id="step_test_1",
        order=1,
        title="Test Step",
        description="Testing single step executor",
        service="JiraService",
        action="create_issue",
        requires_confirmation=False,
    )
    result = executor.execute_step(step, parameters={"summary": "Test issue"})
    assert result.step_id == "step_test_1"
    assert result.status == WorkflowRunStatus.COMPLETED
    assert result.outputs.get("jira_issue_key") == "EAIOS-104"
    assert result.duration >= 0


def test_orchestrator_successful_execution():
    planner = WorkflowPlanner()
    orchestrator = WorkflowOrchestrator()

    plan = planner.create_plan(
        workflow_id="daily_brief",
        parameters={"timeframe": "last_24h", "channel": "#daily-briefs"},
    )
    res = orchestrator.execute_plan(plan)

    assert res.workflow_id == "daily_brief"
    assert res.overall_status == WorkflowRunStatus.COMPLETED
    assert res.completed_steps == 2
    assert res.failed_steps == 0
    assert res.skipped_steps == 0
    assert len(res.step_results) == 2
    assert res.execution_summary["state"] == "COMPLETED"


def test_orchestrator_failed_validation_plan():
    planner = WorkflowPlanner()
    orchestrator = WorkflowOrchestrator()

    # Invalid plan with missing required channel
    plan = planner.create_plan(
        workflow_id="daily_brief",
        parameters={"timeframe": "last_24h"},
    )
    res = orchestrator.execute_plan(plan)

    assert res.overall_status == WorkflowRunStatus.FAILED
    assert res.completed_steps == 0
    assert res.skipped_steps == 2
    assert len(res.step_results) == 0
