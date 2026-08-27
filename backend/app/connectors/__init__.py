"""Connectors package — single source of truth for all integration providers."""
from app.connectors.base import ConnectorSpec
from app.connectors.registry import connector_registry

__all__ = [
    "ConnectorSpec",
    "connector_registry",
]
