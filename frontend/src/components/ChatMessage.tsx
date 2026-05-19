import ReactMarkdown from 'react-markdown'
import remarkGfm     from 'remark-gfm'
import Logo          from './Logo'

interface Props {
  role:       'user' | 'assistant'
  content:    string
  timestamp?: string
  eventUrl?:  string
  eventName?: string
}

function ExternalLinkIcon() {
  return (
    <svg width="11" height="11" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
      <polyline points="15 3 21 3 21 9" />
      <line x1="10" y1="14" x2="21" y2="3" />
    </svg>
  )
}

function normalizeMarkdown(text: string): string {
  return text.replace(/(- [^\n]+)\n([^-\n*#> \t])/g, '$1\n\n$2')
}

export default function ChatMessage({ role, content, timestamp, eventUrl, eventName }: Props) {
  const isUser = role === 'user'

  const bubble = (
    <div
      style={{
        maxWidth:     '78%',
        padding:      '11px 16px',
        borderRadius: isUser ? '18px 18px 6px 18px' : '6px 18px 18px 18px',
        background:   isUser ? 'var(--primary-500)' : '#FFFFFF',
        border:       isUser ? 'none' : '1px solid #F0F0F0',
        wordBreak:    'break-word',
        overflowWrap: 'break-word',
        fontFamily:   'var(--font-main)',
        fontSize:     14,
        fontWeight:   400,
        letterSpacing: 'var(--tr-main)',
        lineHeight:   1.5,
        color:        isUser ? '#FFFFFF' : 'var(--stone-900)',
      }}
    >
      <div className="chat-md">
        <ReactMarkdown remarkPlugins={[remarkGfm]}>
          {isUser ? content : normalizeMarkdown(content)}
        </ReactMarkdown>
      </div>

      {!isUser && eventUrl && (
        <a
          href={eventUrl}
          target="_blank"
          rel="noopener noreferrer"
          style={{
            display:       'flex',
            alignItems:    'center',
            gap:           6,
            marginTop:     8,
            paddingTop:    8,
            borderTop:     '1px solid rgba(34,36,34,0.06)',
            textDecoration: 'none',
          }}
        >
          <span style={{ color: 'var(--stone-300)', flexShrink: 0 }}><ExternalLinkIcon /></span>
          <span style={{
            fontFamily: 'var(--font-main)', fontSize: 12, color: 'var(--stone-300)',
            overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
          }}>
            {eventName}
          </span>
        </a>
      )}
    </div>
  )

  if (isUser) {
    return (
      <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'flex-end', gap: 8 }}>
        {timestamp && (
          <span style={{
            fontFamily: 'var(--font-main)', fontSize: 12, color: 'var(--stone-500)',
            flexShrink: 0, alignSelf: 'flex-end', marginBottom: 2,
          }}>
            {timestamp}
          </span>
        )}
        {bubble}
      </div>
    )
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6, alignItems: 'flex-start' }}>
      {/* Logo avatar + label row */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <Logo size={16} color="var(--stone-500)" />
        <span style={{
          fontFamily:    'var(--font-main)',
          fontSize:      12,
          fontWeight:    500,
          color:         'var(--stone-500)',
          letterSpacing: 'var(--tr-main)',
        }}>
          ECHO{timestamp ? ` · ${timestamp}` : ''}
        </span>
      </div>
      {bubble}
    </div>
  )
}
