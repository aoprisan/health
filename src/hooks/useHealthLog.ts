import { useCallback, useEffect, useMemo, useState } from 'react'
import { loadState, saveState } from '../storage'
import {
  hydrationOf,
  type CalorieDayLog,
  type CalorieEntry,
  type DayLog,
  type DrinkKind,
  type Entry,
  type Fast,
  type State,
} from '../types'

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

export function useHealthLog() {
  const [state, setState] = useState<State>(() => loadState())

  useEffect(() => {
    saveState(state)
  }, [state])

  const today = localDateKey(Date.now())

  // ── Water ────────────────────────────────────────────────────────────
  const addDrink = useCallback((amountMl: number, kind: DrinkKind = 'water') => {
    if (!Number.isFinite(amountMl) || amountMl <= 0) return
    setState((s) => ({
      ...s,
      entries: [
        ...s.entries,
        { id: makeId(), ts: Date.now(), amountMl: Math.round(amountMl), kind },
      ],
    }))
  }, [])

  const undoDrink = useCallback((id: string) => {
    setState((s) => ({ ...s, entries: s.entries.filter((e) => e.id !== id) }))
  }, [])

  const setWaterGoal = useCallback((dailyGoalMl: number) => {
    if (!Number.isFinite(dailyGoalMl) || dailyGoalMl <= 0) return
    setState((s) => ({ ...s, settings: { ...s.settings, dailyGoalMl: Math.round(dailyGoalMl) } }))
  }, [])

  const todayEntries = useMemo<Entry[]>(
    () => state.entries.filter((e) => localDateKey(e.ts) === today).sort((a, b) => b.ts - a.ts),
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

  // ── Calories ─────────────────────────────────────────────────────────
  const addCalorie = useCallback((kcal: number, label?: string) => {
    if (!Number.isFinite(kcal) || kcal <= 0) return
    const trimmed = label?.trim()
    setState((s) => ({
      ...s,
      calorieEntries: [
        ...s.calorieEntries,
        {
          id: makeId(),
          ts: Date.now(),
          kcal: Math.round(kcal),
          ...(trimmed ? { label: trimmed } : {}),
        },
      ],
    }))
  }, [])

  const undoCalorie = useCallback((id: string) => {
    setState((s) => ({ ...s, calorieEntries: s.calorieEntries.filter((e) => e.id !== id) }))
  }, [])

  const setCalorieGoal = useCallback((dailyGoalKcal: number) => {
    if (!Number.isFinite(dailyGoalKcal) || dailyGoalKcal <= 0) return
    setState((s) => ({
      ...s,
      calorieSettings: { ...s.calorieSettings, dailyGoalKcal: Math.round(dailyGoalKcal) },
    }))
  }, [])

  const todayCalorieEntries = useMemo<CalorieEntry[]>(
    () =>
      state.calorieEntries
        .filter((e) => localDateKey(e.ts) === today)
        .sort((a, b) => b.ts - a.ts),
    [state.calorieEntries, today],
  )

  const todayKcal = useMemo(
    () => todayCalorieEntries.reduce((sum, e) => sum + e.kcal, 0),
    [todayCalorieEntries],
  )

  const calorieHistoryByDay = useMemo<CalorieDayLog[]>(() => {
    const groups = new Map<string, CalorieEntry[]>()
    for (const e of state.calorieEntries) {
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
        totalKcal: entries.reduce((s, e) => s + e.kcal, 0),
      }))
      .sort((a, b) => (a.date < b.date ? 1 : -1))
  }, [state.calorieEntries, today])

  // ── Fasting ──────────────────────────────────────────────────────────
  const activeFast = useMemo<Fast | null>(
    () => state.fasts.find((f) => f.endTs === null) ?? null,
    [state.fasts],
  )

  const startFast = useCallback(() => {
    setState((s) =>
      s.fasts.some((f) => f.endTs === null)
        ? s
        : { ...s, fasts: [...s.fasts, { id: makeId(), startTs: Date.now(), endTs: null }] },
    )
  }, [])

  const endFast = useCallback(() => {
    setState((s) => ({
      ...s,
      fasts: s.fasts.map((f) => (f.endTs === null ? { ...f, endTs: Date.now() } : f)),
    }))
  }, [])

  const deleteFast = useCallback((id: string) => {
    setState((s) => ({ ...s, fasts: s.fasts.filter((f) => f.id !== id) }))
  }, [])

  const setFastTarget = useCallback((targetMs: number) => {
    if (!Number.isFinite(targetMs) || targetMs <= 0) return
    setState((s) => ({
      ...s,
      fastingSettings: { ...s.fastingSettings, targetMs: Math.round(targetMs) },
    }))
  }, [])

  const fastHistory = useMemo<Fast[]>(
    () => state.fasts.filter((f) => f.endTs !== null).sort((a, b) => b.startTs - a.startTs),
    [state.fasts],
  )

  return {
    water: {
      goalMl: state.settings.dailyGoalMl,
      todayTotal,
      todayHydrationMl,
      todayEntries,
      historyByDay,
      addEntry: addDrink,
      undoEntry: undoDrink,
      setGoal: setWaterGoal,
    },
    calories: {
      goalKcal: state.calorieSettings.dailyGoalKcal,
      todayKcal,
      todayEntries: todayCalorieEntries,
      historyByDay: calorieHistoryByDay,
      addEntry: addCalorie,
      undoEntry: undoCalorie,
      setGoal: setCalorieGoal,
    },
    fasting: {
      activeFast,
      targetMs: state.fastingSettings.targetMs,
      history: fastHistory,
      startFast,
      endFast,
      deleteFast,
      setTarget: setFastTarget,
    },
  }
}
