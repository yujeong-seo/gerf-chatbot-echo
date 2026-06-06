"""Hybrid event search — structured column filters + semantic LIKE queries.

The LLM calls search_events(query) with the user's natural-language request.
Python handles all filter extraction and SQL generation:
  - Structured signals (day, zone, type, audience, venue) are detected from the
    query and applied as SQL column filters for precision.
  - Remaining terms drive LIKE queries against descriptions and title as before.
  - Structured field matches receive scoring bonuses so the most relevant results
    always rank first.
"""
import re
import sqlite3
from pathlib import Path

from langchain_core.tools import tool

_DB_FILE = Path(__file__).parent.parent.parent / "rag" / "gerf_2026.db"

# ---------------------------------------------------------------------------
# Vocabulary: maps user terms to related words found in event descriptions.
# ---------------------------------------------------------------------------

VOCAB: dict[str, list[str]] = {
    # Technology & engineering
    "tech":          ["tech", "robot", "digital", "ai", "computer", "engineer", "innovation", "device", "software", "smart", "sensor", "wearable", "3d"],
    "technology":    ["tech", "robot", "digital", "ai", "computer", "engineer", "innovation", "device", "wearable", "sensor", "smart"],
    "robot":         ["robot", "robotic", "automation", "machine", "arm", "surgery"],
    "ai":            ["ai", "artificial", "machine learning", "algorithm", "intelligent"],
    "engineering":   ["engineer", "build", "construct", "machine", "design", "fabricat", "robot", "tech"],
    "computer":      ["computer", "code", "software", "digital", "program", "algorithm"],
    "digital":       ["digital", "virtual", "computer", "code", "vr", "3d", "avatar"],
    "space":         ["space", "astrono", "universe", "planet", "star", "spacecraft", "origami", "satellite"],
    "coding":        ["code", "program", "software", "digital", "computer"],

    # Science
    "science":       ["science", "research", "experiment", "discover", "lab", "biology", "physics", "chemistry", "data", "scientist"],
    "biology":       ["biology", "cell", "organism", "life", "body", "blood", "gene", "evolut", "species"],
    "physics":       ["physics", "quantum", "particle", "light", "energy", "electro"],
    "chemistry":     ["chemistry", "material", "molecule", "compound", "reaction"],
    "medical":       ["medical", "health", "body", "blood", "clinical", "surgery", "diagnos", "disease", "wearable"],
    "experiment":    ["experiment", "research", "science", "lab", "discover", "test"],

    # Art & creativity
    "art":           ["art", "design", "creative", "paint", "draw", "craft", "visual", "colour", "sculpt", "gallery", "zine", "artist"],
    "creative":      ["art", "make", "craft", "design", "draw", "paint", "build", "create", "workshop", "colour"],
    "craft":         ["craft", "make", "create", "build", "design", "workshop", "fold", "paper"],
    "design":        ["design", "creative", "art", "visual", "build", "prototype", "wearable"],
    "photography":   ["photo", "camera", "image", "visual", "digital"],
    "drawing":       ["draw", "sketch", "art", "design", "creative"],
    "making":        ["make", "craft", "build", "workshop", "create", "design"],

    # Music & performance
    "music":         ["music", "performance", "concert", "dance", "stage", "show", "sing", "band", "live", "cabaret", "bolly"],
    "performance":   ["performance", "show", "stage", "theatre", "theater", "comedy", "demonstrat", "live"],
    "comedy":        ["comedy", "humour", "humor", "funny", "laugh", "cabaret", "science cabaret"],
    "dance":         ["dance", "movement", "bollywood", "bollyqueer", "choreograph"],
    "theatre":       ["theatre", "theater", "performance", "show", "stage", "comedy"],

    # Family & kids
    "family":        ["family", "children", "kids", "child", "junior", "young", "toddler", "parent", "ages", "under 5", "under-5"],
    "kids":          ["family", "children", "kids", "child", "junior", "young", "age", "toddler"],
    "children":      ["children", "child", "kids", "family", "junior", "young", "age", "rhyme"],
    "toddler":       ["toddler", "under 5", "young child", "baby", "story", "rhyme", "song"],
    "baby":          ["baby", "toddler", "under 5", "young", "story", "rhyme"],

    # Food & drink
    "food":          ["food", "drink", "eat", "cook", "taste", "nutrition", "chef", "culinary", "meat", "dining", "table"],
    "cooking":       ["cook", "food", "kitchen", "recipe", "culinary", "taste", "dining"],
    "drink":         ["drink", "bar", "food", "taste"],

    # Nature & environment
    "nature":        ["nature", "wildlife", "plant", "ecology", "environment", "animal", "outdoor", "garden", "fungi", "underground", "soil", "fossil", "tree"],
    "environment":   ["environment", "ecology", "climate", "wildlife", "green", "planet", "sustainable", "carbon", "energy"],
    "wildlife":      ["wildlife", "animal", "nature", "bird", "insect", "ecology", "species"],
    "outdoor":       ["outdoor", "garden", "park", "outside", "open-air", "nature", "green", "kensington"],
    "plant":         ["plant", "nature", "garden", "botanic", "ecology", "grow", "seed"],
    "fossil":        ["fossil", "rock", "geology", "underground", "extinct", "ancient"],
    "fungi":         ["fungi", "mushroom", "underground", "nature", "ecology"],
    "geology":       ["geology", "rock", "fossil", "underground", "mineral", "earth"],
    "underground":   ["underground", "subterranean", "tunnel", "geology", "fungi", "soil"],
    "sustainability": ["sustainable", "environment", "climate", "carbon", "energy", "green"],

    # Health & wellbeing
    "health":        ["health", "wellbeing", "wellness", "medical", "body", "mind", "fit", "disease", "diagnos"],
    "wellbeing":     ["wellbeing", "wellness", "health", "mind", "calm", "relax", "happiness"],
    "mental":        ["mental", "mind", "wellbeing", "anxiety", "brain", "health"],
    "relaxing":      ["calm", "gentle", "quiet", "slow", "mindful", "wellbeing", "peaceful", "relax"],
    "calm":          ["calm", "quiet", "gentle", "peaceful", "relaxing", "mindful", "slow"],

    # Culture & history
    "culture":       ["culture", "history", "heritage", "society", "community", "social", "tradition", "disability", "invisib"],
    "history":       ["history", "heritage", "historical", "past", "tradition", "culture", "1851", "Victorian"],
    "community":     ["community", "social", "culture", "heritage", "local", "people"],

    # Interactive & participatory
    "interactive":   ["interactive", "hands-on", "workshop", "participat", "try", "make", "play", "game"],
    "workshop":      ["workshop", "hands-on", "make", "craft", "participat", "learn", "create"],
    "talk":          ["talk", "lecture", "debate", "discussion", "panel", "seminar", "presentation", "tour"],
    "tour":          ["tour", "walk", "visit", "guide", "explore"],
    "game":          ["game", "play", "interactive", "challenge", "compete", "snakes", "operation"],

    # Moods & contexts
    "fun":           ["fun", "enjoy", "exciting", "fascinating", "amaz", "wonder", "delight", "playful"],
    "exciting":      ["exciting", "thrilling", "amaz", "fascinating", "wonder", "immersive"],
    "learn":         ["learn", "discover", "educati", "science", "research", "knowledge", "find out"],
    "explore":       ["explor", "discover", "adventure", "journey", "find", "investigat"],
    "immersive":     ["immersive", "vr", "virtual", "360", "experience", "enter"],
    "solo":          ["solo", "alone", "individual", "self"],
    "adults":        ["adult", "18+", "mature", "grown-up"],
    "teens":         ["teen", "young adult", "13", "nextgen", "youth"],

    # Zone names (loose user mentions)
    "nextgen":       ["nextgen", "teen", "young adult", "robot", "biology", "creative", "innovation"],
    "tech zone":     ["tech", "robot", "digital", "smart", "wearable", "origami", "spacecraft"],
    "underground":   ["underground", "subterranean", "geology", "fossil", "fungi", "quicksand"],
    "happiness":     ["happiness", "health", "wellbeing", "wellness", "medical", "disease"],
    "world science": ["world", "global", "international", "food", "energy", "city", "malarial"],
}

_STOPWORDS = {
    "the", "a", "an", "for", "and", "or", "with", "at", "in", "on", "to", "of",
    "is", "are", "was", "have", "has", "some", "any", "what", "show", "find",
    "i", "me", "my", "about", "something", "anything", "please", "can", "you",
    "do", "does", "like", "want", "looking", "interested", "tell", "give",
    "events", "event", "activities", "activity", "things", "happening", "there",
    "will", "this", "that", "they", "them", "get", "just", "only", "also",
    "maybe", "perhaps", "really", "very", "bit", "lot",
}


def _expand(query: str) -> list[str]:
    """Extract base words from query, expand each via VOCAB, return unique terms."""
    words = re.findall(r"[a-z]{3,}", query.lower())
    base  = [w for w in words if w not in _STOPWORDS]

    expanded: set[str] = set(base)
    for word in base:
        expanded.update(VOCAB.get(word, []))
        for key, vals in VOCAB.items():
            if " " in key and key in query.lower():
                expanded.update(vals)

    return list(expanded)[:35]


# ---------------------------------------------------------------------------
# Structured filter detection
# ---------------------------------------------------------------------------

# Longer phrases must be checked before shorter ones to avoid partial matches.
# Sorted by descending length at runtime via sorted(..., key=lambda x: -len(x[0])).

_DAY_MAP: dict[str, str] = {
    "both days":  "dates = 'Both'",
    "either day": "dates IN ('Saturday','Sunday','Both')",
    "weekend":    "dates IN ('Saturday','Sunday','Both')",
    "saturday":   "dates IN ('Saturday','Both')",
    "sunday":     "dates IN ('Sunday','Both')",
    "friday":     "dates IN ('Friday','Both')",
}

_TYPE_MAP: dict[str, str] = {
    "talk & tour": "%Talk%",
    "talks":       "%Talk%",
    "talk":        "%Talk%",
    "tour":        "%Tour%",
    "workshops":   "%Workshop%",
    "workshop":    "%Workshop%",
    "performance": "%Performance%",
    "performances":"%Performance%",
    "concert":     "%Performance%",
    "show":        "%Performance%",
    "exhibition":  "%Exhibit%",
    "exhibit":     "%Exhibit%",
    "display":     "%Exhibit%",
}

_AUDIENCE_MAP: dict[str, str] = {
    "young people": "%Young People%",
    "under 5s":     "%under 5%",
    "under-5s":     "%under 5%",
    "under 5":      "%under 5%",
    "under-5":      "%under 5%",
    "toddlers":     "%under 5%",
    "toddler":      "%under 5%",
    "families":     "%Family%",
    "family":       "%Family%",
    "children":     "%Family%",
    "kids":         "%Family%",
    "child":        "%Family%",
    "adults only":  "%Adults%",
    "adults-only":  "%Adults%",
    "adults":       "%Adults%",
    "adult":        "%Adults%",
    "18+":          "%Adults%",
    "teens":        "%Young People%",
    "teen":         "%Young People%",
    "youth":        "%Young People%",
}

_REG_FILTER_MAP: dict[str, str] = {
    "no booking":   "drop-in",
    "walk-in":      "drop-in",
    "walk in":      "drop-in",
    "drop-in":      "drop-in",
    "drop in":      "drop-in",
    "free entry":   "drop-in",
    "free ticket":  "free-ticket",
    "book ahead":   "free-ticket",
    "book in":      "free-ticket",
    "reserve":      "free-ticket",
}

# zone phrase -> zone_id slug
_ZONE_MAP: dict[str, str] = {
    "kensington gardens":     "family-fun-zone",
    "family fun zone":        "family-fun-zone",
    "family fun":             "family-fun-zone",
    "family zone":            "family-fun-zone",
    "adults only zone":       "adults-only-zone",
    "adults-only zone":       "adults-only-zone",
    "adults only":            "adults-only-zone",
    "adults-only":            "adults-only-zone",
    "beit quadrangle":        "adults-only-zone",
    "beit":                   "adults-only-zone",
    "nextgen zone":           "nextgen-zone",
    "next gen zone":          "nextgen-zone",
    "nextgen":                "nextgen-zone",
    "next gen":               "nextgen-zone",
    "smith centre":           "nextgen-zone",
    "happiness and health":   "happiness-and-health-zone",
    "happiness & health":     "happiness-and-health-zone",
    "happiness zone":         "happiness-and-health-zone",
    "health zone":            "happiness-and-health-zone",
    "sherfield":              "happiness-and-health-zone",
    "queen's tower":          "happiness-and-health-zone",
    "be a scientist zone":    "be-a-scientist-zone",
    "be a scientist":         "be-a-scientist-zone",
    "scientist zone":         "be-a-scientist-zone",
    "flowers building":       "be-a-scientist-zone",
    "world science zone":     "world-science-zone",
    "world science":          "world-science-zone",
    "business school":        "world-science-zone",
    "underground adventure":  "underground-adventure-zone",
    "underground zone":       "underground-adventure-zone",
    "underground":            "underground-adventure-zone",
    "princes gardens":        "underground-adventure-zone",
    "prince's gardens":       "underground-adventure-zone",
    "tech zone":              "tech-zone",
    "technology zone":        "tech-zone",
    "fleming building":       "tech-zone",
    "sir alexander":          "tech-zone",
}

# Venue name fragments checked via LIKE against venue_name column
_VENUE_KEYWORDS: list[str] = [
    "natural history museum",
    "science museum",
    "imperial college",
    "smith centre",
    "dyson building",
    "flowers building",
    "beit quadrangle",
    "sherfield",
    "business school",
    "city and guilds",
    "dangoor",
    "prince's gardens",
    "kensington gardens",
    "exhibition road",
    "goethe",
    "v&a",
]


def _extract_filters(query: str) -> dict:
    """Detect structured column filter signals in a natural-language query.

    Returns:
      day_sql    — SQL WHERE fragment for dates (None if not detected)
      type_likes — LIKE patterns for experience_type  ([] if none)
      aud_likes  — LIKE patterns for audience_tags    ([] if none)
      reg_val    — exact registration_type value      (None if none)
      zone_id    — exact zone_id slug                 (None if none)
      venue_kw   — LIKE fragment for venue_name       (None if none)
    """
    q = query.lower()

    # Day — longest match first to avoid "saturday" matching "this saturday only"
    day_sql = None
    for phrase, sql in sorted(_DAY_MAP.items(), key=lambda x: -len(x[0])):
        if phrase in q:
            day_sql = sql
            break

    # Experience type — collect all matches
    type_likes: list[str] = []
    for kw, pat in sorted(_TYPE_MAP.items(), key=lambda x: -len(x[0])):
        if kw in q and pat not in type_likes:
            type_likes.append(pat)

    # Audience — collect all matches, longest phrase first
    aud_likes: list[str] = []
    for kw, pat in sorted(_AUDIENCE_MAP.items(), key=lambda x: -len(x[0])):
        if kw in q and pat not in aud_likes:
            aud_likes.append(pat)

    # Registration
    reg_val = None
    for kw, val in sorted(_REG_FILTER_MAP.items(), key=lambda x: -len(x[0])):
        if kw in q:
            reg_val = val
            break

    # Zone — longest phrase first
    zone_id = None
    for phrase, zid in sorted(_ZONE_MAP.items(), key=lambda x: -len(x[0])):
        if phrase in q:
            zone_id = zid
            break

    # Venue — longest keyword first
    venue_kw = None
    for kw in sorted(_VENUE_KEYWORDS, key=lambda x: -len(x)):
        if kw in q:
            venue_kw = kw
            break

    return {
        "day_sql":    day_sql,
        "type_likes": type_likes,
        "aud_likes":  aud_likes,
        "reg_val":    reg_val,
        "zone_id":    zone_id,
        "venue_kw":   venue_kw,
    }


# ---------------------------------------------------------------------------
# Core search
# ---------------------------------------------------------------------------

_REG_LABEL = {
    "drop-in":     "Drop-in (no booking needed)",
    "free-ticket": "Free ticket — book in advance",
    "paid-ticket": "Paid ticket",
}

_SELECT = (
    "SELECT event_id, title, venue_name, zone_id, dates, time, is_multi_slot, "
    "registration_type, short_description, long_description, arrival_notes, "
    "audience_tags, experience_type "
    "FROM events"
)


def _run_search(
    conn: sqlite3.Connection,
    terms: list[str],
    filters: dict,
) -> list[sqlite3.Row]:
    """Two-tier hybrid query.

    Tier 1 (AND): high-confidence structural filters — day, zone, registration.
    Tier 2 (OR):  structured column matches + semantic LIKE on descriptions.

    If the whole query returns 0 rows, the caller falls back to _fallback().
    """
    and_clauses: list[str] = []
    and_params:  list      = []
    or_clauses:  list[str] = []
    or_params:   list      = []

    # AND filters (high-confidence)
    if filters["day_sql"]:
        and_clauses.append(f"({filters['day_sql']})")
    if filters["zone_id"]:
        and_clauses.append("zone_id = ?")
        and_params.append(filters["zone_id"])
    if filters["reg_val"]:
        and_clauses.append("registration_type = ?")
        and_params.append(filters["reg_val"])

    # OR: structured column matches
    for pat in filters["type_likes"]:
        or_clauses.append("experience_type LIKE ?")
        or_params.append(pat)
    for pat in filters["aud_likes"]:
        or_clauses.append("audience_tags LIKE ?")
        or_params.append(pat)
    if filters["venue_kw"]:
        or_clauses.append("venue_name LIKE ?")
        or_params.append(f"%{filters['venue_kw']}%")

    # OR: semantic LIKE on descriptions and title
    for t in terms:
        or_clauses.append("long_description LIKE ?")
        or_params.append(f"%{t}%")
        or_clauses.append("short_description LIKE ?")
        or_params.append(f"%{t}%")
        or_clauses.append("title LIKE ?")
        or_params.append(f"%{t}%")

    if not and_clauses and not or_clauses:
        return []

    where_parts: list[str] = list(and_clauses)
    all_params              = list(and_params)

    if or_clauses:
        where_parts.append(f"({' OR '.join(or_clauses)})")
        all_params.extend(or_params)

    sql = f"{_SELECT} WHERE {' AND '.join(where_parts)}"
    return conn.execute(sql, all_params).fetchall()


def _score(row: sqlite3.Row, terms: list[str], filters: dict) -> int:
    """Score a result row. Structured field hits receive higher bonuses than
    description matches so type/audience/venue queries rank precisely."""
    title = (row["title"]             or "").lower()
    short = (row["short_description"] or "").lower()
    long_ = (row["long_description"]  or "").lower()
    exp   = (row["experience_type"]   or "").lower()
    aud   = (row["audience_tags"]     or "").lower()
    venue = (row["venue_name"]        or "").lower()
    zone  = (row["zone_id"]           or "").lower()

    score = sum(3 * (t in title) + (t in short) + (t in long_) for t in terms)

    for pat in filters["type_likes"]:
        if pat.strip("%").lower() in exp:
            score += 5
    for pat in filters["aud_likes"]:
        if pat.strip("%").lower() in aud:
            score += 5
    if filters["venue_kw"] and filters["venue_kw"] in venue:
        score += 6
    if filters["zone_id"] and filters["zone_id"] == zone:
        score += 4

    return score


def _fallback(conn: sqlite3.Connection, terms: list[str], filters: dict) -> list[sqlite3.Row]:
    """Progressive fallback: per-term semantic → zone match → popular drop-ins.
    Respects any zone filter already detected."""

    # If a zone was detected but main search returned nothing, restrict to that zone
    zone_clause = f"AND zone_id = '{filters['zone_id']}'" if filters["zone_id"] else ""

    # 1. Try each semantic term alone
    for term in terms[:8]:
        rows = conn.execute(
            f"{_SELECT} WHERE (long_description LIKE ? OR title LIKE ?) {zone_clause} LIMIT 3",
            [f"%{term}%", f"%{term}%"],
        ).fetchall()
        if rows:
            return list(rows)

    # 2. Match query terms against zone descriptions, return events from best zone
    if not filters["zone_id"]:
        zones = conn.execute(
            "SELECT zone_id, long_description FROM zones WHERE long_description IS NOT NULL"
        ).fetchall()
        best_zone, best_score = None, 0
        for z in zones:
            s = sum(1 for t in terms if t in (z["long_description"] or "").lower())
            if s > best_score:
                best_score, best_zone = s, z["zone_id"]

        if best_zone:
            rows = conn.execute(
                f"{_SELECT} WHERE zone_id = ? LIMIT 3", [best_zone]
            ).fetchall()
            if rows:
                return list(rows)

    # 3. Last resort: popular drop-in events
    return conn.execute(
        f"{_SELECT} WHERE registration_type = 'drop-in' LIMIT 3"
    ).fetchall()


def _search_single(query: str) -> tuple[list[dict], list[str], dict]:
    """Run one full search pipeline for a query segment.

    Shared by single-query and multi-segment paths so the expand→filter→SQL→fallback
    chain isn't duplicated inside the multi-interest loop. Opens, uses, and closes its
    own connection; returns plain dicts so the caller needs no live connection.
    """
    terms   = _expand(query)
    filters = _extract_filters(query)
    conn    = sqlite3.connect(str(_DB_FILE))
    conn.row_factory = sqlite3.Row
    rows = _run_search(conn, terms, filters) or _fallback(conn, terms, filters)
    row_dicts = [dict(r) for r in rows]   # materialise before closing
    conn.close()
    return row_dicts, terms, filters


def _attach_sessions(results: list[dict]) -> None:
    """Attach event_sessions rows to multi-slot events in-place."""
    multi = [r for r in results if r.get("is_multi_slot")]
    if not multi:
        return
    conn = sqlite3.connect(str(_DB_FILE))
    conn.row_factory = sqlite3.Row
    for r in multi:
        r["sessions"] = [
            dict(s) for s in conn.execute(
                "SELECT date, time_start, time_end, session_notes "
                "FROM event_sessions WHERE event_id = ? ORDER BY date, time_start",
                [r["event_id"]],
            ).fetchall()
        ]
    conn.close()


def run_semantic_search(query: str, max_results: int = 3) -> list[dict]:
    """Return up to max_results events best matching the query. Always returns at least 1.

    When the query contains comma-separated segments (e.g. "Science, Engineering,
    Family & Kids" from multiple selected interests), each segment is searched
    independently and results are ranked by cross-segment match count so events
    that satisfy the most interests surface first.
    """
    # Detect multi-segment: comma-split only when every segment is short (≤4 words)
    # to avoid splitting natural phrases like "hands-on science for families".
    raw_segs  = [s.strip() for s in query.split(",") if s.strip()]
    segments  = raw_segs if (len(raw_segs) > 1 and all(len(s.split()) <= 4 for s in raw_segs)) else [query]

    if len(segments) == 1:
        # ── Single-query path ────────────────────────────────────────────────
        row_dicts, terms, filters = _search_single(query)

        seen: set[str] = set()
        scored: list[tuple[dict, int]] = []
        for row in row_dicts:
            if row["event_id"] not in seen:
                seen.add(row["event_id"])
                scored.append((row, _score(row, terms, filters)))

        scored.sort(key=lambda x: x[1], reverse=True)
        result_dicts = [r for r, _ in scored[:max_results]]
        _attach_sessions(result_dicts)
        return result_dicts

    # ── Multi-segment path ───────────────────────────────────────────────────
    # Each segment is searched independently. Events earn +10 per segment they
    # appear in (cross-interest bonus) plus their per-segment relevance score,
    # so events matching more interests rank above events matching only one.
    event_store:  dict[str, dict]  = {}
    event_scores: dict[str, float] = {}

    for seg in segments:
        row_dicts, terms, filters = _search_single(seg)
        seg_seen: set[str] = set()
        for row in row_dicts:
            eid = row["event_id"]
            if eid in seg_seen:
                continue
            seg_seen.add(eid)
            if eid not in event_store:
                event_store[eid]  = row
                event_scores[eid] = 0.0
            event_scores[eid] += 10.0 + _score(row, terms, filters)

    if not event_store:
        # Nothing matched — retry as one combined query
        return run_semantic_search(query.replace(",", " "), max_results)

    ranked       = sorted(event_store.keys(), key=lambda eid: -event_scores[eid])
    result_dicts = [event_store[eid] for eid in ranked[:max_results]]
    _attach_sessions(result_dicts)
    return result_dicts


# ---------------------------------------------------------------------------
# LangChain tool
# ---------------------------------------------------------------------------

@tool
def search_events(query: str) -> str:
    """Find GERF 2026 events matching a theme, mood, interest, or activity type.

    ALWAYS use this tool for any event discovery query — including themes like
    "technology", "nature", "creative", "relaxing", "kids activities", "music",
    or any mood or interest the user expresses. Also handles structured queries:
    day filters ("Sunday only"), type filters ("talk events", "workshops"),
    audience filters ("family", "adults only", "teens"), zone filters
    ("happiness zone", "sherfield"), and venue filters ("dyson building").

    Do NOT write SQL directly. This tool handles all matching.
    Input: the user's natural language query or key theme words.
    Returns structured event data including event_id for follow-up tool calls.
    """
    events = run_semantic_search(query)

    if not events:
        return "No events found."  # should never happen due to fallback

    lines = []
    for e in events:
        venue = e.get("venue_name") or e.get("zone_id") or "South Kensington"
        reg   = _REG_LABEL.get(e.get("registration_type") or "", "Drop-in")
        short  = e.get("short_description") or ""
        long_  = e.get("long_description") or ""
        detail = long_[:300] if long_ and long_.strip() != short.strip() else ""

        if e.get("is_multi_slot") and e.get("sessions"):
            slots = []
            for s in e["sessions"]:
                slot = f"{s['date']} · {s['time_start']}–{s['time_end']}"
                if s.get("session_notes"):
                    slot += f" ({s['session_notes']})"
                slots.append(slot)
            when_line = f"sessions: {' | '.join(slots)}"
        else:
            date  = e.get("dates", "")
            time_ = e.get("time", "")
            when_line = f"when: {f'{date} · {time_}' if time_ else date}"

        zone_id       = e.get("zone_id") or ""
        arrival_notes = e.get("arrival_notes") or ""
        aud_tags      = e.get("audience_tags") or ""
        exp_type      = e.get("experience_type") or ""

        block = (
            f"event_id: {e['event_id']}\n"
            f"title: {e['title']}\n"
            f"zone_id: {zone_id}\n"
            f"venue: {venue}\n"
            f"{when_line}\n"
            f"registration: {reg}\n"
            f"audience: {aud_tags}\n"
            f"type: {exp_type}\n"
            f"description: {short}"
        )
        if arrival_notes:
            block += f"\narrival_notes: {arrival_notes}"
        if detail:
            block += f"\ndetail: {detail}"
        lines.append(block)

    return "\n\n---\n\n".join(lines)
