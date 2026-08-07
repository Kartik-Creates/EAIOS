import pytest
from app.schemas.workflow import WorkflowDefinition
from app.workflows.definitions.reporting import DAILY_BRIEF
from app.workflows.hardening import RateLimiter, RateLimiterExceededError, hardening_service
from app.workflows.registry import workflow_registry
from app.workflows.templates import template_service
from app.workflows.versioning import VersionState, version_manager


def test_versioning_draft_and_publish():
    draft_record = version_manager.create_draft(DAILY_BRIEF)
    assert draft_record.state == VersionState.DRAFT

    pub_record = version_manager.publish_version(DAILY_BRIEF.id, DAILY_BRIEF.version)
    assert pub_record.state == VersionState.PUBLISHED
    assert pub_record.published_at is not None


def test_workflow_cloning():
    cloned = version_manager.clone_workflow(
        source_workflow_id="daily_brief",
        new_workflow_id="cloned_daily_brief",
        new_name="Cloned Daily Briefing",
    )
    assert cloned.id == "cloned_daily_brief"
    assert cloned.name == "Cloned Daily Briefing"
    assert workflow_registry.get("cloned_daily_brief") is not None


def test_template_library_installation():
    templates = template_service.list_templates()
    assert len(templates) >= 4

    installed = template_service.install_template("tpl_release_notes")
    assert installed.id == "release_notes"
    assert workflow_registry.get("release_notes") is not None


def test_rate_limiter_exceeded():
    limiter = RateLimiter(max_requests=2, window_seconds=60.0)
    limiter.check_rate_limit()
    limiter.check_rate_limit()

    with pytest.raises(RateLimiterExceededError):
        limiter.check_rate_limit()


def test_system_health_report():
    health = hardening_service.get_health()
    assert health.status == "HEALTHY"
    assert health.uptime >= 0.0
    assert isinstance(health.circuit_breaker_summary, dict)
