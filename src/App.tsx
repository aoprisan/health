import { useWaterLog } from './hooks/useWaterLog'
import { GlassProgress } from './components/GlassProgress'
import { GoalEditor } from './components/GoalEditor'
import { HistoryList } from './components/HistoryList'
import { QuickPickGrid } from './components/QuickPickGrid'
import { TodayList } from './components/TodayList'

function formatToday(): string {
  return new Date()
    .toLocaleDateString(undefined, {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    })
    .toLowerCase()
}

export default function App() {
  const {
    goalMl,
    todayTotal,
    todayEntries,
    historyByDay,
    addEntry,
    undoEntry,
    setGoal,
  } = useWaterLog()

  const pct = goalMl > 0 ? Math.round((todayTotal / goalMl) * 100) : 0
  const reached = todayTotal >= goalMl && goalMl > 0

  return (
    <div className="app">
      <header className="app-header">
        <div className="masthead">
          <h1 className="masthead-title">
            Hydrology<span className="amp">.</span>
          </h1>
          <p className="masthead-sub">a water journal · vol. i</p>
        </div>
        <div className="masthead-date">{formatToday()}</div>
      </header>

      <section className="hero">
        <GlassProgress currentMl={todayTotal} goalMl={goalMl} />
        <div className="hero-readout">
          <div className="hero-label">today's intake</div>
          <div className={`hero-num ${reached ? 'is-reached' : ''}`}>
            {pct}
            <span className="pct-mark">%</span>
          </div>
          <div className="hero-stat">
            <span className="current">
              {todayTotal.toLocaleString()}<span className="unit">ml</span>
            </span>
            <span className="sep">/</span>
            <span>of {goalMl.toLocaleString()} ml goal</span>
            {reached ? <span className="reached-tag">— kept.</span> : null}
          </div>
          <GoalEditor goalMl={goalMl} onSave={setGoal} />
        </div>
      </section>

      <section className="section">
        <h2 className="section-title">
          <span className="glyph">~</span> pour a glass <span className="glyph">~</span>
        </h2>
        <QuickPickGrid onPick={addEntry} />
      </section>

      <section className="section">
        <h2 className="section-title">today's log</h2>
        <TodayList entries={todayEntries} onUndo={undoEntry} />
      </section>

      <section className="section">
        <h2 className="section-title">the archive</h2>
        <HistoryList days={historyByDay} goalMl={goalMl} />
      </section>

      <footer className="app-footer">
        <span>folio · 01</span>
        <span className="ornament">— bibite aquam —</span>
        <span>local · private</span>
      </footer>
    </div>
  )
}
