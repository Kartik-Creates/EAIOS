from typing import Any, Dict, Optional
from app.workflows.adapters.base import BaseIntegrationAdapter
from app.workflows.adapters.exceptions import AdapterConfigurationError


class GitHubAdapter(BaseIntegrationAdapter):
    @property
    def provider_name(self) -> str:
        return "GitHub"

    def validate_connection(self, user_id: Optional[str] = None) -> bool:
        return True

    def execute_action(
        self,
        action: str,
        parameters: Dict[str, Any],
        user_id: Optional[str] = None,
    ) -> Dict[str, Any]:
        repo = parameters.get("repository", "Kartik-Creates/EAIOS")
        if action in ("get_recent_activity", "compare_tags"):
            return {"repo": repo, "merged_prs_count": 4, "provider": "GitHub"}
        elif action in ("create_release", "update_settings"):
            tag = parameters.get("tag_name", "v1.0.0")
            return {"repo": repo, "release_tag": tag, "status": "published", "provider": "GitHub"}
        else:
            raise AdapterConfigurationError(f"Unsupported GitHub action '{action}'", self.provider_name)

    def health_check(self) -> Dict[str, Any]:
        return {"provider": "GitHub", "status": "healthy"}
