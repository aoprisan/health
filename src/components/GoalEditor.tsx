import { useState } from 'react'

type Props = {
  goal: number
  onSave: (goal: number) => void
  unit?: string
  triggerLabel?: string
  fieldLabel?: string
}

export function GoalEditor({
  goal,
  onSave,
  unit = 'ml',
  triggerLabel = 'revise daily goal',
  fieldLabel = 'new goal',
}: Props) {
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState(String(goal))

  if (!editing) {
    return (
      <button
        type="button"
        className="goal-trigger"
        onClick={() => {
          setDraft(String(goal))
          setEditing(true)
        }}
      >
        {triggerLabel}
      </button>
    )
  }

  return (
    <form
      className="goal-form"
      onSubmit={(e) => {
        e.preventDefault()
        const n = Number(draft)
        if (Number.isFinite(n) && n > 0) {
          onSave(n)
          setEditing(false)
        }
      }}
    >
      <label htmlFor="goal-input">{fieldLabel}</label>
      <input
        id="goal-input"
        type="number"
        min={1}
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        inputMode="numeric"
        autoFocus
        aria-label={`Daily goal in ${unit}`}
      />
      <span>{unit}</span>
      <span className="actions">
        <button type="submit" className="save">save</button>
        <button type="button" className="cancel" onClick={() => setEditing(false)}>cancel</button>
      </span>
    </form>
  )
}
