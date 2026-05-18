import type { ReactNode } from 'react'
import { useNavigate } from 'react-router-dom'
import Logo from './Logo'

interface Props {
  showBack?: boolean
  title?: string
  right?: ReactNode
  transparent?: boolean
  onBack?: () => void
}

export default function NavBar({ showBack, title, right, transparent, onBack }: Props) {
  const navigate = useNavigate()

  function handleBack() {
    if (onBack) { onBack(); return }
    navigate(-1)
  }

  return (
    <nav
      className={`flex items-center justify-between px-5 py-4 flex-shrink-0 ${
        transparent
          ? 'bg-transparent'
          : 'bg-echo-50 border-b border-echo-100'
      }`}
    >
      {/* Left */}
      <div className="flex items-center gap-3">
        {showBack ? (
          <button
            onClick={handleBack}
            aria-label="Go back"
            className="w-8 h-8 rounded-full flex items-center justify-center bg-echo-100 border border-echo-200 transition-colors hover:bg-echo-200 -webkit-tap-highlight-color-transparent"
          >
            {/* Feather: chevron-left */}
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
              stroke="#2A2D2C" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="15 18 9 12 15 6" />
            </svg>
          </button>
        ) : (
          <Logo size={28} />
        )}
        {title && (
          <span className="t-h3 text-echo-900">{title}</span>
        )}
      </div>

      {/* Right */}
      {right && <div className="flex items-center gap-2">{right}</div>}
    </nav>
  )
}
