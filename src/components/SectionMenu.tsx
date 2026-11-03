import { useEffect, useRef, useState } from 'react'

export type Section = 'water' | 'cut'

export const SECTIONS: { id: Section; label: string; blurb: string }[] = [
  { id: 'water', label: 'water', blurb: 'the hydration journal' },
  { id: 'cut', label: 'cut', blurb: 'calories, protein, weigh-ins' },
]

type Props = {
  section: Section
  onChange: (section: Section) => void
}

/** Collapsed section switcher: one line in the masthead that opens into the list of sections. */
export function SectionMenu({ section, onChange }: Props) {
  const [open, setOpen] = useState(false)
  const root = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false)
    }
    const onPointer = (e: PointerEvent) => {
      if (!root.current?.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('keydown', onKey)
    document.addEventListener('pointerdown', onPointer)
    return () => {
      document.removeEventListener('keydown', onKey)
      document.removeEventListener('pointerdown', onPointer)
    }
  }, [open])

  const current = SECTIONS.find((s) => s.id === section) ?? SECTIONS[0]

  return (
    <div className="section-menu" ref={root}>
      <button
        type="button"
        className={`section-trigger ${open ? 'is-open' : ''}`}
        aria-expanded={open}
        aria-controls="section-menu-list"
        aria-label={`Section: ${current.label}. Switch section`}
        onClick={() => setOpen((o) => !o)}
      >
        <span className="section-trigger-icon" aria-hidden="true">
          <span />
          <span />
          <span />
        </span>
        <span className="section-trigger-value">{current.label}</span>
      </button>

      {open ? (
        <ul id="section-menu-list" className="section-list">
          {SECTIONS.map((s) => (
            <li key={s.id}>
              <button
                type="button"
                className={`section-option ${s.id === section ? 'is-active' : ''}`}
                aria-current={s.id === section ? 'page' : undefined}
                onClick={() => {
                  onChange(s.id)
                  setOpen(false)
                }}
              >
                <span className="section-option-label">{s.label}</span>
                <span className="section-option-blurb">{s.blurb}</span>
              </button>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  )
}
