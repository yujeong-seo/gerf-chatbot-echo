"""Post-session parsing pipeline.

Entry point: parse_session(thread_id)

Call this after a session expires (1-hour inactivity).
Deciding WHEN to call it is api.py's responsibility — not implemented here.

Pipeline:
  1. Load full conversation history from SQLite (rag/gerf_sessions.db)
  2. Score message-level sentiment (keyword-based, no API call)
  3. LLM-extract structured insights → session_profile, interactions, feedback
  4. Enrich event_zone using SQLite events+zones lookup (overrides LLM guess)
  5. Save all three to Supabase
  6. Delete temporary SQLite logs  ← only runs after successful Supabase write
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

_DB_FILE    = Path(__file__).parent.parent.parent / "rag" / "gerf_sessions.db"
_EVENTS_DB  = Path(__file__).parent.parent.parent / "rag" / "gerf_2026.db"


def _enrich_with_zones(interactions: list[dict]) -> list[dict]:
    """Override event_zone with the DB-sourced zone for each interaction that has
    an event_or_activity name. Performs a LIKE lookup against the events+zones
    tables so zone assignment is always grounded in the actual festival data."""
    if not _EVENTS_DB.exists():
        return interactions
    conn = sqlite3.connect(str(_EVENTS_DB))
    conn.row_factory = sqlite3.Row
    for ia in interactions:
        activity = ia.get("event_or_activity")
        if activity:
            row = conn.execute(
                "SELECT z.title FROM events e "
                "JOIN zones z ON e.zone_id = z.zone_id "
                "WHERE lower(e.title) LIKE lower(?) LIMIT 1",
                (f"%{activity}%",),
            ).fetchone()
            if row:
                ia["event_zone"] = row["title"]
    conn.close()
    return interactions


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
    conn.commit()
    conn.close()


def _load_test_meta(thread_id: str) -> dict | None:
    """Return test session metadata if this is a test session, else None."""
    conn = sqlite3.connect(str(_DB_FILE))
    row = conn.execute(
        "SELECT username, droppoint FROM test_session_meta WHERE thread_id = ?", (thread_id,)
    ).fetchone()
    conn.close()
    if row is None:
        return None
    return {
        "username":  row[0],
        "droppoint": row[1] or "overview",
    }


def parse_session(thread_id: str) -> dict:
    """Parse and archive a completed session.

    Args:
        thread_id: The session identifier (matches frontend thread_id).

    Returns one of:
        {"status": "parsed",  "thread_id": ..., "message_count": ..., ...}
        {"status": "empty",   "thread_id": ...}
        {"status": "error",   "thread_id": ..., "detail": ...}

    SQLite logs are deleted only after a successful Supabase write.
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
    interactions    = _enrich_with_zones(parsed.get("interactions", []))
    feedback        = parsed.get("feedback_entries", [])

    try:
        if test_meta is not None:
            save_test_session_profile(
                thread_id, session_profile, sentiment, started_at, last_at,
                username=test_meta["username"],
                turn_count=len(user_messages),
                droppoint=test_meta["droppoint"],
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

    return {
        "status":             "parsed",
        "thread_id":          thread_id,
        "message_count":      len(messages),
        "sentiment":          sentiment,
        "interactions_saved": len(interactions),
        "feedback_saved":     len(feedback),
    }
