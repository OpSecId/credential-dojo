import { useEffect, useRef, useState } from 'react'
import { Link, NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom'
import './App.css'
import './AppShell.css'
import DojoWorkspaceFooterNav from './DojoWorkspaceFooterNav'
import {
  DojoWorkspaceProvider,
  dojoToolFromLocationState,
  type DojoWorkspaceTool,
} from './DojoWorkspaceContext'
import KinchakuWorkspaceFooterNav from './KinchakuWorkspaceFooterNav'
import NinjaProfileMenu from './NinjaProfileMenu'
import { useNinjaProfileSnapshot } from './useNinjaProfileSnapshot'
import { productTerminology } from './terminology'

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
      aria-label="Home — Dojo"
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

      {/* Learn before the long tools list so FAQ / lexicon stay inside the short mobile rail viewport */}
      <section className="app-shell__section" aria-label="Reference">
        <p className="app-shell__sectionLabel">Learn</p>
        <ul className="app-shell__navList">
          <li className="app-shell__navItem">
            <ShellNavLink to="/journey" onPick={onPick}>
              Journey (learn)
            </ShellNavLink>
          </li>
          <li className="app-shell__navItem">
            <ShellNavLink to="/lexicon" onPick={onPick}>
              Full lexicon
            </ShellNavLink>
          </li>
          <li className="app-shell__navItem">
            <ShellNavLink to="/faq" onPick={onPick}>
              FAQ
            </ShellNavLink>
          </li>
        </ul>
      </section>

      <section className="app-shell__section" aria-label="Tools">
        <p className="app-shell__sectionLabel">Inspect &amp; explore</p>
        <ul className="app-shell__navList">
          <li className="app-shell__navItem">
            <ShellNavLink to="/dojo" onPick={onPick}>
              {productTerminology.credentialFromTemplate.issueCredentialLabel}
            </ShellNavLink>
          </li>
          <li className="app-shell__navItem">
            <ShellNavLink to="/issue-verify" onPick={onPick}>
              Issue &amp; verify
            </ShellNavLink>
          </li>
          <li className="app-shell__navItem">
            <ShellNavLink to="/trials" onPick={onPick}>
              Trials (conformance)
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
            <ShellNavLink to="/tejun-viewer" onPick={onPick}>
              Tejun viewer
            </ShellNavLink>
          </li>
        </ul>
      </section>
    </>
  )
}

function IconHome({ className }: { className?: string }) {
  return (
    <svg className={className} width={22} height={22} viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M4 10.5L12 4l8 6.5V20a1 1 0 0 1-1 1h-5v-6H10v6H5a1 1 0 0 1-1-1v-9.5Z"
        stroke="currentColor"
        strokeWidth={1.75}
        strokeLinejoin="round"
      />
    </svg>
  )
}

function IconIssue({ className }: { className?: string }) {
  return (
    <svg className={className} width={22} height={22} viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8l-6-6Z"
        stroke="currentColor"
        strokeWidth={1.75}
        strokeLinejoin="round"
      />
      <path d="M14 2v6h6M12 18v-6M9 15h6" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" />
    </svg>
  )
}

function IconNavMenu({ className }: { className?: string }) {
  return (
    <svg className={className} width={22} height={22} viewBox="0 0 24 24" fill="none" aria-hidden>
      <path d="M5 7h14M5 12h14M5 17h10" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" />
    </svg>
  )
}

function IconKinchakuBack({ className }: { className?: string }) {
  return (
    <svg className={className} width={22} height={22} viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M14.5 6.5 9 12l5.5 5.5"
        stroke="currentColor"
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

function isKinchakuPath(pathname: string): boolean {
  return (
    pathname === '/kinchaku' ||
    pathname.startsWith('/kinchaku/') ||
    pathname.startsWith('/kinchaku-')
  )
}

function isKinchakuWorkspacePath(pathname: string): boolean {
  return pathname === '/kinchaku' || pathname.startsWith('/kinchaku/')
}

const KINCHAKU_HUB_PATH = '/kinchaku/wallet'

function KinchakuFab() {
  const location = useLocation()
  const navigate = useNavigate()
  const wallet = productTerminology.wallet
  const onKinchaku = isKinchakuPath(location.pathname)
  const lastOutsideKinchakuRef = useRef('/')

  useEffect(() => {
    if (!onKinchaku) {
      lastOutsideKinchakuRef.current = `${location.pathname}${location.search}${location.hash}`
    }
  }, [location.pathname, location.search, location.hash, onKinchaku])

  const returnToKinchakuHub = onKinchaku && location.pathname !== KINCHAKU_HUB_PATH

  const handleClick = () => {
    if (!onKinchaku) {
      navigate(KINCHAKU_HUB_PATH)
      return
    }
    if (returnToKinchakuHub) {
      navigate(KINCHAKU_HUB_PATH)
      return
    }
    navigate(lastOutsideKinchakuRef.current || '/')
  }

  const returnTitle = returnToKinchakuHub
    ? `Back to ${wallet.name}`
    : 'Back to previous page'

  return (
    <button
      type="button"
      className={`app-shell__kinchakuFab app-shell__kinchakuFab--inFoot${
        onKinchaku ? ' app-shell__kinchakuFab--return' : ''
      }${onKinchaku ? ' app-shell__mobileTab--active' : ''}`}
      onClick={handleClick}
      title={onKinchaku ? returnTitle : `${wallet.name} — stored Menkyo & artifacts`}
      aria-label={onKinchaku ? returnTitle : `Open ${wallet.name} wallet`}
    >
      {onKinchaku ? (
        <IconKinchakuBack className="app-shell__kinchakuFabBack app-shell__mobileTabIcon" />
      ) : (
        <span className="app-shell__kinchakuFabGlyph app-shell__mobileTabIcon" lang="ja">
          {wallet.glyph}
        </span>
      )}
      <span className="app-shell__mobileTabLabel">{wallet.name}</span>
    </button>
  )
}

export default function AppShell() {
  const { pathname, state: locationState } = useLocation()
  const profile = useNinjaProfileSnapshot()
  const hasProfile = Boolean(profile)
  const railRef = useRef<HTMLElement>(null)
  const calmHome = pathname === '/'
  const dojoWorkspace =
    pathname === '/dojo' || pathname.startsWith('/dojo/')
  const kinchakuWorkspace = isKinchakuWorkspacePath(pathname)
  const workspaceFoot = dojoWorkspace || kinchakuWorkspace

  const [dojoTool, setDojoTool] = useState<DojoWorkspaceTool>(() => dojoToolFromLocationState(locationState))

  useEffect(() => {
    if (!dojoWorkspace) return
    if (dojoToolFromLocationState(locationState) === 'enbu') {
      setDojoTool('enbu')
    }
  }, [dojoWorkspace, locationState])

  const railFootHint = hasProfile ? (
    <span>Use the profile menu in the top bar to switch profiles, sign out, or edit.</span>
  ) : (
    <span>Open the profile menu in the top bar to create a ninja profile or sign in.</span>
  )

  const shell = (
    <div
      className={`app-shell app-shell--authed${hasProfile ? '' : ' app-shell--guest'}${calmHome ? ' app-shell--calmHome' : ''}${
        workspaceFoot ? ' app-shell--workspaceFoot' : ''
      }${dojoWorkspace ? ' app-shell--dojoWorkspace' : ''}${kinchakuWorkspace ? ' app-shell--kinchakuWorkspace' : ''}`}
    >
      <a className="app-shell__skip" href="#app-shell-main">
        Skip to content
      </a>

      <header className="app-shell__topNav" aria-label="Site">
        <div className="app-shell__topNavLeft">
          <HomeLogoLink className="app-shell__homeLogo" />
        </div>
        <div className="app-shell__topNavRight">
          <NinjaProfileMenu />
        </div>
      </header>

      <div className="app-shell__bodyRow">
        <aside ref={railRef} className="app-shell__rail" id="app-shell-rail" aria-label="Dojo navigation">
          <div className="app-shell__railInner">
            <NavBlocks />
            <footer className="app-shell__railFoot">{railFootHint}</footer>
          </div>
        </aside>

        <div className="app-shell__stage">
          <main className="app-shell__mainInner" id="app-shell-main" tabIndex={-1}>
            <Outlet />
          </main>
        </div>
      </div>

      <footer className="app-shell__stickyFoot">
        <nav
          className={`app-shell__mobileTabBar${
            workspaceFoot ? ' app-shell__mobileTabBar--workspaceFoot' : ''
          }`}
          aria-label={
            dojoWorkspace ? 'Dojo workspace' : kinchakuWorkspace ? 'Kinchaku workspace' : 'Quick actions'
          }
        >
          {dojoWorkspace ? (
            <>
              <div className="app-shell__footerWorkspace">
                <DojoWorkspaceFooterNav />
              </div>
              <KinchakuFab />
            </>
          ) : kinchakuWorkspace ? (
            <>
              <div className="app-shell__footerWorkspace">
                <KinchakuWorkspaceFooterNav />
              </div>
              <KinchakuFab />
            </>
          ) : (
            <>
              <NavLink
                to="/"
                end
                className={({ isActive }: { isActive: boolean }) =>
                  `app-shell__mobileTab${isActive ? ' app-shell__mobileTab--active' : ''}`
                }
              >
                <IconHome className="app-shell__mobileTabIcon" />
                <span className="app-shell__mobileTabLabel">Home</span>
              </NavLink>
              <NavLink
                to="/dojo"
                className={({ isActive }: { isActive: boolean }) =>
                  `app-shell__mobileTab${isActive ? ' app-shell__mobileTab--active' : ''}`
                }
              >
                <IconIssue className="app-shell__mobileTabIcon" />
                <span className="app-shell__mobileTabLabel">Issue</span>
              </NavLink>
              <button
                type="button"
                className="app-shell__mobileTab app-shell__mobileTab--button"
                onClick={() => railRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' })}
                aria-controls="app-shell-rail"
                aria-label="Scroll to site navigation"
              >
                <IconNavMenu className="app-shell__mobileTabIcon" />
                <span className="app-shell__mobileTabLabel">Nav</span>
              </button>
              <KinchakuFab />
            </>
          )}
        </nav>
      </footer>
    </div>
  )

  if (dojoWorkspace) {
    return (
      <DojoWorkspaceProvider tool={dojoTool} setTool={setDojoTool}>
        {shell}
      </DojoWorkspaceProvider>
    )
  }

  return shell
}
