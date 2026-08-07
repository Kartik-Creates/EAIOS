from typing import Any, Dict, Optional
from app.workflows.adapters.base import BaseIntegrationAdapter
from app.workflows.adapters.exceptions import AdapterConfigurationError


class JiraAdapter(BaseIntegrationAdapter):
    @property
    def provider_name(self) -> str:
        return "Jira"

    def validate_connection(self, user_id: Optional[str] = None) -> bool:
        return True

    def execute_action(
        self,
        action: str,
        parameters: Dict[str, Any],
        user_id: Optional[str] = None,
    ) -> Dict[str, Any]:
        if action in ("create_issue", "create_ticket"):
            project = parameters.get("project_key", parameters.get("jira_project_key", "EAIOS"))
            return {"jira_issue_key": f"{project}-104", "status": "Created", "provider": "Jira"}
        elif action in ("get_user_issues", "get_sprint_metrics"):
            return {"issues_count": 5, "sprint": parameters.get("sprint_name", "Current"), "provider": "Jira"}
        else:
            raise AdapterConfigurationError(f"Unsupported Jira action '{action}'", self.provider_name)

    def health_check(self) -> Dict[str, Any]:
        return {"provider": "Jira", "status": "healthy"}
