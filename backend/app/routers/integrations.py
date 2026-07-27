from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.deps import get_current_user, get_db
from app.models.user import User
from app.services.drive_sync_service import sync_drive_documents, DriveSyncError

router = APIRouter()

@router.post("/drive/sync")
async def trigger_drive_sync(
    current_user: Annotated[User, Depends(get_current_user)],
    db: Annotated[AsyncSession, Depends(get_db)],
):
    """Manually trigger a sync of files from the user's Google Drive OAuth integration."""
    try:
        summary = await sync_drive_documents(db=db, user_id=current_user.id)
        return summary
    except DriveSyncError as exc:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(exc)
        )
    except Exception as exc:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"An unexpected error occurred during sync: {exc}"
        )
