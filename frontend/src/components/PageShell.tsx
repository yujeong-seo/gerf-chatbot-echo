import type { CSSProperties, ReactNode } from 'react'

interface Props {
  children: ReactNode
  className?: string
  bg?: string
  outerClassName?: string
  outerStyle?: CSSProperties
  fixed?: boolean
}

export default function PageShell({ children, className = '', bg = 'bg-echo-50', outerClassName = '', outerStyle, fixed: _fixed = false }: Props) {
  return (
    <div className={`h-[100dvh] min-h-[640px] overflow-hidden bg-stone-50 flex justify-center ${outerClassName}`} style={outerStyle}>
      <div
        className={`relative w-full max-w-app h-full flex flex-col overflow-x-hidden ${bg} ${className}`}
      >
        {children}
      </div>
    </div>
  )
}
