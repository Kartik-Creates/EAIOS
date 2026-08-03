import logging
from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, Request, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import settings
from app.core.deps import get_current_user, get_db
from app.core.rate_limit import limiter
from app.models.user import User
from app.schemas.meeting import (
    ActionItem,
    Decision,
    MeetingSummarizeRequest,
    MeetingSummaryResponse,
)
from app.services.meeting_service import MeetingIntelligenceError, summarize_meeting

router = APIRouter()
logger = logging.getLogger("eaios.meeting")


@router.post("/meeting/summarize", response_model=MeetingSummaryResponse)
@limiter.limit(settings.CHAT_RATE_LIMIT)
async def summarize_meeting_endpoint(
    request: Request,
    body: MeetingSummarizeRequest,
    current_user: Annotated[User, Depends(get_current_user)],
    db: Annotated[AsyncSession, Depends(get_db)],
) -> MeetingSummaryResponse:
    try:
        _meeting, summary_row, _extracted = await summarize_meeting(
            db,
            transcript=body.transcript,
            organizer_user_id=current_user.id,
        )
    except MeetingIntelligenceError as exc:
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail=f"Meeting intelligence extraction failed: {exc}",
        ) from exc

    return MeetingSummaryResponse(
        summary=summary_row.summary_text,
        decisions=[
            Decision(id=str(index), description=text)
            for index, text in enumerate(summary_row.decisions)
        ],
        action_items=[ActionItem(**item) for item in summary_row.action_items],
        # Structured-extraction has no retrieval-distance signal like chat/search do;
        # a fixed value simply reflects "extraction succeeded" vs the 502 error path.
        confidence=0.9,
    )
