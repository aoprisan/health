import { useRef, useState } from 'react'
import type { CutLog } from '../hooks/useCutLog'
import type { Body } from '../types'
import { todayIso, type CutSettings } from './model'
import { legacyHeightOf, parseCutState } from './storage'

type Props = {
  cut: CutLog
  body: Body
  onSetBody: (patch: Partial<Body>) => void
}

type Draft = Record<keyof CutSettings, string>

const toDraft = (s: CutSettings): Draft => ({
  kcal: String(s.kcal),
  protein: String(s.protein),
  winStart: s.winStart,
  winEnd: s.winEnd,
  startDate: s.startDate,
  weeks: String(s.weeks),
  startWeight: s.startWeight === null ? '' : String(s.startWeight),
  goalWeight: s.goalWeight === null ? '' : String(s.goalWeight),
})

const FIELDS: { key: keyof CutSettings; label: string; type: 'number' | 'time' | 'date'; step?: string; hint?: string }[] = [
  { key: 'kcal', label: 'calories / day', type: 'number' },
  { key: 'protein', label: 'protein g / day', type: 'number' },
  { key: 'winStart', label: 'window opens', type: 'time' },
  { key: 'winEnd', label: 'window closes', type: 'time' },
  { key: 'startDate', label: 'cut starts', type: 'date' },
  { key: 'weeks', label: 'length · weeks', type: 'number' },
  { key: 'startWeight', label: 'start weight kg', type: 'number', step: '0.05', hint: 'blank → first weigh-in' },
  { key: 'goalWeight', label: 'goal weight kg', type: 'number', step: '0.05' },
]

export function CutSettingsPanel({ cut, body, onSetBody }: Props) {
  const { state, setSettings, replaceAll } = cut
  const [draft, setDraft] = useState<Draft>(() => toDraft(state.settings))
  const [flash, setFlash] = useState<string | null>(null)
  const file = useRef<HTMLInputElement>(null)

  const say = (msg: string) => {
    setFlash(msg)
    window.setTimeout(() => setFlash(null), 1600)
  }

  const save = () => {
    const s = state.settings
    const n = (v: string, fallback: number) => {
      const x = Number(v.replace(',', '.'))
      return Number.isFinite(x) && x > 0 ? x : fallback
    }
    const opt = (v: string) => {
      const x = Number(v.replace(',', '.'))
      return v.trim() !== '' && Number.isFinite(x) && x > 0 ? x : null
    }
    setSettings({
      kcal: Math.round(n(draft.kcal, s.kcal)),
      protein: Math.round(n(draft.protein, s.protein)),
      winStart: draft.winStart || s.winStart,
      winEnd: draft.winEnd || s.winEnd,
      startDate: draft.startDate || s.startDate,
      weeks: Math.round(n(draft.weeks, s.weeks)),
      startWeight: opt(draft.startWeight),
      goalWeight: opt(draft.goalWeight),
    })
    say('saved')
  }

  return (
    <>
      <section className="section">
        <h2 className="section-title">the terms</h2>
        <form
          className="cut-settings"
          onSubmit={(e) => {
            e.preventDefault()
            save()
          }}
        >
          {FIELDS.map((f) => (
            <label key={f.key} className="cut-field">
              <span className="cut-field-label">{f.label}</span>
              <input
                type={f.type}
                step={f.step}
                inputMode={f.type === 'number' ? 'decimal' : undefined}
                placeholder="—"
                value={draft[f.key]}
                onChange={(e) => setDraft((d) => ({ ...d, [f.key]: e.target.value }))}
              />
              {f.hint ? <span className="body-field-hint">{f.hint}</span> : null}
            </label>
          ))}
          <p className="cut-note cut-settings-note">
            height comes from <em>measures</em>
            {body.heightCm !== null ? ` (${body.heightCm} cm)` : ' (not set)'}; your latest weigh-in
            updates the weight there too.
          </p>
          <div className="cut-settings-actions">
            <button type="submit" className="cut-primary">{flash === 'saved' ? 'saved ✓' : 'save'}</button>
          </div>
        </form>
      </section>

      <section className="section">
        <h2 className="section-title">the archive</h2>
        <div className="cut-data">
          <button
            type="button"
            className="cut-secondary"
            onClick={() => {
              const blob = new Blob([JSON.stringify(state, null, 2)], { type: 'application/json' })
              const a = document.createElement('a')
              a.href = URL.createObjectURL(blob)
              a.download = `cut-${todayIso()}.json`
              a.click()
              URL.revokeObjectURL(a.href)
            }}
          >
            export json
          </button>
          <button type="button" className="cut-secondary" onClick={() => file.current?.click()}>
            {flash && flash !== 'saved' ? flash : 'import json'}
          </button>
          <input
            ref={file}
            type="file"
            accept="application/json,.json"
            hidden
            onChange={async (e) => {
              const f = e.target.files?.[0]
              e.target.value = ''
              if (!f) return
              try {
                const raw: unknown = JSON.parse(await f.text())
                const next = parseCutState(raw)
                replaceAll(next)
                setDraft(toDraft(next.settings))
                const h = legacyHeightOf(raw)
                if (h !== null && body.heightCm === null) onSetBody({ heightCm: h })
                say('imported ✓')
              } catch {
                say('invalid file')
              }
            }}
          />
        </div>
        <p className="cut-note">
          kept only in this browser. export now and then. files from the standalone cut tracker import as-is.
        </p>
      </section>
    </>
  )
}
