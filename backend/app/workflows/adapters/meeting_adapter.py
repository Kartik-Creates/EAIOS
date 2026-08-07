from typing import Any, Dict, Optional
from app.workflows.adapters.base import BaseIntegrationAdapter
from app.workflows.adapters.exceptions import AdapterConfigurationError


class MeetingAdapter(BaseIntegrationAdapter):
    @property
    def provider_name(self) -> str:
        return "Meeting Intelligence"

    def validate_connection(self, user_id: Optional[str] = None) -> bool:
        return True

    def execute_action(
        self,
        action: str,
        parameters: Dict[str, Any],
        user_id: Optional[str] = None,
    ) -> Dict[str, Any]:
        if action in ("get_transcript", "summarize"):
            return {"meeting_id": parameters.get("meeting_id", "meet_101"), "action_items_count": 3, "provider": "Meeting Intelligence"}
        else:
            raise AdapterConfigurationError(f"Unsupported Meeting Intelligence action '{action}'", self.provider_name)

    def health_check(self) -> Dict[str, Any]:
        return {"provider": "Meeting Intelligence", "status": "healthy"}


class BriefingAdapter(BaseIntegrationAdapter):
    @property
    def provider_name(self) -> str:
        return "Executive Briefing"

    def validate_connection(self, user_id: Optional[str] = None) -> bool:
        return True

    def execute_action(
        self,
        action: str,
        parameters: Dict[str, Any],
        user_id: Optional[str] = None,
    ) -> Dict[str, Any]:
        if action == "aggregate_activity":
            return {"timeframe": parameters.get("timeframe", "last_24h"), "sources_aggregated": ["slack", "github", "jira"], "provider": "Executive Briefing"}
        else:
            raise AdapterConfigurationError(f"Unsupported Briefing action '{action}'", self.provider_name)

    def health_check(self) -> Dict[str, Any]:
        return {"provider": "Executive Briefing", "status": "healthy"}
