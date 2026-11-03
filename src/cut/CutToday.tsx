import { useMemo, useState } from 'react'
import type { CutLog } from '../hooks/useCutLog'
import { CutClaude } from './CutClaude'
import { CutMenuClaude } from './CutMenuClaude'
import {
  addDays,
  dayTotals,
  entryMacros,
  foodById,
  mealMacros,
  r1,
  todayIso,
  windowOpen,
} from './model'

type Props = { cut: CutLog; now: number }

function dayTitle(day: string, today: string): string {
  const d = new Date(`${day}T12:00:00`)
  const label = d
    .toLocaleDateString(undefined, { weekday: 'long', day: 'numeric', month: 'long' })
    .toLowerCase()
  if (day === today) return `today · ${label}`
  if (day === addDays(today, -1)) return `yesterday · ${label}`
  return label
}

export function CutToday({ cut, now }: Props) {
  const { state, addFood, addMeal, setEntryGrams, removeEntry } = cut
  const s = state.settings
  const today = todayIso(now)
  const [day, setDay] = useState(today)
  const [foodId, setFoodId] = useState(state.foods[0]?.id ?? '')
  const [grams, setGrams] = useState('')

  const { kcal, p, c, f } = useMemo(() => dayTotals(state, day), [state, day])
  const entries = state.days[day]?.entries ?? []
  const selected = foodById(state.foods, foodId) ? foodId : state.foods[0]?.id ?? ''

  const kcalLeft = s.kcal - kcal
  const pLeft = s.protein - p
  const over = kcal > s.kcal * 1.03
  const open = windowOpen(s, now)

  return (
    <>
      <section className="cut-hero">
        <div className="cut-daynav">
          <button
            type="button"
            className="cut-daynav-step"
            aria-label="Previous day"
            onClick={() => setDay((d) => addDays(d, -1))}
          >
            ‹
          </button>
          <div className="cut-daynav-center">
            <div className="cut-daynav-title">{dayTitle(day, today)}</div>
            {day === today ? (
              <span className={`cut-window ${open ? 'is-open' : 'is-closed'}`}>
                {open
                  ? `eating window open · closes ${s.winEnd}`
                  : `fasting · window ${s.winStart}–${s.winEnd}`}
              </span>
            ) : (
              <button type="button" className="cut-window is-link" onClick={() => setDay(today)}>
                back to today
              </button>
            )}
          </div>
          <button
            type="button"
            className="cut-daynav-step"
            aria-label="Next day"
            disabled={day >= today}
            onClick={() => setDay((d) => (d < today ? addDays(d, 1) : d))}
          >
            ›
          </button>
        </div>

        <div className="cut-macros">
          <div className={`cut-macro ${over ? 'is-over' : ''}`} style={{ ['--macro' as string]: 'var(--kcal)' }}>
            <div className="cut-macro-label">calories</div>
            <div className="cut-macro-value">
              {Math.round(kcal).toLocaleString()}
              <span className="unit">kcal</span>
            </div>
            <div className="cut-bar" aria-hidden="true">
              <div style={{ width: `${Math.min(100, (kcal / s.kcal) * 100)}%` }} />
            </div>
            <div className="cut-macro-sub">
              {kcalLeft >= 0
                ? `${Math.round(kcalLeft).toLocaleString()} left of ${s.kcal.toLocaleString()}`
                : `${Math.round(-kcalLeft).toLocaleString()} over ${s.kcal.toLocaleString()}`}
            </div>
          </div>
          <div className={`cut-macro ${pLeft <= 0 ? 'is-hit' : ''}`} style={{ ['--macro' as string]: 'var(--protein)' }}>
            <div className="cut-macro-label">protein</div>
            <div className="cut-macro-value">
              {Math.round(p)}
              <span className="unit">g</span>
            </div>
            <div className="cut-bar" aria-hidden="true">
              <div style={{ width: `${Math.min(100, (p / s.protein) * 100)}%` }} />
            </div>
            <div className="cut-macro-sub">
              {pLeft > 0 ? `${Math.round(pLeft)} g to go of ${s.protein}` : `target kept — ${s.protein} g`}
            </div>
          </div>
        </div>
        <div className="cut-minor" aria-label="Carbs and fat">
          <span>
            carbs <strong>{Math.round(c)}</strong> g
          </span>
          <span>
            fat <strong>{Math.round(f)}</strong> g
          </span>
        </div>
      </section>

      <section className="section">
        <h2 className="section-title">
          <span className="glyph">~</span> set the table <span className="glyph">~</span>
        </h2>
        <div className="cut-meals">
          {state.meals.map((m) => {
            const mm = mealMacros(state.foods, m)
            return (
              <button key={m.name} type="button" className="cut-meal" onClick={() => addMeal(day, m)}>
                <span className="cut-meal-name">{m.name.toLowerCase()}</span>
                <span className="cut-meal-macros">
                  {Math.round(mm.kcal)} kcal · {Math.round(mm.p)} g
                </span>
              </button>
            )
          })}
        </div>

        <form
          className="cut-add"
          onSubmit={(e) => {
            e.preventDefault()
            const g = Number(grams.replace(',', '.'))
            if (!selected || !(g > 0)) return
            addFood(day, selected, g)
            setGrams('')
          }}
        >
          <label className="cut-field cut-field-grow">
            <span className="cut-field-label">food</span>
            <select value={selected} onChange={(e) => setFoodId(e.target.value)}>
              {state.foods.map((f) => (
                <option key={f.id} value={f.id}>
                  {f.name}
                </option>
              ))}
            </select>
          </label>
          <label className="cut-field">
            <span className="cut-field-label">grams</span>
            <input
              type="number"
              min={0}
              inputMode="decimal"
              placeholder="—"
              value={grams}
              onChange={(e) => setGrams(e.target.value)}
            />
          </label>
          <button type="submit" className="cut-primary">add</button>
        </form>

        <CutClaude cut={cut} day={day} />
        <CutMenuClaude cut={cut} day={day} />
      </section>

      <section className="section">
        <h2 className="section-title">the plate</h2>
        {entries.length === 0 ? (
          <p className="empty-note">— nothing eaten yet. set the table above.</p>
        ) : (
          <ul className="entry-list">
            {entries.map((e, i) => {
              const f = foodById(state.foods, e.foodId)
              const m = entryMacros(state.foods, e)
              return (
                <li key={`${day}-${i}-${e.foodId}-${e.g}`} className="cut-row">
                  <span className="cut-row-name">{f?.name ?? '(deleted food)'}</span>
                  <span className="cut-row-grams">
                    <input
                      type="number"
                      min={0}
                      inputMode="decimal"
                      defaultValue={e.g}
                      aria-label={`Grams of ${f?.name ?? 'food'}`}
                      onBlur={(ev) => {
                        const g = Number(ev.target.value)
                        if (g >= 0 && g !== e.g) setEntryGrams(day, i, g)
                        else ev.target.value = String(e.g)
                      }}
                      onKeyDown={(ev) => {
                        if (ev.key === 'Enter') (ev.target as HTMLInputElement).blur()
                      }}
                    />
                    <span className="unit">g</span>
                  </span>
                  <span className="cut-row-macros">
                    {Math.round(m.kcal)} kcal · {r1(m.p)} p
                    {f?.c !== undefined || f?.f !== undefined ? ` · ${r1(m.c)}\u00a0c · ${r1(m.f)}\u00a0f` : ''}
                  </span>
                  <button
                    type="button"
                    className="entry-undo"
                    onClick={() => removeEntry(day, i)}
                    aria-label={`Remove ${f?.name ?? 'entry'}`}
                  >
                    remove
                  </button>
                </li>
              )
            })}
          </ul>
        )}
      </section>
    </>
  )
}
