"""Tool: current London date/time with festival-day context."""
from datetime import datetime
from zoneinfo import ZoneInfo

from langchain_core.tools import tool

_TZ = ZoneInfo("Europe/London")

# Festival window (inclusive)
_FESTIVAL_START = datetime(2026, 6, 6,  0,  0, tzinfo=_TZ)
_FESTIVAL_END   = datetime(2026, 6, 7, 22,  0, tzinfo=_TZ)


def get_current_datetime() -> str:
    """Return the current London date/time as a standardised string.

    Format: "Saturday, 6 June 2026 · 14:32 BST  (Festival Day 1 of 2)"
    """
    now = datetime.now(_TZ)
    day_str  = now.strftime("%A, %-d %B %Y")
    time_str = now.strftime("%H:%M %Z")

    if _FESTIVAL_START <= now <= _FESTIVAL_END:
        day_num = 1 if now.date() == _FESTIVAL_START.date() else 2
        context = f"Festival Day {day_num} of 2"
    elif now < _FESTIVAL_START:
        days_left = (_FESTIVAL_START.date() - now.date()).days
        context   = f"{days_left} day{'s' if days_left != 1 else ''} until the festival"
    else:
        context = "Festival has ended"

    return f"{day_str} · {time_str}  ({context})"


@tool
def current_datetime_tool() -> str:
    """Get the current date and time in London with festival context.
    Use when the user asks what time it is, what day it is, what is happening
    right now, or how many days until the festival.
    """
    return get_current_datetime()
