"""Write parsed session data to Supabase analytics tables.

Tables written:
  session_profiles   — one row per session
  event_interactions — one row per distinct topic discussed
  session_feedback   — one row per qualitative feedback statement
"""
import os
from datetime import datetime, timezone

from supabase import create_client, Client


def _client() -> Client:
    return create_client(os.environ["SUPABASE_URL"], os.environ["SUPABASE_KEY"])


def save_session_profile(
    thread_id: str,
    profile: dict,
    sentiment: dict,
    started_at: str | None,
    last_at: str | None,
) -> None:
    """Upsert the session-level profile row."""
    prefs = profile.get("engagement_preferences") or {}
    row = {
        "session_id":          thread_id,
        "interest_tags":       profile.get("interest_tags", []),
        "chat_topics":         profile.get("chat_topics", []),
        "audience_type":       prefs.get("audience_type"),
        "content_type":        prefs.get("content_type"),
        "interaction_depth":   profile.get("interaction_depth", "overview"),
        "sentiment_score":     sentiment.get("score"),
        "sentiment_overall":   sentiment.get("overall"),
        "session_started_at":  started_at,
        "last_interaction_at": last_at,
    }
    _client().table("session_profiles").upsert(row).execute()


def save_event_interactions(thread_id: str, interactions: list[dict]) -> None:
    """Insert event interaction rows. No-op if list is empty."""
    if not interactions:
        return
    now = datetime.now(timezone.utc).isoformat()
    rows = [
        {
            "session_id":           thread_id,
            "interaction_summary":  ia.get("interaction_summary"),
            "interaction_stage":    ia.get("interaction_stage", "on"),
            "event_zone":           ia.get("event_zone"),
            "event_or_activity":    ia.get("event_or_activity"),
            "sentiment_overall":    (ia.get("sentiment") or {}).get("overall"),
            "sentiment_tone":       (ia.get("sentiment") or {}).get("tone"),
            "engagement_level":     ia.get("engagement_level"),
            "engagement_behaviour": ia.get("engagement_behaviour"),
            "audience_type":        ia.get("audience_type"),
            "content_type":         ia.get("content_type"),
            "context_tags":         ia.get("context_tags", []),
            "timestamp":            now,
        }
        for ia in interactions
    ]
    _client().table("event_interactions").insert(rows).execute()


def save_feedback_entries(thread_id: str, entries: list[dict]) -> None:
    """Insert naturally-captured feedback rows (from LLM post-session parse)."""
    if not entries:
        return
    now = datetime.now(timezone.utc).isoformat()
    rows = [
        {
            "session_id":        thread_id,
            "feedback_topic":    fe.get("feedback_topic"),
            "feedback_stage":    fe.get("feedback_stage", "natural"),
            "sentiment_overall": (fe.get("sentiment") or {}).get("overall"),
            "sentiment_tone":    (fe.get("sentiment") or {}).get("tone"),
            "feedback_text":     fe.get("feedback_text"),
            "tags":              fe.get("tags", []),
            "sequence":          fe.get("sequence"),
            "main_question":     fe.get("main_question"),
            "follow_ups":        fe.get("follow_ups", []),
            "interaction_stage": fe.get("interaction_stage"),
            "timestamp":         now,
        }
        for fe in entries
    ]
    _client().table("session_feedback").insert(rows).execute()


def save_test_session_profile(
    thread_id:  str,
    profile:    dict,
    sentiment:  dict,
    started_at: str | None,
    last_at:    str | None,
    username:   str,
    turn_count: int,
    droppoint:  str,
) -> None:
    """Upsert a test session profile row to test_session_profiles."""
    prefs = profile.get("engagement_preferences") or {}
    row = {
        "session_id":          thread_id,
        "interest_tags":       profile.get("interest_tags", []),
        "chat_topics":         profile.get("chat_topics", []),
        "audience_type":       prefs.get("audience_type"),
        "content_type":        prefs.get("content_type"),
        "interaction_depth":   profile.get("interaction_depth", "overview"),
        "sentiment_score":     sentiment.get("score"),
        "sentiment_overall":   sentiment.get("overall"),
        "session_started_at":  started_at,
        "last_interaction_at": last_at,
        "username":            username,
        "turn":                turn_count,
        "droppoint":           droppoint,
    }
    _client().table("test_session_profiles").upsert(row).execute()


def save_feedback_entries_v2(thread_id: str, exchanges: list[dict]) -> None:
    """Insert feedback rows from the feedback agent (structured exchange pairs)."""
    if not exchanges:
        return
    now = datetime.now(timezone.utc).isoformat()
    rows = [
        {
            "session_id":        thread_id,
            "feedback_stage":    ex.get("feedback_stage", "opening"),
            "feedback_text":     ex.get("response"),
            "sequence":          ex.get("sequence"),
            "main_question":     ex.get("main_question"),
            "follow_ups":        ex.get("follow_ups", []),
            "interaction_stage": ex.get("interaction_stage"),
            "timestamp":         now,
        }
        for ex in exchanges
    ]
    _client().table("session_feedback").insert(rows).execute()
