import { DEFAULT_FOODS, defaultCutState, type CutSettings, type CutState, type Food, type FoodEntry } from './model'

const KEY = 'health:cut:v1'
/** The standalone cut tracker's key — read once if this app has no cut data yet. */
const LEGACY_KEY = 'cut-tracker.v1'

const isDay = (v: unknown): v is string => typeof v === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(v)
const isTime = (v: unknown): v is string => typeof v === 'string' && /^\d{2}:\d{2}$/.test(v)
const pos = (v: unknown): v is number => typeof v === 'number' && Number.isFinite(v) && v > 0

function coerceSettings(raw: unknown, base: CutSettings): CutSettings {
  const r = (raw && typeof raw === 'object' ? raw : {}) as Record<string, unknown>
  return {
    kcal: pos(r.kcal) ? r.kcal : base.kcal,
    protein: pos(r.protein) ? r.protein : base.protein,
    winStart: isTime(r.winStart) ? r.winStart : base.winStart,
    winEnd: isTime(r.winEnd) ? r.winEnd : base.winEnd,
    startDate: isDay(r.startDate) ? r.startDate : base.startDate,
    weeks: pos(r.weeks) ? Math.round(r.weeks) : base.weeks,
    startWeight: pos(r.startWeight) ? r.startWeight : null,
    goalWeight: pos(r.goalWeight) ? r.goalWeight : null,
  }
}

function coerceFoods(raw: unknown): Food[] {
  if (!Array.isArray(raw)) return DEFAULT_FOODS.map((f) => ({ ...f }))
  return raw.flatMap((f): Food[] => {
    if (!f || typeof f !== 'object') return []
    const r = f as Record<string, unknown>
    if (typeof r.id !== 'string' || typeof r.name !== 'string') return []
    const num = (v: unknown) => (typeof v === 'number' && Number.isFinite(v) && v >= 0 ? v : 0)
    return [{ id: r.id, name: r.name, kcal: num(r.kcal), p: num(r.p) }]
  })
}

function coerceDays(raw: unknown): CutState['days'] {
  const out: CutState['days'] = {}
  if (!raw || typeof raw !== 'object') return out
  for (const [day, v] of Object.entries(raw as Record<string, unknown>)) {
    if (!isDay(day) || !v || typeof v !== 'object') continue
    const entries = (v as { entries?: unknown }).entries
    if (!Array.isArray(entries)) continue
    const clean = entries.flatMap((e): FoodEntry[] => {
      const r = (e ?? {}) as Record<string, unknown>
      return typeof r.foodId === 'string' && typeof r.g === 'number' && r.g >= 0
        ? [{ foodId: r.foodId, g: r.g }]
        : []
    })
    if (clean.length) out[day] = { entries: clean }
  }
  return out
}

function coerceSeries(raw: unknown): Record<string, number> {
  const out: Record<string, number> = {}
  if (!raw || typeof raw !== 'object') return out
  for (const [day, v] of Object.entries(raw as Record<string, unknown>)) {
    if (isDay(day) && pos(v)) out[day] = v
  }
  return out
}

/** Accepts this app's state or the standalone tracker's export; throws if it is neither. */
export function parseCutState(raw: unknown): CutState {
  if (!raw || typeof raw !== 'object' || !('settings' in raw)) throw new Error('not a cut file')
  const r = raw as Record<string, unknown>
  const base = defaultCutState()
  return {
    settings: coerceSettings(r.settings, base.settings),
    foods: coerceFoods(r.foods),
    days: coerceDays(r.days),
    weights: coerceSeries(r.weights),
    waist: coerceSeries(r.waist),
  }
}

/** Height carried by a standalone-tracker file (it kept its own); this app uses the body measures. */
export function legacyHeightOf(raw: unknown): number | null {
  const h = (raw as { settings?: { height?: unknown } } | null)?.settings?.height
  return typeof h === 'number' && h >= 50 && h <= 260 ? h : null
}

export function loadCutState(): CutState {
  try {
    const raw = localStorage.getItem(KEY) ?? localStorage.getItem(LEGACY_KEY)
    return raw ? parseCutState(JSON.parse(raw)) : defaultCutState()
  } catch {
    return defaultCutState()
  }
}

export function saveCutState(state: CutState): void {
  try {
    localStorage.setItem(KEY, JSON.stringify(state))
  } catch {
    // Private mode or quota exceeded — silently ignore.
  }
}
