import { Outlet } from 'react-router-dom'
import { DojoFlowPageHero, DojoFlowPageShell } from './dojoFlowPage'
import { productTerminology } from './terminology'
import './floatingWorkspaceNav.css'
import './KinchakuPage.css'
import './KinchakuWorkspaceLayout.css'

const KINCHAKU_HUB_PATH = '/kinchaku/wallet'

export { KINCHAKU_HUB_PATH }

export default function KinchakuWorkspaceLayout() {
  const wallet = productTerminology.wallet
  const workflow = productTerminology.workflow

  return (
    <DojoFlowPageShell sceneExtraClass="kinchaku-page">
      <DojoFlowPageHero
        eyebrow="Kinchaku"
        title={
          <>
            {wallet.name} <span lang="ja">{wallet.glyph}</span>
          </>
        }
      >
        <p className="dojo-flowPage__intro">
          Stored <strong>Menkyo</strong>, active <strong>{workflow.name}</strong> flows, and QR intake for OID4VCI
          offers—switch lanes with the footer bar.
        </p>
      </DojoFlowPageHero>

      <div className="dojo-flowPage__body floatingWorkspaceNav__bodyPad kinchakuPage__body">
        <Outlet />
      </div>
    </DojoFlowPageShell>
  )
}
