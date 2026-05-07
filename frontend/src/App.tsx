import { Route, Routes } from 'react-router-dom'
import AppShell from './AppShell'
import CreateNinjaProfilePage from './CreateNinjaProfilePage'
import DiscoverKasaPage from './DiscoverKasaPage'
import ExpeditionPage from './ExpeditionPage'
import HomePage from './HomePage'
import JsonExplorerPage from './JsonExplorerPage'
import KensaPage from './KensaPage'
import LexiconPage from './LexiconPage'
import TejunViewerPage from './TejunViewerPage'
import { JourneyProvider } from './journey/JourneyContext'
import JourneyPanel from './journey/JourneyPanel'
import { NoviceIdleProvider } from './novice/NoviceIdleContext'
import NoviceProgressPanel from './novice/NoviceProgressPanel'

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
            <Route path="/kensa" element={<KensaPage initialMode="enbu" />} />
            <Route path="/menkyo" element={<KensaPage initialMode="menkyo" />} />
            <Route path="/lexicon" element={<LexiconPage />} />
          </Route>
        </Routes>
        <JourneyPanel />
      </JourneyProvider>
      <NoviceProgressPanel />
    </NoviceIdleProvider>
  )
}
