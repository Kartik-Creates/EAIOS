from pydantic import BaseModel, Field


class ChatRequest(BaseModel):
    query: str = Field(..., min_length=1, max_length=4000)
    conversation_id: str | None = None


class Citation(BaseModel):
    document_title: str
    document_id: str
    excerpt: str


class ChatResponse(BaseModel):
    answer: str
    confidence: float
    citations: list[Citation]
    conversation_id: str
    flagged_for_review: bool
