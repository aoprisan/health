import type { DayLog } from '../types'

type Props = {
  days: DayLog[]
  goalMl: number
}

function formatDateParts(iso: string): { weekday: string; month: string; day: string } {
  const [y, m, d] = iso.split('-').map(Number)
  const date = new Date(y, m - 1, d)
  return {
    weekday: date.toLocaleDateString(undefined, { weekday: 'long' }).toLowerCase(),
    month: date.toLocaleDateString(undefined, { month: 'long' }).toLowerCase(),
    day: date.toLocaleDateString(undefined, { day: 'numeric' }),
  }
}

function formatTime(ts: number): string {
  return new Date(ts).toLocaleTimeString(undefined, {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  })
}

export function HistoryList({ days, goalMl }: Props) {
  if (days.length === 0) {
    return <p className="empty-note">— the archive is empty. yesterday will appear here.</p>
  }
  return (
    <div className="history">
      {days.map((day) => {
        const reached = day.totalMl >= goalMl
        const { weekday, month, day: dayNum } = formatDateParts(day.date)
        return (
          <details key={day.date} className="history-day">
            <summary>
              <span className="history-day-label">
                <span className="history-date">
                  {weekday}, {month} <span className="day-num">{dayNum}</span>
                </span>
              </span>
              <span className={`history-total ${reached ? 'reached' : ''}`}>
                <span className="num">{day.totalMl.toLocaleString()}</span> ml
                {reached ? <span className="check"> · goal kept</span> : null}
              </span>
            </summary>
            <ul className="entry-list">
              {day.entries.map((e) => (
                <li key={e.id} className="entry-row">
                  <span className="entry-time">{formatTime(e.ts)}</span>
                  <span className="entry-amount">
                    {e.amountMl}
                    <span className="unit">ml</span>
                  </span>
                  <span aria-hidden="true" />
                </li>
              ))}
            </ul>
          </details>
        )
      })}
    </div>
  )
}
