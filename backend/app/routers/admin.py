from typing import Annotated

from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select

from app.core.deps import get_db, require_role
from app.models.user import User
from app.schemas.user import UserRead

router = APIRouter()


@router.get("/users", response_model=list[UserRead])
async def list_users(
    _current_admin: Annotated[User, Depends(require_role("admin"))],
    db: Annotated[AsyncSession, Depends(get_db)],
):
    """List all users — admin only.

    Proof-of-concept for the require_role() RBAC pattern.
    Response exposes only id, email, full_name, role, is_active, is_superuser
    via the UserRead schema — no password hashes or internal fields.
    """
    stmt = select(User).order_by(User.created_at)
    res = await db.execute(stmt)
    return res.scalars().all()
