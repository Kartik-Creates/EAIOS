#!/usr/bin/env python
"""One-time migration script: re-embed all existing document chunks using the
currently configured EMBEDDING_PROVIDER (e.g. Gemini text-embedding-004).

SAFETY:
  - Writes new embeddings to a staging column (embedding_new) first, then
    swaps over in a single transaction — old embeddings are preserved until
    the entire migration succeeds and is verified.
  - Idempotent: safe to re-run if it fails partway through. Chunks that
    already have a non-null embedding_new are skipped on subsequent runs.
  - Logs chunk IDs and progress counts only — never prints document text.

USAGE:
  cd backend/
  python -m scripts.reembed_documents          # dry-run: prints plan only
  python -m scripts.reembed_documents --run    # actually re-embed
  python -m scripts.reembed_documents --swap   # swap staging -> live column

Requires DATABASE_URL, EMBEDDING_PROVIDER, and (if gemini) GEMINI_API_KEY
to be set in the environment or backend/.env.
"""
import argparse
import asyncio
import logging
import os
import sys

# Ensure the backend root is on sys.path so `app.*` imports work when
# invoked as `python -m scripts.reembed_documents` from backend/.
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.core.config import settings
from app.db.session import AsyncSessionLocal, engine
from app.models.chunk import Chunk
from app.services.embedding_service import EmbeddingServiceError, embed_text
from sqlalchemy import func, select, text

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s  %(levelname)-8s  %(message)s",
)
logger = logging.getLogger("reembed")

# Batch size for committing progress (keeps transactions short)
BATCH_SIZE = 25


async def ensure_staging_column() -> None:
    """Add `embedding_new` column to chunks table if it doesn't exist."""
    dim = settings.EMBEDDING_DIM
    async with engine.begin() as conn:
        # Check if column already exists
        result = await conn.execute(
            text(
                "SELECT column_name FROM information_schema.columns "
                "WHERE table_name = 'chunks' AND column_name = 'embedding_new'"
            )
        )
        if result.fetchone() is None:
            logger.info("Creating staging column 'embedding_new' (vector(%d))", dim)
            await conn.execute(
                text(f"ALTER TABLE chunks ADD COLUMN embedding_new vector({dim})")
            )
            logger.info("Staging column created.")
        else:
            logger.info("Staging column 'embedding_new' already exists.")


async def count_chunks() -> tuple[int, int]:
    """Return (total_chunks, chunks_needing_reembed)."""
    async with AsyncSessionLocal() as session:
        total = (await session.execute(select(func.count(Chunk.id)))).scalar() or 0
        pending = (
            await session.execute(
                select(func.count(Chunk.id)).where(
                    text("embedding_new IS NULL")
                )
            )
        ).scalar() or 0
    return total, pending


async def reembed_all() -> None:
    """Re-embed every chunk that doesn't yet have a staging embedding."""
    total, pending = await count_chunks()
    logger.info("Total chunks: %d | Already re-embedded: %d | Pending: %d", total, total - pending, pending)

    if pending == 0:
        logger.info("All chunks already have staging embeddings. Nothing to do.")
        return

    processed = 0
    failed_ids: list[str] = []

    async with AsyncSessionLocal() as session:
        # Stream chunk IDs + content for chunks still needing re-embedding
        result = await session.execute(
            select(Chunk.id, Chunk.content).where(text("embedding_new IS NULL")).order_by(Chunk.id)
        )
        rows = result.all()

    for i in range(0, len(rows), BATCH_SIZE):
        batch = rows[i : i + BATCH_SIZE]
        async with AsyncSessionLocal() as session:
            for chunk_id, content in batch:
                try:
                    new_vector = await embed_text(content)
                    await session.execute(
                        text(
                            "UPDATE chunks SET embedding_new = :vec WHERE id = :cid"
                        ),
                        {"vec": str(new_vector), "cid": chunk_id},
                    )
                    processed += 1
                except EmbeddingServiceError as exc:
                    logger.error("Failed to embed chunk %s: %s", chunk_id, exc)
                    failed_ids.append(chunk_id)

            await session.commit()
            logger.info("Progress: %d/%d chunks re-embedded", processed, pending)

    logger.info("Re-embedding complete. Success: %d | Failed: %d", processed, len(failed_ids))
    if failed_ids:
        logger.warning("Failed chunk IDs: %s", failed_ids)
        logger.warning("Re-run this script to retry failed chunks.")


async def swap_columns() -> None:
    """Atomically swap embedding_new -> embedding once migration is verified."""
    total, pending = await count_chunks()

    if pending > 0:
        logger.error(
            "Cannot swap: %d chunks still have NULL embedding_new. "
            "Run `--run` first to complete re-embedding.", pending
        )
        sys.exit(1)

    logger.info("All %d chunks have staging embeddings. Swapping columns...", total)

    async with engine.begin() as conn:
        # Drop old HNSW index
        await conn.execute(text("DROP INDEX IF EXISTS ix_chunks_embedding_hnsw"))
        # Rename: embedding -> embedding_old, embedding_new -> embedding
        await conn.execute(text("ALTER TABLE chunks RENAME COLUMN embedding TO embedding_old"))
        await conn.execute(text("ALTER TABLE chunks RENAME COLUMN embedding_new TO embedding"))
        # Recreate HNSW index on new embedding column
        await conn.execute(
            text(
                "CREATE INDEX ix_chunks_embedding_hnsw ON chunks "
                "USING hnsw (embedding vector_cosine_ops)"
            )
        )
        logger.info("Column swap complete. Old embeddings preserved in 'embedding_old'.")
        logger.info("To reclaim space later: ALTER TABLE chunks DROP COLUMN embedding_old")


async def dry_run() -> None:
    """Print migration plan without modifying anything."""
    total, _ = await count_chunks()
    provider = settings.EMBEDDING_PROVIDER
    logger.info("=== DRY RUN ===")
    logger.info("EMBEDDING_PROVIDER = %s", provider)
    logger.info("EMBEDDING_DIM      = %d", settings.EMBEDDING_DIM)
    logger.info("Total chunks to re-embed: %d", total)
    logger.info("Run with --run to start re-embedding, then --swap to activate.")


async def main() -> None:
    parser = argparse.ArgumentParser(description="Re-embed document chunks for provider migration")
    group = parser.add_mutually_exclusive_group()
    group.add_argument("--run", action="store_true", help="Execute re-embedding (writes to staging column)")
    group.add_argument("--swap", action="store_true", help="Swap staging embeddings to live column")
    args = parser.parse_args()

    if args.run:
        await ensure_staging_column()
        await reembed_all()
    elif args.swap:
        await swap_columns()
    else:
        await dry_run()


if __name__ == "__main__":
    asyncio.run(main())
