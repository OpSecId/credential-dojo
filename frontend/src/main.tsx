import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import 'augmented-ui/augmented-ui.min.css'
import './index.css'
import App from './App.tsx'
import { DojoLandingThemeProvider } from './DojoLandingThemeContext'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <DojoLandingThemeProvider>
        <App />
      </DojoLandingThemeProvider>
    </BrowserRouter>
  </StrictMode>,
)
