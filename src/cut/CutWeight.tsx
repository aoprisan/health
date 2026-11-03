import { useState } from 'react'
import type { CutLog } from '../hooks/useCutLog'
import type { Body } from '../types'
import { addDays, avg7, r1, todayIso } from './model'
import { NavelGuide } from './NavelGuide'
import { WeightChart } from './WeightChart'

type Props = {
  cut: CutLog
  body: Body
  now: number
  onLogWeight: (day: string, kg: number) => void
  onEditBody: () => void
}

function parse(raw: string): number {
  return Number(raw.replace(',', '.'))
}

export function CutWeight({ cut, body, now, onLogWeight, onEditBody }: Props) {
  const { state, setWaist, removeMeasurement } = cut
  const s = state.settings
  const today = todayIso(now)
  const [wDate, setWDate] = useState(today)
  const [kg, setKg] = useState('')
  const [waistDate, setWaistDate] = useState(today)
  const [cm, setCm] = useState('')

  const a = avg7(state, today)
  const prev = avg7(state, addDays(today, -7))
  const rate = a !== null && prev !== null ? a - prev : null
  const rateTone =
    rate === null ? '' : rate > -0.3 ? 'is-slow' : rate < -1.0 ? 'is-fast' : 'is-on'
  const rateHint =
    rate === null
      ? 'needs two weeks of weigh-ins'
      : rate > -0.3
        ? 'slower than target (0.5–0.8 kg/wk)'
        : rate < -1.0
          ? 'faster than target — watch strength'
          : 'on target'

  const latestWaist = Object.entries(state.waist).sort((x, y) => (x[0] < y[0] ? 1 : -1))[0]
  const height = body.heightCm
  const dates = [...new Set([...Object.keys(state.weights), ...Object.keys(state.waist)])]
    .sort()
    .reverse()

  return (
    <>
      <section className="cut-hero">
        <div className="cut-stats">
          <div className="cut-stat">
            <div className="cut-macro-label">7-day average</div>
            <div className="cut-stat-value">
              {a !== null ? r1(a).toFixed(1) : '—'}
              {a !== null ? <span className="unit">kg</span> : null}
            </div>
            <div className="cut-macro-sub">
              {a !== null && s.goalWeight !== null
                ? `${r1(a - s.goalWeight).toFixed(1)} kg to goal (${s.goalWeight} kg)`
                : s.goalWeight === null
                  ? 'set a goal weight in settings'
                  : 'weigh in to start the average'}
            </div>
          </div>
          <div className="cut-stat">
            <div className="cut-macro-label">weekly rate</div>
            <div className={`cut-stat-value ${rateTone}`}>
              {rate !== null ? `${rate > 0 ? '+' : rate < 0 ? '−' : ''}${Math.abs(rate).toFixed(2)}` : '—'}
              {rate !== null ? <span className="unit">kg/wk</span> : null}
            </div>
            <div className={`cut-macro-sub ${rateTone}`}>{rateHint}</div>
          </div>
        </div>

        <form
          className="cut-add"
          onSubmit={(e) => {
            e.preventDefault()
            const v = parse(kg)
            if (!(v >= 20 && v <= 400)) return
            onLogWeight(wDate || today, v)
            setKg('')
          }}
        >
          <label className="cut-field">
            <span className="cut-field-label">weigh-in · fasted, morning</span>
            <input type="date" value={wDate} max={today} onChange={(e) => setWDate(e.target.value)} />
          </label>
          <label className="cut-field">
            <span className="cut-field-label">kg</span>
            <input
              type="number"
              step="0.05"
              min={20}
              max={400}
              inputMode="decimal"
              placeholder="—"
              value={kg}
              onChange={(e) => setKg(e.target.value)}
            />
          </label>
          <button type="submit" className="cut-primary">save</button>
        </form>
      </section>

      <section className="section">
        <h2 className="section-title">the trend</h2>
        <WeightChart state={state} today={today} />
      </section>

      <section className="section">
        <h2 className="section-title">waist at the navel · fortnightly</h2>
        <NavelGuide />
        <form
          className="cut-add"
          onSubmit={(e) => {
            e.preventDefault()
            const v = parse(cm)
            if (!(v >= 30 && v <= 250)) return
            setWaist(waistDate || today, v)
            setCm('')
          }}
        >
          <label className="cut-field">
            <span className="cut-field-label">date</span>
            <input type="date" value={waistDate} max={today} onChange={(e) => setWaistDate(e.target.value)} />
          </label>
          <label className="cut-field">
            <span className="cut-field-label">cm</span>
            <input
              type="number"
              step="0.5"
              min={30}
              max={250}
              inputMode="decimal"
              placeholder="—"
              value={cm}
              onChange={(e) => setCm(e.target.value)}
            />
          </label>
          <button type="submit" className="cut-primary">save</button>
        </form>
        <p className="cut-note">
          {height === null ? (
            <>
              waist-to-height needs your height.{' '}
              <button type="button" className="load-cta" onClick={onEditBody}>
                set measures
              </button>
            </>
          ) : latestWaist ? (
            <>
              latest {latestWaist[1]} cm → waist-to-height{' '}
              <strong className={latestWaist[1] / height < 0.5 ? 'is-on' : 'is-slow'}>
                {(latestWaist[1] / height).toFixed(3)}
              </strong>{' '}
              · target under 0.5 = {Math.round(height / 2)} cm
            </>
          ) : (
            <>target under {Math.round(height / 2)} cm (waist-to-height below 0.5)</>
          )}
        </p>
      </section>

      <section className="section">
        <h2 className="section-title">the record</h2>
        {dates.length === 0 ? (
          <p className="empty-note">— nothing measured yet.</p>
        ) : (
          <ul className="entry-list">
            {dates.map((d) => (
              <li key={d} className="cut-row cut-record">
                <span className="entry-time">{d}</span>
                <span className="cut-record-val">
                  {state.weights[d] !== undefined ? (
                    <>
                      {state.weights[d]}
                      <span className="unit">kg</span>
                    </>
                  ) : null}
                </span>
                <span className="cut-record-val is-soft">
                  {state.waist[d] !== undefined ? (
                    <>
                      {state.waist[d]}
                      <span className="unit">cm</span>
                    </>
                  ) : null}
                </span>
                <button
                  type="button"
                  className="entry-undo"
                  onClick={() => removeMeasurement(d)}
                  aria-label={`Remove measurements for ${d}`}
                >
                  remove
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>
    </>
  )
}
