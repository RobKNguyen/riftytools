import { useEffect, useMemo, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import type { AppDispatch, RootState } from '../app/store'
import { fetchMatrix } from '../features/matrix/matrixSlice'
import { fetchFormats } from '../features/formats/formatsSlice'
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

export default function MatrixPage() {
  const dispatch = useDispatch<AppDispatch>()
  const { data, status, error } = useSelector((state: RootState) => state.matrix)
  const { data: formats, status: formatsStatus } = useSelector(
    (state: RootState) => state.formats
  )

  const [sortBy, setSortBy] = useState<SortBy>('winrate')
  const [formatFilter, setFormatFilter] = useState<string>('')
  const [wentFirstFilter, setWentFirstFilter] = useState<boolean | null>(null)

  useEffect(() => {
    if (formatsStatus === 'idle') dispatch(fetchFormats())
  }, [dispatch, formatsStatus])

  useEffect(() => {
    dispatch(fetchMatrix({ formatGuid: formatFilter || null, wentFirst: wentFirstFilter }))
  }, [dispatch, formatFilter, wentFirstFilter])

  // Build legend stats (for overall WR + sorting)
  const legendStats = useMemo(() => {
    const map = new Map<string, LegendStat>()

    data.forEach((e) => {
      if (!map.has(e.legenduser_guid)) {
        map.set(e.legenduser_guid, {
          name: e.legenduser,
          imageurl: e.legenduserimage,
          wins: 0, losses: 0, draws: 0, total: 0,
        })
      }
      const s = map.get(e.legenduser_guid)!
      s.wins   += e.wins
      s.losses += e.losses
      s.draws  += e.draws
      s.total  += e.totalgames
    })

    // Ensure legends that only appear as opponents are still in the axis
    data.forEach((e) => {
      if (!map.has(e.legendopp_guid)) {
        map.set(e.legendopp_guid, {
          name: e.legendopp,
          imageurl: e.legendoppimage,
          wins: 0, losses: 0, draws: 0, total: 0,
        })
      }
    })

    return map
  }, [data])

  const sortedLegends = useMemo(() => {
    return [...legendStats.entries()].sort(([, a], [, b]) => {
      if (sortBy === 'name') return a.name.localeCompare(b.name)
      if (sortBy === 'winrate') {
        const wrA = a.total > 0 ? a.wins / a.total : -1
        const wrB = b.total > 0 ? b.wins / b.total : -1
        return wrB - wrA
      }
      return b.total - a.total
    })
  }, [legendStats, sortBy])

  // Direct lookup grid: grid[user][opp] = cell
  const grid = useMemo(() => {
    const g = new Map<string, Map<string, (typeof data)[0]>>()
    data.forEach((e) => {
      if (!g.has(e.legenduser_guid)) g.set(e.legenduser_guid, new Map())
      g.get(e.legenduser_guid)!.set(e.legendopp_guid, e)
    })
    return g
  }, [data])

  // Resolve a cell: prefer direct data, fall back to inverse derivation
  function resolveCell(rowGuid: string, colGuid: string) {
    const direct  = grid.get(rowGuid)?.get(colGuid)
    if (direct && direct.totalgames > 0) return direct

    const inverse = grid.get(colGuid)?.get(rowGuid)
    if (!inverse || inverse.totalgames === 0) return null

    return {
      ...inverse,
      legenduser_guid: rowGuid,
      legendopp_guid:  colGuid,
      wins:    inverse.losses,
      losses:  inverse.wins,
      winrate: 100 - inverse.winrate,
    }
  }

  function wrColor(wr: number, total: number): string {
    if (total === 0) return '#30363d'
    if (wr >= 0.6)  return '#4ade80'
    if (wr >= 0.52) return '#86efac'
    if (wr <= 0.4)  return '#f87171'
    if (wr < 0.48)  return '#fca5a5'
    return '#8b949e'
  }

  function cellBg(wr: number, total: number): string {
    if (total === 0) return 'transparent'
    if (wr >= 0.55) return 'rgba(34,197,94,0.07)'
    if (wr <= 0.45) return 'rgba(239,68,68,0.07)'
    return 'transparent'
  }

  const SORTS: [SortBy, string][] = [
    ['winrate', 'Win Rate'],
    ['games', 'Games'],
    ['name', 'Name'],
  ]

  const INITIATIVE: [boolean | null, string][] = [
    [null,  'All'],
    [true,  'Went First'],
    [false, 'Went Second'],
  ]

  return (
    <div>
      <Nav />
      <main style={{ padding: '40px 24px' }}>
        <div className="card" style={{ overflowX: 'auto' }}>
          <div className="matrix-controls">
            <h1 className="page-title" style={{ marginBottom: 0 }}>
              Matchup <span>Matrix</span>
            </h1>

            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
              {/* Sort */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span className="matrix-sort-label">Sort</span>
                <div className="matrix-sort-btns">
                  {SORTS.map(([val, label]) => (
                    <button
                      key={String(val)}
                      className={`matrix-sort-btn${sortBy === val ? ' active' : ''}`}
                      onClick={() => setSortBy(val)}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Format filter */}
              <select
                className="form-select"
                style={{ width: 'auto', minWidth: '140px', padding: '6px 12px', fontSize: '13px' }}
                value={formatFilter}
                onChange={(e) => setFormatFilter(e.target.value)}
              >
                <option value="">All Formats</option>
                {formats.map((f) => (
                  <option key={f.guid} value={f.guid}>{f.name}</option>
                ))}
              </select>

              {/* Initiative filter */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span className="matrix-sort-label">Initiative</span>
                <div className="matrix-sort-btns">
                  {INITIATIVE.map(([val, label]) => (
                    <button
                      key={String(val)}
                      className={`matrix-sort-btn${wentFirstFilter === val ? ' active' : ''}`}
                      onClick={() => setWentFirstFilter(val)}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {status === 'loading' && <p className="placeholder-text">Loading matrix…</p>}
          {status === 'error'   && <div className="status-msg error">{error}</div>}
          {status === 'success' && data.length === 0 && (
            <p className="placeholder-text">No data yet. Submit some results first.</p>
          )}

          {status === 'success' && sortedLegends.length > 0 && (
            <table className="matrix-table">
              <thead>
                <tr>
                  <th className="matrix-th matrix-th-label" />
                  <th className="matrix-th matrix-th-overall">Overall</th>
                  {sortedLegends.map(([guid, s]) => (
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
                {sortedLegends.map(([rowGuid, rowStat]) => {
                  const rowWR = rowStat.total > 0 ? rowStat.wins / rowStat.total : 0
                  const pctOverall = rowStat.total > 0 ? (rowWR * 100).toFixed(2) : null

                  return (
                    <tr key={rowGuid} className="matrix-row">
                      {/* Row label */}
                      <td className="matrix-td matrix-td-label">
                        <div className="matrix-row-label">
                          <img src={rowStat.imageurl} alt={rowStat.name} className="matrix-legend-img" />
                          <span>{rowStat.name}</span>
                        </div>
                      </td>

                      {/* Overall WR */}
                      <td
                        className="matrix-td matrix-td-overall"
                        style={{ background: cellBg(rowWR, rowStat.total) }}
                      >
                        {pctOverall !== null ? (
                          <>
                            <span className="matrix-wr" style={{ color: wrColor(rowWR, rowStat.total) }}>
                              {pctOverall}%
                            </span>
                            <span className="matrix-record">
                              {rowStat.wins}W {rowStat.losses}L
                              {rowStat.draws > 0 ? ` ${rowStat.draws}D` : ''}
                            </span>
                          </>
                        ) : (
                          <span className="matrix-empty">—</span>
                        )}
                      </td>

                      {/* Per-matchup cells */}
                      {sortedLegends.map(([colGuid]) => {
                        if (rowGuid === colGuid) {
                          return <td key={colGuid} className="matrix-td matrix-td-self" />
                        }

                        const cell = resolveCell(rowGuid, colGuid)
                        if (!cell) {
                          return (
                            <td key={colGuid} className="matrix-td">
                              <span className="matrix-empty">—</span>
                            </td>
                          )
                        }

                        const pct = cell.winrate.toFixed(2)
                        const wr01 = cell.winrate / 100

                        return (
                          <td
                            key={colGuid}
                            className="matrix-td"
                            style={{ background: cellBg(wr01, cell.totalgames) }}
                          >
                            <span className="matrix-wr" style={{ color: wrColor(wr01, cell.totalgames) }}>
                              {pct}%
                            </span>
                            <span className="matrix-record">
                              {cell.wins}W {cell.losses}L
                              {cell.draws > 0 ? ` ${cell.draws}D` : ''}
                            </span>
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
      </main>
    </div>
  )
}
