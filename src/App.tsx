import { useWaterLog } from './hooks/useWaterLog'
import { GoalEditor } from './components/GoalEditor'
import { HistoryList } from './components/HistoryList'
import { ProgressBar } from './components/ProgressBar'
import { QuickPickGrid } from './components/QuickPickGrid'
import { TodayList } from './components/TodayList'

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

  return (
    <div className="app">
      <header className="app-header">
        <h1>💧 Water Tracker</h1>
        <p className="tagline">Tap a glass — log a sip.</p>
      </header>

      <main className="app-main">
        <section className="card">
          <ProgressBar currentMl={todayTotal} goalMl={goalMl} />
          <GoalEditor goalMl={goalMl} onSave={setGoal} />
        </section>

        <section className="card">
          <h2 className="card-title">Log a drink</h2>
          <QuickPickGrid onPick={addEntry} />
        </section>

        <section className="card">
          <h2 className="card-title">Today</h2>
          <TodayList entries={todayEntries} onUndo={undoEntry} />
        </section>

        <section className="card">
          <h2 className="card-title">History</h2>
          <HistoryList days={historyByDay} goalMl={goalMl} />
        </section>
      </main>

      <footer className="app-footer">
        <span className="muted">Data stays on this device.</span>
      </footer>
    </div>
  )
}
