import { useEffect, useMemo, useRef, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import type { AppDispatch, RootState } from '../app/store'
import { fetchMatrix } from '../features/matrix/matrixSlice'
import { fetchFormats } from '../features/formats/formatsSlice'
import { fetchUsers } from '../features/users/usersSlice'
import Nav from '../components/Nav'

type SortBy = 'winrate' | 'games' | 'name'

interface LegendStat {
  name: string
  imageurl: string
  wins: number
  losses: number
  draws: number
  total: number
}

function LegendMultiSelect({
  label,
  options,
  selected,
  onChange,
}: {
  label: string
  options: [string, LegendStat][]
  selected: string[]
  onChange: (guids: string[]) => void
}) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function onDown(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', onDown)
    return () => document.removeEventListener('mousedown', onDown)
  }, [])

  function toggle(guid: string) {
    onChange(selected.includes(guid) ? selected.filter(g => g !== guid) : [...selected, guid])
  }

  const btnLabel = selected.length === 0
    ? label
    : selected.length === 1
      ? options.find(([g]) => g === selected[0])?.[1].name ?? label
      : `${selected.length} selected`

  return (
    <div className="legend-ms" ref={ref}>
      <button
        type="button"
        className={`legend-ms-btn${selected.length > 0 ? ' has-selection' : ''}`}
        onClick={() => setOpen(o => !o)}
      >
        {selected.length > 0 && <span className="legend-ms-badge">{selected.length}</span>}
        <span>{btnLabel}</span>
        <span className="legend-ms-arrow">{open ? '▲' : '▼'}</span>
      </button>
      {open && (
        <div className="legend-ms-dropdown">
          {selected.length > 0 && (
            <button type="button" className="legend-ms-clear" onClick={() => onChange([])}>
              Clear all
            </button>
          )}
          <div className="legend-ms-list">
            {options.map(([guid, stat]) => (
              <label key={guid} className={`legend-ms-option${selected.includes(guid) ? ' checked' : ''}`}>
                <input type="checkbox" checked={selected.includes(guid)} onChange={() => toggle(guid)} />
                <img src={stat.imageurl} alt={stat.name} className="legend-ms-img" />
                <span>{stat.name}</span>
              </label>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

export default function MatrixPage() {
  const dispatch = useDispatch<AppDispatch>()
  const { data, status, error } = useSelector((state: RootState) => state.matrix)
  const { data: formats, status: formatsStatus } = useSelector((state: RootState) => state.formats)
  const { data: users, status: usersStatus } = useSelector((state: RootState) => state.users)

  const [sortBy, setSortBy] = useState<SortBy>('winrate')
  const [formatFilter, setFormatFilter] = useState<string>('')
  const [playerFilter, setPlayerFilter] = useState<string>('')
  const [proOnly, setProOnly] = useState(false)
const [playingFilter, setPlayingFilter] = useState<string[]>([])
  const [againstFilter, setAgainstFilter] = useState<string[]>([])

  useEffect(() => {
    if (formatsStatus === 'idle') dispatch(fetchFormats())
  }, [dispatch, formatsStatus])

  useEffect(() => {
    if (usersStatus === 'idle') dispatch(fetchUsers())
  }, [dispatch, usersStatus])

  useEffect(() => {
    dispatch(fetchMatrix({ formatGuid: formatFilter || null, wentFirst: null, userGuid: playerFilter || null, proOnly: proOnly || undefined }))
  }, [dispatch, formatFilter, playerFilter, proOnly])

  const legendStats = useMemo(() => {
    const map = new Map<string, LegendStat>()
    data.forEach((e) => {
      if (!map.has(e.legenduser_guid)) {
        map.set(e.legenduser_guid, { name: e.legenduser, imageurl: e.legenduserimage, wins: 0, losses: 0, draws: 0, total: 0 })
      }
      const s = map.get(e.legenduser_guid)!
      s.wins += e.wins; s.losses += e.losses; s.draws += e.draws; s.total += e.totalgames
    })
    data.forEach((e) => {
      if (!map.has(e.legendopp_guid)) {
        map.set(e.legendopp_guid, { name: e.legendopp, imageurl: e.legendoppimage, wins: 0, losses: 0, draws: 0, total: 0 })
      }
    })
    return map
  }, [data])

  const grid = useMemo(() => {
    const g = new Map<string, Map<string, (typeof data)[0]>>()
    data.forEach((e) => {
      if (!g.has(e.legenduser_guid)) g.set(e.legenduser_guid, new Map())
      g.get(e.legenduser_guid)!.set(e.legendopp_guid, e)
    })
    return g
  }, [data])

  const legendOverall = useMemo(() => {
    const allGuids = [...legendStats.keys()]
    const result = new Map<string, { wins: number; total: number }>()
    allGuids.forEach(rowGuid => {
      let wins = 0, total = 0
      allGuids.forEach(colGuid => {
        if (colGuid === rowGuid) return
        const direct = grid.get(rowGuid)?.get(colGuid)
        if (direct && direct.totalgames > 0) {
          wins += direct.wins
          total += direct.wins + direct.losses + direct.draws
        } else {
          const inv = grid.get(colGuid)?.get(rowGuid)
          if (inv && inv.totalgames > 0) {
            wins += inv.losses
            total += inv.wins + inv.losses + inv.draws
          }
        }
      })
      result.set(rowGuid, { wins, total })
    })
    return result
  }, [legendStats, grid])

  const sortedLegends = useMemo(() => {
    return [...legendStats.entries()]
      .sort(([guidA, a], [guidB, b]) => {
        if (sortBy === 'name') return a.name.localeCompare(b.name)
        const sA = legendOverall.get(guidA) ?? { wins: 0, total: 0 }
        const sB = legendOverall.get(guidB) ?? { wins: 0, total: 0 }
        if (sortBy === 'winrate') {
          const wrA = sA.total > 0 ? sA.wins / sA.total : -1
          const wrB = sB.total > 0 ? sB.wins / sB.total : -1
          return wrB - wrA
        }
        return sB.total - sA.total
      })
  }, [legendStats, legendOverall, sortBy])

  const legendOptions = useMemo(
    () => [...legendStats.entries()].sort(([, a], [, b]) => a.name.localeCompare(b.name)),
    [legendStats],
  )

  const rowLegends = useMemo(
    () => playingFilter.length > 0 ? sortedLegends.filter(([g]) => playingFilter.includes(g)) : sortedLegends,
    [sortedLegends, playingFilter],
  )

  const colLegends = useMemo(
    () => againstFilter.length > 0 ? sortedLegends.filter(([g]) => againstFilter.includes(g)) : sortedLegends,
    [sortedLegends, againstFilter],
  )

  function resolveCell(rowGuid: string, colGuid: string) {
    const direct = grid.get(rowGuid)?.get(colGuid)
    if (direct && direct.totalgames > 0) return direct
    const inverse = grid.get(colGuid)?.get(rowGuid)
    if (!inverse || inverse.totalgames === 0) return null
    return { ...inverse, legenduser_guid: rowGuid, legendopp_guid: colGuid, wins: inverse.losses, losses: inverse.wins, winrate: 100 - inverse.winrate }
  }

  function wrColor(wr: number, total: number) {
    if (total === 0) return '#30363d'
    if (wr >= 0.6)  return '#4ade80'
    if (wr >= 0.52) return '#86efac'
    if (wr <= 0.4)  return '#f87171'
    if (wr < 0.48)  return '#fca5a5'
    return '#8b949e'
  }

  function cellBg(wr: number, total: number) {
    if (total === 0) return 'transparent'
    if (wr >= 0.55) return 'rgba(34,197,94,0.07)'
    if (wr <= 0.45) return 'rgba(239,68,68,0.07)'
    return 'transparent'
  }

  const SORTS: [SortBy, string][] = [['winrate', 'Win Rate'], ['games', 'Games'], ['name', 'Name']]

  const scrollRef = useRef<HTMLDivElement>(null)
  const isDragging = useRef(false)
  const dragStart = useRef({ x: 0, y: 0, sl: 0, st: 0 })

  function onDragStart(e: React.MouseEvent<HTMLDivElement>) {
    isDragging.current = true
    dragStart.current = { x: e.clientX, y: e.clientY, sl: scrollRef.current!.scrollLeft, st: scrollRef.current!.scrollTop }
  }

  function onDragMove(e: React.MouseEvent<HTMLDivElement>) {
    if (!isDragging.current || !scrollRef.current) return
    e.preventDefault()
    scrollRef.current.scrollLeft = dragStart.current.sl - (e.clientX - dragStart.current.x)
    scrollRef.current.scrollTop  = dragStart.current.st - (e.clientY - dragStart.current.y)
  }

  function stopDrag() { isDragging.current = false }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh' }}>
      <Nav />
      <main className="matrix-main">
        <div className="card matrix-card">
          <div className="matrix-controls">
            <h1 className="page-title" style={{ marginBottom: 0 }}>
              Matchup <span>Matrix</span>
            </h1>

            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span className="matrix-sort-label">Sort</span>
                <div className="matrix-sort-btns">
                  {SORTS.map(([val, label]) => (
                    <button key={val} className={`matrix-sort-btn${sortBy === val ? ' active' : ''}`} onClick={() => setSortBy(val)}>
                      {label}
                    </button>
                  ))}
                </div>
              </div>

              <select
                className="form-select"
                style={{ width: 'auto', minWidth: '140px', padding: '6px 12px', fontSize: '13px' }}
                value={formatFilter}
                onChange={e => setFormatFilter(e.target.value)}
              >
                <option value="">All Formats</option>
                {formats.map(f => <option key={f.guid} value={f.guid}>{f.name}</option>)}
              </select>

              <select
                className="form-select"
                style={{ width: 'auto', minWidth: '150px', padding: '6px 12px', fontSize: '13px' }}
                value={playerFilter}
                onChange={e => setPlayerFilter(e.target.value)}
              >
                <option value="">All Players</option>
                {users.filter(u => u.status === 'Approved').map(u => (
                  <option key={u.guid} value={u.guid}>{u.username}</option>
                ))}
              </select>

              <button
                className={`matrix-sort-btn${proOnly ? ' active' : ''}`}
                onClick={() => setProOnly(o => !o)}
              >
                Pro Only
              </button>

<LegendMultiSelect
                label="Playing"
                options={legendOptions}
                selected={playingFilter}
                onChange={setPlayingFilter}
              />

              <LegendMultiSelect
                label="Playing Against"
                options={legendOptions}
                selected={againstFilter}
                onChange={setAgainstFilter}
              />
            </div>
          </div>

          <div
            ref={scrollRef}
            className="matrix-scroll"
            onMouseDown={onDragStart}
            onMouseMove={onDragMove}
            onMouseUp={stopDrag}
            onMouseLeave={stopDrag}
          >
            {status === 'loading' && <p className="placeholder-text">Loading matrix…</p>}
            {status === 'error'   && <div className="status-msg error">{error}</div>}
            {status === 'success' && data.length === 0 && (
              <p className="placeholder-text">No data yet. Submit some results first.</p>
            )}

            {status === 'success' && rowLegends.length > 0 && (
              <table className="matrix-table">
                <thead>
                  <tr>
                    <th className="matrix-th matrix-th-label" />
                    <th className="matrix-th matrix-th-overall">Overall</th>
                    {colLegends.map(([guid, s]) => (
                      <th key={guid} className="matrix-th">
                        <div className="matrix-legend-header">
                          <img src={s.imageurl} alt={s.name} className="matrix-legend-img" />
                          <span className="matrix-legend-name">{s.name}</span>
                        </div>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {rowLegends.map(([rowGuid, rowStat]) => {
                    let overallWins = 0, overallLosses = 0, overallDraws = 0
                    colLegends.forEach(([colGuid]) => {
                      if (colGuid === rowGuid) return
                      const cell = resolveCell(rowGuid, colGuid)
                      if (cell) { overallWins += cell.wins; overallLosses += cell.losses; overallDraws += cell.draws }
                    })
                    const overallGames = overallWins + overallLosses + overallDraws
                    const rowWR = overallGames > 0 ? overallWins / overallGames : 0
                    const pctOverall = overallGames > 0 ? (rowWR * 100).toFixed(2) : null
                    return (
                      <tr key={rowGuid} className="matrix-row">
                        <td className="matrix-td matrix-td-label">
                          <div className="matrix-row-label">
                            <img src={rowStat.imageurl} alt={rowStat.name} className="matrix-legend-img" />
                            <span>{rowStat.name}</span>
                          </div>
                        </td>
                        <td className="matrix-td matrix-td-overall">
                          {pctOverall !== null ? (
                            <>
                              <span className="matrix-wr" style={{ color: wrColor(rowWR, overallGames) }}>{pctOverall}%</span>
                              <span className="matrix-record">{overallWins}W {overallLosses}L{overallDraws > 0 ? ` ${overallDraws}D` : ''}</span>
                            </>
                          ) : (
                            <span className="matrix-empty">—</span>
                          )}
                        </td>
                        {colLegends.map(([colGuid]) => {
                          if (rowGuid === colGuid) return <td key={colGuid} className="matrix-td matrix-td-self" />
                          const cell = resolveCell(rowGuid, colGuid)
                          if (!cell) return <td key={colGuid} className="matrix-td"><span className="matrix-empty">—</span></td>
                          const cellGames = cell.wins + cell.losses + cell.draws
                          const wr01 = cellGames > 0 ? cell.wins / cellGames : 0
                          const pct = (wr01 * 100).toFixed(2)
                          return (
                            <td key={colGuid} className="matrix-td" style={{ background: cellBg(wr01, cellGames) }}>
                              <span className="matrix-wr" style={{ color: wrColor(wr01, cellGames) }}>{pct}%</span>
                              <span className="matrix-record">{cell.wins}W {cell.losses}L{cell.draws > 0 ? ` ${cell.draws}D` : ''}</span>
                            </td>
                          )
                        })}
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </main>
    </div>
  )
}
