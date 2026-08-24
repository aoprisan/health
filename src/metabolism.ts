import { DRINKS, type Body, type Entry } from './types'

export const HOUR_MS = 3_600_000

/* ── caffeine ─────────────────────────────────────────────
   First-order elimination, ~5 h half-life in a healthy adult,
   with a linear ramp for absorption up to peak plasma level. */
export const CAFFEINE_HALF_LIFE_H = 5
export const CAFFEINE_ABSORB_H = 0.75
/**
 * Below this the body counts as clear. First-order decay never actually reaches
 * zero, so this threshold — not the half-life — is what sets the "estimated 0"
 * time. A 5 mg floor is the pharmacological one (~5 half-lives), which puts a
 * single mug of coffee 26 h from clear and reads as nonsense in a journal.
 * 25 mg is the dose below which caffeine has no measurable effect on alertness
 * or sleep — a cup of green tea, a bar of dark chocolate — and puts a morning
 * coffee clear by early evening.
 */
export const CAFFEINE_CLEAR_MG = 25

/* ── alcohol ──────────────────────────────────────────────
   Widmark: linear absorption, then zero-order (constant rate)
   elimination of ~0.15 g/L per hour (≈0.015 % BAC / h). */
export const ETHANOL_DENSITY_G_PER_ML = 0.789
export const ALCOHOL_ABSORB_H = 0.5
export const BAC_ELIM_G_PER_L_H = 0.15
/** Below this we call it sober. */
export const BAC_CLEAR_G_PER_L = 0.01

/** Only drinks this recent can still be on board. */
const LOOKBACK_MS = 36 * HOUR_MS
const SIM_STEP_MS = 60_000

export type Point = { t: number; v: number }

export function caffeineMgOf(entry: Entry): number {
  return entry.amountMl * DRINKS[entry.kind].caffeineMgPerMl
}

export function alcoholGramsOf(entry: Entry): number {
  return entry.amountMl * (DRINKS[entry.kind].abv / 100) * ETHANOL_DENSITY_G_PER_ML
}

function absorbedFraction(hoursSince: number, rampH: number): number {
  if (hoursSince <= 0) return 0
  return Math.min(1, hoursSince / rampH)
}

/* ── caffeine ─────────────────────────────────────────── */

/** Milligrams of caffeine still on board at time `t`. */
export function caffeineAt(entries: Entry[], t: number): number {
  let total = 0
  for (const e of entries) {
    const mg = caffeineMgOf(e)
    if (mg <= 0 || e.ts > t) continue
    const h = (t - e.ts) / HOUR_MS
    total += mg * absorbedFraction(h, CAFFEINE_ABSORB_H) * Math.pow(0.5, h / CAFFEINE_HALF_LIFE_H)
  }
  return total
}

/**
 * When caffeine falls under CAFFEINE_CLEAR_MG. Every dose decays with the same
 * half-life, so once the last one is absorbed the sum is a single exponential
 * and the answer is closed-form.
 */
export function caffeineClearAt(entries: Entry[], now: number): number | null {
  const dosed = entries.filter((e) => caffeineMgOf(e) > 0 && e.ts >= now - LOOKBACK_MS)
  if (dosed.length === 0) return null
  const lastTs = Math.max(...dosed.map((e) => e.ts))
  const from = Math.max(now, lastTs + CAFFEINE_ABSORB_H * HOUR_MS)
  const load = caffeineAt(dosed, from)
  if (load <= CAFFEINE_CLEAR_MG) return from
  const hours = CAFFEINE_HALF_LIFE_H * Math.log2(load / CAFFEINE_CLEAR_MG)
  return from + hours * HOUR_MS
}

/** Caffeine logged but not yet absorbed — still on the way in. */
export function unabsorbedCaffeineMg(entries: Entry[], t: number): number {
  return entries.reduce((mg, e) => {
    const dose = caffeineMgOf(e)
    if (dose <= 0 || e.ts > t) return mg
    return mg + dose * (1 - absorbedFraction((t - e.ts) / HOUR_MS, CAFFEINE_ABSORB_H))
  }, 0)
}

export function caffeineCurve(entries: Entry[], from: number, to: number, points = 72): Point[] {
  const span = Math.max(1, to - from)
  return Array.from({ length: points }, (_, i) => {
    const t = from + (span * i) / (points - 1)
    return { t, v: caffeineAt(entries, t) }
  })
}

/* ── alcohol ──────────────────────────────────────────── */

/**
 * Widmark's distribution factor r, refined for build by Seidl et al. (2000).
 * Needs height and weight; returns null until both are known.
 */
export function widmarkR(body: Body): number | null {
  const { heightCm, weightKg, sex } = body
  if (!heightCm || !weightKg) return null
  const male = 0.31608 - 0.004821 * weightKg + 0.004632 * heightCm
  const female = 0.31223 - 0.006446 * weightKg + 0.004466 * heightCm
  const r = sex === 'male' ? male : sex === 'female' ? female : (male + female) / 2
  return Math.min(0.9, Math.max(0.4, r))
}

function alcoholDrinks(entries: Entry[], until: number): Entry[] {
  return entries
    .filter((e) => alcoholGramsOf(e) > 0 && e.ts <= until && e.ts >= until - LOOKBACK_MS)
    .sort((a, b) => a.ts - b.ts)
}

/**
 * Simulates blood alcohol minute by minute and samples it at `sampleTimes`
 * (which must be ascending). Values are g/L of blood. Null when body measures
 * are missing, since Widmark cannot be evaluated without them.
 */
function simulateBac(entries: Entry[], sampleTimes: number[], body: Body): number[] | null {
  const r = widmarkR(body)
  const weightKg = body.weightKg
  if (r === null || !weightKg) return null
  if (sampleTimes.length === 0) return []

  const end = sampleTimes[sampleTimes.length - 1]
  const drinks = alcoholDrinks(entries, end)
  if (drinks.length === 0) return sampleTimes.map(() => 0)

  const absorbedGramsAt = (t: number) =>
    drinks.reduce(
      (g, e) =>
        g + alcoholGramsOf(e) * absorbedFraction((t - e.ts) / HOUR_MS, ALCOHOL_ABSORB_H),
      0,
    )

  const out: number[] = []
  let next = 0
  let bac = 0
  let prevGrams = 0
  let t = Math.min(drinks[0].ts, sampleTimes[0])

  while (next < sampleTimes.length && sampleTimes[next] <= t) {
    out.push(bac)
    next++
  }

  while (next < sampleTimes.length) {
    const step = Math.min(SIM_STEP_MS, sampleTimes[next] - t)
    const to = t + step
    bac = Math.max(0, bac - BAC_ELIM_G_PER_L_H * (step / HOUR_MS))
    const grams = absorbedGramsAt(to)
    bac += (grams - prevGrams) / (r * weightKg)
    prevGrams = grams
    t = to
    while (next < sampleTimes.length && sampleTimes[next] <= t) {
      out.push(bac)
      next++
    }
  }

  return out
}

/** Blood alcohol at time `t`, in g/L. Null when body measures are missing. */
export function bacAt(entries: Entry[], t: number, body: Body): number | null {
  const sampled = simulateBac(entries, [t], body)
  return sampled ? sampled[0] : null
}

export function bacCurve(
  entries: Entry[],
  from: number,
  to: number,
  body: Body,
  points = 72,
): Point[] | null {
  const span = Math.max(1, to - from)
  const times = Array.from({ length: points }, (_, i) => from + (span * i) / (points - 1))
  const values = simulateBac(entries, times, body)
  if (!values) return null
  return times.map((t, i) => ({ t, v: values[i] ?? 0 }))
}

/** When blood alcohol reaches zero. Elimination is linear, so this is exact. */
export function soberAt(entries: Entry[], now: number, body: Body): number | null {
  if (widmarkR(body) === null) return null
  const drinks = alcoholDrinks(entries, now)
  if (drinks.length === 0) return null
  const lastTs = drinks[drinks.length - 1].ts
  const from = Math.max(now, lastTs + ALCOHOL_ABSORB_H * HOUR_MS)
  const bac = bacAt(entries, from, body) ?? 0
  if (bac <= BAC_CLEAR_G_PER_L) return from
  return from + (bac / BAC_ELIM_G_PER_L_H) * HOUR_MS
}

/** Alcohol logged but not yet absorbed — still on the way in. */
export function unabsorbedAlcoholG(entries: Entry[], t: number): number {
  return alcoholDrinks(entries, t).reduce(
    (g, e) => g + alcoholGramsOf(e) * (1 - absorbedFraction((t - e.ts) / HOUR_MS, ALCOHOL_ABSORB_H)),
    0,
  )
}

/** g/L → percent BAC (g per 100 ml). */
export function gramsPerLitreToPercent(gl: number): number {
  return gl / 10
}
