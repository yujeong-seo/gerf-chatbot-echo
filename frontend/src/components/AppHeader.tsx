import { useLocation, useNavigate } from 'react-router-dom'
import { EVENT_START, EVENT_END } from '../constants'

function getStatus() {
  const now = new Date()
  if (now < EVENT_START) {
    const days = Math.ceil((EVENT_START.getTime() - now.getTime()) / 864e5)
    return { phase: 'before' as const, label: `D-${days}` }
  }
  if (now <= EVENT_END) {
    const dayNum = Math.floor((now.getTime() - EVENT_START.getTime()) / 86400000) + 1
    return { phase: 'during' as const, label: `Day ${dayNum}` }
  }
  const days = Math.ceil((now.getTime() - EVENT_END.getTime()) / 864e5)
  return { phase: 'after' as const, label: `D+${days}` }
}

function LocationIcon({ fill = '#2A2D2C', style }: { fill?: string; style?: React.CSSProperties }) {
  return (
    <svg width="11" height="13" viewBox="0 0 24 24" fill="none"
      className="flex-shrink-0" style={style}>
      <path fillRule="evenodd" clipRule="evenodd" d="M12 0C14.6522 0 17.1959 1.05335 19.0713 2.92871C20.9467 4.80407 22 7.34784 22 10C22 13.9019 19.5154 17.3955 17.2256 19.8125C16.0603 21.0425 14.8988 22.043 14.0293 22.7354C13.594 23.082 13.2299 23.3533 12.9727 23.5391C12.8442 23.6318 12.7419 23.7037 12.6709 23.7529C12.6355 23.7774 12.6073 23.7964 12.5879 23.8096C12.5782 23.8162 12.57 23.8215 12.5645 23.8252C12.5618 23.827 12.5576 23.8301 12.5576 23.8301L12.5557 23.8311C12.5557 23.8311 12.5548 23.8293 12.5527 23.8262L12.5547 23.832C12.2188 24.056 11.7812 24.056 11.4453 23.832L11.4443 23.8311L11.4424 23.8301C11.4424 23.8301 11.4382 23.827 11.4355 23.8252C11.43 23.8215 11.4218 23.8162 11.4121 23.8096C11.3927 23.7964 11.3645 23.7774 11.3291 23.7529C11.2581 23.7037 11.1558 23.6318 11.0273 23.5391C10.7701 23.3533 10.406 23.082 9.9707 22.7354C9.10124 22.043 7.93969 21.0425 6.77441 19.8125C4.48463 17.3955 2 13.9019 2 10C2 7.34784 3.05335 4.80407 4.92871 2.92871C6.80407 1.05335 9.34784 0 12 0ZM12 6C9.79086 6 8 7.79086 8 10C8 12.2091 9.79086 14 12 14C14.2091 14 16 12.2091 16 10C16 7.79086 14.2091 6 12 6Z" fill={fill} />
    </svg>
  )
}

function UserTabIcon({ active }: { active: boolean }) {
  const color = active ? '#ECEDEB' : '#2A2D2C'
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none">
      <path d="M22 23V18C22 16.6739 21.4732 15.4021 20.5355 14.4645C19.5979 13.5268 18.3261 13 17 13H7C5.67392 13 4.40215 13.5268 3.46447 14.4645C2.52678 15.4021 2 16.6739 2 18V23"
        fill={color} fillOpacity={0.85} />
      <path d="M12 11C14.7614 11 17 8.76142 17 6C17 3.23858 14.7614 1 12 1C9.23858 1 7 3.23858 7 6C7 8.76142 9.23858 11 12 11Z"
        fill={color} />
    </svg>
  )
}

const TABS = [
  { path: '/community', label: 'Community', icon: false },
  { path: '/chat',      label: 'Chat',      icon: false },
  { path: '/user',      label: null,        icon: true  },
] as const

function TabButton({
  tab, active, stretch,
}: {
  tab: typeof TABS[number]
  active: boolean
  stretch: boolean
}) {
  const navigate = useNavigate()
  const btnStyle = {
    background:  active ? 'var(--btn-stone-900)' : 'var(--btn-stone-50)',
    boxShadow:   active ? 'var(--sh-btn-dark)'   : 'var(--sh-btn-light)',
    borderColor: active ? 'rgba(0,0,0,0.10)'     : 'rgba(34,36,34,0.07)',
  }

  if (tab.icon) {
    return (
      <button
        onClick={() => navigate(tab.path)}
        aria-label="User profile"
        className="w-[34px] h-[34px] flex-shrink-0 rounded-full flex items-center justify-center border transition-all"
        style={btnStyle}
      >
        <UserTabIcon active={active} />
      </button>
    )
  }

  return (
    <button
      onClick={() => navigate(tab.path)}
      className={[
        'h-[34px] rounded-full text-[12px] font-semibold tracking-main border transition-all',
        'flex items-center justify-center',
        stretch ? 'flex-1' : 'px-[14px]',
      ].join(' ')}
      style={{ color: active ? '#ECEDEB' : '#2A2D2C', ...btnStyle }}
    >
      {tab.label}
    </button>
  )
}

export default function AppHeader() {
  const { pathname } = useLocation()
  const status      = getStatus()
  const isOnVisit   = sessionStorage.getItem('echo_visit_type') === 'on'
  const iconFill    = isOnVisit ? '#2A2D2C' : '#AAACA8'

  const currentDate = new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })

  const StatusSection = (
    <div className="flex items-center gap-1.5">
      <LocationIcon fill={iconFill} />
      <span className="text-echo-500"
        style={{ fontFamily: 'var(--font-accent)', fontWeight: 700, fontSize: 11, letterSpacing: 'var(--tr-accent)' }}>
        {status.label}
      </span>
    </div>
  )

  const TabRow = ({ stretch }: { stretch: boolean }) => (
    <div className={`flex items-center gap-1.5 ${stretch ? 'w-full' : ''}`}>
      {TABS.map(tab => (
        <TabButton key={tab.path} tab={tab} active={pathname === tab.path} stretch={stretch} />
      ))}
    </div>
  )

  return (
    <header className="px-5 py-3 bg-echo-50 border-b border-echo-100 flex-shrink-0 z-10">

      {/* Wide layout ≥ 420px: single row */}
      <div className="hidden [@media(min-width:420px)]:flex items-center gap-2.5">
        <div className="flex-1 flex items-center gap-2.5">
          {StatusSection}
        </div>
        <TabRow stretch={false} />
      </div>

      {/* Narrow layout < 420px: two rows */}
      <div className="flex flex-col gap-2 [@media(min-width:420px)]:hidden">
        <div className="flex items-center justify-between">
          {StatusSection}
          <span className="text-echo-400"
            style={{ fontFamily: 'var(--font-main)', fontSize: 11, fontWeight: 500 }}>
            {currentDate}
          </span>
        </div>
        <TabRow stretch={true} />
      </div>

    </header>
  )
}
