import { useState, useRef, useEffect } from 'react'
import type { Legend } from '../features/legends/legendsSlice'

interface Props {
  value: string
  onChange: (guid: string) => void
  legends: Legend[]
  placeholder: string
}

export default function LegendSelect({ value, onChange, legends, placeholder }: Props) {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const ref = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    if (open) document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [open])

  useEffect(() => {
    if (open) {
      setQuery('')
      setTimeout(() => inputRef.current?.focus(), 0)
    }
  }, [open])

  const filtered = query.trim()
    ? legends.filter((l) => l.name.toLowerCase().includes(query.toLowerCase()))
    : legends

  const selected = legends.find((l) => l.guid === value)

  return (
    <div className="legend-select" ref={ref}>
      <button
        type="button"
        className={`legend-trigger${open ? ' open' : ''}`}
        onClick={() => setOpen((v) => !v)}
      >
        {selected ? (
          <>
            <img src={selected.imageurl} alt={selected.name} className="legend-trigger-img" />
            <span>{selected.name}</span>
          </>
        ) : (
          <span className="legend-trigger-placeholder">{placeholder}</span>
        )}
        <span className="legend-trigger-arrow">▾</span>
      </button>

      {open && (
        <div className="legend-dropdown">
          <input
            ref={inputRef}
            type="text"
            className="legend-search"
            placeholder="Search legends…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          <div className="legend-grid">
            {filtered.length === 0 ? (
              <p className="legend-no-results">No results</p>
            ) : (
              filtered.map((l) => (
                <button
                  key={l.guid}
                  type="button"
                  className={`legend-tile${value === l.guid ? ' selected' : ''}`}
                  title={l.name}
                  onClick={() => {
                    onChange(l.guid)
                    setOpen(false)
                  }}
                >
                  <img src={l.imageurl} alt={l.name} className="legend-tile-img" />
                  <span className="legend-tile-name">{l.name}</span>
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  )
}
