import logging
import threading
import time
from typing import Any, Dict, List, Optional
from pydantic import BaseModel

from app.workflows.circuit_breaker import circuit_breaker_registry
from app.workflows.event_store import event_store

logger = logging.getLogger("eaios.workflows.hardening")


class RateLimiterExceededError(Exception):
    """Raised when workflow execution rate limit is exceeded."""
    pass


class RateLimiter:
    """Sliding Window Rate Limiter for Workflow Executions."""

    def __init__(self, max_requests: int = 100, window_seconds: float = 60.0) -> None:
        self.max_requests = max_requests
        self.window_seconds = window_seconds
        self._requests: List[float] = []
        self._lock = threading.Lock()

    def check_rate_limit(self) -> None:
        with self._lock:
            now = time.time()
            self._requests = [t for t in self._requests if now - t <= self.window_seconds]
            if len(self._requests) >= self.max_requests:
                raise RateLimiterExceededError(f"Rate limit of {self.max_requests} executions per {self.window_seconds}s exceeded.")
            self._requests.append(now)


class SystemHealthReport(BaseModel):
    status: str
    uptime: float
    total_events_logged: int
    circuit_breaker_summary: Dict[str, Any]
    rate_limiter_active: bool


class HardeningService:
    """Production Hardening & Observability Service."""

    def __init__(self) -> None:
        self.start_time = time.time()
        self.rate_limiter = RateLimiter(max_requests=200, window_seconds=60.0)

    def get_health(self) -> SystemHealthReport:
        uptime = round(time.time() - self.start_time, 2)
        total_events = len(event_store.list_events())
        cb_summary = circuit_breaker_registry.get_health_status()

        return SystemHealthReport(
            status="HEALTHY",
            uptime=uptime,
            total_events_logged=total_events,
            circuit_breaker_summary=cb_summary,
            rate_limiter_active=True,
        )


# Global Singleton Hardening Service Instance
hardening_service = HardeningService()
