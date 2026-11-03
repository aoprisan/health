/**
 * Hand a meal to the Claude app on the phone and read its estimate back.
 *
 * There is no API key and no backend: the prompt goes out through the share sheet (or a
 * claude.ai link), Claude answers in its own app, and the reply is pasted back here. The
 * prompt asks for a fenced JSON block; `parseClaudeReply` digs it out of whatever prose
 * surrounds it and is lenient about key names, units in strings and trailing commas.
 */
import { mealMacros, r1, type CutSettings, type Food, type Macros, type Meal } from './model'

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

const ITEM_KEYS = ['items', 'foods', 'ingredients', 'components']

/** The food lines in a parsed value: an array of foods, `{items: [...]}`, or one food alone. */
function itemsOf(data: unknown): EstimateItem[] {
  const list = Array.isArray(data)
    ? data
    : data && typeof data === 'object'
      ? pick(data as Record<string, unknown>, ITEM_KEYS)
      : undefined
  const arr = Array.isArray(list) ? list : data && typeof data === 'object' ? [data] : []
  return arr.map(itemFrom).filter((x): x is EstimateItem => x !== null)
}

/** Each JSON value found in the text, in the order `candidates` ranks them. */
function* parsedCandidates(text: string): Generator<unknown> {
  for (const c of candidates(text)) {
    try {
      yield lenientParse(c)
    } catch {
      // not JSON — try the next candidate
    }
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
  for (const data of parsedCandidates(text)) {
    const items = itemsOf(data)
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

/* ─── menu planning ──────────────────────────────────────────── */

/** A meal Claude proposes for the menu, its foods still named rather than resolved to ids. */
export type MenuMeal = { name: string; items: EstimateItem[] }

export type MenuScope = 'day' | 'rest'

export type MenuContext = {
  settings: CutSettings
  foods: Food[]
  meals: Meal[]
  /** What is already logged today — used when planning the rest of the day. */
  eaten: Macros
}

const per100 = (f: Food) =>
  `${r1(f.kcal)} / ${r1(f.p)} / ${f.c === undefined ? '?' : r1(f.c)} / ${f.f === undefined ? '?' : r1(f.f)}`

export function buildMenuPrompt(ctx: MenuContext, scope: MenuScope, changes: string): string {
  const { settings: s, foods, meals, eaten } = ctx
  const lines: string[] = []
  if (scope === 'day') {
    lines.push(
      'Help me plan the menu for my cut — the set of meals I pick from each day.',
      `Daily targets: ${s.kcal} kcal and at least ${s.protein} g protein, eaten between ${s.winStart} and ${s.winEnd}.`,
      'Suggest a full day of meals that together land within about 3% of the calorie target and reach the protein target.',
    )
  } else {
    const kcalLeft = Math.max(0, Math.round(s.kcal - eaten.kcal))
    const pLeft = Math.max(0, Math.round(s.protein - eaten.p))
    lines.push(
      'Suggest what to eat for the rest of today on my cut.',
      `Daily targets: ${s.kcal} kcal and at least ${s.protein} g protein; my eating window closes at ${s.winEnd}.`,
      `Eaten so far: ${Math.round(eaten.kcal)} kcal and ${Math.round(eaten.p)} g protein — that leaves ${kcalLeft} kcal and ${pLeft} g protein.`,
      'Suggest one to three meals that use up the remaining calories (within about 3%) and close the protein gap.',
    )
  }

  if (meals.length) {
    lines.push('', 'My current menu:')
    for (const m of meals) {
      const parts = m.items.map(([id, g]) => `${foods.find((f) => f.id === id)?.name ?? id} ${g} g`)
      const t = mealMacros(foods, m)
      lines.push(`- ${m.name}: ${parts.join(', ')} (${Math.round(t.kcal)} kcal, ${Math.round(t.p)} g protein)`)
    }
  }
  if (foods.length) {
    lines.push('', 'My pantry, per 100 g (kcal / protein / carbs / fat):')
    for (const f of foods) lines.push(`- ${f.name}: ${per100(f)}`)
  }

  const want = changes.trim()
  lines.push('', want ? `Changes I want: ${want}` : 'Improve on my current menu where it helps; keep what already works.')
  lines.push(
    'Build meals mostly from pantry foods and use their names exactly; other foods are fine when they help.',
    'Give a weight in grams as eaten for every food, and that portion’s totals (not per 100 g).',
    scope === 'day'
      ? 'Return every meal of the menu, including the ones you keep unchanged.'
      : 'Return only the new meals for today.',
    '',
    'Explain your choices in a few short lines, then end with only this JSON in a ```json block:',
    '{"meals":[{"name":"Skyr bowl","items":[{"name":"Skyr (plain)","g":400,"kcal":252,"protein":44,"carbs":16,"fat":1}]}]}',
  )
  return lines.join('\n')
}

/** The meals in a pasted menu reply; throws a readable error when there are none. */
export function parseMenuReply(text: string): MenuMeal[] {
  if (!text.trim()) throw new Error('paste claude’s reply first')
  for (const data of parsedCandidates(text)) {
    const list = Array.isArray(data)
      ? data
      : data && typeof data === 'object'
        ? pick(data as Record<string, unknown>, ['meals', 'menu', 'plan'])
        : undefined
    if (!Array.isArray(list)) continue
    const meals = list.flatMap((m, i): MenuMeal[] => {
      if (!m || typeof m !== 'object') return []
      const name = pick(m as Record<string, unknown>, ['name', 'meal', 'title'])
      const items = itemsOf(pick(m as Record<string, unknown>, ITEM_KEYS) ?? [])
      if (!items.length) return []
      return [{ name: typeof name === 'string' && name.trim() ? name.trim() : `meal ${i + 1}`, items }]
    })
    if (meals.length) return meals
  }
  throw new Error('no menu found — the reply needs the json block with "meals", each with its items')
}

/** Whether a pasted or shared reply is a menu (has "meals") or a single meal's estimate. */
export function replyKind(text: string): 'menu' | 'meal' {
  try {
    parseMenuReply(text)
    return 'menu'
  } catch {
    return 'meal'
  }
}

/**
 * Turn named food lines into pantry ids: a name already in the pantry uses that food (your own
 * values win), anything else becomes a new food at Claude's per-100 g values.
 */
export function resolveItems(
  foods: Food[],
  items: EstimateItem[],
  stamp = Date.now().toString(36),
): { foods: Food[]; pairs: [foodId: string, grams: number][] } {
  const next = [...foods]
  const pairs: [string, number][] = []
  items.forEach((it, i) => {
    if (!(it.g > 0)) return
    let food = pantryMatch(next, it.name)
    if (!food) {
      food = { id: `c${stamp}${i}`, name: it.name, kcal: it.kcal, p: it.p, c: it.c, f: it.f }
      next.push(food)
    }
    pairs.push([food.id, it.g])
  })
  return { foods: next, pairs }
}

/** Macros a line will actually log: the pantry food's when the name matches, else Claude's. */
export function lineMacros(foods: Food[], it: EstimateItem): Macros & { inPantry: boolean } {
  const food = pantryMatch(foods, it.name)
  const k = it.g / 100
  if (food) {
    return { kcal: food.kcal * k, p: food.p * k, c: (food.c ?? 0) * k, f: (food.f ?? 0) * k, inPantry: true }
  }
  return { kcal: it.kcal * k, p: it.p * k, c: it.c * k, f: it.f * k, inPantry: false }
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
