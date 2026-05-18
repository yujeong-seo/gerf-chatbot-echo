import { useState } from 'react'
import Chip from './Chip'
import { INTEREST_OPTIONS, STORAGE_KEY } from './InterestTags'
import { savePreferences } from '../api'

const MAX_SELECTED = 5

interface Props {
  threadId: string
}

function readStored(): string[] {
  try {
    const s = sessionStorage.getItem(STORAGE_KEY)
    return s ? JSON.parse(s) : []
  } catch { return [] }
}

export default function InlineInterestPrompt({ threadId }: Props) {
  const [savedInterests,   setSavedInterests]   = useState<string[]>(readStored)
  const [currentInterests, setCurrentInterests] = useState<string[]>(readStored)
  const [hasSaved,         setHasSaved]         = useState(false)
  const [saveState,        setSaveState]        = useState<'idle' | 'saving' | 'saved'>('idle')

  const isDirty =
    JSON.stringify([...currentInterests].sort()) !==
    JSON.stringify([...savedInterests].sort())

  // Show button row unless: user has saved once AND no pending changes
  const showButtons = !hasSaved || isDirty

  function toggle(id: string) {
    setCurrentInterests(prev => {
      const next = new Set(prev)
      if (next.has(id)) {
        next.delete(id)
      } else if (next.size < MAX_SELECTED) {
        next.add(id)
      }
      return [...next]
    })
  }

  function handleCancel() {
    setCurrentInterests(savedInterests)
  }

  async function handleSave() {
    if (saveState === 'saving') return
    setSaveState('saving')
    try {
      await savePreferences(threadId, currentInterests)
    } catch { /* best-effort */ }
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(currentInterests))
    setSavedInterests(currentInterests)
    setHasSaved(true)
    setSaveState('saved')
    setTimeout(() => setSaveState('idle'), 2000)
  }

  const count = currentInterests.length

  return (
    <div
      className="w-full bg-white rounded-[18px] border border-[rgba(34,36,34,0.07)] px-4 py-3"
      style={{ boxShadow: 'var(--sh-bubble)' }}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-1">
        <span className="t-body-m text-echo-900">What are you into?</span>
        {count > 0 && (
          <div className="flex items-center gap-1" style={{ fontFamily: 'var(--font-main)', fontSize: 12, color: 'var(--echo-500)' }}>
            <span>{count}/{MAX_SELECTED}</span>
            <span>·</span>
            <button
              onClick={() => setCurrentInterests([])}
              style={{ color: 'var(--echo-500)', textDecoration: 'underline', textDecorationColor: 'var(--echo-300)' }}
              className="transition-colors"
            >
              Clear
            </button>
          </div>
        )}
      </div>

      <p className="t-small text-echo-500 m-0 mb-3">
        Pick up to {MAX_SELECTED} interests and I'll tailor my suggestions.
      </p>

      {/* Chips */}
      <div className="flex flex-wrap gap-2 mb-3">
        {INTEREST_OPTIONS.map(item => (
          <Chip
            key={item.id}
            variant={currentInterests.includes(item.id) ? 'primary' : 'outline'}
            onClick={() => toggle(item.id)}
          >
            {item.label}
          </Chip>
        ))}
      </div>

      {/* Button row — animated height collapse using grid-template-rows */}
      <div style={{
        display: 'grid',
        gridTemplateRows: showButtons ? '1fr' : '0fr',
        opacity: showButtons ? 1 : 0,
        transition: showButtons
          ? 'grid-template-rows 0.25s cubic-bezier(0.16, 1, 0.3, 1), opacity 0.2s ease'
          : 'grid-template-rows 0.55s cubic-bezier(0.16, 1, 0.3, 1) 0.1s, opacity 0.45s ease 0.05s',
      }}>
        <div style={{ overflow: 'hidden' }}>
          <div className="flex gap-2 pt-0">
            {/* Cancel — only when dirty after first save */}
            {isDirty && (
              <button
                onClick={handleCancel}
                className="btn btn-light btn-sm flex-1"
              >
                Cancel
              </button>
            )}

            {/* Save / Save Changes */}
            <button
              onClick={handleSave}
              disabled={saveState === 'saving' || count === 0}
              className={`btn btn-sm flex-1 ${saveState === 'saved' ? 'btn-dark' : 'btn-primary'}`}
            >
              {saveState === 'saved'
                ? 'Saved!'
                : saveState === 'saving'
                ? 'Saving...'
                : isDirty ? 'Save Changes' : 'Save interests'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
