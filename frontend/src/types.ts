export interface Keyword {
  id: string
  text: string
  weight: 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10   // 10 = most popular
}

// ── Inline UI card types ──────────────────────────────────────────────────

export interface InlineCalendar {
  type:        'calendar'
  gcal_url:    string
  ics_url:     string
  title:       string
  location?:   string | null
  date_label?: string | null
  time_label?: string | null
}

export interface InlineLink {
  type: 'location'
  url:  string
  name: string
}

export interface InlineInterest {
  type:     'interest'
  threadId: string
}

export interface InlineEmail {
  type:     'email'
  threadId: string
}

export interface InlineTicket {
  type:           'ticket'
  url:            string
  title:          string
  subtitle:       string
  is_free:        boolean
  arrival_notes?: string | null
}

export type InlineCard = InlineCalendar | InlineLink | InlineInterest | InlineTicket | InlineEmail

// ── Chat ──────────────────────────────────────────────────────────────────

export interface Message {
  id:         string
  role:       'user' | 'assistant'
  content:    string
  timestamp:  Date
  inline?:    InlineCard
  isFeedback?: boolean
  eventUrl?:  string
  eventName?: string
}

export interface Interest {
  id: string
  label: string
}

export interface InsightItem {
  id?:         string
  title:       string
  venue:       string
  time:        string
  description: string
  count:       number
  tags:        string[]
}

export type EventPhase = 'before' | 'live' | 'after'

export interface EventStatus {
  phase: EventPhase
  daysUntil?: number   // phase === 'before'
  dayNum?: number      // phase === 'live', 1-indexed
  totalDays?: number   // phase === 'live'
}
