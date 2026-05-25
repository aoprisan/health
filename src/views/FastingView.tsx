import { useEffect, useState } from 'react'
import type { useHealthLog } from '../hooks/useHealthLog'
import { FastList } from '../components/FastList'
import { GoalEditor } from '../components/GoalEditor'
import { formatClock } from '../format'
import { HOUR_MS } from '../types'

type Props = {
  fasting: ReturnType<typeof useHealthLog>['fasting']
}

export function FastingView({ fasting }: Props) {
  const { activeFast, targetMs, history, startFast, endFast, deleteFast, setTarget } = fasting

  const [now, setNow] = useState(() => Date.now())

  useEffect(() => {
    if (!activeFast) return
    const id = setInterval(() => setNow(Date.now()), 1000)
    return () => clearInterval(id)
  }, [activeFast?.id])

  const elapsed = activeFast ? now - activeFast.startTs : 0
  const pct = targetMs > 0 ? Math.min(100, Math.round((elapsed / targetMs) * 100)) : 0
  const reached = activeFast != null && elapsed >= targetMs
  const targetHours = Math.round((targetMs / HOUR_MS) * 10) / 10

  return (
    <>
      <section className="hero hero-single">
        <div className="hero-readout">
          <div className="hero-label">{activeFast ? 'fasting now' : 'not fasting'}</div>
          <div className={`fast-timer ${reached ? 'is-reached' : ''}`}>
            {activeFast ? formatClock(elapsed) : '00:00:00'}
          </div>
          <div className="fast-progress" aria-hidden="true">
            <span className="fast-progress-fill" style={{ width: `${pct}%` }} />
          </div>
          <div className="hero-stat">
            <span>{pct}% of {targetHours}h target</span>
            {reached ? <span className="reached-tag">— target met.</span> : null}
          </div>
          <div className="fast-controls">
            {activeFast ? (
              <button type="button" className="fast-btn is-end" onClick={endFast}>
                end fast
              </button>
            ) : (
              <button type="button" className="fast-btn is-start" onClick={startFast}>
                start fast
              </button>
            )}
          </div>
          <GoalEditor
            goal={targetHours}
            onSave={(h) => setTarget(h * HOUR_MS)}
            unit="h"
            triggerLabel="revise target"
            fieldLabel="target"
          />
        </div>
      </section>

      <section className="section">
        <h2 className="section-title">past fasts</h2>
        <FastList fasts={history} targetMs={targetMs} onDelete={deleteFast} />
      </section>
    </>
  )
}
