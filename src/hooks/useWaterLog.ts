import { useCallback, useEffect, useMemo, useState } from 'react'
import { loadState, saveState } from '../storage'
import { hydrationOf, type DayLog, type DrinkKind, type Entry, type State } from '../types'

function localDateKey(ts: number): string {
  const d = new Date(ts)
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

function makeId(): string {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`
}

export function useWaterLog() {
  const [state, setState] = useState<State>(() => loadState())

  useEffect(() => {
    saveState(state)
  }, [state])

  const addEntry = useCallback((amountMl: number, kind: DrinkKind = 'water') => {
    if (!Number.isFinite(amountMl) || amountMl <= 0) return
    setState((s) => ({
      ...s,
      entries: [
        ...s.entries,
        { id: makeId(), ts: Date.now(), amountMl: Math.round(amountMl), kind },
      ],
    }))
  }, [])

  const undoEntry = useCallback((id: string) => {
    setState((s) => ({ ...s, entries: s.entries.filter((e) => e.id !== id) }))
  }, [])

  const setGoal = useCallback((dailyGoalMl: number) => {
    if (!Number.isFinite(dailyGoalMl) || dailyGoalMl <= 0) return
    setState((s) => ({ ...s, settings: { ...s.settings, dailyGoalMl: Math.round(dailyGoalMl) } }))
  }, [])

  const today = localDateKey(Date.now())

  const todayEntries = useMemo<Entry[]>(
    () =>
      state.entries
        .filter((e) => localDateKey(e.ts) === today)
        .sort((a, b) => b.ts - a.ts),
    [state.entries, today],
  )

  const todayTotal = useMemo(
    () => todayEntries.reduce((sum, e) => sum + e.amountMl, 0),
    [todayEntries],
  )

  const todayHydrationMl = useMemo(
    () => Math.round(todayEntries.reduce((sum, e) => sum + hydrationOf(e), 0)),
    [todayEntries],
  )

  const historyByDay = useMemo<DayLog[]>(() => {
    const groups = new Map<string, Entry[]>()
    for (const e of state.entries) {
      const key = localDateKey(e.ts)
      if (key === today) continue
      const arr = groups.get(key) ?? []
      arr.push(e)
      groups.set(key, arr)
    }
    return [...groups.entries()]
      .map(([date, entries]) => ({
        date,
        entries: entries.sort((a, b) => b.ts - a.ts),
        totalMl: entries.reduce((s, e) => s + e.amountMl, 0),
        hydrationMl: Math.round(entries.reduce((s, e) => s + hydrationOf(e), 0)),
      }))
      .sort((a, b) => (a.date < b.date ? 1 : -1))
  }, [state.entries, today])

  return {
    goalMl: state.settings.dailyGoalMl,
    todayTotal,
    todayHydrationMl,
    todayEntries,
    historyByDay,
    addEntry,
    undoEntry,
    setGoal,
  }
}
