export type Entry = {
  id: string
  ts: number
  amountMl: number
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
  entries: Entry[]
}

export const DEFAULT_STATE: State = {
  entries: [],
  settings: { dailyGoalMl: 2000 },
}

export const QUICK_SIZES_ML = [150, 250, 330, 500, 750, 1000] as const
