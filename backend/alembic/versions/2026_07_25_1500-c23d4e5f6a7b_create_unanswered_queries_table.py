"""create unanswered_queries table

Revision ID: c23d4e5f6a7b
Revises: b12c3d4e5f6a
Create Date: 2026-07-25 15:00:00.000000

NOTE: hand-written (no live DB available to autogenerate against) — verify
with `alembic upgrade head` against a fresh database before merging.
"""
import sqlalchemy as sa
from alembic import op

revision = "c23d4e5f6a7b"
down_revision = "b12c3d4e5f6a"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "unanswered_queries",
        sa.Column("id", sa.String(), primary_key=True),
        sa.Column(
            "user_id",
            sa.String(),
            sa.ForeignKey("users.id", ondelete="CASCADE"),
            nullable=False,
        ),
        sa.Column("query_text", sa.Text(), nullable=False),
        sa.Column(
            "timestamp",
            sa.DateTime(timezone=True),
            server_default=sa.func.now(),
            nullable=False,
        ),
        sa.Column("status", sa.String(), nullable=False, server_default="pending"),
    )
    op.create_index("ix_unanswered_queries_user_id", "unanswered_queries", ["user_id"])


def downgrade() -> None:
    op.drop_index("ix_unanswered_queries_user_id", table_name="unanswered_queries")
    op.drop_table("unanswered_queries")
