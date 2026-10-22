"""Chat Tool-Calling Service — tool schemas and dispatch for Gemini function-calling.

Registers each connector's chat_fn (see app/connectors/*.py) + search_company_
documents as callable tools for the chat LLM. dispatch_tool_call() looks up
the requested tool's connector via the registry and calls its chat_fn, reusing
the same per-user OAuth token isolation and provider setup the rest of the app
already uses — no new token-retrieval logic here.

Each connector's chat_fn points at a dedicated "_recent" function in
briefing_service.py for gmail/jira/calendar — broader-scoped variants built
for chat, separate from the narrower "_briefing" functions the dashboard's
daily briefing still uses (e.g. gmail briefing = unread-only; gmail recent =
read+unread). get_priority_overview fans out to all 6 connectors' chat_fn in
parallel for broad, cross-app questions.
"""
import asyncio
import logging

from sqlalchemy.ext.asyncio import AsyncSession

from app.models.user import User
from app.schemas.briefing import SourceResult
from app.services.email_draft_service import EmailDraftResult, create_gmail_draft
from app.services.retrieval_service import (
    RetrievedChunk,
    excerpt,
    semantic_search,
)

logger = logging.getLogger("eaios.chat_tools")

# ── TOOL SCHEMAS (Gemini function declaration format) ────────────────

TOOL_SCHEMAS = [
    {
        "name": "get_priority_overview",
        "description": (
            "Get a single cross-cutting summary pulled from ALL of the user's "
            "connected apps at once — Gmail, Google Calendar, Jira, GitHub, Google "
            "Drive, and Slack — combined together. Use this tool ONLY when the "
            "question is broad and spans multiple apps at once, e.g. 'what's on "
            "my priority today', 'what should I focus on', 'what's on my plate', "
            "'give me an overview of my day', 'catch me up', or any question "
            "asking generally what's important right now without naming one "
            "specific app. Do NOT use this when the user names a specific app or "
            "asks about only one thing (emails, just Jira, just their calendar, "
            "etc.) — use that app's own tool instead for those."
        ),
        "parameters": {
            "type": "object",
            "properties": {},
            "required": [],
        },
    },
    {
        "name": "get_gmail_briefing",
        "description": (
            "Retrieve the user's email inbox status from Gmail. Use this tool when "
            "the user asks about their emails, unread messages, latest email, inbox, "
            "email subjects, or anything related to their Gmail account."
        ),
        "parameters": {
            "type": "object",
            "properties": {},
            "required": [],
        },
    },
    {
        "name": "get_jira_briefing",
        "description": (
            "Retrieve the user's Jira tickets and issues. Use this tool when the "
            "user asks about their Jira tickets, open issues, most urgent ticket, "
            "task status, sprint items, or anything related to their Jira project "
            "management board."
        ),
        "parameters": {
            "type": "object",
            "properties": {},
            "required": [],
        },
    },
    {
        "name": "get_github_briefing",
        "description": (
            "Retrieve the user's GitHub activity and repository information. Use "
            "this tool when the user asks about their GitHub commits, pull requests, "
            "code reviews, pending reviews, open PRs, issues, repositories, or "
            "anything related to their GitHub account."
        ),
        "parameters": {
            "type": "object",
            "properties": {},
            "required": [],
        },
    },
    {
        "name": "get_calendar_briefing",
        "description": (
            "Retrieve the user's Google Calendar events and schedule, covering "
            "recent past days plus the next two weeks. Use this tool when the "
            "user asks about their meetings, schedule, calendar events, "
            "upcoming or recent meetings, or anything related to their "
            "Google Calendar."
        ),
        "parameters": {
            "type": "object",
            "properties": {},
            "required": [],
        },
    },
    {
        "name": "search_company_documents",
        "description": (
            "Search the company's internal knowledge base and documents. Use this "
            "tool when the user asks about company policies, procedures, employee "
            "handbooks, internal documentation, or any factual question that would "
            "be answered by company documents. Do NOT use this for personal data "
            "like emails, tickets, calendar events, Drive files, or Slack messages."
        ),
        "parameters": {
            "type": "object",
            "properties": {
                "query": {
                    "type": "string",
                    "description": "The search query to find relevant company documents.",
                },
            },
            "required": ["query"],
        },
    },
    {
        "name": "get_drive_briefing",
        "description": (
            "List the user's most recently modified files in their own Google "
            "Drive. Use this tool when the user asks what files they have in "
            "Drive, their recent Drive documents, or anything about files stored "
            "in their personal Google Drive. Do NOT use this for company policy "
            "or knowledge-base questions — use search_company_documents for those."
        ),
        "parameters": {
            "type": "object",
            "properties": {},
            "required": [],
        },
    },
    {
        "name": "get_slack_briefing",
        "description": (
            "Retrieve recent messages from the user's Slack channels. Use this "
            "tool when the user asks about their Slack messages, channels, "
            "threads, or anything related to their Slack workspace."
        ),
        "parameters": {
            "type": "object",
            "properties": {},
            "required": [],
        },
    },
    {
        "name": "draft_email",
        "description": (
            "Write and create a real Gmail DRAFT for the user, addressed to a "
            "specific recipient, with a subject line. You write the body "
            "yourself based on the subject. This only creates a draft sitting "
            "in the user's Gmail Drafts folder — it NEVER sends anything. The "
            "user reviews and sends it themselves from Gmail. Use this when "
            "the user asks you to draft, write, or compose an email to "
            "someone. Requires the recipient's email address; if the user "
            "didn't give an exact subject, infer a short, specific one from "
            "what they asked for."
        ),
        "parameters": {
            "type": "object",
            "properties": {
                "to": {
                    "type": "string",
                    "description": "The recipient's email address.",
                },
                "subject": {
                    "type": "string",
                    "description": (
                        "The email subject line. Also used as the only basis "
                        "for the AI-written body — make it specific enough to "
                        "convey what the email is about."
                    ),
                },
            },
            "required": ["to", "subject"],
        },
    },
]

# Map tool names to their source labels for the ChatResponse.source field
# AND to the canonical connector-registry key (app/connectors/*.py CONNECTOR.name)
# used to look up that source's chat_fn. These must match the registry's
# canonical names exactly — Drive's is "google_drive", not "drive", the same
# canonical name used everywhere else in the app (oauth_config, providers.ts).
TOOL_SOURCE_MAP = {
    "get_priority_overview": "overview",
    "get_gmail_briefing": "gmail",
    "get_jira_briefing": "jira",
    "get_github_briefing": "github",
    "get_calendar_briefing": "calendar",
    "search_company_documents": "documents",
    "get_drive_briefing": "google_drive",
    "get_slack_briefing": "slack",
    "draft_email": "gmail",
}

# The 6 connector-registry names get_priority_overview fans out to. Kept as a
# separate list (rather than deriving from TOOL_SOURCE_MAP) so adding a future
# single-app tool doesn't silently change what the overview aggregates.
_OVERVIEW_SOURCES = ["gmail", "calendar", "jira", "github", "google_drive", "slack"]


def _format_source_result(result: SourceResult, label: str | None = None) -> str:
    """Format a SourceResult into a prompt-injection-safe data block for the LLM.

    `label` lets the caller override the display name used in the block
    header/text — defaults to `result.source` when not given, so existing
    behavior is unchanged for every caller that doesn't pass one. This
    matters for Google Drive specifically: get_drive_briefing() internally
    sets SourceResult(source="drive", ...) because that's the name the
    dashboard's briefing items/icons/tabs already key off of (left alone
    here — not touching dashboard-facing code), but the canonical name
    everywhere else in the app (OAuth, the connector registry, chat's own
    ChatResponse.source field) is "google_drive". Without an override, the
    LLM would see "[DRIVE STATUS]" — a label it never explicitly learns to
    recognize — instead of "[GOOGLE_DRIVE STATUS]".

    Phrased as neutral, factual statements rather than imperative instructions
    ("please inform the user...") — the LLM grounds a reply from this fine
    either way, and phrasing it neutrally means this same text is also safe
    to show a user directly as-is, if generate_tool_response() ever fails and
    chat.py falls back to presenting the raw data instead of a synthesized
    sentence. An imperative aimed at "the user" would look broken/confusing
    if a real user ever saw it verbatim in that fallback.
    """
    name = label or result.source
    if not result.connected:
        return (
            f"[{name.upper()} STATUS] "
            f"This integration is not connected — no {name} account is "
            f"linked yet. (Connect it from the Integrations settings page.)"
        )
    if result.error:
        return (
            f"[{name.upper()} STATUS] "
            f"{name.capitalize()} is connected, but the request failed "
            f"just now: {result.error}."
        )
    if not result.items:
        return (
            f"[{name.upper()} STATUS] "
            f"{name.capitalize()} is connected — no items to show right now."
        )
    items_text = "\n".join(
        f"  - {item.title} | {item.detail}" + (f" | Link: {item.url}" if item.url else "")
        for item in result.items
    )
    return (
        f"[{name.upper()} DATA — {len(result.items)} item(s)]\n"
        f"{items_text}"
    )


def _format_document_results(chunks: list[RetrievedChunk]) -> str:
    """Format retrieved document chunks into a prompt-injection-safe data block."""
    if not chunks:
        return (
            "[DOCUMENT SEARCH] No matching documents found in the company knowledge "
            "base for this query."
        )
    blocks = "\n".join(
        f"  - [Source: {chunk.document_title}] {excerpt(chunk.content, 300)}"
        for chunk in chunks
    )
    return f"[COMPANY DOCUMENTS — {len(chunks)} result(s)]\n{blocks}"


def _format_email_draft_result(result: EmailDraftResult) -> str:
    """Format an EmailDraftResult into a data block for the LLM.

    Explicit about DRAFT vs SENT in every branch — this tool only ever
    creates a draft sitting in the user's Gmail Drafts folder, never sends,
    and the wording here must not let the LLM's final synthesized answer
    imply anything was actually sent.
    """
    if not result.connected:
        return f"[EMAIL DRAFT STATUS] Could not create the draft — {result.error}"
    if not result.success:
        return (
            f"[EMAIL DRAFT STATUS] Attempted to draft an email to {result.to} "
            f"but it failed: {result.error}"
        )
    return (
        "[EMAIL DRAFT CREATED — NOT SENT] A draft was successfully created in "
        "the user's Gmail Drafts folder. It has NOT been sent — the user must "
        "open Gmail and send it themselves when ready.\n"
        f"To: {result.to}\n"
        f"Subject: {result.subject}\n"
        f"Body:\n{result.body}"
    )


async def dispatch_tool_call(
    tool_name: str,
    db: AsyncSession,
    user: User,
    query: str,
    tool_args: dict | None = None,
) -> tuple[str, str, list[RetrievedChunk]]:
    """Execute a tool call and return (formatted_result_text, source_label, chunks).

    Uses the connector registry to dynamically dispatch tool calls to the
    corresponding connector's chat function. `tool_args` carries the full
    argument dict the model supplied for tools that need more than the
    single free-text `query` string (e.g. draft_email's `to`/`subject`) —
    optional and defaults to None so every existing caller/tool is unaffected.
    """
    from app.connectors.registry import connector_registry

    tool_args = tool_args or {}

    if tool_name == "search_company_documents":
        chunks = await semantic_search(db, query, allowed_roles=[user.role])
        formatted = _format_document_results(chunks)
        logger.info(
            "tool_dispatch tool=search_company_documents user_id=%s chunks=%d",
            user.id, len(chunks),
        )
        return formatted, "documents", chunks

    if tool_name == "draft_email":
        to = tool_args.get("to", "")
        subject = tool_args.get("subject", "")
        result = await create_gmail_draft(db, user, to, subject)
        formatted = _format_email_draft_result(result)
        logger.info(
            "tool_dispatch tool=draft_email user_id=%s connected=%s success=%s",
            user.id, result.connected, result.success,
        )
        return formatted, "gmail", []

    source = TOOL_SOURCE_MAP.get(tool_name, "none")

    if tool_name == "get_priority_overview":
        # Fan out to every connector's chat_fn in parallel — same idea as
        # generate_daily_briefing()'s orchestration, but covering all 6 chat
        # sources (that function only aggregates 4, for the dashboard widget)
        # via the registry so it stays in sync with whatever each connector's
        # chat_fn actually points to, instead of importing functions directly.
        # Keep (canonical_name, connector) paired through the gather so a
        # missing connector can't silently shift a later result's label —
        # each result is labeled with the name it was actually fetched for.
        named_connectors = [
            (name, connector_registry.get_connector(name)) for name in _OVERVIEW_SOURCES
        ]
        available = [(name, c) for name, c in named_connectors if c and c.chat_fn]
        results = await asyncio.gather(*(c.chat_fn(db, user) for _, c in available))
        formatted = "\n\n".join(
            _format_source_result(r, label=name)
            for (name, _), r in zip(available, results)
        )
        logger.info(
            "tool_dispatch tool=get_priority_overview user_id=%s connected=%d/%d",
            user.id, sum(1 for r in results if r.connected), len(results),
        )
        return formatted, source, []

    connector = connector_registry.get_connector(source)

    if connector and connector.chat_fn:
        result: SourceResult = await connector.chat_fn(db, user)
        formatted = _format_source_result(result, label=source)
        logger.info(
            "tool_dispatch tool=%s provider=%s user_id=%s connected=%s items=%d",
            tool_name, connector.name, user.id, result.connected, len(result.items),
        )
        return formatted, source, []

    logger.warning("Unknown tool requested: %s", tool_name)
    return "[ERROR] Unknown tool requested.", "none", []
