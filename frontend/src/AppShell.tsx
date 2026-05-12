import { useEffect, useId, useState } from 'react'
import { Link, NavLink, Outlet, useLocation } from 'react-router-dom'
import './App.css'
import './AppShell.css'
import { DojoHubUiProvider } from './DojoHubUiContext'
import DojoLandingThemeLantern from './DojoLandingThemeLantern'
import DojoNavRankProgress from './DojoNavRankProgress'
import DojoProgressHub from './DojoProgressHub'
import NinjaProfileMenu from './NinjaProfileMenu'
import ZenSoundWidget from './zen/ZenSoundWidget'
import { useDojoLandingTheme } from './DojoLandingThemeContext'
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
              Tehon の Menkyo (Issue Credential)
            </ShellNavLink>
          </li>
          <li className="app-shell__navItem">
            <ShellNavLink to="/verify" onPick={onPick}>
              Menkyo の Kensa (Verify Credential)
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
  const { theme } = useDojoLandingTheme()
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

  const closeDrawer = () => setDrawerOpen(false)
  const hasProfile = Boolean(profile)
  const isHomePath = location.pathname === '/'

  const railFootHint = hasProfile ? (
    <span>Use the profile menu in the top bar to switch profiles, sign out, or edit.</span>
  ) : (
    <span>Open the profile menu in the top bar to create a ninja profile or sign in.</span>
  )

  return (
    <DojoHubUiProvider>
      <div className={`app-shell app-shell--authed${hasProfile ? '' : ' app-shell--guest'}`}>
        <a className="app-shell__skip" href="#app-shell-main">
          Skip to content
        </a>

        <header
          className="app-shell__topNav"
          aria-label="Site"
          data-dojo-theme={isHomePath ? theme : undefined}
        >
          <div className="app-shell__topNavLeft">
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
            <HomeLogoLink className="app-shell__homeLogo" />
            <DojoNavRankProgress />
          </div>
          <div className="app-shell__topNavRight">
            {isHomePath ? <DojoLandingThemeLantern /> : null}
            <NinjaProfileMenu />
          </div>
        </header>

        <div className="app-shell__bodyRow">
          <aside className="app-shell__rail" aria-label="Dojo navigation">
            <div className="app-shell__railInner">
              <NavBlocks />
              <footer className="app-shell__railFoot">{railFootHint}</footer>
            </div>
          </aside>

          <div className="app-shell__stage">
            <main className="app-shell__mainInner" id="app-shell-main" tabIndex={-1}>
              <Outlet />
            </main>
            <footer className="app-shell__appFooter" aria-label="Sound">
              <div className="app-shell__appFooterInner">
                <ZenSoundWidget />
              </div>
            </footer>
            <DojoProgressHub showFab={false} />
          </div>
        </div>

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
      </div>
    </DojoHubUiProvider>
  )
}
