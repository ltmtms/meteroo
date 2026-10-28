import { Link } from 'react-router-dom'
import { AppShell } from '../components/Layout'

export function HomePage() {
  return (
    <AppShell>
      <div className="home">
        <div className="home-hero">
          <h1>meteroo</h1>
          <p className="home-tagline">
            Warm, simple live polls for the classroom.
            <span lang="zh-HK"> 課室即時互動</span>
          </p>
        </div>
        <nav className="home-nav">
          <Link className="home-card" to="/admin">
            <span className="home-card-title">Presenter</span>
            <span className="home-card-desc">Create a session, build slides, control the show · 主持</span>
          </Link>
          <Link className="home-card" to="/start">
            <span className="home-card-title">Join</span>
            <span className="home-card-desc">Enter room code and respond · 參與</span>
          </Link>
          <Link className="home-card" to="/show">
            <span className="home-card-title">Display</span>
            <span className="home-card-desc">Fullscreen results for projector · 投影</span>
          </Link>
        </nav>
      </div>
    </AppShell>
  )
}
