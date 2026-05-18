import { useState, useRef, type FormEvent, type KeyboardEvent } from 'react'

interface Props {
  onSend:       (message: string) => void
  placeholder?: string
  disabled?:    boolean
}

// 14px font × 1.5 line-height = 21px per line; py-2.5 = 10px top + 10px bottom
const LINE_PX = 21
const PAD_PX  = 20
const MAX_H   = LINE_PX * 2 + PAD_PX  // 62px — shows exactly 2 lines

export default function ChatInput({ onSend, placeholder = 'Message ECHO…', disabled }: Props) {
  const [value, setValue] = useState('')
  const areaRef = useRef<HTMLTextAreaElement>(null)

  function grow() {
    const el = areaRef.current
    if (!el) return
    el.style.height = 'auto'
    el.style.height = `${Math.min(el.scrollHeight, MAX_H)}px`
  }

  function handleChange(e: React.ChangeEvent<HTMLTextAreaElement>) {
    setValue(e.target.value)
    grow()
  }

  function handleKeyDown(e: KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      submit()
    }
  }

  function submit() {
    const trimmed = value.trim()
    if (!trimmed || disabled) return
    onSend(trimmed)
    setValue('')
    const el = areaRef.current
    if (el) el.style.height = 'auto'
  }

  return (
    <form
      onSubmit={(e: FormEvent) => { e.preventDefault(); submit() }}
      className="flex items-end gap-2 bg-white rounded-[20px] pl-5 pr-3 py-3 border border-[rgba(34,36,34,0.06)]"
      style={{ boxShadow: 'var(--sh-input)' }}
    >
      <textarea
        ref={areaRef}
        rows={1}
        value={value}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        disabled={disabled}
        className="flex-1 bg-transparent border-none outline-none t-body-m text-echo-900 placeholder-echo-500 py-2.5 resize-none overflow-y-auto no-scroll"
        style={{ lineHeight: '1.5', maxHeight: `${MAX_H}px` }}
      />
      <button
        type="submit"
        disabled={!value.trim() || disabled}
        aria-label="Send"
        className="w-9 h-9 rounded-full flex-shrink-0 flex items-center justify-center border border-[rgba(20,40,38,0.14)] transition-opacity disabled:opacity-30"
        style={{ background: 'var(--btn-primary)' }}
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
          <path d="M21.6698 1.05548C22.0321 0.929074 22.4355 1.02139 22.7069 1.29279C22.9782 1.56424 23.0707 1.96759 22.9442 2.3299L15.9442 22.3299C15.8088 22.7166 15.4502 22.9818 15.0409 22.9988C14.6313 23.0156 14.2524 22.7807 14.0858 22.4061L10.8827 15.2C12.1617 13.2735 13.4416 11.3473 14.7206 9.42072C14.7818 9.32807 14.6716 9.21785 14.579 9.27912C12.6523 10.5581 10.7253 11.8369 8.79869 13.116L1.59361 9.91388C1.21895 9.74737 0.984147 9.36846 1.00083 8.95881C1.01775 8.54934 1.28294 8.19088 1.66978 8.05548L21.6698 1.05548Z" fill="white" />
        </svg>
      </button>
    </form>
  )
}
