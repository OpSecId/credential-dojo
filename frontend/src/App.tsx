import { Navigate, Route, Routes } from 'react-router-dom'
import './dojoZenPage.css'
import AppShell from './AppShell'
import CreateNinjaProfilePage from './CreateNinjaProfilePage'
import DiscoverKasaPage from './DiscoverKasaPage'
import ExpeditionPage from './ExpeditionPage'
import FaqPage from './FaqPage'
import HomePage from './HomePage'
import HomePlaygroundPage from './HomePlaygroundPage'
import DojoWorkspaceLayout from './DojoWorkspaceLayout'
import DojoIssuancePage from './DojoIssuancePage'
import JsonExplorerPage from './JsonExplorerPage'
import DojoKensaPage from './DojoKensaPage'
import KinchakuScanView from './KinchakuScanView'
import KinchakuWalletView from './KinchakuWalletView'
import KinchakuWorkflowsView from './KinchakuWorkflowsView'
import KinchakuWorkspaceLayout from './KinchakuWorkspaceLayout'
import KinchakuOid4vciPage from './KinchakuOid4vciPage'
import LexiconPage from './LexiconPage'
import TejunViewerPage from './TejunViewerPage'
import JourneyPage from './JourneyPage'
import TrialsPage from './TrialsPage'
import { JourneyProvider } from './journey/JourneyContext'
import { NoviceIdleProvider } from './novice/NoviceIdleContext'
import './dojoMotion.css'

export default function App() {
  return (
    <NoviceIdleProvider>
      <JourneyProvider>
        <Routes>
          <Route element={<AppShell />}>
            <Route path="/" element={<HomePage />} />
            <Route path="/test/home-playground" element={<HomePlaygroundPage />} />
            <Route path="/create-ninja-profile" element={<CreateNinjaProfilePage />} />
            <Route path="/discover-kasa" element={<DiscoverKasaPage />} />
            <Route path="/expedition" element={<ExpeditionPage />} />
            <Route path="/tejun-viewer" element={<TejunViewerPage />} />
            <Route path="/json-explorer" element={<JsonExplorerPage />} />
            <Route path="/issue" element={<Navigate to="/dojo" replace />} />
            <Route path="/dojo/issuance" element={<Navigate to="/dojo" replace />} />
            <Route
              path="/dojo/enbu"
              element={<Navigate to="/dojo" replace state={{ dojoTool: 'enbu' }} />}
            />
            <Route path="/dojo" element={<DojoWorkspaceLayout />} />
            <Route path="/verify" element={<DojoKensaPage initialMode="menkyo" />} />
            <Route path="/issue-verify" element={<DojoIssuancePage />} />
            <Route path="/kensa" element={<DojoKensaPage initialMode="enbu" />} />
            <Route path="/menkyo" element={<DojoKensaPage initialMode="menkyo" />} />
            <Route path="/kinchaku" element={<KinchakuWorkspaceLayout />}>
              <Route index element={<Navigate to="/kinchaku/wallet" replace />} />
              <Route path="workflows" element={<KinchakuWorkflowsView />} />
              <Route path="scan" element={<KinchakuScanView />} />
              <Route path="wallet" element={<KinchakuWalletView />} />
            </Route>
            <Route path="/kinchaku-oid4vci" element={<KinchakuOid4vciPage />} />
            <Route path="/lexicon" element={<LexiconPage />} />
            <Route path="/journey" element={<JourneyPage />} />
            <Route path="/trials" element={<TrialsPage />} />
            <Route path="/faq" element={<FaqPage />} />
          </Route>
        </Routes>
      </JourneyProvider>
    </NoviceIdleProvider>
  )
}
