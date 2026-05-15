type Props = {
  currentMl: number
  goalMl: number
}

export function ProgressBar({ currentMl, goalMl }: Props) {
  const pct = goalMl > 0 ? Math.min(100, Math.round((currentMl / goalMl) * 100)) : 0
  const reached = currentMl >= goalMl

  return (
    <div className="progress" aria-label="Daily progress">
      <div className="progress-header">
        <span className="progress-amount">
          <strong>{currentMl}</strong>
          <span className="muted"> / {goalMl} ml</span>
        </span>
        <span className={`progress-pct ${reached ? 'reached' : ''}`}>
          {Math.round((currentMl / Math.max(1, goalMl)) * 100)}%
          {reached ? ' 🎉' : ''}
        </span>
      </div>
      <div className="progress-track" role="progressbar" aria-valuemin={0} aria-valuemax={goalMl} aria-valuenow={currentMl}>
        <div className="progress-fill" style={{ width: `${pct}%` }} />
      </div>
    </div>
  )
}
