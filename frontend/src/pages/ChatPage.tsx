import { useState, useEffect, useRef } from 'react'
import { useSearchParams } from 'react-router-dom'
import PageShell          from '../components/PageShell'
import AppHeader          from '../components/AppHeader'
import ChatMessage        from '../components/ChatMessage'
import ChatInput          from '../components/ChatInput'
import InlineCalendarCard  from '../components/InlineCalendarCard'
import InlineLinkCard       from '../components/InlineLinkCard'
import InlineTicketCard    from '../components/InlineTicketCard'
import InlineInterestPrompt from '../components/InlineInterestPrompt'
import { sendChatMessage } from '../api'
import type { Message, InlineCard } from '../types'

// ── Chat option icons ─────────────────────────────────────────────────────

function ExploreIcon() {
  return (
    <svg width="44" height="44" viewBox="0 0 80 80" fill="none">
      <path fillRule="evenodd" clipRule="evenodd" d="M47.3931 7C51.6363 7.00008 55.7061 8.66768 58.7066 11.6367C61.7071 14.606 63.393 18.6339 63.3931 22.833C63.3931 24.1909 63.1994 25.5176 62.8609 26.8018C66.2943 30.5401 68.3931 35.5241 68.3931 41C68.3931 52.5978 58.9908 61.9997 47.3931 62C42.6771 62 38.3223 60.4436 34.8169 57.8184L33.3843 59.25C34.0813 60.4035 33.9343 61.9231 32.939 62.9189L22.4038 73.4541C21.2323 74.6256 19.3322 74.6257 18.1607 73.4541L14.3941 69.6875C13.223 68.5159 13.2227 66.6158 14.3941 65.4443L24.9292 54.9102C25.924 53.9156 27.4422 53.7684 28.5952 54.4629L30.1177 52.9414C27.7698 49.5508 26.3931 45.4351 26.3931 41C26.3931 35.5243 28.4902 30.54 31.9234 26.8018C31.5848 25.5177 31.3931 24.1908 31.3931 22.833C31.3932 18.6339 33.0781 14.606 36.0786 11.6367C39.0792 8.66749 43.1497 7 47.3931 7ZM62.1265 29.0068C61.846 29.7053 61.5267 30.3879 61.1773 31.0527C63.1991 33.8497 64.3931 37.285 64.3931 41C64.3931 50.3887 56.7817 57.9997 47.3931 58C38.0042 58 30.3931 50.3888 30.3931 41C30.3931 37.2849 31.585 33.8487 33.607 31.0518C33.2577 30.3872 32.9381 29.705 32.6577 29.0068C29.9922 32.2776 28.3931 36.4516 28.3931 41C28.3931 45.2985 29.8196 49.2612 32.2251 52.4443C32.5255 52.8423 32.4867 53.4012 32.1343 53.7539L30.0747 55.8125L32.0347 57.7725L34.0298 55.7783L34.1001 55.7139C34.4646 55.4128 34.997 55.407 35.3696 55.7119C38.6453 58.3922 42.8303 60 47.3931 60C57.8862 59.9997 66.3931 51.4932 66.3931 41C66.3931 36.4514 64.7923 32.2777 62.1265 29.0068ZM60.0611 32.9688C58.7622 35.0004 57.2329 36.8248 55.7534 38.3701C53.8891 40.3175 52.0303 41.9019 50.6392 42.998C49.9429 43.5467 49.3602 43.9764 48.9487 44.2705C48.7435 44.4172 48.5799 44.5306 48.4663 44.6084C48.4099 44.6471 48.3646 44.6773 48.3335 44.6982C48.3179 44.7087 48.3043 44.7178 48.2954 44.7236C48.2911 44.7265 48.2847 44.7314 48.2847 44.7314L48.2818 44.7324C48.2818 44.7324 48.2797 44.729 48.2769 44.7246L48.2798 44.7344C47.7425 45.0886 47.0426 45.0887 46.5054 44.7344L46.5034 44.7324L46.5005 44.7314C46.5005 44.7314 46.4941 44.7265 46.4898 44.7236C46.4809 44.7178 46.4673 44.7087 46.4517 44.6982C46.4206 44.6773 46.3752 44.647 46.3189 44.6084C46.2053 44.5305 46.0416 44.4172 45.8364 44.2705C45.4249 43.9764 44.8424 43.5468 44.146 42.998C42.7549 41.9018 40.8962 40.3176 39.0318 38.3701C37.5522 36.8246 36.0221 35.0006 34.7232 32.9688C33.2481 35.2908 32.3931 38.0453 32.3931 41C32.3931 49.2843 39.1088 56 47.3931 56C55.6771 55.9997 62.3931 49.2841 62.3931 41C62.3931 38.045 61.5366 35.2907 60.0611 32.9688ZM47.3931 16.5C43.8586 16.5 40.9929 19.3354 40.9927 22.833C40.9927 26.3308 43.8585 29.167 47.3931 29.167C50.9276 29.1668 53.7925 26.3307 53.7925 22.833C53.7923 19.3355 50.9275 16.5002 47.3931 16.5Z" fill="var(--primary-500)" />
    </svg>
  )
}

function FaqIcon() {
  return (
    <svg width="44" height="44" viewBox="0 0 80 80" fill="none">
      <path fillRule="evenodd" clipRule="evenodd" d="M32.5 13C42.1683 13 50.1913 20.0365 51.7314 29.2676C60.9631 30.8073 68 38.8313 68 48.5C68 51.9451 67.1036 55.1828 65.5342 57.9932L67.5049 65.3555C67.9086 66.8631 66.5292 68.2429 65.0215 67.8389L57.4717 65.8145C54.7848 67.2094 51.7338 68 48.5 68C38.831 68 30.8069 60.9625 29.2676 51.7305C27.0918 51.3672 25.0375 50.6462 23.1689 49.626L14.8125 51.8652C14.007 52.0811 13.2697 51.3445 13.4854 50.5391L15.6758 42.3633C13.9757 39.4696 13 36.0988 13 32.5C13 21.7304 21.7304 13 32.5 13ZM51.9648 31.3428C51.9873 31.7257 52 32.1115 52 32.5C52 43.2696 43.2696 52 32.5 52C32.1115 52 31.7257 51.9873 31.3428 51.9648C32.9506 59.9702 40.0212 66 48.5 66C51.5351 66 54.3868 65.2276 56.873 63.8701L57.2246 63.6777L57.6113 63.7822L65.54 65.9062C65.5476 65.9082 65.5527 65.9082 65.5527 65.9082C65.5527 65.9082 65.56 65.9058 65.5664 65.8994C65.5727 65.893 65.5752 65.8848 65.5752 65.8848C65.5752 65.8848 65.5753 65.8807 65.5732 65.873L63.3877 57.7119L63.5996 57.3506C65.1247 54.7546 66 51.7311 66 48.5C66 40.0212 59.9702 32.9506 51.9648 31.3428ZM31.4922 39C30.6682 39.0004 30.0002 39.672 30 40.5C30.0002 41.328 30.6682 41.9996 31.4922 42H31.5068C32.3311 42 32.9998 41.3283 33 40.5C32.9998 39.6717 32.3311 39 31.5068 39H31.4922ZM33.4805 23.0928C31.9355 22.8339 30.3466 23.1187 28.9951 23.8955C27.6432 24.6728 26.6142 25.8937 26.0938 27.3408C25.7902 28.1865 26.2451 29.1144 27.1094 29.4121C27.9742 29.7095 28.9223 29.263 29.2266 28.417C29.4868 27.694 30.0003 27.0838 30.6758 26.6953C31.3516 26.3068 32.1473 26.1645 32.9199 26.2939C33.6926 26.4236 34.3945 26.8177 34.8994 27.4043C35.4041 27.991 35.6808 28.7342 35.6797 29.501V29.5039C35.6792 30.2655 35.073 31.0603 33.9287 31.8066C33.407 32.1468 32.8726 32.4088 32.4629 32.5869C32.2607 32.6748 32.0933 32.7405 31.9814 32.7822C31.9265 32.8027 31.8838 32.8173 31.8584 32.8262C31.8473 32.83 31.8384 32.8325 31.834 32.834L31.8301 32.8359V32.834C30.9628 33.1188 30.4945 34.0392 30.7832 34.8887C31.0733 35.7391 32.0143 36.1991 32.8838 35.916H32.8857L32.8887 35.9141C32.8887 35.9141 32.8934 35.9137 32.8955 35.9131C32.9002 35.9115 32.9062 35.9086 32.9131 35.9062C32.9275 35.9014 32.9466 35.8938 32.9697 35.8857C33.017 35.8693 33.0831 35.8462 33.1631 35.8164C33.3234 35.7567 33.5473 35.6695 33.8115 35.5547C34.3355 35.3269 35.0476 34.9802 35.7705 34.5088C37.0319 33.6861 38.7668 32.1911 38.9785 29.959L39 29.5039C39.0018 27.9705 38.448 26.4847 37.4385 25.3115C36.4286 24.1385 35.0257 23.3521 33.4805 23.0928Z" fill="var(--primary-500)" />
    </svg>
  )
}

function FeedbackIcon() {
  return (
    <svg width="44" height="44" viewBox="0 0 80 80" fill="none">
      <path d="M55 43.0001C55.5523 43.0001 56 43.4479 56 44.0001C55.9999 44.5524 55.5522 45.0001 55 45.0001H25C24.4478 45.0001 24.0001 44.5524 24 44.0001C24 43.4479 24.4477 43.0001 25 43.0001H55Z" fill="var(--primary-500)" />
      <path d="M43 35.0001C43.5523 35.0001 44 35.4479 44 36.0001C43.9999 36.5524 43.5522 37.0001 43 37.0001H25C24.4478 37.0001 24.0001 36.5524 24 36.0001C24 35.4479 24.4477 35.0001 25 35.0001H43Z" fill="var(--primary-500)" />
      <path fillRule="evenodd" clipRule="evenodd" d="M68.5059 13.7072C68.8964 13.3167 69.5294 13.3167 69.9199 13.7072L72.749 16.5353C73.1393 16.9257 73.1391 17.5588 72.749 17.9494L65 25.6984V53.0001C64.9999 54.6569 63.6568 56.0001 62 56.0001H31.4141L23.4141 64.0001C22.1542 65.2596 20.0004 64.3675 20 62.5861V56.0001H18C16.3432 56.0001 15.0001 54.6569 15 53.0001V25.0001C15 23.3433 16.3431 22.0001 18 22.0001H60.2129L68.5059 13.7072ZM18 24.0001C17.4477 24.0001 17 24.4479 17 25.0001V53.0001C17.0001 53.5524 17.4478 54.0001 18 54.0001H21C21.5523 54.0001 22 54.4479 22 55.0001V62.5861L30.293 54.2931L30.3662 54.2267C30.5442 54.0809 30.7679 54.0001 31 54.0001H62C62.5522 54.0001 62.9999 53.5524 63 53.0001V27.6984L55.7637 34.9347C55.6287 35.0696 55.4579 35.1633 55.2715 35.2042L51.6475 35.9992C50.9349 36.1556 50.2999 35.5213 50.4561 34.8087L51.252 31.1847C51.2929 30.9981 51.3864 30.8267 51.5215 30.6916L58.2129 24.0001H18Z" fill="var(--primary-500)" />
    </svg>
  )
}

// ── Option card ───────────────────────────────────────────────────────────

interface OptionDef {
  icon:            React.ReactNode
  title:           string
  subtitle:        string
  query:           string
  feedbackTrigger?: boolean
}

const cardStyle = {
  background: '#ffffff',
  boxShadow: '0 4px 20px rgba(46,104,96,0.14), 0 1px 4px rgba(46,104,96,0.08)',
} as const

function OptionCard({ option, onClick }: { option: OptionDef; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="flex flex-col items-start gap-4 p-5 rounded-[20px] text-left transition-all active:scale-[0.97]"
      style={cardStyle}
    >
      {option.icon}
      <div>
        <p className="m-0 mb-1 text-echo-900" style={{
          fontFamily: 'var(--font-accent)', fontWeight: 700,
          letterSpacing: 'var(--tr-accent)', fontSize: 17, lineHeight: 1.2,
        }}>
          {option.title}
        </p>
        <p className="t-small text-echo-500 m-0">{option.subtitle}</p>
      </div>
    </button>
  )
}

function OptionRow({ option, onClick }: { option: OptionDef; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="flex flex-row items-center gap-4 w-full p-4 rounded-[20px] text-left transition-all active:scale-[0.97]"
      style={cardStyle}
    >
      <div className="flex items-center justify-center flex-shrink-0">
        {option.icon}
      </div>
      <div>
        <p className="m-0 mb-1 text-echo-900" style={{
          fontFamily: 'var(--font-accent)', fontWeight: 700,
          letterSpacing: 'var(--tr-accent)', fontSize: 17, lineHeight: 1.2,
        }}>
          {option.title}
        </p>
        <p className="t-small text-echo-500 m-0">{option.subtitle}</p>
      </div>
    </button>
  )
}

function getOptions(): { options: OptionDef[]; visitType: string } {
  const visitType = sessionStorage.getItem('echo_visit_type') ?? 'pre'
  const explore: OptionDef = {
    icon: <ExploreIcon />, title: 'Explore Activities',
    subtitle: 'Planning for your visit',
    query: 'What activities are available at GERF?',
  }
  const faq: OptionDef = {
    icon: <FaqIcon />, title: 'FAQ Query',
    subtitle: 'Get quick answers',
    query: 'What are the frequently asked questions about GERF?',
  }
  const feedback: OptionDef = {
    icon: <FeedbackIcon />, title: 'Share your experience',
    subtitle: 'Post-event feedback',
    query: "I'd like to share my experience at GERF.",
    feedbackTrigger: true,
  }
  if (visitType === 'on' || visitType === 'test') return { options: [explore, faq, feedback], visitType }
  if (visitType === 'post') return { options: [explore, feedback], visitType }
  return { options: [explore, faq], visitType }
}

// ── Inline card renderer ──────────────────────────────────────────────────

function InlineCardRenderer({ card }: { card: InlineCard }) {
  if (card.type === 'calendar') {
    return (
      <InlineCalendarCard
        gcal_url={card.gcal_url}
        ics_url={card.ics_url}
        title={card.title}
        location={card.location}
        date_label={card.date_label}
        time_label={card.time_label}
      />
    )
  }
  if (card.type === 'location') {
    return <InlineLinkCard type="location" url={card.url} name={card.name} />
  }
  if (card.type === 'ticket') {
    return (
      <InlineTicketCard
        url={card.url}
        title={card.title}
        subtitle={card.subtitle}
        is_free={card.is_free}
        arrival_notes={card.arrival_notes}
      />
    )
  }
  if (card.type === 'interest') {
    return <InlineInterestPrompt threadId={card.threadId} />
  }
  return null
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

  const [loading, setLoading] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)
  const { options, visitType } = getOptions()
  const userName  = sessionStorage.getItem('echo_name')
  const hasMessages = messages.length > 0

  // Fire community query (from Popular Now / Insights) — single-fire via sessionStorage pop
  const prefillFired = useRef(false)
  useEffect(() => {
    const communityRaw = sessionStorage.getItem('echo_community_query')
    if (communityRaw) {
      sessionStorage.removeItem('echo_community_query')
      try {
        const { display, agent } = JSON.parse(communityRaw)
        sendMessage(display, agent)
      } catch {
        // ignore malformed entry
      }
      return
    }
    // URL ?q= prefill (other sources) — fires once per mount regardless of history length
    if (prefillQuery && !prefillFired.current) {
      prefillFired.current = true
      sendMessage(prefillQuery)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, loading])

  async function sendMessage(
    content: string,
    agentContent?: string,
    opts?: { feedbackTrigger?: boolean },
  ) {
    // Snapshot: is this the very first reply from the main agent (feedback replies don't count)?
    const isFirstMainAssistant = !messages.some(m => m.role === 'assistant' && !m.isFeedback)

    // Display the clean message; send agentContent (with marker) to the API if provided
    setMessages(prev => [...prev, {
      id: crypto.randomUUID(), role: 'user', content, timestamp: new Date(),
    }])
    setLoading(true)

    try {
      const res = await sendChatMessage(agentContent ?? content, threadId, opts)

      // Determine inline card from API response
      let inline: InlineCard | undefined

      if (res.calendar?.gcal_url) {
        inline = {
          type:       'calendar',
          gcal_url:   res.calendar.gcal_url,
          ics_url:    res.calendar.ics_url,
          title:      res.calendar.title,
          location:   res.calendar.location,
          date_label: res.calendar.date_label,
          time_label: res.calendar.time_label,
        }
      } else if (res.booking?.url) {
        inline = {
          type:          'ticket',
          url:           res.booking.url,
          title:         res.booking.title,
          subtitle:      res.booking.subtitle,
          is_free:       res.booking.is_free,
          arrival_notes: res.booking.arrival_notes,
        }
      } else if (res.location_url) {
        inline = {
          type: 'location',
          url:  res.location_url,
          name: res.location_name ?? '',
        }
      }

      // Interest prompt: once per session, on the first main-agent reply, when no other card
      // Feedback replies don't count — they must not consume this slot
      if (!inline && isFirstMainAssistant && !res.is_feedback && !sessionStorage.getItem('echo_interest_prompt_shown')) {
        inline = { type: 'interest', threadId }
        sessionStorage.setItem('echo_interest_prompt_shown', '1')
      }

      setMessages(prev => [...prev, {
        id:         crypto.randomUUID(),
        role:       'assistant',
        content:    res.content,
        timestamp:  new Date(),
        inline,
        isFeedback: res.is_feedback ?? false,
        eventUrl:   res.event_url  ?? undefined,
        eventName:  res.event_name ?? undefined,
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

  const fmt = (d: Date) => d.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })

  return (
    <PageShell fixed>
      <AppHeader />

      <div className={[
        'flex-1 overflow-y-auto no-scroll px-4',
        hasMessages ? 'py-5 pb-28 space-y-3' : 'flex flex-col justify-center py-8 pb-28',
      ].join(' ')}>

        {/* Pre-chat welcome */}
        {!hasMessages && (
          <div className="animate-fade-in space-y-6">
            <div>
              <p style={{
                fontFamily: 'var(--font-accent)', fontWeight: 700, fontSize: 28,
                letterSpacing: 'var(--tr-accent)', lineHeight: 1.5,
                color: 'var(--echo-300)', margin: '0 0 6px',
              }}>
                {userName ? `Hi ${userName},` : 'Hi, I am ECHO'}
              </p>
              <p style={{
                fontFamily: 'var(--font-accent)', fontWeight: 700, fontSize: 28,
                letterSpacing: 'var(--tr-accent)', lineHeight: 1.3,
                color: 'var(--echo-900)', margin: 0,
              }}>
                How can I help you today?
              </p>
            </div>
            {(visitType === 'on' || visitType === 'test') ? (
              <div className="flex flex-col gap-3">
                {options.map(opt => (
                  <OptionRow
                    key={opt.title}
                    option={opt}
                    onClick={() => sendMessage(opt.query, undefined, { feedbackTrigger: opt.feedbackTrigger })}
                  />
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-3">
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

        {/* Messages + inline cards */}
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
              <div className="mt-2 flex justify-start">
                <div className="w-full max-w-[78%]">
                  <InlineCardRenderer card={msg.inline} />
                </div>
              </div>
            )}
          </div>
        ))}

        {/* Typing indicator */}
        {loading && (
          <div className="flex justify-start animate-fade-in">
            <div className="px-4 py-3 rounded-[18px] rounded-bl-[6px] bg-white border border-[rgba(34,36,34,0.05)]"
              style={{ boxShadow: 'var(--sh-bubble)' }}>
              <div className="flex items-center gap-1.5">
                {[0, 150, 300].map(delay => (
                  <span key={delay}
                    className="w-2 h-2 rounded-full bg-echo-300 animate-bounce"
                    style={{ animationDelay: `${delay}ms` }}
                  />
                ))}
              </div>
            </div>
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      {/* Gradient blur fade — sits behind the bar, pointer-events off */}
      <div
        className="absolute left-0 right-0 pointer-events-none"
        style={{
          bottom:               0,
          height:               120,
          backdropFilter:       'blur(4px)',
          WebkitBackdropFilter: 'blur(4px)',
          maskImage:            'linear-gradient(to bottom, transparent 0%, black 55%)',
          WebkitMaskImage:      'linear-gradient(to bottom, transparent 0%, black 55%)',
        }}
      />
      {/* Solid bar */}
      <div
        className="absolute bottom-0 left-0 right-0 px-4 pt-3 pb-safe"
        style={{ background: 'var(--echo-50)' }}
      >
        <ChatInput onSend={sendMessage} disabled={loading} />
      </div>
    </PageShell>
  )
}
