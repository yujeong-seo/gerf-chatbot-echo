import asyncio
import json
import os
import sqlite3
from contextlib import asynccontextmanager
from pathlib import Path

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import Response
from pydantic import BaseModel

from backend.agent import run_agent
from backend.agent.feedbackagent import is_feedback_trigger, run_feedback_agent
from backend.agent.interests import save_interests
from backend.agent.calendar_tool import create_calendar_data
from backend.agent.location_tool import get_maps_url, get_event_url

_SESSIONS_DB = Path(__file__).parent / "rag" / "gerf_sessions.db"
_EVENTS_DB   = Path(__file__).parent / "rag" / "gerf_2026.db"
_SESSION_TIMEOUT_MINUTES = 20
_CHECK_INTERVAL_SECONDS  = 120


def _find_expired_sessions() -> list[str]:
    if not _SESSIONS_DB.exists():
        return []
    conn = sqlite3.connect(str(_SESSIONS_DB))
    rows = conn.execute(
        """
        SELECT thread_id
        FROM   conversation_history
        GROUP  BY thread_id
        HAVING MAX(created_at) < datetime('now', ? || ' minutes')
        """,
        (f"-{_SESSION_TIMEOUT_MINUTES}",),
    ).fetchall()
    conn.close()
    return [r[0] for r in rows]


async def _session_expiry_loop() -> None:
    while True:
        await asyncio.sleep(_CHECK_INTERVAL_SECONDS)
        expired = _find_expired_sessions()
        if expired:
            from backend.analysis import parse_session
            from backend.agent.feedbackagent import flush_feedback_to_supabase
            for thread_id in expired:
                flush_feedback_to_supabase(thread_id)
                parse_session(thread_id)


async def _trending_refresh_loop() -> None:
    """Refresh the trending cache at every XX:00 and XX:30 UTC, regardless of traffic."""
    while True:
        now    = _dt.now(_tz.utc)
        minute = now.minute
        second = now.second
        # Next :30 if before it, else next :00 (top of hour)
        wait   = ((30 - minute) * 60 - second) if minute < 30 else ((60 - minute) * 60 - second)
        await asyncio.sleep(wait)
        loop   = asyncio.get_event_loop()
        result = await loop.run_in_executor(None, _compute_trending)
        _set_mem_cache(result)
        _set_trending_cache_sb(result["popular_now"], result["insights"], result["live"])


def _prewarm_trending() -> None:
    """Populate in-memory + Supabase cache on startup so first request is fast."""
    cached = _get_trending_cache_sb()
    if cached:
        _set_mem_cache(cached)
        return
    result = _compute_trending()
    _set_mem_cache(result)
    _set_trending_cache_sb(result["popular_now"], result["insights"], result["live"])


@asynccontextmanager
async def lifespan(app: FastAPI):
    loop = asyncio.get_event_loop()
    loop.run_in_executor(None, _prewarm_trending)
    expiry_task = asyncio.create_task(_session_expiry_loop())
    # trending_task = asyncio.create_task(_trending_refresh_loop())  # paused — re-enable when live
    yield
    expiry_task.cancel()
    # trending_task.cancel()


app = FastAPI(title="GERF Agent API", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)


# ---------------------------------------------------------------------------
# Models
# ---------------------------------------------------------------------------

class ChatRequest(BaseModel):
    message:            str
    thread_id:          str  = ""
    feedback_trigger:   bool = False
    visit_type:         str  = ""
    username:           str  = ""
    interests_prompted: bool = False


class CalendarCard(BaseModel):
    gcal_url:   str
    ics_url:    str
    title:      str
    location:   str | None = None
    date_label: str | None = None
    time_label: str | None = None


class BookingCard(BaseModel):
    url:           str
    title:         str
    subtitle:      str
    is_free:       bool
    arrival_notes: str | None = None


class ChatResponse(BaseModel):
    content:           str
    keywords:          list[str] = []
    calendar:          CalendarCard | None = None
    location_url:      str | None = None
    location_name:     str | None = None
    location_venue:    str | None = None
    event_url:         str | None = None
    event_name:        str | None = None
    booking:           BookingCard | None = None
    is_feedback:       bool = False
    suggest_interests: bool = False


class PreferencesRequest(BaseModel):
    thread_id:    str
    interest_ids: list[str]


class ParseSessionRequest(BaseModel):
    thread_id: str


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

_TOOL_DROPPOINT: dict[str, str] = {
    "search_events":         "overview",
    "maps_url_tool":         "location",
    "event_url_tool":        "detail",
    "create_calendar_event": "calendar",
    "gerf_faq":              "faq",
    "current_datetime_tool": "schedule",
}
_INTERNAL_TOOLS = {"get_user_interests_tool"}


def _derive_droppoint(tool_calls: list[dict]) -> str:
    for tc in reversed(tool_calls):
        name = tc.get("tool", "")
        if name in _INTERNAL_TOOLS:
            continue
        return _TOOL_DROPPOINT.get(name, "overview")
    return "overview"


def _upsert_test_meta(thread_id: str, username: str, droppoint: str) -> None:
    conn = sqlite3.connect(str(_SESSIONS_DB))
    conn.execute(
        "INSERT INTO test_session_meta (thread_id, username, droppoint) VALUES (?, ?, ?) "
        "ON CONFLICT(thread_id) DO UPDATE SET username=excluded.username, droppoint=excluded.droppoint",
        (thread_id, username, droppoint),
    )
    conn.commit()
    conn.close()


def _get_event_title(event_id: str) -> str | None:
    if not _EVENTS_DB.exists():
        return None
    conn = sqlite3.connect(str(_EVENTS_DB))
    conn.row_factory = sqlite3.Row
    row = conn.execute("SELECT title FROM events WHERE event_id = ?", (event_id,)).fetchone()
    conn.close()
    return row["title"] if row else None


_GENERAL_BOOKING_URL = (
    "https://www.eventbrite.co.uk/e/"
    "great-exhibition-road-festival-2026-tickets-1985057931710?aff=oddtdtcreator"
)


def _get_booking_info(event_id: str) -> dict | None:
    if not _EVENTS_DB.exists():
        return None
    conn = sqlite3.connect(str(_EVENTS_DB))
    conn.row_factory = sqlite3.Row
    row = conn.execute(
        "SELECT title, booking_url, registration_type, arrival_notes "
        "FROM events WHERE event_id = ?",
        (event_id,),
    ).fetchone()
    conn.close()
    if not row or not row["booking_url"]:
        return None
    return dict(row)


def _build_inline(
    parsed: dict,
) -> tuple[CalendarCard | None, str | None, str | None, str | None, str | None, str | None, BookingCard | None]:
    """Extract calendar / location / event-url / booking inline data from parsed agent JSON.

    Returns (calendar, location_url, location_name, location_venue, event_url, event_name, booking).
    """
    api_base = os.getenv("API_BASE_URL", "http://localhost:8000").rstrip("/")

    # Calendar
    cal_event_id = parsed.get("calendar_event_id")
    if cal_event_id:
        data = create_calendar_data(str(cal_event_id))
        if data:
            return (
                CalendarCard(
                    gcal_url=data["gcal_url"],
                    ics_url=f"{api_base}/api/calendar/{cal_event_id}",
                    title=data["title"],
                    location=data.get("venue") or None,
                    date_label=data.get("date_label") or None,
                    time_label=data.get("time_label") or None,
                ),
                None, None, None, None, None, None,
            )

    # Ticket booking (event-specific)
    booking_event_id = parsed.get("booking_event_id")
    if booking_event_id:
        info = _get_booking_info(str(booking_event_id))
        if info:
            is_free = info["registration_type"] == "free-ticket"
            booking = BookingCard(
                url=info["booking_url"],
                title="Register for the event",
                subtitle=info["title"],
                is_free=is_free,
                arrival_notes=info["arrival_notes"] or None,
            )
            return None, None, None, None, None, None, booking

    # General ticket registration
    if parsed.get("general_booking"):
        booking = BookingCard(
            url=_GENERAL_BOOKING_URL,
            title="Register for the festival",
            subtitle="Great Exhibition Road Festival",
            is_free=True,
            arrival_notes=None,
        )
        return None, None, None, None, None, None, booking

    # Location map
    maps_event_id = parsed.get("maps_event_id")
    if maps_event_id:
        url    = get_maps_url(str(maps_event_id))
        title  = _get_event_title(str(maps_event_id))
        data   = create_calendar_data(str(maps_event_id))
        venue  = (data["venue"] if data else None) or None
        if url:
            return None, url, title or str(maps_event_id), venue, None, None, None

    # Event detail page
    detail_event_id = parsed.get("detail_event_id")
    if detail_event_id:
        url   = get_event_url(str(detail_event_id))
        title = _get_event_title(str(detail_event_id))
        if url:
            return None, None, None, None, url, title or str(detail_event_id), None

    return None, None, None, None, None, None, None


# ---------------------------------------------------------------------------
# Routes
# ---------------------------------------------------------------------------

@app.get("/health")
def health():
    return {"status": "ok"}


@app.post("/api/chat", response_model=ChatResponse)
def chat(req: ChatRequest):
    # ── Feedback agent routing ────────────────────────────────────────────────
    if is_feedback_trigger(req.thread_id, req.message, explicit=req.feedback_trigger):
        try:
            feedback_reply = run_feedback_agent(
                req.thread_id,
                req.message,
                interaction_stage=req.visit_type or None,
                username=req.username or "",
            )
        except Exception as exc:
            raise HTTPException(status_code=500, detail=str(exc))

        # None means off-topic exit — fall through to main agent below
        if feedback_reply is not None:
            if req.visit_type == "test" and req.thread_id:
                _upsert_test_meta(req.thread_id, req.username, "feedback")
            return ChatResponse(content=feedback_reply, is_feedback=True)

    # ── Main agent ────────────────────────────────────────────────────────────
    try:
        raw, tool_calls = run_agent(req.message, thread_id=req.thread_id, username=req.username or "", interests_prompted=req.interests_prompted)
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc))

    if req.visit_type == "test" and req.thread_id:
        _upsert_test_meta(req.thread_id, req.username, _derive_droppoint(tool_calls))

    try:
        parsed            = json.loads(raw)
        content           = str(parsed.get("response", raw))
        keywords          = [str(k) for k in parsed.get("keywords", []) if isinstance(k, str)]
        suggest_interests = bool(parsed.get("suggest_interests", False))
    except (json.JSONDecodeError, AttributeError, TypeError):
        content           = raw
        keywords          = []
        parsed            = {}
        suggest_interests = False

    calendar, location_url, location_name, location_venue, event_url, event_name, booking = _build_inline(parsed)

    # Fallback: if agent called create_calendar_event but didn't emit calendar_event_id in JSON,
    # recover the event_id directly from tool_calls so the UI card still appears.
    if calendar is None:
        for tc in tool_calls:
            if tc["tool"] == "create_calendar_event":
                fallback_id = tc["input"].strip().strip('"\'')
                fallback_data = create_calendar_data(fallback_id)
                if fallback_data:
                    api_base = os.getenv("API_BASE_URL", "http://localhost:8000").rstrip("/")
                    calendar = CalendarCard(
                        gcal_url=fallback_data["gcal_url"],
                        ics_url=f"{api_base}/api/calendar/{fallback_id}",
                        title=fallback_data["title"],
                        location=fallback_data.get("venue") or None,
                        date_label=fallback_data.get("date_label") or None,
                        time_label=fallback_data.get("time_label") or None,
                    )
                break

    return ChatResponse(
        content=content,
        keywords=keywords,
        calendar=calendar,
        location_url=location_url,
        location_name=location_name,
        location_venue=location_venue,
        event_url=event_url,
        event_name=event_name,
        booking=booking,
        suggest_interests=suggest_interests,
    )


@app.post("/api/preferences")
def update_preferences(req: PreferencesRequest):
    save_interests(req.thread_id, req.interest_ids)
    return {"status": "ok", "saved": len(req.interest_ids)}


@app.get("/api/calendar/{event_id}")
def calendar_ics(event_id: str):
    data = create_calendar_data(event_id)
    if not data:
        raise HTTPException(status_code=404, detail=f"Event '{event_id}' not found.")
    safe_name = event_id.replace("/", "-")
    return Response(
        content=data["ics_text"].encode("utf-8"),
        media_type="text/calendar",
        headers={"Content-Disposition": f'attachment; filename="{safe_name}.ics"'},
    )


# ── Trending cache (3-layer: memory → Supabase → recompute) ──────────────────

import time as _time
import re as _re
from collections import Counter as _Counter
from datetime import datetime as _dt, timezone as _tz
from zoneinfo import ZoneInfo as _ZoneInfo

_TRENDING_TTL = 3600  # 60 min — safety fallback; background loop refreshes at XX:00 and XX:30

# Layer 1: in-process memory cache (sub-ms, lost on restart)
_mem_cache: dict | None = None
_mem_cache_time: float = 0.0


def _get_mem_cache() -> dict | None:
    if _mem_cache is not None and (_time.time() - _mem_cache_time) < _TRENDING_TTL:
        return _mem_cache
    return None


def _set_mem_cache(data: dict) -> None:
    global _mem_cache, _mem_cache_time
    _mem_cache = data
    _mem_cache_time = _time.time()


# Layer 2: Supabase persistent cache (survives Railway restarts/redeploys)

def _get_trending_cache_sb() -> dict | None:
    try:
        from supabase import create_client
        sb = create_client(os.environ["SUPABASE_URL"], os.environ["SUPABASE_KEY"])
        rows = sb.table("trending_cache").select(
            "popular_now,insights,live,cached_at"
        ).order("cached_at", desc=True).limit(1).execute().data
        if not rows:
            return None
        row = rows[0]
        cached_at = _dt.fromisoformat(row["cached_at"].replace("Z", "+00:00"))
        age = (_dt.now(_tz.utc) - cached_at).total_seconds()
        if age < _TRENDING_TTL:
            return {
                "popular_now": row["popular_now"],
                "insights":    row["insights"],
                "live":        row.get("live"),
            }
    except Exception:
        pass
    return None


def _set_trending_cache_sb(popular_now: list, insights: list, live: dict | None) -> None:
    try:
        from supabase import create_client
        sb = create_client(os.environ["SUPABASE_URL"], os.environ["SUPABASE_KEY"])
        sb.table("trending_cache").insert({
            "popular_now": popular_now,
            "insights":    insights,
            "live":        live,
            "cached_at":   _dt.now(_tz.utc).isoformat(),
        }).execute()
    except Exception:
        pass


# ── Live event (derived from SQLite events/sessions, London time) ─────────────

def _get_live_event() -> dict | None:
    """Return the first event currently running in London time, or None."""
    if not _EVENTS_DB.exists():
        return None
    london = _ZoneInfo("Europe/London")
    now = _dt.now(london)
    weekday = now.strftime("%A")                          # "Saturday"
    day_month = f"{now.day} {now.strftime('%B')}"         # "6 June"
    full_date = f"{weekday} {day_month}"                  # "Saturday 6 June"
    now_time = now.strftime("%H:%M")

    conn = sqlite3.connect(str(_EVENTS_DB))
    conn.row_factory = sqlite3.Row

    # Multi-slot events: exact date + time window match
    row = conn.execute(
        """
        SELECT e.title, e.venue_name, es.time_start, es.time_end, e.event_id
        FROM   event_sessions es
        JOIN   events e ON e.event_id = es.event_id
        WHERE  es.date = ?
          AND  es.time_start <= ?
          AND  es.time_end   >= ?
        LIMIT 1
        """,
        (full_date, now_time, now_time),
    ).fetchone()

    if row:
        conn.close()
        return {
            "title":      row["title"],
            "venue":      row["venue_name"] or "",
            "time_start": row["time_start"],
            "time_end":   row["time_end"],
            "event_id":   row["event_id"],
        }

    # Non-multi-slot events: match day and parse "HH:MM–HH:MM" time range
    rows = conn.execute(
        """
        SELECT title, venue_name, time, event_id
        FROM   events
        WHERE  is_multi_slot = 0
          AND  (dates = ? OR dates = 'Both')
        """,
        (weekday,),
    ).fetchall()
    conn.close()

    for r in rows:
        parts = (r["time"] or "").replace("–", "-").split("-", 1)
        if len(parts) == 2:
            t_start, t_end = parts[0].strip(), parts[1].strip()
            if t_start <= now_time <= t_end:
                return {
                    "title":      r["title"],
                    "venue":      r["venue_name"] or "",
                    "time_start": t_start,
                    "time_end":   t_end,
                    "event_id":   r["event_id"],
                }
    return None


# ── Thematic topic extraction ─────────────────────────────────────────────────

_PREFIX = _re.compile(
    r'^(the\s+)?(user\s+)?(inquired|asked|requested|expressed\s+interest|'
    r'showed\s+interest|was\s+(interested\s+in|asking|curious)|'
    r'wanted\s+to\s+(know|find|explore|learn|see)|'
    r'looked|searched|queried|is\s+(looking|asking)|'
    r'seeking\s+information)\s*(about|for|on|into|in|regarding)?\s*',
    _re.IGNORECASE,
)

_STOP = {
    'the','a','an','and','or','but','in','on','at','to','for','of','with',
    'is','are','was','were','have','has','do','does','what','where','when',
    'how','who','which','that','this','some','any','more','most','i','my',
    'me','they','there','their','about','around','near','get','find','know',
    'can','could','would','like','want','need','help',
}

_NOISE = {
    'gerf','great','exhibition','road','festival','echo',
    'available','information','details','info','things','stuff',
}


def _clean_summary(s: str) -> str:
    s = _PREFIX.sub('', s).strip().rstrip('.,?!')
    words = [w for w in s.split()
             if w.lower() not in _STOP
             and w.lower() not in _NOISE
             and len(w) > 2]
    if len(words) < 2:
        return ''
    topic = ' '.join(words[:5]).strip()
    return topic[0].upper() + topic[1:]


def _polish_topics(raw_labels: list) -> list:
    try:
        from langchain_openai import ChatOpenAI as _LLM
        llm = _LLM(model='gpt-4o-mini', temperature=0, max_tokens=120)
        prompt = (
            "Rewrite these festival visitor search topics as short (2-4 word), "
            "title-case topic labels. Remove festival names, abbreviations, or "
            "sentence fragments. Return ONLY a JSON array of strings, same length:\n"
            + str(raw_labels)
        )
        result = llm.invoke(prompt).content.strip()
        polished = json.loads(result)
        if isinstance(polished, list) and len(polished) == len(raw_labels):
            return [str(p) for p in polished]
    except Exception:
        pass
    return raw_labels


def _parse_audience_tags(raw: str | None) -> list[str]:
    if not raw:
        return []
    raw = raw.strip()
    if raw.startswith("["):
        try:
            return json.loads(raw)
        except Exception:
            pass
    return [t.strip() for t in raw.split(",") if t.strip()]


def _compute_trending() -> dict:
    """Full recompute: query Supabase event_interactions + SQLite events."""
    try:
        from supabase import create_client
        sb = create_client(os.environ["SUPABASE_URL"], os.environ["SUPABASE_KEY"])
        rows = sb.table("event_interactions").select(
            "interaction_summary, event_or_activity, event_zone, context_tags"
        ).limit(500).execute().data
    except Exception:
        return {"popular_now": [], "insights": [], "live": _get_live_event()}

    # Popular Now — thematic extraction + LLM polish
    raw_topics = [
        _clean_summary(r["interaction_summary"])
        for r in rows if r.get("interaction_summary")
    ]
    raw_topics = [t for t in raw_topics if t]

    topic_counts = _Counter(raw_topics)
    theme_counts: dict = {}
    for topic, cnt in topic_counts.items():
        key = " ".join(topic.lower().split()[:2])
        if key in theme_counts:
            theme_counts[key][0] += cnt
            if cnt > topic_counts.get(theme_counts[key][1], 0):
                theme_counts[key][1] = topic
        else:
            theme_counts[key] = [cnt, topic]

    top_themes = sorted(theme_counts.values(), key=lambda x: -x[0])[:6]
    raw_labels = [label for _, label in top_themes]
    polished_labels = _polish_topics(raw_labels)

    weight_map = [5, 4, 3, 2, 2, 1]
    popular_now = [
        {"id": str(i + 1), "text": label, "weight": weight_map[i]}
        for i, label in enumerate(polished_labels)
    ]

    # Community Insights — top 3 activities joined with SQLite events
    activity_counts_raw = _Counter(
        r.get("event_or_activity") for r in rows if r.get("event_or_activity")
    )
    top_activities = activity_counts_raw.most_common(3)

    live = _get_live_event()

    if not _EVENTS_DB.exists():
        return {"popular_now": popular_now, "insights": [], "live": live}

    conn = sqlite3.connect(str(_EVENTS_DB))
    conn.row_factory = sqlite3.Row
    insights = []
    for activity, count in top_activities:
        row = conn.execute(
            "SELECT event_id, title, venue_name, time, experience_type, audience_tags"
            " FROM events WHERE lower(title) = lower(?) LIMIT 1",
            (activity,),
        ).fetchone()
        tags: list[str] = []
        if row:
            if row["experience_type"]:
                tags.append(row["experience_type"])
            tags.extend(_parse_audience_tags(row["audience_tags"])[:2])
        insights.append({
            "id":    row["event_id"]   if row else None,
            "title": row["title"]      if row else activity,
            "venue": row["venue_name"] if row else "",
            "time":  row["time"]       if row else "",
            "count": count,
            "tags":  tags,
        })

    # Pad to 3 with random events if Supabase returned fewer than 3
    if len(insights) < 3:
        existing_titles = {ins["title"] for ins in insights}
        placeholders = conn.execute(
            "SELECT event_id, title, venue_name, time, experience_type, audience_tags"
            " FROM events WHERE title NOT IN ({}) ORDER BY RANDOM() LIMIT ?".format(
                ",".join("?" * len(existing_titles)) if existing_titles else "''"
            ),
            (*existing_titles, 3 - len(insights)),
        ).fetchall()
        for p in placeholders:
            tags = []
            if p["experience_type"]:
                tags.append(p["experience_type"])
            tags.extend(_parse_audience_tags(p["audience_tags"])[:2])
            insights.append({
                "id":    p["event_id"]   or None,
                "title": p["title"]      or "",
                "venue": p["venue_name"] or "",
                "time":  p["time"]       or "",
                "count": 0,
                "tags":  tags,
            })

    conn.close()
    return {"popular_now": popular_now, "insights": insights[:3], "live": live}


@app.get("/api/trending")
def get_trending():
    """Return popular keywords, community insights, and live event status.

    Cache hierarchy (fastest → slowest):
      1. In-memory dict    — sub-ms, lost on restart
      2. Supabase table    — ~100 ms, survives Railway redeploys
      3. Full recompute    — 3-5 s, runs at most once per 30 min
    """
    # Layer 1: in-memory
    cached = _get_mem_cache()
    if cached:
        return cached

    # Layer 2: Supabase persistent cache
    cached = _get_trending_cache_sb()
    if cached:
        _set_mem_cache(cached)
        return cached

    # Layer 3: full recompute
    result = _compute_trending()
    _set_mem_cache(result)
    _set_trending_cache_sb(result["popular_now"], result["insights"], result["live"])
    return result




@app.post("/api/parse-session")
def trigger_parse_session(req: ParseSessionRequest):
    from backend.analysis import parse_session
    result = parse_session(req.thread_id)
    if result.get("status") == "error":
        raise HTTPException(status_code=500, detail=result.get("detail"))
    return result
