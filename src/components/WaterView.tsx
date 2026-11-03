import type { Body, DayLog, DrinkKind, Entry } from '../types'
import { GlassProgress } from './GlassProgress'
import { GoalEditor } from './GoalEditor'
import { HistoryList } from './HistoryList'
import { HydrationMeter } from './HydrationMeter'
import { LoadPanel } from './LoadPanel'
import { QuickPickGrid } from './QuickPickGrid'
import { TodayList } from './TodayList'

type Props = {
  goalMl: number
  body: Body
  entries: Entry[]
  todayTotal: number
  todayHydrationMl: number
  todayEntries: Entry[]
  historyByDay: DayLog[]
  now: number
  addEntry: (amountMl: number, kind?: DrinkKind) => void
  undoEntry: (id: string) => void
  setGoal: (goalMl: number) => void
  onEditBody: () => void
}

/** The hydration journal — the app's default section. */
export function WaterView({
  goalMl,
  body,
  entries,
  todayTotal,
  todayHydrationMl,
  todayEntries,
  historyByDay,
  now,
  addEntry,
  undoEntry,
  setGoal,
  onEditBody,
}: Props) {
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
          <GoalEditor goalMl={goalMl} onSave={setGoal} />
        </div>
      </section>

      <section className="section">
        <h2 className="section-title">what's still in you</h2>
        <LoadPanel entries={entries} body={body} now={now} onEditBody={onEditBody} />
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
