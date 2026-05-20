"""Feedback agent — collects visitor reflections in a structured 3-stage conversation.

Activation:
  - Frontend sends feedback_trigger=True in the chat request, OR
  - User message matches feedback intent phrases, OR
  - Thread is already in an active feedback session

Conversation state is held in memory per thread_id. Exchanges are buffered in
SQLite (feedback_exchanges table) and flushed to Supabase when <<END>> is
detected, or at session expiry via parse_session() / flush_feedback_to_supabase().
"""
import re
from pathlib import Path
from typing import Optional

from dotenv import load_dotenv
from langchain_core.messages import SystemMessage, HumanMessage, AIMessage
from langchain_openai import ChatOpenAI

from .interests import (
    save_message,
    save_feedback_exchange,
    get_unflushed_exchanges,
    mark_exchanges_flushed,
)

load_dotenv()

_PROMPT_FILE  = Path(__file__).parent / "feedbackagent.prompt"
_prompt_cache: Optional[str] = None

# Per thread_id: { active, stage, sequence, pending_main_q, pending_follow_ups,
#                  interaction_stage, messages, reluctance_count }
_feedback_state: dict[str, dict] = {}

_FEEDBACK_INTENT_PHRASES = [
    "share my experience",
    "share experience",
    "share feedback",
    "give feedback",
    "leave feedback",
    "leave a review",
    "tell you about",
    "want to share",
    "like to share",
    "provide feedback",
    "share thoughts",
    "share my thoughts",
    "want to tell you",
    "had a great time",
    "had a good time",
    "had an amazing",
    "really enjoyed",
]

# Patterns that signal the user wants event/logistics info, not to share feedback
_OFF_TOPIC_RE = re.compile(
    r"\b(what|when|where|how|which|who)\b.{0,40}(event|activity|activities|show|tour|"
    r"workshop|talk|performance|ticket|booking|schedule|time|location|venue|zone|map)\b"
    r"|"
    r"\b(is there|are there|any).{0,30}(event|activity|activities|workshop|talk|show)\b"
    r"|"
    r"\bfaq\b|\bprogramme\b|\bhow (do|can) i\b|\bwhat('s| is) on\b",
    re.IGNORECASE,
)

_RELUCTANCE_WORDS = frozenset([
    "no", "nope", "nah", "fine", "okay", "ok", "nothing",
    "not really", "not sure", "i don't know", "i dont know", "maybe", "whatever",
])

# Stage assigned by sequence index (0-based)
_STAGE_BY_SEQ = ["opening", "deepening", "deepening", "perspective", "closing"]

_RELUCTANCE_DIRECTIVE = (
    "\n\nDIRECTIVE: The visitor has shown reluctance in multiple exchanges. "
    "You MUST now deliver your pre-close question using <<CLOSING_Q>>. "
    "Do not ask any other question. Do not probe further."
)


def _load_prompt() -> str:
    global _prompt_cache
    if _prompt_cache is None:
        _prompt_cache = _PROMPT_FILE.read_text()
    return _prompt_cache


def _state(thread_id: str) -> dict:
    return _feedback_state.get(thread_id, {})


def _init_state(thread_id: str, interaction_stage: str | None = None, username: str = "") -> None:
    _feedback_state[thread_id] = {
        "active":             True,
        "stage":              "opening",
        "sequence":           0,
        "pending_main_q":     None,
        "pending_follow_ups": [],
        "interaction_stage":  interaction_stage,
        "username":           username,
        "messages":           [],   # feedback-session-only LLM context (no pre-feedback history)
        "reluctance_count":   0,
    }


def _deactivate(thread_id: str) -> None:
    if thread_id in _feedback_state:
        _feedback_state[thread_id]["active"] = False


def _stage_for(sequence: int) -> str:
    if sequence < len(_STAGE_BY_SEQ):
        return _STAGE_BY_SEQ[sequence]
    return "closing"


def _is_reluctant(message: str) -> bool:
    """Return True if the message is a short deflecting response."""
    stripped = message.strip().lower().rstrip(".,!?")
    words    = stripped.split()
    if len(words) > 5:
        return False
    return stripped in _RELUCTANCE_WORDS or any(w in _RELUCTANCE_WORDS for w in words)


def is_feedback_trigger(thread_id: str, query: str, explicit: bool = False) -> bool:
    """Return True when this message should be handled by the feedback agent."""
    if _state(thread_id).get("active"):
        return True
    if explicit:
        return True
    lower = query.lower()
    return any(phrase in lower for phrase in _FEEDBACK_INTENT_PHRASES)


def run_feedback_agent(
    thread_id: str,
    user_message: str,
    interaction_stage: str | None = None,
    username: str = "",
) -> Optional[str]:
    """Run one turn of the feedback conversation.

    Returns the cleaned agent response string, or None if the message is
    off-topic and should be handed back to the main agent.
    """
    st = _state(thread_id)

    # Off-topic while in feedback mode → exit gracefully, let main agent handle it
    if st.get("active") and _OFF_TOPIC_RE.search(user_message):
        _deactivate(thread_id)
        return None

    # Initialise state for a new feedback conversation
    if not st.get("active"):
        _init_state(thread_id, interaction_stage, username=username)
        st = _state(thread_id)

    # Persist user message to shared conversation history (for post-session parsing)
    save_message(thread_id, "user", user_message)
    # Append to feedback-only context window
    st["messages"].append({"role": "user", "content": user_message})

    # ── Reluctance tracking ───────────────────────────────────────────────────
    if _is_reluctant(user_message):
        st["reluctance_count"] += 1

    # ── Record previous exchange (user answered the pending question) ─────────
    pending_q  = st.get("pending_main_q")
    pending_fu = st.get("pending_follow_ups", [])
    if pending_q:
        save_feedback_exchange(
            thread_id=thread_id,
            sequence=st["sequence"],
            stage=st["stage"],
            main_question=pending_q,
            follow_ups=pending_fu,
            response=user_message,
            interaction_stage=st.get("interaction_stage"),
        )
        st["sequence"] += 1
        st["stage"]              = _stage_for(st["sequence"])
        st["pending_main_q"]     = None
        st["pending_follow_ups"] = []

    # ── Build LLM message list (feedback-session context only) ────────────────
    system_text = _load_prompt()
    visitor_name = st.get("username", "")
    if visitor_name:
        system_text += f"\n\nVISITOR NAME: The visitor's name is {visitor_name}. Use it naturally once or twice — at a warm moment, not in every message."
    if st["reluctance_count"] >= 2:
        system_text += _RELUCTANCE_DIRECTIVE

    lm_messages = [SystemMessage(content=system_text)]
    for m in st["messages"]:
        cls = HumanMessage if m["role"] == "user" else AIMessage
        lm_messages.append(cls(content=m["content"]))

    llm      = ChatOpenAI(model="gpt-4o-mini", temperature=0.4)
    response = llm.invoke(lm_messages)
    raw      = response.content.strip()

    # ── Parse markers ─────────────────────────────────────────────────────────
    is_end  = "<<END>>" in raw

    # Capture question text following <<Q>> or <<CLOSING_Q>>
    q_match = re.search(r"<<(?:CLOSING_)?Q>>(.*?)(?:\n|$)", raw, re.DOTALL)
    if q_match:
        new_q = q_match.group(1).strip()
        # If a question is already pending (follow-up within same exchange)
        if st.get("pending_main_q"):
            st["pending_follow_ups"].append(new_q)
        else:
            st["pending_main_q"] = new_q

    # Strip markers for display
    display = re.sub(r"<<(?:CLOSING_)?Q>>", "", raw)
    display = display.replace("<<END>>", "").strip()

    # Persist assistant message and add to feedback context window
    save_message(thread_id, "assistant", display)
    st["messages"].append({"role": "assistant", "content": display})

    # ── End-of-conversation flush ─────────────────────────────────────────────
    if is_end:
        _deactivate(thread_id)
        _flush_to_supabase(thread_id)

    return display


def _flush_to_supabase(thread_id: str) -> None:
    """Write buffered exchanges from SQLite to Supabase session_feedback."""
    try:
        from backend.analysis.supabase_store import save_feedback_entries_v2
        exchanges = get_unflushed_exchanges(thread_id)
        if exchanges:
            save_feedback_entries_v2(thread_id, exchanges)
            mark_exchanges_flushed(thread_id)
    except Exception:
        pass  # non-fatal — session-expiry parse will retry via flush_feedback_to_supabase()


def flush_feedback_to_supabase(thread_id: str) -> None:
    """Public entry point called by parse_session() at session expiry."""
    _flush_to_supabase(thread_id)
