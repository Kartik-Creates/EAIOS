"""Base specification for UnifyAI Integration Connectors."""
from dataclasses import dataclass
from typing import Any, Callable, Coroutine

from sqlalchemy.ext.asyncio import AsyncSession

from app.models.user import User
from app.schemas.briefing import BriefingItemDetail, SourceResult


@dataclass
class ConnectorSpec:
    """Canonical specification for an integration connector in UnifyAI.

    Serves as the single source of truth for UI metadata, OAuth configuration,
    briefing aggregation, item detail retrieval, and chat tool dispatch.
    """
    name: str  # Canonical provider ID (e.g. "gmail", "jira", "github")
    display_name: str  # Human-readable title for UI
    icon: str  # Icon name / type for UI
    oauth_config: dict[str, Any]  # OAuth settings (auth_url, token_url, scope, etc.)
    briefing_fn: Callable[[AsyncSession, User], Coroutine[Any, Any, SourceResult]] | None = None
    detail_fn: Callable[[AsyncSession, User, str], Coroutine[Any, Any, BriefingItemDetail | None]] | None = None
    chat_fn: Callable[[AsyncSession, User], Coroutine[Any, Any, SourceResult]] | None = None
    is_implemented: bool = True  # False if OAuth-only / placeholder connector
