import { useState } from 'react'

interface Props {
  threadId: string
}

function ClearX({ onClick }: { onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      aria-label="Clear"
      className="flex-shrink-0 w-6 h-6 rounded-full bg-echo-100 flex items-center justify-center text-echo-500 hover:bg-echo-300 transition-colors ml-1"
    >
      <svg width="10" height="10" viewBox="0 0 24 24" fill="none"
        stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
      </svg>
    </button>
  )
}

export default function InlineEmailPrompt({ threadId: _threadId }: Props) {
  const [email,   setEmail]   = useState('')
  const [consent, setConsent] = useState(false)
  const [sent,    setSent]    = useState(false)

  if (sent) {
    return (
      <div className="w-full bg-white rounded-[18px] border border-echo-100 px-4 py-4">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-primary-500 flex-shrink-0 flex items-center justify-center">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
              <path d="M19 6L9.375 17L5 12" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
          <div>
            <p className="t-body-m text-echo-900 m-0">You're registered!</p>
            <p className="t-small text-echo-500 m-0">We'll be in touch before the festival.</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="w-full bg-white rounded-[18px] border border-echo-100 px-4 py-3">
      {/* Header */}
      <div className="mb-1">
        <span className="t-body-m text-echo-900">Register your email</span>
      </div>
      <p className="t-small text-echo-500 m-0 mb-3">
        Get festival updates and news delivered to your inbox.
      </p>

      {/* Email input */}
      <div
        className="rounded-xl border border-echo-100 px-3 py-2 mb-3 flex items-center"
        style={{ background: 'var(--echo-50)' }}
      >
        <input
          type="email"
          value={email}
          onChange={e => setEmail(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter' && email && consent) setSent(true) }}
          placeholder="you@example.com"
          className="flex-1 bg-transparent border-none outline-none t-body text-echo-900 placeholder-echo-400"
        />
        {email && <ClearX onClick={() => setEmail('')} />}
      </div>

      {/* Consent */}
      <div
        role="checkbox"
        aria-checked={consent}
        tabIndex={0}
        className="flex items-start gap-3 cursor-pointer select-none mb-3"
        onClick={() => setConsent(c => !c)}
        onKeyDown={e => { if (e.key === ' ' || e.key === 'Enter') { e.preventDefault(); setConsent(c => !c) } }}
      >
        <div className={[
          'w-5 h-5 rounded-[5px] border-2 flex-shrink-0 mt-0.5 flex items-center justify-center transition-colors',
          consent ? 'bg-primary-500 border-primary-500' : 'bg-white border-echo-300',
        ].join(' ')}>
          {consent && (
            <svg width="10" height="10" viewBox="0 0 24 24" fill="none">
              <path d="M19 6L9.375 17L5 12" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          )}
        </div>
        <span className="t-small text-echo-500">
          I agree to receive festival updates and news from the Great Exhibition Road Festival.
        </span>
      </div>

      {/* Submit */}
      <button
        onClick={() => { if (email && consent) setSent(true) }}
        disabled={!email || !consent}
        className="btn btn-primary btn-sm w-full"
      >
        Register my interest
      </button>
    </div>
  )
}
