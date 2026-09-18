from typing import Any

from app.workflows.adapters.base import BaseIntegrationAdapter
from app.workflows.adapters.exceptions import AdapterConfigurationError


class DriveAdapter(BaseIntegrationAdapter):
    @property
    def provider_name(self) -> str:
        return "Google Drive"

    def validate_connection(self, user_id: str | None = None) -> bool:
        return True

    def execute_action(
        self,
        action: str,
        parameters: dict[str, Any],
        user_id: str | None = None,
    ) -> dict[str, Any]:
        if action in ("scan_folder", "sync_drive"):
            folder_id = parameters.get("folder_id", "root")
            return {"folder_id": folder_id, "files_scanned": 8, "status": "scanned", "provider": "Google Drive"}
        else:
            raise AdapterConfigurationError(f"Unsupported Drive action '{action}'", self.provider_name)

    def health_check(self) -> dict[str, Any]:
        return {"provider": "Google Drive", "status": "healthy"}
