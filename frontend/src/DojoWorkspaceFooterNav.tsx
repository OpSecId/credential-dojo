import { productTerminology } from './terminology'
import { useDojoWorkspace } from './DojoWorkspaceContext'
import './floatingWorkspaceNav.css'

function tabClass(isActive: boolean) {
  return `floatingWorkspaceNav__tab${isActive ? ' floatingWorkspaceNav__tab--active' : ''}`
}

/** Dojo issuance / Enbu tabs — rendered inside `AppShell` sticky footer on `/dojo`. */
export default function DojoWorkspaceFooterNav() {
  const { tool, setTool } = useDojoWorkspace()
  const tIssue = productTerminology.credentialFromTemplate
  const tEnbuKensa = productTerminology.presentationInspection

  return (
    <nav className="floatingWorkspaceNav floatingWorkspaceNav--inShellFoot" aria-label="Dojo workspace tools">
      <button
        type="button"
        className={tabClass(tool === 'issuance')}
        onClick={() => setTool('issuance')}
        title={`${tIssue.issueCredentialLabel} — Tehon into Menkyo (browser demo issuance)`}
      >
        <span className="floatingWorkspaceNav__tabJa" lang="ja">
          {tIssue.glyph}
        </span>
        <span className="floatingWorkspaceNav__tabEn">{tIssue.issueCredentialLabel}</span>
      </button>
      <button
        type="button"
        className={tabClass(tool === 'enbu')}
        onClick={() => setTool('enbu')}
        title={`${tEnbuKensa.name} — presentation-shaped JSON (heuristics only, no cryptographic verification)`}
      >
        <span className="floatingWorkspaceNav__tabJa" lang="ja">
          {tEnbuKensa.glyph}
        </span>
        <span className="floatingWorkspaceNav__tabEn">{tEnbuKensa.name}</span>
      </button>
    </nav>
  )
}
