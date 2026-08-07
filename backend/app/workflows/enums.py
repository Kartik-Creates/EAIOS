import enum


class WorkflowCategory(str, enum.Enum):
    REPORTING = "Reporting"
    COMMUNICATION = "Communication"
    MEETINGS = "Meetings"
    KNOWLEDGE = "Knowledge"
    ENGINEERING = "Engineering"
    PROJECT_MANAGEMENT = "Project Management"
    AUTOMATION = "Automation"
    ADMINISTRATION = "Administration"


class RiskLevel(str, enum.Enum):
    LOW = "LOW"
    MEDIUM = "MEDIUM"
    HIGH = "HIGH"
    CRITICAL = "CRITICAL"


class IntegrationType(str, enum.Enum):
    SLACK = "Slack"
    GITHUB = "GitHub"
    GMAIL = "Gmail"
    JIRA = "Jira"
    DRIVE = "Google Drive"
    COMPANY_BRAIN = "Company Brain"
    MEETING_INTELLIGENCE = "Meeting Intelligence"


class CapabilityType(str, enum.Enum):
    READ_GMAIL = "READ_GMAIL"
    SEND_GMAIL = "SEND_GMAIL"
    READ_SLACK = "READ_SLACK"
    POST_SLACK = "POST_SLACK"
    READ_JIRA = "READ_JIRA"
    CREATE_JIRA = "CREATE_JIRA"
    READ_GITHUB = "READ_GITHUB"
    UPDATE_GITHUB = "UPDATE_GITHUB"
    SEARCH_COMPANY_BRAIN = "SEARCH_COMPANY_BRAIN"
    GENERATE_REPORT = "GENERATE_REPORT"
    SUMMARIZE_MEETING = "SUMMARIZE_MEETING"
    SYNC_DRIVE = "SYNC_DRIVE"


class ParameterType(str, enum.Enum):
    STRING = "string"
    NUMBER = "number"
    BOOLEAN = "boolean"
    DATE = "date"
    SELECT = "select"
    MULTI_SELECT = "multi_select"
    TEXTAREA = "textarea"
