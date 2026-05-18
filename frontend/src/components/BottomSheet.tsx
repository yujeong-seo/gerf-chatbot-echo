import { type ReactNode, useEffect } from 'react'

interface Props {
  open: boolean
  onClose: () => void
  children: ReactNode
  title?: string
}

export default function BottomSheet({ open, onClose, children, title }: Props) {
  useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : ''
    return () => { document.body.style.overflow = '' }
  }, [open])

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center animate-fade-in">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/20 backdrop-blur-[2px]"
        onClick={onClose}
      />

      {/* Sheet — bg matches page background (echo-50) */}
      <div
        className="relative w-full max-w-app z-10 animate-slide-up"
        style={{
          background: 'var(--echo-50)',
          borderRadius: '24px 24px 0 0',
          boxShadow: '0 -4px 32px rgba(34,36,34,0.12)',
        }}
      >
        {/* Drag handle */}
        <div className="flex justify-center pt-3 pb-1">
          <div className="w-10 h-[4px] rounded-full bg-echo-200" />
        </div>

        {/* Header */}
        {title && (
          <div className="flex items-center justify-between px-6 py-4 border-b border-echo-100">
            <h2 className="t-h2 text-echo-900">{title}</h2>
            <button
              onClick={onClose}
              aria-label="Close"
              className="w-8 h-8 rounded-full flex items-center justify-center bg-echo-100 border border-echo-200"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
                stroke="#2A2D2C" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          </div>
        )}

        <div className="px-6 pt-5 pb-safe">
          {children}
        </div>
      </div>
    </div>
  )
}
