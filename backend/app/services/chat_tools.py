"""Chat Tool-Calling Service — tool schemas and dispatch for Gemini function-calling.

Registers briefing_service.py functions + search_company_documents as callable
tools for the chat LLM.  dispatch_tool_call() executes the requested tool using
the current authenticated user's own OAuth tokens (reuses per-user isolation
from briefing_service.py, no new token-retrieval logic).

gmail/jira/calendar are backed by dedicated "_recent" functions in
briefing_service.py — broader-scoped variants built for chat, separate from
the narrow "_briefing" functions the dashboard's daily briefing still uses
unchanged (e.g. gmail briefing = unread-only; gmail recent = read+unread).
"""
import asyncio
import logging

from sqlalchemy.ext.asyncio import AsyncSession

from app.models.user import User
from app.schemas.briefing import SourceResult
from app.services.briefing_service import (
    get_calendar_recent,
    get_drive_briefing,
    get_github_briefing,
    get_gmail_recent,
    get_jira_recent,
    get_slack_briefing,
)
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
TOOL_SOURCE_MAP = {
    "get_priority_overview": "overview",
    "get_gmail_briefing": "gmail",
    "get_jira_briefing": "jira",
    "get_github_briefing": "github",
    "get_calendar_briefing": "calendar",
    "search_company_documents": "documents",
    "get_drive_briefing": "drive",
    "get_slack_briefing": "slack",
}

# Map tool names (LLM-facing) to their actual implementation functions.
# gmail/jira/calendar deliberately point at the "_recent" chat-only variants
# (broader scope — see briefing_service.py) rather than the dashboard's
# narrow daily-briefing versions, which stay wired unchanged into
# generate_daily_briefing(). github/drive/slack are already general enough
# for chat, so they reuse their single existing implementation as-is.
_BRIEFING_DISPATCH = {
    "get_gmail_briefing": get_gmail_recent,
    "get_jira_briefing": get_jira_recent,
    "get_github_briefing": get_github_briefing,
    "get_calendar_briefing": get_calendar_recent,
}


def _format_source_result(result: SourceResult) -> str:
    """Format a SourceResult into a prompt-injection-safe data block for the LLM."""
    if not result.connected:
        return (
            f"[{result.source.upper()} STATUS] "
            f"This integration is NOT connected. The user has not linked their "
            f"{result.source} account yet. Please inform them they need to connect "
            f"their {result.source} integration in the Integrations settings page."
        )
    if result.error:
        return (
            f"[{result.source.upper()} STATUS] "
            f"Integration is connected but the API call failed: {result.error}. "
            f"Please inform the user of this temporary error."
        )
    if not result.items:
        return (
            f"[{result.source.upper()} STATUS] "
            f"Integration is connected and working. No items found — the user has "
            f"no actionable items from {result.source} right now."
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

    `chunks` is only ever non-empty for search_company_documents — it's the raw
    retrieval result, kept alongside the formatted text so the router can build
    real Citation objects and a real confidence score for document answers
    instead of losing that data once it's flattened into prompt text. Every
    other tool returns an empty list; there's no equivalent "excerpt" concept
    for a Gmail/Jira/GitHub/Calendar item.

    Uses the EXISTING briefing_service.py functions with the same (db, user)
    signature, reusing per-user OAuth token isolation already tested.
    Tool results are formatted as data blocks, never as instructions.
    """
    source = TOOL_SOURCE_MAP.get(tool_name, "none")

    if tool_name == "get_priority_overview":
        # Fan out to every connected source in parallel — same pattern as
        # generate_daily_briefing()'s orchestration, but covering all 6 chat
        # tools (that function only aggregates 4, for the dashboard widget)
        # and reusing the broader "_recent" variants so a source with no
        # unread/overdue/today items still reports what it actually has.
        results = await asyncio.gather(
            get_gmail_recent(db, user),
            get_calendar_recent(db, user),
            get_jira_recent(db, user),
            get_github_briefing(db, user),
            get_drive_briefing(db, user),
            get_slack_briefing(db, user),
        )
        formatted = "\n\n".join(_format_source_result(r) for r in results)
        logger.info(
            "tool_dispatch tool=get_priority_overview user_id=%s connected=%d/6",
            user.id, sum(1 for r in results if r.connected),
        )
        return formatted, source, []

    if tool_name == "get_gmail_briefing":
        result: SourceResult = await get_gmail_recent(db, user)
        formatted = _format_source_result(result)
        logger.info(
            "tool_dispatch tool=%s user_id=%s connected=%s items=%d",
            tool_name, user.id, result.connected, len(result.items),
        )
        return formatted, source, []

    if tool_name == "get_jira_briefing":
        result: SourceResult = await get_jira_recent(db, user)
        formatted = _format_source_result(result)
        logger.info(
            "tool_dispatch tool=%s user_id=%s connected=%s items=%d",
            tool_name, user.id, result.connected, len(result.items),
        )
        return formatted, source, []

    if tool_name == "get_github_briefing":
        result: SourceResult = await get_github_briefing(db, user)
        formatted = _format_source_result(result)
        logger.info(
            "tool_dispatch tool=%s user_id=%s connected=%s items=%d",
            tool_name, user.id, result.connected, len(result.items),
        )
        return formatted, source, []

    if tool_name == "get_calendar_briefing":
        result: SourceResult = await get_calendar_recent(db, user)
        formatted = _format_source_result(result)
        logger.info(
            "tool_dispatch tool=%s user_id=%s connected=%s items=%d",
            tool_name, user.id, result.connected, len(result.items),
        )
        return formatted, source, []

    if tool_name == "search_company_documents":
        chunks = await semantic_search(db, query, allowed_roles=[user.role])
        formatted = _format_document_results(chunks)
        logger.info(
            "tool_dispatch tool=search_company_documents user_id=%s chunks=%d",
            user.id, len(chunks),
        )
        return formatted, source, chunks

    if tool_name == "get_drive_briefing":
        result: SourceResult = await get_drive_briefing(db, user)
        formatted = _format_source_result(result)
        logger.info(
            "tool_dispatch tool=%s user_id=%s connected=%s items=%d",
            tool_name, user.id, result.connected, len(result.items),
        )
        return formatted, source, []

    if tool_name == "get_slack_briefing":
        result: SourceResult = await get_slack_briefing(db, user)
        formatted = _format_source_result(result)
        logger.info(
            "tool_dispatch tool=%s user_id=%s connected=%s items=%d",
            tool_name, user.id, result.connected, len(result.items),
        )
        return formatted, source, []

    logger.warning("Unknown tool requested: %s", tool_name)
    return "[ERROR] Unknown tool requested.", "none", []
