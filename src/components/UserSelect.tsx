import { useState, useRef, useEffect } from 'react'
import type { AppUser } from '../features/users/usersSlice'

interface Props {
  value: string
  onChange: (guid: string) => void
  users: AppUser[]
  placeholder?: string
}

export default function UserSelect({ value, onChange, users, placeholder = 'Select user…' }: Props) {
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

  const approved = users.filter((u) => u.status === 'Approved')
  const filtered = query.trim()
    ? approved.filter((u) => u.username.toLowerCase().includes(query.toLowerCase()))
    : approved

  const selected = approved.find((u) => u.guid === value)

  function handleSelect(guid: string) {
    onChange(guid)
    setOpen(false)
  }

  function handleClear(e: React.MouseEvent) {
    e.stopPropagation()
    onChange('')
  }

  return (
    <div className="user-select" ref={ref}>
      <button
        type="button"
        className={`legend-trigger${open ? ' open' : ''}`}
        onClick={() => setOpen((v) => !v)}
      >
        {selected ? (
          <>
            <span className="user-trigger-name">{selected.username}</span>
            <span className="user-trigger-clear" onClick={handleClear}>✕</span>
          </>
        ) : (
          <span className="legend-trigger-placeholder">{placeholder}</span>
        )}
        {!selected && <span className="legend-trigger-arrow">▾</span>}
      </button>

      {open && (
        <div className="user-dropdown">
          <input
            ref={inputRef}
            type="text"
            className="legend-search"
            placeholder="Search users…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          <div className="user-list">
            {filtered.length === 0 ? (
              <p className="legend-no-results">No results</p>
            ) : (
              filtered.map((u) => (
                <button
                  key={u.guid}
                  type="button"
                  className={`user-option${value === u.guid ? ' selected' : ''}`}
                  onClick={() => handleSelect(u.guid)}
                >
                  {u.username}
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  )
}
