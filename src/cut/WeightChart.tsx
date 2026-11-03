import { useEffect, useRef, useState } from 'react'
import { avg7, cutEndDate, daysBetween, effectiveStartWeight, sortedWeights, type CutState } from './model'

type Props = { state: CutState; today: string }

const H = 220
const PAD = { l: 36, r: 10, t: 12, b: 24 }

/** Weigh-ins as dots, the 7-day average as a line, and the target pace dashed. */
export function WeightChart({ state, today }: Props) {
  const ref = useRef<HTMLDivElement>(null)
  const [w, setW] = useState(0)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    const ro = new ResizeObserver(([e]) => setW(Math.round(e.contentRect.width)))
    ro.observe(el)
    return () => ro.disconnect()
  }, [])

  const s = state.settings
  const ws = sortedWeights(state)
  const start = effectiveStartWeight(state)
  const end = cutEndDate(s)

  // Same root element in both branches, so the observed node survives the first weigh-in.
  if (!ws.length) {
    return (
      <div ref={ref} className="cut-chart">
        <p className="empty-note">— no weigh-ins yet. the line starts with the first.</p>
      </div>
    )
  }

  const first = ws[0][0] < s.startDate ? ws[0][0] : s.startDate
  const last = [end, today, ws[ws.length - 1][0]].sort().pop() as string
  const span = Math.max(1, daysBetween(first, last))
  const vals = ws.map(([, v]) => v)
  if (start !== null) vals.push(start)
  if (s.goalWeight !== null) vals.push(s.goalWeight)
  const lo = Math.min(...vals) - 0.8
  const hi = Math.max(...vals) + 0.8

  const X = (d: string) => PAD.l + (daysBetween(first, d) / span) * (w - PAD.l - PAD.r)
  const Y = (v: number) => PAD.t + ((hi - v) / (hi - lo)) * (H - PAD.t - PAD.b)

  const step = hi - lo > 8 ? 2 : 1
  const ticks: number[] = []
  for (let v = Math.ceil(lo); v <= hi; v += step) ticks.push(v)

  const avgPts = ws
    .map(([d]) => [d, avg7(state, d)] as const)
    .filter((x): x is readonly [string, number] => x[1] !== null)
    .map(([d, a]) => `${X(d).toFixed(1)},${Y(a).toFixed(1)}`)

  return (
    <div ref={ref} className="cut-chart">
      {w > 0 ? (
        <svg width={w} height={H} role="img" aria-label="Weight trend">
          {ticks.map((v) => (
            <g key={v}>
              <line x1={PAD.l} x2={w - PAD.r} y1={Y(v)} y2={Y(v)} className="cut-chart-grid" />
              <text x={PAD.l - 6} y={Y(v) + 3.5} textAnchor="end" className="cut-chart-tick">
                {v}
              </text>
            </g>
          ))}
          <text x={PAD.l} y={H - 6} className="cut-chart-tick">{first.slice(5)}</text>
          <text x={w - PAD.r} y={H - 6} textAnchor="end" className="cut-chart-tick">{last.slice(5)}</text>
          {X(today) > PAD.l && X(today) < w - PAD.r ? (
            <line x1={X(today)} x2={X(today)} y1={PAD.t} y2={H - PAD.b} className="cut-chart-today" />
          ) : null}

          {start !== null && s.goalWeight !== null ? (
            <line
              x1={X(s.startDate)}
              y1={Y(start)}
              x2={X(end)}
              y2={Y(s.goalWeight)}
              className="cut-chart-pace"
            />
          ) : null}

          {ws.map(([d, v]) => (
            <circle key={d} cx={X(d)} cy={Y(v)} r={2.6} className="cut-chart-dot" />
          ))}
          {avgPts.length > 1 ? <polyline points={avgPts.join(' ')} className="cut-chart-avg" /> : null}
        </svg>
      ) : null}
      <p className="cut-chart-legend">
        dots — daily weigh-ins · line — 7-day average · dashes — target pace
        {today > end ? ' · past the planned end' : ''}
      </p>
    </div>
  )
}
