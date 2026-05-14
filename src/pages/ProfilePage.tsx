import { useEffect, useState } from 'react'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Cell, ReferenceLine,
} from 'recharts'
import { useParams } from 'react-router-dom'
import { useDispatch, useSelector } from 'react-redux'
import toast from 'react-hot-toast'
import type { AppDispatch, RootState } from '../app/store'
import { fetchProfile, removeRecentResult } from '../features/profile/profileSlice'
import type { TopLegend, RecentResult } from '../features/profile/profileSlice'
import { switchboard } from '../services/switchboard'
import ConfirmDialog from '../components/ConfirmDialog'
import EditResultModal from '../components/EditResultModal'
import type { EditableResult } from '../components/EditResultModal'
import Nav from '../components/Nav'

function profileWrColor(wr: number): string {
  if (wr >= 60) return '#4ade80'
  if (wr >= 50) return '#86efac'
  if (wr < 40)  return '#f87171'
  return '#fca5a5'
}

function roleBadgeClass(role: string): string {
  return role === 'Admin' ? 'badge-approved' : 'badge-pending'
}

function resultClass(result: string): string {
  if (result === 'Win') return 'result-win'
  if (result === 'Loss') return 'result-loss'
  return 'result-draw'
}

function memberSince(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
}

function LegendCard({ l }: { l: TopLegend }) {
  return (
    <div className="legend-card">
      <img src={l.imageurl} alt={l.legend} className="legend-card-img" />
      <div className="legend-card-body">
        <p className="legend-card-name">{l.legend.split(',')[0]}</p>
        <p className={`legend-card-wr ${resultClass(l.winrate >= 50 ? 'Win' : 'Loss')}`}>
          {l.winrate.toFixed(1)}%
        </p>
        <p className="legend-card-record">{l.wins}W {l.losses}L • {l.totalgames}G</p>
      </div>
    </div>
  )
}

function RecentRow({
  r,
  isOwn,
  onEdit,
  onDelete,
}: {
  r: RecentResult
  isOwn: boolean
  onEdit: (r: EditableResult) => void
  onDelete: (guid: string) => void
}) {
  const [notesOpen, setNotesOpen] = useState(false)
  const userLabel = r.legenduservariant
    ? `${r.legenduser.split(',')[0]} (${r.legenduservariant})`
    : r.legenduser.split(',')[0]
  const oppLabel = r.legendoppvariant
    ? `${r.legendopp.split(',')[0]} (${r.legendoppvariant})`
    : r.legendopp.split(',')[0]

  return (
    <div className="recent-item">
      <div className="recent-legends">
        <img src={r.legenduserimage} alt={r.legenduser} className="recent-legend-img" />
        <img src={r.legendoppimage} alt={r.legendopp} className="recent-legend-img recent-legend-opp" />
      </div>
      <div className="recent-content">
        <div className="recent-info">
          <span className="recent-matchup">
            {r.legenduser.split(',')[0]}
            {r.legenduservariant && <span className="recent-variant"> · {r.legenduservariant}</span>}
            {' '}<span className="recent-vs">vs</span>{' '}
            {r.legendopp.split(',')[0]}
            {r.legendoppvariant && <span className="recent-variant"> · {r.legendoppvariant}</span>}
          </span>
          <span className="recent-format">{r.format}</span>
        </div>
        {notesOpen && r.notes && (
          <p className="log-notes" style={{ margin: '4px 0 0' }}>{r.notes}</p>
        )}
      </div>
      {r.notes && (
        <button
          className="notes-icon-btn"
          title={notesOpen ? 'Hide notes' : 'Show notes'}
          onClick={() => setNotesOpen(o => !o)}
        >
          📝
        </button>
      )}
      <span className={`log-badge ${resultClass(r.overallresult)}`}>{r.overallresult}</span>
      {isOwn && (
        <div className="result-actions">
          <button
            className="result-action-btn edit"
            title="Edit"
            onClick={() => onEdit({
              guid: r.guid,
              format_guid: r.format_guid ?? '',
              legenduser_guid: r.legenduser_guid ?? '',
              legendopp_guid: r.legendopp_guid ?? '',
              wentfirst: r.wentfirst,
              resultfirst: r.resultfirst ?? '',
              resultsecond: r.resultsecond ?? null,
              resultthird: r.resultthird ?? null,
              legenduservariant_guid: r.legenduservariant_guid ?? null,
              legendoppvariant_guid: r.legendoppvariant_guid ?? null,
              notes: r.notes ?? null,
              format: r.format,
              legenduser: r.legenduser,
              legendopp: r.legendopp,
              game1: r.game1,
              game2: r.game2,
              game3: r.game3,
            })}
          >✎</button>
          <button className="result-action-btn delete" title="Delete" onClick={() => onDelete(r.guid)}>✕</button>
        </div>
      )}
    </div>
  )
}

export default function ProfilePage() {
  const { userGuid } = useParams<{ userGuid: string }>()
  const dispatch = useDispatch<AppDispatch>()
  const { data, status, error, currentGuid } = useSelector((state: RootState) => state.profile)
  const currentUserGuid = useSelector((state: RootState) => state.user.guid)
  const currentUserRole = useSelector((state: RootState) => state.user.role)

  const [deletingResult, setDeletingResult] = useState<{ guid: string } | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)
  const [editingResult, setEditingResult] = useState<EditableResult | null>(null)

  useEffect(() => {
    if (userGuid && userGuid !== currentGuid) {
      dispatch(fetchProfile(userGuid))
    }
  }, [dispatch, userGuid, currentGuid])

  async function handleDelete() {
    if (!deletingResult || !currentUserGuid) return
    setIsDeleting(true)
    const res = await switchboard(
      'GameResult_Del',
      { GUID: deletingResult.guid, User_GUID: currentUserGuid },
      [currentUserRole ?? 'Player'],
    )
    setIsDeleting(false)
    if (res.Success) {
      dispatch(removeRecentResult(deletingResult.guid))
      setDeletingResult(null)
      toast.success('Result deleted')
    } else {
      setDeletingResult(null)
      toast.error('Could not delete result')
    }
  }

  return (
    <div>
      <Nav />
      <main style={{ padding: '40px 24px' }}>
        <div style={{ maxWidth: '760px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '16px' }}>

          {status === 'loading' && <p className="placeholder-text">Loading profile…</p>}
          {status === 'error' && <div className="status-msg error">{error}</div>}

          {status === 'success' && data && (
            <>
              <div className="card profile-header-card">
                <div className="profile-header-row">
                  <div>
                    <h1 className="profile-username">
                      {data.userinfo.username}
                      {data.userinfo.level === 'Pro' && <span className="pro-badge" style={{ marginLeft: 8 }}>Pro</span>}
                    </h1>
                    <p className="profile-since">Member since {memberSince(data.userinfo.createdon)}</p>
                  </div>
                  <span className={`admin-badge ${roleBadgeClass(data.userinfo.role)}`}>
                    {data.userinfo.role}
                  </span>
                </div>
              </div>

              <div className="card stats-bar">
                {[
                  { label: 'Games',    value: data.stats.totalgames },
                  { label: 'Win Rate', value: `${data.stats.winrate.toFixed(1)}%` },
                  { label: 'Wins',     value: data.stats.wins },
                  { label: 'Losses',   value: data.stats.losses },
                  { label: 'Draws',    value: data.stats.draws },
                ].map((s) => (
                  <div key={s.label} className="stat-item">
                    <span className="stat-value">{s.value}</span>
                    <span className="stat-label">{s.label}</span>
                  </div>
                ))}
              </div>

              {data.toplegends.length > 0 && (
                <>
                  <div className="card">
                    <h2 className="section-heading">Legend Performance</h2>
                    <p className="chart-subtitle">Win rate by legend (top {Math.min(data.toplegends.length, 8)})</p>
                    <ResponsiveContainer width="100%" height={Math.max(140, Math.min(data.toplegends.length, 8) * 44)}>
                      <BarChart
                        data={data.toplegends.slice(0, 8).map(l => ({
                          name: l.legend.split(',')[0],
                          wr: parseFloat(l.winrate.toFixed(1)),
                          games: l.totalgames,
                          wins: l.wins,
                          losses: l.losses,
                        }))}
                        layout="vertical"
                        margin={{ top: 4, right: 56, bottom: 4, left: 8 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" stroke="#21262d" horizontal={false} />
                        <XAxis
                          type="number"
                          domain={[0, 100]}
                          tickFormatter={v => `${v}%`}
                          tick={{ fill: '#8b949e', fontSize: 12 }}
                          axisLine={{ stroke: '#21262d' }}
                          tickLine={false}
                        />
                        <YAxis
                          type="category"
                          dataKey="name"
                          tick={{ fill: '#8b949e', fontSize: 12 }}
                          width={96}
                          axisLine={false}
                          tickLine={false}
                        />
                        <Tooltip
                          content={({ active, payload, label }) => {
                            if (!active || !payload?.length) return null
                            const d = payload[0].payload
                            return (
                              <div className="chart-tooltip">
                                <p className="chart-tooltip-label">{label}</p>
                                <p style={{ color: profileWrColor(d.wr), margin: '2px 0' }}>Win Rate: {d.wr}%</p>
                                <p style={{ color: '#8b949e', fontSize: 12, marginTop: 4 }}>{d.wins}W {d.losses}L · {d.games}g</p>
                              </div>
                            )
                          }}
                          cursor={{ fill: 'rgba(255,255,255,0.04)' }}
                        />
                        <ReferenceLine x={50} stroke="#484f58" strokeDasharray="4 4" />
                        <Bar dataKey="wr" name="Win Rate" radius={[0, 6, 6, 0]} maxBarSize={28}>
                          {data.toplegends.slice(0, 8).map((_, i) => (
                            <Cell key={i} fill={profileWrColor(parseFloat(_.winrate.toFixed(1)))} />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>

                  <div className="card">
                    <h2 className="section-heading">Top Legends</h2>
                    <div className="top-legends-grid">
                      {data.toplegends.slice(0, 5).map((l) => (
                        <LegendCard key={l.legend} l={l} />
                      ))}
                    </div>
                  </div>
                </>
              )}

              {data.recentresults.length > 0 && (
                <div className="card">
                  <h2 className="section-heading">Recent Results</h2>
                  <div className="recent-results-list">
                    {data.recentresults.slice(0, 10).map((r) => (
                      <RecentRow
                        key={r.guid}
                        r={r}
                        isOwn={userGuid === currentUserGuid || r.user_guid === currentUserGuid}
                        onEdit={setEditingResult}
                        onDelete={(guid) => setDeletingResult({ guid })}
                      />
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </main>

      {deletingResult && (
        <ConfirmDialog
          message="Are you sure you want to delete this result?"
          confirmLabel="Delete"
          loading={isDeleting}
          onConfirm={handleDelete}
          onCancel={() => setDeletingResult(null)}
        />
      )}

      {editingResult && (
        <EditResultModal
          result={editingResult}
          onClose={() => setEditingResult(null)}
          onSuccess={() => userGuid && dispatch(fetchProfile(userGuid))}
        />
      )}
    </div>
  )
}
