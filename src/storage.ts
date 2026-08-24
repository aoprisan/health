import {
  DEFAULT_BODY,
  DEFAULT_STATE,
  DRINKS,
  type Body,
  type DrinkKind,
  type Entry,
  type Sex,
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

function coerceMeasure(v: unknown, min: number, max: number): number | null {
  if (typeof v !== 'number' || !Number.isFinite(v)) return null
  if (v < min || v > max) return null
  return Math.round(v * 10) / 10
}

function coerceSex(v: unknown): Sex {
  return v === 'male' || v === 'female' ? v : 'unspecified'
}

function coerceBody(raw: unknown): Body {
  if (!raw || typeof raw !== 'object') return DEFAULT_BODY
  const r = raw as Record<string, unknown>
  return {
    heightCm: coerceMeasure(r.heightCm, 50, 260),
    weightKg: coerceMeasure(r.weightKg, 20, 400),
    sex: coerceSex(r.sex),
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
        body: coerceBody(parsed.settings?.body),
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
