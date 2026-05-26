import { DEFAULT_STATE, DRINKS, type DrinkKind, type Entry, type State } from './types'

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

export function loadState(): State {
  try {
    const raw = localStorage.getItem(KEY)
    if (!raw) return DEFAULT_STATE
    const parsed = JSON.parse(raw) as Partial<State>
    const entries = Array.isArray(parsed.entries)
      ? parsed.entries
          .map(coerceEntry)
          .filter((e): e is Entry => e !== null)
      : []
    return {
      entries,
      settings: {
        dailyGoalMl:
          typeof parsed.settings?.dailyGoalMl === 'number' && parsed.settings.dailyGoalMl > 0
            ? parsed.settings.dailyGoalMl
            : DEFAULT_STATE.settings.dailyGoalMl,
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
