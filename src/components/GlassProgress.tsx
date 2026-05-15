import { useEffect, useState } from 'react'

type Props = {
  currentMl: number
  goalMl: number
}

const GLASS_TOP = 38
const GLASS_BOTTOM = 286
const HEADROOM = 8

export function GlassProgress({ currentMl, goalMl }: Props) {
  const targetPct = Math.max(0, Math.min(1.04, currentMl / Math.max(1, goalMl)))

  const [pct, setPct] = useState(0)
  useEffect(() => {
    const t = requestAnimationFrame(() => setPct(targetPct))
    return () => cancelAnimationFrame(t)
  }, [targetPct])

  const waterY = GLASS_BOTTOM - pct * (GLASS_BOTTOM - GLASS_TOP - HEADROOM)

  return (
    <div className="glass-wrap">
      <svg viewBox="0 0 200 310" className="glass-svg" aria-label="Today's water glass">
        <defs>
          <clipPath id="glass-clip">
            <path d="M 38 38 L 50 270 Q 50 286, 64 286 L 136 286 Q 150 286, 150 270 L 162 38 Z" />
            <ellipse cx="100" cy="38" rx="62" ry="6" />
          </clipPath>
          <linearGradient id="water-grad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--water-light)" stopOpacity="0.75" />
            <stop offset="40%" stopColor="var(--water)" stopOpacity="0.92" />
            <stop offset="100%" stopColor="var(--water-deep)" stopOpacity="0.96" />
          </linearGradient>
          <linearGradient id="glass-shine" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="var(--paper)" stopOpacity="0.6" />
            <stop offset="100%" stopColor="var(--paper)" stopOpacity="0" />
          </linearGradient>
        </defs>

        {/* base shadow */}
        <ellipse cx="100" cy="296" rx="68" ry="3.5" fill="var(--ink)" opacity="0.07" />

        {/* clipped water body */}
        <g clipPath="url(#glass-clip)">
          <g className="glass-water-fill" style={{ transform: `translateY(${waterY}px)` }}>
            <g className="wave-back-wrap">
              <path
                d="M -200 0 Q -175 6, -150 0 Q -125 8, -100 0 Q -75 6, -50 0 Q -25 8, 0 0 Q 25 6, 50 0 Q 75 8, 100 0 Q 125 6, 150 0 Q 175 8, 200 0 Q 225 6, 250 0 Q 275 8, 300 0 L 300 320 L -200 320 Z"
                fill="url(#water-grad)"
              />
            </g>
            <g className="wave-front-wrap">
              <path
                d="M -200 4 Q -175 12, -150 4 Q -125 14, -100 4 Q -75 12, -50 4 Q -25 14, 0 4 Q 25 12, 50 4 Q 75 14, 100 4 Q 125 12, 150 4 Q 175 14, 200 4 Q 225 12, 250 4 Q 275 14, 300 4 L 300 22 L -200 22 Z"
                fill="var(--water-light)"
                opacity="0.55"
              />
            </g>
            {/* surface glint */}
            <rect x="58" y="8" width="20" height="1.5" fill="var(--paper)" opacity="0.5" rx="0.75" />
          </g>
        </g>

        {/* glass walls (no closing top line) */}
        <path
          d="M 38 38 L 50 270 Q 50 286, 64 286 L 136 286 Q 150 286, 150 270 L 162 38"
          fill="none"
          stroke="var(--ink)"
          strokeWidth="2.4"
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {/* rim ellipse */}
        <ellipse cx="100" cy="38" rx="62" ry="6" fill="var(--paper)" stroke="var(--ink)" strokeWidth="2.4" />
        <ellipse cx="100" cy="38" rx="56" ry="3" fill="none" stroke="var(--ink)" strokeWidth="0.7" opacity="0.3" />

        {/* glass highlight reflection */}
        <path
          d="M 56 60 L 64 250"
          stroke="url(#glass-shine)"
          strokeWidth="3"
          strokeLinecap="round"
          fill="none"
          opacity="0.8"
        />
        <path
          d="M 142 240 L 148 90"
          stroke="var(--paper)"
          strokeWidth="1"
          strokeLinecap="round"
          fill="none"
          opacity="0.35"
        />
      </svg>
    </div>
  )
}
