"""create meetings and meeting_summaries tables

Revision ID: e34f5a6b7c8d
Revises: d01e2f3a4b5c
Create Date: 2026-08-02 14:00:00.000000

NOTE: hand-written (no live DB available to autogenerate against) — verify
with `alembic upgrade head` against a fresh database before merging.
"""
import sqlalchemy as sa
from alembic import op
from pgvector.sqlalchemy import Vector

revision = "e34f5a6b7c8d"
down_revision = "d01e2f3a4b5c"
branch_labels = None
depends_on = None

EMBEDDING_DIM = 768


def upgrade() -> None:
    op.create_table(
        "meetings",
        sa.Column("id", sa.String(), primary_key=True),
        sa.Column("source", sa.String(), nullable=False, server_default="manual"),
        sa.Column("title", sa.String(), nullable=False),
        sa.Column("raw_transcript_ref", sa.String(), nullable=True),
        sa.Column("started_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("ended_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column(
            "organizer_user_id",
            sa.String(),
            sa.ForeignKey("users.id", ondelete="CASCADE"),
            nullable=False,
        ),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
    )
    op.create_index("ix_meetings_organizer_user_id", "meetings", ["organizer_user_id"])

    op.create_table(
        "meeting_summaries",
        sa.Column("id", sa.String(), primary_key=True),
        sa.Column(
            "meeting_id",
            sa.String(),
            sa.ForeignKey("meetings.id", ondelete="CASCADE"),
            nullable=False,
        ),
        sa.Column("summary_text", sa.Text(), nullable=False),
        sa.Column("decisions", sa.JSON(), nullable=False),
        sa.Column("action_items", sa.JSON(), nullable=False),
        sa.Column("embedding", Vector(EMBEDDING_DIM), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
    )
    op.create_index("ix_meeting_summaries_meeting_id", "meeting_summaries", ["meeting_id"])

    # HNSW index over cosine distance, same pattern as chunks.embedding.
    op.execute(
        "CREATE INDEX ix_meeting_summaries_embedding_hnsw ON meeting_summaries "
        "USING hnsw (embedding vector_cosine_ops)"
    )


def downgrade() -> None:
    op.execute("DROP INDEX IF EXISTS ix_meeting_summaries_embedding_hnsw")
    op.drop_index("ix_meeting_summaries_meeting_id", table_name="meeting_summaries")
    op.drop_table("meeting_summaries")
    op.drop_index("ix_meetings_organizer_user_id", table_name="meetings")
    op.drop_table("meetings")
