from sqlalchemy.ext.asyncio import AsyncSession

from app.models.chunk import Chunk
from app.models.document import Document
from app.services.chunking_service import chunk_text
from app.services.embedding_service import embed_texts


async def ingest_document(
    db: AsyncSession,
    *,
    title: str,
    content: str,
    source: str,
    source_uri: str | None = None,
    restricted_role: str | None = None,
    owner_id: str | None = None,
) -> Document:
    """Chunk, embed, and store a document's content as searchable vector chunks."""
    document = Document(
        title=title,
        source=source,
        source_uri=source_uri,
        restricted_role=restricted_role,
        owner_id=owner_id,
    )
    db.add(document)
    await db.flush()  # assign document.id before chunks reference it

    pieces = chunk_text(content)
    if pieces:
        vectors = await embed_texts(pieces)
        for index, (piece, vector) in enumerate(zip(pieces, vectors)):
            db.add(
                Chunk(
                    document_id=document.id,
                    chunk_index=index,
                    content=piece,
                    token_count=len(piece.split()),
                    embedding=vector,
                )
            )

    await db.commit()
    await db.refresh(document)
    return document
