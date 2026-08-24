import type { Point } from '../metabolism'

type Props = {
  points: Point[]
  now: number
  /** Where the curve is projected to reach zero, if it ever does. */
  clearAt: number | null
  accentVar: string
  label: string
}

const W = 320
const H = 76
const PAD_TOP = 8
const PAD_BOTTOM = 12

/** A sparkline of the load over time: solid up to now, dotted for the projection. */
export function DecayCurve({ points, now, clearAt, accentVar, label }: Props) {
  if (points.length < 2) return null

  const from = points[0].t
  const to = points[points.length - 1].t
  const span = Math.max(1, to - from)
  const peak = Math.max(...points.map((p) => p.v), Number.EPSILON)

  const x = (t: number) => ((t - from) / span) * W
  const y = (v: number) => PAD_TOP + (1 - v / peak) * (H - PAD_TOP - PAD_BOTTOM)

  const path = (pts: Point[]) =>
    pts.map((p, i) => `${i === 0 ? 'M' : 'L'} ${x(p.t).toFixed(2)} ${y(p.v).toFixed(2)}`).join(' ')

  const past = points.filter((p) => p.t <= now)
  const future = points.filter((p) => p.t >= now)
  const nowX = x(Math.min(Math.max(now, from), to))
  const nowV = past.length ? past[past.length - 1].v : points[0].v
  const baseY = y(0)

  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      className="decay-curve"
      role="img"
      aria-label={label}
      preserveAspectRatio="none"
      style={{ ['--curve-accent' as string]: `var(${accentVar})` }}
    >
      <line x1="0" y1={baseY} x2={W} y2={baseY} stroke="var(--rule)" strokeWidth="1" />

      {past.length > 1 ? (
        <path
          d={`${path(past)} L ${x(past[past.length - 1].t).toFixed(2)} ${baseY} L ${x(past[0].t).toFixed(2)} ${baseY} Z`}
          fill="var(--curve-accent)"
          opacity="0.13"
        />
      ) : null}

      {past.length > 1 ? (
        <path d={path(past)} fill="none" stroke="var(--curve-accent)" strokeWidth="1.8" />
      ) : null}

      {future.length > 1 ? (
        <path
          d={path(future)}
          fill="none"
          stroke="var(--curve-accent)"
          strokeWidth="1.4"
          strokeDasharray="3 3"
          opacity="0.7"
        />
      ) : null}

      <line
        x1={nowX}
        y1={PAD_TOP - 4}
        x2={nowX}
        y2={baseY}
        stroke="var(--ink-mute)"
        strokeWidth="0.8"
        strokeDasharray="2 3"
      />
      <circle cx={nowX} cy={y(nowV)} r="3.2" fill="var(--curve-accent)" />

      {clearAt !== null && clearAt <= to ? (
        <g>
          <line
            x1={x(clearAt)}
            y1={baseY - 7}
            x2={x(clearAt)}
            y2={baseY + 3}
            stroke="var(--ochre)"
            strokeWidth="1.2"
          />
          <circle cx={x(clearAt)} cy={baseY} r="2.6" fill="var(--ochre)" />
        </g>
      ) : null}
    </svg>
  )
}
