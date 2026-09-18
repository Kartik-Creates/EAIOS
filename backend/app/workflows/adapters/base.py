from abc import ABC, abstractmethod
from typing import Any


class BaseIntegrationAdapter(ABC):
    """
    Abstract Base Adapter for all EAIOS Workflow Integrations.
    Ensures provider-agnostic execution, connection validation, and health checks.
    """

    @property
    @abstractmethod
    def provider_name(self) -> str:
        """Name of the integration provider."""

    @abstractmethod
    def validate_connection(self, user_id: str | None = None) -> bool:
        """Validate if required credentials and tokens exist."""

    @abstractmethod
    def execute_action(
        self,
        action: str,
        parameters: dict[str, Any],
        user_id: str | None = None,
    ) -> dict[str, Any]:
        """Execute a workflow-safe operation through existing EAIOS services."""

    @abstractmethod
    def health_check(self) -> dict[str, Any]:
        """Return health status dictionary."""
