import { ClerkProvider, useAuth } from '@clerk/clerk-react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { Provider } from 'react-redux'
import { store } from './app/store'
import LandingPage from './pages/LandingPage'
import InputPage from './pages/InputPage'
import MatrixPage from './pages/MatrixPage'

const PUBLISHABLE_KEY = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY as string

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isSignedIn, isLoaded } = useAuth()
  if (!isLoaded) return null
  if (!isSignedIn) return <Navigate to="/" replace />
  return <>{children}</>
}

function AppRoutes() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route
          path="/input"
          element={
            <ProtectedRoute>
              <InputPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/matrix"
          element={
            <ProtectedRoute>
              <MatrixPage />
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
