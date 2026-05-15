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
        className="goal-edit-btn"
        onClick={() => {
          setDraft(String(goalMl))
          setEditing(true)
        }}
      >
        Edit goal ({goalMl} ml)
      </button>
    )
  }

  return (
    <form
      className="goal-editor"
      onSubmit={(e) => {
        e.preventDefault()
        const n = Number(draft)
        if (Number.isFinite(n) && n > 0) {
          onSave(n)
          setEditing(false)
        }
      }}
    >
      <label className="goal-label" htmlFor="goal-input">
        Daily goal (ml)
      </label>
      <div className="goal-row">
        <input
          id="goal-input"
          type="number"
          min={1}
          step={50}
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          inputMode="numeric"
          autoFocus
        />
        <button type="submit" className="primary">Save</button>
        <button type="button" onClick={() => setEditing(false)}>Cancel</button>
      </div>
    </form>
  )
}
