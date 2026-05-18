"""Semantic event search — Python-controlled LIKE queries across descriptions.

The LLM calls search_events(query) with the user's natural-language request.
Python handles all keyword expansion and SQL generation, so the LLM never
writes SQL for discovery queries and never gets a "no results" response.
"""
import re
import sqlite3
from pathlib import Path

from langchain_core.tools import tool

_DB_FILE = Path(__file__).parent.parent.parent / "rag" / "gerf_2026.db"

# ---------------------------------------------------------------------------
# Vocabulary: maps user terms to related words found in event descriptions.
# Entries are lowercase; LIKE queries are case-insensitive via SQLite default.
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
    "relaxing":      ["calm", "gentle", "quiet", "slow", "mindful", "wellbeing", "peaceful", "relax", "relax"],
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

    # Zone names (in case user mentions them loosely)
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
        # Also check multi-word keys
        for key, vals in VOCAB.items():
            if " " in key and key in query.lower():
                expanded.update(vals)

    return list(expanded)[:35]  # cap for query length


# ---------------------------------------------------------------------------
# Core search
# ---------------------------------------------------------------------------

_REG_LABEL = {
    "drop-in":     "Drop-in (no booking needed)",
    "free-ticket": "Free ticket — book in advance",
    "paid-ticket": "Paid ticket",
}


def _format_event(row: sqlite3.Row) -> str:
    date  = row["dates"] or ""
    time_ = row["time"]  or ""
    when  = f"{date} · {time_}" if time_ else date
    venue = row["venue_name"] or row["zone_id"] or "South Kensington"
    reg   = _REG_LABEL.get(row["registration_type"] or "", row["registration_type"] or "Drop-in")
    return (
        f"event_id: {row['event_id']}\n"
        f"title: {row['title']}\n"
        f"venue: {venue}\n"
        f"when: {when}\n"
        f"registration: {reg}\n"
        f"description: {row['short_description'] or ''}"
    )


def _run_search(conn: sqlite3.Connection, terms: list[str], limit: int = 6) -> list[sqlite3.Row]:
    if not terms:
        return []
    placeholders = " OR ".join(
        ["long_description LIKE ? OR short_description LIKE ? OR title LIKE ?"]
        * len(terms)
    )
    params = [f"%{t}%" for t in terms for _ in range(3)]
    sql = (
        "SELECT event_id, title, venue_name, zone_id, dates, time, is_multi_slot, "
        "registration_type, short_description, long_description, arrival_notes "
        f"FROM events WHERE {placeholders} LIMIT {limit * 4}"
    )
    return conn.execute(sql, params).fetchall()


def _score(row: sqlite3.Row, terms: list[str]) -> int:
    title = (row["title"] or "").lower()
    short = (row["short_description"] or "").lower()
    long_ = (row["long_description"] or "").lower()
    return sum(
        3 * (t in title) + (t in short) + (t in long_)
        for t in terms
    )


def _fallback(conn: sqlite3.Connection, terms: list[str]) -> list[sqlite3.Row]:
    """Progressive fallback: per-term → zone match → popular drop-ins."""
    # 1. Try each term alone
    for term in terms[:8]:
        rows = conn.execute(
            "SELECT event_id, title, venue_name, zone_id, dates, time, is_multi_slot, "
            "registration_type, short_description, long_description, arrival_notes "
            "FROM events WHERE long_description LIKE ? OR title LIKE ? LIMIT 3",
            [f"%{term}%", f"%{term}%"],
        ).fetchall()
        if rows:
            return list(rows)

    # 2. Match query terms against zone long_descriptions, return events from best zone
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
            "SELECT event_id, title, venue_name, zone_id, dates, time, is_multi_slot, "
            "registration_type, short_description, long_description, arrival_notes "
            "FROM events WHERE zone_id = ? LIMIT 3",
            [best_zone],
        ).fetchall()
        if rows:
            return list(rows)

    # 3. Last resort: popular drop-in events
    return conn.execute(
        "SELECT event_id, title, venue_name, zone_id, dates, time, is_multi_slot, "
        "registration_type, short_description, long_description, arrival_notes "
        "FROM events WHERE registration_type = 'drop-in' LIMIT 3"
    ).fetchall()


def run_semantic_search(query: str, max_results: int = 3) -> list[dict]:
    """Return up to max_results events best matching the query. Always returns at least 1."""
    terms = _expand(query)

    conn = sqlite3.connect(str(_DB_FILE))
    conn.row_factory = sqlite3.Row

    rows = _run_search(conn, terms)

    if not rows:
        rows = _fallback(conn, terms)

    # Score and rank; deduplicate by event_id
    seen: set[str] = set()
    scored = []
    for row in rows:
        if row["event_id"] not in seen:
            seen.add(row["event_id"])
            scored.append((dict(row), _score(row, terms)))

    scored.sort(key=lambda x: x[1], reverse=True)
    result_dicts = [r[0] for r in scored[:max_results]]

    # Fetch session slots for multi-slot events before closing the connection
    for r in result_dicts:
        if r.get("is_multi_slot"):
            session_rows = conn.execute(
                "SELECT date, time_start, time_end, session_notes "
                "FROM event_sessions WHERE event_id = ? ORDER BY date, time_start",
                [r["event_id"]],
            ).fetchall()
            r["sessions"] = [dict(s) for s in session_rows]

    conn.close()
    return result_dicts


# ---------------------------------------------------------------------------
# LangChain tool
# ---------------------------------------------------------------------------

@tool
def search_events(query: str) -> str:
    """Find GERF 2026 events matching a theme, mood, interest, or activity type.

    ALWAYS use this tool for any event discovery query — including themes like
    "technology", "nature", "creative", "relaxing", "kids activities", "music",
    or any mood or interest the user expresses.

    Do NOT use SQL tools for event discovery. This tool handles all semantic
    matching. Input: the user's natural language query or key theme words.
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
        block = (
            f"event_id: {e['event_id']}\n"
            f"title: {e['title']}\n"
            f"zone_id: {zone_id}\n"
            f"venue: {venue}\n"
            f"{when_line}\n"
            f"registration: {reg}\n"
            f"description: {short}"
        )
        if arrival_notes:
            block += f"\narrival_notes: {arrival_notes}"
        if detail:
            block += f"\ndetail: {detail}"
        lines.append(block)

    return "\n\n---\n\n".join(lines)
