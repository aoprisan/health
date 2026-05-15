import { useEffect, useState } from 'react'

type Props = {
  hydrationMl: number
  goalMl: number
}

const TUBE_TOP = 38
const TUBE_BOTTOM = 268
const BULB_CY = 290

export function HydrationMeter({ hydrationMl, goalMl }: Props) {
  const targetPct = Math.max(0, Math.min(1.04, hydrationMl / Math.max(1, goalMl)))

  const [pct, setPct] = useState(0)
  useEffect(() => {
    const t = requestAnimationFrame(() => setPct(targetPct))
    return () => cancelAnimationFrame(t)
  }, [targetPct])

  const fillY = TUBE_BOTTOM - pct * (TUBE_BOTTOM - TUBE_TOP)
  const reached = hydrationMl >= goalMl && goalMl > 0

  return (
    <div className="hydration-meter" aria-label="Effective hydration meter">
      <svg viewBox="0 0 120 320" className="hydration-svg" role="img">
        <defs>
          <clipPath id="meter-clip">
            <rect x="48" y="38" width="24" height="232" rx="12" />
            <circle cx="60" cy={BULB_CY} r="22" />
          </clipPath>
          <linearGradient id="hydration-grad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--water-light)" stopOpacity="0.85" />
            <stop offset="50%" stopColor="var(--water)" stopOpacity="0.95" />
            <stop offset="100%" stopColor="var(--water-deep)" stopOpacity="1" />
          </linearGradient>
        </defs>

        {/* base shadow */}
        <ellipse cx="60" cy="316" rx="28" ry="2.6" fill="var(--ink)" opacity="0.07" />

        {/* tick marks (25 / 50 / 75 / 100) */}
        {[0.25, 0.5, 0.75, 1].map((t) => {
          const y = TUBE_BOTTOM - t * (TUBE_BOTTOM - TUBE_TOP)
          return (
            <g key={t}>
              <line
                x1="30"
                y1={y}
                x2="44"
                y2={y}
                stroke="var(--ink-mute)"
                strokeWidth="0.9"
                opacity={t === 1 ? 0.6 : 0.32}
              />
              <text
                x="26"
                y={y + 3}
                textAnchor="end"
                fontFamily="var(--mono)"
                fontSize="8"
                fill="var(--ink-mute)"
                letterSpacing="0.1em"
              >
                {Math.round(t * 100)}
              </text>
            </g>
          )
        })}

        {/* clipped fill */}
        <g clipPath="url(#meter-clip)">
          <rect
            x="40"
            y={fillY}
            width="40"
            height={TUBE_BOTTOM - TUBE_TOP + 60}
            fill="url(#hydration-grad)"
            style={{ transition: 'y 900ms var(--ease-pour)' }}
          />
          <circle cx="60" cy={BULB_CY} r="22" fill="url(#hydration-grad)" />
          {/* surface glint */}
          <rect x="52" y={fillY + 2} width="10" height="1.4" fill="var(--paper)" opacity="0.55" rx="0.7" />
        </g>

        {/* tube outline */}
        <rect
          x="48"
          y="38"
          width="24"
          height="232"
          rx="12"
          fill="none"
          stroke="var(--ink)"
          strokeWidth="2.2"
        />
        {/* bulb outline */}
        <circle cx="60" cy={BULB_CY} r="22" fill="none" stroke="var(--ink)" strokeWidth="2.2" />
        {/* top cap */}
        <ellipse cx="60" cy="38" rx="12" ry="2.6" fill="var(--paper)" stroke="var(--ink)" strokeWidth="2.2" />

        {/* highlight */}
        <path
          d="M 52 60 L 52 250"
          stroke="var(--paper)"
          strokeWidth="2"
          strokeLinecap="round"
          fill="none"
          opacity="0.5"
        />

        {/* goal-reached marker */}
        {reached ? (
          <g>
            <circle cx="92" cy={TUBE_TOP} r="4" fill="var(--ochre)" />
            <line
              x1="78"
              y1={TUBE_TOP}
              x2="88"
              y2={TUBE_TOP}
              stroke="var(--ochre)"
              strokeWidth="1.2"
            />
          </g>
        ) : null}
      </svg>
    </div>
  )
}
