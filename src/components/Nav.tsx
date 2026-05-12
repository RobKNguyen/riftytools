import { Link, useLocation } from 'react-router-dom'
import { SignInButton, SignedIn, SignedOut, UserButton } from '@clerk/clerk-react'

export default function Nav() {
  const { pathname } = useLocation()

  return (
    <nav className="nav">
      <Link to="/" className="nav-logo">
        Rifty<span>Elites</span>
      </Link>
      <div className="nav-links">
        <Link
          to="/"
          className={`nav-link${pathname === '/' ? ' active' : ''}`}
        >
          Matrix
        </Link>
        <SignedIn>
          <Link
            to="/input"
            className={`nav-link${pathname === '/input' ? ' active' : ''}`}
          >
            Submit
          </Link>
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
