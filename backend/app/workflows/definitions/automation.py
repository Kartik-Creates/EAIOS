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

AUTO_REPLY = WorkflowDefinition(
    id="auto_reply",
    version="1.0.0",
    name="Smart Email Auto-Draft Assistant",
    description="Drafts context-aware Gmail responses using Company Brain RAG search over internal documentation.",
    category=WorkflowCategory.AUTOMATION,
    icon="Wand2",
    required_role="employee",
    risk_level=RiskLevel.MEDIUM,
    estimated_runtime="~15s",
    requires_confirmation=True,
    integrations=[IntegrationType.GMAIL, IntegrationType.COMPANY_BRAIN],
    capabilities=[CapabilityType.READ_GMAIL, CapabilityType.SEND_GMAIL, CapabilityType.SEARCH_COMPANY_BRAIN],
    parameter_schema=[
        WorkflowParameter(
            id="email_thread_id",
            label="Email Thread ID",
            description="Gmail thread ID to reply to",
            type=ParameterType.STRING,
            required=True,
        ),
    ],
    execution_steps=[
        WorkflowStepDefinition(
            id="step_read_email",
            title="Read Thread Context",
            description="Fetches email thread text",
            service="GmailService",
            action="get_thread",
        ),
        WorkflowStepDefinition(
            id="step_draft",
            title="Draft Response",
            description="Creates draft email response in Gmail",
            service="GmailService",
            action="create_draft",
            requires_confirmation=True,
        ),
    ],
)
