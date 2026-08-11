import enum
import uuid
from datetime import datetime, timezone
from typing import Any, Dict, Optional
from pydantic import BaseModel, Field


class TriggerType(str, enum.Enum):
    MANUAL = "MANUAL"
    SCHEDULED = "SCHEDULED"
    WEBHOOK = "WEBHOOK"
    EVENT = "EVENT"
    API = "API"
    FILE_UPLOAD = "FILE_UPLOAD"
    EMAIL = "EMAIL"
    SLACK = "SLACK"
    GITHUB = "GITHUB"
    JIRA = "JIRA"
    CALENDAR = "CALENDAR"


class TriggerContext(BaseModel):
    trigger_id: str = Field(default_factory=lambda: f"trig_{uuid.uuid4().hex[:12]}")
    trigger_type: TriggerType
    source: str = "user_interface"
    timestamp: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())
    initiating_user: Optional[str] = "system"
    metadata: Dict[str, Any] = Field(default_factory=dict)

    class Config:
        frozen = True  # Immutable model
