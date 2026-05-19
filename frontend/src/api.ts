import type { InlineCalendar, Keyword } from './types'

export const BASE_URL = import.meta.env.VITE_API_URL ?? ''

// ── Mocks ─────────────────────────────────────────────────────────────────

export const MOCK_KEYWORDS: Keyword[] = [
  { id: '1', text: 'Robotics',          weight: 5 },
  { id: '2', text: 'Live Music',         weight: 4 },
  { id: '3', text: 'Art Walk',           weight: 4 },
  { id: '4', text: 'Family Activities',  weight: 3 },
  { id: '5', text: 'Science Demos',      weight: 3 },
  { id: '6', text: 'Food & Drink',       weight: 2 },
]

export async function fetchTrendingKeywords(): Promise<Keyword[]> {
  try {
    const res = await fetch(`${BASE_URL}/api/trending`)
    if (!res.ok) throw new Error()
    const data = await res.json()
    return data.popular_now?.length ? data.popular_now : MOCK_KEYWORDS
  } catch {
    return MOCK_KEYWORDS
  }
}

export interface InsightItem { title: string; venue: string; time: string; description: string; count: number; tags: string[] }

export async function fetchTrending(): Promise<{ popular_now: Keyword[]; insights: InsightItem[] }> {
  try {
    const res = await fetch(`${BASE_URL}/api/trending`)
    if (!res.ok) throw new Error()
    const data = await res.json()
    return {
      popular_now: data.popular_now?.length ? data.popular_now : MOCK_KEYWORDS,
      insights:    data.insights ?? [],
    }
  } catch {
    return { popular_now: MOCK_KEYWORDS, insights: [] }
  }
}

// ── Chat ──────────────────────────────────────────────────────────────────

export interface ChatApiResponse {
  content:          string
  keywords:         string[]
  calendar?:        InlineCalendar | null
  location_url?:    string | null
  location_name?:   string | null
  location_venue?:  string | null
  event_url?:       string | null
  event_name?:      string | null
  booking?:         { url: string; title: string; subtitle: string; is_free: boolean; arrival_notes?: string | null } | null
  is_feedback?:     boolean
}

export async function sendChatMessage(
  content: string,
  threadId: string,
  options?: { feedbackTrigger?: boolean },
): Promise<ChatApiResponse> {
  const visitType = sessionStorage.getItem('echo_visit_type') ?? ''
  const res = await fetch(`${BASE_URL}/api/chat`, {
    method:  'POST',
    headers: { 'Content-Type': 'application/json' },
    body:    JSON.stringify({
      message:          content,
      thread_id:        threadId,
      feedback_trigger: options?.feedbackTrigger ?? false,
      visit_type:       visitType,
      username:         sessionStorage.getItem('echo_name') ?? '',
    }),
  })
  if (!res.ok) throw new Error(`Chat API error: ${res.status}`)
  return res.json()
}

// ── Preferences ───────────────────────────────────────────────────────────

export async function savePreferences(threadId: string, interestIds: string[]): Promise<void> {
  const res = await fetch(`${BASE_URL}/api/preferences`, {
    method:  'POST',
    headers: { 'Content-Type': 'application/json' },
    body:    JSON.stringify({ thread_id: threadId, interest_ids: interestIds }),
  })
  if (!res.ok) throw new Error(`Preferences API error: ${res.status}`)
}

export async function registerInterest(
  _email: string,
  _consent: boolean,
): Promise<void> {
  throw new Error('Not implemented')
}

export async function updatePreferences(_interests: string[]): Promise<void> {
  throw new Error('Not implemented')
}
