from pydantic import BaseModel, Field


class MeetingSummarizeRequest(BaseModel):
    transcript: str = Field(..., min_length=1, max_length=200_000)
    language: str | None = None


class Decision(BaseModel):
    id: str
    description: str
    context: str | None = None


class ActionItem(BaseModel):
    id: str
    description: str
    assignee: str | None = None
    due_date: str | None = None
    completed: bool = False


class MeetingSummaryResponse(BaseModel):
    summary: str
    decisions: list[Decision]
    action_items: list[ActionItem]
    confidence: float
    duration_seconds: int | None = None
    participants_count: int | None = None
