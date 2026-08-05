import logging
from typing import List, Optional
from pydantic import BaseModel, Field

from app.schemas.workflow import WorkflowDefinition
from app.workflows.definitions.administration import USER_OFFBOARDING
from app.workflows.definitions.automation import AUTO_REPLY
from app.workflows.definitions.engineering import RELEASE_NOTES
from app.workflows.definitions.meetings import MEETING_FOLLOW_UP
from app.workflows.definitions.reporting import DAILY_BRIEF
from app.workflows.registry import workflow_registry

logger = logging.getLogger("eaios.workflows.templates")


class EnterpriseTemplate(BaseModel):
    template_id: str
    name: str
    description: str
    category: str
    icon: str
    workflow_definition: WorkflowDefinition


ENTERPRISE_TEMPLATES: List[EnterpriseTemplate] = [
    EnterpriseTemplate(
        template_id="tpl_daily_brief",
        name="Executive Daily Digest",
        description="Aggregates Slack, GitHub, and Jira activity into an executive morning briefing.",
        category="Reporting",
        icon="FileText",
        workflow_definition=DAILY_BRIEF,
    ),
    EnterpriseTemplate(
        template_id="tpl_release_notes",
        name="Automated Release Notes",
        description="Generates release notes from merged PRs and posts to Slack and GitHub Releases.",
        category="Engineering",
        icon="GitPullRequest",
        workflow_definition=RELEASE_NOTES,
    ),
    EnterpriseTemplate(
        template_id="tpl_auto_reply",
        name="Smart Email Auto-Draft Assistant",
        description="Drafts context-aware Gmail responses using Company Brain RAG search over internal documentation.",
        category="Automation",
        icon="Wand2",
        workflow_definition=AUTO_REPLY,
    ),
    EnterpriseTemplate(
        template_id="tpl_meeting_followup",
        name="Meeting Intelligence Action Extractor",
        description="Extracts action items from meeting transcripts and creates Jira tasks automatically.",
        category="Meetings",
        icon="Video",
        workflow_definition=MEETING_FOLLOW_UP,
    ),
]


class TemplateLibraryService:
    """Enterprise Template Library Service."""

    def list_templates(self) -> List[EnterpriseTemplate]:
        return ENTERPRISE_TEMPLATES

    def install_template(self, template_id: str) -> WorkflowDefinition:
        tpl = next((t for t in ENTERPRISE_TEMPLATES if t.template_id == template_id), None)
        if not tpl:
            raise ValueError(f"Enterprise template '{template_id}' not found.")

        existing = workflow_registry.get(tpl.workflow_definition.id, version=tpl.workflow_definition.version)
        if not existing:
            workflow_registry.register(tpl.workflow_definition)
        logger.info("Installed enterprise template '%s' into workflow registry", tpl.name)
        return tpl.workflow_definition


# Global Singleton Template Service Instance
template_service = TemplateLibraryService()
