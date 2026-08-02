"""Daily Briefing API Router.

Exposes POST /api/v1/briefing for triggering the Daily Briefing Agent.
"""
from typing import Annotated

from fastapi import APIRouter, Depends, Request
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import settings
from app.core.deps import get_current_user, get_db
from app.core.rate_limit import limiter
from app.models.user import User
from app.schemas.briefing import BriefingResponse
from app.services.briefing_service import generate_daily_briefing

router = APIRouter()


@router.post("/briefing", response_model=BriefingResponse)
@limiter.limit(settings.CHAT_RATE_LIMIT)
async def get_daily_briefing_endpoint(
    request: Request,
    current_user: Annotated[User, Depends(get_current_user)],
    db: Annotated[AsyncSession, Depends(get_db)],
):
    """Synthesizes a personalized daily briefing across connected Jira, Google Calendar, Gmail, and GitHub integrations."""
    return await generate_daily_briefing(db=db, user=current_user)
