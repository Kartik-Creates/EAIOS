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

USER_OFFBOARDING = WorkflowDefinition(
    id="user_offboarding",
    version="1.0.0",
    name="Employee Offboarding Access Audit",
    description="Audits and revokes user access permissions across GitHub, Slack, Jira, and Google Workspace.",
    category=WorkflowCategory.ADMINISTRATION,
    icon="Shield",
    required_role="admin",
    risk_level=RiskLevel.CRITICAL,
    estimated_runtime="~40s",
    requires_confirmation=True,
    integrations=[IntegrationType.SLACK, IntegrationType.GITHUB, IntegrationType.JIRA, IntegrationType.GMAIL],
    capabilities=[CapabilityType.UPDATE_GITHUB, CapabilityType.READ_SLACK, CapabilityType.READ_JIRA],
    parameter_schema=[
        WorkflowParameter(
            id="target_user_email",
            label="User Email",
            description="Work email address of offboarding employee",
            type=ParameterType.STRING,
            required=True,
        ),
    ],
    execution_steps=[
        WorkflowStepDefinition(
            id="step_audit_access",
            title="Audit Platform Accounts",
            description="Queries GitHub, Jira, and Slack for active user roles",
            service="AdminService",
            action="audit_user_accounts",
        ),
        WorkflowStepDefinition(
            id="step_revoke",
            title="Revoke Enterprise Permissions",
            description="Deactivates user accounts and invalidates OAuth tokens",
            service="AdminService",
            action="deactivate_user",
            requires_confirmation=True,
        ),
    ],
)
