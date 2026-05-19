interface Props {
  gcal_url:    string
  ics_url:     string
  title:       string
  location?:   string | null
  date_label?: string | null
  time_label?: string | null
}

function PinIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
      style={{ flexShrink: 0 }}>
      <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
      <circle cx="12" cy="10" r="3" />
    </svg>
  )
}

function ClockIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
      style={{ flexShrink: 0 }}>
      <circle cx="12" cy="12" r="10" />
      <polyline points="12 6 12 12 16 14" />
    </svg>
  )
}

function CalendarIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
      <line x1="16" y1="2" x2="16" y2="6" />
      <line x1="8" y1="2" x2="8" y2="6" />
      <line x1="3" y1="10" x2="21" y2="10" />
    </svg>
  )
}

function DownloadIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
      <polyline points="7 10 12 15 17 10" />
      <line x1="12" y1="15" x2="12" y2="3" />
    </svg>
  )
}

const _DATE_LABELS: Record<string, string> = {
  Saturday: 'Sat 6 June 2026',
  Sunday:   'Sun 7 June 2026',
  Both:     'Sat–Sun 6–7 June 2026',
  Friday:   'Fri 5 June 2026',
}

export default function InlineCalendarCard({ gcal_url, ics_url, title, location, date_label, time_label }: Props) {
  const dateStr = date_label ? (_DATE_LABELS[date_label] ?? date_label) : null
  const timeStr = time_label ?? null
  const whenStr = [dateStr, timeStr].filter(Boolean).join(', ')

  return (
    <div
      className="w-full bg-white rounded-[18px] border border-echo-100 px-4 py-3"
    >
      {/* Title */}
      <p className="m-0 mb-2 text-echo-900 truncate"
        style={{ fontWeight: 600, fontSize: 14, lineHeight: 1.3 }}>
        {title}
      </p>

      {/* Location row */}
      {location && (
        <div className="flex items-center gap-1.5 mb-1" style={{ color: 'var(--echo-500)' }}>
          <PinIcon />
          <span className="t-small truncate">{location}</span>
        </div>
      )}

      {/* Date/time row */}
      {whenStr && (
        <div className="flex items-center gap-1.5 mb-3" style={{ color: 'var(--echo-500)' }}>
          <ClockIcon />
          <span className="t-small truncate">{whenStr}</span>
        </div>
      )}

      {/* Spacer if no meta rows */}
      {!location && !whenStr && <div className="mb-3" />}

      {/* Action buttons */}
      <div className="flex gap-2">
        <a
          href={gcal_url}
          target="_blank"
          rel="noopener noreferrer"
          className="flex-1 flex items-center justify-center gap-1.5 h-9 rounded-[12px] border text-[12px] font-semibold transition-all active:scale-[0.97]"
          style={{
            background:  'var(--primary-500)',
            borderColor: 'transparent',
            color:       '#fff',
          }}
        >
          <CalendarIcon />
          Google Calender
        </a>

        <a
          href={ics_url}
          target="_blank"
          rel="noopener noreferrer"
          download
          className="flex items-center justify-center gap-1.5 px-4 h-9 rounded-[12px] border text-[12px] font-semibold transition-all active:scale-[0.97]"
          style={{
            background:  'var(--echo-100)',
            borderColor: 'var(--echo-200)',
            color:       'var(--echo-900)',
          }}
        >
          <DownloadIcon />
          Apple / Outlook
        </a>
      </div>
    </div>
  )
}
