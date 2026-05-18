import { Link } from 'react-router-dom'
import { DojoFlowPageHero, DojoFlowPageShell } from './dojoFlowPage'
import { productTerminology } from './terminology'
import './TrialsPage.css'

export default function TrialsPage() {
  const tMenkyo = productTerminology.credentialInspection
  const tEnbu = productTerminology.presentationInspection

  return (
    <DojoFlowPageShell>
      <DojoFlowPageHero
        title={
          <>
            Trials <span lang="ja">(試験)</span>
          </>
        }
      >
        <p className="dojo-flowPage__intro">
          <strong>Trials</strong> is the conformance lane: structural checks on VC- and VP-shaped JSON. Learn in the{' '}
          <strong>Journey</strong>, practice issuance in the <strong>Dojo</strong>, then use these tools to see
          whether payloads line up with the shapes you expect—still not a substitute for full cryptographic
          verification.
        </p>
      </DojoFlowPageHero>

      <div className="dojo-flowPage__body">
        <nav className="trialsHub" aria-label="Conformance tools">
          <Link className="trialsHub__card" to="/kensa">
            <span className="trialsHub__kicker">Inspect</span>
            <span className="trialsHub__title">Kensa</span>
            <span className="trialsHub__desc">
              Switch between {tEnbu.name} and {tMenkyo.name}—heuristic structure only.
            </span>
          </Link>
          <Link className="trialsHub__card" to="/verify">
            <span className="trialsHub__kicker">Credential</span>
            <span className="trialsHub__title">{tMenkyo.name}</span>
            <span className="trialsHub__desc">Menkyo-shaped JSON checks in a focused view.</span>
          </Link>
          <Link className="trialsHub__card" to="/dojo" state={{ dojoTool: 'enbu' }}>
            <span className="trialsHub__kicker">Workspace</span>
            <span className="trialsHub__title">{tEnbu.name}</span>
            <span className="trialsHub__desc">Presentation trial inside the Dojo shell.</span>
          </Link>
          <Link className="trialsHub__card" to="/issue-verify">
            <span className="trialsHub__kicker">Round-trip</span>
            <span className="trialsHub__title">Issue &amp; verify</span>
            <span className="trialsHub__desc">Mint a demo Menkyo, then run the verify path on the same page.</span>
          </Link>
        </nav>
      </div>
    </DojoFlowPageShell>
  )
}
