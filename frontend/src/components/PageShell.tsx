import type { CSSProperties, ReactNode } from 'react'

interface Props {
  children: ReactNode
  className?: string
  outerClassName?: string
  outerStyle?: CSSProperties
}

export default function PageShell({ children, className = '', outerClassName = '', outerStyle }: Props) {
  return (
    <div
      className={`h-[100dvh] min-h-[640px] overflow-hidden flex justify-center ${outerClassName}`}
      style={outerStyle}
    >
      <div className={`relative w-full max-w-app h-full flex flex-col overflow-x-hidden ${className}`}>
        {children}
      </div>
    </div>
  )
}
