import enum
import logging
import threading
import time
from typing import Any, Dict, Optional
from pydantic import BaseModel, Field

from app.workflows.resilience import CircuitBreakerOpenError

logger = logging.getLogger("eaios.workflows.circuit_breaker")


class CircuitState(str, enum.Enum):
    CLOSED = "CLOSED"      # Normal operation
    OPEN = "OPEN"          # Blocking calls due to failure threshold
    HALF_OPEN = "HALF_OPEN"# Testing recovery


class CircuitBreakerConfig(BaseModel):
    failure_threshold: int = 3
    recovery_timeout: float = 5.0  # Seconds before moving to HALF_OPEN


class ProviderCircuitBreaker:
    """
    Tracks adapter failures for a specific provider integration.
    Protects external services by tripping OPEN when threshold is exceeded.
    """

    def __init__(self, provider_name: str, config: Optional[CircuitBreakerConfig] = None) -> None:
        self.provider_name = provider_name
        self.config = config or CircuitBreakerConfig()
        self.state = CircuitState.CLOSED
        self.failure_count = 0
        self.last_state_change = time.time()
        self._lock = threading.Lock()

    def before_call(self) -> None:
        with self._lock:
            now = time.time()
            if self.state == CircuitState.OPEN:
                if now - self.last_state_change > self.config.recovery_timeout:
                    self.state = CircuitState.HALF_OPEN
                    self.last_state_change = now
                    logger.info("CircuitBreaker for '%s' transitioned to HALF_OPEN", self.provider_name)
                else:
                    raise CircuitBreakerOpenError(f"Circuit Breaker for '{self.provider_name}' is OPEN. Requests blocked.")

    def record_success(self) -> None:
        with self._lock:
            self.failure_count = 0
            if self.state != CircuitState.CLOSED:
                self.state = CircuitState.CLOSED
                self.last_state_change = time.time()
                logger.info("CircuitBreaker for '%s' recovered and transitioned to CLOSED", self.provider_name)

    def record_failure(self) -> None:
        with self._lock:
            self.failure_count += 1
            if self.failure_count >= self.config.failure_threshold:
                self.state = CircuitState.OPEN
                self.last_state_change = time.time()
                logger.warning("CircuitBreaker for '%s' TRIPPED OPEN after %d consecutive failures", self.provider_name, self.failure_count)


class CircuitBreakerRegistry:
    """
    Registry for managing CircuitBreakers across all provider integrations.
    """

    def __init__(self) -> None:
        self._breakers: Dict[str, ProviderCircuitBreaker] = {}
        self._lock = threading.Lock()

    def get_breaker(self, provider_name: str) -> ProviderCircuitBreaker:
        with self._lock:
            if provider_name not in self._breakers:
                self._breakers[provider_name] = ProviderCircuitBreaker(provider_name)
            return self._breakers[provider_name]

    def get_health_status(self) -> Dict[str, Dict[str, Any]]:
        with self._lock:
            return {
                name: {
                    "state": b.state.value,
                    "failure_count": b.failure_count,
                    "last_state_change": b.last_state_change,
                }
                for name, b in self._breakers.items()
            }


# Global Singleton CircuitBreakerRegistry Instance
circuit_breaker_registry = CircuitBreakerRegistry()
