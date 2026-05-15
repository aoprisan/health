import type { Entry } from '../types'

type Props = {
  entries: Entry[]
  onUndo: (id: string) => void
}

function formatTime(ts: number): string {
  const d = new Date(ts)
  return d.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })
}

export function TodayList({ entries, onUndo }: Props) {
  if (entries.length === 0) {
    return <p className="empty">No water logged yet today. Tap a button above to get started.</p>
  }
  return (
    <ul className="entry-list">
      {entries.map((e) => (
        <li key={e.id} className="entry-row">
          <span className="entry-time">{formatTime(e.ts)}</span>
          <span className="entry-amount">+{e.amountMl} ml</span>
          <button
            type="button"
            className="entry-undo"
            onClick={() => onUndo(e.id)}
            aria-label={`Undo ${e.amountMl} millilitres at ${formatTime(e.ts)}`}
          >
            Undo
          </button>
        </li>
      ))}
    </ul>
  )
}
