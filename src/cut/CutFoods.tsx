import { useState } from 'react'
import type { CutLog } from '../hooks/useCutLog'

type Props = { cut: CutLog }

const num = (raw: string) => {
  const n = Number(raw.replace(',', '.'))
  return Number.isFinite(n) && n >= 0 ? n : null
}

/** The pantry: per-100 g values, edited in place (saved when a field loses focus). */
export function CutFoods({ cut }: Props) {
  const { state, updateFood, addFoodType, removeFoodType } = cut
  const [name, setName] = useState('')
  const [kcal, setKcal] = useState('')
  const [p, setP] = useState('')

  return (
    <section className="section">
      <h2 className="section-title">the pantry · per 100 g</h2>
      <p className="cut-note">check the lidl schnitzel label and fix its values here.</p>

      <div className="cut-pantry">
        <div className="cut-pantry-head" aria-hidden="true">
          <span>name</span>
          <span>kcal</span>
          <span>protein</span>
          <span />
        </div>
        {state.foods.map((f) => (
          <div key={`${f.id}-${f.name}-${f.kcal}-${f.p}`} className="cut-pantry-row">
            <input
              className="cut-inline is-name"
              defaultValue={f.name}
              aria-label="Food name"
              onBlur={(e) => {
                const v = e.target.value.trim()
                if (v && v !== f.name) updateFood(f.id, { name: v })
                else e.target.value = f.name
              }}
            />
            <input
              className="cut-inline"
              type="number"
              min={0}
              inputMode="decimal"
              defaultValue={f.kcal}
              aria-label={`kcal per 100 g of ${f.name}`}
              onBlur={(e) => {
                const v = num(e.target.value)
                if (v !== null && v !== f.kcal) updateFood(f.id, { kcal: v })
                else e.target.value = String(f.kcal)
              }}
            />
            <input
              className="cut-inline"
              type="number"
              min={0}
              step="0.1"
              inputMode="decimal"
              defaultValue={f.p}
              aria-label={`protein grams per 100 g of ${f.name}`}
              onBlur={(e) => {
                const v = num(e.target.value)
                if (v !== null && v !== f.p) updateFood(f.id, { p: v })
                else e.target.value = String(f.p)
              }}
            />
            <button
              type="button"
              className="entry-undo"
              aria-label={`Delete ${f.name}`}
              onClick={() => removeFoodType(f.id)}
            >
              ✕
            </button>
          </div>
        ))}
      </div>

      <form
        className="cut-add"
        onSubmit={(e) => {
          e.preventDefault()
          if (!name.trim()) return
          addFoodType(name, num(kcal) ?? 0, num(p) ?? 0)
          setName('')
          setKcal('')
          setP('')
        }}
      >
        <label className="cut-field cut-field-grow">
          <span className="cut-field-label">new food</span>
          <input value={name} placeholder="—" onChange={(e) => setName(e.target.value)} />
        </label>
        <label className="cut-field">
          <span className="cut-field-label">kcal</span>
          <input type="number" min={0} inputMode="decimal" placeholder="—" value={kcal} onChange={(e) => setKcal(e.target.value)} />
        </label>
        <label className="cut-field">
          <span className="cut-field-label">protein</span>
          <input type="number" min={0} step="0.1" inputMode="decimal" placeholder="—" value={p} onChange={(e) => setP(e.target.value)} />
        </label>
        <button type="submit" className="cut-primary">add</button>
      </form>
    </section>
  )
}
