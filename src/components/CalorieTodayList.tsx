import type { CalorieEntry } from '../types'

type Props = {
  entries: CalorieEntry[]
  onUndo: (id: string) => void
}

function formatTime(ts: number): string {
  return new Date(ts).toLocaleTimeString(undefined, {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  })
}

export function CalorieTodayList({ entries, onUndo }: Props) {
  if (entries.length === 0) {
    return <p className="empty-note">— nothing logged yet. add a meal above.</p>
  }
  return (
    <ul className="entry-list">
      {entries.map((e) => (
        <li key={e.id} className="entry-row">
          <span className="entry-time">{formatTime(e.ts)}</span>
          <span className="entry-main">
            <span className="entry-tag">{e.label ?? 'food'}</span>
            <span className="entry-kcal">
              {e.kcal.toLocaleString()}
              <span className="unit">kcal</span>
            </span>
          </span>
          <button
            type="button"
            className="entry-undo"
            onClick={() => onUndo(e.id)}
            aria-label={`Undo ${e.kcal} calories at ${formatTime(e.ts)}`}
          >
            undo
          </button>
        </li>
      ))}
    </ul>
  )
}
