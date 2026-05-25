import type { useHealthLog } from '../hooks/useHealthLog'
import { GlassProgress } from '../components/GlassProgress'
import { GoalEditor } from '../components/GoalEditor'
import { HistoryList } from '../components/HistoryList'
import { HydrationMeter } from '../components/HydrationMeter'
import { QuickPickGrid } from '../components/QuickPickGrid'
import { TodayList } from '../components/TodayList'

type Props = {
  water: ReturnType<typeof useHealthLog>['water']
}

export function WaterView({ water }: Props) {
  const { goalMl, todayTotal, todayHydrationMl, todayEntries, historyByDay, addEntry, undoEntry, setGoal } =
    water

  const volumePct = goalMl > 0 ? Math.round((todayTotal / goalMl) * 100) : 0
  const hydrationPct = goalMl > 0 ? Math.round((todayHydrationMl / goalMl) * 100) : 0
  const hydrationReached = todayHydrationMl >= goalMl && goalMl > 0

  return (
    <>
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
          <GoalEditor goal={goalMl} onSave={setGoal} unit="ml" />
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
    </>
  )
}
