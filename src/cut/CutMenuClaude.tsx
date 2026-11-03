import { useMemo, useState } from 'react'
import type { CutLog } from '../hooks/useCutLog'
import { ClaudeReply, SendToClaude, useFlash, useSessionDraft, useSharedReply } from './ClaudeBridge'
import { fmtMacros } from './CutClaude'
import { buildMenuPrompt, lineMacros, parseMenuReply, type MenuMeal, type MenuScope } from './claude'
import { ZERO_MACROS, dayTotals, sumMacros } from './model'

type Props = { cut: CutLog; day: string }

function parseOrError(text: string): { meals: MenuMeal[]; error: string | null } {
  if (!text.trim()) return { meals: [], error: null }
  try {
    return { meals: parseMenuReply(text), error: null }
  } catch (e) {
    return { meals: [], error: (e as Error).message }
  }
}

const SCOPES: { id: MenuScope; label: string }[] = [
  { id: 'day', label: 'a full day' },
  { id: 'rest', label: 'the rest of this day' },
]

/**
 * Ask Claude to suggest or rework the menu ("set the table") against the daily calorie and
 * protein targets — either a whole day, or what's left of the day being viewed.
 */
export function CutMenuClaude({ cut, day }: Props) {
  const { state, applyMenu, logMenu } = cut
  const s = state.settings
  const [scope, setScope] = useState<MenuScope>('day')
  const [changes, setChanges] = useSessionDraft('health:cut:menu-draft')
  const shared = useSharedReply('menu')
  const [reply, setReply] = useState(shared ?? '')
  const [meals, setMeals] = useState<MenuMeal[]>(() => parseOrError(shared ?? '').meals)
  const [error, setError] = useState<string | null>(() => parseOrError(shared ?? '').error)
  const [flash, setFlash] = useFlash()

  const eaten = useMemo(() => dayTotals(state, day), [state, day])
  const prompt = useMemo(
    () => buildMenuPrompt({ settings: s, foods: state.foods, meals: state.meals, eaten }, scope, changes),
    [s, state.foods, state.meals, eaten, scope, changes],
  )

  const readReply = (text: string) => {
    const r = parseOrError(text)
    setReply(text)
    setMeals(r.meals)
    setError(r.error)
  }

  const rows = meals.map((m) => {
    const lines = m.items.map((it) => lineMacros(state.foods, it))
    return { meal: m, total: lines.reduce((a, l) => sumMacros(a, l), ZERO_MACROS) }
  })
  const total = rows.reduce((a, r) => sumMacros(a, r.total), ZERO_MACROS)
  // A full-day menu is measured against the targets; the rest of a day against what's left.
  const kcalGoal = scope === 'day' ? s.kcal : Math.max(0, s.kcal - eaten.kcal)
  const pGoal = scope === 'day' ? s.protein : Math.max(0, s.protein - eaten.p)
  const kcalOff = Math.abs(total.kcal - kcalGoal) > kcalGoal * 0.05

  const done = (msg: string) => {
    readReply('')
    setChanges('')
    setFlash(msg)
  }
  const n = meals.length
  const plural = `${n} ${n === 1 ? 'meal' : 'meals'}`

  return (
    <details className="cut-claude" open={shared !== null || undefined}>
      <summary className="cut-claude-summary">
        <span className="glyph">✦</span> plan the menu with claude
      </summary>

      <ol className="cut-claude-steps">
        <li>
          <span className="cut-claude-step">what should claude plan?</span>
          <div className="cut-claude-row" role="radiogroup" aria-label="Plan for">
            {SCOPES.map((o) => (
              <button
                key={o.id}
                type="button"
                role="radio"
                aria-checked={scope === o.id}
                className={`cut-claude-chip ${scope === o.id ? 'is-active' : ''}`}
                onClick={() => setScope(o.id)}
              >
                {o.label}
              </button>
            ))}
          </div>
          <p className="cut-note cut-claude-target">
            {scope === 'day'
              ? `aiming at ${s.kcal.toLocaleString()} kcal and ${s.protein} g protein, window ${s.winStart}–${s.winEnd}.`
              : `${Math.round(kcalGoal).toLocaleString()} kcal and ${Math.round(pGoal)} g protein left on this day.`}
          </p>
          <label className="cut-field cut-claude-desc">
            <span className="cut-field-label">changes · optional</span>
            <textarea
              rows={2}
              value={changes}
              placeholder="e.g. swap the schnitzel, no beef this week, add a snack under 200 kcal"
              onChange={(e) => setChanges(e.target.value)}
            />
          </label>
          <SendToClaude prompt={prompt} onFlash={setFlash} />
        </li>

        <li>
          <span className="cut-claude-step">paste claude’s menu</span>
          <ClaudeReply reply={reply} error={error} onReply={readReply} onError={setError} />
        </li>
      </ol>

      {rows.length ? (
        <div className="cut-claude-preview">
          <ul className="entry-list">
            {rows.map(({ meal, total: t }, i) => (
              <li key={`${i}-${meal.name}`} className="cut-row cut-menu-row">
                <span className="cut-row-name">
                  {meal.name.toLowerCase()}
                  {state.meals.some((m) => m.name.trim().toLowerCase() === meal.name.trim().toLowerCase()) ? (
                    <span className="cut-claude-tag">replaces</span>
                  ) : null}
                </span>
                <span className="cut-menu-items">
                  {meal.items.map((it) => `${it.name} ${it.g} g`).join(' · ')}
                </span>
                <span className="cut-row-macros">{fmtMacros(t)}</span>
                <button
                  type="button"
                  className="entry-undo"
                  aria-label={`Drop ${meal.name}`}
                  onClick={() => setMeals((xs) => xs.filter((_, j) => j !== i))}
                >
                  drop
                </button>
              </li>
            ))}
          </ul>
          <div className="cut-claude-total">
            <span>
              {scope === 'day' ? 'day' : 'rest of day'} ·{' '}
              <strong className={kcalOff ? 'is-off' : ''}>{Math.round(total.kcal).toLocaleString()}</strong> of{' '}
              {Math.round(kcalGoal).toLocaleString()} kcal · {Math.round(total.p)} of {Math.round(pGoal)} g protein
            </span>
          </div>
          <div className="cut-claude-row cut-menu-actions">
            {scope === 'rest' ? (
              <button
                type="button"
                className="cut-primary"
                onClick={() => {
                  logMenu(day, meals)
                  done(`${plural} on the plate`)
                }}
              >
                put on the plate
              </button>
            ) : null}
            <button
              type="button"
              className={scope === 'day' ? 'cut-primary' : 'cut-secondary'}
              onClick={() => {
                applyMenu(meals, 'merge')
                done(`${plural} added to the menu`)
              }}
            >
              add to menu
            </button>
            {scope === 'day' ? (
              <button
                type="button"
                className="cut-secondary"
                onClick={() => {
                  if (!window.confirm(`Replace all ${state.meals.length} menu meals with these ${n}?`)) return
                  applyMenu(meals, 'replace')
                  done(`menu replaced · ${plural}`)
                }}
              >
                replace menu
              </button>
            ) : null}
          </div>
          <p className="cut-note">
            meals with a name already on the menu replace it. new foods join the pantry at claude’s
            values; pantry names use yours.
          </p>
        </div>
      ) : null}

      {flash ? (
        <p className="cut-claude-flash" role="status">
          {flash}
        </p>
      ) : null}
    </details>
  )
}
