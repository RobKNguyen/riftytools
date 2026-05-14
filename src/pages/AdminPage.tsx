import { useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import toast from 'react-hot-toast'
import type { AppDispatch, RootState } from '../app/store'
import { fetchUsers, updateUserStatus, updateUserLevel } from '../features/admin/adminSlice'
import Nav from '../components/Nav'

function statusBadge(status: string) {
  const cls =
    status === 'Approved' ? 'badge-approved' : status === 'Rejected' ? 'badge-rejected' : 'badge-pending'
  return <span className={`admin-badge ${cls}`}>{status}</span>
}

export default function AdminPage() {
  const dispatch = useDispatch<AppDispatch>()
  const { users, fetchStatus, fetchError, updating } = useSelector(
    (state: RootState) => state.admin,
  )

  useEffect(() => {
    dispatch(fetchUsers())
  }, [dispatch])

  return (
    <div>
      <Nav />
      <main style={{ padding: '40px 24px' }}>
        <div className="card">
          <h1 className="page-title" style={{ marginBottom: '24px' }}>
            Admin <span>Panel</span>
          </h1>

          {fetchStatus === 'loading' && <p className="placeholder-text">Loading users…</p>}
          {fetchStatus === 'error' && <div className="status-msg error">{fetchError}</div>}

          {fetchStatus === 'success' && users.length === 0 && (
            <p className="placeholder-text">No users found.</p>
          )}

          {fetchStatus === 'success' && users.length > 0 && (
            <div style={{ overflowX: 'auto' }}>
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Username</th>
                    <th>Email</th>
                    <th>Status</th>
                    <th>Role</th>
                    <th>Level</th>
                    <th>Created</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((u) => (
                    <tr key={u.guid}>
                      <td>{u.username}</td>
                      <td className="admin-email">{u.email}</td>
                      <td>{statusBadge(u.status)}</td>
                      <td>{u.role}</td>
                      <td>
                        {u.level === 'Pro'
                          ? <span className="pro-badge">Pro</span>
                          : <span style={{ color: '#484f58', fontSize: 12 }}>Standard</span>}
                      </td>
                      <td className="admin-date">
                        {new Date(u.createdon).toLocaleDateString()}
                      </td>
                      <td>
                        <div className="admin-actions">
                          <button
                            className="admin-btn approve"
                            disabled={u.status === 'Approved' || !!updating[u.guid]}
                            onClick={() =>
                              dispatch(updateUserStatus({ guid: u.guid, status: 'Approved' }))
                                .unwrap()
                                .then(() => toast.success(`${u.username} approved`))
                                .catch(() => toast.error('Failed to update status'))
                            }
                          >
                            Approve
                          </button>
                          <button
                            className="admin-btn reject"
                            disabled={u.status === 'Rejected' || !!updating[u.guid]}
                            onClick={() =>
                              dispatch(updateUserStatus({ guid: u.guid, status: 'Rejected' }))
                                .unwrap()
                                .then(() => toast.success(`${u.username} rejected`))
                                .catch(() => toast.error('Failed to update status'))
                            }
                          >
                            Reject
                          </button>
                          {u.level === 'Pro' ? (
                            <button
                              className="admin-btn"
                              style={{ borderColor: 'rgba(245,158,11,0.3)', color: '#f59e0b', background: 'rgba(245,158,11,0.08)' }}
                              disabled={!!updating[u.guid]}
                              onClick={() =>
                                dispatch(updateUserLevel({ guid: u.guid, level: 'Standard' }))
                                  .unwrap()
                                  .then(() => toast.success(`${u.username} is now Standard`))
                                  .catch(() => toast.error('Failed to update level'))
                              }
                            >
                              Remove Pro
                            </button>
                          ) : (
                            <button
                              className="admin-btn"
                              style={{ borderColor: 'rgba(245,158,11,0.3)', color: '#f59e0b', background: 'rgba(245,158,11,0.08)' }}
                              disabled={!!updating[u.guid]}
                              onClick={() =>
                                dispatch(updateUserLevel({ guid: u.guid, level: 'Pro' }))
                                  .unwrap()
                                  .then(() => toast.success(`${u.username} is now Pro`))
                                  .catch(() => toast.error('Failed to update level'))
                              }
                            >
                              Make Pro
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
