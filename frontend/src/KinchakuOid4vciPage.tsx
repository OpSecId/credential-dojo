import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import './App.css'
import './KinchakuOid4vciPage.css'
import { debugLog } from './debugLog'
import { useDojoLandingTheme } from './DojoLandingThemeContext'
import { parseOid4vciCredentialOfferInput, type Oid4vciParseResult } from './oid4vci/parseOid4vciCredentialOfferUri'
import { SAMPLE_VERES_SANDBOX_CREDENTIAL_OFFER_URI } from './oid4vci/sampleCredentialOffers'
import { productTerminology } from './terminology'
import type { KinchakuOid4vciLocationState } from './kinchakuOid4vciNavState'
import { addWalletItem } from './walletInventory'

type Oid4vciClientStep = { id: string; ok: boolean; detail?: string; url?: string }

type Oid4vciClientOk = {
  ok: true
  steps: Oid4vciClientStep[]
  credentialOffer: unknown
  credentialIssuer: string
  issuerMetadata: unknown | null
  tokenResponse: unknown | null
  credentialResponse: unknown | null
}

type Oid4vciClientErr = {
  ok: false
  steps: Oid4vciClientStep[]
  error: string
  detail?: string
}

type Oid4vciClientResult = Oid4vciClientOk | Oid4vciClientErr

export default function KinchakuOid4vciPage() {
  const { theme } = useDojoLandingTheme()
  const location = useLocation()
  const navigate = useNavigate()
  const [input, setInput] = useState('')
  const [result, setResult] = useState<Oid4vciParseResult | null>(null)
  const [fetchError, setFetchError] = useState<string | null>(null)
  const [fetchLoading, setFetchLoading] = useState(false)
  const [fetchedJson, setFetchedJson] = useState<unknown | null>(null)
  const [clientResult, setClientResult] = useState<Oid4vciClientResult | null>(null)
  const [clientLoading, setClientLoading] = useState(false)
  const [clientHttpError, setClientHttpError] = useState<string | null>(null)

  const wallet = productTerminology.wallet

  useEffect(() => {
    const st = location.state as KinchakuOid4vciLocationState | null | undefined
    const raw = st?.prefilledOffer
    if (typeof raw !== 'string' || !raw.trim()) return
    const trimmed = raw.trim()
    setInput(trimmed)
    setFetchedJson(null)
    setFetchError(null)
    setClientResult(null)
    setClientHttpError(null)
    setResult(parseOid4vciCredentialOfferInput(trimmed))
    navigate(`${location.pathname}${location.search}${location.hash}`, { replace: true, state: null })
  }, [location.state, location.pathname, location.search, location.hash, navigate])

  const runParse = useCallback(() => {
    setFetchedJson(null)
    setFetchError(null)
    setClientResult(null)
    setClientHttpError(null)
    setResult(parseOid4vciCredentialOfferInput(input))
  }, [input])

  const loadVeresExample = useCallback(() => {
    setInput(SAMPLE_VERES_SANDBOX_CREDENTIAL_OFFER_URI)
    setFetchedJson(null)
    setFetchError(null)
    setClientResult(null)
    setClientHttpError(null)
    setResult(parseOid4vciCredentialOfferInput(SAMPLE_VERES_SANDBOX_CREDENTIAL_OFFER_URI))
  }, [])

  const offerUri = useMemo(() => {
    if (result?.kind !== 'success') return null
    return result.credentialOfferUri
  }, [result])

  const canFetchUri = Boolean(offerUri) && result?.kind === 'success' && !fetchLoading

  const runFetchUri = useCallback(async () => {
    if (!offerUri) return
    setFetchLoading(true)
    setFetchError(null)
    setFetchedJson(null)
    try {
      const res = await fetch(offerUri, {
        method: 'GET',
        headers: { Accept: 'application/json, */*' },
        mode: 'cors',
      })
      const text = await res.text()
      if (!res.ok) {
        setFetchError(`HTTP ${res.status} ${res.statusText}\n${text.slice(0, 800)}`)
        setFetchLoading(false)
        return
      }
      try {
        setFetchedJson(JSON.parse(text) as unknown)
      } catch {
        setFetchError('Response was not JSON. First bytes:\n' + text.slice(0, 600))
      }
    } catch (e) {
      setFetchError(
        e instanceof Error
          ? `${e.name}: ${e.message}\n\n(Common causes: CORS, mixed content, or offline.)`
          : String(e),
      )
    } finally {
      setFetchLoading(false)
    }
  }, [offerUri])

  const displayJson = useMemo(() => {
    if (fetchedJson !== null) return fetchedJson
    if (result?.kind === 'success' && result.credentialOfferJson !== null) return result.credentialOfferJson
    return null
  }, [fetchedJson, result])

  const processPayload = useMemo((): { credentialOfferUri?: string; credentialOffer?: unknown } | null => {
    if (fetchedJson !== null) return { credentialOffer: fetchedJson }
    if (result?.kind !== 'success') return null
    if (result.credentialOfferJson !== null) return { credentialOffer: result.credentialOfferJson }
    if (result.credentialOfferUri) return { credentialOfferUri: result.credentialOfferUri }
    return null
  }, [fetchedJson, result])

  const canRunClient = Boolean(processPayload) && !clientLoading

  const runOid4vciClient = useCallback(async () => {
    if (!processPayload) return
    setClientLoading(true)
    setClientResult(null)
    setClientHttpError(null)
    debugLog('process-offer: request', {
      keys: Object.keys(processPayload),
      hasUri: Boolean(processPayload.credentialOfferUri),
      hasInline: Boolean(processPayload.credentialOffer),
    })
    try {
      const base = import.meta.env.VITE_API_BASE ?? ''
      const res = await fetch(`${base}/api/oid4vci/process-offer`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify(processPayload),
      })
      const data = (await res.json()) as Oid4vciClientResult
      debugLog('process-offer: response', { status: res.ok, httpStatus: res.status, ok: data.ok, stepCount: data.steps?.length })
      if (!res.ok) {
        setClientHttpError(`HTTP ${res.status}\n${JSON.stringify(data, null, 2).slice(0, 1200)}`)
        debugLog('process-offer: HTTP error body', data)
        setClientLoading(false)
        return
      }
      setClientResult(data)
      if (data.ok === true && data.credentialResponse != null) {
        const text = JSON.stringify(data.credentialResponse, null, 2)
        addWalletItem({
          type: 'credential',
          title: 'OID4VCI · Issued credential',
          subtitle: 'Kinchaku OID4VCI client (demo proxy)',
          issuerOrSource: data.credentialIssuer,
          status: 'ready',
          tags: ['Menkyo', 'OID4VCI', 'Kinchaku'],
          preview: text.slice(0, 180),
          bodyJson: text,
        })
      }
    } catch (e) {
      debugLog('process-offer: fetch threw', e)
      setClientHttpError(e instanceof Error ? `${e.name}: ${e.message}` : String(e))
    } finally {
      setClientLoading(false)
    }
  }, [processPayload])

  return (
    <div className={`dojo-scene dojo-scene--${theme} dojo-scene--zen kinchaku-oid4vci`}>
      <div className="dojo-scene__moon" aria-hidden />
      <div className="dojo-scene__bg" aria-hidden />
      <div className="dojo-scene__grid" aria-hidden />
      <main className="dojoZenPage dojoZenPage--wide">
        <header className="dojoZenPage__header">
          <p className="dojoZenPage__eyebrow">Credential Dojo</p>
          <h1 className="dojoZenPage__title">
            {wallet.name} <span lang="ja">{wallet.glyph}</span> · OID4VCI offer
          </h1>
          <p className="dojoZenPage__intro">
            Paste an <strong>openid-credential-offer</strong> URI, an <strong>https</strong> URL that carries{' '}
            <code>credential_offer</code> or <code>credential_offer_uri</code>, or the raw{' '}
            <strong>credential offer JSON</strong>. <strong>Parse</strong> runs in the browser;{' '}
            <strong>Process offer (API)</strong> runs the OID4VCI demo client on the Dojo backend (same-origin{' '}
            <code>/api</code> in dev) so it can fetch metadata, exchange a <code>pre-authorized_code</code>, and request
            a credential without browser CORS limits. Issued credentials are appended to{' '}
            <Link to="/kinchaku">{wallet.name}</Link> when the credential endpoint returns JSON. Verbose browser logs:{' '}
            <code>localStorage.setItem('credential-dojo-debug','1')</code> then reload, or set <code>VITE_DEBUG=true</code>{' '}
            at build time.
          </p>
          <nav className="dojoZenPage__nav" aria-label="Navigation">
            <Link className="dojoZenPage__back" to="/">
              ← Home
            </Link>
            <Link className="dojoZenPage__back" to="/kinchaku">
              {wallet.name} inventory
            </Link>
          </nav>
        </header>

        <section className="kinchaku-oid4vci__panel" aria-labelledby="kinchaku-oid4vci-input-label">
          <label id="kinchaku-oid4vci-input-label" className="kinchaku-oid4vci__label" htmlFor="kinchaku-oid4vci-uri">
            OID4VCI URI or offer JSON
          </label>
          <textarea
            id="kinchaku-oid4vci-uri"
            className="kinchaku-oid4vci__textarea"
            value={input}
            onChange={(e) => {
              setInput(e.target.value)
              setResult(null)
              setFetchedJson(null)
              setFetchError(null)
              setClientResult(null)
              setClientHttpError(null)
            }}
            spellCheck={false}
            placeholder="openid-credential-offer://?credential_offer_uri=https%3A%2F%2F… or ?credential_offer={…}"
          />
          <div className="kinchaku-oid4vci__actions">
            <button type="button" className="kinchaku-oid4vci__btn kinchaku-oid4vci__btn--primary" onClick={runParse}>
              Parse
            </button>
            <button type="button" className="kinchaku-oid4vci__btn" onClick={loadVeresExample}>
              Load Veres sandbox example
            </button>
            <button
              type="button"
              className="kinchaku-oid4vci__btn"
              disabled={!canFetchUri || fetchLoading}
              onClick={() => void runFetchUri()}
            >
              {fetchLoading ? 'Fetching…' : 'Fetch offer JSON'}
            </button>
            <button
              type="button"
              className="kinchaku-oid4vci__btn kinchaku-oid4vci__btn--primary"
              disabled={!canRunClient}
              onClick={() => void runOid4vciClient()}
            >
              {clientLoading ? 'Processing…' : 'Process offer (API)'}
            </button>
          </div>
          <p className="kinchaku-oid4vci__apiHint">
            Requires the backend (<code>npm run dev -w backend</code> or deployed API). Demo only — no mTLS / DPoP /
            wallet-bound proofs.
          </p>
        </section>

        {result?.kind === 'error' ? (
          <section className="kinchaku-oid4vci__result" aria-live="polite">
            <h2 className="kinchaku-oid4vci__resultTitle">Could not parse</h2>
            <p className="kinchaku-oid4vci__error">{result.message}</p>
            {result.detail ? <p className="kinchaku-oid4vci__errorDetail">{result.detail}</p> : null}
          </section>
        ) : null}

        {result?.kind === 'success' ? (
          <section className="kinchaku-oid4vci__result" aria-live="polite">
            <h2 className="kinchaku-oid4vci__resultTitle">Parsed</h2>
            <p className="kinchaku-oid4vci__meta">
              Source: <code>{result.sourceScheme}</code>
              {result.queryParamKeys.length ? (
                <>
                  {' '}
                  · query keys: <code>{result.queryParamKeys.join(', ')}</code>
                </>
              ) : null}
            </p>
            {result.credentialOfferUri ? (
              <p className="kinchaku-oid4vci__uriRow">
                <strong>credential_offer_uri:</strong>{' '}
                <a href={result.credentialOfferUri} target="_blank" rel="noreferrer">
                  {result.credentialOfferUri}
                </a>
              </p>
            ) : null}
            {result.notes.length > 0 ? (
              <ul className="kinchaku-oid4vci__notes">
                {result.notes.map((n, i) => (
                  <li key={`${i}-${n}`}>{n}</li>
                ))}
              </ul>
            ) : null}
            {fetchError ? (
              <>
                <h3 className="kinchaku-oid4vci__fetchErrTitle">Fetch failed</h3>
                <pre className="kinchaku-oid4vci__pre kinchaku-oid4vci__pre--error">{fetchError}</pre>
              </>
            ) : null}
            {displayJson !== null ? (
              <>
                <h3 className="kinchaku-oid4vci__jsonTitle">
                  {fetchedJson !== null ? 'Fetched credential offer JSON' : 'Credential offer JSON'}
                </h3>
                <pre className="kinchaku-oid4vci__pre">{JSON.stringify(displayJson, null, 2)}</pre>
              </>
            ) : (
              <p className="kinchaku-oid4vci__meta kinchaku-oid4vci__meta--spaced">
                No inline <code>credential_offer</code> JSON yet. Use <strong>Fetch offer JSON</strong> if the issuer
                allows browser CORS, or <strong>Process offer (API)</strong> to fetch the offer on the server.
              </p>
            )}
          </section>
        ) : null}

        {clientHttpError ? (
          <section className="kinchaku-oid4vci__result kinchaku-oid4vci__result--client" aria-live="polite">
            <h2 className="kinchaku-oid4vci__resultTitle">API request failed</h2>
            <pre className="kinchaku-oid4vci__pre kinchaku-oid4vci__pre--error">{clientHttpError}</pre>
          </section>
        ) : null}

        {clientResult ? (
          <section className="kinchaku-oid4vci__result kinchaku-oid4vci__result--client" aria-live="polite">
            <h2 className="kinchaku-oid4vci__resultTitle">OID4VCI client</h2>
            {clientResult.ok === false ? (
              <>
                <p className="kinchaku-oid4vci__error">{clientResult.error}</p>
                {clientResult.detail ? <p className="kinchaku-oid4vci__errorDetail">{clientResult.detail}</p> : null}
              </>
            ) : null}
            <ol className="kinchaku-oid4vci__steps">
              {clientResult.steps.map((s) => (
                <li key={s.id} className={s.ok ? 'kinchaku-oid4vci__step--ok' : 'kinchaku-oid4vci__step--fail'}>
                  <span className="kinchaku-oid4vci__stepId">{s.id}</span>
                  {s.url ? (
                    <>
                      {' '}
                      <code className="kinchaku-oid4vci__stepUrl">{s.url}</code>
                    </>
                  ) : null}
                  {s.detail ? <span className="kinchaku-oid4vci__stepDetail"> — {s.detail}</span> : null}
                </li>
              ))}
            </ol>
            {clientResult.ok === true && clientResult.issuerMetadata != null ? (
              <>
                <h3 className="kinchaku-oid4vci__jsonTitle">Issuer metadata (excerpt)</h3>
                <pre className="kinchaku-oid4vci__pre kinchaku-oid4vci__pre--tall">
                  {JSON.stringify(clientResult.issuerMetadata, null, 2).slice(0, 8000)}
                  {JSON.stringify(clientResult.issuerMetadata, null, 2).length > 8000 ? '\n…' : ''}
                </pre>
              </>
            ) : null}
            {clientResult.ok === true && clientResult.tokenResponse != null ? (
              <>
                <h3 className="kinchaku-oid4vci__jsonTitle">Token response</h3>
                <pre className="kinchaku-oid4vci__pre">{JSON.stringify(clientResult.tokenResponse, null, 2)}</pre>
              </>
            ) : null}
            {clientResult.ok === true && clientResult.credentialResponse != null ? (
              <>
                <h3 className="kinchaku-oid4vci__jsonTitle">Credential response</h3>
                <pre className="kinchaku-oid4vci__pre kinchaku-oid4vci__pre--tall">
                  {JSON.stringify(clientResult.credentialResponse, null, 2)}
                </pre>
                <p className="kinchaku-oid4vci__meta kinchaku-oid4vci__meta--spaced">
                  Also saved to <Link to="/kinchaku">{wallet.name}</Link> inventory.
                </p>
              </>
            ) : null}
          </section>
        ) : null}
      </main>
    </div>
  )
}
