import { useRef, useState, type FormEvent, type KeyboardEvent } from 'react'
import sendIcon from '../assets/icons/send.svg'

interface Props {
  value:    string
  onChange: (v: string) => void
  onSend:   () => void
  disabled?: boolean
}

// Inline SVG matching audio.svg bar layout; animates when active
function AudioBarsIcon({ active }: { active: boolean }) {
  const bars = [
    { x: 4,  y1: 9, y2: 15, delay: '0s'    },
    { x: 8,  y1: 4, y2: 20, delay: '0.15s' },
    { x: 12, y1: 9, y2: 15, delay: '0.05s' },
    { x: 16, y1: 6, y2: 18, delay: '0.2s'  },
    { x: 20, y1: 9, y2: 15, delay: '0.1s'  },
  ]
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
      {bars.map(bar => (
        <line
          key={bar.x}
          x1={bar.x} y1={active ? 4 : bar.y1} x2={bar.x} y2={active ? 20 : bar.y2}
          stroke={active ? '#FFFFFF' : 'currentColor'}
          strokeWidth="2"
          strokeLinecap="round"
          style={active ? {
            transformOrigin: `${bar.x}px 12px`,
            animation: `audio-bar 0.7s ease-in-out ${bar.delay} infinite`,
          } : undefined}
        />
      ))}
    </svg>
  )
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnySpeechRecognition = any

function getSpeechRecognition(): (new () => AnySpeechRecognition) | null {
  if (typeof window === 'undefined') return null
  return (window as any).SpeechRecognition ?? (window as any).webkitSpeechRecognition ?? null
}

export default function ChatInput({ value, onChange, onSend, disabled }: Props) {
  const recognitionRef = useRef<AnySpeechRecognition | null>(null)
  const baseValueRef   = useRef('')
  const [recording,    setRecording] = useState(false)

  const SpeechRecognitionAPI = getSpeechRecognition()

  function handleKeyDown(e: KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      if (value.trim() && !disabled) onSend()
    }
  }

  function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (value.trim() && !disabled) onSend()
  }

  function handleAudio() {
    if (!SpeechRecognitionAPI) return

    if (recording) {
      recognitionRef.current?.stop()
      setRecording(false)
      return
    }

    baseValueRef.current = value

    const recognition = new SpeechRecognitionAPI()
    recognition.continuous     = true
    recognition.interimResults = true
    recognition.lang           = 'en-GB'

    recognition.onresult = (e: any) => {
      let transcript = ''
      for (let i = 0; i < e.results.length; i++) {
        transcript += e.results[i][0].transcript
      }
      const base = baseValueRef.current
      onChange((base ? base + ' ' : '') + transcript)
    }

    recognition.onend = () => setRecording(false)

    recognition.start()
    recognitionRef.current = recognition
    setRecording(true)
  }

  const canSend = !!value.trim() && !disabled

  return (
    <form
      onSubmit={handleSubmit}
      style={{
        display:      'flex',
        alignItems:   'stretch',
        gap:          10,
        padding:      8,
        background:   '#FFFFFF',
        border:       '1px solid #F0F0F0',
        borderRadius: 12,
      }}
    >
      <textarea
        rows={2}
        value={value}
        onChange={e => onChange(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder="Message ECHO…"
        disabled={disabled}
        className="no-scroll"
        style={{
          flex:          1,
          background:    'transparent',
          border:        'none',
          outline:       'none',
          resize:        'none',
          fontFamily:    'var(--font-main)',
          fontSize:      14,
          fontWeight:    400,
          letterSpacing: 'var(--tr-main)',
          lineHeight:    '1.5',
          color:         'var(--stone-900)',
          overflowY:     'auto',
          height:        80,
          padding:       8,
        }}
      />

      <div style={{ display: 'flex', flexDirection: 'column', gap: 8, flexShrink: 0 }}>
        {/* Audio */}
        <button
          type="button"
          aria-label={recording ? 'Stop recording' : 'Start voice input'}
          onClick={handleAudio}
          disabled={!SpeechRecognitionAPI}
          style={{
            width:          36,
            height:         36,
            borderRadius:   8,
            border:         recording ? 'none' : '1px solid #F0F0F0',
            background:     recording ? 'var(--primary-500)' : '#FFFFFF',
            display:        'flex',
            alignItems:     'center',
            justifyContent: 'center',
            cursor:         SpeechRecognitionAPI ? 'pointer' : 'default',
            flexShrink:     0,
            transition:     'background 0.15s, border-color 0.15s',
            color:          recording ? '#FFFFFF' : 'var(--stone-900)',
          }}
        >
          <AudioBarsIcon active={recording} />
        </button>

        {/* Send */}
        <button
          type="submit"
          disabled={!canSend}
          aria-label="Send"
          style={{
            width:          36,
            height:         36,
            borderRadius:   8,
            border:         'none',
            background:     canSend ? 'var(--tab-active-bg)' : 'var(--stone-200)',
            boxShadow:      canSend ? 'var(--shadow-tab-active)' : 'none',
            display:        'flex',
            alignItems:     'center',
            justifyContent: 'center',
            cursor:         canSend ? 'pointer' : 'default',
            flexShrink:     0,
            transition:     'background 0.2s ease',
          }}
        >
          <img src={sendIcon} width={20} height={20} alt=""
            style={{ filter: canSend ? 'none' : 'brightness(0) invert(0.5)' }} />
        </button>
      </div>
    </form>
  )
}
