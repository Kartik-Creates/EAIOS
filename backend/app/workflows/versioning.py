import enum
import logging
import threading
from datetime import datetime, timezone
from typing import Dict, List, Optional
from pydantic import BaseModel, Field

from app.schemas.workflow import WorkflowDefinition
from app.workflows.registry import workflow_registry

logger = logging.getLogger("eaios.workflows.versioning")


class VersionState(str, enum.Enum):
    DRAFT = "DRAFT"
    PUBLISHED = "PUBLISHED"
    ARCHIVED = "ARCHIVED"


class WorkflowVersionRecord(BaseModel):
    workflow_id: str
    version: str
    state: VersionState
    definition: WorkflowDefinition
    created_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())
    published_at: Optional[str] = None


class WorkflowVersionManager:
    """
    Manages DRAFT, PUBLISHED, and ARCHIVED workflow versions, version cloning, comparison, and rollback.
    """

    def __init__(self) -> None:
        self._versions: Dict[str, Dict[str, WorkflowVersionRecord]] = {}
        self._lock = threading.Lock()

    def create_draft(self, definition: WorkflowDefinition) -> WorkflowVersionRecord:
        record = WorkflowVersionRecord(
            workflow_id=definition.id,
            version=definition.version,
            state=VersionState.DRAFT,
            definition=definition,
        )
        with self._lock:
            if definition.id not in self._versions:
                self._versions[definition.id] = {}
            self._versions[definition.id][definition.version] = record
        return record

    def publish_version(self, workflow_id: str, version: str) -> WorkflowVersionRecord:
        with self._lock:
            if workflow_id not in self._versions or version not in self._versions[workflow_id]:
                raise ValueError(f"Version '{version}' for workflow '{workflow_id}' not found.")

            record = self._versions[workflow_id][version]
            if record.state == VersionState.PUBLISHED:
                return record

            updated = record.model_copy(
                update={
                    "state": VersionState.PUBLISHED,
                    "published_at": datetime.now(timezone.utc).isoformat(),
                }
            )
            self._versions[workflow_id][version] = updated
            # Register in WorkflowRegistry if not already present
            existing = workflow_registry.get(updated.definition.id, version=updated.definition.version)
            if not existing:
                workflow_registry.register(updated.definition)
            logger.info("Published workflow version '%s' v%s", workflow_id, version)
            return updated

    def clone_workflow(self, source_workflow_id: str, new_workflow_id: str, new_name: str) -> WorkflowDefinition:
        source_def = workflow_registry.get(source_workflow_id)
        if not source_def:
            raise ValueError(f"Source workflow '{source_workflow_id}' not found.")

        cloned_def = source_def.model_copy(
            update={
                "id": new_workflow_id,
                "name": new_name,
                "version": "1.0.0-draft",
            }
        )
        self.create_draft(cloned_def)
        workflow_registry.register(cloned_def)
        logger.info("Cloned workflow '%s' to '%s'", source_workflow_id, new_workflow_id)
        return cloned_def

    def list_versions(self, workflow_id: str) -> List[WorkflowVersionRecord]:
        with self._lock:
            return list(self._versions.get(workflow_id, {}).values())


# Global Singleton Manager Instance
version_manager = WorkflowVersionManager()
