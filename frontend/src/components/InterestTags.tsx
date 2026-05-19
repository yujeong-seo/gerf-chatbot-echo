import { useState, useEffect } from 'react'
import Chip from './Chip'

export const INTEREST_OPTIONS = [  
  {id: 'space', label: 'Space' },
  {id: 'technology', label: 'Technology' },
  {id: 'music', label: 'Music & Performance' },
  {id: 'dance', label: 'Dance' },
  {id: 'medicine', label: 'Medicine' },
  {id: 'nature', label: 'Nature' },
  {id: 'environment', label: 'Environment' },
  {id: 'history', label: 'History' },
  {id: 'math', label: 'Maths' },
  {id: 'interactive', label: 'Interactive' },
  {id: 'wellbeing', label: 'Wellbeing' },
  {id: 'food', label: 'Food' },
  {id: 'art', label: 'Art & Design' },
]

const MAX_SELECTED = 5
export const STORAGE_KEY = 'echo_interests'

function readStoredIds(): string[] {
  try {
    const stored = sessionStorage.getItem(STORAGE_KEY)
    return stored ? JSON.parse(stored) : []
  } catch {
    return []
  }
}

interface Props {
  value?:           string[]
  initialSelected?: string[]
  onChange?:        (selected: string[]) => void
}

export default function InterestTags({ value, initialSelected, onChange }: Props) {
  const [selected, setSelected] = useState<Set<string>>(
    () => new Set(value ?? initialSelected ?? readStoredIds())
  )

  useEffect(() => {
    if (value !== undefined) {
      setSelected(new Set(value))
    }
  }, [value])

  function toggle(id: string) {
    const next = new Set(selected)
    if (next.has(id)) {
      next.delete(id)
    } else if (next.size < MAX_SELECTED) {
      next.add(id)
    }
    setSelected(next)
    const ids = [...next]
    if (value === undefined) {
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify(ids))
    }
    onChange?.(ids)
  }

  function clearAll() {
    setSelected(new Set())
    if (value === undefined) {
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify([]))
    }
    onChange?.([])
  }

  const count = selected.size

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <span style={{ fontFamily: 'var(--font-main)', fontSize: 12, fontWeight: 600, color: 'var(--echo-300)' }}>
          Your Interests
        </span>
        {count > 0 && (
          <div className="flex items-center gap-1" style={{ fontFamily: 'var(--font-main)', fontSize: 12, color: 'var(--echo-400)' }}>
            <span>{count}/{MAX_SELECTED} Selected</span>
            <span>·</span>
            <button onClick={clearAll} style={{ color: 'var(--echo-400)', textDecoration: 'underline', textDecorationColor: 'var(--echo-300)' }} className="hover:text-echo-500 transition-colors">Clear All</button>
          </div>
        )}
      </div>

      <div className="flex flex-wrap gap-2">
        {INTEREST_OPTIONS.map(item => (
          <Chip
            key={item.id}
            variant={selected.has(item.id) ? 'primary' : 'outline'}
            onClick={() => toggle(item.id)}
          >
            {item.label}
          </Chip>
        ))}
      </div>
    </div>
  )
}
