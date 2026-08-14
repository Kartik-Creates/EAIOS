import pytest
from app.workflows.background_runner import background_runner
from app.workflows.scheduler import ScheduleType, scheduler
from app.workflows.trigger_engine import trigger_engine
from app.workflows.triggers import TriggerContext, TriggerType


def test_trigger_context_generation():
    ctx = TriggerContext(
        trigger_type=TriggerType.MANUAL,
        source="user_interface",
        initiating_user="test_user",
    )
    assert ctx.trigger_id.startswith("trig_")
    assert ctx.trigger_type == TriggerType.MANUAL
    assert ctx.source == "user_interface"


def test_trigger_engine_manual_invocation():
    ctx = TriggerContext(trigger_type=TriggerType.MANUAL, source="unit_test")
    res = trigger_engine.trigger_workflow(
        workflow_id="daily_brief",
        parameters={"timeframe": "last_24h", "channel": "#general"},
        context=ctx,
        async_background=False,
    )

    assert "instance_id" in res
    assert "correlation_id" in res
    from app.models.workflow import WorkflowRunStatus
    assert res["execution_result"].overall_status == WorkflowRunStatus.COMPLETED


def test_trigger_engine_background_invocation():
    ctx = TriggerContext(trigger_type=TriggerType.WEBHOOK, source="github_webhook")
    res = trigger_engine.trigger_workflow(
        workflow_id="daily_brief",
        parameters={"timeframe": "last_24h", "channel": "#general"},
        context=ctx,
        async_background=True,
    )

    assert "background_task_id" in res
    assert res["status"] == "QUEUED_BACKGROUND"


def test_scheduler_job_creation_and_deletion():
    job = scheduler.create_schedule(
        workflow_id="release_notes",
        schedule_type=ScheduleType.CRON,
        cron_expression="0 9 * * 1",
        parameters={"repository": "owner/repo"},
    )

    assert job.schedule_id.startswith("sched_")
    assert job.schedule_type == ScheduleType.CRON
    assert job.cron_expression == "0 9 * * 1"

    schedules = scheduler.list_schedules(workflow_id="release_notes")
    assert len(schedules) >= 1

    deleted = scheduler.delete_schedule(job.schedule_id)
    assert deleted is True


def test_scheduler_validation_errors():
    with pytest.raises(ValueError):
        scheduler.create_schedule(
            workflow_id="release_notes",
            schedule_type=ScheduleType.CRON,
            cron_expression=None,  # Missing cron expression
        )

    with pytest.raises(ValueError):
        scheduler.create_schedule(
            workflow_id="release_notes",
            schedule_type=ScheduleType.ONE_TIME,
            run_at=None,  # Missing run_at timestamp
        )
