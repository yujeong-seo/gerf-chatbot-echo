import type { ButtonHTMLAttributes, ReactNode } from 'react'

type Variant = 'light' | 'mid' | 'dark' | 'primary' | 'ghost'
type Size    = 'sm' | 'md' | 'lg'

interface Props extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant
  size?: Size
  fullWidth?: boolean
  children: ReactNode
}

const variantCls: Record<Variant, string> = {
  light:   'btn-light',
  mid:     'btn-mid',
  dark:    'btn-dark',
  primary: 'btn-primary',
  ghost:   'btn-ghost',
}

const sizeCls: Record<Size, string> = {
  sm: 'btn-sm',
  md: 'btn-md',
  lg: 'btn-lg',
}

export default function Btn({
  variant = 'primary',
  size = 'md',
  fullWidth,
  children,
  className = '',
  ...rest
}: Props) {
  return (
    <button
      className={`btn ${variantCls[variant]} ${sizeCls[size]} ${fullWidth ? 'w-full' : ''} ${className}`.trim()}
      {...rest}
    >
      {children}
    </button>
  )
}
