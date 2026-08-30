"""Daily Briefing API Router.

Exposes POST /api/v1/briefing for triggering the Daily Briefing Agent,
and GET /api/v1/briefing/{source}/{item_id} for fetching item detail.
"""
from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, Request, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import settings
from app.core.deps import get_current_user, get_db
from app.core.rate_limit import limiter
from app.models.user import User
from app.schemas.briefing import BriefingItemDetail, BriefingResponse
from app.services.briefing_service import generate_daily_briefing, get_briefing_item_detail

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


@router.get("/briefing/{source}/{item_id}", response_model=BriefingItemDetail)
@limiter.limit(settings.CHAT_RATE_LIMIT)
async def get_briefing_item_detail_endpoint(
    source: str,
    item_id: str,
    request: Request,
    current_user: Annotated[User, Depends(get_current_user)],
    db: Annotated[AsyncSession, Depends(get_db)],
):
    """Fetch full detail for a single briefing item.

    Server-side ownership is enforced: the item is fetched using the requesting
    user's own OAuth token, so User A cannot access User B's items.
    No tokens or full body content are logged in plaintext.
    """
    valid_sources = {"gmail", "jira", "github", "calendar", "slack", "drive"}
    if source not in valid_sources:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid source '{source}'. Valid sources: {', '.join(sorted(valid_sources))}",
        )

    detail = await get_briefing_item_detail(db=db, user=current_user, source=source, item_id=item_id)
    if not detail:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Item not found or integration not connected.",
        )
    return detail


@router.get("/connectors")
async def list_connectors_endpoint(
    current_user: Annotated[User, Depends(get_current_user)],
):
    """Retrieve list of registered connectors for frontend discovery."""
    from app.connectors.registry import connector_registry

    return connector_registry.get_connector_list()
