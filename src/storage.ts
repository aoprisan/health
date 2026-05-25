import {
  DEFAULT_STATE,
  DRINKS,
  type CalorieEntry,
  type DrinkKind,
  type Entry,
  type Fast,
  type State,
} from './types'

const KEY = 'health:v1'

function coerceKind(k: unknown): DrinkKind {
  if (typeof k === 'string' && k in DRINKS) return k as DrinkKind
  return 'water'
}

function coerceEntry(raw: unknown): Entry | null {
  if (!raw || typeof raw !== 'object') return null
  const r = raw as Record<string, unknown>
  if (typeof r.id !== 'string') return null
  if (typeof r.ts !== 'number') return null
  if (typeof r.amountMl !== 'number' || r.amountMl <= 0) return null
  return {
    id: r.id,
    ts: r.ts,
    amountMl: Math.round(r.amountMl),
    kind: coerceKind(r.kind),
  }
}

function coerceCalorieEntry(raw: unknown): CalorieEntry | null {
  if (!raw || typeof raw !== 'object') return null
  const r = raw as Record<string, unknown>
  if (typeof r.id !== 'string') return null
  if (typeof r.ts !== 'number') return null
  if (typeof r.kcal !== 'number' || r.kcal <= 0) return null
  const entry: CalorieEntry = { id: r.id, ts: r.ts, kcal: Math.round(r.kcal) }
  if (typeof r.label === 'string' && r.label.trim()) entry.label = r.label.trim()
  return entry
}

function coerceFast(raw: unknown): Fast | null {
  if (!raw || typeof raw !== 'object') return null
  const r = raw as Record<string, unknown>
  if (typeof r.id !== 'string') return null
  if (typeof r.startTs !== 'number') return null
  const endTs = typeof r.endTs === 'number' ? r.endTs : null
  if (endTs !== null && endTs < r.startTs) return null
  return { id: r.id, startTs: r.startTs, endTs }
}

// At most one fast may be active (endTs === null). If a corrupt payload has
// several open fasts, keep only the newest and drop the older duplicates.
function enforceSingleActive(fasts: Fast[]): Fast[] {
  const active = fasts.filter((f) => f.endTs === null)
  if (active.length <= 1) return fasts
  const newest = active.reduce((a, b) => (b.startTs > a.startTs ? b : a))
  return fasts.filter((f) => f.endTs !== null || f.id === newest.id)
}

function positive(n: unknown, fallback: number): number {
  return typeof n === 'number' && n > 0 ? n : fallback
}

export function loadState(): State {
  try {
    const raw = localStorage.getItem(KEY)
    if (!raw) return DEFAULT_STATE
    const parsed = JSON.parse(raw) as Partial<State>
    const entries = Array.isArray(parsed.entries)
      ? parsed.entries.map(coerceEntry).filter((e): e is Entry => e !== null)
      : []
    const calorieEntries = Array.isArray(parsed.calorieEntries)
      ? parsed.calorieEntries
          .map(coerceCalorieEntry)
          .filter((e): e is CalorieEntry => e !== null)
      : []
    const fasts = enforceSingleActive(
      Array.isArray(parsed.fasts)
        ? parsed.fasts.map(coerceFast).filter((f): f is Fast => f !== null)
        : [],
    )
    return {
      entries,
      settings: {
        dailyGoalMl: positive(parsed.settings?.dailyGoalMl, DEFAULT_STATE.settings.dailyGoalMl),
      },
      calorieEntries,
      calorieSettings: {
        dailyGoalKcal: positive(
          parsed.calorieSettings?.dailyGoalKcal,
          DEFAULT_STATE.calorieSettings.dailyGoalKcal,
        ),
      },
      fasts,
      fastingSettings: {
        targetMs: positive(
          parsed.fastingSettings?.targetMs,
          DEFAULT_STATE.fastingSettings.targetMs,
        ),
      },
    }
  } catch {
    return DEFAULT_STATE
  }
}

export function saveState(state: State): void {
  try {
    localStorage.setItem(KEY, JSON.stringify(state))
  } catch {
    // Private mode or quota exceeded — silently ignore.
  }
}
