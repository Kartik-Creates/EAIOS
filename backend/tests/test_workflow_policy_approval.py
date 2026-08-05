import pytest
from app.models.workflow import WorkflowRunStatus
from app.workflows.approval_engine import ApprovalEngine
from app.workflows.approval_models import ApprovalLifecycleState
from app.workflows.enums import RiskLevel
from app.workflows.orchestrator import WorkflowOrchestrator
from app.workflows.planner import WorkflowPlanner
from app.workflows.policy import PolicyEngine


def test_policy_engine_evaluation():
    planner = WorkflowPlanner()
    policy = PolicyEngine()

    # Low risk workflow
    low_plan = planner.create_plan(
        workflow_id="daily_brief",
        parameters={"timeframe": "last_24h", "channel": "#daily-briefs"},
    )
    low_decision = policy.evaluate(low_plan)
    assert low_decision.requires_approval is False

    # High risk / Confirmation workflow
    high_plan = planner.create_plan(
        workflow_id="release_notes",
        parameters={"repository": "owner/repo", "tag_name": "v1.0.0"},
    )
    high_decision = policy.evaluate(high_plan)
    assert high_decision.requires_approval is True
    assert "HIGH risk" in high_decision.approval_reason or "confirmation" in high_decision.approval_reason


def test_approval_engine_lifecycle():
    planner = WorkflowPlanner()
    policy = PolicyEngine()
    app_engine = ApprovalEngine()

    plan = planner.create_plan(
        workflow_id="release_notes",
        parameters={"repository": "owner/repo", "tag_name": "v1.0.0"},
    )
    decision = policy.evaluate(plan)
    req = app_engine.create_request(plan, decision)

    assert req.status == ApprovalLifecycleState.PENDING
    assert req.plan_id == plan.plan_id

    approved_req = app_engine.approve_request(req.request_id, user_id="admin_1", comments="Looks good")
    assert approved_req.status == ApprovalLifecycleState.APPROVED
    assert approved_req.approver_user_id == "admin_1"

    # Cannot approve again
    with pytest.raises(ValueError):
        app_engine.approve_request(req.request_id, user_id="admin_1")


def test_orchestrator_pauses_and_resumes():
    planner = WorkflowPlanner()
    orchestrator = WorkflowOrchestrator()

    # Plan for workflow requiring approval (e.g. release_notes has HIGH risk)
    plan = planner.create_plan(
        workflow_id="release_notes",
        parameters={"repository": "owner/repo", "tag_name": "v1.0.0"},
    )

    # 1. Execute plan -> paused for approval
    res1 = orchestrator.execute_plan(plan)
    assert res1.overall_status == WorkflowRunStatus.AWAITING_APPROVAL
    assert "approval_request_id" in res1.execution_summary
    request_id = res1.execution_summary["approval_request_id"]

    # 2. Approve request and resume execution
    from app.workflows.approval_engine import approval_engine
    approval_engine.approve_request(request_id, user_id="manager_user")

    res2 = orchestrator.resume_execution(request_id)
    assert res2.overall_status == WorkflowRunStatus.COMPLETED
    assert res2.completed_steps == 2
