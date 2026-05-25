import type { useHealthLog } from '../hooks/useHealthLog'
import { CalorieHistoryList } from '../components/CalorieHistoryList'
import { CalorieInput } from '../components/CalorieInput'
import { CalorieTodayList } from '../components/CalorieTodayList'
import { GoalEditor } from '../components/GoalEditor'

type Props = {
  calories: ReturnType<typeof useHealthLog>['calories']
}

export function CaloriesView({ calories }: Props) {
  const { goalKcal, todayKcal, todayEntries, historyByDay, addEntry, undoEntry, setGoal } = calories

  const pct = goalKcal > 0 ? Math.round((todayKcal / goalKcal) * 100) : 0
  const remaining = goalKcal - todayKcal
  const over = remaining < 0

  return (
    <>
      <section className="hero hero-single">
        <div className="hero-readout">
          <div className="hero-label">today's intake</div>
          <div className={`hero-num ${over ? 'is-over' : ''}`}>
            {pct}
            <span className="pct-mark">%</span>
          </div>
          <div className="hero-stat">
            <span className="current">
              {todayKcal.toLocaleString()}<span className="unit">kcal</span>
            </span>
            <span className="sep">/</span>
            <span>of {goalKcal.toLocaleString()} kcal goal</span>
          </div>
          <div className="hero-substat">
            <span className="hero-substat-label">{over ? 'over by' : 'remaining'}</span>
            <span className="hero-substat-value">
              {Math.abs(remaining).toLocaleString()} kcal
            </span>
          </div>
          <GoalEditor goal={goalKcal} onSave={setGoal} unit="kcal" />
        </div>
      </section>

      <section className="section">
        <h2 className="section-title">
          <span className="glyph">△</span> log calories <span className="glyph">△</span>
        </h2>
        <CalorieInput onAdd={addEntry} />
      </section>

      <section className="section">
        <h2 className="section-title">today's log</h2>
        <CalorieTodayList entries={todayEntries} onUndo={undoEntry} />
      </section>

      <section className="section">
        <h2 className="section-title">the archive</h2>
        <CalorieHistoryList days={historyByDay} goalKcal={goalKcal} />
      </section>
    </>
  )
}
