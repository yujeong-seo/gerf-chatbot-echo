"""Tool: build Google Calendar URL and ICS content for a GERF event."""
import os
import sqlite3
import urllib.parse
from pathlib import Path

from langchain_core.tools import tool

_DB_FILE = Path(__file__).parent.parent.parent / "rag" / "gerf_2026.db"

# Maps the events.dates column value to ISO date strings
_DATE_MAP: dict[str, str] = {
    "Saturday": "2026-06-06",
    "Sunday":   "2026-06-07",
    "Both":     "2026-06-06",   # start; end = 2026-06-07
    "Friday":   "2026-06-05",
}


def _parse_times(time_str: str, start_date: str, end_date: str) -> tuple[str, str]:
    """Parse 'HH:MM–HH:MM' into (dtstart, dtend) in YYYYMMDDTHHMMSS format.

    For multi-day events (start_date != end_date), dtend uses end_date.
    Falls back to 10:00–18:00 if the time string cannot be parsed.
    """
    d_start = start_date.replace("-", "")
    d_end   = end_date.replace("-", "")

    try:
        # Handle en-dash (–) and regular hyphen
        normalized = time_str.replace("–", "-").replace("—", "-")
        parts = [p.strip() for p in normalized.split("-")]
        t_start = parts[0].replace(":", "").zfill(4)   # "1200"
        t_end   = parts[1].replace(":", "").zfill(4) if len(parts) > 1 else "1800"
        return f"{d_start}T{t_start}00", f"{d_end}T{t_end}00"
    except Exception:
        return f"{d_start}T100000", f"{d_end}T180000"


def _ics_text(value: str) -> str:
    """Escape special characters for ICS text fields."""
    return (
        value
        .replace("\\", "\\\\")
        .replace(";",  "\\;")
        .replace(",",  "\\,")
        .replace("\n", "\\n")
    )


def create_calendar_data(event_id: str) -> dict | None:
    """Query the DB and build all calendar data for the given event_id.

    Returns a dict with keys:
        title, date_label, time_label, venue, address, description,
        event_url, gcal_url, ics_text
    Returns None if event_id is not found.
    """
    conn = sqlite3.connect(str(_DB_FILE))
    conn.row_factory = sqlite3.Row
    cur = conn.cursor()
    cur.execute(
        "SELECT title, venue_name, venue_address, dates, time, "
        "short_description, event_url "
        "FROM events WHERE event_id = ?",
        (event_id,),
    )
    row = cur.fetchone()
    conn.close()

    if not row:
        return None

    title       = row["title"]             or ""
    venue_name  = row["venue_name"]        or ""
    address     = row["venue_address"]     or venue_name
    dates_val   = row["dates"]             or "Saturday"
    time_val    = row["time"]              or "10:00–18:00"
    description = row["short_description"] or ""
    event_url   = row["event_url"]         or "https://www.greatexhibitionroadfestival.co.uk/"

    start_date = _DATE_MAP.get(dates_val, "2026-06-06")
    end_date   = "2026-06-07" if dates_val == "Both" else start_date

    dtstart, dtend = _parse_times(time_val, start_date, end_date)

    # ── Google Calendar URL ──────────────────────────────────────────────
    gcal_params = urllib.parse.urlencode({
        "action":   "TEMPLATE",
        "text":     title,
        "dates":    f"{dtstart}/{dtend}",
        "details":  f"{description}\n\n{event_url}",
        "location": address,
    })
    gcal_url = f"https://calendar.google.com/calendar/render?{gcal_params}"

    # ── ICS content ──────────────────────────────────────────────────────
    ics_body = "\r\n".join([
        "BEGIN:VCALENDAR",
        "VERSION:2.0",
        "PRODID:-//GERF 2026 ECHO//EN",
        "BEGIN:VEVENT",
        f"DTSTART;TZID=Europe/London:{dtstart}",
        f"DTEND;TZID=Europe/London:{dtend}",
        f"SUMMARY:{_ics_text(title)}",
        f"DESCRIPTION:{_ics_text(description + chr(10) + event_url)}",
        f"LOCATION:{_ics_text(address)}",
        f"URL:{event_url}",
        "END:VEVENT",
        "END:VCALENDAR",
    ])

    return {
        "title":       title,
        "date_label":  dates_val,
        "time_label":  time_val,
        "venue":       venue_name,
        "address":     address,
        "description": description,
        "event_url":   event_url,
        "gcal_url":    gcal_url,
        "ics_text":    ics_body,
    }


@tool
def create_calendar_event(event_id: str) -> str:
    """Create a calendar entry for a GERF event.

    Call this when the user confirms they want to add an event to their calendar.
    Requires the event_id from the events table (the slug, not the title).
    Returns a confirmation string. The calendar UI card is delivered automatically
    via the calendar_event_id sidecar field — do NOT include any URLs in your response.
    """
    data = create_calendar_data(event_id)
    if not data:
        return f"ERROR: No event found with id '{event_id}'. Check the event_id from search results."

    return (
        f"Calendar entry ready for: {data['title']} "
        f"({data['date_label']}, {data['time_label']}, {data['venue']}). "
        f"NOW output calendar_event_id: \"{event_id}\" in your JSON sidecar. "
        f"Do NOT include any URLs in the response field."
    )
