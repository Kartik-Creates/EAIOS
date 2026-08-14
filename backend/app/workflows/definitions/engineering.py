from app.schemas.workflow import (
    WorkflowDefinition,
    WorkflowParameter,
    WorkflowStepDefinition,
)
from app.workflows.enums import (
    CapabilityType,
    IntegrationType,
    ParameterType,
    RiskLevel,
    WorkflowCategory,
)

RELEASE_NOTES = WorkflowDefinition(
    id="release_notes",
    version="1.0.0",
    name="GitHub Release Notes Generator",
    description="Analyzes merged pull requests between git tags and drafts formatted release notes.",
    category=WorkflowCategory.ENGINEERING,
    icon="GitPullRequest",
    required_role="manager",
    risk_level=RiskLevel.HIGH,
    estimated_runtime="~30s",
    requires_confirmation=True,
    integrations=[IntegrationType.GITHUB, IntegrationType.SLACK],
    capabilities=[CapabilityType.READ_GITHUB, CapabilityType.UPDATE_GITHUB, CapabilityType.POST_SLACK],
    parameter_schema=[
        WorkflowParameter(
            id="repository",
            label="GitHub Repository",
            description="Repository full name (owner/repo)",
            type=ParameterType.STRING,
            required=True,
            placeholder="Kartik-Creates/EAIOS",
        ),
        WorkflowParameter(
            id="tag_name",
            label="Release Tag",
            description="Version tag name (e.g. v1.2.0)",
            type=ParameterType.STRING,
            required=True,
        ),
    ],
    execution_steps=[
        WorkflowStepDefinition(
            id="step_compare",
            title="Compare Tags",
            description="Lists all PRs merged since previous tag",
            service="GitHubService",
            action="compare_tags",
        ),
        WorkflowStepDefinition(
            id="step_publish_release",
            title="Create GitHub Release",
            description="Publishes draft release on GitHub",
            service="GitHubService",
            action="create_release",
            requires_confirmation=True,
        ),
    ],
)
