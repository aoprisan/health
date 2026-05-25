import type { Tab } from '../types'

type Props = {
  active: Tab
  onChange: (tab: Tab) => void
}

const TABS: { id: Tab; label: string; glyph: string }[] = [
  { id: 'water', label: 'water', glyph: '~' },
  { id: 'calories', label: 'calories', glyph: '△' },
  { id: 'fasting', label: 'fasting', glyph: '◷' },
]

export function TabBar({ active, onChange }: Props) {
  return (
    <div className="tab-bar" role="tablist" aria-label="Section">
      {TABS.map((t) => {
        const isActive = t.id === active
        return (
          <button
            key={t.id}
            role="tab"
            type="button"
            aria-selected={isActive}
            className={`tab ${isActive ? 'is-active' : ''}`}
            data-tab={t.id}
            onClick={() => onChange(t.id)}
          >
            <span className="tab-glyph" aria-hidden="true">{t.glyph}</span>
            <span className="tab-label">{t.label}</span>
          </button>
        )
      })}
    </div>
  )
}
