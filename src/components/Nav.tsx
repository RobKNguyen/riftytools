import { Link, useLocation } from 'react-router-dom'
import { SignInButton, SignedIn, SignedOut, UserButton } from '@clerk/clerk-react'
import { useSelector } from 'react-redux'
import type { RootState } from '../app/store'

export default function Nav() {
  const { pathname } = useLocation()
  const role = useSelector((state: RootState) => state.user.role)

  return (
    <nav className="nav">
      <Link to="/" className="nav-logo">
        Rifty<span>Elites</span>
      </Link>
      <div className="nav-links">
        <Link to="/" className={`nav-link${pathname === '/' ? ' active' : ''}`}>
          Matrix
        </Link>
        <Link to="/log" className={`nav-link${pathname === '/log' ? ' active' : ''}`}>
          Log
        </Link>
        <Link to="/analytics" className={`nav-link${pathname === '/analytics' ? ' active' : ''}`}>
          Analytics
        </Link>
        <SignedIn>
          <Link
            to="/input"
            className={`nav-link${pathname === '/input' ? ' active' : ''}`}
          >
            Submit
          </Link>
          <Link to="/profile/me" className={`nav-link${pathname.startsWith('/profile') ? ' active' : ''}`}>
            Profile
          </Link>
          {role === 'Admin' && (
            <Link
              to="/admin"
              className={`nav-link${pathname === '/admin' ? ' active' : ''}`}
            >
              Admin
            </Link>
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
  )
}
