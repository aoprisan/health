export type DrinkKind =
  | 'water'
  | 'tea'
  | 'coffee'
  | 'beerNA'
  | 'beerLight'
  | 'beer'
  | 'beerStrong'

export type DrinkMeta = {
  label: string
  factor: number
  accentVar: string
  note?: string
  /** caffeine content, mg per ml */
  caffeineMgPerMl: number
  /** alcohol by volume, in percent */
  abv: number
}

export const DRINKS: Record<DrinkKind, DrinkMeta> = {
  water: { label: 'water', factor: 1.0, accentVar: '--water', caffeineMgPerMl: 0, abv: 0 },
  tea: { label: 'tea', factor: 0.9, accentVar: '--tea', caffeineMgPerMl: 0.2, abv: 0 },
  coffee: { label: 'coffee', factor: 0.7, accentVar: '--coffee', caffeineMgPerMl: 0.4, abv: 0 },
  beerNA: {
    label: 'na beer',
    factor: 0.95,
    accentVar: '--beer-na',
    note: '≤0.5% abv',
    caffeineMgPerMl: 0,
    abv: 0.4,
  },
  beerLight: {
    label: 'light beer',
    factor: 0.6,
    accentVar: '--beer-light',
    note: '≤5% abv',
    caffeineMgPerMl: 0,
    abv: 4.2,
  },
  beer: {
    label: 'beer',
    factor: 0.5,
    accentVar: '--beer',
    note: '5–7% abv',
    caffeineMgPerMl: 0,
    abv: 5.8,
  },
  beerStrong: {
    label: 'strong beer',
    factor: 0.3,
    accentVar: '--beer-strong',
    note: '>7% abv',
    caffeineMgPerMl: 0,
    abv: 8.5,
  },
}

export const DRINK_ORDER: DrinkKind[] = [
  'water',
  'tea',
  'coffee',
  'beerNA',
  'beerLight',
  'beer',
  'beerStrong',
]

export type Entry = {
  id: string
  ts: number
  amountMl: number
  kind: DrinkKind
}

export type Sex = 'female' | 'male' | 'unspecified'

/** Body measures — only used to estimate blood alcohol. Null means "not told yet". */
export type Body = {
  heightCm: number | null
  weightKg: number | null
  sex: Sex
}

export type Settings = {
  dailyGoalMl: number
  body: Body
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

export const DEFAULT_BODY: Body = { heightCm: null, weightKg: null, sex: 'unspecified' }

export const DEFAULT_STATE: State = {
  entries: [],
  settings: { dailyGoalMl: 2000, body: DEFAULT_BODY },
}

export const QUICK_SIZES_ML = [150, 250, 330, 500, 750, 1000] as const

export function hydrationOf(entry: Entry): number {
  return entry.amountMl * DRINKS[entry.kind].factor
}
