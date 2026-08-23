"""Connector Registry with filesystem auto-discovery and duplicate-name validation.

Scans the app/connectors directory for python modules defining a CONNECTOR
instance of ConnectorSpec. Validates uniqueness across all connector names on startup.
"""
import importlib
import logging
import pkgutil
from pathlib import Path
from typing import Dict, List, Optional

from app.connectors.base import ConnectorSpec

logger = logging.getLogger("eaios.connectors.registry")


class ConnectorRegistry:
    """Registry managing all discovered integration connectors."""

    def __init__(self):
        self._connectors: Dict[str, ConnectorSpec] = {}
        self._discovered = False

    def discover_connectors(self, package_path: Optional[str] = None):
        """Auto-discover all connectors in the connectors package directory.

        Scans all python files in the directory, loads them dynamically,
        looks for `CONNECTOR` attributes, and validates duplicate names.
        Raises RuntimeError if duplicate names are found.
        """
        import importlib.util

        self._connectors.clear()

        if package_path:
            target_dir = Path(package_path)
        else:
            package = importlib.import_module("app.connectors")
            target_dir = Path(package.__file__).parent

        for py_file in sorted(target_dir.glob("*.py")):
            module_name = py_file.stem
            if module_name.startswith("__") or module_name in ("base", "registry"):
                continue

            try:
                spec = importlib.util.spec_from_file_location(f"connector_{module_name}", py_file)
                if not spec or not spec.loader:
                    continue
                mod = importlib.util.module_from_spec(spec)
                spec.loader.exec_module(mod)

                connector = getattr(mod, "CONNECTOR", None)
                if connector and isinstance(connector, ConnectorSpec):
                    if connector.name in self._connectors:
                        existing = self._connectors[connector.name]
                        raise RuntimeError(
                            f"Duplicate connector name '{connector.name}' registered by {py_file.name} "
                            f"(already registered by {existing.name})"
                        )
                    self._connectors[connector.name] = connector
                    logger.info("Registered connector: %s (%s)", connector.name, connector.display_name)
            except Exception as exc:
                if isinstance(exc, RuntimeError):
                    raise
                logger.warning("Failed to load connector module from %s: %s", py_file, exc)

        self._discovered = True

    def get_all_connectors(self) -> Dict[str, ConnectorSpec]:
        """Retrieve dictionary of all registered connectors."""
        if not self._discovered:
            self.discover_connectors()
        return self._connectors

    def get_connector(self, name: str) -> Optional[ConnectorSpec]:
        """Retrieve a specific connector by canonical provider name."""
        if not self._discovered:
            self.discover_connectors()
        return self._connectors.get(name.lower())

    def get_implemented_connectors(self) -> List[ConnectorSpec]:
        """Retrieve list of connectors with is_implemented=True."""
        if not self._discovered:
            self.discover_connectors()
        return [c for c in self._connectors.values() if c.is_implemented]

    def get_connector_list(self) -> List[dict]:
        """Retrieve JSON-serializable connector list for frontend endpoint."""
        if not self._discovered:
            self.discover_connectors()
        return [
            {
                "name": c.name,
                "display_name": c.display_name,
                "icon": c.icon,
                "is_implemented": c.is_implemented,
            }
            for c in self._connectors.values()
        ]


# Singleton instance
connector_registry = ConnectorRegistry()
