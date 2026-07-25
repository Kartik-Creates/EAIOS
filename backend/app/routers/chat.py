import logging
import uuid
from typing import Annotated

from fastapi import APIRouter, Depends, Request
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import settings
from app.core.deps import get_current_user, get_db
from app.core.rate_limit import limiter
from app.models.unanswered_query import UnansweredQuery
from app.models.user import User
from app.schemas.chat import ChatRequest, ChatResponse, Citation
from app.services.llm_service import generate_answer
from app.services.retrieval_service import semantic_search

router = APIRouter()
logger = logging.getLogger("eaios.chat")

FALLBACK_MESSAGE = "I couldn't find this in company documents — I've flagged it for review."

_EXCERPT_LEN = 200


def _confidence_from_distance(distance: float) -> float:
    """Map pgvector cosine distance (0=identical) to a [0,1] confidence score."""
    return round(max(0.0, min(1.0, 1.0 - distance)), 4)


@router.post("/chat", response_model=ChatResponse)
@limiter.limit(settings.CHAT_RATE_LIMIT)
async def chat(
    request: Request,
    body: ChatRequest,
    current_user: Annotated[User, Depends(get_current_user)],
    db: Annotated[AsyncSession, Depends(get_db)],
) -> ChatResponse:
    conversation_id = body.conversation_id or str(uuid.uuid4())

    # allowed_roles is derived from the authenticated user — never omitted/None,
    # which would fall back to unrestricted access inside semantic_search().
    results = await semantic_search(db, body.query, allowed_roles=[current_user.role])

    if not results:
        db.add(
            UnansweredQuery(
                user_id=current_user.id,
                query_text=body.query,
                status="pending",
            )
        )
        await db.commit()

        logger.info(
            "chat_fallback user_id=%s confidence=%.4f",
            current_user.id,
            0.0,
        )
        return ChatResponse(
            answer=FALLBACK_MESSAGE,
            confidence=0.0,
            citations=[],
            conversation_id=conversation_id,
            flagged_for_review=True,
        )

    answer = await generate_answer(body.query, results)
    confidence = _confidence_from_distance(results[0].distance)

    logger.info(
        "chat_answered user_id=%s confidence=%.4f chunks=%d",
        current_user.id,
        confidence,
        len(results),
    )

    citations = [
        Citation(
            document_title=chunk.document_title,
            document_id=chunk.document_id,
            excerpt=(
                chunk.content[:_EXCERPT_LEN] + "…"
                if len(chunk.content) > _EXCERPT_LEN
                else chunk.content
            ),
        )
        for chunk in results
    ]

    return ChatResponse(
        answer=answer,
        confidence=confidence,
        citations=citations,
        conversation_id=conversation_id,
        flagged_for_review=False,
    )
