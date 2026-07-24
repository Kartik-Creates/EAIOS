import uuid

from sqlalchemy import Column, String, DateTime, func

from app.db.base import Base


class Document(Base):
    __tablename__ = "documents"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    title = Column(String, nullable=False)
    source = Column(String, nullable=False)  # e.g. "upload", "gmail", "drive"
    source_uri = Column(String, nullable=True)
    # Placeholder for the Phase 1 RBAC roles (Employee/Manager/HR/Admin);
    # null means unrestricted. Full permission-inheritance wiring is a
    # separate task — this column just gives retrieval something to filter on.
    restricted_role = Column(String, nullable=True)
    owner_id = Column(String, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
