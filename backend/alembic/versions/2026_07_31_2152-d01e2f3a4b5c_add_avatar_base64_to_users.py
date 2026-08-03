"""add avatar_base64 to users

Revision ID: d01e2f3a4b5c
Revises: c23d4e5f6a7b
Create Date: 2026-07-31 21:52:00.000000

NOTE: hand-written migration to add avatar_base64 column.
"""
import sqlalchemy as sa
from alembic import op


revision = "d01e2f3a4b5c"
down_revision = "c23d4e5f6a7b"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column("users", sa.Column("avatar_base64", sa.String(), nullable=True))


def downgrade() -> None:
    op.drop_column("users", "avatar_base64")
