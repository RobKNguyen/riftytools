import { useEffect, useRef, useCallback, useState } from 'react'
import { Link } from 'react-router-dom'
import { useDispatch, useSelector } from 'react-redux'
import toast from 'react-hot-toast'
import type { AppDispatch, RootState } from '../app/store'
import { fetchGameResults, removeResult, setFilter } from '../features/log/logSlice'
import type { GameResult } from '../features/log/logSlice'
import { fetchUsers } from '../features/users/usersSlice'
import { switchboard } from '../services/switchboard'
import ConfirmDialog from '../components/ConfirmDialog'
import EditResultModal from '../components/EditResultModal'
import type { EditableResult } from '../components/EditResultModal'
import Nav from '../components/Nav'

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'just now'
  if (mins < 60) return `${mins}m ago`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(hours / 24)
  if (days < 7) return `${days}d ago`
  return new Date(dateStr).toLocaleDateString()
}

function gameScore(item: GameResult): string {
  const games = [item.game1, item.game2, item.game3].filter(Boolean) as string[]
  if (games.length <= 1) return ''
  const wins = games.filter((g) => g === 'Win').length
  const losses = games.filter((g) => g === 'Loss').length
  return `${wins}-${losses}`
}

function resultClass(result: string): string {
  if (result === 'Win') return 'result-win'
  if (result === 'Loss') return 'result-loss'
  return 'result-draw'
}

function resultVerb(result: string): string {
  if (result === 'Win') return 'won'
  if (result === 'Loss') return 'lost'
  return 'drew'
}

function FeedItem({
  item,
  isOwn,
  onEdit,
  onDelete,
}: {
  item: GameResult
  isOwn: boolean
  onEdit: (r: EditableResult) => void
  onDelete: (guid: string) => void
}) {
  const score = gameScore(item)
  const legend = (name: string) => name.split(',')[0]

  return (
    <div className="log-item">
      <div className="log-legends">
        <img src={item.legenduserimage} alt={item.legenduser} className="log-legend-img" />
        <img src={item.legendoppimage} alt={item.legendopp} className="log-legend-img log-legend-opp" />
      </div>
      <div className="log-content">
        <p className="log-headline">
          <Link to={`/profile/${item.user_guid}`} className="log-username">{item.username}</Link>
          {' '}
          <span className={`log-verb ${resultClass(item.overallresult)}`}>{resultVerb(item.overallresult)}</span>
          {' '}with <span className="log-legend-name">{legend(item.legenduser)}</span>
          {' '}vs <span className="log-legend-name">{legend(item.legendopp)}</span>
        </p>
        <p className="log-meta">
          {item.oppusername && item.oppuser_guid && (
            <>vs <Link to={`/profile/${item.oppuser_guid}`} className="log-opp-link">{item.oppusername}</Link> • </>
          )}
          {item.format}{score && ` • ${score}`} • {timeAgo(item.playedon)}
        </p>
      </div>
      <span className={`log-badge ${resultClass(item.overallresult)}`}>{item.overallresult}</span>
      {isOwn && (
        <div className="result-actions">
          <button
            className="result-action-btn edit"
            title="Edit"
            onClick={() => onEdit({
              guid: item.guid,
              format_guid: item.format_guid ?? '',
              legenduser_guid: item.legenduser_guid ?? '',
              legendopp_guid: item.legendopp_guid ?? '',
              wentfirst: item.wentfirst,
              resultfirst: item.resultfirst ?? '',
              resultsecond: item.resultsecond ?? null,
              resultthird: item.resultthird ?? null,
              format: item.format,
              legenduser: item.legenduser,
              legendopp: item.legendopp,
              game1: item.game1,
              game2: item.game2,
              game3: item.game3,
            })}
          >✎</button>
          <button className="result-action-btn delete" title="Delete" onClick={() => onDelete(item.guid)}>✕</button>
        </div>
      )}
    </div>
  )
}

export default function LogPage() {
  const dispatch = useDispatch<AppDispatch>()
  const { items, status, error, hasMore, offset, userGuidFilter, myGames } = useSelector(
    (state: RootState) => state.log,
  )
  const { data: users, status: usersStatus } = useSelector((state: RootState) => state.users)
  const currentUserGuid = useSelector((state: RootState) => state.user.guid)
  const currentUserRole = useSelector((state: RootState) => state.user.role)
  const sentinelRef = useRef<HTMLDivElement>(null)

  const [deletingGuid, setDeletingGuid] = useState<string | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)
  const [editingResult, setEditingResult] = useState<EditableResult | null>(null)

  useEffect(() => {
    dispatch(fetchGameResults({ offset: 0, userGuidFilter }))
  }, [dispatch]) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (usersStatus === 'idle') dispatch(fetchUsers())
  }, [dispatch, usersStatus])

  function applyFilter(guid: string | null, isMyGames: boolean) {
    dispatch(setFilter({ userGuidFilter: guid, myGames: isMyGames }))
    dispatch(fetchGameResults({ offset: 0, userGuidFilter: guid }))
  }

  const loadMore = useCallback(() => {
    if (hasMore && status === 'success') {
      dispatch(fetchGameResults({ offset, userGuidFilter }))
    }
  }, [dispatch, hasMore, offset, status, userGuidFilter])

  useEffect(() => {
    const sentinel = sentinelRef.current
    if (!sentinel) return
    const observer = new IntersectionObserver(
      (entries) => { if (entries[0].isIntersecting) loadMore() },
      { threshold: 0.1 },
    )
    observer.observe(sentinel)
    return () => observer.disconnect()
  }, [loadMore])

  async function handleDelete() {
    if (!deletingGuid || !currentUserGuid) return
    setIsDeleting(true)
    const data = await switchboard(
      'GameResult_Del',
      { GUID: deletingGuid, User_GUID: currentUserGuid },
      [currentUserRole ?? 'Player'],
    )
    setIsDeleting(false)
    setDeletingGuid(null)
    if (data.Success) {
      dispatch(removeResult(deletingGuid))
      toast.success('Result deleted')
    } else {
      toast.error('Could not delete result')
    }
  }

  const approvedUsers = users.filter((u) => u.status === 'Approved')

  return (
    <div>
      <Nav />
      <main style={{ padding: '40px 24px' }}>
        <div className="card" style={{ maxWidth: '720px', margin: '0 auto' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px', marginBottom: '20px' }}>
            <h1 className="page-title" style={{ marginBottom: 0 }}>Activity <span>Feed</span></h1>
            <div className="log-filters">
              {currentUserGuid && (
                <button
                  className={`matrix-sort-btn${myGames ? ' active' : ''}`}
                  onClick={() => myGames ? applyFilter(null, false) : applyFilter(currentUserGuid, true)}
                >
                  My Games
                </button>
              )}
              <select
                className="form-select"
                style={{ width: 'auto', minWidth: '150px', padding: '6px 12px', fontSize: '13px' }}
                value={userGuidFilter ?? ''}
                onChange={(e) => {
                  const guid = e.target.value || null
                  applyFilter(guid, guid === currentUserGuid)
                }}
              >
                <option value="">All Players</option>
                {approvedUsers.map((u) => (
                  <option key={u.guid} value={u.guid}>{u.username}</option>
                ))}
              </select>
            </div>
          </div>

          {status === 'loading' && <p className="placeholder-text">Loading…</p>}
          {status === 'error' && <div className="status-msg error">{error}</div>}

          {items.length > 0 && (
            <div className="log-feed">
              {items.map((item) => (
                <FeedItem
                  key={item.guid}
                  item={item}
                  isOwn={item.user_guid === currentUserGuid}
                  onEdit={setEditingResult}
                  onDelete={setDeletingGuid}
                />
              ))}
            </div>
          )}

          {status === 'success' && items.length === 0 && <p className="placeholder-text">No results found.</p>}
          {status === 'loadingMore' && <p className="placeholder-text" style={{ marginTop: '16px' }}>Loading more…</p>}
          {status === 'success' && !hasMore && items.length > 0 && (
            <p className="placeholder-text" style={{ marginTop: '16px' }}>All caught up.</p>
          )}

          <div ref={sentinelRef} style={{ height: '1px' }} />
        </div>
      </main>

      {deletingGuid && (
        <ConfirmDialog
          message="Are you sure you want to delete this result?"
          confirmLabel="Delete"
          loading={isDeleting}
          onConfirm={handleDelete}
          onCancel={() => setDeletingGuid(null)}
        />
      )}

      {editingResult && (
        <EditResultModal
          result={editingResult}
          onClose={() => setEditingResult(null)}
          onSuccess={() => dispatch(fetchGameResults({ offset: 0, userGuidFilter }))}
        />
      )}
    </div>
  )
}
