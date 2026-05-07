import { useEffect, useId, useState } from 'react'
import { Link, NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom'
import './AppShell.css'
import { clearNinjaProfile } from './ninjaProfileStorage'
import { useNinjaProfileSnapshot } from './useNinjaProfileSnapshot'

function ShellNavLink({
  to,
  end,
  children,
  onPick,
}: {
  to: string
  end?: boolean
  children: React.ReactNode
  onPick?: () => void
}) {
  const loc = useLocation()
  if (to.includes('#')) {
    const [pathPart, frag] = to.split('#')
    const basePath = pathPart || '/'
    const wantHash = `#${frag}`
    const active = loc.pathname === basePath && loc.hash === wantHash
    return (
      <Link
        to={to}
        onClick={onPick}
        className={`app-shell__navLink${active ? ' app-shell__navLink--active' : ''}`}
      >
        {children}
      </Link>
    )
  }
  return (
    <NavLink
      to={to}
      end={end}
      onClick={onPick}
      className={({ isActive }: { isActive: boolean }) =>
        `app-shell__navLink${isActive ? ' app-shell__navLink--active' : ''}`
      }
    >
      {children}
    </NavLink>
  )
}

function NavBlocks({ onPick }: { onPick?: () => void }) {
  const navigate = useNavigate()

  const handleClearProfile = () => {
    const ok = window.confirm(
      'Remove your ninja profile from this browser? This cannot be undone here.',
    )
    if (!ok) return
    clearNinjaProfile()
    onPick?.()
    navigate('/')
  }

  return (
    <>
      <section className="app-shell__section" aria-label="Dojo home">
        <p className="app-shell__sectionLabel">Dojo</p>
        <ul className="app-shell__navList">
          <li className="app-shell__navItem">
            <ShellNavLink to="/" end onPick={onPick}>
              Home
            </ShellNavLink>
          </li>
          <li className="app-shell__navItem">
            <ShellNavLink to="/#dojo-playground" onPick={onPick}>
              Playground
            </ShellNavLink>
          </li>
          <li className="app-shell__navItem">
            <ShellNavLink to="/#dojo-lexicon" onPick={onPick}>
              Lexicon strip
            </ShellNavLink>
          </li>
        </ul>
      </section>

      <section className="app-shell__section" aria-label="Tools">
        <p className="app-shell__sectionLabel">Inspect &amp; explore</p>
        <ul className="app-shell__navList">
          <li className="app-shell__navItem">
            <ShellNavLink to="/kensa" onPick={onPick}>
              Kensa
            </ShellNavLink>
          </li>
          <li className="app-shell__navItem">
            <ShellNavLink to="/json-explorer" onPick={onPick}>
              Shinbi (JSON)
            </ShellNavLink>
          </li>
          <li className="app-shell__navItem">
            <ShellNavLink to="/discover-kasa" onPick={onPick}>
              Discover Kasa
            </ShellNavLink>
          </li>
        </ul>
      </section>

      <section className="app-shell__section" aria-label="Reference">
        <p className="app-shell__sectionLabel">Learn</p>
        <ul className="app-shell__navList">
          <li className="app-shell__navItem">
            <ShellNavLink to="/lexicon" onPick={onPick}>
              Full lexicon
            </ShellNavLink>
          </li>
        </ul>
      </section>

      <section className="app-shell__section" aria-label="Account">
        <p className="app-shell__sectionLabel">You</p>
        <ul className="app-shell__navList">
          <li className="app-shell__navItem">
            <ShellNavLink to="/create-ninja-profile" onPick={onPick}>
              Ninja profile
            </ShellNavLink>
          </li>
          <li className="app-shell__navItem">
            <button
              type="button"
              className="app-shell__navBtn app-shell__navBtn--danger"
              onClick={handleClearProfile}
            >
              Clear profile
            </button>
          </li>
        </ul>
      </section>
    </>
  )
}

export default function AppShell() {
  const profile = useNinjaProfileSnapshot()
  const location = useLocation()
  const [drawerOpen, setDrawerOpen] = useState(false)
  const drawerTitleId = useId()

  useEffect(() => {
    setDrawerOpen(false)
  }, [location.pathname, location.hash])

  useEffect(() => {
    if (!drawerOpen) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setDrawerOpen(false)
    }
    window.addEventListener('keydown', onKey)
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      window.removeEventListener('keydown', onKey)
      document.body.style.overflow = prev
    }
  }, [drawerOpen])

  if (!profile) {
    return <Outlet />
  }

  const closeDrawer = () => setDrawerOpen(false)

  return (
    <div className="app-shell app-shell--authed">
      <a className="app-shell__skip" href="#app-shell-main">
        Skip to content
      </a>

      <aside className="app-shell__rail" aria-label="Dojo navigation">
        <div className="app-shell__railInner">
          <p className="app-shell__brand">
            Credential Dojo
            <span className="app-shell__brandSub">Signed in</span>
          </p>
          <NavBlocks />
          <footer className="app-shell__railFoot">
            <strong>{profile.codename}</strong>
            <span>Ninja profile · browser only</span>
          </footer>
        </div>
      </aside>

      <div
        className={`app-shell__backdrop${drawerOpen ? ' app-shell__backdrop--open' : ''}`}
        aria-hidden={!drawerOpen}
        onClick={closeDrawer}
      />

      <div
        id="app-shell-drawer-panel"
        className={`app-shell__drawer${drawerOpen ? ' app-shell__drawer--open' : ''}`}
        role="dialog"
        aria-modal="true"
        aria-labelledby={drawerTitleId}
        aria-hidden={!drawerOpen}
      >
        <div className="app-shell__drawerInner">
          <button
            type="button"
            className="app-shell__drawerClose"
            onClick={closeDrawer}
            aria-label="Close menu"
          >
            ×
          </button>
          <p id={drawerTitleId} className="app-shell__brand">
            Menu
            <span className="app-shell__brandSub">Credential Dojo</span>
          </p>
          <NavBlocks onPick={closeDrawer} />
          <footer className="app-shell__railFoot">
            <strong>{profile.codename}</strong>
            <span>Ninja profile · browser only</span>
          </footer>
        </div>
      </div>

      <div className="app-shell__main">
        <header className="app-shell__topbar">
          <button
            type="button"
            className="app-shell__menuBtn"
            aria-expanded={drawerOpen}
            aria-controls="app-shell-drawer-panel"
            onClick={() => setDrawerOpen((o) => !o)}
            aria-label={drawerOpen ? 'Close menu' : 'Open menu'}
          >
            <span aria-hidden>☰</span>
          </button>
          <div className="app-shell__topbarTitle">Credential Dojo</div>
          <div className="app-shell__topbarMeta" title={profile.codename}>
            {profile.codename}
          </div>
        </header>
        <div className="app-shell__mainInner" id="app-shell-main" tabIndex={-1}>
          <Outlet />
        </div>
      </div>
    </div>
  )
}
