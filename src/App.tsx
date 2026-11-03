import { useCallback, useEffect, useState } from 'react'
import { useCutLog } from './hooks/useCutLog'
import { useNow } from './hooks/useNow'
import { useWaterLog } from './hooks/useWaterLog'
import { BodyMenu } from './components/BodyMenu'
import { SectionMenu, type Section } from './components/SectionMenu'
import { WaterView } from './components/WaterView'
import { CutView } from './cut/CutView'
import { r1, sortedWeights, weekLabel } from './cut/model'

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

/** Water is the default; `#cut` deep-links (and survives a reload) into the cut section. */
function sectionFromUrl(): Section {
  return window.location.hash === '#cut' ? 'cut' : 'water'
}

export default function App() {
  const water = useWaterLog()
  const cut = useCutLog()
  const now = useNow()
  const [bodyMenuOpen, setBodyMenuOpen] = useState(false)
  const [section, setSection] = useState<Section>(sectionFromUrl)

  useEffect(() => {
    const sync = () => setSection(sectionFromUrl())
    window.addEventListener('popstate', sync)
    window.addEventListener('hashchange', sync)
    return () => {
      window.removeEventListener('popstate', sync)
      window.removeEventListener('hashchange', sync)
    }
  }, [])

  const goTo = useCallback(
    (next: Section) => {
      if (next === section) return
      const { pathname, search } = window.location
      window.history.pushState(null, '', next === 'cut' ? '#cut' : pathname + search)
      setSection(next)
      window.scrollTo({ top: 0 })
    },
    [section],
  )

  const { setBody } = water
  const { setWeight } = cut
  const latestWeighIn = sortedWeights(cut.state).slice(-1)[0]?.[0] ?? null

  // The newest weigh-in is also the body weight the blood-alcohol estimate uses.
  const logWeight = useCallback(
    (day: string, kg: number) => {
      setWeight(day, kg)
      if (latestWeighIn === null || day >= latestWeighIn) setBody({ weightKg: r1(kg) })
    },
    [setWeight, setBody, latestWeighIn],
  )

  const isCut = section === 'cut'

  return (
    <div className={`app is-${section}`}>
      <header className="app-header">
        <SectionMenu section={section} onChange={goTo} />
        <div className="masthead">
          <h1 className="masthead-title">
            {isCut ? 'The Cut' : 'Hydrology'}
            <span className="amp">.</span>
          </h1>
          <p className="masthead-sub">
            {isCut ? `a cutting ledger · ${weekLabel(cut.state.settings, now)}` : 'a hydration journal · vol. ii'}
          </p>
        </div>
        <div className="masthead-aside">
          <div className="masthead-date">{formatToday()}</div>
          <BodyMenu
            body={water.body}
            open={bodyMenuOpen}
            onOpenChange={setBodyMenuOpen}
            onSave={setBody}
          />
        </div>
      </header>

      {isCut ? (
        <CutView
          key="cut"
          cut={cut}
          body={water.body}
          now={now}
          onLogWeight={logWeight}
          onSetBody={setBody}
          onEditBody={() => setBodyMenuOpen(true)}
        />
      ) : (
        <WaterView
          key="water"
          goalMl={water.goalMl}
          body={water.body}
          entries={water.entries}
          todayTotal={water.todayTotal}
          todayHydrationMl={water.todayHydrationMl}
          todayEntries={water.todayEntries}
          historyByDay={water.historyByDay}
          now={now}
          addEntry={water.addEntry}
          undoEntry={water.undoEntry}
          setGoal={water.setGoal}
          onEditBody={() => setBodyMenuOpen(true)}
        />
      )}

      <footer className="app-footer">
        <span>folio · {isCut ? '03' : '02'}</span>
        <span className="ornament">{isCut ? '— festina lente —' : '— bibite aquam —'}</span>
        <span>local · private</span>
      </footer>
    </div>
  )
}
