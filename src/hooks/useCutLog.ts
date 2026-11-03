import { useCallback, useEffect, useState } from 'react'
import { loadCutState, saveCutState } from '../cut/storage'
import { pantryMatch, type EstimateItem } from '../cut/claude'
import type { CutSettings, CutState, Food, FoodEntry, Meal } from '../cut/model'

/** Single source of truth for the cut section, persisted to localStorage. */
export function useCutLog() {
  const [state, setState] = useState<CutState>(() => loadCutState())

  useEffect(() => {
    saveCutState(state)
  }, [state])

  const mapDay = useCallback((day: string, fn: (entries: FoodEntry[]) => FoodEntry[]) => {
    setState((s) => {
      const entries = fn(s.days[day]?.entries ?? [])
      const days = { ...s.days }
      if (entries.length) days[day] = { entries }
      else delete days[day]
      return { ...s, days }
    })
  }, [])

  const addFood = useCallback(
    (day: string, foodId: string, g: number) => {
      if (!(g > 0)) return
      mapDay(day, (es) => [...es, { foodId, g }])
    },
    [mapDay],
  )

  const addMeal = useCallback(
    (day: string, meal: Meal) => {
      setState((s) => {
        const known = meal.items.filter(([id]) => s.foods.some((f) => f.id === id))
        if (!known.length) return s
        const prev = s.days[day]?.entries ?? []
        return {
          ...s,
          days: { ...s.days, [day]: { entries: [...prev, ...known.map(([foodId, g]) => ({ foodId, g }))] } },
        }
      })
    },
    [],
  )

  /**
   * Log a Claude estimate. A line whose name matches a pantry food uses that food (your own
   * label values win); every other line becomes a new pantry food at Claude's per-100 g values.
   */
  const addEstimate = useCallback((day: string, items: EstimateItem[]) => {
    setState((s) => {
      const foods = [...s.foods]
      const stamp = Date.now().toString(36)
      const added: FoodEntry[] = []
      items.forEach((it, i) => {
        if (!(it.g > 0)) return
        let food = pantryMatch(foods, it.name)
        if (!food) {
          food = { id: `c${stamp}${i}`, name: it.name, kcal: it.kcal, p: it.p, c: it.c, f: it.f }
          foods.push(food)
        }
        added.push({ foodId: food.id, g: it.g })
      })
      if (!added.length) return s
      const prev = s.days[day]?.entries ?? []
      return { ...s, foods, days: { ...s.days, [day]: { entries: [...prev, ...added] } } }
    })
  }, [])

  const setEntryGrams = useCallback(
    (day: string, index: number, g: number) => {
      if (!(g >= 0)) return
      mapDay(day, (es) => es.map((e, i) => (i === index ? { ...e, g } : e)))
    },
    [mapDay],
  )

  const removeEntry = useCallback(
    (day: string, index: number) => mapDay(day, (es) => es.filter((_, i) => i !== index)),
    [mapDay],
  )

  const setWeight = useCallback((day: string, kg: number) => {
    if (!(kg > 0)) return
    setState((s) => ({ ...s, weights: { ...s.weights, [day]: kg } }))
  }, [])

  const setWaist = useCallback((day: string, cm: number) => {
    if (!(cm > 0)) return
    setState((s) => ({ ...s, waist: { ...s.waist, [day]: cm } }))
  }, [])

  const removeMeasurement = useCallback((day: string) => {
    setState((s) => {
      const weights = { ...s.weights }
      const waist = { ...s.waist }
      delete weights[day]
      delete waist[day]
      return { ...s, weights, waist }
    })
  }, [])

  const updateFood = useCallback((id: string, patch: Partial<Omit<Food, 'id'>>) => {
    setState((s) => ({ ...s, foods: s.foods.map((f) => (f.id === id ? { ...f, ...patch } : f)) }))
  }, [])

  const addFoodType = useCallback((name: string, kcal: number, p: number, c?: number, f?: number) => {
    const clean = name.trim()
    if (!clean) return
    const food: Food = { id: `f${Date.now().toString(36)}`, name: clean, kcal: kcal || 0, p: p || 0 }
    if (c !== undefined) food.c = c
    if (f !== undefined) food.f = f
    setState((s) => ({ ...s, foods: [...s.foods, food] }))
  }, [])

  const removeFoodType = useCallback((id: string) => {
    setState((s) => ({ ...s, foods: s.foods.filter((f) => f.id !== id) }))
  }, [])

  const setSettings = useCallback((settings: CutSettings) => {
    setState((s) => ({ ...s, settings }))
  }, [])

  const replaceAll = useCallback((next: CutState) => setState(next), [])

  return {
    state,
    addFood,
    addMeal,
    addEstimate,
    setEntryGrams,
    removeEntry,
    setWeight,
    setWaist,
    removeMeasurement,
    updateFood,
    addFoodType,
    removeFoodType,
    setSettings,
    replaceAll,
  }
}

export type CutLog = ReturnType<typeof useCutLog>
