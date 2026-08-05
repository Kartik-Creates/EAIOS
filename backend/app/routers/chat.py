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
from app.services.live_data_service import (
    answer_live_data_query,
    classify_live_data_intent,
)
from app.services.llm_service import generate_answer
from app.services.retrieval_service import (
    confidence_from_distance,
    excerpt,
    semantic_search,
)

router = APIRouter()
logger = logging.getLogger("eaios.chat")

FALLBACK_MESSAGE = "I couldn't find this in company documents — I've flagged it for review."


@router.post("/chat", response_model=ChatResponse)
@limiter.limit(settings.CHAT_RATE_LIMIT)
async def chat(
    request: Request,
    body: ChatRequest,
    current_user: Annotated[User, Depends(get_current_user)],
    db: Annotated[AsyncSession, Depends(get_db)],
) -> ChatResponse:
    conversation_id = body.conversation_id or str(uuid.uuid4())

    # Route queries about the user's own live connected-app data (meetings,
    # mail, tickets, PRs) to the Briefing Agent tools instead of the static
    # document knowledge base.
    live_source = classify_live_data_intent(body.query)
    if live_source:
        answer, source_result = await answer_live_data_query(db, current_user, body.query, live_source)

        citations = [
            Citation(document_title=item.title, document_id=live_source, excerpt=item.detail)
            for item in source_result.items
        ]
        # Live-data answers aren't a "match confidence" the way document
        # retrieval is — 1.0 once we've successfully queried the connected
        # source (even with zero items), 0.0 if we couldn't (not connected /
        # API error), so the frontend's confidence badge stays meaningful.
        confidence = 1.0 if source_result.connected and not source_result.error else 0.0

        logger.info(
            "chat_live_data user_id=%s source=%s connected=%s items=%d",
            current_user.id,
            live_source,
            source_result.connected,
            len(source_result.items),
        )

        return ChatResponse(
            answer=answer,
            confidence=confidence,
            citations=citations,
            conversation_id=conversation_id,
            flagged_for_review=False,
        )

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
    confidence = confidence_from_distance(results[0].distance)

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
            excerpt=excerpt(chunk.content),
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
