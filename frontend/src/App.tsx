import { useEffect, useState } from 'react'
import './App.css'

const SITE = 'https://credential.ninja'

type HelloPayload = {
  message: string
  site: string
}

function App() {
  const [apiMessage, setApiMessage] = useState<string | null>(null)
  const [apiError, setApiError] = useState<string | null>(null)

  useEffect(() => {
    const base = import.meta.env.VITE_API_BASE ?? ''
    fetch(`${base}/api/hello`)
      .then((res) => {
        if (!res.ok) throw new Error(`${res.status} ${res.statusText}`)
        return res.json() as Promise<HelloPayload>
      })
      .then((data) => {
        setApiMessage(data.message)
        setApiError(null)
      })
      .catch(() => {
        setApiMessage(null)
        setApiError('API unreachable. Run the backend (npm run dev -w backend).')
      })
  }, [])

  return (
    <div className="dojo">
      <header className="dojo__header">
        <p className="dojo__eyebrow">
          credential.ninja ·{' '}
          <abbr title="Credential Management & Registry System">CRMS</abbr>
        </p>
        <h1 className="dojo__title">The Credential Dojo</h1>
        <p className="dojo__lede">
          Credential management platform for verifiable credentials: templates and
          schemas, issuance and revocation, tenant-aware operations, and the API
          surface your wallets and verifiers integrate with.
        </p>
        <a className="dojo__link" href={SITE}>
          {SITE.replace(/^https?:\/\//, '')}
        </a>
      </header>

      <section className="dojo__panel" aria-live="polite">
        <h2 className="dojo__panelTitle">Platform API</h2>
        {apiMessage ? (
          <p className="dojo__panelBody">{apiMessage}</p>
        ) : apiError ? (
          <p className="dojo__panelBody dojo__panelBody--warn">{apiError}</p>
        ) : (
          <p className="dojo__panelBody muted">Loading…</p>
        )}
      </section>
    </div>
  )
}

export default App
