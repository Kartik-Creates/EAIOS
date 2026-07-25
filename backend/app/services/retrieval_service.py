from dataclasses import dataclass

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.chunk import Chunk
from app.models.document import Document
from app.services.embedding_service import embed_text

DEFAULT_TOP_K = 5
# Cosine distance guardrail (0 = identical, 2 = opposite). Matches above this
# are considered too weak to trust as grounding for an LLM answer.
DEFAULT_MAX_DISTANCE = 0.45


@dataclass
class RetrievedChunk:
    chunk_id: str
    document_id: str
    document_title: str
    content: str
    distance: float


async def semantic_search(
    db: AsyncSession,
    query: str,
    *,
    allowed_roles: list[str] | None = None,
    top_k: int = DEFAULT_TOP_K,
    max_distance: float = DEFAULT_MAX_DISTANCE,
) -> list[RetrievedChunk]:
    """Return chunks similar to `query`, permission-filtered and confidence-gated.

    Document-level restriction is applied in the SQL WHERE clause so restricted
    content never reaches the caller (and therefore never reaches an LLM prompt) —
    it is not filtered out after the fact.
    """
    query_vector = await embed_text(query)
    distance = Chunk.embedding.cosine_distance(query_vector)

    stmt = (
        select(Chunk, Document, distance.label("distance"))
        .join(Document, Chunk.document_id == Document.id)
        .where(distance < max_distance)
        .order_by(distance)
        .limit(top_k)
    )

    if allowed_roles is not None:
        stmt = stmt.where(
            (Document.restricted_role.is_(None)) | (Document.restricted_role.in_(allowed_roles))
        )

    rows = (await db.execute(stmt)).all()

    return [
        RetrievedChunk(
            chunk_id=chunk.id,
            document_id=doc.id,
            document_title=doc.title,
            content=chunk.content,
            distance=float(dist),
        )
        for chunk, doc, dist in rows
    ]
