from typing import Any

from app.workflows.adapters.base import BaseIntegrationAdapter
from app.workflows.adapters.exceptions import AdapterConfigurationError


class CompanyBrainAdapter(BaseIntegrationAdapter):
    @property
    def provider_name(self) -> str:
        return "Company Brain"

    def validate_connection(self, user_id: str | None = None) -> bool:
        return True

    def execute_action(
        self,
        action: str,
        parameters: dict[str, Any],
        user_id: str | None = None,
    ) -> dict[str, Any]:
        if action in ("index_documents", "search", "extract_action_items"):
            return {"chunks_searched": 14, "top_score": 0.92, "provider": "Company Brain"}
        else:
            raise AdapterConfigurationError(f"Unsupported Company Brain action '{action}'", self.provider_name)

    def health_check(self) -> dict[str, Any]:
        return {"provider": "Company Brain", "status": "healthy"}
