from dataclasses import dataclass

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.chunk import Chunk
from app.models.document import Document
from app.models.meeting import Meeting
from app.models.meeting_summary import MeetingSummary
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


def confidence_from_distance(distance: float) -> float:
    """Map pgvector cosine distance (0=identical) to a [0,1] confidence/score value."""
    return round(max(0.0, min(1.0, 1.0 - distance)), 4)


def excerpt(content: str, max_len: int = 200) -> str:
    return content[:max_len] + "…" if len(content) > max_len else content


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


@dataclass
class RetrievedMeetingSummary:
    meeting_id: str
    meeting_title: str
    summary_text: str
    distance: float


async def semantic_search_meetings(
    db: AsyncSession,
    query: str,
    *,
    organizer_user_id: str | None = None,
    top_k: int = DEFAULT_TOP_K,
    max_distance: float = DEFAULT_MAX_DISTANCE,
) -> list[RetrievedMeetingSummary]:
    """Return meeting summaries similar to `query`, confidence-gated.

    Meeting content is more sensitive than documents, so access is restricted to
    meetings the caller organized — a stricter per-owner rule than the document-level
    role filter, per the Meeting Intelligence plan's explicit security requirement.
    True per-attendee filtering needs a real attendee list (Zoom/Teams provide one);
    Phase A's manual-paste flow only has a single organizer to check against.
    """
    query_vector = await embed_text(query)
    distance = MeetingSummary.embedding.cosine_distance(query_vector)

    stmt = (
        select(MeetingSummary, Meeting, distance.label("distance"))
        .join(Meeting, MeetingSummary.meeting_id == Meeting.id)
        .where(distance < max_distance)
        .order_by(distance)
        .limit(top_k)
    )

    if organizer_user_id is not None:
        stmt = stmt.where(Meeting.organizer_user_id == organizer_user_id)

    rows = (await db.execute(stmt)).all()

    return [
        RetrievedMeetingSummary(
            meeting_id=meeting.id,
            meeting_title=meeting.title,
            summary_text=summary.summary_text,
            distance=float(dist),
        )
        for summary, meeting, dist in rows
    ]
