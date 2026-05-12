import { useEffect } from 'react'
import { useParams } from 'react-router-dom'
import { useDispatch, useSelector } from 'react-redux'
import type { AppDispatch, RootState } from '../app/store'
import { fetchProfile } from '../features/profile/profileSlice'
import type { TopLegend, RecentResult } from '../features/profile/profileSlice'
import Nav from '../components/Nav'

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

function RecentRow({ r }: { r: RecentResult }) {
  return (
    <div className="recent-item">
      <div className="recent-legends">
        <img src={r.legenduserimage} alt={r.legenduser} className="recent-legend-img" />
        <img src={r.legendoppimage} alt={r.legendopp} className="recent-legend-img recent-legend-opp" />
      </div>
      <div className="recent-info">
        <span className="recent-matchup">
          {r.legenduser.split(',')[0]} <span className="recent-vs">vs</span> {r.legendopp.split(',')[0]}
        </span>
        <span className="recent-format">{r.format}</span>
      </div>
      <span className={`log-badge ${resultClass(r.overallresult)}`}>{r.overallresult}</span>
    </div>
  )
}

export default function ProfilePage() {
  const { userGuid } = useParams<{ userGuid: string }>()
  const dispatch = useDispatch<AppDispatch>()
  const { data, status, error, currentGuid } = useSelector(
    (state: RootState) => state.profile,
  )

  useEffect(() => {
    if (userGuid && userGuid !== currentGuid) {
      dispatch(fetchProfile(userGuid))
    }
  }, [dispatch, userGuid, currentGuid])

  return (
    <div>
      <Nav />
      <main style={{ padding: '40px 24px' }}>
        <div style={{ maxWidth: '760px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '16px' }}>

          {status === 'loading' && <p className="placeholder-text">Loading profile…</p>}
          {status === 'error' && <div className="status-msg error">{error}</div>}

          {status === 'success' && data && (
            <>
              {/* Header */}
              <div className="card profile-header-card">
                <div className="profile-header-row">
                  <div>
                    <h1 className="profile-username">{data.userinfo.username}</h1>
                    <p className="profile-since">Member since {memberSince(data.userinfo.createdon)}</p>
                  </div>
                  <span className={`admin-badge ${roleBadgeClass(data.userinfo.role)}`}>
                    {data.userinfo.role}
                  </span>
                </div>
              </div>

              {/* Stats bar */}
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

              {/* Top Legends */}
              {data.toplegends.length > 0 && (
                <div className="card">
                  <h2 className="section-heading">Top Legends</h2>
                  <div className="top-legends-grid">
                    {data.toplegends.slice(0, 5).map((l) => (
                      <LegendCard key={l.legend} l={l} />
                    ))}
                  </div>
                </div>
              )}

              {/* Recent Results */}
              {data.recentresults.length > 0 && (
                <div className="card">
                  <h2 className="section-heading">Recent Results</h2>
                  <div className="recent-results-list">
                    {data.recentresults.slice(0, 10).map((r, i) => (
                      <RecentRow key={i} r={r} />
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </main>
    </div>
  )
}
