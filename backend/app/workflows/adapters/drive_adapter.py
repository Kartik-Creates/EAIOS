from typing import Any, Dict, Optional
from app.workflows.adapters.base import BaseIntegrationAdapter
from app.workflows.adapters.exceptions import AdapterConfigurationError


class DriveAdapter(BaseIntegrationAdapter):
    @property
    def provider_name(self) -> str:
        return "Google Drive"

    def validate_connection(self, user_id: Optional[str] = None) -> bool:
        return True

    def execute_action(
        self,
        action: str,
        parameters: Dict[str, Any],
        user_id: Optional[str] = None,
    ) -> Dict[str, Any]:
        if action in ("scan_folder", "sync_drive"):
            folder_id = parameters.get("folder_id", "root")
            return {"folder_id": folder_id, "files_scanned": 8, "status": "scanned", "provider": "Google Drive"}
        else:
            raise AdapterConfigurationError(f"Unsupported Drive action '{action}'", self.provider_name)

    def health_check(self) -> Dict[str, Any]:
        return {"provider": "Google Drive", "status": "healthy"}
