# Workflow Foundation — Developer Guide

This document explains how to add, register, and manage Workflow Definitions in **EAIOS (Enterprise AI Operating System)**.

---

## 📁 Architecture & Folder Structure

```
backend/app/workflows/
├── enums.py                  # WorkflowCategory, RiskLevel, IntegrationType, CapabilityType, ParameterType
├── registry.py               # Thread-Safe WorkflowRegistry (Single source of truth)
├── definitions/              # Modular Workflow Definition files
│   ├── reporting.py          # Daily Brief & Sprint Summaries
│   ├── communication.py      # Slack-to-Jira Ticket Creator
│   ├── meetings.py           # Meeting Follow-Up Router
│   ├── engineering.py        # Release Notes Generator
│   ├── knowledge.py          # Company Brain Drive Knowledge Sync
│   ├── automation.py         # Email Auto-Draft Assistant
│   ├── administration.py     # Employee Offboarding Audit
│   └── __init__.py           # Exports ALL_BUILTIN_WORKFLOWS
└── __init__.py               # Package exports
```

---

## ⚡ How to Add a New Workflow in Under 10 Minutes

### Step 1: Create or open a category definition file
Select the target domain file under `backend/app/workflows/definitions/` (e.g. `engineering.py`).

### Step 2: Define your `WorkflowDefinition` object
```python
from app.schemas.workflow import (
    WorkflowDefinition,
    WorkflowParameter,
    WorkflowStepDefinition,
    ValidationRules,
)
from app.workflows.enums import (
    WorkflowCategory,
    RiskLevel,
    IntegrationType,
    CapabilityType,
    ParameterType,
)

MY_CUSTOM_WORKFLOW = WorkflowDefinition(
    id="my_custom_workflow",
    version="1.0.0",
    name="My Custom Workflow Name",
    description="Explains what this workflow accomplishes.",
    category=WorkflowCategory.AUTOMATION,
    icon="Wand2",
    required_role="employee",
    risk_level=RiskLevel.MEDIUM,
    estimated_runtime="~15s",
    requires_confirmation=True,
    integrations=[IntegrationType.SLACK, IntegrationType.GITHUB],
    capabilities=[CapabilityType.READ_SLACK, CapabilityType.UPDATE_GITHUB],
    parameter_schema=[
        WorkflowParameter(
            id="target_repo",
            label="Target Repository",
            description="GitHub repo to update",
            type=ParameterType.STRING,
            required=True,
            placeholder="owner/repo",
        )
    ],
    execution_steps=[
        WorkflowStepDefinition(
            id="step_update",
            title="Update Repository Settings",
            description="Applies automated configuration updates",
            service="GitHubService",
            action="update_settings",
            requires_confirmation=True,
        )
    ]
)
```

### Step 3: Export in `backend/app/workflows/definitions/__init__.py`
Add `MY_CUSTOM_WORKFLOW` to `ALL_BUILTIN_WORKFLOWS`:
```python
ALL_BUILTIN_WORKFLOWS = [
    # ...
    MY_CUSTOM_WORKFLOW,
]
```

That's it! The `WorkflowRegistry` automatically validates and registers `MY_CUSTOM_WORKFLOW` on startup. The REST API and React frontend will dynamically render your new workflow card, parameters, and risk badges without writing any frontend code.

---

## 🛡️ Validation Rules & Strict Fail-Fast Protection

The `WorkflowRegistry` and `WorkflowDefinition` models validate definitions at registration:
* **Unique `(id, version)` Key**: Registration fails fast if a duplicate workflow ID and version is registered.
* **Unique Parameter IDs**: Parameter IDs must be unique within a workflow.
* **Unique Step IDs**: Execution step IDs must be unique within a workflow.

---

## 🗝️ Metadata Concepts

| Field | Description |
|---|---|
| `integrations` | External third-party platforms required (e.g. `Slack`, `GitHub`, `Jira`). Identifies systems. |
| `capabilities` | Action primitives performed (e.g. `READ_SLACK`, `CREATE_JIRA`). AI planners reason over capabilities. |
| `risk_level` | Risk classification (`LOW`, `MEDIUM`, `HIGH`, `CRITICAL`). Used by human-in-the-loop approval engines. |
| `version` | Immutable semantic version string (e.g. `"1.0.0"`). |

---

## 🔮 Future Extension Points (Phase 2 & Beyond)

* **Phase 2 (Workflow Execution Engine)**: Will bind `execution_steps` to async Python service handlers.
* **Phase 3 (AI Planner Integration)**: Will map user intent queries to `CapabilityType` primitives.
* **Phase 4 (Approval Router)**: Will intercept execution steps marked `requires_confirmation` or with `RiskLevel.HIGH`/`CRITICAL`.
