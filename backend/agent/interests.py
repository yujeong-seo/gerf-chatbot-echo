"""User interest storage, retrieval, and agent context injection.

Interests are stored per thread_id in rag/gerf_sessions.db.
They are injected as a context prefix into user queries before the agent
processes them — no extra round-trip required.
"""
import json
import sqlite3
from pathlib import Path

from langchain_core.tools import tool

_DB_FILE = Path(__file__).parent.parent.parent / "rag" / "gerf_sessions.db"

# Canonical interest labels — must match frontend INTEREST_OPTIONS ids
INTEREST_LABELS: dict[str, str] = {
    "art":         "Art & Design",
    "science":     "Science",
    "music":       "Music & Performance",
    "family":      "Family & Kids",
    "food":        "Food & Drink",
    "talks":       "Talks & Debates",
    "engineering": "Engineering",
    "environment": "Environment",
    "culture":     "Culture & History",
    "outdoor":     "Outdoor",
}

# Keyword hints used in semantic SQL searches when an interest is active
INTEREST_KEYWORDS: dict[str, list[str]] = {
    "art":         ["art", "design", "creative", "paint", "draw", "craft", "visual"],
    "science":     ["science", "research", "experiment", "discover", "lab", "biology", "physics"],
    "music":       ["music", "performance", "concert", "dance", "stage", "show", "sing"],
    "family":      ["family", "children", "kids", "child", "junior", "young", "toddler"],
    "food":        ["food", "drink", "eat", "cook", "taste", "nutrition", "chef"],
    "talks":       ["talk", "debate", "discuss", "lecture", "panel", "seminar", "tour"],
    "engineering": ["engineer", "robot", "build", "tech", "machine", "construct", "fabricate"],
    "environment": ["environment", "nature", "ecology", "climate", "wildlife", "green", "planet"],
    "culture":     ["culture", "history", "heritage", "society", "community", "social"],
    "outdoor":     ["outdoor", "garden", "park", "outside", "open-air", "nature", "walk"],
}


# ── Database helpers ─────────────────────────────────────────────────────────

def _conn() -> sqlite3.Connection:
    conn = sqlite3.connect(str(_DB_FILE))
    conn.executescript("""
        CREATE TABLE IF NOT EXISTS user_interests (
            thread_id    TEXT NOT NULL,
            interest_id  TEXT NOT NULL,
            label        TEXT NOT NULL,
            created_at   TEXT DEFAULT (datetime('now')),
            PRIMARY KEY  (thread_id, interest_id)
        );
        CREATE TABLE IF NOT EXISTS conversation_history (
            id         INTEGER PRIMARY KEY AUTOINCREMENT,
            thread_id  TEXT    NOT NULL,
            role       TEXT    NOT NULL,
            content    TEXT    NOT NULL,
            created_at TEXT    DEFAULT (datetime('now'))
        );
        CREATE TABLE IF NOT EXISTS feedback_exchanges (
            id              INTEGER PRIMARY KEY AUTOINCREMENT,
            thread_id       TEXT    NOT NULL,
            sequence        INTEGER NOT NULL DEFAULT 0,
            feedback_stage  TEXT,
            main_question   TEXT,
            follow_ups      TEXT    DEFAULT '[]',
            response        TEXT,
            interaction_stage TEXT,
            flushed         INTEGER DEFAULT 0,
            created_at      TEXT    DEFAULT (datetime('now'))
        );
        CREATE TABLE IF NOT EXISTS test_session_meta (
            thread_id  TEXT PRIMARY KEY,
            username   TEXT NOT NULL DEFAULT '',
            droppoint  TEXT,
            created_at TEXT DEFAULT (datetime('now'))
        );
    """)
    conn.commit()
    # Migrate existing DBs: add droppoint column if absent
    try:
        conn.execute("ALTER TABLE test_session_meta ADD COLUMN droppoint TEXT")
        conn.commit()
    except Exception:
        pass
    return conn


def save_interests(thread_id: str, interest_ids: list[str]) -> None:
    """Replace all saved interests for the given thread_id."""
    conn = _conn()
    conn.execute("DELETE FROM user_interests WHERE thread_id = ?", (thread_id,))
    conn.executemany(
        "INSERT INTO user_interests (thread_id, interest_id, label) VALUES (?, ?, ?)",
        [
            (thread_id, iid, INTEREST_LABELS.get(iid, iid))
            for iid in interest_ids
            if iid in INTEREST_LABELS
        ],
    )
    conn.commit()
    conn.close()


def load_interests(thread_id: str) -> list[str]:
    """Return saved interest labels for thread_id, ordered by creation time."""
    if not _DB_FILE.exists():
        return []
    conn = _conn()
    rows = conn.execute(
        "SELECT label FROM user_interests WHERE thread_id = ? ORDER BY created_at",
        (thread_id,),
    ).fetchall()
    conn.close()
    return [r[0] for r in rows]


def build_interests_context(thread_id: str) -> str:
    """Return a bracketed context prefix for the agent, or empty string if none saved.

    Example: "[User interests: Science, Engineering, Family & Kids] "
    """
    labels = load_interests(thread_id)
    if not labels:
        return ""
    return f"[User interests: {', '.join(labels)}] "


# ── Conversation history ─────────────────────────────────────────────────────

def save_message(thread_id: str, role: str, content: str) -> None:
    """Append a message to the conversation history for this thread."""
    conn = _conn()
    conn.execute(
        "INSERT INTO conversation_history (thread_id, role, content) VALUES (?, ?, ?)",
        (thread_id, role, content[:1500]),
    )
    conn.commit()
    conn.close()


def load_history(thread_id: str, max_turns: int = 4) -> list[dict]:
    """Return the last max_turns exchanges (user+assistant pairs), oldest first."""
    if not _DB_FILE.exists():
        return []
    conn = _conn()
    rows = conn.execute(
        "SELECT role, content FROM conversation_history "
        "WHERE thread_id = ? ORDER BY id DESC LIMIT ?",
        (thread_id, max_turns * 2),
    ).fetchall()
    conn.close()
    return [{"role": r[0], "content": r[1]} for r in reversed(rows)]


def format_history_context(history: list[dict]) -> str:
    """Format history as a readable context block to prepend to the agent input."""
    if not history:
        return ""
    lines = ["[Conversation so far:]"]
    for msg in history:
        role    = "User" if msg["role"] == "user" else "ECHO"
        content = msg["content"]
        if len(content) > 400:
            content = content[:400] + "..."
        lines.append(f"{role}: {content}")
    lines.append("[End of history]")
    return "\n".join(lines) + "\n\n"


# ── Feedback exchange helpers ─────────────────────────────────────────────────

def save_feedback_exchange(
    thread_id: str,
    sequence: int,
    stage: str,
    main_question: str,
    follow_ups: list[str],
    response: str,
    interaction_stage: str | None = None,
) -> None:
    """Buffer one feedback exchange pair in SQLite before flushing to Supabase."""
    conn = _conn()
    conn.execute(
        """INSERT INTO feedback_exchanges
           (thread_id, sequence, feedback_stage, main_question, follow_ups, response, interaction_stage)
           VALUES (?, ?, ?, ?, ?, ?, ?)""",
        (thread_id, sequence, stage, main_question, json.dumps(follow_ups), response, interaction_stage),
    )
    conn.commit()
    conn.close()


def get_unflushed_exchanges(thread_id: str) -> list[dict]:
    """Return buffered feedback exchanges not yet written to Supabase."""
    if not _DB_FILE.exists():
        return []
    conn = _conn()
    rows = conn.execute(
        """SELECT id, sequence, feedback_stage, main_question, follow_ups, response,
                  interaction_stage, created_at
           FROM feedback_exchanges
           WHERE thread_id = ? AND flushed = 0
           ORDER BY sequence""",
        (thread_id,),
    ).fetchall()
    conn.close()
    return [
        {
            "id":               r[0],
            "sequence":         r[1],
            "feedback_stage":   r[2],
            "main_question":    r[3],
            "follow_ups":       json.loads(r[4] or "[]"),
            "response":         r[5],
            "interaction_stage": r[6],
            "created_at":       r[7],
        }
        for r in rows
    ]


def mark_exchanges_flushed(thread_id: str) -> None:
    """Mark all exchanges for this thread as written to Supabase."""
    conn = _conn()
    conn.execute("UPDATE feedback_exchanges SET flushed = 1 WHERE thread_id = ?", (thread_id,))
    conn.commit()
    conn.close()


# ── LangChain tool (optional — context is usually injected via prefix) ────────

@tool
def get_user_interests_tool(thread_id: str) -> str:
    """Look up the saved interests for a user session.
    Use to personalise recommendations when you need to know what the user cares about.
    Input: the thread_id for the current conversation.
    """
    labels = load_interests(thread_id)
    if not labels:
        return "No interests saved for this session."
    return f"User interests: {', '.join(labels)}"
