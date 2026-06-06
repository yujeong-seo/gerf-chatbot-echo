"""Tools: Google Maps URL and official event page URL.

Both tools accept either an exact event_id slug (e.g. "family-stage-2026")
or the event title (e.g. "Family Stage").  Resolution order:
  1. Exact match on event_id column
  2. Case-insensitive LIKE match on title column (shortest match wins)
"""
import sqlite3
import urllib.parse
from pathlib import Path

from langchain_core.tools import tool

_DB_FILE = Path(__file__).parent.parent.parent / "rag" / "gerf_2026.db"

_COLS = "event_id, title, lat, lng, venue_name, venue_address, event_url"


def _find_event(query: str) -> dict | None:
    """Resolve event by event_id (exact) then title (LIKE), return dict or None."""
    conn = sqlite3.connect(str(_DB_FILE))
    conn.row_factory = sqlite3.Row

    # 1. Exact event_id match
    row = conn.execute(
        f"SELECT {_COLS} FROM events WHERE event_id = ?",
        (query,),
    ).fetchone()

    # 2. Title substring match — prefer the shortest (most precise) result
    if not row:
        row = conn.execute(
            f"SELECT {_COLS} FROM events WHERE title LIKE ? ORDER BY LENGTH(title) LIMIT 1",
            (f"%{query}%",),
        ).fetchone()

    conn.close()
    return dict(row) if row else None


# ── Public helpers (called by api.py for inline card data) ───────────────────

def get_maps_url(query: str) -> str | None:
    """Return a Google Maps URL for the event, or None if not found."""
    row = _find_event(query)
    if not row:
        return None
    if row["lat"] and row["lng"]:
        return f"https://maps.google.com/?q={row['lat']},{row['lng']}"
    if row["venue_address"]:
        return f"https://maps.google.com/?q={urllib.parse.quote_plus(row['venue_address'])}"
    return None


def get_event_url(query: str) -> str | None:
    """Return the official festival website URL for the event, or None."""
    row = _find_event(query)
    if not row:
        return None
    return row["event_url"] or None


# ── LangChain tools ──────────────────────────────────────────────────────────

@tool
def maps_url_tool(query: str) -> str:
    """Get directions to a GERF event location.

    Input: the exact event title or event_id (e.g. "Family Stage" or
    "family-stage-2026"). Use when the user asks how to find, navigate
    to, or get directions to a specific event.

    IMPORTANT: this tool does NOT return a URL. After calling it, include
    maps_event_id in your JSON sidecar — the frontend renders the map card.
    Never put any URL or link in the response field.
    """
    row = _find_event(query)
    if not row:
        return f"No location data found for '{query}'."

    has_map = bool((row["lat"] and row["lng"]) or row["venue_address"])
    if not has_map:
        return f"No map coordinates available for '{row['title']}'."

    venue = row["venue_name"] or row["venue_address"] or row["title"]
    return (
        f"Map ready for {row['title']} at {venue}. "
        f"Add to your JSON: \"maps_event_id\": \"{row['event_id']}\". "
        "Do NOT include any URL or link in the response field."
    )


@tool
def event_url_tool(query: str) -> str:
    """Get the official festival page for a GERF event.

    Input: the exact event title or event_id (e.g. "Science Cabaret" or
    "science-cabaret-2026"). Use when the user wants full event details
    or to access the official event page.

    IMPORTANT: this tool does NOT return a URL. After calling it, include
    detail_event_id in your JSON sidecar — the frontend renders the link.
    Never put any URL or link in the response field.
    """
    row = _find_event(query)
    if not row:
        return f"No event page found for '{query}'."

    if not row["event_url"]:
        return f"No event page available for '{row['title']}'."

    return (
        f"Event page ready for {row['title']}. "
        f"Add to your JSON: \"detail_event_id\": \"{row['event_id']}\". "
        "Do NOT include any URL or link in the response field."
    )


@tool
def get_event_by_id(event_id: str) -> str:
    """Retrieve full details for a specific GERF 2026 event by its exact event_id.

    Use this tool when the user's message contains an explicit event_id (e.g.
    'event_id:family-stage-2026'). Always prefer this over search_events when
    an event_id is provided — it guarantees the correct event is returned.
    Input: the exact event_id slug (e.g. "family-stage-2026").
    """
    conn = sqlite3.connect(str(_DB_FILE))
    conn.row_factory = sqlite3.Row
    row = conn.execute(
        "SELECT title, venue_name, time, short_description, "
        "experience_type, registration_type, booking_url "
        "FROM events WHERE event_id = ? LIMIT 1",
        (event_id,),
    ).fetchone()
    conn.close()
    if not row:
        return f"No event found with event_id '{event_id}'."
    parts = [f"**{row['title']}**"]
    if row["venue_name"]:        parts.append(f"Venue: {row['venue_name']}")
    if row["time"]:              parts.append(f"Time: {row['time']}")
    if row["short_description"]: parts.append(row["short_description"])
    if row["experience_type"]:   parts.append(f"Type: {row['experience_type']}")
    if row["registration_type"]: parts.append(f"Booking: {row['registration_type']}")
    return "\n".join(parts)
