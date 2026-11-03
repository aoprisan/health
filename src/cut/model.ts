/** The cut: calorie/protein log, eating window, weigh-ins and waist. Pure data + helpers. */

export type Food = {
  id: string
  name: string
  /** kcal per 100 g */
  kcal: number
  /** protein g per 100 g */
  p: number
}

export type FoodEntry = { foodId: string; g: number }

export type CutSettings = {
  kcal: number
  protein: number
  /** "HH:MM" */
  winStart: string
  winEnd: string
  /** "YYYY-MM-DD" */
  startDate: string
  weeks: number
  /** null → the first weigh-in on or after the start date */
  startWeight: number | null
  goalWeight: number | null
}

/** Same shape as the standalone cut tracker's export, so its JSON imports as-is. */
export type CutState = {
  settings: CutSettings
  foods: Food[]
  days: Record<string, { entries: FoodEntry[] }>
  weights: Record<string, number>
  waist: Record<string, number>
}

export type Meal = { name: string; items: [foodId: string, grams: number][] }

export const DEFAULT_FOODS: Food[] = [
  { id: 'skyr', name: 'Skyr (plain)', kcal: 63, p: 11 },
  { id: 'beef', name: 'Beef ≤5% fat (raw)', kcal: 125, p: 21 },
  { id: 'schnitz', name: 'Lidl schnitzel (check label)', kcal: 240, p: 14 },
  { id: 'oats', name: 'Oats', kcal: 372, p: 13.5 },
  { id: 'berries', name: 'Berries', kcal: 50, p: 1 },
  { id: 'banana', name: 'Banana', kcal: 89, p: 1.1 },
  { id: 'rice', name: 'Rice (cooked)', kcal: 130, p: 2.7 },
  { id: 'potato', name: 'Potatoes (boiled)', kcal: 80, p: 2 },
  { id: 'veg', name: 'Vegetables / salad', kcal: 25, p: 1.5 },
  { id: 'oil', name: 'Olive oil', kcal: 884, p: 0 },
  { id: 'cocoa', name: 'Cocoa (unsweetened)', kcal: 300, p: 20 },
  { id: 'honey', name: 'Honey', kcal: 304, p: 0.3 },
  { id: 'egg', name: 'Egg (≈55 g each)', kcal: 143, p: 12.6 },
  { id: 'bread', name: 'Bread', kcal: 250, p: 9 },
]

export const MEALS: Meal[] = [
  { name: 'Skyr bowl', items: [['skyr', 400], ['oats', 30], ['berries', 150]] },
  { name: 'Beef + rice', items: [['beef', 250], ['rice', 250], ['veg', 200]] },
  { name: 'Schnitzel dinner', items: [['schnitz', 150], ['potato', 200], ['veg', 200], ['oil', 10]] },
  { name: 'Evening skyr', items: [['skyr', 300], ['cocoa', 10]] },
  { name: 'Beef swap', items: [['beef', 250], ['potato', 200], ['veg', 200], ['oil', 10]] },
]

/* ─── dates (local, "YYYY-MM-DD") ─────────────────────────── */

export function isoDay(d: Date): string {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

export const todayIso = (now = Date.now()) => isoDay(new Date(now))

export function addDays(day: string, n: number): string {
  const d = new Date(`${day}T12:00:00`)
  d.setDate(d.getDate() + n)
  return isoDay(d)
}

export function daysBetween(a: string, b: string): number {
  return Math.round(
    (new Date(`${b}T12:00:00`).getTime() - new Date(`${a}T12:00:00`).getTime()) / 86_400_000,
  )
}

export function defaultCutState(now = Date.now()): CutState {
  return {
    settings: {
      kcal: 2300,
      protein: 185,
      winStart: '12:00',
      winEnd: '20:00',
      startDate: todayIso(now),
      weeks: 10,
      startWeight: null,
      goalWeight: null,
    },
    foods: DEFAULT_FOODS.map((f) => ({ ...f })),
    days: {},
    weights: {},
    waist: {},
  }
}

/* ─── calculations ─────────────────────────────────────────── */

export function foodById(foods: Food[], id: string): Food | undefined {
  return foods.find((f) => f.id === id)
}

export function entryMacros(foods: Food[], e: FoodEntry): { kcal: number; p: number } {
  const f = foodById(foods, e.foodId)
  if (!f) return { kcal: 0, p: 0 }
  return { kcal: (f.kcal * e.g) / 100, p: (f.p * e.g) / 100 }
}

export function dayTotals(state: CutState, day: string): { kcal: number; p: number } {
  let kcal = 0
  let p = 0
  for (const e of state.days[day]?.entries ?? []) {
    const m = entryMacros(state.foods, e)
    kcal += m.kcal
    p += m.p
  }
  return { kcal, p }
}

export function mealMacros(foods: Food[], meal: Meal): { kcal: number; p: number } {
  let kcal = 0
  let p = 0
  for (const [foodId, g] of meal.items) {
    const m = entryMacros(foods, { foodId, g })
    kcal += m.kcal
    p += m.p
  }
  return { kcal, p }
}

export function sortedWeights(state: CutState): [string, number][] {
  return Object.entries(state.weights).sort((a, b) => (a[0] < b[0] ? -1 : 1))
}

/** Mean of weigh-ins in the 7 days ending on `day`, or null if there are none. */
export function avg7(state: CutState, day: string): number | null {
  const from = addDays(day, -6)
  const v = sortedWeights(state)
    .filter(([d]) => d >= from && d <= day)
    .map(([, kg]) => kg)
  return v.length ? v.reduce((a, b) => a + b, 0) / v.length : null
}

export function effectiveStartWeight(state: CutState): number | null {
  if (state.settings.startWeight !== null) return state.settings.startWeight
  const ws = sortedWeights(state)
  const after = ws.find(([d]) => d >= state.settings.startDate)
  return (after ?? ws[0])?.[1] ?? null
}

export function cutEndDate(s: CutSettings): string {
  return addDays(s.startDate, s.weeks * 7)
}

export function weekLabel(s: CutSettings, now = Date.now()): string {
  const n = daysBetween(s.startDate, todayIso(now))
  const wk = Math.floor(n / 7) + 1
  if (n < 0) return `starts ${s.startDate}`
  if (wk > s.weeks) return `cut done · ${s.weeks} wk`
  return `week ${wk} of ${s.weeks}`
}

export function windowOpen(s: CutSettings, now = Date.now()): boolean {
  const d = new Date(now)
  const hm = `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
  return hm >= s.winStart && hm < s.winEnd
}

export const r1 = (x: number) => Math.round(x * 10) / 10
