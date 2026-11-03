import { useMemo, useState } from 'react'
import type { CutLog } from '../hooks/useCutLog'
import { ClaudeReply, SendToClaude, useFlash, useSessionDraft, useSharedReply } from './ClaudeBridge'
import { buildMealPrompt, lineMacros, parseClaudeReply, type EstimateItem } from './claude'
import { ZERO_MACROS, r1, sumMacros, type Macros } from './model'

type Props = { cut: CutLog; day: string }

function parseOrError(text: string): { items: EstimateItem[]; error: string | null } {
  if (!text.trim()) return { items: [], error: null }
  try {
    return { items: parseClaudeReply(text), error: null }
  } catch (e) {
    return { items: [], error: (e as Error).message }
  }
}

export const fmtMacros = (m: Macros) =>
  `${Math.round(m.kcal)} kcal · ${r1(m.p)} p · ${r1(m.c)} c · ${r1(m.f)} f`

/**
 * Ask Claude (the phone app, or claude.ai) to estimate a meal, then paste its answer back.
 * Step one sends a prompt — with an optional photo — through the share sheet; step two reads
 * the JSON block out of the reply and previews it before anything is logged.
 */
export function CutClaude({ cut, day }: Props) {
  const { state, addEstimate } = cut
  const [desc, setDesc] = useSessionDraft('health:cut:claude-draft')
  const [photo, setPhoto] = useState<File | null>(null)
  // A meal reply shared into the installed app arrives here pre-filled, with the panel open.
  const shared = useSharedReply('meal')
  const [reply, setReply] = useState(shared ?? '')
  const [items, setItems] = useState<EstimateItem[]>(() => parseOrError(shared ?? '').items)
  const [error, setError] = useState<string | null>(() => parseOrError(shared ?? '').error)
  const [flash, setFlash] = useFlash()

  const prompt = useMemo(
    () => buildMealPrompt(desc, state.foods, photo !== null),
    [desc, state.foods, photo],
  )
  const ready = desc.trim() !== '' || photo !== null

  const readReply = (text: string) => {
    const r = parseOrError(text)
    setReply(text)
    setItems(r.items)
    setError(r.error)
  }

  const lines = items.map((it) => ({ it, m: lineMacros(state.foods, it) }))
  const total = lines.reduce((acc, l) => sumMacros(acc, l.m), ZERO_MACROS)

  const setGrams = (i: number, g: number) =>
    setItems((xs) => xs.map((x, j) => (j === i ? { ...x, g } : x)))

  const log = () => {
    const keep = items.filter((x) => x.g > 0)
    if (!keep.length) return
    addEstimate(day, keep)
    readReply('')
    setDesc('')
    setPhoto(null)
    setFlash(`${keep.length} ${keep.length === 1 ? 'food' : 'foods'} on the plate`)
  }

  return (
    <details className="cut-claude" open={shared !== null || undefined}>
      <summary className="cut-claude-summary">
        <span className="glyph">✦</span> estimate a meal with claude
      </summary>

      <ol className="cut-claude-steps">
        <li>
          <span className="cut-claude-step">describe it, or snap it</span>
          <label className="cut-field cut-claude-desc">
            <span className="cut-field-label">what did you eat?</span>
            <textarea
              rows={2}
              value={desc}
              placeholder="e.g. chicken shawarma wrap, small ayran"
              onChange={(e) => setDesc(e.target.value)}
            />
          </label>
          <div className="cut-claude-row">
            <label className="cut-secondary cut-claude-file">
              {photo ? 'change photo' : 'add photo'}
              <input type="file" accept="image/*" onChange={(e) => setPhoto(e.target.files?.[0] ?? null)} />
            </label>
            {photo ? (
              <button type="button" className="cut-claude-chip" onClick={() => setPhoto(null)}>
                {photo.name.length > 22 ? `${photo.name.slice(0, 20)}…` : photo.name} ✕
              </button>
            ) : null}
          </div>
          <SendToClaude prompt={prompt} photo={photo} disabled={!ready} onFlash={setFlash} />
        </li>

        <li>
          <span className="cut-claude-step">paste claude’s reply</span>
          <ClaudeReply reply={reply} error={error} onReply={readReply} onError={setError} />
        </li>
      </ol>

      {lines.length ? (
        <div className="cut-claude-preview">
          <ul className="entry-list">
            {lines.map(({ it, m }, i) => (
              <li key={`${i}-${it.name}`} className="cut-row">
                <span className="cut-row-name">
                  {it.name}
                  {m.inPantry ? <span className="cut-claude-tag">pantry</span> : null}
                </span>
                <span className="cut-row-grams">
                  <input
                    type="number"
                    min={0}
                    inputMode="decimal"
                    value={it.g}
                    aria-label={`Grams of ${it.name}`}
                    onChange={(e) => setGrams(i, Number(e.target.value) || 0)}
                  />
                  <span className="unit">g</span>
                </span>
                <span className="cut-row-macros">{fmtMacros(m)}</span>
                <button
                  type="button"
                  className="entry-undo"
                  aria-label={`Drop ${it.name}`}
                  onClick={() => setItems((xs) => xs.filter((_, j) => j !== i))}
                >
                  drop
                </button>
              </li>
            ))}
          </ul>
          <div className="cut-claude-total">
            <span>
              meal · <strong>{Math.round(total.kcal)} kcal</strong> · {Math.round(total.p)} g protein ·{' '}
              {Math.round(total.c)} g carbs · {Math.round(total.f)} g fat
            </span>
            <button type="button" className="cut-primary" onClick={log}>
              add to plate
            </button>
          </div>
          <p className="cut-note">
            new foods join the pantry at claude’s per-100 g values; names already in the pantry use yours.
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
