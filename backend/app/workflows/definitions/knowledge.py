from app.schemas.workflow import (
    WorkflowDefinition,
    WorkflowParameter,
    WorkflowStepDefinition,
)
from app.workflows.enums import (
    CapabilityType,
    IntegrationType,
    ParameterType,
    RiskLevel,
    WorkflowCategory,
)

BRAIN_SYNC = WorkflowDefinition(
    id="brain_sync",
    version="1.0.0",
    name="Company Brain Drive Knowledge Sync",
    description="Indexes and re-embeds newly updated Google Drive documents into Company Brain vector search.",
    category=WorkflowCategory.KNOWLEDGE,
    icon="Wand2",
    required_role="employee",
    risk_level=RiskLevel.LOW,
    estimated_runtime="~45s",
    requires_confirmation=False,
    integrations=[IntegrationType.DRIVE, IntegrationType.COMPANY_BRAIN],
    capabilities=[CapabilityType.SYNC_DRIVE, CapabilityType.SEARCH_COMPANY_BRAIN],
    parameter_schema=[
        WorkflowParameter(
            id="folder_id",
            label="Google Drive Folder ID",
            description="Folder ID to sync into knowledge base",
            type=ParameterType.STRING,
            required=True,
        ),
    ],
    execution_steps=[
        WorkflowStepDefinition(
            id="step_fetch_docs",
            title="Scan Drive Folder",
            description="Fetches updated files from Google Drive API",
            service="DriveService",
            action="scan_folder",
        ),
        WorkflowStepDefinition(
            id="step_embed",
            title="Generate Vector Embeddings",
            description="Chunks & embeds document text into pgvector",
            service="BrainService",
            action="index_documents",
        ),
    ],
)
