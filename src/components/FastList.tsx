import { fastDuration, type Fast } from '../types'
import { formatHm } from '../format'

type Props = {
  fasts: Fast[]
  targetMs: number
  onDelete: (id: string) => void
}

function formatStamp(ts: number): string {
  return new Date(ts).toLocaleString(undefined, {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  })
}

export function FastList({ fasts, targetMs, onDelete }: Props) {
  if (fasts.length === 0) {
    return <p className="empty-note">— no fasts yet. start one above.</p>
  }
  return (
    <ul className="entry-list">
      {fasts.map((f) => {
        const dur = fastDuration(f, Date.now())
        const reached = dur >= targetMs
        return (
          <li key={f.id} className="entry-row fast-row">
            <span className="entry-main">
              <span className={`fast-duration ${reached ? 'reached' : ''}`}>
                {formatHm(dur)}
                {reached ? <span className="check"> · target met</span> : null}
              </span>
              <span className="fast-window">
                {formatStamp(f.startTs)} → {f.endTs ? formatStamp(f.endTs) : '…'}
              </span>
            </span>
            <button
              type="button"
              className="entry-undo"
              onClick={() => onDelete(f.id)}
              aria-label={`Delete fast of ${formatHm(dur)}`}
            >
              delete
            </button>
          </li>
        )
      })}
    </ul>
  )
}
