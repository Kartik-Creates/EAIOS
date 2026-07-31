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
    results = await semantic_search(db, q, allowed_roles=[current_user.role], top_k=top_k)

    return SearchResponse(
        query=q,
        results=[
            SearchResult(
                document_id=chunk.document_id,
                document_title=chunk.document_title,
                excerpt=excerpt(chunk.content),
                score=confidence_from_distance(chunk.distance),
            )
            for chunk in results
        ],
    )
