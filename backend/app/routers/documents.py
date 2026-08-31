from typing import Annotated

from fastapi import APIRouter, Depends, File, Form, HTTPException, Response, UploadFile, status
from sqlalchemy import delete, func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.deps import get_db, require_admin_access
from app.models.chunk import Chunk
from app.models.document import Document
from app.models.user import User
from app.schemas.document import (
    DocumentIngestRequest,
    DocumentIngestResponse,
    DocumentItemResponse,
)
from app.services.document_parser import DocumentParserError, extract_text_from_file
from app.services.ingestion_service import ingest_document

router = APIRouter()

MAX_FILE_SIZE = 50 * 1024 * 1024  # 50 MB


@router.post("/documents", response_model=DocumentIngestResponse, status_code=status.HTTP_201_CREATED)
async def ingest_document_endpoint(
    body: DocumentIngestRequest,
    current_admin: Annotated[User, Depends(require_admin_access)],
    db: Annotated[AsyncSession, Depends(get_db)],
):
    """Manually add a document to the Company Brain knowledge base via raw JSON — admin only.

    Runs the same chunk -> embed -> store pipeline already used by Drive sync
    and Meeting Intelligence, via whichever EMBEDDING_PROVIDER is actually
    configured on this deployment.
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


@router.post("/documents/upload", response_model=DocumentItemResponse, status_code=status.HTTP_201_CREATED)
async def upload_document_endpoint(
    file: UploadFile = File(...),
    restricted_role: str | None = Form(None),
    current_admin: Annotated[User, Depends(require_admin_access)] = None,
    db: Annotated[AsyncSession, Depends(get_db)] = None,
):
    """Upload a file (DOCX, PDF, TXT, CSV, etc.) to the Company Brain knowledge base.

    Extracts plain text from the file, creates vector chunks with embeddings,
    and indexes it so that agents can immediately retrieve and refer to it.
    """
    if not file.filename:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Uploaded file must have a filename.",
        )

    try:
        content_bytes = await file.read()
    except Exception as exc:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Failed to read file payload: {exc}",
        ) from exc

    if len(content_bytes) > MAX_FILE_SIZE:
        raise HTTPException(
            status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
            detail="File size exceeds maximum allowed limit of 50 MB.",
        )

    try:
        extracted_text = extract_text_from_file(file.filename, content_bytes)
    except DocumentParserError as exc:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(exc),
        ) from exc
    except Exception as exc:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error parsing file: {exc}",
        ) from exc

    if not extracted_text.strip():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"No readable text could be extracted from '{file.filename}'.",
        )

    role_val = restricted_role.strip().lower() if restricted_role and restricted_role.strip().lower() != "none" else None

    try:
        document = await ingest_document(
            db,
            title=file.filename,
            content=extracted_text,
            source="manual_upload",
            restricted_role=role_val,
            owner_id=current_admin.id,
        )
    except Exception as exc:
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail=f"Document ingestion failed: {exc}",
        ) from exc

    chunk_count_stmt = select(func.count()).select_from(Chunk).where(Chunk.document_id == document.id)
    chunk_count = (await db.execute(chunk_count_stmt)).scalar_one()

    return DocumentItemResponse(
        id=document.id,
        title=document.title,
        source=document.source,
        restricted_role=document.restricted_role,
        chunk_count=chunk_count,
        created_at=document.created_at,
    )


@router.get("/documents", response_model=list[DocumentItemResponse])
async def list_documents_endpoint(
    current_admin: Annotated[User, Depends(require_admin_access)],
    db: Annotated[AsyncSession, Depends(get_db)],
):
    """Retrieve all indexed documents in the Company Brain knowledge base."""
    stmt = (
        select(Document, func.count(Chunk.id).label("chunk_count"))
        .outerjoin(Chunk, Document.id == Chunk.document_id)
        .group_by(Document.id)
        .order_by(Document.created_at.desc())
    )
    result = await db.execute(stmt)
    rows = result.all()

    documents = []
    for doc, chunk_cnt in rows:
        documents.append(
            DocumentItemResponse(
                id=doc.id,
                title=doc.title,
                source=doc.source,
                restricted_role=doc.restricted_role,
                chunk_count=chunk_cnt,
                created_at=doc.created_at,
            )
        )
    return documents


@router.delete("/documents/{document_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_document_endpoint(
    document_id: str,
    current_admin: Annotated[User, Depends(require_admin_access)],
    db: Annotated[AsyncSession, Depends(get_db)],
):
    """Delete a document and its indexed vector chunks from Company Brain."""
    stmt = select(Document).where(Document.id == document_id)
    doc = (await db.execute(stmt)).scalars().first()

    if not doc:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Document not found.",
        )

    # Explicitly remove child chunks first to ensure clean cascade in all DB backends
    await db.execute(delete(Chunk).where(Chunk.document_id == document_id))
    await db.delete(doc)
    await db.commit()

    return Response(status_code=status.HTTP_204_NO_CONTENT)
