import { useEffect } from 'react'
import { ClerkProvider, useAuth, useUser } from '@clerk/clerk-react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { Provider, useDispatch, useSelector } from 'react-redux'
import { store } from './app/store'
import type { AppDispatch, RootState } from './app/store'
import { syncUser, clearUser } from './features/user/userSlice'
import MatrixPage from './pages/MatrixPage'
import InputPage from './pages/InputPage'

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
          username:
            user.username ??
            user.firstName ??
            user.emailAddresses[0]?.emailAddress ??
            user.id,
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
  const { syncStatus, status, synced } = useSelector((state: RootState) => state.user)

  if (!isLoaded || (isSignedIn && !synced && syncStatus === 'loading')) {
    return <div className="sync-loading">Syncing account…</div>
  }

  if (!isSignedIn) return <Navigate to="/" replace />

  if (synced && status !== null && status !== 'Approved') {
    return (
      <div className="pending-screen">
        <div className="pending-card">
          <h2>Access Pending</h2>
          <p>Your account is awaiting approval. Please check back soon.</p>
        </div>
      </div>
    )
  }

  return <>{children}</>
}

function AppRoutes() {
  return (
    <BrowserRouter>
      <AuthSync />
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
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
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
