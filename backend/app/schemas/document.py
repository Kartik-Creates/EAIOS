from pydantic import BaseModel, Field


class DocumentIngestRequest(BaseModel):
    title: str = Field(..., min_length=1, max_length=500)
    content: str = Field(..., min_length=1, max_length=500_000)
    restricted_role: str | None = None


class DocumentIngestResponse(BaseModel):
    id: str
    title: str
    source: str
    restricted_role: str | None
    chunk_count: int
