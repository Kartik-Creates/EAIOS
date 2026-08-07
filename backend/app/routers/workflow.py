from typing import Any, Dict, List, Optional
from fastapi import APIRouter, Body, Depends, HTTPException, Query, status

from app.core.deps import get_current_user
from app.models.user import User
from app.models.workflow import WorkflowRunStatus
from app.schemas.workflow import WorkflowDefinition, WorkflowParameter
from app.workflows.analytics import WorkflowAnalyticsSummary, analytics_engine
from app.workflows.approval_engine import approval_engine
from app.workflows.approval_models import ApprovalLifecycleState, ApprovalRequestModel
from app.workflows.audit_service import audit_service
from app.workflows.circuit_breaker import circuit_breaker_registry
from app.workflows.enums import WorkflowCategory
from app.workflows.events import WorkflowEvent, WorkflowEventType
from app.workflows.exceptions import WorkflowNotFoundError
from app.workflows.execution import ExecutionResult
from app.workflows.hardening import SystemHealthReport, hardening_service
from app.workflows.history_models import ExecutionHistorySummary
from app.workflows.history_service import history_service
from app.workflows.orchestrator import orchestrator
from app.workflows.plan import ExecutionPlan
from app.workflows.planner import planner
from app.workflows.registry import workflow_registry
from app.workflows.scheduler import ScheduledJob, ScheduleType, scheduler
from app.workflows.templates import EnterpriseTemplate, template_service
from app.workflows.trigger_engine import trigger_engine
from app.workflows.triggers import TriggerContext, TriggerType
from app.workflows.versioning import WorkflowVersionRecord, version_manager
from app.workflows.workflow_instance import WorkflowInstance

router = APIRouter()


@router.get("", response_model=List[WorkflowDefinition])
async def list_workflows(
    category: Optional[WorkflowCategory] = Query(None, description="Filter by workflow category"),
    search: Optional[str] = Query(None, description="Search by workflow name or description"),
    current_user: User = Depends(get_current_user),
):
    """
    List all available workflow definitions registered in the Workflow Registry.
    """
    if search:
        return workflow_registry.search(search)
    if category:
        return workflow_registry.list_by_category(category)
    return workflow_registry.list()


@router.get("/categories", response_model=List[str])
async def list_workflow_categories(
    current_user: User = Depends(get_current_user),
):
    """
    Retrieve all available workflow categories.
    """
    return workflow_registry.get_categories()


# ─────────────────────────────────────────────
# Productization: Templates, Versioning & Health
# ─────────────────────────────────────────────

@router.get("/templates", response_model=List[EnterpriseTemplate])
async def list_enterprise_templates(
    current_user: User = Depends(get_current_user),
):
    """
    Productization: List enterprise workflow template catalog.
    """
    return template_service.list_templates()


@router.post("/templates/{template_id}/install", response_model=WorkflowDefinition)
async def install_enterprise_template(
    template_id: str,
    current_user: User = Depends(get_current_user),
):
    """
    Productization: 1-Click Installation of enterprise templates into Workflow Registry.
    """
    try:
        return template_service.install_template(template_id)
    except ValueError as err:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(err))


@router.get("/health", response_model=SystemHealthReport)
async def get_system_health(
    current_user: User = Depends(get_current_user),
):
    """
    Productization: Production health check & observability endpoint.
    """
    return hardening_service.get_health()


@router.post("/{workflow_id}/publish", response_model=WorkflowVersionRecord)
async def publish_workflow_version(
    workflow_id: str,
    version: str = Body(..., embed=True),
    current_user: User = Depends(get_current_user),
):
    """
    Productization: Publish workflow version.
    """
    try:
        return version_manager.publish_version(workflow_id, version)
    except ValueError as err:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(err))


@router.post("/{workflow_id}/clone", response_model=WorkflowDefinition)
async def clone_workflow(
    workflow_id: str,
    new_workflow_id: str = Body(..., embed=True),
    new_name: str = Body(..., embed=True),
    current_user: User = Depends(get_current_user),
):
    """
    Productization: Clone an existing workflow definition into a new draft.
    """
    try:
        return version_manager.clone_workflow(workflow_id, new_workflow_id, new_name)
    except ValueError as err:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(err))


# ─────────────────────────────────────────────
# Phase 8 Analytics & Circuit Breaker Endpoints
# ─────────────────────────────────────────────

@router.get("/analytics", response_model=WorkflowAnalyticsSummary)
async def get_workflow_analytics(
    workflow_id: Optional[str] = Query(None, description="Filter analytics by workflow ID"),
    current_user: User = Depends(get_current_user),
):
    """
    Phase 8: Retrieve computed workflow analytics and metrics summary.
    """
    return analytics_engine.compute_metrics(workflow_id=workflow_id)


@router.get("/circuit-breakers", response_model=Dict[str, Dict[str, Any]])
async def get_circuit_breaker_status(
    current_user: User = Depends(get_current_user),
):
    """
    Phase 8: Retrieve health status of circuit breakers for external integrations.
    """
    return circuit_breaker_registry.get_health_status()


# ─────────────────────────────────────────────
# Phase 7 Trigger & Schedule Endpoints
# ─────────────────────────────────────────────

@router.post("/schedules", response_model=ScheduledJob)
async def create_workflow_schedule(
    workflow_id: str = Body(..., embed=True),
    schedule_type: ScheduleType = Body(..., embed=True),
    cron_expression: Optional[str] = Body(None, embed=True),
    run_at: Optional[str] = Body(None, embed=True),
    parameters: Dict[str, Any] = Body(default_factory=dict, embed=True),
    current_user: User = Depends(get_current_user),
):
    """
    Phase 7: Create a new workflow execution schedule.
    """
    try:
        return scheduler.create_schedule(
            workflow_id=workflow_id,
            schedule_type=schedule_type,
            cron_expression=cron_expression,
            run_at=run_at,
            parameters=parameters,
        )
    except ValueError as err:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(err))


@router.get("/schedules", response_model=List[ScheduledJob])
async def list_workflow_schedules(
    workflow_id: Optional[str] = Query(None, description="Filter by workflow ID"),
    current_user: User = Depends(get_current_user),
):
    """
    Phase 7: List configured workflow schedules.
    """
    return scheduler.list_schedules(workflow_id=workflow_id)


@router.delete("/schedules/{schedule_id}")
async def delete_workflow_schedule(
    schedule_id: str,
    current_user: User = Depends(get_current_user),
):
    """
    Phase 7: Delete a scheduled workflow job.
    """
    deleted = scheduler.delete_schedule(schedule_id)
    if not deleted:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"Schedule '{schedule_id}' not found.")
    return {"message": f"Successfully deleted schedule '{schedule_id}'"}


@router.get("/instances", response_model=List[WorkflowInstance])
async def list_workflow_instances(
    workflow_id: Optional[str] = Query(None, description="Filter by workflow ID"),
    current_user: User = Depends(get_current_user),
):
    """
    Phase 7: List parent WorkflowInstance invocations.
    """
    return trigger_engine.list_instances(workflow_id=workflow_id)


@router.post("/{workflow_id}/trigger")
async def trigger_workflow(
    workflow_id: str,
    trigger_type: TriggerType = Body(TriggerType.MANUAL, embed=True),
    parameters: Dict[str, Any] = Body(default_factory=dict, embed=True),
    async_background: bool = Body(False, embed=True),
    source: str = Body("api", embed=True),
    current_user: User = Depends(get_current_user),
):
    """
    Phase 7: Trigger workflow invocation from any trigger source (MANUAL, WEBHOOK, EVENT, etc.).
    """
    try:
        ctx = TriggerContext(
            trigger_type=trigger_type,
            source=source,
            initiating_user=current_user.id if current_user else "system",
        )
        return trigger_engine.trigger_workflow(
            workflow_id=workflow_id,
            parameters=parameters,
            context=ctx,
            async_background=async_background,
        )
    except WorkflowNotFoundError as err:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(err))


# ─────────────────────────────────────────────
# Phase 6 Monitoring, History & Audit Endpoints
# ─────────────────────────────────────────────

@router.get("/history", response_model=List[ExecutionHistorySummary])
async def list_execution_history(
    workflow_id: Optional[str] = Query(None, description="Filter by workflow ID"),
    status_filter: Optional[WorkflowRunStatus] = Query(None, alias="status", description="Filter by run status"),
    correlation_id: Optional[str] = Query(None, description="Filter by correlation ID"),
    current_user: User = Depends(get_current_user),
):
    """
    Phase 6: List summarized execution histories derived from the Event Store.
    """
    return history_service.list_histories(
        workflow_id=workflow_id,
        status=status_filter,
        correlation_id=correlation_id,
    )


@router.get("/history/{execution_id}", response_model=ExecutionHistorySummary)
async def get_execution_history_details(
    execution_id: str,
    current_user: User = Depends(get_current_user),
):
    """
    Phase 6: Retrieve detailed execution history for a single run by execution ID.
    """
    hist = history_service.get_execution_history(execution_id)
    if not hist:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Execution history for ID '{execution_id}' not found.",
        )
    return hist


@router.get("/events/{execution_id}", response_model=List[WorkflowEvent])
async def get_execution_event_timeline(
    execution_id: str,
    current_user: User = Depends(get_current_user),
):
    """
    Phase 6: Retrieve full chronological event timeline for an execution ID.
    """
    return audit_service.query_audit_logs(correlation_id=None)


@router.get("/audit", response_model=List[WorkflowEvent])
async def query_audit_trail(
    workflow_id: Optional[str] = Query(None, description="Filter by workflow ID"),
    event_type: Optional[WorkflowEventType] = Query(None, description="Filter by event type"),
    actor: Optional[str] = Query(None, description="Filter by actor"),
    correlation_id: Optional[str] = Query(None, description="Filter by correlation ID"),
    current_user: User = Depends(get_current_user),
):
    """
    Phase 6: Query append-only audit trail logs.
    """
    return audit_service.query_audit_logs(
        workflow_id=workflow_id,
        event_type=event_type,
        actor=actor,
        correlation_id=correlation_id,
    )


# ─────────────────────────────────────────────
# Phase 5 Approval Management Endpoints
# ─────────────────────────────────────────────

@router.get("/approvals", response_model=List[ApprovalRequestModel])
async def list_approval_requests(
    status_filter: Optional[ApprovalLifecycleState] = Query(None, alias="status", description="Filter by approval status"),
    current_user: User = Depends(get_current_user),
):
    """
    List approval requests (pending or historical).
    """
    return approval_engine.list_requests(status=status_filter)


@router.get("/approvals/{request_id}", response_model=ApprovalRequestModel)
async def get_approval_request(
    request_id: str,
    current_user: User = Depends(get_current_user),
):
    """
    Retrieve approval request details by ID.
    """
    req = approval_engine.get_request(request_id)
    if not req:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Approval request '{request_id}' not found.",
        )
    return req


@router.post("/approvals/{request_id}/approve", response_model=ExecutionResult)
async def approve_workflow_request(
    request_id: str,
    comments: Optional[str] = Body(None, embed=True, description="Optional approver comments"),
    current_user: User = Depends(get_current_user),
):
    """
    Approve pending request & resume workflow execution.
    """
    try:
        approval_engine.approve_request(
            request_id=request_id,
            user_id=current_user.id if current_user else "admin_user",
            comments=comments,
        )
        result = orchestrator.resume_execution(request_id)
        return result
    except ValueError as err:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(err),
        )


@router.post("/approvals/{request_id}/reject", response_model=ExecutionResult)
async def reject_workflow_request(
    request_id: str,
    comments: Optional[str] = Body(None, embed=True, description="Reason for rejection"),
    current_user: User = Depends(get_current_user),
):
    """
    Reject pending request & terminate execution gracefully.
    """
    try:
        approval_engine.reject_request(
            request_id=request_id,
            user_id=current_user.id if current_user else "admin_user",
            comments=comments,
        )
        result = orchestrator.resume_execution(request_id)
        return result
    except ValueError as err:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(err),
        )


# ─────────────────────────────────────────────
# Workflow Definition & Execution Endpoints
# ─────────────────────────────────────────────

@router.get("/{workflow_id}", response_model=WorkflowDefinition)
async def get_workflow_definition(
    workflow_id: str,
    version: Optional[str] = Query(None, description="Optional workflow version"),
    current_user: User = Depends(get_current_user),
):
    """
    Retrieve full static definition & metadata for a single workflow.
    """
    workflow = workflow_registry.get(workflow_id, version=version)
    if not workflow:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Workflow definition with ID '{workflow_id}' not found in registry.",
        )
    return workflow


@router.get("/{workflow_id}/parameters", response_model=List[WorkflowParameter])
async def get_workflow_parameters(
    workflow_id: str,
    version: Optional[str] = Query(None, description="Optional workflow version"),
    current_user: User = Depends(get_current_user),
):
    """
    Retrieve parameter schema for auto-generating dynamic frontend forms.
    """
    workflow = workflow_registry.get(workflow_id, version=version)
    if not workflow:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Workflow definition with ID '{workflow_id}' not found in registry.",
        )
    return workflow.parameter_schema


@router.post("/{workflow_id}/plan", response_model=ExecutionPlan)
async def generate_execution_plan(
    workflow_id: str,
    version: Optional[str] = Query(None, description="Optional workflow version"),
    parameters: Dict[str, Any] = Body(default_factory=dict, description="Workflow parameter inputs"),
    current_user: User = Depends(get_current_user),
):
    """
    Phase 2 Planning Endpoint.
    Validates input parameters and converts static WorkflowDefinition into an immutable ExecutionPlan.
    """
    try:
        plan = planner.create_plan(
            workflow_id=workflow_id,
            parameters=parameters,
            user_id=current_user.id if current_user else "system",
            version=version,
        )
        return plan
    except WorkflowNotFoundError as err:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(err),
        )


@router.post("/execute", response_model=ExecutionResult)
async def execute_workflow_plan(
    plan: ExecutionPlan = Body(..., description="Immutable ExecutionPlan to execute"),
    current_user: User = Depends(get_current_user),
):
    """
    Phase 3 & Phase 5 Execution Endpoint.
    Consumes an ExecutionPlan, evaluates Policy Engine, and executes steps unless paused for approval.
    """
    result = orchestrator.execute_plan(plan)
    return result
