import { useCallback, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import './App.css'
import './KinchakuOid4vciPage.css'
import { useDojoLandingTheme } from './DojoLandingThemeContext'
import { parseOid4vciCredentialOfferInput, type Oid4vciParseResult } from './oid4vci/parseOid4vciCredentialOfferUri'
import { productTerminology } from './terminology'

export default function KinchakuOid4vciPage() {
  const { theme } = useDojoLandingTheme()
  const [input, setInput] = useState('')
  const [result, setResult] = useState<Oid4vciParseResult | null>(null)
  const [fetchError, setFetchError] = useState<string | null>(null)
  const [fetchLoading, setFetchLoading] = useState(false)
  const [fetchedJson, setFetchedJson] = useState<unknown | null>(null)

  const wallet = productTerminology.wallet

  const runParse = useCallback(() => {
    setFetchedJson(null)
    setFetchError(null)
    setResult(parseOid4vciCredentialOfferInput(input))
  }, [input])

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
            <strong>credential offer JSON</strong>. Parsing runs in the browser only; fetching the offer URI may be
            blocked by CORS.
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
            }}
            spellCheck={false}
            placeholder={`openid-credential-offer://?credential_offer=%7B%22credential_issuer%22%3A%22https%3A%2F%2F…%22%7D`}
          />
          <div className="kinchaku-oid4vci__actions">
            <button type="button" className="kinchaku-oid4vci__btn kinchaku-oid4vci__btn--primary" onClick={runParse}>
              Parse
            </button>
            <button
              type="button"
              className="kinchaku-oid4vci__btn"
              disabled={!canFetchUri || fetchLoading}
              onClick={() => void runFetchUri()}
            >
              {fetchLoading ? 'Fetching…' : 'Fetch offer JSON'}
            </button>
          </div>
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
                {result.notes.map((n) => (
                  <li key={n}>{n}</li>
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
              <p className="kinchaku-oid4vci__meta" style={{ marginTop: '0.5rem' }}>
                No inline <code>credential_offer</code> JSON yet. Use <strong>Fetch offer JSON</strong> if the issuer
                allows browser CORS.
              </p>
            )}
          </section>
        ) : null}
      </main>
    </div>
  )
}
