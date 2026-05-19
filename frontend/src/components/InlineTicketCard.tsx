interface Props {
  url:            string
  title:          string
  subtitle:       string
  is_free:        boolean
  arrival_notes?: string | null
}

function TicketIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M2 9a3 3 0 0 1 0 6v2a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-2a3 3 0 0 1 0-6V7a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2v2z" />
      <line x1="9" y1="12" x2="15" y2="12" />
    </svg>
  )
}

export default function InlineTicketCard({ url, title, subtitle, is_free, arrival_notes }: Props) {
  return (
    <div
      className="w-full bg-white rounded-[18px] border border-echo-100"
    >
      <a
        href={url}
        target="_blank"
        rel="noopener noreferrer"
        className="flex items-center gap-3 px-4 py-3 no-underline transition-all active:scale-[0.98]"
      >
        {/* Square teal icon */}
        <div
          className="flex-shrink-0 flex items-center justify-center"
          style={{
            width:        40,
            height:       40,
            borderRadius: 12,
            background:   'var(--primary-500)',
            color:        '#fff',
          }}
        >
          <TicketIcon />
        </div>

        {/* Text */}
        <div className="flex flex-col min-w-0 flex-1">
          <div className="flex items-center gap-2 min-w-0">
            <span className="text-echo-900 truncate"
              style={{ fontWeight: 600, fontSize: 14, lineHeight: 1.3 }}>
              {title}
            </span>
            {!is_free && (
              <span
                className="flex-shrink-0 text-[10px] font-semibold px-1.5 py-0.5 rounded-full"
                style={{
                  background: 'rgba(180,60,40,0.08)',
                  color:      '#b43c28',
                  lineHeight: 1.4,
                }}
              >
                Paid
              </span>
            )}
          </div>
          <span className="t-small truncate" style={{ color: 'var(--echo-500)' }}>
            {subtitle}
          </span>
        </div>
      </a>

      {/* Arrival notes */}
      {arrival_notes && (
        <div
          className="px-4 pb-3 t-small"
          style={{ color: 'var(--echo-500)', borderTop: '1px solid rgba(34,36,34,0.06)', paddingTop: 10, marginTop: -2 }}
        >
          {arrival_notes}
        </div>
      )}
    </div>
  )
}
