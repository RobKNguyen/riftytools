import { SignInButton, SignedIn, SignedOut } from '@clerk/clerk-react'
import { Navigate } from 'react-router-dom'

export default function LandingPage() {
  return (
    <>
      <SignedIn>
        <Navigate to="/input" replace />
      </SignedIn>
      <SignedOut>
        <div className="landing">
          <span className="landing-badge">Riftbound Tracker</span>
          <h1 className="landing-title">
            Rifty<span className="highlight">Elites</span>
          </h1>
          <p className="landing-subtitle">
            Track competitive matchup results. Analyze the meta. Dominate the game.
          </p>
          <SignInButton mode="modal">
            <button className="landing-btn">Sign in with Google</button>
          </SignInButton>
        </div>
      </SignedOut>
    </>
  )
}
