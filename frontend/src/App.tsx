import { useEffect, useState } from 'react'
import './App.css'

const SITE = 'https://credential.ninja'

type HelloPayload = {
  message: string
  site: string
  wallet?: string
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
          surface verifiers integrate with—plus{' '}
          <strong>Kinchaku</strong>, the Dojo&apos;s built-in wallet for holders.
        </p>
        <a className="dojo__link" href={SITE}>
          {SITE.replace(/^https?:\/\//, '')}
        </a>
      </header>

      <div className="dojo__panels">
        <section
          className="dojo__panel dojo__panel--kinchaku"
          aria-labelledby="kinchaku-heading"
        >
          <h2 id="kinchaku-heading" className="dojo__panelTitle">
            Kinchaku <span className="dojo__panelJa" lang="ja">巾着</span>
          </h2>
          <p className="dojo__panelBody">
            The platform wallet: carry credentials issued through the Dojo, keep
            them organized, and present them when proofs are requested—without
            leaving the CRMS story.
          </p>
        </section>

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
    </div>
  )
}

export default App
