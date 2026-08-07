import pytest
from app.workflows.exceptions import WorkflowNotFoundError
from app.workflows.planner import WorkflowPlanner
from app.workflows.registry import workflow_registry


def test_planner_valid_execution_plan():
    planner = WorkflowPlanner()
    plan = planner.create_plan(
        workflow_id="daily_brief",
        parameters={"timeframe": "last_24h", "channel": "#daily-briefs"},
        user_id="user_test_123",
    )

    assert plan.workflow_id == "daily_brief"
    assert plan.workflow_version == "1.0.0"
    assert plan.generated_by == "user_test_123"
    assert plan.validation_summary.is_valid is True
    assert len(plan.validation_summary.errors) == 0
    assert len(plan.execution_steps) == 2
    assert plan.execution_steps[0].order == 1
    assert plan.execution_steps[1].order == 2


def test_planner_missing_required_parameter():
    planner = WorkflowPlanner()
    plan = planner.create_plan(
        workflow_id="daily_brief",
        parameters={"timeframe": "last_24h"},  # Channel missing
    )

    assert plan.validation_summary.is_valid is False
    assert len(plan.validation_summary.errors) == 1
    assert plan.validation_summary.errors[0].field_id == "channel"


def test_planner_invalid_enum_option():
    planner = WorkflowPlanner()
    plan = planner.create_plan(
        workflow_id="daily_brief",
        parameters={"timeframe": "invalid_range", "channel": "#daily-briefs"},
    )

    assert plan.validation_summary.is_valid is False
    assert any("must be one of" in err.message for err in plan.validation_summary.errors)


def test_planner_workflow_not_found():
    planner = WorkflowPlanner()
    with pytest.raises(WorkflowNotFoundError):
        planner.create_plan(
            workflow_id="non_existent_workflow",
            parameters={},
        )
