import { Route, Routes } from 'react-router-dom'
import './dojoZenPage.css'
import AppShell from './AppShell'
import CreateNinjaProfilePage from './CreateNinjaProfilePage'
import DiscoverKasaPage from './DiscoverKasaPage'
import ExpeditionPage from './ExpeditionPage'
import HomePage from './HomePage'
import IssueVerifyPage from './IssueVerifyPage'
import JsonExplorerPage from './JsonExplorerPage'
import KensaPage from './KensaPage'
import KinchakuPage from './KinchakuPage'
import LexiconPage from './LexiconPage'
import TejunViewerPage from './TejunViewerPage'
import './dojoFloatingDock.css'
import DojoProgressHub from './DojoProgressHub'
import ZenSoundWidget from './zen/ZenSoundWidget'
import { JourneyProvider } from './journey/JourneyContext'
import { NoviceIdleProvider } from './novice/NoviceIdleContext'

export default function App() {
  return (
    <NoviceIdleProvider>
      <JourneyProvider>
        <Routes>
          <Route element={<AppShell />}>
            <Route path="/" element={<HomePage />} />
            <Route path="/create-ninja-profile" element={<CreateNinjaProfilePage />} />
            <Route path="/discover-kasa" element={<DiscoverKasaPage />} />
            <Route path="/expedition" element={<ExpeditionPage />} />
            <Route path="/tejun-viewer" element={<TejunViewerPage />} />
            <Route path="/json-explorer" element={<JsonExplorerPage />} />
            <Route path="/issue" element={<IssueVerifyPage mode="issue" />} />
            <Route path="/verify" element={<KensaPage initialMode="menkyo" />} />
            <Route path="/issue-verify" element={<IssueVerifyPage />} />
            <Route path="/kensa" element={<KensaPage initialMode="enbu" />} />
            <Route path="/menkyo" element={<KensaPage initialMode="menkyo" />} />
            <Route path="/kinchaku" element={<KinchakuPage />} />
            <Route path="/lexicon" element={<LexiconPage />} />
          </Route>
        </Routes>
        <div className="dojo-floating-dock" aria-label="Floating tools">
          <div className="dojo-floating-dock__west">
            <ZenSoundWidget />
          </div>
          <div className="dojo-floating-dock__east">
            <DojoProgressHub />
          </div>
        </div>
      </JourneyProvider>
    </NoviceIdleProvider>
  )
}
