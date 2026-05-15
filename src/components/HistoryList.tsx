import type { DayLog } from '../types'

type Props = {
  days: DayLog[]
  goalMl: number
}

function formatDate(iso: string): string {
  const [y, m, d] = iso.split('-').map(Number)
  return new Date(y, m - 1, d).toLocaleDateString(undefined, {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  })
}

function formatTime(ts: number): string {
  const d = new Date(ts)
  return d.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })
}

export function HistoryList({ days, goalMl }: Props) {
  if (days.length === 0) {
    return <p className="empty">No history yet. Come back tomorrow!</p>
  }
  return (
    <div className="history">
      {days.map((day) => {
        const reached = day.totalMl >= goalMl
        return (
          <details key={day.date} className="history-day">
            <summary>
              <span className="history-date">{formatDate(day.date)}</span>
              <span className={`history-total ${reached ? 'reached' : ''}`}>
                {day.totalMl} ml {reached ? '✓' : ''}
              </span>
            </summary>
            <ul className="entry-list compact">
              {day.entries.map((e) => (
                <li key={e.id} className="entry-row">
                  <span className="entry-time">{formatTime(e.ts)}</span>
                  <span className="entry-amount">+{e.amountMl} ml</span>
                </li>
              ))}
            </ul>
          </details>
        )
      })}
    </div>
  )
}
