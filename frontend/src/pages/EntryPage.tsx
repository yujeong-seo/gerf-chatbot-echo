import { useState } from 'react'
import type { ReactNode } from 'react'
import { useNavigate } from 'react-router-dom'
import PageShell from '../components/PageShell'
import Logo from '../components/Logo'
import { EVENT_START, EVENT_END } from '../constants'

type VisitType = 'test' | 'pre' | 'on' | 'post'

const fmtDate = (d: Date) =>
  new Intl.DateTimeFormat('en-US', { month: 'long', day: '2-digit', year: 'numeric' }).format(d)

function getEventStatus() {
  const now = new Date()
  if (now < EVENT_START) {
    return { phase: 'before' as const, daysUntil: Math.ceil((EVENT_START.getTime() - now.getTime()) / 86400000) }
  }
  if (now <= EVENT_END) {
    return {
      phase:     'live' as const,
      dayNum:    Math.floor((now.getTime() - EVENT_START.getTime()) / 86400000) + 1,
      totalDays: Math.ceil((EVENT_END.getTime() - EVENT_START.getTime()) / 86400000),
    }
  }
  return { phase: 'after' as const, daysSince: Math.ceil((now.getTime() - EVENT_END.getTime()) / 86400000) }
}

function getDefaultVisitType(): VisitType {
  const now = new Date()
  if (now < EVENT_START) return 'test' // should return to 'pre' once the testing is ended
  if (now <= EVENT_END)  return 'on'
  return 'post'
}

// ── Sub-components ────────────────────────────────────────────────────────

function RadioRow({ label, selected, onClick }: { label: string; selected: boolean; onClick: () => void }) {
  return (
    <button onClick={onClick} className="flex items-center gap-3 w-full text-left">
      <div className={[
        'w-5 h-5 rounded-full flex-shrink-0 transition-all',
        selected ? 'border-[6px] border-white' : 'border-2 border-white/40',
      ].join(' ')} />
      <span className="t-body-m text-white">{label}</span>
    </button>
  )
}

// White circle nav button (→ / ←)
function CircleNavBtn({ onClick, disabled, left = false }: {
  onClick: () => void; disabled?: boolean; left?: boolean
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className="rounded-full flex items-center justify-center flex-shrink-0 transition-all active:scale-95"
      style={{
        width:      52,
        height:     52,
        background: 'linear-gradient(180deg, #F8F9F8 0%, #ECEDEB 100%)',
        boxShadow:  '0 0 10px rgba(0,0,0,0.25)',
        opacity:    disabled ? 0.4 : 1,
      }}
    >
      {left ? (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none"
          stroke="var(--echo-900)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <line x1="19" y1="12" x2="5" y2="12" /><polyline points="12 19 5 12 12 5" />
        </svg>
      ) : (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none"
          stroke="var(--echo-900)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <line x1="5" y1="12" x2="19" y2="12" /><polyline points="12 5 19 12 12 19" />
        </svg>
      )}
    </button>
  )
}

// Frosted glass pill button (Back / Skip)
function FrostedBtn({ children, onClick, fixedW }: {
  children: ReactNode; onClick: () => void; fixedW?: boolean
}) {
  return (
    <button
      onClick={onClick}
      className="flex items-center justify-center flex-shrink-0 transition-all active:scale-95"
      style={{
        background:   'rgba(255,255,255,0.15)',
        border:       '1px solid rgba(255,255,255,0.22)',
        borderRadius: 26,
        height:       52,
        width:        fixedW ? 52 : undefined,
        padding:      fixedW ? 0 : '0 22px',
      }}
    >
      {children}
    </button>
  )
}

function ProgressDots({ step }: { step: 1 | 2 }) {
  return (
    <div className="flex items-center justify-center gap-2">
      {([1, 2] as const).map(s => (
        <div key={s} style={{
          width:        s === step ? 32 : 12,
          height:       12,
          borderRadius: 10,
          background:   s === step ? 'linear-gradient(90deg, #5f7e9b, #2e665e)' : '#a5a5a5',
          transition:   'all 0.3s ease',
        }} />
      ))}
    </div>
  )
}

// ── Page ──────────────────────────────────────────────────────────────────
export default function EntryPage() {
  const navigate = useNavigate()
  const status   = getEventStatus()

  const [step,      setStep]      = useState<1 | 2>(1)
  const [visitType, setVisitType] = useState<VisitType>(getDefaultVisitType())
  const [name,      setName]      = useState('')

  function finish(skipName: boolean) {
    sessionStorage.setItem('echo_onboarded',  '1')
    sessionStorage.setItem('echo_visit_type', visitType)
    if (!skipName && name.trim()) sessionStorage.setItem('echo_name', name.trim())
    navigate('/chat')
  }

  const visitLabel = visitType === 'test' ? 'Testing' : visitType === 'pre' ? 'Pre-visit' : visitType === 'on' ? 'On-visit' : 'Post-visit'

  return (
    <PageShell>
      <div className="flex-1 flex flex-col px-6 pt-8 pb-4 gap-5 min-h-0 justify-center">

        {/* ── Logo header ── */}
        <div className="flex flex-col items-center pb-6 gap-4 flex-shrink-0">
          <p className="t-small text-echo-900 m-0 text-center">Event Conversations. Heard. Ongoing.</p>
          <div className="flex items-center gap-3">
            <Logo size={34} color="var(--echo-900)" />
            <span style={{
              fontFamily:    'var(--font-accent)',
              fontWeight:    700,
              fontSize:      36,
              color:         'var(--echo-900)',
              lineHeight:    1,
            }}>
              ECHO
            </span>
          </div>
        </div>

        {/* ── Card ── */}
        <div
          className="entry-card-bg flex-1 rounded-[20px] overflow-hidden min-h-0 mx-auto w-full"
          style={{ 
            minHeight: 380,
            maxHeight: 500,
            maxWidth: 400,
            boxShadow: '0 4px 20px 0 rgba(0, 0, 0, 0.25)',
          }}
        >
          <div className="h-full flex flex-col px-8 pt-8 pb-8">

            {step === 1 ? (
              <>
                {/* Date — top-right */}
                <div className="flex justify-end mb-6">
                  <span className="t-small text-white" style={{ opacity: 0.8 }}>
                    {fmtDate(new Date())}
                  </span>
                </div>

                {/* Countdown */}
                <div>
                  {status.phase === 'before' && (
                    <>
                      <p className="t-body text-white m-0 mb-1" style={{ opacity: 1 }}>
                        Great Exhibition Road Festival in...
                      </p>
                      <div className="flex items-baseline gap-2">
                        <span style={{ fontFamily: 'var(--font-accent)', fontWeight: 700, fontSize: 52, lineHeight: 1.4, color: 'white' }}>
                          {status.daysUntil} {status.daysUntil === 1 ? 'Day' : 'Days'}
                        </span>
                      </div>
                    </>
                  )}
                  {status.phase === 'live' && (
                    <>
                      <p className="t-body text-white m-0 mb-1" style={{ opacity: 1 }}>Great Exhibition Road Festival</p>
                      <div className="flex items-baseline gap-2">
                        <span style={{ fontFamily: 'var(--font-accent)', fontWeight: 700, fontSize: 52, lineHeight: 1.1, color: 'white' }}>
                          Day {status.dayNum}
                        </span>
                      </div>
                    </>
                  )}
                  {status.phase === 'after' && (
                    <>
                      <p className="t-body text-white m-0 mb-1" style={{ opacity: 1 }}>Great Exhibition Road Festival ended</p>
                      <div className="flex items-baseline gap-2">
                        <span style={{ fontFamily: 'var(--font-accent)', fontWeight: 700, fontSize: 52, lineHeight: 1.1, color: 'white' }}>
                          D+{status.daysSince}
                        </span>
                      </div>
                    </>
                  )}
                </div>

                {/* Spacer */}
                <div className="flex-1" />
                
                <div className="flex flex-row justify-between items-end">
                  {/* Radio buttons */}
                  <div className="flex flex-col gap-4 mb-6">
                    <RadioRow label="Pre-visit"  selected={visitType === 'pre'}  onClick={() => setVisitType('pre')}  />
                    <RadioRow label="On-visit"   selected={visitType === 'on'}   onClick={() => setVisitType('on')}   />
                    <RadioRow label="Post-visit" selected={visitType === 'post'} onClick={() => setVisitType('post')} />
                  </div>

                  {/* → nav */}
                  <div className="flex justify-end">
                    <CircleNavBtn onClick={() => setStep(2)} />
                  </div>
                </div>
              </>
            ) : (
              <>
                {/* Top row: visit label left, event date right */}
                <div className="flex items-center justify-between mb-10">
                  <span className="t-small text-white" style={{
                    fontFamily: 'var(--font-main)',
                    fontWeight: 600,
                  }}>
                    {visitLabel}
                  </span>
                  <span className="t-small text-white" style={{ opacity: 0.8 }}>
                    {fmtDate(new Date())}
                  </span>
                </div>

                {/* ECHO greeting — inline logo */}
                <p style={{
                  fontFamily:  'var(--font-accent)',
                  fontWeight:  700,
                  fontSize:    20,
                  lineHeight:  1.6,
                  color:       'rgba(255,255,255,0.75)',
                  margin:      0,
                }}>
                  Hi, I am ECHO{' '}
                  <span style={{ display: 'inline-block', verticalAlign: 'middle', margin: 3 }}>
                    <Logo size={24} color="rgba(255,255,255,0.75)" />
                  </span>
                  {' '}your event assistant today.
                </p>

                {/* Name question + input */}
                <div className="mt-7">
                  <p style={{
                    fontFamily: 'var(--font-accent)',
                    fontWeight: 700,
                    fontSize:   20,
                    lineHeight: 1.4,
                    color:      'white',
                    margin:     '0 0 24px',
                  }}>
                    How can I call you?
                  </p>
                  <div
                    className={`rounded-[12px] bg-white flex items-center px-4 transition-opacity focus-within:opacity-100 ${name ? 'opacity-100' : 'opacity-60'}`}
                    style={{ height: 48 }}
                  >
                    <input
                      type="text"
                      value={name}
                      onChange={e => setName(e.target.value)}
                      onKeyDown={e => { if (e.key === 'Enter' && name.trim()) finish(false) }}
                      placeholder="Your name"
                      maxLength={40}
                      autoFocus
                      className="flex-1 bg-transparent border-none outline-none t-body text-echo-900 placeholder-echo-300"
                    />
                  </div>
                </div>

                {/* Spacer */}
                <div className="flex-1" />

                {/* Bottom nav: frosted ← | frosted Skip + white → */}
                <div className="flex items-center justify-between">
                  <FrostedBtn onClick={() => setStep(1)} fixedW>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none"
                      stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <line x1="19" y1="12" x2="5" y2="12" /><polyline points="12 19 5 12 12 5" />
                    </svg>
                  </FrostedBtn>
                  <div className="flex items-center gap-3">
                    {visitType !== 'test' && (
                      <FrostedBtn onClick={() => finish(true)}>
                        <span className="t-body-m text-white">Skip</span>
                      </FrostedBtn>
                    )}
                    <CircleNavBtn onClick={() => finish(false)} disabled={!name.trim()} />
                  </div>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Progress dots */}
        <div className="flex-shrink-0">
          <ProgressDots step={step} />
        </div>

        <div className="pb-safe flex-shrink-0" />
      </div>
    </PageShell>
  )
}
