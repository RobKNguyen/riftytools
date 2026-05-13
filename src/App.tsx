import { useEffect } from 'react'
import { Toaster } from 'react-hot-toast'
import { ClerkProvider, useAuth, useUser } from '@clerk/clerk-react'
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom'
import { Provider, useDispatch, useSelector } from 'react-redux'
import { store } from './app/store'
import type { AppDispatch, RootState } from './app/store'
import { syncUser, clearUser } from './features/user/userSlice'
import MatrixPage from './pages/MatrixPage'
import InputPage from './pages/InputPage'
import AdminPage from './pages/AdminPage'
import LogPage from './pages/LogPage'
import ProfilePage from './pages/ProfilePage'
import AnalyticsPage from './pages/AnalyticsPage'

const PUBLISHABLE_KEY = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY as string

function AuthSync() {
  const { isSignedIn, isLoaded } = useAuth()
  const { user } = useUser()
  const dispatch = useDispatch<AppDispatch>()
  const synced = useSelector((state: RootState) => state.user.synced)

  useEffect(() => {
    if (!isLoaded) return
    if (isSignedIn && user && !synced) {
      dispatch(
        syncUser({
          clerkID: user.id,
          username: user.fullName ?? user.username ?? user.id,
          email: user.primaryEmailAddress?.emailAddress ?? '',
        }),
      )
    }
    if (!isSignedIn) {
      dispatch(clearUser())
    }
  }, [isSignedIn, isLoaded, user, synced, dispatch])

  return null
}

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isSignedIn, isLoaded } = useAuth()
  if (!isLoaded) return null
  if (!isSignedIn) return <Navigate to="/" replace />
  return <>{children}</>
}

function RoleRoute({ role, children }: { role: string; children: React.ReactNode }) {
  const { isSignedIn, isLoaded } = useAuth()
  const userRole = useSelector((state: RootState) => state.user.role)
  if (!isLoaded) return null
  if (!isSignedIn || userRole !== role) return <Navigate to="/" replace />
  return <>{children}</>
}

function ProfileRedirect() {
  const { isSignedIn, isLoaded } = useAuth()
  const guid = useSelector((state: RootState) => state.user.guid)
  if (!isLoaded) return null
  if (!isSignedIn || !guid) return <Navigate to="/" replace />
  return <Navigate to={`/profile/${guid}`} replace />
}

function AppContent() {
  const { isSignedIn, isLoaded } = useAuth()
  const { synced, status, syncStatus } = useSelector((state: RootState) => state.user)

  if (isLoaded && isSignedIn && !synced && syncStatus !== 'error') {
    return <div className="sync-loading">Syncing account…</div>
  }

  if (isLoaded && isSignedIn && synced && status !== 'Approved') {
    return (
      <div className="pending-screen">
        <div className="pending-card">
          <h2>Access Pending</h2>
          <p>
            Your account is pending approval. Please wait for an admin to approve you.
          </p>
        </div>
      </div>
    )
  }

  return (
    <HashRouter>
      <Routes>
        <Route path="/" element={<MatrixPage />} />
        <Route
          path="/input"
          element={
            <ProtectedRoute>
              <InputPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin"
          element={
            <RoleRoute role="Admin">
              <AdminPage />
            </RoleRoute>
          }
        />
        <Route
          path="/log"
          element={
            <ProtectedRoute>
              <LogPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/analytics"
          element={
            <ProtectedRoute>
              <AnalyticsPage />
            </ProtectedRoute>
          }
        />
        <Route path="/profile/me" element={<ProfileRedirect />} />
        <Route path="/profile/:userGuid" element={<ProfilePage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </HashRouter>
  )
}

function AppRoutes() {
  return (
    <>
      <AuthSync />
      <AppContent />
      <Toaster position="bottom-right" toastOptions={{ duration: 3000 }} />
    </>
  )
}

export default function App() {
  return (
    <ClerkProvider publishableKey={PUBLISHABLE_KEY}>
      <Provider store={store}>
        <AppRoutes />
      </Provider>
    </ClerkProvider>
  )
}
