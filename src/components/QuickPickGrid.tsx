import { QUICK_SIZES_ML } from '../types'

type Props = {
  onPick: (amountMl: number) => void
}

const MIN_ML = QUICK_SIZES_ML[0]
const MAX_ML = QUICK_SIZES_ML[QUICK_SIZES_ML.length - 1]

export function QuickPickGrid({ onPick }: Props) {
  return (
    <div className="quick-grid" role="group" aria-label="Quick water amounts">
      {QUICK_SIZES_ML.map((ml) => {
        // Visual hint: bigger amount → taller button (within sensible range).
        const t = (ml - MIN_ML) / (MAX_ML - MIN_ML)
        const height = 72 + Math.round(t * 64)
        return (
          <button
            key={ml}
            type="button"
            className="quick-btn"
            style={{ minHeight: `${height}px` }}
            onClick={() => onPick(ml)}
            aria-label={`Log ${ml} millilitres`}
          >
            <span className="quick-btn-icon" aria-hidden="true">💧</span>
            <span className="quick-btn-amount">{ml}</span>
            <span className="quick-btn-unit">ml</span>
          </button>
        )
      })}
    </div>
  )
}
