import type { ReactNode } from 'react'

type Variant = 'primary' | 'deep' | 'outline' | 'muted' | 'slate' | 'hay' | 'terra'

interface Props {
  variant?: Variant
  active?: boolean
  onClick?: () => void
  children: ReactNode
  className?: string
}

const base =
  'inline-flex items-center gap-1.5 px-4 py-[9px] rounded-full border text-[13px] font-medium leading-none tracking-main transition-all duration-150 -webkit-tap-highlight-color-transparent select-none'

const variants: Record<Variant, string> = {
  primary: 'bg-primary-500 text-white border-transparent',
  deep:    'bg-primary-700 text-white border-transparent',
  outline: 'bg-transparent text-echo-900 border-echo-300 hover:border-primary-500',
  muted:   'bg-echo-100 text-echo-500 border-echo-200',
  slate:   'bg-slate-a text-white border-transparent',
  hay:     'bg-hay-a text-white border-transparent',
  terra:   'bg-terra-a text-white border-transparent',
}

export default function Chip({
  variant = 'outline',
  active,
  onClick,
  children,
  className = '',
}: Props) {
  return (
    <button
      onClick={onClick}
      className={`${base} ${variants[variant]} ${active ? 'ring-2 ring-primary-700 ring-offset-1' : ''} ${onClick ? 'cursor-pointer' : 'cursor-default'} ${className}`}
    >
      {children}
    </button>
  )
}
