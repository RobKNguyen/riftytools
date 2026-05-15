import { Link, useLocation } from 'react-router-dom'
import { SignInButton, SignedIn, SignedOut, UserButton } from '@clerk/clerk-react'
import { useSelector } from 'react-redux'
import type { RootState } from '../app/store'

const IconMatrix = () => (
  <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor">
    <path d="M3 3h7v7H3zm11 0h7v7h-7zM3 14h7v7H3zm11 0h7v7h-7z"/>
  </svg>
)
const IconFeed = () => (
  <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor">
    <path d="M4 6h16v2H4zm0 5h16v2H4zm0 5h16v2H4z"/>
  </svg>
)
const IconAnalytics = () => (
  <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor">
    <path d="M3 13h2v8H3zm4-5h2v13H7zm4-4h2v17h-2zm4 7h2v10h-2zm4-3h2v13h-2z"/>
  </svg>
)
const IconSubmit = () => (
  <svg viewBox="0 0 24 24" width="22" height="22" fill="currentColor">
    <path d="M11 11V5h2v6h6v2h-6v6h-2v-6H5v-2z"/>
  </svg>
)
const IconProfile = () => (
  <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor">
    <path d="M12 12c2.7 0 4.8-2.1 4.8-4.8S14.7 2.4 12 2.4 7.2 4.5 7.2 7.2 9.3 12 12 12zm0 2.4c-3.2 0-9.6 1.6-9.6 4.8v2.4h19.2v-2.4c0-3.2-6.4-4.8-9.6-4.8z"/>
  </svg>
)
const IconAdmin = () => (
  <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor">
    <path d="M12 2L3 7v5c0 5 3.8 9.7 9 10.9C17.2 21.7 21 17 21 12V7l-9-5zm-1 13l-3-3 1.4-1.4 1.6 1.6 4.6-4.6L17 9l-6 6z"/>
  </svg>
)

export default function Nav() {
  const { pathname } = useLocation()
  const role = useSelector((state: RootState) => state.user.role)

  return (
    <>
      <nav className="nav">
        <Link to="/" className="nav-logo">
          <img src="/riftyelite.ico" alt="RiftyElites" className="nav-logo-icon" />
          Rifty<span>Elites</span>
        </Link>
        <div className="nav-links">
          <Link to="/" className={`nav-link${pathname === '/' ? ' active' : ''}`}>Matrix</Link>
          <SignedIn>
            <Link to="/log" className={`nav-link${pathname === '/log' ? ' active' : ''}`}>Feed</Link>
            <Link to="/analytics" className={`nav-link${pathname === '/analytics' ? ' active' : ''}`}>Analytics</Link>
            <Link to="/input" className={`nav-link${pathname === '/input' ? ' active' : ''}`}>Submit</Link>
            <Link to="/profile/me" className={`nav-link${pathname.startsWith('/profile') ? ' active' : ''}`}>Profile</Link>
            {role === 'Admin' && (
              <Link to="/admin" className={`nav-link${pathname === '/admin' ? ' active' : ''}`}>Admin</Link>
            )}
            <UserButton />
          </SignedIn>
          <SignedOut>
            <SignInButton mode="modal">
              <button className="nav-sign-in">Sign In</button>
            </SignInButton>
          </SignedOut>
        </div>
      </nav>

      {/* Mobile bottom tab bar */}
      <SignedIn>
        <nav className="mobile-tabs">
          <Link to="/" className={`mobile-tab${pathname === '/' ? ' active' : ''}`}>
            <IconMatrix /><span>Matrix</span>
          </Link>
          <Link to="/log" className={`mobile-tab${pathname === '/log' ? ' active' : ''}`}>
            <IconFeed /><span>Feed</span>
          </Link>
          <Link to="/analytics" className={`mobile-tab${pathname === '/analytics' ? ' active' : ''}`}>
            <IconAnalytics /><span>Stats</span>
          </Link>
          <Link to="/input" className={`mobile-tab${pathname === '/input' ? ' active' : ''}`}>
            <IconSubmit /><span>Submit</span>
          </Link>
          <Link to="/profile/me" className={`mobile-tab${pathname.startsWith('/profile') ? ' active' : ''}`}>
            <IconProfile /><span>Profile</span>
          </Link>
          {role === 'Admin' && (
            <Link to="/admin" className={`mobile-tab${pathname === '/admin' ? ' active' : ''}`}>
              <IconAdmin /><span>Admin</span>
            </Link>
          )}
        </nav>
      </SignedIn>
      <SignedOut>
        <nav className="mobile-tabs">
          <Link to="/" className={`mobile-tab${pathname === '/' ? ' active' : ''}`}>
            <IconMatrix /><span>Matrix</span>
          </Link>
          <div className="mobile-tab">
            <SignInButton mode="modal">
              <button className="mobile-signin-btn">Sign In</button>
            </SignInButton>
          </div>
        </nav>
      </SignedOut>
    </>
  )
}
