import { Link, NavLink, Outlet, useLocation } from 'react-router-dom'
import './App.css'
import './AppShell.css'
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
            <ShellNavLink to="/kinchaku" onPick={onPick}>
              {productTerminology.wallet.name} (wallet)
            </ShellNavLink>
          </li>
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
              {productTerminology.credentialFromTemplate.issueCredentialLabel}
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
            <ShellNavLink to="/kinchaku-oid4vci" onPick={onPick}>
              Kinchaku · OID4VCI
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
  const hasProfile = Boolean(profile)

  const railFootHint = hasProfile ? (
    <span>Use the profile menu in the top bar to switch profiles, sign out, or edit.</span>
  ) : (
    <span>Open the profile menu in the top bar to create a ninja profile or sign in.</span>
  )

  return (
    <div className={`app-shell app-shell--authed${hasProfile ? '' : ' app-shell--guest'}`}>
      <a className="app-shell__skip" href="#app-shell-main">
        Skip to content
      </a>

      <header className="app-shell__topNav" aria-label="Site">
        <div className="app-shell__topNavLeft">
          <HomeLogoLink className="app-shell__homeLogo" />
          <Link
            to="/kinchaku"
            className="app-shell__walletPill"
            title={`${productTerminology.wallet.name} — stored Menkyo & artifacts`}
            aria-label={`Open ${productTerminology.wallet.name} wallet`}
          >
            <span className="app-shell__walletPillGlyph" lang="ja">
              {productTerminology.wallet.glyph}
            </span>
            <span className="app-shell__walletPillLabel">{productTerminology.wallet.name}</span>
          </Link>
        </div>
        <div className="app-shell__topNavRight">
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
        </div>
      </div>
    </div>
  )
}
