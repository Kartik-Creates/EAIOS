import logging
import threading
from typing import Dict, List, Optional, Tuple

from app.schemas.workflow import WorkflowDefinition
from app.workflows.definitions import ALL_BUILTIN_WORKFLOWS
from app.workflows.enums import WorkflowCategory

logger = logging.getLogger("eaios.workflows.registry")


class WorkflowRegistry:
    """
    Registry-First Thread-Safe Workflow Registry.
    Acts as the primary source of truth for workflow definitions.
    Prevents duplicate workflow IDs and duplicate (id, version) pairs.
    """

    def __init__(self) -> None:
        self._registry: Dict[Tuple[str, str], WorkflowDefinition] = {}
        self._lock = threading.Lock()
        self._load_builtins()

    def _load_builtins(self) -> None:
        """Internal helper to populate builtin workflow definitions."""
        for wf in ALL_BUILTIN_WORKFLOWS:
            self.register(wf)

    def register(self, definition: WorkflowDefinition) -> None:
        """
        Register a workflow definition in the registry.
        Fails fast if a workflow with the same (id, version) is already registered.
        """
        key = (definition.id, definition.version)
        with self._lock:
            if key in self._registry:
                raise ValueError(
                    f"Workflow '{definition.id}' version '{definition.version}' is already registered."
                )
            self._registry[key] = definition
            logger.info("Registered workflow definition: %s (v%s)", definition.id, definition.version)

    def unregister(self, workflow_id: str, version: Optional[str] = None) -> bool:
        """Remove a workflow definition from the registry."""
        with self._lock:
            keys_to_remove = [
                k for k in self._registry.keys() if k[0] == workflow_id and (version is None or k[1] == version)
            ]
            if keys_to_remove:
                for k in keys_to_remove:
                    del self._registry[k]
                logger.info("Unregistered workflow definition: %s (v%s)", workflow_id, version or "all")
                return True
            return False

    def get(self, workflow_id: str, version: Optional[str] = None) -> Optional[WorkflowDefinition]:
        """
        Retrieve a workflow definition by ID and optional version.
        If version is omitted, returns the latest registered version for that ID.
        """
        with self._lock:
            matching = [wf for k, wf in self._registry.items() if k[0] == workflow_id]
            if not matching:
                return None
            if version:
                for wf in matching:
                    if wf.version == version:
                        return wf
                return None
            # Return latest version by default
            return sorted(matching, key=lambda w: w.version, reverse=True)[0]

    def exists(self, workflow_id: str, version: Optional[str] = None) -> bool:
        """Check if a workflow definition exists in the registry."""
        return self.get(workflow_id, version) is not None

    def list(self) -> List[WorkflowDefinition]:
        """Return all registered workflow definitions."""
        with self._lock:
            return list(self._registry.values())

    def list_by_category(self, category: WorkflowCategory) -> List[WorkflowDefinition]:
        """Return workflow definitions filtered by category."""
        with self._lock:
            return [w for w in self._registry.values() if w.category == category]

    def search(self, query: str) -> List[WorkflowDefinition]:
        """Search workflow definitions by name or description."""
        q = query.lower()
        with self._lock:
            return [
                w for w in self._registry.values()
                if q in w.name.lower() or q in w.description.lower() or q in w.id.lower()
            ]

    def get_categories(self) -> List[str]:
        """Return list of distinct categories from registered workflows."""
        with self._lock:
            categories = {w.category.value for w in self._registry.values()}
            return sorted(list(categories))

    def clear(self) -> None:
        """Clear all registered workflow definitions."""
        with self._lock:
            self._registry.clear()


# Global Singleton Registry Instance
workflow_registry = WorkflowRegistry()
