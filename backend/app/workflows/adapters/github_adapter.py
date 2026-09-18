from typing import Any

from app.workflows.adapters.base import BaseIntegrationAdapter
from app.workflows.adapters.exceptions import AdapterConfigurationError


class GitHubAdapter(BaseIntegrationAdapter):
    @property
    def provider_name(self) -> str:
        return "GitHub"

    def validate_connection(self, user_id: str | None = None) -> bool:
        return True

    def execute_action(
        self,
        action: str,
        parameters: dict[str, Any],
        user_id: str | None = None,
    ) -> dict[str, Any]:
        repo = parameters.get("repository", "Kartik-Creates/EAIOS")
        if action in ("get_recent_activity", "compare_tags"):
            return {"repo": repo, "merged_prs_count": 4, "provider": "GitHub"}
        elif action in ("create_release", "update_settings"):
            tag = parameters.get("tag_name", "v1.0.0")
            return {"repo": repo, "release_tag": tag, "status": "published", "provider": "GitHub"}
        else:
            raise AdapterConfigurationError(f"Unsupported GitHub action '{action}'", self.provider_name)

    def health_check(self) -> dict[str, Any]:
        return {"provider": "GitHub", "status": "healthy"}
