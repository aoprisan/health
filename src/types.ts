export type DrinkKind = 'water' | 'tea' | 'coffee' | 'beer'

export type DrinkMeta = {
  label: string
  factor: number
  accentVar: string
}

export const DRINKS: Record<DrinkKind, DrinkMeta> = {
  water: { label: 'water', factor: 1.0, accentVar: '--water' },
  tea: { label: 'tea', factor: 0.9, accentVar: '--tea' },
  coffee: { label: 'coffee', factor: 0.7, accentVar: '--coffee' },
  beer: { label: 'beer', factor: 0.5, accentVar: '--beer' },
}

export const DRINK_ORDER: DrinkKind[] = ['water', 'tea', 'coffee', 'beer']

export type Entry = {
  id: string
  ts: number
  amountMl: number
  kind: DrinkKind
}

export type Settings = {
  dailyGoalMl: number
}

export type State = {
  entries: Entry[]
  settings: Settings
}

export type DayLog = {
  date: string
  totalMl: number
  hydrationMl: number
  entries: Entry[]
}

export const DEFAULT_STATE: State = {
  entries: [],
  settings: { dailyGoalMl: 2000 },
}

export const QUICK_SIZES_ML = [150, 250, 330, 500, 750, 1000] as const

export function hydrationOf(entry: Entry): number {
  return entry.amountMl * DRINKS[entry.kind].factor
}
