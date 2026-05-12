import { Link, useLocation } from 'react-router-dom'
import { UserButton } from '@clerk/clerk-react'

export default function Nav() {
  const { pathname } = useLocation()

  return (
    <nav className="nav">
      <Link to="/" className="nav-logo">
        Rifty<span>Elites</span>
      </Link>
      <div className="nav-links">
        <Link
          to="/input"
          className={`nav-link${pathname === '/input' ? ' active' : ''}`}
        >
          Submit
        </Link>
        <Link
          to="/matrix"
          className={`nav-link${pathname === '/matrix' ? ' active' : ''}`}
        >
          Matrix
        </Link>
        <UserButton />
      </div>
    </nav>
  )
}
