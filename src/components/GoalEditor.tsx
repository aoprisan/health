import { useState } from 'react'

type Props = {
  goalMl: number
  onSave: (goalMl: number) => void
}

export function GoalEditor({ goalMl, onSave }: Props) {
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState(String(goalMl))

  if (!editing) {
    return (
      <button
        type="button"
        className="goal-trigger"
        onClick={() => {
          setDraft(String(goalMl))
          setEditing(true)
        }}
      >
        revise daily goal
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
      <label htmlFor="goal-input">new goal</label>
      <input
        id="goal-input"
        type="number"
        min={1}
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        inputMode="numeric"
        autoFocus
        aria-label="Daily goal in millilitres"
      />
      <span>ml</span>
      <span className="actions">
        <button type="submit" className="save">save</button>
        <button type="button" className="cancel" onClick={() => setEditing(false)}>cancel</button>
      </span>
    </form>
  )
}
