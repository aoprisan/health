/**
 * Hand a meal to the Claude app on the phone and read its estimate back.
 *
 * There is no API key and no backend: the prompt goes out through the share sheet (or a
 * claude.ai link), Claude answers in its own app, and the reply is pasted back here. The
 * prompt asks for a fenced JSON block; `parseClaudeReply` digs it out of whatever prose
 * surrounds it and is lenient about key names, units in strings and trailing commas.
 */
import type { Food } from './model'

/** One food from Claude's estimate, normalised to per-100 g so grams stay editable. */
export type EstimateItem = {
  name: string
  g: number
  /** per 100 g */
  kcal: number
  p: number
  c: number
  f: number
}

export const CLAUDE_NEW_CHAT = 'https://claude.ai/new'

export function buildMealPrompt(description: string, pantry: Food[], withPhoto: boolean): string {
  const what = description.trim()
  const lines = [
    withPhoto
      ? 'Estimate the calories and macros of the meal in this photo.'
      : 'Estimate the calories and macros of this meal.',
  ]
  if (what) lines.push(`What I ate: ${what}`)
  lines.push(
    '',
    'Split it into separate foods and estimate the weight of each portion in grams as eaten (cooked weight for cooked food).',
    'For each food give the totals for that portion, not per 100 g: kcal, protein, carbs and fat in grams.',
  )
  if (pantry.length) {
    lines.push(
      `If a food is one of these, use exactly this name: ${pantry.map((f) => f.name).join('; ')}.`,
    )
  }
  lines.push(
    '',
    'Note any assumptions in one or two short lines, then end with only this JSON in a ```json block:',
    '{"items":[{"name":"Grilled chicken breast","g":150,"kcal":248,"protein":46,"carbs":0,"fat":5}]}',
  )
  return lines.join('\n')
}

export function claudeChatUrl(prompt: string): string {
  return `${CLAUDE_NEW_CHAT}?q=${encodeURIComponent(prompt)}`
}

/* ─── reading the reply ────────────────────────────────────── */

const pick = (o: Record<string, unknown>, keys: string[]): unknown => {
  const lower: Record<string, unknown> = {}
  for (const [k, v] of Object.entries(o)) lower[k.toLowerCase().replace(/[\s-]/g, '_')] = v
  for (const k of keys) if (lower[k] !== undefined) return lower[k]
  return undefined
}

/** 150, "150", "150 g", "~150g", "1,5" → number; anything else → NaN. */
function toNum(v: unknown): number {
  if (typeof v === 'number') return v
  if (typeof v !== 'string') return NaN
  const m = v.replace(',', '.').match(/-?\d+(?:\.\d+)?/)
  return m ? Number(m[0]) : NaN
}

const nonNeg = (v: unknown): number => {
  const n = toNum(v)
  return Number.isFinite(n) && n >= 0 ? n : 0
}

const r1 = (x: number) => Math.round(x * 10) / 10

function itemFrom(raw: unknown): EstimateItem | null {
  if (!raw || typeof raw !== 'object') return null
  const o = raw as Record<string, unknown>
  const name = pick(o, ['name', 'food', 'item', 'description'])
  if (typeof name !== 'string' || !name.trim()) return null
  const kcal = toNum(pick(o, ['kcal', 'calories', 'cal', 'energy', 'energy_kcal']))
  if (!Number.isFinite(kcal) || kcal < 0) return null
  const gRaw = toNum(pick(o, ['g', 'grams', 'weight', 'weight_g', 'amount_g', 'portion_g', 'amount', 'portion']))
  // No weight → keep the item as one 100 g "serving" so its totals still land as given.
  const g = Number.isFinite(gRaw) && gRaw > 0 ? gRaw : 100
  const per = 100 / g
  return {
    name: name.trim(),
    g: r1(g),
    kcal: r1(kcal * per),
    p: r1(nonNeg(pick(o, ['protein', 'p', 'protein_g', 'prot'])) * per),
    c: r1(nonNeg(pick(o, ['carbs', 'c', 'carbs_g', 'carbohydrates', 'carbohydrate', 'carb'])) * per),
    f: r1(nonNeg(pick(o, ['fat', 'f', 'fat_g', 'fats', 'total_fat'])) * per),
  }
}

/** Strings that might be the JSON: fenced blocks first (last one wins), then the outermost braces. */
function candidates(text: string): string[] {
  const out: string[] = []
  const fences = [...text.matchAll(/```(?:json|JSON)?\s*([\s\S]*?)```/g)].map((m) => m[1])
  out.push(...fences.reverse())
  for (const [open, close] of [['{', '}'], ['[', ']']] as const) {
    const a = text.indexOf(open)
    const b = text.lastIndexOf(close)
    if (a !== -1 && b > a) out.push(text.slice(a, b + 1))
  }
  return out
}

function lenientParse(s: string): unknown {
  const cleaned = s
    .replace(/[“”„″]/g, '"')
    .replace(/[‘’]/g, "'")
    .replace(/,\s*([}\]])/g, '$1')
    .trim()
  return JSON.parse(cleaned)
}

/** The items in a pasted Claude reply; throws a readable error when there are none. */
export function parseClaudeReply(text: string): EstimateItem[] {
  if (!text.trim()) throw new Error('paste claude’s reply first')
  for (const c of candidates(text)) {
    let data: unknown
    try {
      data = lenientParse(c)
    } catch {
      continue
    }
    const list = Array.isArray(data)
      ? data
      : data && typeof data === 'object'
        ? pick(data as Record<string, unknown>, ['items', 'foods', 'ingredients', 'components'])
        : undefined
    // A single food object on its own is a one-item meal.
    const arr = Array.isArray(list) ? list : data && typeof data === 'object' ? [data] : []
    const items = arr.map(itemFrom).filter((x): x is EstimateItem => x !== null)
    if (items.length) return items
  }
  throw new Error('no meal found — the reply needs the json block with name, g and kcal')
}

/** The pantry food an estimate line refers to, matched by name (case and spacing ignored). */
export function pantryMatch(foods: Food[], name: string): Food | undefined {
  const key = (s: string) => s.toLowerCase().replace(/\s+/g, ' ').trim()
  const k = key(name)
  return foods.find((f) => key(f.name) === k)
}

/* ─── the way back: Claude's reply shared into the installed app ── */

/**
 * The share target opens `/health/?text=…`. Read that once at startup, strip it from the URL
 * (a reload must not log the meal twice) and land on `#cut`, where the panel picks it up.
 */
function takeSharedReply(): string | null {
  if (typeof window === 'undefined') return null
  const q = new URLSearchParams(window.location.search)
  const keys = ['title', 'text', 'url']
  const parts = keys.map((k) => q.get(k)?.trim()).filter((v): v is string => !!v)
  if (!parts.length) return null
  keys.forEach((k) => q.delete(k))
  const rest = q.toString()
  window.history.replaceState(null, '', `${window.location.pathname}${rest ? `?${rest}` : ''}#cut`)
  return parts.join('\n')
}

let sharedReply: string | null = takeSharedReply()

export const peekSharedReply = (): string | null => sharedReply
export const clearSharedReply = (): void => {
  sharedReply = null
}
