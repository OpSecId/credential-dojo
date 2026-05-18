import { NavLink } from 'react-router-dom'
import { productTerminology } from './terminology'
import './floatingWorkspaceNav.css'

function tabClass(isActive: boolean) {
  return `floatingWorkspaceNav__tab${isActive ? ' floatingWorkspaceNav__tab--active' : ''}`
}

/** Kinchaku Workflows / Scan / Wallet tabs — rendered inside `AppShell` sticky footer on `/kinchaku` routes. */
export default function KinchakuWorkspaceFooterNav() {
  const wallet = productTerminology.wallet
  const workflow = productTerminology.workflow
  const credential = productTerminology.credential

  return (
    <nav
      className="floatingWorkspaceNav floatingWorkspaceNav--inShellFoot floatingWorkspaceNav--equalTabs"
      aria-label="Kinchaku workspace"
    >
      <NavLink
        to="/kinchaku/workflows"
        className={({ isActive }: { isActive: boolean }) => tabClass(isActive)}
        title={`Active ${workflow.name} flows and queued artifacts`}
      >
        <span className="floatingWorkspaceNav__tabJa" lang="ja">
          {workflow.glyph}
        </span>
        <span className="floatingWorkspaceNav__tabEn">Workflows</span>
      </NavLink>
      <NavLink
        to="/kinchaku/scan"
        className={({ isActive }: { isActive: boolean }) => tabClass(isActive)}
        title="Open camera to scan an OID4VCI credential-offer QR"
      >
        <span className="floatingWorkspaceNav__tabJa" lang="ja">
          QR
        </span>
        <span className="floatingWorkspaceNav__tabEn">Scan</span>
      </NavLink>
      <NavLink
        to="/kinchaku/wallet"
        className={({ isActive }: { isActive: boolean }) => tabClass(isActive)}
        title={`Stored ${credential.name} credentials`}
      >
        <span className="floatingWorkspaceNav__tabJa" lang="ja">
          {wallet.glyph}
        </span>
        <span className="floatingWorkspaceNav__tabEn">Wallet</span>
      </NavLink>
    </nav>
  )
}
