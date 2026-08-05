import enum
import uuid
from sqlalchemy import (
    JSON,
    Boolean,
    Column,
    DateTime,
    Enum,
    ForeignKey,
    String,
    Text,
    func,
)
from sqlalchemy.orm import relationship

from app.db.base import Base


class WorkflowTriggerType(str, enum.Enum):
    MANUAL = "MANUAL"
    SCHEDULED = "SCHEDULED"
    EVENT = "EVENT"
    WEBHOOK = "WEBHOOK"


class WorkflowStatus(str, enum.Enum):
    DRAFT = "DRAFT"
    ACTIVE = "ACTIVE"
    INACTIVE = "INACTIVE"
    ARCHIVED = "ARCHIVED"


class WorkflowRunStatus(str, enum.Enum):
    PENDING = "PENDING"
    AWAITING_APPROVAL = "AWAITING_APPROVAL"
    RUNNING = "RUNNING"
    COMPLETED = "COMPLETED"
    FAILED = "FAILED"
    CANCELLED = "CANCELLED"


class WorkflowApprovalStatus(str, enum.Enum):
    PENDING = "PENDING"
    APPROVED = "APPROVED"
    REJECTED = "REJECTED"


class Workflow(Base):
    __tablename__ = "workflows"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()), index=True)
    title = Column(String(255), nullable=False, index=True)
    description = Column(Text, nullable=True)
    trigger_type = Column(
        Enum(WorkflowTriggerType),
        nullable=False,
        default=WorkflowTriggerType.MANUAL,
        server_default=WorkflowTriggerType.MANUAL.value,
    )
    status = Column(
        Enum(WorkflowStatus),
        nullable=False,
        default=WorkflowStatus.ACTIVE,
        server_default=WorkflowStatus.ACTIVE.value,
    )
    is_active = Column(Boolean, default=True, nullable=False)
    config = Column(JSON, nullable=True, default=dict)
    
    created_by_id = Column(String, ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)

    creator = relationship("User", foreign_keys=[created_by_id])
    runs = relationship("WorkflowRunV2", back_populates="workflow", cascade="all, delete-orphan")


class WorkflowRunV2(Base):
    __tablename__ = "workflow_runs_v2"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()), index=True)
    workflow_id = Column(String, ForeignKey("workflows.id", ondelete="CASCADE"), nullable=False, index=True)
    triggered_by_id = Column(String, ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    
    status = Column(
        Enum(WorkflowRunStatus),
        nullable=False,
        default=WorkflowRunStatus.PENDING,
        server_default=WorkflowRunStatus.PENDING.value,
        index=True,
    )
    inputs = Column(JSON, nullable=True, default=dict)
    outputs = Column(JSON, nullable=True, default=dict)
    error_message = Column(Text, nullable=True)
    
    started_at = Column(DateTime(timezone=True), nullable=True)
    completed_at = Column(DateTime(timezone=True), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)

    workflow = relationship("Workflow", back_populates="runs")
    triggered_by = relationship("User", foreign_keys=[triggered_by_id])
    steps = relationship("WorkflowStepRun", back_populates="workflow_run", cascade="all, delete-orphan")
    approvals = relationship("WorkflowApproval", back_populates="workflow_run", cascade="all, delete-orphan")


class WorkflowStepRun(Base):
    __tablename__ = "workflow_step_runs"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()), index=True)
    workflow_run_id = Column(String, ForeignKey("workflow_runs_v2.id", ondelete="CASCADE"), nullable=False, index=True)
    
    step_key = Column(String(100), nullable=False)
    step_type = Column(String(100), nullable=False)
    status = Column(
        Enum(WorkflowRunStatus),
        nullable=False,
        default=WorkflowRunStatus.PENDING,
        server_default=WorkflowRunStatus.PENDING.value,
    )
    input_data = Column(JSON, nullable=True, default=dict)
    output_data = Column(JSON, nullable=True, default=dict)
    error_message = Column(Text, nullable=True)
    
    started_at = Column(DateTime(timezone=True), nullable=True)
    completed_at = Column(DateTime(timezone=True), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)

    workflow_run = relationship("WorkflowRunV2", back_populates="steps")


class WorkflowApproval(Base):
    __tablename__ = "workflow_approvals"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()), index=True)
    workflow_run_id = Column(String, ForeignKey("workflow_runs_v2.id", ondelete="CASCADE"), nullable=False, index=True)
    step_key = Column(String(100), nullable=False)
    approver_id = Column(String, ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    
    status = Column(
        Enum(WorkflowApprovalStatus),
        nullable=False,
        default=WorkflowApprovalStatus.PENDING,
        server_default=WorkflowApprovalStatus.PENDING.value,
        index=True,
    )
    prompt = Column(Text, nullable=False)
    comment = Column(Text, nullable=True)
    decided_at = Column(DateTime(timezone=True), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)

    workflow_run = relationship("WorkflowRunV2", back_populates="approvals")
    approver = relationship("User", foreign_keys=[approver_id])
