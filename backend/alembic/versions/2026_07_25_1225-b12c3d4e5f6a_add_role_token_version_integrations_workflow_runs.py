"""add role and token_version to users, create integrations and workflow_runs

Revision ID: b12c3d4e5f6a
Revises: a01b2c3d4e5f
Create Date: 2026-07-25 12:25:00.000000

NOTE: Written to match what `alembic revision --autogenerate` would produce
given the model diffs.  The local dev DB (Docker Compose PostgreSQL) was not
reachable at generation time — verify with `alembic upgrade head` against
a fresh database before merging.
"""
from alembic import op
import sqlalchemy as sa

revision = "b12c3d4e5f6a"
down_revision = "a01b2c3d4e5f"
branch_labels = None
depends_on = None


def upgrade() -> None:
    # --- users: add role and token_version columns ---
    op.add_column(
        "users",
        sa.Column("role", sa.String(), nullable=False, server_default="employee"),
    )
    op.add_column(
        "users",
        sa.Column("token_version", sa.Integer(), nullable=False, server_default="0"),
    )

    # --- integrations table ---
    op.create_table(
        "integrations",
        sa.Column("id", sa.String(), primary_key=True),
        sa.Column(
            "user_id",
            sa.String(),
            sa.ForeignKey("users.id", ondelete="CASCADE"),
            nullable=False,
        ),
        sa.Column("provider", sa.String(), nullable=False),
        sa.Column(
            "status", sa.String(), nullable=False, server_default="active"
        ),
        sa.Column("config_json", sa.Text(), nullable=True),
        sa.Column("last_sync_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.func.now(),
            nullable=False,
        ),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=True),
    )
    op.create_index(
        "ix_integrations_user_id", "integrations", ["user_id"]
    )

    # --- workflow_runs table (append-only audit trail) ---
    op.create_table(
        "workflow_runs",
        sa.Column("id", sa.String(), primary_key=True),
        sa.Column(
            "user_id",
            sa.String(),
            sa.ForeignKey("users.id", ondelete="CASCADE"),
            nullable=False,
        ),
        sa.Column("workflow_name", sa.String(), nullable=False),
        sa.Column(
            "status", sa.String(), nullable=False, server_default="pending"
        ),
        sa.Column("trigger_params", sa.Text(), nullable=True),
        sa.Column("result_summary", sa.Text(), nullable=True),
        sa.Column(
            "started_at",
            sa.DateTime(timezone=True),
            server_default=sa.func.now(),
            nullable=False,
        ),
        sa.Column("completed_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.func.now(),
            nullable=False,
        ),
    )
    op.create_index(
        "ix_workflow_runs_user_id", "workflow_runs", ["user_id"]
    )


def downgrade() -> None:
    op.drop_index("ix_workflow_runs_user_id", table_name="workflow_runs")
    op.drop_table("workflow_runs")
    op.drop_index("ix_integrations_user_id", table_name="integrations")
    op.drop_table("integrations")
    op.drop_column("users", "token_version")
    op.drop_column("users", "role")
