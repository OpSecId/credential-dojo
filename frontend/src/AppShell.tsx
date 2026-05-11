import { useEffect, useId, useMemo, useState } from 'react'
import { Link, NavLink, Outlet, useLocation } from 'react-router-dom'
import './AppShell.css'
import { useNinjaProfileSnapshot } from './useNinjaProfileSnapshot'

const BRAND_MARK_SRC = `${import.meta.env.BASE_URL}favicon.svg?v=4`

function HomeLogoLink({
  className,
  onNavigate,
}: {
  className: string
  onNavigate?: () => void
}) {
  return (
    <Link
      to="/"
      className={className}
      title="Back home"
      aria-label="Home — Credential Dojo"
      onClick={onNavigate}
    >
      <img src={BRAND_MARK_SRC} alt="" width={28} height={27} decoding="async" className="app-shell__homeMarkImg" />
    </Link>
  )
}

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
            <ShellNavLink to="/issue" onPick={onPick}>
              Issue (Tehon の Menkyo)
            </ShellNavLink>
          </li>
          <li className="app-shell__navItem">
            <ShellNavLink to="/verify" onPick={onPick}>
              Verify (Menkyo の Kensa)
            </ShellNavLink>
          </li>
          <li className="app-shell__navItem">
            <ShellNavLink to="/issue-verify" onPick={onPick}>
              Issue &amp; verify
            </ShellNavLink>
          </li>
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
          <li className="app-shell__navItem">
            <ShellNavLink to="/kinchaku" onPick={onPick}>
              Kinchaku
            </ShellNavLink>
          </li>
          <li className="app-shell__navItem">
            <ShellNavLink to="/expedition" onPick={onPick}>
              Expedition
            </ShellNavLink>
          </li>
          <li className="app-shell__navItem">
            <ShellNavLink to="/tejun-viewer" onPick={onPick}>
              Tejun viewer
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
    </>
  )
}

export default function AppShell() {
  const profile = useNinjaProfileSnapshot()
  const location = useLocation()
  const [drawerOpen, setDrawerOpen] = useState(false)
  const drawerTitleId = useId()

  const pageTitle = useMemo(() => {
    const p = location.pathname
    if (p === '/') return 'Home'
    if (p.startsWith('/kensa')) return 'Kensa'
    if (p.startsWith('/verify') || p.startsWith('/menkyo')) return 'Menkyo の Kensa'
    if (p.startsWith('/issue-verify')) return 'Issue & verify'
    if (p.startsWith('/issue')) return 'Tehon の Menkyo · Issue'
    if (p.startsWith('/json-explorer')) return 'Shinbi'
    if (p.startsWith('/discover-kasa')) return 'Discover Kasa'
    if (p.startsWith('/kinchaku')) return 'Kinchaku'
    if (p.startsWith('/expedition')) return 'Expedition'
    if (p.startsWith('/tejun-viewer')) return 'Tejun viewer'
    if (p.startsWith('/lexicon')) return 'Lexicon'
    if (p.startsWith('/create-ninja-profile')) return 'Ninja profile'
    return 'Credential Dojo'
  }, [location.pathname])

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

  const closeDrawer = () => setDrawerOpen(false)
  const hasProfile = Boolean(profile)

  const railFootHint = hasProfile ? (
    <span>Use the profile menu (top right) to switch profiles, sign out, or edit.</span>
  ) : (
    <span>Open the profile menu (top right) to create a ninja profile or sign in.</span>
  )

  return (
    <div className={`app-shell app-shell--authed${hasProfile ? '' : ' app-shell--guest'}`}>
      <a className="app-shell__skip" href="#app-shell-main">
        Skip to content
      </a>

      <aside className="app-shell__rail" aria-label="Dojo navigation">
        <div className="app-shell__railInner">
          <Link to="/" className="app-shell__homeBrand" title="Back home" aria-label="Home — Credential Dojo">
            <span className="app-shell__homeBrand-mark" aria-hidden>
              <img src={BRAND_MARK_SRC} alt="" width={34} height={32} decoding="async" className="app-shell__homeMarkImg" />
            </span>
            <span className="app-shell__brand app-shell__homeBrand-text">
              Credential Dojo
              {hasProfile ? <span className="app-shell__brandSub">Signed in</span> : null}
            </span>
          </Link>
          <NavBlocks />
          <footer className="app-shell__railFoot">{railFootHint}</footer>
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
          <div className="app-shell__drawerTop">
            <HomeLogoLink className="app-shell__homeLogo" onNavigate={closeDrawer} />
            <button
              type="button"
              className="app-shell__drawerClose"
              onClick={closeDrawer}
              aria-label="Close menu"
            >
              ×
            </button>
          </div>
          <p id={drawerTitleId} className="app-shell__drawerHeading">
            Menu
          </p>
          <NavBlocks onPick={closeDrawer} />
          <footer className="app-shell__railFoot">{railFootHint}</footer>
        </div>
      </div>

      <div className="app-shell__main">
        <header className="app-shell__topbar">
          <HomeLogoLink className="app-shell__homeLogo" />
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
          <div className="app-shell__topbarTitle" title={pageTitle}>
            {pageTitle}
          </div>
          <nav className="app-shell__topbarActions" aria-label="Quick actions">
            <Link className="app-shell__topbarAction" to="/kensa" title="Kensa">
              検
            </Link>
            <Link className="app-shell__topbarAction" to="/json-explorer" title="Shinbi">
              審
            </Link>
            <Link className="app-shell__topbarAction" to="/lexicon" title="Lexicon">
              語
            </Link>
          </nav>
        </header>
        <div className="app-shell__mainInner" id="app-shell-main" tabIndex={-1}>
          <Outlet />
        </div>
      </div>
    </div>
  )
}
