import { useState } from 'react'
import PageShell from '../components/PageShell'
import AppHeader from '../components/AppHeader'
import InterestTags, { STORAGE_KEY as INTERESTS_KEY } from '../components/InterestTags'
import { savePreferences } from '../api'

function readStoredInterests(): string[] {
  try { return JSON.parse(sessionStorage.getItem(INTERESTS_KEY) || '[]') } catch { return [] }
}

function ClearX({ onClick }: { onClick: () => void }) {
  return (
    <button onClick={onClick} aria-label="Clear"
      className="flex-shrink-0 w-6 h-6 rounded-full bg-echo-100 flex items-center justify-center text-echo-500 hover:bg-echo-300 transition-colors ml-1">
      <svg width="10" height="10" viewBox="0 0 24 24" fill="none"
        stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
      </svg>
    </button>
  )
}

// ── Personalise section ───────────────────────────────────────────────────

function PersonaliseSection({ threadId }: { threadId: string }) {
  const [currentName,      setCurrentName]      = useState(sessionStorage.getItem('echo_name') ?? '')
  const [currentInterests, setCurrentInterests] = useState<string[]>(readStoredInterests)
  const [savedName,        setSavedName]        = useState(sessionStorage.getItem('echo_name') ?? '')
  const [savedInterests,   setSavedInterests]   = useState<string[]>(readStoredInterests)
  const [saveState,        setSaveState]        = useState<'idle' | 'saved'>('idle')

  const isDirty =
    currentName !== savedName ||
    JSON.stringify([...currentInterests].sort()) !== JSON.stringify([...savedInterests].sort())

  async function handleSave() {
    const trimmed = currentName.trim()
    if (trimmed) sessionStorage.setItem('echo_name', trimmed)
    else         sessionStorage.removeItem('echo_name')
    sessionStorage.setItem(INTERESTS_KEY, JSON.stringify(currentInterests))
    try { await savePreferences(threadId, currentInterests) } catch { /* best-effort */ }
    setSavedName(trimmed)
    setSavedInterests(currentInterests)
    setSaveState('saved')
    setTimeout(() => setSaveState('idle'), 2000)
  }

  function handleCancel() {
    setCurrentName(savedName)
    setCurrentInterests(savedInterests)
  }

  const showButtons = isDirty || saveState === 'saved'

  return (
    <>
      <h2 className="t-h2 text-echo-900 m-0">Personalise Your Experience</h2>

      <div className="flex flex-col gap-2">
        {/* Card — no border, shadow only */}
        <div className="rounded-[12px] bg-white px-4 pt-4 pb-4"
          style={{ boxShadow: 'var(--sh-card)' }}>

          {/* Name */}
          <div className="pb-3">
            <label htmlFor="user-name-input" className="m-0 mb-1.5 block" style={{ fontFamily: 'var(--font-main)', fontSize: 12, fontWeight: 600, color: 'var(--echo-300)' }}>
              Your Name
            </label>
            <div className="flex items-center" style={{ minHeight: 24 }}>
              <input
                id="user-name-input"
                type="text"
                value={currentName}
                onChange={e => setCurrentName(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter') handleSave() }}
                placeholder="Enter your name"
                maxLength={40}
                className="flex-1 bg-transparent border-none outline-none t-body text-echo-900 placeholder-echo-500"
              />
              {currentName && <ClearX onClick={() => setCurrentName('')} />}
            </div>
          </div>

          <div className="h-px bg-echo-100" />

          {/* Interests */}
          <div className="pt-4">
            <InterestTags value={currentInterests} onChange={setCurrentInterests} />
          </div>
        </div>

        {/* Buttons — animated with grid-template-rows */}
        <div style={{
          display: 'grid',
          gridTemplateRows: showButtons ? '1fr' : '0fr',
          opacity: showButtons ? 1 : 0,
          transition: showButtons
            ? 'grid-template-rows 0.25s cubic-bezier(0.16, 1, 0.3, 1), opacity 0.2s ease'
            : 'grid-template-rows 0.55s cubic-bezier(0.16, 1, 0.3, 1) 0.1s, opacity 0.45s ease 0.05s',
        }}>
          <div style={{ overflow: 'hidden' }}>
            <div className="flex gap-2">
              <button
                onClick={handleCancel}
                className="btn btn-light btn-lg flex-1"
                style={{
                  opacity:       isDirty ? 1 : 0,
                  pointerEvents: isDirty ? 'auto' : 'none',
                  transition:    'opacity 0.2s ease',
                }}
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={!isDirty && saveState !== 'saved'}
                className={`btn btn-lg flex-1 ${saveState === 'saved' ? 'btn-dark' : 'btn-primary'}`}
              >
                {saveState === 'saved' ? 'Saved' : 'Save Changes'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}

// ── Register section ──────────────────────────────────────────────────────

function RegisterSection() {
  const [email,   setEmail]   = useState('')
  const [consent, setConsent] = useState(false)
  const [sent,    setSent]    = useState(false)

  if (sent) {
    return (
      <>
        <h2 className="t-h2 text-echo-900 m-0">Register Interest</h2>
        <div className="rounded-[12px] bg-white px-4 py-6 flex flex-col items-center gap-3"
          style={{ boxShadow: 'var(--sh-card)' }}>
          <div className="w-12 h-12 rounded-full bg-primary-500 flex items-center justify-center">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
              <path d="M19 6L9.375 17L5 12" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
          <p className="t-h3 text-echo-900 m-0">You're registered!</p>
          <p className="t-body text-echo-500 m-0 text-center">We'll be in touch before the festival.</p>
        </div>
      </>
    )
  }

  return (
    <>
      <h2 className="t-h2 text-echo-900 m-0">Register Interest</h2>
      
      {/* Description */}
      <p className="t-body text-echo-500 m-0 pb-4">
        Get festival updates and news delivered to your inbox.
      </p>


      <div className="rounded-[12px] bg-white px-4 pt-4 pb-4 flex flex-col gap-0"
        style={{ boxShadow: 'var(--sh-card)' }}>
        {/* Email input */}
        <div>
          <label htmlFor="user-email-input" className="m-0 mb-1.5 block" style={{ fontFamily: 'var(--font-main)', fontSize: 12, fontWeight: 600, color: 'var(--echo-300)' }}>
            Your Email
          </label>
          <div className="flex items-center" style={{ minHeight: 24 }}>
            <input
              id="user-email-input"
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="you@example.com"
              className="flex-1 bg-transparent border-none outline-none t-body text-echo-900 placeholder-echo-300"
            />
            {email && <ClearX onClick={() => setEmail('')} />}
          </div>
        </div>
      </div>


      {/* Consent checkbox */}
      <div
        role="checkbox"
        aria-checked={consent}
        tabIndex={0}
        className="flex items-start gap-3 cursor-pointer select-none pt-4 pb-4"
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
        <span className="t-body text-echo-500">
          I agree to receive festival updates and news from the Great Exhibition Road Festival.
        </span>
      </div>

      <button
        onClick={() => { if (email && consent) setSent(true) }}
        disabled={!email || !consent}
        className="btn btn-primary btn-lg w-full"
      >
        Register my interest
      </button>
    </>
  )
}

// ── Page ──────────────────────────────────────────────────────────────────

export default function UserPage({ threadId }: { threadId: string }) {
  const [infoOpen, setInfoOpen] = useState(false)
  const isTestMode = sessionStorage.getItem('echo_visit_type') === 'test'

  return (
    <PageShell>
      <AppHeader />
      <div className="flex-1 overflow-y-auto no-scroll px-5 pt-6 flex flex-col gap-4">

        <PersonaliseSection threadId={threadId} />
        <div style={isTestMode ? { pointerEvents: 'none', opacity: 0.45 } : {}}>
          <RegisterSection />
        </div>

        {/* Footer */}
        <div className="mt-4">
          <div className="h-px bg-echo-200 mb-2" />
          <div className="flex items-center justify-between">
            <span style={{
              fontFamily: 'var(--font-accent)', fontWeight: 700, fontSize: 13,
              letterSpacing: 'var(--tr-accent)', color: 'var(--echo-300)',
            }}>
              ECHO, 2026
            </span>
            <button
              onClick={() => setInfoOpen(o => !o)}
              aria-label="About this research"
              className="flex items-center justify-center transition-colors"
              style={{
                fontFamily: 'var(--font-accent)', fontWeight: 700,
                fontSize: 18,
                color: infoOpen ? 'var(--echo-500)' : 'var(--echo-300)',
                background: 'none',
                border: 'none',
                padding: '4px',
                lineHeight: 1,
              }}
            >
              ⓘ
            </button>
          </div>

          {infoOpen && (
            <div className="mt-3 rounded-[14px] bg-echo-100 px-4 py-4 animate-fade-in">
              <p className="t-h3 text-echo-900 m-0 mb-2">About this research</p>
              <p className="t-body text-echo-500 m-0" style={{ lineHeight: 1.6 }}>
                ECHO is part of an ongoing research project exploring how AI assistants
                can enhance visitor experience at large-scale public festivals. Your
                interactions help us understand what people want to know and discover.
              </p>
              <p className="t-small text-echo-400 mt-3 m-0">
                Data is anonymised and used only for academic research purposes.
              </p>
            </div>
          )}
        </div>

        <div className="pb-safe flex-shrink-0" />
      </div>
    </PageShell>
  )
}
