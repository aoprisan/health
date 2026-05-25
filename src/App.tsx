import { useState } from 'react'
import { useHealthLog } from './hooks/useHealthLog'
import { TabBar } from './components/TabBar'
import { WaterView } from './views/WaterView'
import { CaloriesView } from './views/CaloriesView'
import { FastingView } from './views/FastingView'
import type { Tab } from './types'

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

const SUBTITLES: Record<Tab, string> = {
  water: 'a hydration journal · vol. ii',
  calories: 'a daily intake ledger',
  fasting: 'an intermittent fasting log',
}

export default function App() {
  const { water, calories, fasting } = useHealthLog()
  const [tab, setTab] = useState<Tab>('water')

  return (
    <div className="app">
      <header className="app-header">
        <div className="masthead">
          <h1 className="masthead-title">
            Health<span className="amp">.</span>
          </h1>
          <p className="masthead-sub">{SUBTITLES[tab]}</p>
        </div>
        <div className="masthead-date">{formatToday()}</div>
      </header>

      <TabBar active={tab} onChange={setTab} />

      {tab === 'water' ? <WaterView water={water} /> : null}
      {tab === 'calories' ? <CaloriesView calories={calories} /> : null}
      {tab === 'fasting' ? <FastingView fasting={fasting} /> : null}

      <footer className="app-footer">
        <span>folio · 02</span>
        <span className="ornament">— bibite aquam —</span>
        <span>local · private</span>
      </footer>
    </div>
  )
}
