"""Schemas for Daily Briefing Agent tools and orchestration endpoint."""
from pydantic import BaseModel, Field


class BriefingItem(BaseModel):
    source: str  # "jira" | "calendar" | "gmail" | "github" | "slack" | "drive"
    title: str
    detail: str  # e.g. due date, meeting time, sender
    priority_hint: str  # "overdue" | "today" | "upcoming" | "info"
    url: str | None = None  # deep link back to item, if available
    id: str | None = None  # stable item identifier for detail fetch
    sender_or_author: str | None = None  # sender name, assignee, or author


class BriefingItemDetail(BaseModel):
    """Full item detail returned by the item-detail endpoint for in-app modal display."""
    id: str
    source: str
    title: str
    detail: str
    body: str  # full email body, ticket description, PR body, event description
    priority_hint: str
    url: str | None = None
    sender_or_author: str | None = None
    created_or_due_date: str | None = None
    status: str | None = None
    metadata: dict | None = None


class SourceResult(BaseModel):
    source: str
    connected: bool  # False if user hasn't connected this integration
    items: list[BriefingItem] = Field(default_factory=list)
    error: str | None = None  # set if call failed, never raises upward


class SourceStatus(BaseModel):
    source: str
    connected: bool
    item_count: int
    error: str | None = None


class BriefingResponse(BaseModel):
    summary: str
    sources: list[SourceStatus]
    items: list[BriefingItem]
