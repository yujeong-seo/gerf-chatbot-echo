"""Post-session parsing pipeline.

Entry point: parse_session(thread_id)

Call this after a session expires (1-hour inactivity).
Deciding WHEN to call it is api.py's responsibility — not implemented here.

Pipeline:
  1. Load full conversation history from SQLite (rag/gerf_sessions.db)
  2. Score message-level sentiment (keyword-based, no API call)
  3. LLM-extract structured insights → session_profile, interactions, feedback
  4. Save all three to Supabase
  5. Delete temporary SQLite logs  ← only runs after successful Supabase write
  6. Optionally write CRM record to Airtable (requires explicit consent)
"""
import sqlite3
from pathlib import Path

from .insights       import extract_session_insights
from .sentiment      import score_session
from .supabase_store import (
    save_session_profile,
    save_event_interactions,
    save_feedback_entries,
    save_test_session_profile,
)
from ..data.airtable import write_crm_registration

_DB_FILE = Path(__file__).parent.parent.parent / "rag" / "gerf_sessions.db"


def _load_full_history(thread_id: str) -> tuple[list[dict], str | None, str | None]:
    """Load every message for a thread, ordered oldest-first.

    Returns (messages, started_at, last_at).
    started_at / last_at are ISO strings from the SQLite created_at column.
    """
    if not _DB_FILE.exists():
        return [], None, None
    conn = sqlite3.connect(str(_DB_FILE))
    rows = conn.execute(
        "SELECT role, content, created_at FROM conversation_history "
        "WHERE thread_id = ? ORDER BY id ASC",
        (thread_id,),
    ).fetchall()
    conn.close()
    messages   = [{"role": r[0], "content": r[1]} for r in rows]
    started_at = rows[0][2]  if rows else None
    last_at    = rows[-1][2] if rows else None
    return messages, started_at, last_at


def _delete_session_logs(thread_id: str) -> None:
    """Remove conversation history and interests for this thread from SQLite."""
    conn = sqlite3.connect(str(_DB_FILE))
    conn.execute("DELETE FROM conversation_history WHERE thread_id = ?", (thread_id,))
    conn.execute("DELETE FROM user_interests       WHERE thread_id = ?", (thread_id,))
    conn.execute("DELETE FROM test_session_meta    WHERE thread_id = ?", (thread_id,))
    conn.execute("DELETE FROM session_tools        WHERE thread_id = ?", (thread_id,))
    conn.commit()
    conn.close()


def _load_test_meta(thread_id: str) -> dict | None:
    """Return test session metadata if this is a test session, else None."""
    conn = sqlite3.connect(str(_DB_FILE))
    row = conn.execute(
        "SELECT username FROM test_session_meta WHERE thread_id = ?", (thread_id,)
    ).fetchone()
    tool_rows = conn.execute(
        "SELECT tool_name, tool_input FROM session_tools WHERE thread_id = ? ORDER BY id",
        (thread_id,),
    ).fetchall()
    conn.close()
    if row is None:
        return None
    return {
        "username":   row[0],
        "tool_calls": [{"tool": r[0], "input": r[1]} for r in tool_rows],
    }


def parse_session(thread_id: str, crm_data: dict | None = None) -> dict:
    """Parse and archive a completed session.

    Args:
        thread_id: The session identifier (matches frontend thread_id).
        crm_data:  Optional dict for Airtable CRM write. Required keys:
                     name, email, consent_given (bool), consent_timestamp,
                     interest_tags (list[str]), preferred_topics (list[str])
                   Only written if consent_given is True.

    Returns one of:
        {"status": "parsed",  "thread_id": ..., "message_count": ..., ...}
        {"status": "empty",   "thread_id": ...}
        {"status": "error",   "thread_id": ..., "detail": ...}

    SQLite logs are deleted only after a successful Supabase write.
    A CRM failure does not roll back the analytics write.
    """
    messages, started_at, last_at = _load_full_history(thread_id)

    if not messages:
        return {"status": "empty", "thread_id": thread_id}

    user_messages = [m["content"] for m in messages if m["role"] == "user"]
    sentiment     = score_session(user_messages)
    test_meta     = _load_test_meta(thread_id)

    try:
        parsed = extract_session_insights(thread_id, messages)
    except Exception as e:
        return {"status": "error", "thread_id": thread_id, "detail": str(e)}

    session_profile = parsed.get("session_profile", {})
    interactions    = parsed.get("interactions", [])
    feedback        = parsed.get("feedback_entries", [])

    try:
        if test_meta is not None:
            save_test_session_profile(
                thread_id, session_profile, sentiment, started_at, last_at,
                username=test_meta["username"],
                turn_count=len(user_messages),
                tool_calls=test_meta["tool_calls"],
            )
        else:
            save_session_profile(thread_id, session_profile, sentiment, started_at, last_at)
        save_event_interactions(thread_id, interactions)
        save_feedback_entries(thread_id, feedback)
    except Exception as e:
        return {
            "status": "error",
            "thread_id": thread_id,
            "detail": f"Supabase write failed: {e}",
        }

    _delete_session_logs(thread_id)

    if crm_data and crm_data.get("consent_given"):
        try:
            write_crm_registration(crm_data)
        except Exception:
            pass  # CRM failure is non-fatal; analytics already saved

    return {
        "status":             "parsed",
        "thread_id":          thread_id,
        "message_count":      len(messages),
        "sentiment":          sentiment,
        "interactions_saved": len(interactions),
        "feedback_saved":     len(feedback),
    }
