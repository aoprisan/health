import { useEffect, useMemo, useState } from 'react'
import type { CutLog } from '../hooks/useCutLog'
import {
  buildMealPrompt,
  claudeChatUrl,
  clearSharedReply,
  pantryMatch,
  peekSharedReply,
  parseClaudeReply,
  type EstimateItem,
} from './claude'
import { ZERO_MACROS, entryMacros, r1, sumMacros, type Macros } from './model'

type Props = { cut: CutLog; day: string }

/** The description survives the trip to the Claude app and back, even if the tab reloads. */
const DRAFT_KEY = 'health:cut:claude-draft'

const readDraft = (): string => {
  try {
    return sessionStorage.getItem(DRAFT_KEY) ?? ''
  } catch {
    return ''
  }
}

const canShare = typeof navigator !== 'undefined' && typeof navigator.share === 'function'
const canReadClipboard =
  typeof navigator !== 'undefined' && typeof navigator.clipboard?.readText === 'function'

async function copyText(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text)
    return true
  } catch {
    return false
  }
}

function parseOrError(text: string): { items: EstimateItem[]; error: string | null } {
  if (!text.trim()) return { items: [], error: null }
  try {
    return { items: parseClaudeReply(text), error: null }
  } catch (e) {
    return { items: [], error: (e as Error).message }
  }
}

const fmt = (m: Macros) =>
  `${Math.round(m.kcal)}\u00a0kcal · ${r1(m.p)}\u00a0p · ${r1(m.c)}\u00a0c · ${r1(m.f)}\u00a0f`

/**
 * Ask Claude (the phone app, or claude.ai) to estimate a meal, then paste its answer back.
 * Step one sends a prompt — with an optional photo — through the share sheet; step two reads
 * the JSON block out of the reply and previews it before anything is logged.
 */
export function CutClaude({ cut, day }: Props) {
  const { state, addEstimate } = cut
  const [desc, setDesc] = useState(readDraft)
  const [photo, setPhoto] = useState<File | null>(null)
  // A reply shared into the installed app arrives here pre-filled, with the panel open.
  const [shared] = useState(peekSharedReply)
  const [reply, setReply] = useState(shared ?? '')
  const [items, setItems] = useState<EstimateItem[]>(() => parseOrError(shared ?? '').items)
  const [error, setError] = useState<string | null>(() => parseOrError(shared ?? '').error)
  const [flash, setFlash] = useState<string | null>(null)

  useEffect(() => clearSharedReply(), [])

  useEffect(() => {
    try {
      if (desc) sessionStorage.setItem(DRAFT_KEY, desc)
      else sessionStorage.removeItem(DRAFT_KEY)
    } catch {
      // storage blocked — the draft just won't survive a reload
    }
  }, [desc])

  useEffect(() => {
    if (!flash) return
    const t = window.setTimeout(() => setFlash(null), 2600)
    return () => window.clearTimeout(t)
  }, [flash])

  const prompt = useMemo(
    () => buildMealPrompt(desc, state.foods, photo !== null),
    [desc, state.foods, photo],
  )

  const ready = desc.trim() !== '' || photo !== null

  const openClaudeWeb = async () => {
    // claude.ai/new?q= pre-fills the chat; the copy is a fallback if the app drops the query.
    const copied = await copyText(prompt)
    window.open(claudeChatUrl(prompt), '_blank', 'noopener')
    if (copied) setFlash('prompt copied — paste it if the chat opens empty')
  }

  const ask = async () => {
    if (!ready) return
    if (!canShare) return openClaudeWeb()
    const withFile = photo ? { text: prompt, files: [photo] } : null
    const data: ShareData =
      withFile && navigator.canShare?.(withFile) ? withFile : { text: prompt }
    try {
      await navigator.share(data)
      if (photo && data !== withFile) setFlash('this browser can’t share photos — attach it in claude')
    } catch (e) {
      if ((e as DOMException)?.name !== 'AbortError') void openClaudeWeb()
    }
  }

  const readReply = (text: string) => {
    const r = parseOrError(text)
    setReply(text)
    setItems(r.items)
    setError(r.error)
  }

  const pasteReply = async () => {
    try {
      readReply(await navigator.clipboard.readText())
    } catch {
      setError('couldn’t read the clipboard — long-press the box below and paste')
    }
  }

  /** What each line will actually log: pantry values where the name matches, else Claude's. */
  const lines = items.map((it) => {
    const food = pantryMatch(state.foods, it.name)
    const m: Macros = food
      ? entryMacros(state.foods, { foodId: food.id, g: it.g })
      : { kcal: (it.kcal * it.g) / 100, p: (it.p * it.g) / 100, c: (it.c * it.g) / 100, f: (it.f * it.g) / 100 }
    return { it, inPantry: food !== undefined, m }
  })
  const total = lines.reduce((acc, l) => sumMacros(acc, l.m), ZERO_MACROS)

  const setGrams = (i: number, g: number) =>
    setItems((xs) => xs.map((x, j) => (j === i ? { ...x, g } : x)))

  const reset = () => {
    setReply('')
    setItems([])
    setError(null)
    setDesc('')
    setPhoto(null)
  }

  const log = () => {
    const keep = items.filter((x) => x.g > 0)
    if (!keep.length) return
    addEstimate(day, keep)
    reset()
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
              <input
                type="file"
                accept="image/*"
                onChange={(e) => setPhoto(e.target.files?.[0] ?? null)}
              />
            </label>
            {photo ? (
              <button type="button" className="cut-claude-chip" onClick={() => setPhoto(null)}>
                {photo.name.length > 22 ? `${photo.name.slice(0, 20)}…` : photo.name} ✕
              </button>
            ) : null}
          </div>
          <div className="cut-claude-row">
            <button type="button" className="cut-primary" disabled={!ready} onClick={ask}>
              {canShare ? 'send to claude' : 'open claude'}
            </button>
            {canShare ? (
              <button type="button" className="cut-secondary" disabled={!ready} onClick={openClaudeWeb}>
                claude.ai
              </button>
            ) : null}
            <button
              type="button"
              className="cut-secondary"
              disabled={!ready}
              onClick={async () => setFlash((await copyText(prompt)) ? 'prompt copied' : 'couldn’t copy')}
            >
              copy prompt
            </button>
          </div>
        </li>

        <li>
          <span className="cut-claude-step">paste claude’s reply</span>
          <div className="cut-claude-row">
            {canReadClipboard ? (
              <button type="button" className="cut-primary" onClick={pasteReply}>
                paste reply
              </button>
            ) : null}
            {reply ? (
              <button type="button" className="cut-secondary" onClick={() => readReply('')}>
                clear
              </button>
            ) : null}
          </div>
          <label className="cut-field cut-claude-desc">
            <span className="cut-field-label">reply</span>
            <textarea
              rows={3}
              value={reply}
              placeholder="the whole answer is fine — the json block is picked out"
              onChange={(e) => readReply(e.target.value)}
            />
          </label>
          {error ? <p className="cut-claude-error">{error}</p> : null}
          <p className="cut-note">
            on android, with this app installed, share claude’s answer straight back to it instead.
          </p>
        </li>
      </ol>

      {lines.length ? (
        <div className="cut-claude-preview">
          <ul className="entry-list">
            {lines.map(({ it, inPantry, m }, i) => (
              <li key={`${i}-${it.name}`} className="cut-row">
                <span className="cut-row-name">
                  {it.name}
                  {inPantry ? <span className="cut-claude-tag">pantry</span> : null}
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
                <span className="cut-row-macros">{fmt(m)}</span>
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
