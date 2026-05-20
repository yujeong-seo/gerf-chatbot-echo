-- =============================================================================
-- GERF Chatbot Echo — Supabase Schema Reference
-- Project: hvzdjvdcfkuplvjgqmzp.supabase.co
--
-- HOW TO USE: Paste each section into the Supabase SQL editor.
-- Sections marked "ALREADY EXISTS" document current live tables.
-- Sections marked "RUN THIS" must be executed to set up new tables.
-- =============================================================================


-- =============================================================================
-- SECTION 1: ANALYTICS TABLES (ALREADY EXISTS — reference only)
-- Written by: backend/analysis/supabase_store.py after each session expires
-- =============================================================================

-- One row per chat session. Written once when the session expires (60 min idle).
CREATE TABLE IF NOT EXISTS session_profiles (
    session_id           TEXT PRIMARY KEY,
    profile_type         TEXT,                        -- 'anonymous' | future types
    interest_tags        TEXT[],
    chat_topics          TEXT[],
    audience_type        TEXT,
    content_type         TEXT,
    interaction_depth    TEXT,                        -- 'overview' | 'deep-dive' | etc.
    sentiment_score      FLOAT,
    sentiment_overall    TEXT,                        -- 'positive' | 'neutral' | 'negative'
    session_started_at   TEXT,
    last_interaction_at  TEXT
);

-- One row per distinct topic discussed within a session (0–5 per session).
CREATE TABLE IF NOT EXISTS event_interactions (
    id                    BIGSERIAL PRIMARY KEY,
    session_id            TEXT REFERENCES session_profiles(session_id),
    interaction_summary   TEXT,                       -- "3-7 word phrase" e.g. "robotics for kids"
    interaction_stage     TEXT DEFAULT 'on',          -- 'pre' | 'on' | 'post'
    event_zone            TEXT,
    event_or_activity     TEXT,
    sentiment_overall     TEXT,
    sentiment_tone        TEXT,
    engagement_level      TEXT,                       -- 'high' | 'moderate' | 'low'
    engagement_behaviour  TEXT,
    audience_type         TEXT,
    content_type          TEXT,
    context_tags          TEXT[],
    timestamp             TIMESTAMPTZ DEFAULT NOW()
);

-- One row per qualitative feedback statement (0–3 per session).
-- feedback_stage: 'opening' | 'deepening' | 'perspective' | 'closing' | 'natural'
--   'natural' = organically captured from regular chat (no feedback agent involved)
-- interaction_stage: 'pre' | 'on' | 'post' — visit timing context
-- sequence: 0-based position within the feedback agent conversation
-- main_question / follow_ups: the agent question(s) that prompted this response
CREATE TABLE IF NOT EXISTS session_feedback (
    id                 BIGSERIAL PRIMARY KEY,
    session_id         TEXT REFERENCES session_profiles(session_id),
    feedback_topic     TEXT,
    feedback_stage     TEXT DEFAULT 'natural',
    sentiment_overall  TEXT,
    sentiment_tone     TEXT,
    feedback_text      TEXT,
    tags               TEXT[],
    sequence           INTEGER,
    main_question      TEXT,
    follow_ups         TEXT[],
    interaction_stage  TEXT,
    timestamp          TIMESTAMPTZ DEFAULT NOW()
);

-- Migration: run this against the live Supabase instance to add the new columns:
-- ALTER TABLE session_feedback
--   ADD COLUMN IF NOT EXISTS sequence          INTEGER,
--   ADD COLUMN IF NOT EXISTS main_question     TEXT,
--   ADD COLUMN IF NOT EXISTS follow_ups        TEXT[],
--   ADD COLUMN IF NOT EXISTS interaction_stage TEXT;


-- =============================================================================
-- SECTION 2: TRENDING CACHE (RUN THIS — new table)
-- Replaces the SQLite trending_cache table that was lost on each Railway restart.
-- Appended once per hour at XX:30 UTC by the background refresh loop in api.py.
-- Each refresh inserts a new row; read path queries ORDER BY cached_at DESC LIMIT 1.
-- =============================================================================

CREATE TABLE IF NOT EXISTS trending_cache (
    id          BIGSERIAL PRIMARY KEY,
    popular_now JSONB    NOT NULL DEFAULT '[]',
    insights    JSONB    NOT NULL DEFAULT '[]',
    live        JSONB,                               -- null or single event object
    cached_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);


-- =============================================================================
-- SECTION 3: EVENT CATALOG (RUN THIS — reference copy for admin access)
-- Source of truth for event data. Search still runs against in-container SQLite
-- for zero-latency LIKE queries, but Supabase holds the canonical copy for
-- admin visibility and future data management without Docker rebuilds.
--
-- To populate: copy INSERT statements from rag/gerf_2026.sql after running this.
-- Note: SQLite PRAGMA and INTEGER PRIMARY KEY AUTOINCREMENT differ from Postgres.
-- =============================================================================

CREATE TABLE IF NOT EXISTS zones (
    zone_id          TEXT PRIMARY KEY,
    title            TEXT NOT NULL,
    venue_name       TEXT,
    venue_address    TEXT,
    lat              FLOAT,
    lng              FLOAT,
    w3w_code         TEXT,
    age_restriction  TEXT,
    amenities        TEXT,
    long_description TEXT,
    zone_url         TEXT
);

CREATE TABLE IF NOT EXISTS events (
    event_id                      TEXT PRIMARY KEY,
    zone_id                       TEXT REFERENCES zones(zone_id),
    title                         TEXT NOT NULL,
    venue_name                    TEXT,
    venue_room                    TEXT,
    venue_address                 TEXT,
    lat                           FLOAT,
    lng                           FLOAT,
    dates                         TEXT,               -- 'Saturday' | 'Sunday' | 'Both' | 'Friday'
    time                          TEXT,               -- '12:00–18:00' | 'multi-slot — see sessions'
    is_multi_slot                 INTEGER DEFAULT 0,
    short_description             TEXT,
    long_description              TEXT,
    experience_type               TEXT,               -- 'Exhibit' | 'Performance' | 'Workshop' | 'Talk & Tour'
    audience_tags                 TEXT,               -- comma-separated
    age_label                     TEXT,
    age_min                       INTEGER,
    age_max                       INTEGER,
    children_must_be_accompanied  INTEGER DEFAULT 0,
    access_step_free              INTEGER,            -- 1=yes, 0=no, NULL=not stated
    access_toilets                INTEGER,
    access_bsl                    INTEGER DEFAULT 0,
    access_captioned              INTEGER DEFAULT 0,
    access_relaxed                INTEGER DEFAULT 0,
    access_notes                  TEXT,
    registration_type             TEXT,               -- 'drop-in' | 'free-ticket' | 'paid-ticket'
    booking_url                   TEXT,
    arrival_notes                 TEXT,
    image_url                     TEXT,
    event_url                     TEXT
);

CREATE TABLE IF NOT EXISTS event_sessions (
    session_id    BIGSERIAL PRIMARY KEY,
    event_id      TEXT NOT NULL REFERENCES events(event_id),
    date          TEXT NOT NULL,                      -- 'Saturday 6 June' | 'Sunday 7 June'
    time_start    TEXT NOT NULL,                      -- 'HH:MM' 24-hour
    time_end      TEXT NOT NULL,
    session_notes TEXT
);


-- =============================================================================
-- SECTION 4: TEST SESSION PROFILES (RUN THIS — test-mode analytics table)
-- Written by parser.py only for sessions where visit_type = 'test'.
-- Mirrors session_profiles with 3 additional fields: username, turn, tool.
-- event_interactions and session_feedback are still written for test sessions.
-- =============================================================================

CREATE TABLE IF NOT EXISTS test_session_profiles (
    session_id           TEXT PRIMARY KEY,
    profile_type         TEXT,
    interest_tags        TEXT[],
    chat_topics          TEXT[],
    audience_type        TEXT,
    content_type         TEXT,
    interaction_depth    TEXT,
    sentiment_score      FLOAT,
    sentiment_overall    TEXT,
    session_started_at   TEXT,
    last_interaction_at  TEXT,
    username             TEXT,        -- echo_name provided at entry (required in test mode)
    turn                 INTEGER,     -- number of user turns in the session
    droppoint            TEXT         -- last agent output type: overview | location | detail | calendar | faq | schedule | feedback
);
