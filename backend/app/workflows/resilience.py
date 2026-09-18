import logging
from typing import Any

from pydantic import BaseModel, Field

logger = logging.getLogger("eaios.workflows.resilience")


class RetryPolicy(BaseModel):
    max_retries: int = 3
    initial_delay: float = 0.1  # Seconds
    backoff_factor: float = 2.0  # Exponential multiplier
    retryable_exceptions: list[str] = Field(default_factory=lambda: ["AdapterTemporaryFailure", "AdapterRateLimitError"])

    def calculate_delay(self, attempt: int) -> float:
        """Calculate exponential backoff delay."""
        return self.initial_delay * (self.backoff_factor ** (attempt - 1))


class CompensationStep(BaseModel):
    step_id: str
    target_service: str
    compensation_action: str
    parameters: dict[str, Any] = Field(default_factory=dict)


class CircuitBreakerOpenError(Exception):
    """Raised when an API call is blocked by an open Circuit Breaker."""
