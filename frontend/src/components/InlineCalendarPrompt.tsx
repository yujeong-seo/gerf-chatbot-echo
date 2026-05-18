import { useState } from 'react'
import InlineCalendarCard from './InlineCalendarCard'

interface Props {
  gcal_url:    string
  ics_url:     string
  title:       string
  location?:   string | null
  date_label?: string | null
  time_label?: string | null
}

function CalendarPlusIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
      <line x1="16" y1="2" x2="16" y2="6" />
      <line x1="8" y1="2" x2="8" y2="6" />
      <line x1="3" y1="10" x2="21" y2="10" />
      <line x1="12" y1="15" x2="12" y2="19" />
      <line x1="10" y1="17" x2="14" y2="17" />
    </svg>
  )
}

export default function InlineCalendarPrompt(props: Props) {
  const [state, setState] = useState<'prompt' | 'expanded' | 'dismissed'>('prompt')

  if (state === 'dismissed') return null

  if (state === 'expanded') {
    return <InlineCalendarCard {...props} />
  }

  return (
    <div
      className="w-full bg-white rounded-[18px] border border-[rgba(34,36,34,0.07)] px-4 py-3"
      style={{ boxShadow: 'var(--sh-bubble)' }}
    >
      <p className="m-0 mb-0.5 text-echo-900 truncate"
        style={{ fontWeight: 600, fontSize: 14, lineHeight: 1.3 }}>
        {props.title}
      </p>
      <p className="m-0 mb-3 t-small" style={{ color: 'var(--echo-500)' }}>
        Add this to your calendar?
      </p>
      <div className="flex gap-2">
        <button
          onClick={() => setState('expanded')}
          className="flex-1 btn btn-primary btn-sm flex items-center justify-center gap-1.5"
        >
          <CalendarPlusIcon />
          Add to calendar
        </button>
        <button
          onClick={() => setState('dismissed')}
          className="btn btn-light btn-sm px-4"
        >
          Not now
        </button>
      </div>
    </div>
  )
}
