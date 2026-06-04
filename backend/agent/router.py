"""Intent classifier — routes each query to the appropriate agent flow.

Two-layer classification:
  1. Rule-based fast path (~0ms, no tokens) — covers ~85% of queries.
  2. gpt-4o-mini LLM fallback (~100 tokens, ~250ms) — only for ambiguous
     short queries where ONBOARDING vs DISCOVERY is unclear.

Intents
-------
ONBOARDING  Vague first-turn opener with no specific ask ("hi", "what can I do?")
DISCOVERY   Event search, recommendations, FAQ, logistics (default bucket)
ACTION      Confirmed follow-up actions: calendar save, directions, ticket booking
FEEDBACK    Visitor sharing an experience or leaving a review
"""
import re
from dataclasses import dataclass
from enum import Enum, auto
from typing import Optional

from dotenv import load_dotenv

load_dotenv()


class Intent(Enum):
    ONBOARDING = auto()
    DISCOVERY  = auto()
    ACTION     = auto()
    FEEDBACK   = auto()


@dataclass
class ClassifiedRequest:
    intent:     Intent
    confidence: str  # "rule" | "llm"


# ---------------------------------------------------------------------------
# Reuse phrase list from feedbackagent — single source of truth
# ---------------------------------------------------------------------------
from .feedbackagent import _FEEDBACK_INTENT_PHRASES  # noqa: E402  (circular-safe: no cross-import back)

# Explicit confirmed-action patterns (user is following up on a known event)
_ACTION_RE = re.compile(
    r"\b("
    r"add (it |this |that |the event |that event )?to (my )?calendar"
    r"|save (it|this|that|the event|that event)"
    r"|book (it|a ticket|tickets)"
    r"|secure (a )?ticket"
    r"|download (the )?(ics|file|calendar)"
    r"|pull up directions"
    r"|get (me )?directions"
    r"|yes[,.]? (please )?directions"
    r"|directions please"
    r")\b",
    re.IGNORECASE,
)

# Words that indicate a query has specific content (not a vague opener)
_SPECIFICITY_RE = re.compile(
    r"\b(science|art|music|tech|robot|dance|family|kids|food|talk|lecture|"
    r"workshop|tour|show|performance|exhibition|zone|venue|ticket|book|free|paid|"
    r"when|where|how|what time|sunday|saturday|friday|afternoon|evening|morning|"
    r"bsl|wheelchair|accessible|parking|travel|tube|station|interest|recommend|"
    r"suggest|activity|activities|event|programme|schedule)\b",
    re.IGNORECASE,
)


# ---------------------------------------------------------------------------
# Rule-based classifier
# ---------------------------------------------------------------------------

def _rule_classify(query: str, has_history: bool) -> Optional[Intent]:
    q = query.lower()

    for phrase in _FEEDBACK_INTENT_PHRASES:
        if phrase in q:
            return Intent.FEEDBACK

    if _ACTION_RE.search(query):
        return Intent.ACTION

    # Short + first turn + no specific content → candidate for onboarding;
    # return None to trigger LLM disambiguation.
    if not has_history and len(query.split()) <= 5 and not _SPECIFICITY_RE.search(query):
        return None  # ambiguous — defer to LLM

    return Intent.DISCOVERY


# ---------------------------------------------------------------------------
# LLM fallback (fires only for ambiguous short first-turn queries)
# ---------------------------------------------------------------------------

def _llm_classify(query: str) -> Intent:
    from langchain_core.messages import SystemMessage, HumanMessage
    from langchain_openai import ChatOpenAI

    llm    = ChatOpenAI(model="gpt-4o-mini", temperature=0, max_tokens=5)
    system = (
        "Classify the visitor message for a festival chatbot. "
        "Reply with exactly one word: ONBOARDING, DISCOVERY, ACTION, or FEEDBACK.\n"
        "ONBOARDING: vague greeting with no specific interest or question "
        "(e.g. 'hi', 'hello', 'what can I do', 'help').\n"
        "DISCOVERY: any question about events, activities, logistics, or interests.\n"
        "ACTION: saving to calendar, booking a ticket, or getting directions.\n"
        "FEEDBACK: sharing an experience or leaving a review."
    )
    resp  = llm.invoke([SystemMessage(content=system), HumanMessage(content=query)])
    token = resp.content.strip().upper()
    return {
        "ONBOARDING": Intent.ONBOARDING,
        "DISCOVERY":  Intent.DISCOVERY,
        "ACTION":     Intent.ACTION,
        "FEEDBACK":   Intent.FEEDBACK,
    }.get(token, Intent.DISCOVERY)


# ---------------------------------------------------------------------------
# Public interface
# ---------------------------------------------------------------------------

def classify_intent(query: str, has_history: bool = False) -> ClassifiedRequest:
    """Classify *query* into an Intent for agent routing.

    Returns ClassifiedRequest(intent, confidence) where confidence is
    "rule" (instant) or "llm" (gpt-4o-mini disambiguation call).
    """
    result = _rule_classify(query, has_history)

    if result is not None:
        return ClassifiedRequest(intent=result, confidence="rule")

    # Ambiguous short query — ask the LLM
    intent = _llm_classify(query)
    return ClassifiedRequest(intent=intent, confidence="llm")
