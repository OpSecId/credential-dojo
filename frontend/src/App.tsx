import { Route, Routes } from 'react-router-dom'
import DiscoverKasaPage from './DiscoverKasaPage'
import HomePage from './HomePage'
import LexiconPage from './LexiconPage'

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="/discover-kasa" element={<DiscoverKasaPage />} />
      <Route path="/lexicon" element={<LexiconPage />} />
    </Routes>
  )
}
