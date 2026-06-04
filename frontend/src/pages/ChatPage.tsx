import { useState, useEffect, useRef } from 'react'
import { useSearchParams } from 'react-router-dom'
import PageShell           from '../components/PageShell'
import AppHeader           from '../components/AppHeader'
import ChatMessage         from '../components/ChatMessage'
import ChatInput           from '../components/ChatInput'
import Logo                from '../components/Logo'
import InlineCalendarCard  from '../components/InlineCalendarCard'
import InlineLinkCard      from '../components/InlineLinkCard'
import InlineTicketCard    from '../components/InlineTicketCard'
import InlineInterestPrompt from '../components/InlineInterestPrompt'
import { sendChatMessage } from '../api'
import type { Message, InlineCard } from '../types'
import chatExploreIcon  from '../assets/icons/chat-explore.svg'
import chatFaqIcon      from '../assets/icons/chat-faq.svg'
import chatFeedbackIcon from '../assets/icons/chat-feedback.svg'

// ── Option cards (pre-chat welcome) ───────────────────────────────────────

interface OptionDef {
  icon:             string
  title:            string
  subtitle:         string
  query:            string
  feedbackTrigger?: boolean
}

const cardStyle: React.CSSProperties = {
  background:   '#FFFFFF',
  border:       '1px solid #F0F0F0',
  boxShadow:    '0 0 4px rgba(0,0,0,0.10)',
  cursor:       'pointer',
  transition:   'transform 0.1s',
  textAlign:    'left',
}

function OptionCard({ option, onClick }: { option: OptionDef; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      style={{
        ...cardStyle,
        display:       'flex',
        flexDirection: 'column',
        alignItems:    'flex-start',
        gap:           16,
        padding:       20,
        borderRadius:  12,
      }}
    >
      <img src={option.icon} alt="" width={44} height={44} />
      <div>
        <p style={{
          margin:        '0 0 4px',
          fontFamily:    'var(--font-accent)',
          fontWeight:    700,
          letterSpacing: 'var(--tr-accent)',
          fontSize:      18,
          lineHeight:    1.2,
          color:         'var(--stone-900)',
        }}>
          {option.title}
        </p>
        <p style={{ margin: 0, fontFamily: 'var(--font-main)', fontSize: 14, color: 'var(--stone-500)' }}>
          {option.subtitle}
        </p>
      </div>
    </button>
  )
}

function OptionRow({ option, onClick }: { option: OptionDef; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      style={{
        ...cardStyle,
        display:     'flex',
        flexDirection: 'row',
        alignItems:  'center',
        gap:         16,
        width:       '100%',
        padding:     16,
        borderRadius: 12,
      }}
    >
      <img src={option.icon} alt="" width={44} height={44} style={{ flexShrink: 0 }} />
      <div>
        <p style={{
          margin:        '0 0 4px',
          fontFamily:    'var(--font-accent)',
          fontWeight:    700,
          letterSpacing: 'var(--tr-accent)',
          fontSize:      17,
          lineHeight:    1.2,
          color:         'var(--stone-900)',
        }}>
          {option.title}
        </p>
        <p style={{ margin: 0, fontFamily: 'var(--font-main)', fontSize: 12, color: 'var(--stone-500)' }}>
          {option.subtitle}
        </p>
      </div>
    </button>
  )
}

function getOptions(): { options: OptionDef[]; visitType: string } {
  const visitType = sessionStorage.getItem('echo_visit_type') ?? 'pre'
  const explore: OptionDef = {
    icon: chatExploreIcon, title: 'Explore Activities',
    subtitle: 'Planning for your visit',
    query: 'What activities are available at GERF?',
  }
  const faq: OptionDef = {
    icon: chatFaqIcon, title: 'FAQ Query',
    subtitle: 'Get quick answers',
    query: 'What should I know about visiting the festival? Things like travel, parking, accessibility and food.',
  }
  const feedback: OptionDef = {
    icon: chatFeedbackIcon, title: 'Share your experience',
    subtitle: 'Post-event feedback',
    query: "I'd like to share my experience at GERF.",
    feedbackTrigger: true,
  }
  if (visitType === 'on' || visitType === 'test') return { options: [explore, faq, feedback], visitType }
  if (visitType === 'post') return { options: [explore, feedback], visitType }
  return { options: [explore, faq], visitType }
}

// ── Inline card renderer ──────────────────────────────────────────────────

function InlineCardRenderer({ card, onSendMessage }: { card: InlineCard; onSendMessage?: (text: string) => void }) {
  if (card.type === 'calendar') {
    return (
      <InlineCalendarCard
        gcal_url={card.gcal_url} ics_url={card.ics_url} title={card.title}
        location={card.location} date_label={card.date_label} time_label={card.time_label}
      />
    )
  }
  if (card.type === 'location') return <InlineLinkCard type="location" url={card.url} name={card.name} />
  if (card.type === 'ticket') {
    return (
      <InlineTicketCard
        url={card.url} title={card.title} subtitle={card.subtitle}
        is_free={card.is_free} arrival_notes={card.arrival_notes}
      />
    )
  }
  if (card.type === 'interest') return <InlineInterestPrompt threadId={card.threadId} onMessage={onSendMessage} />
  return null
}

// ── Bottom options (drawer) ───────────────────────────────────────────────

const DRAWER_OPTIONS = [
  { label: 'Modify interest tags', inline: 'interest' as const },
  { label: 'Leave feedback',       inline: null },
]

const DRAWER_ICONS: Record<string, React.ReactNode> = {
  'Modify interest tags': (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none"
      stroke="var(--stone-600)" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"/>
      <line x1="7" y1="7" x2="7.01" y2="7"/>
    </svg>
  ),
  'Leave feedback': (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none"
      stroke="var(--stone-600)" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
    </svg>
  ),
}

// ── Page ──────────────────────────────────────────────────────────────────

interface Props {
  messages:    Message[]
  setMessages: React.Dispatch<React.SetStateAction<Message[]>>
  threadId:    string
}

export default function ChatPage({ messages, setMessages, threadId }: Props) {
  const [searchParams] = useSearchParams()
  const prefillQuery   = searchParams.get('q') ?? ''

  const [loading,     setLoading]     = useState(false)
  const [inputValue,  setInputValue]  = useState('')
  const [optionsOpen, setOptionsOpen] = useState(false)
  const bottomRef    = useRef<HTMLDivElement>(null)
  const bottomBarRef = useRef<HTMLDivElement>(null)
  const [barHeight,  setBarHeight]    = useState(0)

  const { options, visitType } = getOptions()
  const userName    = sessionStorage.getItem('echo_name')
  const hasMessages = messages.length > 0

  const fmt = (d: Date) => d.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })

  // Measure bottom bar for scroll padding
  useEffect(() => {
    const el = bottomBarRef.current
    if (!el) return
    const ro = new ResizeObserver(() => setBarHeight(el.offsetHeight))
    ro.observe(el)
    return () => ro.disconnect()
  }, [])

  // Fire community query / prefill
  const prefillFired = useRef(false)
  useEffect(() => {
    const communityRaw = sessionStorage.getItem('echo_community_query')
    if (communityRaw) {
      sessionStorage.removeItem('echo_community_query')
      try {
        const { display, agent } = JSON.parse(communityRaw)
        sendMessage(display, agent)
      } catch { /* ignore */ }
      return
    }
    if (prefillQuery && !prefillFired.current) {
      prefillFired.current = true
      sendMessage(prefillQuery)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, loading])

  // Close options when messages start
  useEffect(() => {
    if (!hasMessages) setOptionsOpen(false)
  }, [hasMessages])

  async function sendMessage(
    content: string,
    agentContent?: string,
    opts?: { feedbackTrigger?: boolean },
  ) {
    setInputValue('')
    setOptionsOpen(false)
    setMessages(prev => [...prev, {
      id: crypto.randomUUID(), role: 'user', content, timestamp: new Date(),
    }])
    setLoading(true)

    try {
      const res = await sendChatMessage(agentContent ?? content, threadId, opts)
      let inline: InlineCard | undefined

      if (res.calendar?.gcal_url) {
        inline = {
          type: 'calendar', gcal_url: res.calendar.gcal_url, ics_url: res.calendar.ics_url,
          title: res.calendar.title, location: res.calendar.location,
          date_label: res.calendar.date_label, time_label: res.calendar.time_label,
        }
      } else if (res.booking?.url) {
        inline = {
          type: 'ticket', url: res.booking.url, title: res.booking.title,
          subtitle: res.booking.subtitle, is_free: res.booking.is_free,
          arrival_notes: res.booking.arrival_notes,
        }
      } else if (res.location_url) {
        inline = { type: 'location', url: res.location_url, name: res.location_name ?? '' }
      }

      if (!inline && res.suggest_interests && !res.is_feedback && !sessionStorage.getItem('echo_interest_prompt_shown')) {
        const stored = sessionStorage.getItem('echo_interests')
        const hasInterests = stored ? (JSON.parse(stored) as string[]).length > 0 : false
        if (!hasInterests) {
          inline = { type: 'interest', threadId }
          sessionStorage.setItem('echo_interest_prompt_shown', '1')
        }
      }

      setMessages(prev => [...prev, {
        id: crypto.randomUUID(), role: 'assistant', content: res.content,
        timestamp: new Date(), inline,
        isFeedback: res.is_feedback ?? false,
        eventUrl: res.event_url ?? undefined,
        eventName: res.event_name ?? undefined,
      }])
    } catch {
      setMessages(prev => [...prev, {
        id: crypto.randomUUID(), role: 'assistant',
        content: 'Sorry, something went wrong. Please try again.',
        timestamp: new Date(),
      }])
    } finally {
      setLoading(false)
    }
  }

  function handleSend() {
    const trimmed = inputValue.trim()
    if (!trimmed || loading) return
    sendMessage(trimmed)
  }

  function handleDrawerOption(opt: typeof DRAWER_OPTIONS[number]) {
    setOptionsOpen(false)

    if (opt.inline === 'interest') {
      setMessages(prev => [
        ...prev,
        { id: crypto.randomUUID(), role: 'user', content: opt.label, timestamp: new Date() },
        {
          id: crypto.randomUUID(), role: 'assistant',
          content: 'Here are your interest tags — select up to 5 to personalise my suggestions.',
          timestamp: new Date(),
          inline: { type: 'interest' as const, threadId },
        },
      ])
      return
    }

    // Leave feedback → feedback agent
    sendMessage(opt.label, undefined, { feedbackTrigger: true })
  }

  return (
    <PageShell>
      <AppHeader />

      {/* ── Greeting gradient glow ── */}
      {!hasMessages && (
        <div
          style={{
            position:      'fixed',
            bottom:        100,
            left:          '50%',
            transform:     'translateX(-50%)',
            width:         380,
            height:        240,
            borderRadius:  999,
            opacity:       0.1,
            background:    'radial-gradient(50% 50% at 50% 50%, #153F39 0%, #4EB1A2 100%)',
            filter:        'blur(100px)',
            pointerEvents: 'none',
            zIndex:        1,
          }}
        />
      )}

      {/* ── Scroll area ── */}
      <div
        className="flex-1 overflow-y-auto no-scroll px-5"
        style={{ paddingBottom: barHeight + 16 }}
      >
        {/* Pre-chat welcome — greeting text only, centred in remaining space */}
        {!hasMessages && (
          <div
            className="animate-fade-in"
            style={{
              minHeight:      '100%',
              display:        'flex',
              flexDirection:  'column',
              justifyContent: 'center',
            }}
          >
            <div>
              <p style={{
                fontFamily:    'var(--font-accent)',
                fontWeight:    700,
                fontSize:      36,
                letterSpacing: 'var(--tr-accent)',
                lineHeight:    1.5,
                color:         'var(--stone-500)',
                margin:        '0 0 4px',
              }}>
                {userName ? `Hi ${userName},` : 'Hi, I am ECHO'}
              </p>
              <p style={{
                fontFamily:    'var(--font-accent)',
                fontWeight:    700,
                fontSize:      36,
                letterSpacing: 'var(--tr-accent)',
                lineHeight:    1.2,
                color:         'var(--stone-900)',
                margin:        0,
              }}>
                How can I help you today?
              </p>
            </div>
          </div>
        )}

        {/* Messages */}
        {hasMessages && (
          <div style={{ paddingTop: 20, display: 'flex', flexDirection: 'column', gap: 12 }}>
            {messages.map(msg => (
              <div key={msg.id}>
                <ChatMessage
                  role={msg.role}
                  content={msg.content}
                  timestamp={fmt(msg.timestamp)}
                  eventUrl={msg.eventUrl}
                  eventName={msg.eventName}
                />
                {msg.role === 'assistant' && msg.inline && (
                  <div style={{ marginTop: 8 }}>
                    <div style={{ maxWidth: '78%' }}>
                      <InlineCardRenderer card={msg.inline} onSendMessage={(text) => sendMessage(text)} />
                    </div>
                  </div>
                )}
              </div>
            ))}

            {/* Thinking indicator */}
            {loading && (
              <div className="animate-fade-in" style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <span style={{
                  color:      'var(--stone-500)',
                  animation:  'thinking-shimmer-icon 3s linear infinite',
                  flexShrink: 0,
                  display:    'flex',
                }}>
                  <Logo size={20} color="currentColor" />
                </span>
                <span style={{
                  fontFamily:              'var(--font-main)',
                  fontWeight:              500,
                  fontSize:                14,
                  letterSpacing:           'var(--tr-main)',
                  background:              'linear-gradient(45deg, var(--stone-500) 0%, var(--stone-900) 35%, var(--stone-300) 50%, var(--stone-900) 65%, var(--stone-500) 100%)',
                  backgroundSize:          '300% 100%',
                  WebkitBackgroundClip:    'text',
                  backgroundClip:          'text',
                  color:                   'transparent',
                  animation:               'thinking-shimmer 3s linear infinite',
                }}>
                  ECHO is thinking…
                </span>
              </div>
            )}
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      {/* ── Blur overlay when options open ── */}
      {optionsOpen && (
        <div
          onClick={() => setOptionsOpen(false)}
          style={{
            position:             'absolute',
            inset:                0,
            bottom:               0,
            background:           'rgba(0,0,0,0.06)',
            backdropFilter:       'blur(2px)',
            WebkitBackdropFilter: 'blur(2px)',
            zIndex:               15,
          }}
        />
      )}

      {/* ── Bottom bar ── */}
      <div
        ref={bottomBarRef}
        style={{
          position:  'absolute',
          bottom:    0,
          left:      0,
          right:     0,
          zIndex:    20,
          paddingBottom: 'max(12px, env(safe-area-inset-bottom))',
        }}
      >
        {/* ── Option cards — greeting only, sits right above chat input ── */}
        {!hasMessages && (
          <div className="animate-fade-in" style={{ padding: '20px' }}>
            {(visitType === 'on' || visitType === 'test') ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {options.map(opt => (
                  <OptionRow
                    key={opt.title}
                    option={opt}
                    onClick={() => sendMessage(opt.query, undefined, { feedbackTrigger: opt.feedbackTrigger })}
                  />
                ))}
              </div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                {options.map(opt => (
                  <OptionCard
                    key={opt.title}
                    option={opt}
                    onClick={() => sendMessage(opt.query, undefined, { feedbackTrigger: opt.feedbackTrigger })}
                  />
                ))}
              </div>
            )}
          </div>
        )}

        {/* ── Option Background ── */}
        <div
          style={{
            bottom:    0,
            left:      0,
            right:     0,
            margin:    '0 20px',
            borderRadius: 12,
            background: '#ffffffb0',
            backdropFilter:       'blur(4px)',
            WebkitBackdropFilter: 'blur(4px)',
            border:       '1px solid #F0F0F0',
            boxShadow:    '0 0 4px rgba(0,0,0,0.10)',
        }}>
          {/* Chevron toggle — visible only when there are messages */}
          {hasMessages && (
            <div style={{ display: 'flex', justifyContent: 'center', padding: '2px 0' }}>
              <button
                onClick={() => setOptionsOpen(o => !o)}
                aria-label={optionsOpen ? 'Close options' : 'Open options'}
                style={{
                  background: 'none', border: 'none', cursor: 'pointer',
                  padding: 4, display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}
              >
                <svg
                  width="20" height="20" viewBox="0 0 20 20" fill="none"
                  style={{
                    transform:  optionsOpen ? 'rotate(180deg)' : 'rotate(0deg)',
                    transition: 'transform 0.25s ease',
                  }}
                >
                  <path d="M5 12.5L10 7.5L15 12.5" stroke="var(--stone-500)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </button>
            </div>
          )}

          {/* Options drawer — same width + rounding as chat input, sits behind it */}
          <div style={{
            overflow:   'hidden',
            maxHeight:  optionsOpen ? '200px' : '0px',
            opacity:    optionsOpen ? 1 : 0,
            transition: 'max-height 0.32s cubic-bezier(0.4,0,0.2,1), opacity 0.22s ease',
            position:   'relative',
            zIndex:     3,
          }}>
            {DRAWER_OPTIONS.map((opt, i) => (
              <div key={opt.label}>
                {i > 0 && <div style={{ height: 1, background: '#F0F0F0', margin: '0 20px' }} />}
                <button
                  onClick={() => handleDrawerOption(opt)}
                  style={{
                    display:    'flex',
                    alignItems: 'center',
                    gap:        16,
                    width:      '100%',
                    padding:    '20px 20px',
                    background: 'none',
                    border:     'none',
                    cursor:     'pointer',
                    textAlign:  'left',
                  }}
                >
                  <div style={{ width: 20, height: 20, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    {DRAWER_ICONS[opt.label]}
                  </div>
                  <span style={{
                    fontFamily:    'var(--font-main)',
                    fontWeight:    500,
                    fontSize:      16,
                    color:         'var(--stone-900)',
                    letterSpacing: 'var(--tr-main)',
                  }}>
                    {opt.label}
                  </span>
                </button>
              </div>
            ))}
            {/* Spacer — hidden behind the overlapping chat input */}
            <div style={{ height: 20 }} />
          </div>

          {/* Chat input — sits in front of the drawer */}
          <div style={{
            position:   'relative',
            zIndex:     5,
            marginTop:  optionsOpen ? -20 : 0,
            transition: 'margin-top 0.32s cubic-bezier(0.4,0,0.2,1)',
          }}>
            <ChatInput
              value={inputValue}
              onChange={setInputValue}
              onSend={handleSend}
              disabled={loading}
            />
          </div>
        </div>
      
        {/* Disclaimer */}
        <p style={{
          margin:        '4px 0',
          textAlign:     'center',
          fontFamily:    'var(--font-main)',
          fontSize:      12,
          color:         'var(--stone-500)',
          letterSpacing: 'var(--tr-main)',
        }}>
          AI can generate false answers.
        </p>
      </div>
    </PageShell>
  )
}
