from sqlalchemy import Column, String, Boolean, Integer, DateTime, func
from sqlalchemy.orm import relationship
from app.db.base import Base

class User(Base):
    __tablename__ = "users"

    id = Column(String, primary_key=True, index=True)
    email = Column(String, unique=True, index=True, nullable=False)
    full_name = Column(String, nullable=True)
    hashed_password = Column(String, nullable=False)
    is_active = Column(Boolean, default=True)
    is_superuser = Column(Boolean, default=False)
    # RBAC role: "employee", "manager", "hr", "admin"
    role = Column(String, nullable=False, default="employee", server_default="employee")
    # Incrementing this invalidates all outstanding refresh tokens for this user.
    token_version = Column(Integer, nullable=False, default=0, server_default="0")
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    oauth_tokens = relationship("OAuthToken", back_populates="user", cascade="all, delete-orphan")
