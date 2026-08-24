import { useEffect, useRef, useState } from 'react'
import { widmarkR } from '../metabolism'
import type { Body, Sex } from '../types'

type Props = {
  body: Body
  open: boolean
  onOpenChange: (open: boolean) => void
  onSave: (patch: Partial<Body>) => void
}

const SEXES: { value: Sex; label: string }[] = [
  { value: 'female', label: 'female' },
  { value: 'male', label: 'male' },
  { value: 'unspecified', label: 'unsaid' },
]

function parseMeasure(raw: string, min: number, max: number): number | null {
  const n = Number(raw.replace(',', '.'))
  if (!Number.isFinite(n) || n < min || n > max) return null
  return Math.round(n * 10) / 10
}

function feetInches(cm: number): string {
  const totalIn = cm / 2.54
  const ft = Math.floor(totalIn / 12)
  const inch = Math.round(totalIn - ft * 12)
  return inch === 12 ? `${ft + 1}′ 0″` : `${ft}′ ${inch}″`
}

/** The measures menu: height, weight and build, used to estimate blood alcohol. */
export function BodyMenu({ body, open, onOpenChange, onSave }: Props) {
  const [height, setHeight] = useState(body.heightCm === null ? '' : String(body.heightCm))
  const [weight, setWeight] = useState(body.weightKg === null ? '' : String(body.weightKg))
  const [sex, setSex] = useState<Sex>(body.sex)
  const [error, setError] = useState<string | null>(null)
  const firstField = useRef<HTMLInputElement>(null)
  const root = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    setHeight(body.heightCm === null ? '' : String(body.heightCm))
    setWeight(body.weightKg === null ? '' : String(body.weightKg))
    setSex(body.sex)
    setError(null)
    firstField.current?.focus()
  }, [open, body])

  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onOpenChange(false)
    }
    const onPointer = (e: PointerEvent) => {
      if (!root.current?.contains(e.target as Node)) onOpenChange(false)
    }
    document.addEventListener('keydown', onKey)
    document.addEventListener('pointerdown', onPointer)
    return () => {
      document.removeEventListener('keydown', onKey)
      document.removeEventListener('pointerdown', onPointer)
    }
  }, [open, onOpenChange])

  const known = body.heightCm !== null && body.weightKg !== null
  const r = widmarkR(body)

  return (
    <div className="body-menu" ref={root}>
      <button
        type="button"
        className={`body-trigger ${open ? 'is-open' : ''}`}
        aria-expanded={open}
        aria-controls="body-menu-panel"
        onClick={() => onOpenChange(!open)}
      >
        <span className="body-trigger-label">measures</span>
        <span className="body-trigger-value">
          {known ? `${body.heightCm} cm · ${body.weightKg} kg` : 'not set'}
        </span>
      </button>

      {open ? (
        <form
          id="body-menu-panel"
          className="body-panel"
          onSubmit={(e) => {
            e.preventDefault()
            const h = height.trim() === '' ? null : parseMeasure(height, 50, 260)
            const w = weight.trim() === '' ? null : parseMeasure(weight, 20, 400)
            if (height.trim() !== '' && h === null) {
              setError('height should be between 50 and 260 cm')
              return
            }
            if (weight.trim() !== '' && w === null) {
              setError('weight should be between 20 and 400 kg')
              return
            }
            onSave({ heightCm: h, weightKg: w, sex })
            onOpenChange(false)
          }}
        >
          <div className="body-fields">
            <label className="body-field">
              <span className="body-field-label">height</span>
              <span className="body-field-input">
                <input
                  ref={firstField}
                  type="number"
                  min={50}
                  max={260}
                  step="0.5"
                  inputMode="decimal"
                  value={height}
                  placeholder="—"
                  onChange={(e) => setHeight(e.target.value)}
                  aria-label="Height in centimetres"
                />
                <span className="body-field-unit">cm</span>
              </span>
              <span className="body-field-hint">
                {parseMeasure(height, 50, 260) !== null
                  ? feetInches(parseMeasure(height, 50, 260) as number)
                  : ' '}
              </span>
            </label>

            <label className="body-field">
              <span className="body-field-label">weight</span>
              <span className="body-field-input">
                <input
                  type="number"
                  min={20}
                  max={400}
                  step="0.1"
                  inputMode="decimal"
                  value={weight}
                  placeholder="—"
                  onChange={(e) => setWeight(e.target.value)}
                  aria-label="Weight in kilograms"
                />
                <span className="body-field-unit">kg</span>
              </span>
              <span className="body-field-hint">
                {parseMeasure(weight, 20, 400) !== null
                  ? `${Math.round((parseMeasure(weight, 20, 400) as number) * 2.20462)} lb`
                  : ' '}
              </span>
            </label>
          </div>

          <div className="body-sex">
            <span className="body-sex-label" id="body-sex-label">build</span>
            <div className="body-sex-options" role="radiogroup" aria-labelledby="body-sex-label">
              {SEXES.map((s) => (
                <button
                  key={s.value}
                  type="button"
                  role="radio"
                  aria-checked={sex === s.value}
                  className={`body-sex-option ${sex === s.value ? 'is-active' : ''}`}
                  onClick={() => setSex(s.value)}
                >
                  {s.label}
                </button>
              ))}
            </div>
          </div>

          <p className="body-note">
            used only to estimate blood alcohol (widmark
            {r !== null ? ` · r ≈ ${r.toFixed(2)}` : ''}). stays on this device.
          </p>

          {error ? <p className="body-error">{error}</p> : null}

          <div className="body-actions">
            <button type="submit" className="save">save</button>
            <button type="button" className="cancel" onClick={() => onOpenChange(false)}>
              cancel
            </button>
          </div>
        </form>
      ) : null}
    </div>
  )
}
