import { DEFAULT_STATE, type State } from './types'

const KEY = 'health:v1'

export function loadState(): State {
  try {
    const raw = localStorage.getItem(KEY)
    if (!raw) return DEFAULT_STATE
    const parsed = JSON.parse(raw) as Partial<State>
    return {
      entries: Array.isArray(parsed.entries) ? parsed.entries : [],
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
