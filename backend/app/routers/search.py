from typing import Annotated

from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.deps import get_current_user, get_db
from app.models.user import User
from app.schemas.search import SearchResponse, SearchResult
from app.services.retrieval_service import (
    confidence_from_distance,
    excerpt,
    semantic_search,
    semantic_search_meetings,
)

router = APIRouter()

_MAX_TOP_K = 20
_DEFAULT_TOP_K = 10


@router.get("/search", response_model=SearchResponse)
async def search(
    current_user: Annotated[User, Depends(get_current_user)],
    db: Annotated[AsyncSession, Depends(get_db)],
    q: Annotated[str, Query(min_length=1, max_length=4000)],
    top_k: Annotated[int, Query(ge=1, le=_MAX_TOP_K)] = _DEFAULT_TOP_K,
) -> SearchResponse:
    # allowed_roles is derived from the authenticated user — never omitted/None,
    # which would fall back to unrestricted access inside semantic_search().
    doc_results = await semantic_search(db, q, allowed_roles=[current_user.role], top_k=top_k)
    meeting_results = await semantic_search_meetings(
        db, q, organizer_user_id=current_user.id, top_k=top_k
    )

    combined = [
        SearchResult(
            document_id=chunk.document_id,
            document_title=chunk.document_title,
            excerpt=excerpt(chunk.content),
            score=confidence_from_distance(chunk.distance),
            source_type="document",
        )
        for chunk in doc_results
    ] + [
        SearchResult(
            document_id=meeting.meeting_id,
            document_title=meeting.meeting_title,
            excerpt=excerpt(meeting.summary_text),
            score=confidence_from_distance(meeting.distance),
            source_type="meeting",
        )
        for meeting in meeting_results
    ]
    combined.sort(key=lambda r: r.score, reverse=True)

    return SearchResponse(query=q, results=combined[:top_k])
