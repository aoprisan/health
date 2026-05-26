import { useWaterLog } from './hooks/useWaterLog'
import { GlassProgress } from './components/GlassProgress'
import { GoalEditor } from './components/GoalEditor'
import { HistoryList } from './components/HistoryList'
import { HydrationMeter } from './components/HydrationMeter'
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
    todayHydrationMl,
    todayEntries,
    historyByDay,
    addEntry,
    undoEntry,
    setGoal,
  } = useWaterLog()

  const volumePct = goalMl > 0 ? Math.round((todayTotal / goalMl) * 100) : 0
  const hydrationPct = goalMl > 0 ? Math.round((todayHydrationMl / goalMl) * 100) : 0
  const hydrationReached = todayHydrationMl >= goalMl && goalMl > 0

  return (
    <div className="app">
      <header className="app-header">
        <div className="masthead">
          <h1 className="masthead-title">
            Hydrology<span className="amp">.</span>
          </h1>
          <p className="masthead-sub">a hydration journal · vol. ii</p>
        </div>
        <div className="masthead-date">{formatToday()}</div>
      </header>

      <section className="hero">
        <div className="hero-meters">
          <figure className="meter-figure">
            <GlassProgress currentMl={todayTotal} goalMl={goalMl} />
            <figcaption className="meter-caption">
              <span className="meter-caption-label">volume</span>
              <span className="meter-caption-value">
                {todayTotal.toLocaleString()}
                <span className="unit">ml</span>
              </span>
            </figcaption>
          </figure>
          <figure className="meter-figure">
            <HydrationMeter hydrationMl={todayHydrationMl} goalMl={goalMl} />
            <figcaption className="meter-caption">
              <span className="meter-caption-label">effective</span>
              <span className="meter-caption-value">
                {todayHydrationMl.toLocaleString()}
                <span className="unit">ml</span>
              </span>
            </figcaption>
          </figure>
        </div>

        <div className="hero-readout">
          <div className="hero-label">today's hydration</div>
          <div className={`hero-num ${hydrationReached ? 'is-reached' : ''}`}>
            {hydrationPct}
            <span className="pct-mark">%</span>
          </div>
          <div className="hero-stat">
            <span className="current">
              {todayHydrationMl.toLocaleString()}<span className="unit">ml</span>
            </span>
            <span className="sep">/</span>
            <span>of {goalMl.toLocaleString()} ml goal</span>
            {hydrationReached ? <span className="reached-tag">— kept.</span> : null}
          </div>
          <div className="hero-substat">
            <span className="hero-substat-label">raw volume</span>
            <span className="hero-substat-value">
              {todayTotal.toLocaleString()} ml · {volumePct}%
            </span>
          </div>
          <GoalEditor goalMl={goalMl} onSave={setGoal} />
        </div>
      </section>

      <section className="section">
        <h2 className="section-title">
          <span className="glyph">~</span> pour a drink <span className="glyph">~</span>
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
        <span>folio · 02</span>
        <span className="ornament">— bibite aquam —</span>
        <span>local · private</span>
      </footer>
    </div>
  )
}
