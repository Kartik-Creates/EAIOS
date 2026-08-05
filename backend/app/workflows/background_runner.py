import asyncio
import logging
import threading
from abc import ABC, abstractmethod
from typing import Any, Dict, Optional

from app.workflows.execution import ExecutionResult
from app.workflows.orchestrator import orchestrator
from app.workflows.plan import ExecutionPlan

logger = logging.getLogger("eaios.workflows.background_runner")


class BaseBackgroundRunner(ABC):
    """Abstract interface for background execution runners (Celery, Redis Queue, AsyncIO)."""

    @abstractmethod
    def queue_execution(self, plan: ExecutionPlan) -> str:
        """Queue plan for asynchronous background execution. Returns task_id."""
        pass

    @abstractmethod
    def get_status(self, task_id: str) -> Dict[str, Any]:
        """Get status of queued background execution."""
        pass


class InMemoryBackgroundRunner(BaseBackgroundRunner):
    """Default thread/async background runner."""

    def __init__(self) -> None:
        self._tasks: Dict[str, Dict[str, Any]] = {}
        self._lock = threading.Lock()

    def queue_execution(self, plan: ExecutionPlan) -> str:
        task_id = f"bg_task_{plan.plan_id[5:]}"
        with self._lock:
            self._tasks[task_id] = {
                "task_id": task_id,
                "plan_id": plan.plan_id,
                "status": "QUEUED",
                "result": None,
            }

        # Run background thread
        thread = threading.Thread(target=self._run_async, args=(task_id, plan), daemon=True)
        thread.start()
        logger.info("Queued background task '%s' for plan '%s'", task_id, plan.plan_id)
        return task_id

    def _run_async(self, task_id: str, plan: ExecutionPlan) -> None:
        with self._lock:
            self._tasks[task_id]["status"] = "RUNNING"
        try:
            res = orchestrator.execute_plan(plan)
            with self._lock:
                self._tasks[task_id]["status"] = "COMPLETED"
                self._tasks[task_id]["result"] = res
        except Exception as exc:
            logger.error("Background task '%s' failed: %s", task_id, exc)
            with self._lock:
                self._tasks[task_id]["status"] = "FAILED"
                self._tasks[task_id]["error"] = str(exc)

    def get_status(self, task_id: str) -> Dict[str, Any]:
        with self._lock:
            return self._tasks.get(task_id, {"status": "UNKNOWN"})


# Global Singleton BackgroundRunner Instance
background_runner = InMemoryBackgroundRunner()
