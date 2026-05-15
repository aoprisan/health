import type { Entry } from '../types'

type Props = {
  entries: Entry[]
  onUndo: (id: string) => void
}

function formatTime(ts: number): string {
  return new Date(ts).toLocaleTimeString(undefined, {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  })
}

export function TodayList({ entries, onUndo }: Props) {
  if (entries.length === 0) {
    return <p className="empty-note">— nothing logged yet. pour a glass above.</p>
  }
  return (
    <ul className="entry-list">
      {entries.map((e) => (
        <li key={e.id} className="entry-row">
          <span className="entry-time">{formatTime(e.ts)}</span>
          <span className="entry-amount">
            {e.amountMl}
            <span className="unit">ml</span>
          </span>
          <button
            type="button"
            className="entry-undo"
            onClick={() => onUndo(e.id)}
            aria-label={`Undo ${e.amountMl} millilitres at ${formatTime(e.ts)}`}
          >
            undo
          </button>
        </li>
      ))}
    </ul>
  )
}
