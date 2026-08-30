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
}

# The 6 connector-registry names get_priority_overview fans out to. Kept as a
# separate list (rather than deriving from TOOL_SOURCE_MAP) so adding a future
# single-app tool doesn't silently change what the overview aggregates.
_OVERVIEW_SOURCES = ["gmail", "calendar", "jira", "github", "google_drive", "slack"]


def _format_source_result(result: SourceResult) -> str:
    """Format a SourceResult into a prompt-injection-safe data block for the LLM.

    Phrased as neutral, factual statements rather than imperative instructions
    ("please inform the user...") — the LLM grounds a reply from this fine
    either way, and phrasing it neutrally means this same text is also safe
    to show a user directly as-is, if generate_tool_response() ever fails and
    chat.py falls back to presenting the raw data instead of a synthesized
    sentence. An imperative aimed at "the user" would look broken/confusing
    if a real user ever saw it verbatim in that fallback.
    """
    if not result.connected:
        return (
            f"[{result.source.upper()} STATUS] "
            f"This integration is not connected — no {result.source} account is "
            f"linked yet. (Connect it from the Integrations settings page.)"
        )
    if result.error:
        return (
            f"[{result.source.upper()} STATUS] "
            f"{result.source.capitalize()} is connected, but the request failed "
            f"just now: {result.error}."
        )
    if not result.items:
        return (
            f"[{result.source.upper()} STATUS] "
            f"{result.source.capitalize()} is connected — no items to show right now."
        )
    items_text = "\n".join(
        f"  - {item.title} | {item.detail}" + (f" | Link: {item.url}" if item.url else "")
        for item in result.items
    )
    return (
        f"[{result.source.upper()} DATA — {len(result.items)} item(s)]\n"
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


async def dispatch_tool_call(
    tool_name: str,
    db: AsyncSession,
    user: User,
    query: str,
) -> tuple[str, str, list[RetrievedChunk]]:
    """Execute a tool call and return (formatted_result_text, source_label, chunks).

    Uses the connector registry to dynamically dispatch tool calls to the
    corresponding connector's chat function.
    """
    from app.connectors.registry import connector_registry

    if tool_name == "search_company_documents":
        chunks = await semantic_search(db, query, allowed_roles=[user.role])
        formatted = _format_document_results(chunks)
        logger.info(
            "tool_dispatch tool=search_company_documents user_id=%s chunks=%d",
            user.id, len(chunks),
        )
        return formatted, "documents", chunks

    source = TOOL_SOURCE_MAP.get(tool_name, "none")

    if tool_name == "get_priority_overview":
        # Fan out to every connector's chat_fn in parallel — same idea as
        # generate_daily_briefing()'s orchestration, but covering all 6 chat
        # sources (that function only aggregates 4, for the dashboard widget)
        # via the registry so it stays in sync with whatever each connector's
        # chat_fn actually points to, instead of importing functions directly.
        connectors = [connector_registry.get_connector(name) for name in _OVERVIEW_SOURCES]
        results = await asyncio.gather(*(
            c.chat_fn(db, user) for c in connectors if c and c.chat_fn
        ))
        formatted = "\n\n".join(_format_source_result(r) for r in results)
        logger.info(
            "tool_dispatch tool=get_priority_overview user_id=%s connected=%d/%d",
            user.id, sum(1 for r in results if r.connected), len(results),
        )
        return formatted, source, []

    connector = connector_registry.get_connector(source)

    if connector and connector.chat_fn:
        result: SourceResult = await connector.chat_fn(db, user)
        formatted = _format_source_result(result)
        logger.info(
            "tool_dispatch tool=%s provider=%s user_id=%s connected=%s items=%d",
            tool_name, connector.name, user.id, result.connected, len(result.items),
        )
        return formatted, source, []

    logger.warning("Unknown tool requested: %s", tool_name)
    return "[ERROR] Unknown tool requested.", "none", []
