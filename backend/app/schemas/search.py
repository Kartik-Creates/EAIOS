from pydantic import BaseModel


class SearchResult(BaseModel):
    document_id: str
    document_title: str
    excerpt: str
    score: float
    source_type: str = "document"  # "document" | "meeting"


class SearchResponse(BaseModel):
    query: str
    results: list[SearchResult]
