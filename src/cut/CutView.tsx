import { useState } from 'react'
import type { CutLog } from '../hooks/useCutLog'
import type { Body } from '../types'
import { CutFoods } from './CutFoods'
import { CutSettingsPanel } from './CutSettingsPanel'
import { CutToday } from './CutToday'
import { CutWeight } from './CutWeight'

type Tab = 'today' | 'weight' | 'foods' | 'settings'

const TABS: { id: Tab; label: string }[] = [
  { id: 'today', label: 'today' },
  { id: 'weight', label: 'weight' },
  { id: 'foods', label: 'foods' },
  { id: 'settings', label: 'settings' },
]

type Props = {
  cut: CutLog
  body: Body
  now: number
  onLogWeight: (day: string, kg: number) => void
  onSetBody: (patch: Partial<Body>) => void
  onEditBody: () => void
}

export function CutView({ cut, body, now, onLogWeight, onSetBody, onEditBody }: Props) {
  const [tab, setTab] = useState<Tab>('today')

  return (
    <div className="cut">
      <nav className="cut-tabs" aria-label="Cut pages">
        {TABS.map((t) => (
          <button
            key={t.id}
            type="button"
            className={`cut-tab ${tab === t.id ? 'is-active' : ''}`}
            aria-current={tab === t.id ? 'page' : undefined}
            onClick={() => setTab(t.id)}
          >
            {t.label}
          </button>
        ))}
      </nav>

      {tab === 'today' ? <CutToday cut={cut} now={now} /> : null}
      {tab === 'weight' ? (
        <CutWeight cut={cut} body={body} now={now} onLogWeight={onLogWeight} onEditBody={onEditBody} />
      ) : null}
      {tab === 'foods' ? <CutFoods cut={cut} /> : null}
      {tab === 'settings' ? <CutSettingsPanel cut={cut} body={body} onSetBody={onSetBody} /> : null}
    </div>
  )
}
