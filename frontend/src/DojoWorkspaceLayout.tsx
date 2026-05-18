import { useDojoWorkspace } from './DojoWorkspaceContext'
import DojoIssuancePage from './DojoIssuancePage'
import DojoKensaPage from './DojoKensaPage'
import { DojoFlowPageShell } from './dojoFlowPage'
import './floatingWorkspaceNav.css'
import './DojoWorkspaceLayout.css'

export default function DojoWorkspaceLayout() {
  const { tool } = useDojoWorkspace()

  return (
    <DojoFlowPageShell sceneExtraClass="dojo-scene--dojoWorkspace">
      <div className="dojo-flowPage__body floatingWorkspaceNav__bodyPad dojo-flowPage__body--workspace">
        {tool === 'issuance' ? (
          <DojoIssuancePage mode="issue" embedded />
        ) : (
          <DojoKensaPage embedded enbuOnly initialMode="enbu" />
        )}
      </div>
    </DojoFlowPageShell>
  )
}
