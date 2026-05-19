import { useLocation, useNavigate } from 'react-router-dom'
import { EVENT_START, EVENT_END } from '../constants'
import tabCommunityIcon from '../assets/icons/tab-community.svg'
import tabChatIcon      from '../assets/icons/tab-chat.svg'

export function getVisitStatus() {
  const now = new Date()
  if (now < EVENT_START) {
    const days = Math.ceil((EVENT_START.getTime() - now.getTime()) / 864e5)
    return { phase: 'before' as const, label: `D-${days}`, chip: 'Pre-Visit' }
  }
  if (now <= EVENT_END) {
    const dayNum = Math.floor((now.getTime() - EVENT_START.getTime()) / 86400000) + 1
    return { phase: 'during' as const, label: `Day ${dayNum}`, chip: `Day ${dayNum}` }
  }
  const days = Math.ceil((now.getTime() - EVENT_END.getTime()) / 864e5)
  return { phase: 'after' as const, label: `D+${days}`, chip: 'Post-Visit' }
}

const TABS = [
  { path: '/community', label: 'Community', icon: tabCommunityIcon },
  { path: '/chat',      label: 'Chat',      icon: tabChatIcon      },
] as const

function TabButton({ tab, active }: { tab: typeof TABS[number]; active: boolean }) {
  const navigate = useNavigate()

  return (
    <button
      onClick={() => navigate(tab.path)}
      style={{
        height:        40,
        display:       'flex',
        alignItems:    'center',
        paddingLeft:   active ? 16 : 20,
        paddingRight:  20,
        borderRadius:  9999,
        border:        'none',
        cursor:        'pointer',
        background:    active ? 'var(--tab-active-bg)' : 'transparent',
        boxShadow:     active ? 'var(--shadow-tab-active)' : 'none',
        fontFamily:    'var(--font-main)',
        fontSize:      16,
        fontWeight:    500,
        letterSpacing: 'var(--tr-main)',
        color:         active ? '#FFFFFF' : 'var(--stone-900)',
        transition:    'background 0.25s ease, box-shadow 0.25s ease, color 0.25s ease, padding-left 0.25s ease',
        whiteSpace:    'nowrap',
        flexShrink:    0,
        overflow:      'hidden',
      }}
    >
      <img
        src={tab.icon}
        height={20}
        alt=""
        style={{
          filter:      'brightness(0) invert(1)',
          flexShrink:  0,
          width:       active ? 20 : 0,
          opacity:     active ? 1 : 0,
          marginRight: active ? 8 : 0,
          transition:  'width 0.25s ease, opacity 0.2s ease, margin-right 0.25s ease',
        }}
      />
      {tab.label}
    </button>
  )
}

export default function AppHeader() {
  const { pathname } = useLocation()

  const currentDate = new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric' })

  return (
    <header
      className="flex-shrink-0 z-10"
      style={{ padding: '20px' }}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>

        {/* Left: current date */}
        <span style={{
          fontFamily:    'var(--font-main)',
          fontWeight:    600,
          fontSize:      16,
          color:         'var(--stone-700)',
          letterSpacing: 'var(--tr-main)',
        }}>
          {currentDate}
        </span>

        {/* Right: tab container pill */}
        <div style={{
          display:      'flex',
          alignItems:   'center',
          height:       56,
          padding:      8,
          gap:          4,
          borderRadius: 9999,
          background:   'var(--tab-container-bg)',
        }}>
          {TABS.map(tab => (
            <TabButton key={tab.path} tab={tab} active={pathname === tab.path} />
          ))}
        </div>

      </div>
    </header>
  )
}
