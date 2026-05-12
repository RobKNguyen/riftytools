import { useEffect, useRef, useCallback } from 'react'
import { Link } from 'react-router-dom'
import { useDispatch, useSelector } from 'react-redux'
import type { AppDispatch, RootState } from '../app/store'
import { fetchGameResults, resetLog } from '../features/log/logSlice'
import type { GameResult } from '../features/log/logSlice'
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

function FeedItem({ item }: { item: GameResult }) {
  const score = gameScore(item)
  const legendName = (name: string) => name.split(',')[0]

  return (
    <div className="log-item">
      <div className="log-legends">
        <img src={item.legenduserimage} alt={item.legenduser} className="log-legend-img" />
        <img src={item.legendoppimage} alt={item.legendopp} className="log-legend-img log-legend-opp" />
      </div>
      <div className="log-content">
        <p className="log-headline">
          <Link to={`/profile/${item.user_guid}`} className="log-username">
            {item.username}
          </Link>
          {' '}
          <span className={`log-verb ${resultClass(item.overallresult)}`}>
            {resultVerb(item.overallresult)}
          </span>
          {' '}with{' '}
          <span className="log-legend-name">{legendName(item.legenduser)}</span>
          {' '}vs{' '}
          <span className="log-legend-name">{legendName(item.legendopp)}</span>
        </p>
        <p className="log-meta">
          {item.format}
          {score && ` • ${score}`}
          {' • '}
          {timeAgo(item.playedon)}
        </p>
      </div>
      <span className={`log-badge ${resultClass(item.overallresult)}`}>
        {item.overallresult}
      </span>
    </div>
  )
}

export default function LogPage() {
  const dispatch = useDispatch<AppDispatch>()
  const { items, status, error, hasMore, offset } = useSelector(
    (state: RootState) => state.log,
  )
  const sentinelRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    dispatch(resetLog())
    dispatch(fetchGameResults({ offset: 0 }))
  }, [dispatch])

  const loadMore = useCallback(() => {
    if (hasMore && status === 'success') {
      dispatch(fetchGameResults({ offset }))
    }
  }, [dispatch, hasMore, offset, status])

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

  return (
    <div>
      <Nav />
      <main style={{ padding: '40px 24px' }}>
        <div className="card" style={{ maxWidth: '720px', margin: '0 auto' }}>
          <h1 className="page-title" style={{ marginBottom: '24px' }}>
            Activity <span>Feed</span>
          </h1>

          {status === 'loading' && <p className="placeholder-text">Loading…</p>}
          {status === 'error' && <div className="status-msg error">{error}</div>}

          {items.length > 0 && (
            <div className="log-feed">
              {items.map((item) => (
                <FeedItem key={item.guid} item={item} />
              ))}
            </div>
          )}

          {status === 'success' && items.length === 0 && (
            <p className="placeholder-text">No results yet.</p>
          )}

          {status === 'loadingMore' && (
            <p className="placeholder-text" style={{ marginTop: '16px' }}>Loading more…</p>
          )}

          {status === 'success' && !hasMore && items.length > 0 && (
            <p className="placeholder-text" style={{ marginTop: '16px' }}>All caught up.</p>
          )}

          <div ref={sentinelRef} style={{ height: '1px' }} />
        </div>
      </main>
    </div>
  )
}
