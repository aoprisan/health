type Props = { ml: number }

export function GlasswareIcon({ ml }: Props) {
  switch (ml) {
    case 150:
      return (
        <svg viewBox="0 0 60 80" className="glass-icon" aria-hidden="true">
          <path className="fill-wash" d="M 20 32 L 19 60 Q 19 64, 23 64 L 37 64 Q 41 64, 41 60 L 40 32 Z" />
          <path d="M 20 32 L 19 60 Q 19 64, 23 64 L 37 64 Q 41 64, 41 60 L 40 32" />
          <ellipse cx="30" cy="32" rx="10" ry="2.4" />
        </svg>
      )
    case 250:
      return (
        <svg viewBox="0 0 60 80" className="glass-icon" aria-hidden="true">
          <path className="fill-wash" d="M 18 22 L 16 62 Q 16 66, 20 66 L 40 66 Q 44 66, 44 62 L 42 22 Z" />
          <path d="M 18 22 L 16 62 Q 16 66, 20 66 L 40 66 Q 44 66, 44 62 L 42 22" />
          <ellipse cx="30" cy="22" rx="12" ry="2.8" />
        </svg>
      )
    case 330:
      return (
        <svg viewBox="0 0 60 80" className="glass-icon" aria-hidden="true">
          <path className="fill-wash" d="M 20 16 Q 20 14, 22 14 L 38 14 Q 40 14, 40 16 L 40 64 Q 40 66, 38 66 L 22 66 Q 20 66, 20 64 Z" />
          <path d="M 20 16 Q 20 14, 22 14 L 38 14 Q 40 14, 40 16 L 40 64 Q 40 66, 38 66 L 22 66 Q 20 66, 20 64 Z" />
          <line x1="20" y1="20" x2="40" y2="20" />
          <line x1="20" y1="60" x2="40" y2="60" />
          <ellipse cx="30" cy="14" rx="4" ry="1.4" />
          <ellipse cx="30" cy="14" rx="1.6" ry="0.7" />
        </svg>
      )
    case 500:
      return (
        <svg viewBox="0 0 60 80" className="glass-icon" aria-hidden="true">
          <rect className="fill-wash" x="24" y="4" width="12" height="10" rx="1.5" />
          <rect x="24" y="4" width="12" height="10" rx="1.5" />
          <line x1="22" y1="14" x2="38" y2="14" />
          <path className="fill-wash" d="M 19 18 L 17 70 Q 17 74, 21 74 L 39 74 Q 43 74, 43 70 L 41 18 Z" />
          <path d="M 19 18 L 17 70 Q 17 74, 21 74 L 39 74 Q 43 74, 43 70 L 41 18 Z" />
          <line x1="19" y1="26" x2="41" y2="26" />
        </svg>
      )
    case 750:
      return (
        <svg viewBox="0 0 60 80" className="glass-icon" aria-hidden="true">
          <path className="fill-wash" d="M 27 4 L 27 22 Q 19 26, 19 34 L 18 72 Q 18 76, 22 76 L 38 76 Q 42 76, 42 72 L 41 34 Q 41 26, 33 22 L 33 4 Z" />
          <path d="M 27 4 L 27 22 Q 19 26, 19 34 L 18 72 Q 18 76, 22 76 L 38 76 Q 42 76, 42 72 L 41 34 Q 41 26, 33 22 L 33 4" />
          <line x1="27" y1="4" x2="33" y2="4" />
          <line x1="19" y1="38" x2="41" y2="38" />
        </svg>
      )
    case 1000:
      return (
        <svg viewBox="0 0 60 80" className="glass-icon" aria-hidden="true">
          <path className="fill-wash" d="M 13 24 L 11 72 Q 11 76, 15 76 L 37 76 Q 41 76, 41 72 L 39 24 Z" />
          <path d="M 13 24 L 11 72 Q 11 76, 15 76 L 37 76 Q 41 76, 41 72 L 39 24" />
          <ellipse cx="26" cy="24" rx="13" ry="2.8" />
          <path d="M 38 16 Q 30 14, 28 22" />
          <path d="M 41 36 Q 52 40, 52 52 Q 52 60, 41 62" />
        </svg>
      )
    default:
      return null
  }
}
