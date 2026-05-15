import { useState } from 'react'
import { DRINKS, DRINK_ORDER, QUICK_SIZES_ML, type DrinkKind } from '../types'
import { GlasswareIcon } from './Glassware'

type Props = {
  onPick: (amountMl: number, kind: DrinkKind) => void
}

function formatAmount(ml: number): { value: string; unit: string } {
  if (ml >= 1000) return { value: (ml / 1000).toString(), unit: 'l' }
  return { value: ml.toString(), unit: 'ml' }
}

export function QuickPickGrid({ onPick }: Props) {
  const [kind, setKind] = useState<DrinkKind>('water')
  const meta = DRINKS[kind]

  return (
    <div className="quick-pick">
      <div className="drink-tabs" role="tablist" aria-label="Drink kind">
        {DRINK_ORDER.map((k) => {
          const m = DRINKS[k]
          const active = k === kind
          return (
            <button
              key={k}
              role="tab"
              type="button"
              aria-selected={active}
              className={`drink-tab ${active ? 'is-active' : ''}`}
              data-kind={k}
              onClick={() => setKind(k)}
            >
              <span className="drink-tab-label">{m.label}</span>
              <span className="drink-tab-factor">×{m.factor.toFixed(1)}</span>
            </button>
          )
        })}
      </div>

      <div
        className="quick-row"
        role="group"
        aria-label={`Quick ${meta.label} amounts`}
        data-kind={kind}
        style={{ ['--kind-accent' as string]: `var(${meta.accentVar})` }}
      >
        {QUICK_SIZES_ML.map((ml) => {
          const { value, unit } = formatAmount(ml)
          return (
            <button
              key={ml}
              type="button"
              className="quick-glass"
              onClick={() => onPick(ml, kind)}
              aria-label={`Log ${ml} millilitres of ${meta.label}`}
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
    </div>
  )
}
