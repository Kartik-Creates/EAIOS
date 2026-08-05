from app.schemas.workflow import (
    ValidationRules,
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

DAILY_BRIEF = WorkflowDefinition(
    id="daily_brief",
    version="1.0.0",
    name="Daily Executive Briefing",
    description="Compiles cross-platform activity summary into a concise executive daily briefing.",
    category=WorkflowCategory.REPORTING,
    icon="FileText",
    required_role="employee",
    risk_level=RiskLevel.LOW,
    estimated_runtime="~15s",
    requires_confirmation=False,
    integrations=[IntegrationType.SLACK, IntegrationType.GITHUB, IntegrationType.JIRA],
    capabilities=[CapabilityType.READ_SLACK, CapabilityType.READ_GITHUB, CapabilityType.READ_JIRA, CapabilityType.GENERATE_REPORT],
    parameter_schema=[
        WorkflowParameter(
            id="timeframe",
            label="Timeframe",
            description="Select activity timeframe for executive brief",
            type=ParameterType.SELECT,
            required=True,
            default_value="last_24h",
            validation_rules=ValidationRules(options=["last_24h", "last_48h", "this_week"]),
        ),
        WorkflowParameter(
            id="channel",
            label="Slack Channel",
            description="Target channel for brief delivery",
            type=ParameterType.STRING,
            required=True,
            default_value="#daily-briefs",
        ),
    ],
    execution_steps=[
        WorkflowStepDefinition(
            id="step_aggregate",
            title="Aggregate Metrics",
            description="Fetches recent activity across connected platforms",
            service="BriefingService",
            action="aggregate_activity",
        ),
        WorkflowStepDefinition(
            id="step_publish",
            title="Publish Executive Brief",
            description="Posts formatted brief to target channel",
            service="SlackService",
            action="post_message",
        ),
    ],
)

SPRINT_SUMMARY = WorkflowDefinition(
    id="sprint_summary",
    version="1.0.0",
    name="Sprint Performance Summary",
    description="Extracts sprint completion data, velocity, and open blockers from Jira.",
    category=WorkflowCategory.REPORTING,
    icon="FileText",
    required_role="manager",
    risk_level=RiskLevel.LOW,
    estimated_runtime="~20s",
    requires_confirmation=False,
    integrations=[IntegrationType.JIRA, IntegrationType.SLACK],
    capabilities=[CapabilityType.READ_JIRA, CapabilityType.GENERATE_REPORT, CapabilityType.POST_SLACK],
    parameter_schema=[
        WorkflowParameter(
            id="sprint_name",
            label="Sprint Name",
            description="Name of sprint to summarize",
            type=ParameterType.STRING,
            required=True,
            placeholder="Sprint 42",
        ),
    ],
    execution_steps=[
        WorkflowStepDefinition(
            id="step_fetch_sprint",
            title="Fetch Sprint Issues",
            description="Queries Jira for completed and remaining backlog items",
            service="JiraService",
            action="get_sprint_metrics",
        ),
    ],
)
