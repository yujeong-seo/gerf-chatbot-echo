import ReactMarkdown from 'react-markdown'
import remarkGfm     from 'remark-gfm'

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

/** Ensure a blank line separates the last list item from any follow-up sentence. */
function normalizeMarkdown(text: string): string {
  return text.replace(/(- [^\n]+)\n([^-\n*#> \t])/g, '$1\n\n$2')
}

export default function ChatMessage({ role, content, timestamp, eventUrl, eventName }: Props) {
  const isUser = role === 'user'

  const bubble = (
    <div
      className={`max-w-[78%] px-4 py-[11px] rounded-[18px] t-body min-w-0 ${
        isUser
          ? 'text-white rounded-br-[6px] border border-[rgba(20,40,38,0.10)]'
          : 'bg-white text-echo-900 rounded-bl-[6px] border border-[rgba(34,36,34,0.05)]'
      }`}
      style={{
        background:   isUser ? 'var(--primary-500)' : undefined,
        boxShadow:    'var(--sh-bubble)',
        wordBreak:    'break-word',
        overflowWrap: 'break-word',
      }}
    >
      <div className="chat-md">
        <ReactMarkdown remarkPlugins={[remarkGfm]}>
          {isUser ? content : normalizeMarkdown(content)}
        </ReactMarkdown>
      </div>

      {/* Event source citation — only for assistant messages */}
      {!isUser && eventUrl && (
        <a
          href={eventUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-1.5 mt-2 pt-2 no-underline"
          style={{ borderTop: '1px solid rgba(34,36,34,0.06)' }}
        >
          <span className="text-echo-300 flex-shrink-0"><ExternalLinkIcon /></span>
          <span className="t-small text-echo-300 truncate">{eventName}</span>
        </a>
      )}
    </div>
  )

  const time = timestamp ? (
    <span className="t-small text-echo-500 flex-shrink-0 self-end mb-0.5" style={{ minWidth: 32 }}>
      {timestamp}
    </span>
  ) : null

  return (
    <div className={`flex items-end gap-2 ${isUser ? 'justify-end' : 'justify-start'}`}>
      {isUser ? <>{time}{bubble}</> : <>{bubble}{time}</>}
    </div>
  )
}
