"""Chat endpoint with greeting heuristic and tool-calling support.

Flow: query → greeting check → tool-calling via LLM → RAG fallback.
Tool-calling reuses existing briefing_service.py functions with per-user
OAuth token isolation.  Tool results are framed as data, never instructions.
"""
import logging
import re
import uuid
from typing import Annotated

from fastapi import APIRouter, Depends, Request
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import settings
from app.core.deps import get_current_user, get_db
from app.core.rate_limit import limiter
from app.models.chat_message import ChatMessage
from app.models.unanswered_query import UnansweredQuery
from app.models.user import User
from app.schemas.chat import ChatRequest, ChatResponse, Citation
from app.services.chat_tools import TOOL_SCHEMAS, dispatch_tool_call
from app.services.llm_service import (
    generate_answer,
    generate_greeting,
    generate_tool_response,
    generate_with_tools,
)
from app.services.retrieval_service import (
    confidence_from_distance,
    excerpt,
    semantic_search,
)

router = APIRouter()
logger = logging.getLogger("eaios.chat")

FALLBACK_MESSAGE = "I couldn't find this in company documents — I've flagged it for review."
TOOL_RESPONSE_FAILURE_MESSAGE = (
    "I found the relevant data but hit a temporary error putting together a response. "
    "Please try asking again in a moment."
)

# ── GREETING HEURISTIC ──────────────────────────────────────────────

_GREETING_WORDS = frozenset({
    "hi", "hello", "hey", "hiya", "howdy",
    "good morning", "good afternoon", "good evening", "good night",
    "morning", "afternoon", "evening",
    "thanks", "thank you", "thankyou", "thx",
    "bye", "goodbye", "see you", "later", "cheers",
    "how are you", "what's up", "whats up", "sup",
    "nice to meet you", "yo",
})

# Pre-compile single-word set for O(1) lookup
_GREETING_SINGLE = frozenset({
    "hi", "hello", "hey", "hiya", "howdy", "morning", "afternoon",
    "evening", "thanks", "thx", "bye", "goodbye", "later", "cheers",
    "sup", "yo",
})


def _is_greeting(query: str) -> bool:
    """Check if query is a short greeting/small-talk message (≤6 words)."""
    cleaned = re.sub(r"[^\w\s]", "", query.lower()).strip()
    words = cleaned.split()
    if not words or len(words) > 6:
        return False
    # Check full phrase first
    if cleaned in _GREETING_WORDS:
        return True
    # Check single word
    if len(words) == 1 and words[0] in _GREETING_SINGLE:
        return True
    # Check 2-3 word phrases
    if len(words) <= 3:
        phrase = " ".join(words)
        if phrase in _GREETING_WORDS:
            return True
    return False


# ── MAIN CHAT ENDPOINT ──────────────────────────────────────────────


@router.post("/chat", response_model=ChatResponse)
@limiter.limit(settings.CHAT_RATE_LIMIT)
async def chat(
    request: Request,
    body: ChatRequest,
    current_user: Annotated[User, Depends(get_current_user)],
    db: Annotated[AsyncSession, Depends(get_db)],
) -> ChatResponse:
    conversation_id = body.conversation_id or str(uuid.uuid4())

    # Persist chat query for the activity feed
    db.add(ChatMessage(
        user_id=current_user.id,
        query_text=body.query,
        conversation_id=conversation_id,
    ))
    await db.commit()

    # ── Step 1: Greeting heuristic (fast path, no RAG or tools) ─────
    if _is_greeting(body.query):
        try:
            greeting_reply = await generate_greeting(body.query)
        except Exception:
            greeting_reply = "Hello! How can I help you today?"

        logger.info("chat_greeting user_id=%s", current_user.id)
        return ChatResponse(
            answer=greeting_reply,
            confidence=0.0,
            citations=[],
            conversation_id=conversation_id,
            flagged_for_review=False,
            source="none",
        )

    # ── Step 2: Tool-calling via LLM ────────────────────────────────
    try:
        tool_decision = await generate_with_tools(body.query, TOOL_SCHEMAS)
    except Exception as exc:
        logger.warning("Tool-calling LLM failed, falling through to RAG: %s", exc)
        tool_decision = None

    # If model requested tool calls, execute them
    if isinstance(tool_decision, list) and tool_decision:
        all_results = []
        all_chunks = []  # only ever populated by search_company_documents
        sources_used: list[str] = []  # preserves call order, no duplicates

        for call in tool_decision:
            tool_name = call.get("name", "")
            tool_args = call.get("args", {})
            query_for_tool = tool_args.get("query", body.query)

            result_text, tool_source, chunks = await dispatch_tool_call(
                tool_name, db, current_user, query_for_tool,
            )
            all_results.append(result_text)
            all_chunks.extend(chunks)
            if tool_source not in sources_used:
                sources_used.append(tool_source)

        # A compound question (e.g. "my GitHub commit and my email") can
        # trigger multiple tools in one turn — join their labels rather than
        # reporting only the first, which would mislabel a combined answer
        # as if it only came from one source.
        source = ", ".join(sources_used) if sources_used else "none"

        combined_results = "\n\n".join(all_results)

        tool_response_failed = False
        try:
            answer = await generate_tool_response(body.query, combined_results)
        except Exception as exc:
            # NEVER fall back to the raw combined_results string here — it's an
            # internal prompt-formatted data block (e.g. "[GMAIL DATA — 1
            # item(s)] - <subject> | From: ... | Link: ..."), not something
            # meant for a user to read. Leaking it looks like a broken/raw
            # response and can include unredacted personal data (email
            # addresses, message links, etc.) straight from the tool result.
            logger.error(
                "Tool response generation failed, user_id=%s source=%s: %s",
                current_user.id, source, exc,
            )
            answer = TOOL_RESPONSE_FAILURE_MESSAGE
            tool_response_failed = True

        logger.info(
            "chat_tool_answered user_id=%s source=%s tools=%d degraded=%s",
            current_user.id, source, len(tool_decision), tool_response_failed,
        )

        # search_company_documents is the only tool that returns retrieval
        # chunks — when it does, build real citations/confidence from them
        # the same way the RAG fallback path below does, instead of losing
        # that data once it's flattened into prompt text for the LLM.
        citations = [
            Citation(
                document_title=chunk.document_title,
                document_id=chunk.document_id,
                excerpt=excerpt(chunk.content),
            )
            for chunk in all_chunks
        ]
        confidence = confidence_from_distance(all_chunks[0].distance) if all_chunks else 0.0

        return ChatResponse(
            answer=answer,
            confidence=confidence,
            citations=citations,
            conversation_id=conversation_id,
            flagged_for_review=tool_response_failed,
            source=source,
        )

    # If the model returned a direct text answer (no tool call), use it
    if isinstance(tool_decision, str) and tool_decision.strip():
        logger.info("chat_direct_answer user_id=%s", current_user.id)
        return ChatResponse(
            answer=tool_decision,
            confidence=0.0,
            citations=[],
            conversation_id=conversation_id,
            flagged_for_review=False,
            source="none",
        )

    # ── Step 3: RAG fallback (existing behavior, unchanged) ─────────
    # allowed_roles is derived from the authenticated user — never omitted/None,
    # which would fall back to unrestricted access inside semantic_search().
    results = await semantic_search(db, body.query, allowed_roles=[current_user.role])

    if not results:
        db.add(
            UnansweredQuery(
                user_id=current_user.id,
                query_text=body.query,
                status="pending",
            )
        )
        await db.commit()

        logger.info(
            "chat_fallback user_id=%s confidence=%.4f",
            current_user.id,
            0.0,
        )
        return ChatResponse(
            answer=FALLBACK_MESSAGE,
            confidence=0.0,
            citations=[],
            conversation_id=conversation_id,
            flagged_for_review=True,
            source="documents",
        )

    answer = await generate_answer(body.query, results)
    confidence = confidence_from_distance(results[0].distance)

    logger.info(
        "chat_answered user_id=%s confidence=%.4f chunks=%d",
        current_user.id,
        confidence,
        len(results),
    )

    citations = [
        Citation(
            document_title=chunk.document_title,
            document_id=chunk.document_id,
            excerpt=excerpt(chunk.content),
        )
        for chunk in results
    ]

    return ChatResponse(
        answer=answer,
        confidence=confidence,
        citations=citations,
        conversation_id=conversation_id,
        flagged_for_review=False,
        source="documents",
    )
