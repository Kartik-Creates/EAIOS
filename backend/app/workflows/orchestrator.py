import time
import logging
from typing import List, Optional

from app.models.workflow import WorkflowRunStatus
from app.workflows.approval_engine import approval_engine
from app.workflows.approval_models import ApprovalLifecycleState
from app.workflows.audit_service import audit_service
from app.workflows.events import WorkflowEventType
from app.workflows.execution import ExecutionResult
from app.workflows.executor import executor
from app.workflows.plan import ExecutionPlan
from app.workflows.policy import policy_engine
from app.workflows.state_machine import WorkflowState, WorkflowStateMachine
from app.workflows.step_result import StepResult

logger = logging.getLogger("eaios.workflows.orchestrator")


class WorkflowOrchestrator:
    """
    Manages workflow lifecycle, policy evaluation, step execution sequence, and event audit logging.
    Evaluates Policy Engine before execution: pauses and requests approval if required.
    """

    def execute_plan(self, plan: ExecutionPlan, ignore_policy: bool = False) -> ExecutionResult:
        """Execute all steps in an ExecutionPlan sequentially unless paused by policy."""
        start_time = time.time()
        state_machine = WorkflowStateMachine(WorkflowState.CREATED)
        correlation_id = plan.correlation_id

        # 1. Validate Plan State
        if not plan.validation_summary.is_valid:
            state_machine.transition_to(WorkflowState.FAILED)
            res = ExecutionResult(
                correlation_id=correlation_id,
                workflow_id=plan.workflow_id,
                workflow_version=plan.workflow_version,
                overall_status=WorkflowRunStatus.FAILED,
                total_duration=0.0,
                completed_steps=0,
                failed_steps=0,
                skipped_steps=len(plan.execution_steps),
                step_results=[],
                execution_summary={"error": "Cannot execute plan with validation errors."},
            )
            audit_service.record_event(
                event_type=WorkflowEventType.EXECUTION_FAILED,
                correlation_id=correlation_id,
                execution_id=res.execution_id,
                workflow_id=plan.workflow_id,
                workflow_version=plan.workflow_version,
                metadata={"error": "Plan validation failed"},
            )
            return res

        state_machine.transition_to(WorkflowState.VALIDATED)
        state_machine.transition_to(WorkflowState.READY)

        # 2. Evaluate Policy Engine for Approval Interception
        if not ignore_policy:
            decision = policy_engine.evaluate(plan)
            if decision.requires_approval:
                state_machine.transition_to(WorkflowState.WAITING_CONFIRMATION)
                app_req = approval_engine.create_request(plan=plan, decision=decision)
                
                res = ExecutionResult(
                    correlation_id=correlation_id,
                    workflow_id=plan.workflow_id,
                    workflow_version=plan.workflow_version,
                    overall_status=WorkflowRunStatus.AWAITING_APPROVAL,
                    total_duration=round(time.time() - start_time, 4),
                    completed_steps=0,
                    failed_steps=0,
                    skipped_steps=len(plan.execution_steps),
                    step_results=[],
                    execution_summary={
                        "state": state_machine.current_state.value,
                        "approval_request_id": app_req.request_id,
                        "approval_reason": decision.approval_reason,
                        "approver_role": decision.approver_role,
                        "workflow_name": plan.workflow_name,
                    },
                )
                audit_service.record_event(
                    event_type=WorkflowEventType.APPROVAL_REQUESTED,
                    correlation_id=correlation_id,
                    execution_id=res.execution_id,
                    workflow_id=plan.workflow_id,
                    workflow_version=plan.workflow_version,
                    metadata={
                        "approval_request_id": app_req.request_id,
                        "approval_reason": decision.approval_reason,
                        "workflow_name": plan.workflow_name,
                    },
                )
                return res

        state_machine.transition_to(WorkflowState.RUNNING)
        dummy_exec_id = f"exec_{plan.plan_id[5:]}"
        audit_service.record_event(
            event_type=WorkflowEventType.EXECUTION_STARTED,
            correlation_id=correlation_id,
            execution_id=dummy_exec_id,
            workflow_id=plan.workflow_id,
            workflow_version=plan.workflow_version,
            metadata={"workflow_name": plan.workflow_name},
        )

        step_results: List[StepResult] = []
        completed_count = 0
        failed_count = 0
        skipped_count = 0
        overall_status = WorkflowRunStatus.COMPLETED

        # 3. Sequential Step Execution Loop
        for step in plan.execution_steps:
            audit_service.record_event(
                event_type=WorkflowEventType.STEP_STARTED,
                correlation_id=correlation_id,
                execution_id=dummy_exec_id,
                workflow_id=plan.workflow_id,
                workflow_version=plan.workflow_version,
                step_id=step.step_id,
                metadata={"title": step.title, "service": step.service, "action": step.action},
            )

            try:
                res_step = executor.execute_step(step, plan.parameters)
                step_results.append(res_step)

                if res_step.status == WorkflowRunStatus.COMPLETED:
                    completed_count += 1
                    audit_service.record_event(
                        event_type=WorkflowEventType.STEP_COMPLETED,
                        correlation_id=correlation_id,
                        execution_id=dummy_exec_id,
                        workflow_id=plan.workflow_id,
                        workflow_version=plan.workflow_version,
                        step_id=step.step_id,
                        metadata={"duration": res_step.duration, "outputs": res_step.outputs},
                    )
                else:
                    failed_count += 1
                    overall_status = WorkflowRunStatus.FAILED
                    skipped_count = len(plan.execution_steps) - (completed_count + failed_count)
                    audit_service.record_event(
                        event_type=WorkflowEventType.STEP_FAILED,
                        correlation_id=correlation_id,
                        execution_id=dummy_exec_id,
                        workflow_id=plan.workflow_id,
                        workflow_version=plan.workflow_version,
                        step_id=step.step_id,
                        metadata={"error": res_step.error},
                    )
                    break
            except Exception as exc:
                logger.error("Unhandled step failure in step '%s': %s", step.step_id, exc)
                failed_count += 1
                overall_status = WorkflowRunStatus.FAILED
                skipped_count = len(plan.execution_steps) - (completed_count + failed_count)
                audit_service.record_event(
                    event_type=WorkflowEventType.STEP_FAILED,
                    correlation_id=correlation_id,
                    execution_id=dummy_exec_id,
                    workflow_id=plan.workflow_id,
                    workflow_version=plan.workflow_version,
                    step_id=step.step_id,
                    metadata={"error": str(exc)},
                )
                break

        # 4. Transition Final State
        if overall_status == WorkflowRunStatus.COMPLETED:
            state_machine.transition_to(WorkflowState.COMPLETED)
        else:
            state_machine.transition_to(WorkflowState.FAILED)

        total_duration = round(time.time() - start_time, 4)

        result = ExecutionResult(
            execution_id=dummy_exec_id,
            correlation_id=correlation_id,
            workflow_id=plan.workflow_id,
            workflow_version=plan.workflow_version,
            overall_status=overall_status,
            total_duration=total_duration,
            completed_steps=completed_count,
            failed_steps=failed_count,
            skipped_steps=skipped_count,
            step_results=step_results,
            execution_summary={
                "state": state_machine.current_state.value,
                "total_steps": len(plan.execution_steps),
                "workflow_name": plan.workflow_name,
            },
        )

        final_event = WorkflowEventType.EXECUTION_COMPLETED if overall_status == WorkflowRunStatus.COMPLETED else WorkflowEventType.EXECUTION_FAILED
        audit_service.record_event(
            event_type=final_event,
            correlation_id=correlation_id,
            execution_id=result.execution_id,
            workflow_id=plan.workflow_id,
            workflow_version=plan.workflow_version,
            metadata={"total_duration": total_duration, "completed_steps": completed_count, "workflow_name": plan.workflow_name},
        )

        return result

    def resume_execution(self, request_id: str) -> ExecutionResult:
        """Resume workflow execution after approval decision."""
        app_req = approval_engine.get_request(request_id)
        if not app_req:
            raise ValueError(f"Approval request '{request_id}' not found.")

        correlation_id = app_req.plan.correlation_id

        if app_req.status == ApprovalLifecycleState.APPROVED:
            audit_service.record_event(
                event_type=WorkflowEventType.APPROVAL_GRANTED,
                correlation_id=correlation_id,
                workflow_id=app_req.workflow_id,
                workflow_version=app_req.plan.workflow_version,
                actor=app_req.approver_user_id or "approver",
                metadata={"request_id": request_id, "comments": app_req.comments},
            )
            return self.execute_plan(app_req.plan, ignore_policy=True)
        elif app_req.status == ApprovalLifecycleState.REJECTED:
            audit_service.record_event(
                event_type=WorkflowEventType.APPROVAL_REJECTED,
                correlation_id=correlation_id,
                workflow_id=app_req.workflow_id,
                workflow_version=app_req.plan.workflow_version,
                actor=app_req.approver_user_id or "approver",
                metadata={"request_id": request_id, "comments": app_req.comments},
            )
            audit_service.record_event(
                event_type=WorkflowEventType.EXECUTION_CANCELLED,
                correlation_id=correlation_id,
                workflow_id=app_req.workflow_id,
                workflow_version=app_req.plan.workflow_version,
                metadata={"reason": app_req.comments or "Rejected by approver."},
            )
            return ExecutionResult(
                correlation_id=correlation_id,
                workflow_id=app_req.workflow_id,
                workflow_version=app_req.plan.workflow_version,
                overall_status=WorkflowRunStatus.CANCELLED,
                total_duration=0.0,
                completed_steps=0,
                failed_steps=0,
                skipped_steps=len(app_req.plan.execution_steps),
                step_results=[],
                execution_summary={
                    "state": WorkflowState.CANCELLED.value,
                    "rejection_reason": app_req.comments or "Rejected by approver.",
                    "workflow_name": app_req.workflow_name,
                },
            )
        else:
            raise ValueError(f"Cannot resume request '{request_id}' in state '{app_req.status.value}'.")


# Global Singleton Orchestrator Instance
orchestrator = WorkflowOrchestrator()
