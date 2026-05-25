import { useState } from 'react'
import { QUICK_KCAL } from '../types'

type Props = {
  onAdd: (kcal: number, label?: string) => void
}

export function CalorieInput({ onAdd }: Props) {
  const [kcal, setKcal] = useState('')
  const [label, setLabel] = useState('')

  const submit = () => {
    const n = Number(kcal)
    if (!Number.isFinite(n) || n <= 0) return
    onAdd(n, label)
    setKcal('')
    setLabel('')
  }

  return (
    <div className="cal-input">
      <form
        className="cal-input-form"
        onSubmit={(e) => {
          e.preventDefault()
          submit()
        }}
      >
        <input
          className="cal-input-kcal"
          type="number"
          min={1}
          inputMode="numeric"
          placeholder="kcal"
          value={kcal}
          onChange={(e) => setKcal(e.target.value)}
          aria-label="Calories"
        />
        <input
          className="cal-input-label"
          type="text"
          placeholder="label (optional)"
          value={label}
          onChange={(e) => setLabel(e.target.value)}
          aria-label="Label (optional)"
        />
        <button type="submit" className="cal-add">log</button>
      </form>
      <div className="cal-quick" role="group" aria-label="Quick calorie amounts">
        {QUICK_KCAL.map((k) => (
          <button
            key={k}
            type="button"
            className="cal-chip"
            onClick={() => onAdd(k, label.trim() || undefined)}
            aria-label={`Log ${k} calories`}
          >
            +{k}
          </button>
        ))}
      </div>
    </div>
  )
}
