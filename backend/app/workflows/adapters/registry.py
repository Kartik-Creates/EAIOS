import logging
from typing import Any, Dict, List, Optional

from app.workflows.adapters.base import BaseIntegrationAdapter
from app.workflows.adapters.company_brain_adapter import CompanyBrainAdapter
from app.workflows.adapters.drive_adapter import DriveAdapter
from app.workflows.adapters.exceptions import AdapterConfigurationError, AdapterResourceNotFoundError
from app.workflows.adapters.github_adapter import GitHubAdapter
from app.workflows.adapters.gmail_adapter import GmailAdapter
from app.workflows.adapters.jira_adapter import JiraAdapter
from app.workflows.adapters.meeting_adapter import BriefingAdapter, MeetingAdapter
from app.workflows.adapters.slack_adapter import SlackAdapter
from app.workflows.enums import IntegrationType

logger = logging.getLogger("eaios.workflows.adapters.registry")


class AdapterRegistry:
    """
    Adapter Registry resolving integration adapters by IntegrationType.
    Decouples Workflow Executor & Handlers from provider implementations.
    """

    def __init__(self) -> None:
        self._adapters: Dict[str, BaseIntegrationAdapter] = {}
        self._register_default_adapters()

    def _register_default_adapters(self) -> None:
        slack = SlackAdapter()
        jira = JiraAdapter()
        github = GitHubAdapter()
        gmail = GmailAdapter()
        drive = DriveAdapter()
        brain = CompanyBrainAdapter()
        meeting = MeetingAdapter()
        briefing = BriefingAdapter()

        self.register(IntegrationType.SLACK, slack)
        self.register("SlackService", slack)

        self.register(IntegrationType.JIRA, jira)
        self.register("JiraService", jira)

        self.register(IntegrationType.GITHUB, github)
        self.register("GitHubService", github)

        self.register(IntegrationType.GMAIL, gmail)
        self.register("GmailService", gmail)

        self.register(IntegrationType.DRIVE, drive)
        self.register("DriveService", drive)

        self.register(IntegrationType.COMPANY_BRAIN, brain)
        self.register("BrainService", brain)
        self.register("LLMService", brain)

        self.register(IntegrationType.MEETING_INTELLIGENCE, meeting)
        self.register("MeetingService", meeting)

        self.register("BriefingService", briefing)
        self.register("AdminService", slack)

    def register(self, key: Any, adapter: BaseIntegrationAdapter) -> None:
        name = key.value if isinstance(key, IntegrationType) else str(key)
        self._adapters[name] = adapter
        logger.info("Registered Integration Adapter: %s -> %s", name, adapter.__class__.__name__)

    def get_adapter(self, key: Any) -> Optional[BaseIntegrationAdapter]:
        name = key.value if isinstance(key, IntegrationType) else str(key)
        return self._adapters.get(name)

    def validate_integrations(self, integrations: List[IntegrationType], user_id: Optional[str] = None) -> Dict[str, bool]:
        """Validate connections for a list of integrations."""
        results: Dict[str, bool] = {}
        for integ in integrations:
            adapter = self.get_adapter(integ)
            if not adapter:
                results[integ.value] = False
            else:
                results[integ.value] = adapter.validate_connection(user_id)
        return results


# Global Singleton AdapterRegistry Instance
adapter_registry = AdapterRegistry()
