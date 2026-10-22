"""Email Drafting Service — creates real Gmail drafts, never sends.

This is UnifyAI's first "write" capability (every other integration is
read-only). Deliberately scoped to draft-creation only: the AI writes the
body from a subject line, creates a real draft in the user's Gmail Drafts
folder, and stops there. Actually sending happens when the user opens Gmail
and clicks Send themselves — that's the confirmation step, not a second
chat message or an in-app approval button. No code path here calls Gmail's
send endpoint.
"""
import base64
import logging
import re
from dataclasses import dataclass
from email.message import EmailMessage

import httpx
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.user import User
from app.services.briefing_service import get_decrypted_token, httpx_timeout_default
from app.services.llm_service import generate_email_draft_body

logger = logging.getLogger("eaios.email_draft")

_EMAIL_RE = re.compile(r"^[^@\s]+@[^@\s]+\.[^@\s]+$")


@dataclass
class EmailDraftResult:
    """Outcome of attempting to create a Gmail draft."""
    connected: bool
    success: bool
    to: str
    subject: str
    body: str | None = None
    draft_id: str | None = None
    error: str | None = None


async def create_gmail_draft(db: AsyncSession, user: User, to: str, subject: str) -> EmailDraftResult:
    """Write a body for `subject`, then create a real Gmail draft addressed
    to `to`. Returns a result describing what happened — never raises for
    expected failure cases (not connected, wrong scope, bad address,
    Gmail API error) so the chat tool layer can always produce a clean
    answer instead of a stack trace.
    """
    to = (to or "").strip()
    subject = (subject or "").strip() or "(No subject)"

    if not _EMAIL_RE.match(to):
        return EmailDraftResult(
            connected=True, success=False, to=to, subject=subject,
            error=f"'{to}' doesn't look like a valid email address.",
        )

    # gmail.readonly does NOT grant draft-creation — require the specific
    # "compose" scope so a read-only connection fails with a clear, correct
    # reason instead of a confusing 403 from Google (or worse, silently
    # using some other Google-scoped token that also can't compose).
    token = await get_decrypted_token(db, user.id, ["gmail"], required_scope_keyword="compose")
    if not token:
        return EmailDraftResult(
            connected=False, success=False, to=to, subject=subject,
            error=(
                "Gmail isn't connected with permission to create drafts. "
                "Reconnect Gmail in the Integrations settings page to grant "
                "this access (existing read-only connections need to be "
                "reconnected to pick up the new permission)."
            ),
        )

    try:
        body = await generate_email_draft_body(to, subject)
    except Exception as exc:
        logger.error("Email draft body generation failed for user_id %s: %s", user.id, exc)
        return EmailDraftResult(
            connected=True, success=False, to=to, subject=subject,
            error="Couldn't generate the email content just now — please try again.",
        )

    message = EmailMessage()
    message["To"] = to
    message["Subject"] = subject
    message.set_content(body)
    raw = base64.urlsafe_b64encode(message.as_bytes()).decode("ascii")

    headers = {"Authorization": f"Bearer {token}", "Accept": "application/json"}

    async with httpx.AsyncClient(timeout=httpx_timeout_default) as client:
        try:
            resp = await client.post(
                "https://gmail.googleapis.com/gmail/v1/users/me/drafts",
                headers=headers,
                json={"message": {"raw": raw}},
            )
        except httpx.HTTPError as exc:
            logger.warning("Gmail draft creation request failed for user_id %s: %s", user.id, exc)
            return EmailDraftResult(
                connected=True, success=False, to=to, subject=subject, body=body,
                error=f"Couldn't reach Gmail to create the draft: {type(exc).__name__}.",
            )

    if resp.status_code in (401, 403):
        logger.warning("Gmail draft creation returned %d for user_id %s", resp.status_code, user.id)
        return EmailDraftResult(
            connected=False, success=False, to=to, subject=subject, body=body,
            error="Gmail rejected the request — reconnect Gmail to refresh draft-creation permission.",
        )
    if resp.status_code not in (200, 201):
        logger.warning("Gmail draft creation failed (%d) for user_id %s: %s", resp.status_code, user.id, resp.text[:200])
        return EmailDraftResult(
            connected=True, success=False, to=to, subject=subject, body=body,
            error=f"Gmail API returned an error (status {resp.status_code}).",
        )

    draft_id = resp.json().get("id")
    logger.info("Gmail draft created for user_id %s: draft_id=%s", user.id, draft_id)
    return EmailDraftResult(
        connected=True, success=True, to=to, subject=subject, body=body, draft_id=draft_id,
    )
