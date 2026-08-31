from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.deps import get_db, require_admin_access
from app.models.chunk import Chunk
from app.models.user import User
from app.schemas.document import DocumentIngestRequest, DocumentIngestResponse
from app.services.ingestion_service import ingest_document

router = APIRouter()


@router.post("/documents", response_model=DocumentIngestResponse, status_code=status.HTTP_201_CREATED)
async def ingest_document_endpoint(
    body: DocumentIngestRequest,
    current_admin: Annotated[User, Depends(require_admin_access)],
    db: Annotated[AsyncSession, Depends(get_db)],
):
    """Manually add a document to the Company Brain knowledge base — admin only.

    Runs the same chunk -> embed -> store pipeline already used by Drive sync
    and Meeting Intelligence, via whichever EMBEDDING_PROVIDER is actually
    configured on this deployment — so content added here always lands in
    the same vector space as everything else on that deployment, regardless
    of whether it's run locally (Ollama) or on Render (Gemini).

    Restricted to admin so any employee can't unilaterally add unvetted
    content to a knowledge base every other employee's chat answers draw from.
    """
    try:
        document = await ingest_document(
            db,
            title=body.title,
            content=body.content,
            source="manual_upload",
            restricted_role=body.restricted_role,
            owner_id=current_admin.id,
        )
    except Exception as exc:
        # as a clean error to the caller, not a raw 500 with an internal traceback.
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail=f"Document ingestion failed: {exc}",
        ) from exc

    chunk_count_stmt = select(func.count()).select_from(Chunk).where(Chunk.document_id == document.id)
    chunk_count = (await db.execute(chunk_count_stmt)).scalar_one()

    return DocumentIngestResponse(
        id=document.id,
        title=document.title,
        source=document.source,
        restricted_role=document.restricted_role,
        chunk_count=chunk_count,
    )
