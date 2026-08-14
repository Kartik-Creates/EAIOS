import pytest
from app.models.workflow import WorkflowRunStatus
from app.workflows.adapters.exceptions import AdapterAuthenticationError, AdapterConfigurationError
from app.workflows.adapters.github_adapter import GitHubAdapter
from app.workflows.adapters.jira_adapter import JiraAdapter
from app.workflows.adapters.registry import adapter_registry
from app.workflows.enums import IntegrationType
from app.workflows.handlers import AdapterStepHandler
from app.workflows.plan import ExecutionPlanStep


def test_adapter_registry_resolution():
    jira_adapter = adapter_registry.get_adapter(IntegrationType.JIRA)
    assert jira_adapter is not None
    assert isinstance(jira_adapter, JiraAdapter)

    github_adapter = adapter_registry.get_adapter(IntegrationType.GITHUB)
    assert github_adapter is not None
    assert isinstance(github_adapter, GitHubAdapter)


def test_adapter_connection_validation():
    validation_res = adapter_registry.validate_integrations([IntegrationType.SLACK, IntegrationType.GITHUB])
    assert validation_res.get("Slack") is True
    assert validation_res.get("GitHub") is True


def test_handler_executes_via_adapter():
    handler = AdapterStepHandler()
    step = ExecutionPlanStep(
        step_id="step_jira_1",
        order=1,
        title="Create Jira Issue",
        description="Creates ticket via Jira adapter",
        service="JiraService",
        action="create_issue",
        requires_confirmation=False,
    )
    result = handler.execute(step, parameters={"project_key": "EAIOS"})

    assert result.status == WorkflowRunStatus.COMPLETED
    assert result.outputs.get("jira_issue_key") == "EAIOS-104"
    assert result.outputs.get("provider") == "Jira"


def test_handler_normalizes_adapter_error():
    handler = AdapterStepHandler()
    step = ExecutionPlanStep(
        step_id="step_invalid_action",
        order=1,
        title="Invalid Action",
        description="Triggers unsupported action in Slack adapter",
        service="SlackService",
        action="unsupported_action_123",
        requires_confirmation=False,
    )
    result = handler.execute(step, parameters={})

    assert result.status == WorkflowRunStatus.FAILED
    assert result.error is not None
    assert "[Slack]" in result.error
    assert result.retryable is False
