interface Props {
  type: 'location'
  url:  string
  name: string
}

function CornerUpRightIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="15 14 20 9 15 4" />
      <path d="M4 20v-7a4 4 0 0 1 4-4h12" />
    </svg>
  )
}

export default function InlineLinkCard({ url, name }: Props) {
  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className="w-full flex items-center gap-3 bg-white rounded-[18px] border border-echo-100 px-4 py-3 no-underline transition-all active:scale-[0.98]"
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
        <CornerUpRightIcon />
      </div>

      {/* Text */}
      <div className="flex flex-col min-w-0 gap-0.5">
        <span className="text-echo-900 truncate"
          style={{ fontWeight: 600, fontSize: 14, lineHeight: 1.3 }}>
          {name}
        </span>
        <span className="t-small truncate" style={{ color: 'var(--echo-500)' }}>
          Open in Google Maps
        </span>
      </div>
    </a>
  )
}
