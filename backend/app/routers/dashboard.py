"""Dashboard API router.

Exposes endpoints for user-scoped activity feed and role-gated pending approvals.
"""
from datetime import datetime, timezone
from typing import Annotated, List, Optional

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select

from app.core.deps import get_current_user, get_db
from app.models.chat_message import ChatMessage
from app.models.document import Document
from app.models.meeting import Meeting
from app.models.user import User
from app.models.workflow_run import WorkflowRun
from app.workflows.approval_engine import approval_engine
from app.workflows.approval_models import ApprovalLifecycleState

router = APIRouter()


class ActivityItem(BaseModel):
    id: str
    type: str  # "github" | "slack" | "drive" | "jira" | "meeting" | "workflow" | "chat"
    title: str
    description: str
    timestamp: str  # ISO string or relative label


class PendingApprovalItem(BaseModel):
    id: str
    title: str
    requester: str
    type: str
    submittedAt: str
    workflow_id: Optional[str] = None


@router.get("/activity", response_model=List[ActivityItem])
async def get_recent_user_activity(
    current_user: Annotated[User, Depends(get_current_user)],
    db: Annotated[AsyncSession, Depends(get_db)],
):
    """Retrieve recent system activity feed strictly scoped to the requesting user."""
    items: List[dict] = []

    # 1. Fetch user's workflow runs
    stmt_wf = (
        select(WorkflowRun)
        .where(WorkflowRun.user_id == current_user.id)
        .order_by(WorkflowRun.created_at.desc())
        .limit(10)
    )
    res_wf = await db.execute(stmt_wf)
    wf_runs = res_wf.scalars().all()
    for wf in wf_runs:
        created_iso = (
            wf.created_at.isoformat()
            if wf.created_at
            else datetime.now(timezone.utc).isoformat()
        )
        items.append(
            {
                "id": f"wf-{wf.id}",
                "type": "workflow",
                "title": f"Workflow {wf.workflow_name.replace('_', ' ').title()} ({wf.status})",
                "description": wf.result_summary or f"Parameters: {wf.trigger_params or 'N/A'}",
                "timestamp": created_iso,
                "sort_dt": wf.created_at or datetime.now(timezone.utc),
            }
        )

    # 2. Fetch user's documents
    stmt_doc = (
        select(Document)
        .where(Document.owner_id == current_user.id)
        .order_by(Document.created_at.desc())
        .limit(10)
    )
    res_doc = await db.execute(stmt_doc)
    docs = res_doc.scalars().all()
    for doc in docs:
        created_iso = (
            doc.created_at.isoformat()
            if doc.created_at
            else datetime.now(timezone.utc).isoformat()
        )
        items.append(
            {
                "id": f"doc-{doc.id}",
                "type": "drive",
                "title": f"Document Indexed: {doc.title}",
                "description": f"Source: {doc.source}",
                "timestamp": created_iso,
                "sort_dt": doc.created_at or datetime.now(timezone.utc),
            }
        )

    # 3. Fetch user's meetings
    stmt_mtg = (
        select(Meeting)
        .where(Meeting.organizer_user_id == current_user.id)
        .order_by(Meeting.created_at.desc())
        .limit(10)
    )
    res_mtg = await db.execute(stmt_mtg)
    mtgs = res_mtg.scalars().all()
    for mtg in mtgs:
        created_iso = (
            mtg.created_at.isoformat()
            if mtg.created_at
            else datetime.now(timezone.utc).isoformat()
        )
        items.append(
            {
                "id": f"mtg-{mtg.id}",
                "type": "meeting",
                "title": f"Meeting: {mtg.title}",
                "description": f"Source: {mtg.source}",
                "timestamp": created_iso,
                "sort_dt": mtg.created_at or datetime.now(timezone.utc),
            }
        )

    # 4. Fetch user's recent chat messages
    stmt_chat = (
        select(ChatMessage)
        .where(ChatMessage.user_id == current_user.id)
        .order_by(ChatMessage.created_at.desc())
        .limit(10)
    )
    res_chat = await db.execute(stmt_chat)
    chat_msgs = res_chat.scalars().all()
    for msg in chat_msgs:
        created_iso = (
            msg.created_at.isoformat()
            if msg.created_at
            else datetime.now(timezone.utc).isoformat()
        )
        query_preview = msg.query_text[:60] + "..." if len(msg.query_text) > 60 else msg.query_text
        items.append(
            {
                "id": f"chat-{msg.id}",
                "type": "chat",
                "title": f'Asked AI: "{query_preview}"',
                "description": f"Conversation: {msg.conversation_id or 'N/A'}",
                "timestamp": created_iso,
                "sort_dt": msg.created_at or datetime.now(timezone.utc),
            }
        )

    # Sort combined items by sort_dt descending
    items.sort(key=lambda x: x["sort_dt"], reverse=True)

    formatted = [
        ActivityItem(
            id=i["id"],
            type=i["type"],
            title=i["title"],
            description=i["description"],
            timestamp=i["timestamp"],
        )
        for i in items[:15]
    ]

    return formatted


@router.get("/pending-approvals", response_model=List[PendingApprovalItem])
async def get_pending_approvals(
    current_user: Annotated[User, Depends(get_current_user)],
    db: Annotated[AsyncSession, Depends(get_db)],
):
    """Retrieve pending approvals. Strictly role-gated to Manager and Admin roles."""
    if current_user.role not in ("manager", "admin"):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access forbidden. Only Manager or Admin users can access pending approvals.",
        )

    # 1. Fetch pending requests from ApprovalEngine
    requests = approval_engine.list_requests(status=ApprovalLifecycleState.PENDING)
    res_items: List[PendingApprovalItem] = []

    for req in requests:
        res_items.append(
            PendingApprovalItem(
                id=req.request_id,
                title=f"{req.workflow_name.replace('_', ' ').title()}: {req.reason}",
                requester=req.approver_user_id or "System / User",
                type=req.workflow_name,
                submittedAt=req.created_at,
                workflow_id=req.workflow_id,
            )
        )

    # 2. Also fetch pending workflow_runs from DB
    stmt_wf = select(WorkflowRun).where(WorkflowRun.status == "pending")
    res_wf = await db.execute(stmt_wf)
    wf_pending = res_wf.scalars().all()
    for wf in wf_pending:
        if not any(item.id == f"wf-{wf.id}" for item in res_items):
            submitted_str = (
                wf.created_at.isoformat()
                if wf.created_at
                else datetime.now(timezone.utc).isoformat()
            )
            requester_str = (
                wf.user.email if (wf.user and hasattr(wf.user, "email")) else wf.user_id
            )
            res_items.append(
                PendingApprovalItem(
                    id=f"wf-{wf.id}",
                    title=f"{wf.workflow_name.replace('_', ' ').title()} Execution Approval",
                    requester=requester_str,
                    type="workflow",
                    submittedAt=submitted_str,
                    workflow_id=wf.workflow_name,
                )
            )

    return res_items
