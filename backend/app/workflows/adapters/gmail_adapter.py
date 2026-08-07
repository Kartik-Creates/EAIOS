from typing import Any, Dict, Optional
from app.workflows.adapters.base import BaseIntegrationAdapter
from app.workflows.adapters.exceptions import AdapterConfigurationError


class GmailAdapter(BaseIntegrationAdapter):
    @property
    def provider_name(self) -> str:
        return "Gmail"

    def validate_connection(self, user_id: Optional[str] = None) -> bool:
        return True

    def execute_action(
        self,
        action: str,
        parameters: Dict[str, Any],
        user_id: Optional[str] = None,
    ) -> Dict[str, Any]:
        if action == "send_email":
            return {"status": "sent", "message_id": "msg_gmail_9921", "provider": "Gmail"}
        elif action in ("get_thread", "create_draft"):
            return {"thread_id": parameters.get("email_thread_id", "thread_123"), "status": "draft_created", "provider": "Gmail"}
        else:
            raise AdapterConfigurationError(f"Unsupported Gmail action '{action}'", self.provider_name)

    def health_check(self) -> Dict[str, Any]:
        return {"provider": "Gmail", "status": "healthy"}
