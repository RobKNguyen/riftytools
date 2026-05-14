import { useEffect, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Cell, ReferenceLine, Legend as RechartLegend,
} from 'recharts'
import type { AppDispatch, RootState } from '../app/store'
import { fetchAnalytics } from '../features/analytics/analyticsSlice'
import { fetchFormats } from '../features/formats/formatsSlice'
import { fetchUsers } from '../features/users/usersSlice'
import Nav from '../components/Nav'

const GRID   = '#21262d'
const TEXT   = '#8b949e'
const C_FIRST  = '#58a6ff'
const C_SECOND = '#ffa657'
const TICK = { fill: TEXT, fontSize: 12 }

function wrBarColor(wr: number) {
  if (wr >= 60) return '#4ade80'
  if (wr >= 50) return '#86efac'
  if (wr < 40)  return '#f87171'
  return '#fca5a5'
}

function WrTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null
  const d = payload[0]?.payload
  return (
    <div className="chart-tooltip">
      <p className="chart-tooltip-label">{label}</p>
      <p style={{ color: wrBarColor(payload[0].value), margin: '2px 0' }}>
        Win Rate: {Number(payload[0].value).toFixed(1)}%
      </p>
      {d?.wins !== undefined && (
        <p style={{ color: TEXT, fontSize: 12, marginTop: 4 }}>
          {d.wins}W {d.losses}L {d.draws > 0 ? `${d.draws}D ` : ''}· {d.games} games
        </p>
      )}
    </div>
  )
}

function InitTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null
  const d = payload[0]?.payload
  return (
    <div className="chart-tooltip">
      <p className="chart-tooltip-label">{label}</p>
      {payload.map((p: any, i: number) => (
        <p key={i} style={{ color: p.fill, margin: '2px 0' }}>
          {p.dataKey}: {Number(p.value).toFixed(1)}%
          <span style={{ color: TEXT, fontSize: 12 }}>
            {' '}({i === 0 ? d?.firstGames : d?.secondGames}g)
          </span>
        </p>
      ))}
    </div>
  )
}

function LegendTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null
  const d = payload[0]?.payload
  return (
    <div className="chart-tooltip">
      <p className="chart-tooltip-label">{label}</p>
      {payload.map((p: any, i: number) => (
        <p key={i} style={{ color: p.fill, margin: '2px 0' }}>
          {p.dataKey}: {Number(p.value).toFixed(1)}%
        </p>
      ))}
      {d?.games !== undefined && (
        <p style={{ color: TEXT, fontSize: 12, marginTop: 4 }}>{d.games} total games</p>
      )}
    </div>
  )
}

function StatBox({ label, wr, games, color }: { label: string; wr: number; games: number; color: string }) {
  return (
    <div className="analytics-stat-box" style={{ borderColor: `${color}33`, background: `${color}0d` }}>
      <p className="analytics-stat-wr" style={{ color }}>{wr.toFixed(1)}%</p>
      <p className="analytics-stat-label">{label}</p>
      <p className="analytics-stat-games">{games} games</p>
    </div>
  )
}

export default function AnalyticsPage() {
  const dispatch = useDispatch<AppDispatch>()
  const { players, legends, status, error } = useSelector((state: RootState) => state.analytics)
  const { data: formats, status: formatsStatus } = useSelector((state: RootState) => state.formats)
  const { data: users, status: usersStatus } = useSelector((state: RootState) => state.users)

  const [formatFilter, setFormatFilter] = useState('')
  const [playerFilter, setPlayerFilter] = useState('')
  const [proOnly, setProOnly] = useState(false)

  useEffect(() => {
    if (formatsStatus === 'idle') dispatch(fetchFormats())
  }, [dispatch, formatsStatus])

  useEffect(() => {
    if (usersStatus === 'idle') dispatch(fetchUsers())
  }, [dispatch, usersStatus])

  useEffect(() => {
    dispatch(fetchAnalytics({ formatGuid: formatFilter || null, proOnly: proOnly || undefined }))
  }, [dispatch, formatFilter, proOnly])

  const MIN_GAMES = 3

  const fmt = (v: number | null) => parseFloat((v ?? 0).toFixed(1))

  const leaderboardData = [...players]
    .filter(p => p.totalgames >= MIN_GAMES)
    .sort((a, b) => b.winrate - a.winrate)
    .map(p => ({
      name: p.username,
      'Win Rate': fmt(p.winrate),
      games: p.totalgames,
      wins: p.wins,
      losses: p.losses,
      draws: p.draws,
    }))

  const initiativeData = [...players]
    .filter(p => p.totalgames >= MIN_GAMES)
    .sort((a, b) => b.winrate - a.winrate)
    .map(p => ({
      name: p.username,
      'Went First': fmt(p.wentfirst_winrate),
      'Went Second': fmt(p.wentsecond_winrate),
      firstGames: p.wentfirst_games,
      secondGames: p.wentsecond_games,
    }))

  const selectedPlayer = players.find(p => p.user_guid === playerFilter)

  const legendData = [...legends]
    .filter(l => playerFilter ? l.user_guid === playerFilter : true)
    .filter(l => l.totalgames >= MIN_GAMES)
    .sort((a, b) => b.winrate - a.winrate)
    .slice(0, 15)
    .map(l => ({
      name: l.legend.split(',')[0],
      'Went First': fmt(l.wentfirst_winrate),
      'Went Second': fmt(l.wentsecond_winrate),
      games: l.totalgames,
    }))

  const leaderboardH  = Math.max(160, leaderboardData.length * 48)
  const initiativeH   = Math.max(160, initiativeData.length * 70)
  const legendChartH  = Math.max(160, legendData.length * 52)

  const approvedUsers = users.filter(u => u.status === 'Approved')

  return (
    <div>
      <Nav />
      <main style={{ padding: '40px 24px' }}>
        <div style={{ maxWidth: 960, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 16 }}>

          {/* Header */}
          <div className="card">
            <div className="matrix-controls">
              <h1 className="page-title" style={{ marginBottom: 0 }}>
                Player <span>Analytics</span>
              </h1>
              <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'center' }}>
                <select
                  className="form-select"
                  style={{ width: 'auto', minWidth: 140, padding: '6px 12px', fontSize: 13 }}
                  value={formatFilter}
                  onChange={e => setFormatFilter(e.target.value)}
                >
                  <option value="">All Formats</option>
                  {formats.map(f => <option key={f.guid} value={f.guid}>{f.name}</option>)}
                </select>
                <select
                  className="form-select"
                  style={{ width: 'auto', minWidth: 160, padding: '6px 12px', fontSize: 13 }}
                  value={playerFilter}
                  onChange={e => setPlayerFilter(e.target.value)}
                >
                  <option value="">All Players</option>
                  {approvedUsers.map(u => <option key={u.guid} value={u.guid}>{u.username}</option>)}
                </select>
                <button
                  className={`matrix-sort-btn${proOnly ? ' active' : ''}`}
                  onClick={() => setProOnly(o => !o)}
                >
                  Pro Only
                </button>
              </div>
            </div>
          </div>

          {status === 'loading' && <p className="placeholder-text">Loading analytics…</p>}
          {status === 'error' && <div className="status-msg error">{error}</div>}

          {status === 'success' && (
            <>
              {/* Win Rate Leaderboard */}
              {leaderboardData.length > 0 && (
                <div className="card">
                  <h2 className="section-heading">Win Rate Leaderboard</h2>
                  <p className="chart-subtitle">
                    Overall win rate{selectedPlayer ? ` — ${selectedPlayer.username}` : ' across all players'}
                    {' '}(min. {MIN_GAMES} games)
                  </p>
                  <ResponsiveContainer width="100%" height={leaderboardH}>
                    <BarChart
                      data={leaderboardData}
                      layout="vertical"
                      margin={{ top: 4, right: 56, bottom: 4, left: 8 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" stroke={GRID} horizontal={false} />
                      <XAxis
                        type="number"
                        domain={[0, 100]}
                        tickFormatter={v => `${v}%`}
                        tick={TICK}
                        axisLine={{ stroke: GRID }}
                        tickLine={false}
                      />
                      <YAxis
                        type="category"
                        dataKey="name"
                        tick={TICK}
                        width={96}
                        axisLine={false}
                        tickLine={false}
                      />
                      <Tooltip content={<WrTooltip />} cursor={{ fill: 'rgba(255,255,255,0.04)' }} />
                      <ReferenceLine
                        x={50}
                        stroke="#484f58"
                        strokeDasharray="4 4"
                        label={{ value: '50%', fill: TEXT, fontSize: 11, position: 'insideTopRight', dy: -6 }}
                      />
                      <Bar dataKey="Win Rate" radius={[0, 6, 6, 0]} maxBarSize={30}>
                        {leaderboardData.map((entry, i) => (
                          <Cell key={i} fill={wrBarColor(entry['Win Rate'])} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}

              {/* Initiative Impact */}
              {initiativeData.length > 0 && (
                <div className="card">
                  <h2 className="section-heading">Initiative Impact</h2>
                  {selectedPlayer ? (
                    <div className="analytics-stat-row">
                      <StatBox
                        label="Went First"
                        wr={selectedPlayer.wentfirst_winrate ?? 0}
                        games={selectedPlayer.wentfirst_games}
                        color={C_FIRST}
                      />
                      <StatBox
                        label="Went Second"
                        wr={selectedPlayer.wentsecond_winrate ?? 0}
                        games={selectedPlayer.wentsecond_games}
                        color={C_SECOND}
                      />
                      <StatBox
                        label="Overall"
                        wr={selectedPlayer.winrate}
                        games={selectedPlayer.totalgames}
                        color="#a78bfa"
                      />
                    </div>
                  ) : (
                    <>
                      <p className="chart-subtitle">
                        Win rate when going first vs going second — per player
                      </p>
                      <ResponsiveContainer width="100%" height={initiativeH}>
                        <BarChart
                          data={initiativeData}
                          margin={{ top: 4, right: 16, bottom: 4, left: 0 }}
                          barGap={3}
                          barCategoryGap="32%"
                        >
                          <CartesianGrid strokeDasharray="3 3" stroke={GRID} vertical={false} />
                          <XAxis dataKey="name" tick={TICK} axisLine={{ stroke: GRID }} tickLine={false} />
                          <YAxis
                            domain={[0, 100]}
                            tickFormatter={v => `${v}%`}
                            tick={TICK}
                            axisLine={false}
                            tickLine={false}
                          />
                          <Tooltip content={<InitTooltip />} cursor={{ fill: 'rgba(255,255,255,0.04)' }} />
                          <RechartLegend wrapperStyle={{ color: TEXT, fontSize: 13, paddingTop: 12 }} />
                          <ReferenceLine y={50} stroke="#484f58" strokeDasharray="4 4" />
                          <Bar dataKey="Went First" fill={C_FIRST} radius={[4, 4, 0, 0]} maxBarSize={36} />
                          <Bar dataKey="Went Second" fill={C_SECOND} radius={[4, 4, 0, 0]} maxBarSize={36} />
                        </BarChart>
                      </ResponsiveContainer>
                    </>
                  )}
                </div>
              )}

              {/* Legend Performance */}
              {legendData.length > 0 && (
                <div className="card">
                  <h2 className="section-heading">Legend Performance</h2>
                  <p className="chart-subtitle">
                    Win rate by legend — first vs second
                    {selectedPlayer ? ` (${selectedPlayer.username})` : ' across all players'}
                  </p>
                  <ResponsiveContainer width="100%" height={legendChartH}>
                    <BarChart
                      data={legendData}
                      layout="vertical"
                      margin={{ top: 4, right: 16, bottom: 4, left: 8 }}
                      barGap={2}
                      barCategoryGap="28%"
                    >
                      <CartesianGrid strokeDasharray="3 3" stroke={GRID} horizontal={false} />
                      <XAxis
                        type="number"
                        domain={[0, 100]}
                        tickFormatter={v => `${v}%`}
                        tick={TICK}
                        axisLine={{ stroke: GRID }}
                        tickLine={false}
                      />
                      <YAxis
                        type="category"
                        dataKey="name"
                        tick={TICK}
                        width={100}
                        axisLine={false}
                        tickLine={false}
                      />
                      <Tooltip content={<LegendTooltip />} cursor={{ fill: 'rgba(255,255,255,0.04)' }} />
                      <RechartLegend wrapperStyle={{ color: TEXT, fontSize: 13, paddingTop: 12 }} />
                      <ReferenceLine x={50} stroke="#484f58" strokeDasharray="4 4" />
                      <Bar dataKey="Went First" fill={C_FIRST} radius={[0, 6, 6, 0]} maxBarSize={16} />
                      <Bar dataKey="Went Second" fill={C_SECOND} radius={[0, 6, 6, 0]} maxBarSize={16} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}

              {/* Players table */}
              {leaderboardData.length > 0 && (
                <div className="card">
                  <h2 className="section-heading">Players</h2>
                  <div style={{ overflowX: 'auto' }}>
                    <table className="admin-table">
                      <thead>
                        <tr>
                          <th>Player</th>
                          <th>Level</th>
                          <th style={{ textAlign: 'right' }}>Games</th>
                          <th style={{ textAlign: 'right' }}>Win Rate</th>
                          <th style={{ textAlign: 'right' }}>Record</th>
                        </tr>
                      </thead>
                      <tbody>
                        {[...players]
                          .filter(p => p.totalgames >= MIN_GAMES)
                          .sort((a, b) => b.winrate - a.winrate)
                          .map(p => (
                            <tr key={p.user_guid}>
                              <td style={{ fontWeight: 600 }}>{p.username}</td>
                              <td>
                                {p.level === 'Pro'
                                  ? <span className="pro-badge">Pro</span>
                                  : <span style={{ color: '#484f58', fontSize: 12 }}>Standard</span>}
                              </td>
                              <td style={{ textAlign: 'right', color: '#8b949e' }}>{p.totalgames}</td>
                              <td style={{ textAlign: 'right', fontWeight: 700, color: p.winrate >= 50 ? '#4ade80' : '#f87171' }}>
                                {p.winrate.toFixed(1)}%
                              </td>
                              <td style={{ textAlign: 'right', color: '#6e7681', fontSize: 12 }}>
                                {p.wins}W {p.losses}L{p.draws > 0 ? ` ${p.draws}D` : ''}
                              </td>
                            </tr>
                          ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {leaderboardData.length === 0 && legendData.length === 0 && (
                <p className="placeholder-text">No analytics data yet.</p>
              )}
            </>
          )}
        </div>
      </main>
    </div>
  )
}
