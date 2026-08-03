"""Schemas for Daily Briefing Agent tools and orchestration endpoint."""
from pydantic import BaseModel, Field


class BriefingItem(BaseModel):
    source: str  # "jira" | "calendar" | "gmail" | "github"
    title: str
    detail: str  # e.g. due date, meeting time, sender
    priority_hint: str  # "overdue" | "today" | "upcoming" | "info"
    url: str | None = None  # deep link back to item, if available


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
