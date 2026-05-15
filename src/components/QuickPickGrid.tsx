import { QUICK_SIZES_ML } from '../types'
import { GlasswareIcon } from './Glassware'

type Props = {
  onPick: (amountMl: number) => void
}

function formatAmount(ml: number): { value: string; unit: string } {
  if (ml >= 1000) return { value: (ml / 1000).toString(), unit: 'l' }
  return { value: ml.toString(), unit: 'ml' }
}

export function QuickPickGrid({ onPick }: Props) {
  return (
    <div className="quick-row" role="group" aria-label="Quick water amounts">
      {QUICK_SIZES_ML.map((ml) => {
        const { value, unit } = formatAmount(ml)
        return (
          <button
            key={ml}
            type="button"
            className="quick-glass"
            onClick={() => onPick(ml)}
            aria-label={`Log ${ml} millilitres`}
          >
            <GlasswareIcon ml={ml} />
            <span className="quick-glass-amount">
              {value}
              <span className="ml">{unit}</span>
            </span>
          </button>
        )
      })}
    </div>
  )
}
