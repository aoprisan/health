import { useMemo, useState } from 'react'
import {
  BAC_CLEAR_G_PER_L,
  CAFFEINE_CLEAR_MG,
  HOUR_MS,
  bacAt,
  bacCurve,
  caffeineAt,
  caffeineClearAt,
  caffeineCurve,
  caffeineMgOf,
  alcoholGramsOf,
  gramsPerLitreToPercent,
  soberAt as soberAtOf,
  unabsorbedAlcoholG,
  unabsorbedCaffeineMg,
  widmarkR,
  type Point,
} from '../metabolism'
import type { Body, Entry } from '../types'
import { DecayCurve } from './DecayCurve'

type Props = {
  entries: Entry[]
  body: Body
  now: number
  onEditBody: () => void
}

function clockOf(t: number): string {
  return new Date(t).toLocaleTimeString(undefined, {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  })
}

function dayOffset(t: number, now: number): number {
  const a = new Date(now)
  const b = new Date(t)
  a.setHours(0, 0, 0, 0)
  b.setHours(0, 0, 0, 0)
  return Math.round((b.getTime() - a.getTime()) / 86_400_000)
}

function whenOf(t: number, now: number): string {
  const days = dayOffset(t, now)
  const clock = clockOf(t)
  if (days <= 0) return clock
  if (days === 1) return `tomorrow ${clock}`
  return `in ${days} days, ${clock}`
}

function durationOf(ms: number): string {
  const mins = Math.max(0, Math.round(ms / 60_000))
  if (mins < 1) return 'now'
  if (mins < 60) return `${mins}m`
  const h = Math.floor(mins / 60)
  const m = mins % 60
  return m === 0 ? `${h}h` : `${h}h ${m}m`
}

/** Window the curve is drawn over: from the first dose still mattering, to zero. */
function windowFor(firstTs: number | null, clearAt: number | null, now: number) {
  const from = Math.min(firstTs ?? now - 2 * HOUR_MS, now - 30 * 60_000)
  const to = Math.min(Math.max(clearAt ?? now + 2 * HOUR_MS, now + 30 * 60_000), now + 26 * HOUR_MS)
  return { from, to }
}

export function LoadPanel({ entries, body, now: tick, onEditBody }: Props) {
  const [open, setOpen] = useState(false)

  // A drink can be logged between clock ticks; never let the clock lag behind it,
  // or the newest entry reads as being in the future and is skipped entirely.
  const now = useMemo(() => entries.reduce((t, e) => Math.max(t, e.ts), tick), [entries, tick])

  const caffeine = useMemo(() => {
    const dosed = entries.filter((e) => caffeineMgOf(e) > 0 && e.ts >= now - 36 * HOUR_MS)
    const mgNow = caffeineAt(dosed, now)
    const clearAt = caffeineClearAt(dosed, now)
    const firstTs = dosed.length ? Math.min(...dosed.map((e) => e.ts)) : null
    const { from, to } = windowFor(firstTs, clearAt, now)
    const curve: Point[] = dosed.length ? caffeineCurve(dosed, from, to) : []
    return {
      mgNow,
      clearAt,
      curve,
      pendingMg: unabsorbedCaffeineMg(dosed, now),
      any: dosed.length > 0,
    }
  }, [entries, now])

  const alcohol = useMemo(() => {
    const drinks = entries.filter((e) => alcoholGramsOf(e) > 0 && e.ts >= now - 36 * HOUR_MS)
    const r = widmarkR(body)
    const firstTs = drinks.length ? Math.min(...drinks.map((e) => e.ts)) : null
    const bacNow = bacAt(entries, now, body)
    const soberAt = soberAtOf(entries, now, body)
    const { from, to } = windowFor(firstTs, soberAt, now)
    const curve = drinks.length ? bacCurve(entries, from, to, body) : []
    return {
      bacNow,
      soberAt,
      curve: curve ?? [],
      r,
      pendingG: unabsorbedAlcoholG(entries, now),
      any: drinks.length > 0,
    }
  }, [entries, body, now])

  // "Clear" means nothing on board *and* nothing still being absorbed.
  const caffeineClear = caffeine.mgNow < CAFFEINE_CLEAR_MG && caffeine.pendingMg < 1
  const bacClear =
    alcohol.bacNow !== null && alcohol.bacNow <= BAC_CLEAR_G_PER_L && alcohol.pendingG < 1

  // One line each for the collapsed state — enough to decide whether to open it.
  const caffeineBrief = !caffeine.any
    ? 'none logged'
    : caffeineClear
      ? 'clear'
      : `${Math.round(caffeine.mgNow)} mg${
          caffeine.clearAt === null ? '' : ` · 0 by ${whenOf(caffeine.clearAt, now)}`
        }`
  const alcoholBrief =
    alcohol.bacNow === null
      ? 'needs your build'
      : !alcohol.any
        ? 'none logged'
        : bacClear
          ? 'sober'
          : `${alcohol.bacNow.toFixed(2)} g/l${
              alcohol.soberAt === null ? '' : ` · 0 by ${whenOf(alcohol.soberAt, now)}`
            }`

  return (
    <div className="load-panel">
      <button
        type="button"
        className="load-toggle"
        aria-expanded={open}
        aria-controls="load-detail"
        onClick={() => setOpen((v) => !v)}
      >
        <span className="load-brief">
          <span className="load-chip">
            <span className="load-chip-key">caffeine</span>
            <span className={`load-chip-value ${caffeineClear ? 'is-clear' : ''}`}>
              {caffeineBrief}
            </span>
          </span>
          <span className="load-chip">
            <span className="load-chip-key">alcohol</span>
            <span className={`load-chip-value ${bacClear ? 'is-clear' : ''}`}>{alcoholBrief}</span>
          </span>
        </span>
        <span className="load-toggle-hint">
          {open ? 'hide' : 'detail'}
          <span className="load-caret" aria-hidden="true">
            {open ? '−' : '+'}
          </span>
        </span>
      </button>

      <div id="load-detail" className="load-detail" hidden={!open}>
        <div className="load-cards">
          <article className="load-card" style={{ ['--load-accent' as string]: 'var(--coffee)' }}>
            <header className="load-head">
              <span className="load-label">caffeine on board</span>
              <span className="load-clock">as of {clockOf(now)}</span>
            </header>

            <div className={`load-value ${caffeineClear ? 'is-clear' : ''}`}>
              {caffeine.mgNow < 10 ? caffeine.mgNow.toFixed(1) : Math.round(caffeine.mgNow)}
              <span className="unit">mg</span>
            </div>

            <p className="load-sub">
              {!caffeine.any
                ? 'no tea or coffee logged in the last day and a half.'
                : caffeine.pendingMg >= 1
                  ? `${Math.round(caffeine.pendingMg)} mg still coming up — caffeine takes about 45 min to land.`
                  : caffeineClear
                    ? `under ${CAFFEINE_CLEAR_MG} mg — less than a bar of dark chocolate, nothing you would feel.`
                    : `half-life 5 h · ${Math.round(caffeine.mgNow / 2)} mg left in 5 h`}
            </p>

            {caffeine.curve.length > 1 ? (
              <DecayCurve
                points={caffeine.curve}
                now={now}
                clearAt={caffeine.clearAt}
                accentVar="--coffee"
                label="Caffeine remaining over time"
              />
            ) : (
              <div className="load-curve-empty" aria-hidden="true" />
            )}

            <footer className="load-foot">
              <span className="load-foot-key">under {CAFFEINE_CLEAR_MG} mg</span>
              <span className="load-foot-value">
                {!caffeine.any || caffeine.clearAt === null
                  ? '—'
                  : caffeineClear
                    ? 'already clear'
                    : `${whenOf(caffeine.clearAt, now)} · in ${durationOf(caffeine.clearAt - now)}`}
              </span>
            </footer>
          </article>

          <article className="load-card" style={{ ['--load-accent' as string]: 'var(--beer)' }}>
            <header className="load-head">
              <span className="load-label">alcohol on board</span>
              <span className="load-clock">as of {clockOf(now)}</span>
            </header>

            {alcohol.bacNow === null ? (
              <>
                <div className="load-value is-muted">not yet</div>
                <p className="load-sub">
                  blood alcohol needs your build. add height and weight and this fills in.
                </p>
                <button type="button" className="load-cta" onClick={onEditBody}>
                  set height &amp; weight
                </button>
                <div className="load-curve-empty" aria-hidden="true" />
                <footer className="load-foot">
                  <span className="load-foot-key">estimated 0</span>
                  <span className="load-foot-value">—</span>
                </footer>
              </>
            ) : (
              <>
                <div className={`load-value ${bacClear ? 'is-clear' : ''}`}>
                  {alcohol.bacNow.toFixed(2)}
                  <span className="unit">g/l</span>
                </div>

                <p className="load-sub">
                  {!alcohol.any
                    ? 'nothing alcoholic logged in the last day and a half.'
                    : alcohol.pendingG >= 1
                      ? `${Math.round(alcohol.pendingG)} g of alcohol still being absorbed — this is still climbing.`
                      : bacClear
                        ? 'back to zero — nothing left to burn off.'
                        : `≈${gramsPerLitreToPercent(alcohol.bacNow).toFixed(3)} % bac · burning 0.15 g/l per hour`}
                </p>

                {alcohol.curve.length > 1 ? (
                  <DecayCurve
                    points={alcohol.curve}
                    now={now}
                    clearAt={alcohol.soberAt}
                    accentVar="--beer"
                    label="Blood alcohol over time"
                  />
                ) : (
                  <div className="load-curve-empty" aria-hidden="true" />
                )}

                <footer className="load-foot">
                  <span className="load-foot-key">estimated 0</span>
                  <span className="load-foot-value">
                    {!alcohol.any || alcohol.soberAt === null
                      ? '—'
                      : bacClear
                        ? 'already sober'
                        : `${whenOf(alcohol.soberAt, now)} · in ${durationOf(alcohol.soberAt - now)}`}
                  </span>
                </footer>
              </>
            )}
          </article>
        </div>

        <p className="load-caveat">
          rough arithmetic — widmark for alcohol{alcohol.r ? ` (r ≈ ${alcohol.r.toFixed(2)})` : ''},
          a five-hour half-life for caffeine, counted clear once under {CAFFEINE_CLEAR_MG} mg. real
          metabolism varies with food, sleep, medication and liver. never a fitness-to-drive test.
        </p>
      </div>
    </div>
  )
}
