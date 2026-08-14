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

MEETING_FOLLOW_UP = WorkflowDefinition(
    id="meeting_follow_up",
    version="1.0.0",
    name="Meeting Follow-Up & Action Router",
    description="Processes meeting transcripts to extract action items, summaries, and send email follow-ups.",
    category=WorkflowCategory.MEETINGS,
    icon="Video",
    required_role="employee",
    risk_level=RiskLevel.LOW,
    estimated_runtime="~25s",
    requires_confirmation=False,
    integrations=[IntegrationType.MEETING_INTELLIGENCE, IntegrationType.GMAIL, IntegrationType.SLACK],
    capabilities=[CapabilityType.SUMMARIZE_MEETING, CapabilityType.SEND_GMAIL, CapabilityType.POST_SLACK],
    parameter_schema=[
        WorkflowParameter(
            id="meeting_title",
            label="Meeting Title",
            description="Name or topic of the meeting",
            type=ParameterType.STRING,
            required=True,
        ),
        WorkflowParameter(
            id="send_email",
            label="Send Email Follow-Up",
            description="Send summary email to meeting participants",
            type=ParameterType.BOOLEAN,
            required=False,
            default_value=True,
        ),
    ],
    execution_steps=[
        WorkflowStepDefinition(
            id="step_analyze",
            title="Analyze Transcript",
            description="Extracts action items and key decisions",
            service="MeetingService",
            action="summarize",
        ),
        WorkflowStepDefinition(
            id="step_send_email",
            title="Send Summary Email",
            description="Dispatches email recap to attendees",
            service="GmailService",
            action="send_email",
        ),
    ],
)
