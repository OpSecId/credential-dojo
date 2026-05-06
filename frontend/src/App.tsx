import { useEffect, useState } from 'react'
import './App.css'
import { productTerminology } from './terminology'

const SITE = 'https://credential.ninja'

type HelloPayload = {
  message: string
  site: string
  wallet?: string
  cryptosuitesMetaphor?: string
  standardsFocus?: string
  terminology?: typeof productTerminology
}

function App() {
  const [apiMessage, setApiMessage] = useState<string | null>(null)
  const [apiStandardsFocus, setApiStandardsFocus] = useState<string | null>(null)
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
        setApiStandardsFocus(data.standardsFocus ?? null)
        setApiError(null)
      })
      .catch(() => {
        setApiMessage(null)
        setApiStandardsFocus(null)
        setApiError('API unreachable. Run the backend (npm run dev -w backend).')
      })
  }, [])

  return (
    <div className="dojo">
      <header className="dojo__header">
        <p className="dojo__eyebrow">
          credential.ninja ·{' '}
          <abbr title="Credential Management & Registry System">CRMS</abbr>
          {' · '}
          <abbr title="World Wide Web Consortium">W3C</abbr> Verifiable Credentials
        </p>
        <h1 className="dojo__title">The Credential Dojo</h1>
        <p className="dojo__lede">
          Credential management platform centered on{' '}
          <strong>W3C Verifiable Credentials</strong>: credential definitions, proofs,
          issuance and revocation, tenant-aware operations, and verifier-facing
          APIs. Proof machinery follows <strong>Kata</strong>—named cryptosuites and
          proof suites. Holders use <strong>Kinchaku</strong>, the Dojo&apos;s
          built-in wallet.
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
            {productTerminology.wallet.name}{' '}
            <span className="dojo__panelJa" lang="ja">
              {productTerminology.wallet.glyph}
            </span>
          </h2>
          <p className="dojo__panelBody">
            The platform wallet: carry <strong>W3C Verifiable Credentials</strong>{' '}
            issued through the Dojo, keep them organized, and present them when
            proofs are requested—without leaving the CRMS story.
          </p>
        </section>

        <section
          className="dojo__panel dojo__panel--kata"
          aria-labelledby="kata-heading"
        >
          <h2 id="kata-heading" className="dojo__panelTitle">
            {productTerminology.cryptosuites.name}{' '}
            <span className="dojo__panelJa" lang="ja">
              {productTerminology.cryptosuites.glyph}
            </span>
          </h2>
          <p className="dojo__panelBody">
            The metaphor for <strong>cryptosuites</strong> (and related proof /
            signature suites): a fixed <em>kata</em>—the standardized pattern issuers
            and verifiers run when creating or checking proofs for W3C VCs.
          </p>
        </section>

        <section className="dojo__panel dojo__panel--api" aria-live="polite">
          <h2 className="dojo__panelTitle">Platform API</h2>
          {apiMessage ? (
            <>
              <p className="dojo__panelBody">{apiMessage}</p>
              {apiStandardsFocus ? (
                <p className="dojo__panelNote">{apiStandardsFocus}</p>
              ) : null}
            </>
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
