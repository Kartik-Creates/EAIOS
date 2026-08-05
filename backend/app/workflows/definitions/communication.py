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

SLACK_TO_JIRA = WorkflowDefinition(
    id="slack_to_jira",
    version="1.0.0",
    name="Create Jira Ticket from Slack",
    description="Transforms Slack thread context into a structured Jira ticket.",
    category=WorkflowCategory.COMMUNICATION,
    icon="CheckSquare",
    required_role="employee",
    risk_level=RiskLevel.MEDIUM,
    estimated_runtime="~10s",
    requires_confirmation=True,
    integrations=[IntegrationType.SLACK, IntegrationType.JIRA, IntegrationType.COMPANY_BRAIN],
    capabilities=[CapabilityType.READ_SLACK, CapabilityType.CREATE_JIRA, CapabilityType.SEARCH_COMPANY_BRAIN],
    parameter_schema=[
        WorkflowParameter(
            id="project_key",
            label="Jira Project Key",
            description="Target Jira project",
            type=ParameterType.STRING,
            required=True,
            placeholder="EAIOS",
        ),
        WorkflowParameter(
            id="summary",
            label="Ticket Summary",
            description="Brief title describing the issue or task",
            type=ParameterType.STRING,
            required=True,
        ),
        WorkflowParameter(
            id="issue_type",
            label="Issue Type",
            description="Select type of ticket",
            type=ParameterType.SELECT,
            required=True,
            default_value="Task",
            validation_rules=ValidationRules(options=["Task", "Bug", "Story"]),
        ),
    ],
    execution_steps=[
        WorkflowStepDefinition(
            id="step_parse",
            title="Parse Slack Thread",
            description="Extracts discussion points & participants",
            service="SlackService",
            action="parse_thread",
        ),
        WorkflowStepDefinition(
            id="step_create",
            title="Create Issue",
            description="Creates ticket on Jira board",
            service="JiraService",
            action="create_issue",
            requires_confirmation=True,
        ),
    ],
)
