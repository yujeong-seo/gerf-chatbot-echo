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
    """Get a Google Maps link for a GERF event's location.

    Input: the exact event title or event_id (e.g. "Family Stage" or
    "family-stage-2026"). Use when the user asks how to find, navigate
    to, or get directions to a specific event.
    """
    row = _find_event(query)
    if not row:
        return f"No location data found for '{query}'."

    if row["lat"] and row["lng"]:
        url = f"https://maps.google.com/?q={row['lat']},{row['lng']}"
    elif row["venue_address"]:
        url = f"https://maps.google.com/?q={urllib.parse.quote_plus(row['venue_address'])}"
    else:
        return f"No coordinates or address available for '{row['title']}'."

    venue = row["venue_name"] or row["venue_address"] or row["title"]
    return f"[Get directions to {row['title']} ({venue})]({url})"


@tool
def event_url_tool(query: str) -> str:
    """Get the official Great Exhibition Road Festival page for a GERF event.

    Input: the exact event title or event_id (e.g. "Science Cabaret" or
    "science-cabaret-2026"). Use when the user wants full details, photos,
    or to book tickets.
    """
    row = _find_event(query)
    if not row:
        return f"No website URL found for '{query}'."

    url = row["event_url"]
    if not url:
        return f"No website URL available for '{row['title']}'."

    return f"[View {row['title']} on the festival website]({url})"
