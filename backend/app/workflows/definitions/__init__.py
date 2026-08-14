from app.workflows.definitions.administration import USER_OFFBOARDING
from app.workflows.definitions.automation import AUTO_REPLY
from app.workflows.definitions.communication import SLACK_TO_JIRA
from app.workflows.definitions.engineering import RELEASE_NOTES
from app.workflows.definitions.knowledge import BRAIN_SYNC
from app.workflows.definitions.meetings import MEETING_FOLLOW_UP
from app.workflows.definitions.reporting import DAILY_BRIEF, SPRINT_SUMMARY

ALL_BUILTIN_WORKFLOWS = [
    DAILY_BRIEF,
    SPRINT_SUMMARY,
    SLACK_TO_JIRA,
    MEETING_FOLLOW_UP,
    RELEASE_NOTES,
    BRAIN_SYNC,
    AUTO_REPLY,
    USER_OFFBOARDING,
]

__all__ = [
    "ALL_BUILTIN_WORKFLOWS",
    "DAILY_BRIEF",
    "SPRINT_SUMMARY",
    "SLACK_TO_JIRA",
    "MEETING_FOLLOW_UP",
    "RELEASE_NOTES",
    "BRAIN_SYNC",
    "AUTO_REPLY",
    "USER_OFFBOARDING",
]
