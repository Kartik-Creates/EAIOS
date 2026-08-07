from typing import Any, Dict, Optional
from app.workflows.adapters.base import BaseIntegrationAdapter
from app.workflows.adapters.exceptions import AdapterConfigurationError


class CompanyBrainAdapter(BaseIntegrationAdapter):
    @property
    def provider_name(self) -> str:
        return "Company Brain"

    def validate_connection(self, user_id: Optional[str] = None) -> bool:
        return True

    def execute_action(
        self,
        action: str,
        parameters: Dict[str, Any],
        user_id: Optional[str] = None,
    ) -> Dict[str, Any]:
        if action in ("index_documents", "search", "extract_action_items"):
            return {"chunks_searched": 14, "top_score": 0.92, "provider": "Company Brain"}
        else:
            raise AdapterConfigurationError(f"Unsupported Company Brain action '{action}'", self.provider_name)

    def health_check(self) -> Dict[str, Any]:
        return {"provider": "Company Brain", "status": "healthy"}
