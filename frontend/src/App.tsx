import { Route, Routes } from 'react-router-dom'
import CreateNinjaProfilePage from './CreateNinjaProfilePage'
import DiscoverKasaPage from './DiscoverKasaPage'
import HomePage from './HomePage'
import JsonExplorerPage from './JsonExplorerPage'
import KensaPage from './KensaPage'
import LexiconPage from './LexiconPage'

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="/create-ninja-profile" element={<CreateNinjaProfilePage />} />
      <Route path="/discover-kasa" element={<DiscoverKasaPage />} />
      <Route path="/json-explorer" element={<JsonExplorerPage />} />
      <Route path="/kensa" element={<KensaPage />} />
      <Route path="/lexicon" element={<LexiconPage />} />
    </Routes>
  )
}
