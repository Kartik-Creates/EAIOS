from abc import ABC, abstractmethod
from typing import Any, Dict, Optional


class BaseIntegrationAdapter(ABC):
    """
    Abstract Base Adapter for all EAIOS Workflow Integrations.
    Ensures provider-agnostic execution, connection validation, and health checks.
    """

    @property
    @abstractmethod
    def provider_name(self) -> str:
        """Name of the integration provider."""
        pass

    @abstractmethod
    def validate_connection(self, user_id: Optional[str] = None) -> bool:
        """Validate if required credentials and tokens exist."""
        pass

    @abstractmethod
    def execute_action(
        self,
        action: str,
        parameters: Dict[str, Any],
        user_id: Optional[str] = None,
    ) -> Dict[str, Any]:
        """Execute a workflow-safe operation through existing EAIOS services."""
        pass

    @abstractmethod
    def health_check(self) -> Dict[str, Any]:
        """Return health status dictionary."""
        pass
