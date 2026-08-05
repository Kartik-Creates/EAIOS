import enum
import logging
import threading
import uuid
from datetime import datetime, timezone
from typing import Any, Dict, List, Optional
from pydantic import BaseModel, Field

logger = logging.getLogger("eaios.workflows.scheduler")


class ScheduleType(str, enum.Enum):
    ONE_TIME = "ONE_TIME"
    RECURRING = "RECURRING"
    CRON = "CRON"


class ScheduledJob(BaseModel):
    schedule_id: str = Field(default_factory=lambda: f"sched_{uuid.uuid4().hex[:12]}")
    workflow_id: str
    schedule_type: ScheduleType
    cron_expression: Optional[str] = None
    run_at: Optional[str] = None
    parameters: Dict[str, Any] = Field(default_factory=dict)
    is_active: bool = True
    created_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())

    class Config:
        frozen = True


class WorkflowScheduler:
    """
    Abstract Scheduler interface for workflow automation schedules.
    Decoupled from specific scheduling libraries.
    """

    def __init__(self) -> None:
        self._schedules: Dict[str, ScheduledJob] = {}
        self._lock = threading.Lock()

    def create_schedule(
        self,
        workflow_id: str,
        schedule_type: ScheduleType,
        cron_expression: Optional[str] = None,
        run_at: Optional[str] = None,
        parameters: Optional[Dict[str, Any]] = None,
    ) -> ScheduledJob:
        if schedule_type == ScheduleType.CRON and not cron_expression:
            raise ValueError("Cron schedule requires a valid 'cron_expression'.")
        if schedule_type == ScheduleType.ONE_TIME and not run_at:
            raise ValueError("One-time schedule requires a valid 'run_at' timestamp.")

        job = ScheduledJob(
            workflow_id=workflow_id,
            schedule_type=schedule_type,
            cron_expression=cron_expression,
            run_at=run_at,
            parameters=parameters or {},
        )
        with self._lock:
            self._schedules[job.schedule_id] = job
        logger.info("Scheduled workflow job '%s' [%s] for workflow '%s'", job.schedule_id, schedule_type.value, workflow_id)
        return job

    def delete_schedule(self, schedule_id: str) -> bool:
        with self._lock:
            if schedule_id in self._schedules:
                del self._schedules[schedule_id]
                logger.info("Deleted schedule job '%s'", schedule_id)
                return True
            return False

    def list_schedules(self, workflow_id: Optional[str] = None) -> List[ScheduledJob]:
        with self._lock:
            jobs = list(self._schedules.values())
            if workflow_id:
                jobs = [j for j in jobs if j.workflow_id == workflow_id]
            return jobs


# Global Singleton WorkflowScheduler Instance
scheduler = WorkflowScheduler()
