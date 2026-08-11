import logging
import threading
from datetime import datetime, timezone
from typing import Dict, List, Optional

from app.workflows.approval_models import ApprovalDecision, ApprovalLifecycleState, ApprovalRequestModel
from app.workflows.plan import ExecutionPlan

logger = logging.getLogger("eaios.workflows.approval_engine")


class ApprovalEngine:
    """
    Approval Engine responsible for managing approval request lifecycles.
    Handles creation, approval, rejection, cancellation, and expiration of requests.
    Does NOT evaluate policies.
    """

    def __init__(self) -> None:
        self._requests: Dict[str, ApprovalRequestModel] = {}
        self._lock = threading.Lock()

    def create_request(
        self,
        plan: ExecutionPlan,
        decision: ApprovalDecision,
        execution_id: Optional[str] = None,
    ) -> ApprovalRequestModel:
        """Create a new pending approval request."""
        req = ApprovalRequestModel(
            execution_id=execution_id,
            plan_id=plan.plan_id,
            workflow_id=plan.workflow_id,
            workflow_name=plan.workflow_name,
            approver_role=decision.approver_role,
            reason=decision.approval_reason or "Approval required by policy.",
            status=ApprovalLifecycleState.PENDING,
            plan=plan,
        )
        with self._lock:
            self._requests[req.request_id] = req
        logger.info("Created pending approval request '%s' for workflow '%s'", req.request_id, req.workflow_id)
        return req

    def approve_request(self, request_id: str, user_id: str, comments: Optional[str] = None) -> ApprovalRequestModel:
        """Approve a pending request."""
        with self._lock:
            req = self._requests.get(request_id)
            if not req:
                raise ValueError(f"Approval request '{request_id}' not found.")
            if req.status != ApprovalLifecycleState.PENDING:
                raise ValueError(f"Cannot approve request '{request_id}' in state '{req.status.value}'.")

            updated = req.model_copy(
                update={
                    "status": ApprovalLifecycleState.APPROVED,
                    "approver_user_id": user_id,
                    "comments": comments,
                    "decision_at": datetime.now(timezone.utc).isoformat(),
                }
            )
            self._requests[request_id] = updated
            logger.info("Approval request '%s' APPROVED by user '%s'", request_id, user_id)
            return updated

    def reject_request(self, request_id: str, user_id: str, comments: Optional[str] = None) -> ApprovalRequestModel:
        """Reject a pending request."""
        with self._lock:
            req = self._requests.get(request_id)
            if not req:
                raise ValueError(f"Approval request '{request_id}' not found.")
            if req.status != ApprovalLifecycleState.PENDING:
                raise ValueError(f"Cannot reject request '{request_id}' in state '{req.status.value}'.")

            updated = req.model_copy(
                update={
                    "status": ApprovalLifecycleState.REJECTED,
                    "approver_user_id": user_id,
                    "comments": comments,
                    "decision_at": datetime.now(timezone.utc).isoformat(),
                }
            )
            self._requests[request_id] = updated
            logger.info("Approval request '%s' REJECTED by user '%s'", request_id, user_id)
            return updated

    def get_request(self, request_id: str) -> Optional[ApprovalRequestModel]:
        """Retrieve an approval request by ID."""
        with self._lock:
            return self._requests.get(request_id)

    def list_requests(self, status: Optional[ApprovalLifecycleState] = None) -> List[ApprovalRequestModel]:
        """List approval requests with optional status filter."""
        with self._lock:
            requests = list(self._requests.values())
            if status:
                requests = [r for r in requests if r.status == status]
            return requests


# Global Singleton ApprovalEngine Instance
approval_engine = ApprovalEngine()
