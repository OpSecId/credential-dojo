import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import './App.css'
import './DiscoverKasaPage.css'
import { useDojoLandingTheme } from './DojoLandingThemeContext'
import { DEMO_PERSONAS_OFFLINE, type PersonaPublic, type PersonasPayload } from './demoPersonas'

const PERSONAS_FETCH_MS = 8000

export default function DiscoverKasaPage() {
  const { theme } = useDojoLandingTheme()
  /** Offline-first: static hosts without `/api` proxy never resolve fetch — avoid a stuck spinner. */
  const [personas, setPersonas] =
    useState<readonly PersonaPublic[]>(DEMO_PERSONAS_OFFLINE)
  const [note, setNote] = useState<string | null>(null)
  const [fromApi, setFromApi] = useState(false)
  const [apiAttemptDone, setApiAttemptDone] = useState(false)
  const [copiedDid, setCopiedDid] = useState<string | null>(null)

  useEffect(() => {
    const base = import.meta.env.VITE_API_BASE ?? ''
    const ac = new AbortController()
    const tid = window.setTimeout(() => ac.abort(), PERSONAS_FETCH_MS)

    fetch(`${base}/api/personas`, { signal: ac.signal })
      .then((res) => {
        if (!res.ok) throw new Error(`${res.status} ${res.statusText}`)
        return res.json() as Promise<PersonasPayload>
      })
      .then((data) => {
        setPersonas(data.personas)
        setNote(data.note ?? null)
        setFromApi(true)
      })
      .catch(() => {
        setFromApi(false)
        setPersonas(DEMO_PERSONAS_OFFLINE)
        setNote(null)
      })
      .finally(() => {
        window.clearTimeout(tid)
        setApiAttemptDone(true)
      })

    return () => {
      ac.abort()
      window.clearTimeout(tid)
    }
  }, [])

  const copyDidKey = async (didKey: string) => {
    try {
      await navigator.clipboard.writeText(didKey)
      setCopiedDid(didKey)
      window.setTimeout(() => setCopiedDid((cur) => (cur === didKey ? null : cur)), 1200)
    } catch {
      setCopiedDid(null)
    }
  }

  return (
    <div className={`dojo-scene dojo-scene--${theme} dojo-scene--zen`}>
      <div className="dojo-scene__moon" aria-hidden />
      <div className="dojo-scene__bg" aria-hidden />
      <div className="dojo-scene__grid" aria-hidden />

      <div className="kasa dojoZenPage dojoZenPage--wide">
        <header className="dojoZenPage__header">
          <p className="dojoZenPage__eyebrow">Credential Dojo</p>
          <h1 className="dojoZenPage__title">Discover Kasa</h1>
          <p className="dojoZenPage__intro">
            <strong>Kasa</strong> (笠) is a woven travel hat—here, the shaded porch where we line up
            the <strong>proof schools</strong>. Each school is a persona with its own issuer{' '}
            <code className="kasa__inline">did:key</code> and preferred <strong>Kata</strong>{' '}
            (cryptosuites). Keys are deterministic demo material, not production secrets.
          </p>
          <nav className="dojoZenPage__nav" aria-label="Section">
            <Link className="dojoZenPage__back" to="/" title="Back Home">
              ← Back Home
            </Link>
            <Link
              className="dojoZenPage__back"
              to="/create-ninja-profile"
              title="Codename and Kasa (proof school) for the in-browser ninja profile"
            >
              Create ninja profile
            </Link>
            <Link
              className="dojoZenPage__back"
              to="/lexicon"
              title="Glossary: Dojo metaphors vs W3C Verifiable Credentials"
            >
              Lexicon
            </Link>
            <Link
              className="dojoZenPage__back"
              to="/json-explorer"
              title="Shinbi render view: interactive JSON tree with RFC 6901 pointer tooltips"
            >
              Shinbi
            </Link>
            <Link
              className="dojoZenPage__back"
              to="/kensa"
              title="Enbu の Kensa / Menkyo の Kensa — structural inspection"
            >
              Kensa
            </Link>
          </nav>
          {apiAttemptDone && !fromApi ? (
            <p className="kasa__banner" role="status">
              API unreachable or timed out — showing offline copy. Use same-origin{' '}
              <code className="kasa__inline">/api</code> proxy to the backend, or set build-time{' '}
              <code className="kasa__inline">VITE_API_BASE</code>, for live{' '}
              <code className="kasa__inline">did:key</code> values.
            </p>
          ) : null}
        </header>

        <ul className="kasa__grid" aria-label="Proof schools">
              {personas.map((p) => (
                <li key={p.id}>
                  <article
                    className="kasa-card dojo-augmented dojo-augmented--panel"
                    data-augmented-ui="tl-clip tr-clip bl-clip br-clip border"
                  >
                    <header className="kasa-card__head">
                      <h2 className="kasa-card__title">
                        {p.label}{' '}
                        <span className="kasa-card__ja" lang="ja">
                          {p.labelJa}
                        </span>
                      </h2>
                      <span className="kasa-card__badge">{p.proofSchool}</span>
                    </header>
                    <p className="kasa-card__id">
                      <span className="kasa-card__idLabel">id</span> {p.id}
                    </p>
                    <p className="kasa-card__desc">{p.description}</p>
                    {p.didKey ? (
                      <p className="kasa-card__did">
                        <span className="kasa-card__didTop">
                          <span className="kasa-card__didLabel">Issuer</span>
                          <button
                            type="button"
                            className={`kasa-card__copyDid${copiedDid === p.didKey ? ' kasa-card__copyDid--ok' : ''}`}
                            onClick={() => copyDidKey(p.didKey)}
                            title={copiedDid === p.didKey ? 'Copied' : 'Copy did:key'}
                            aria-label={copiedDid === p.didKey ? 'did:key copied' : 'Copy did:key'}
                          >
                            {copiedDid === p.didKey ? '✓' : '⧉'}
                          </button>
                        </span>
                        <code className="kasa-card__didCode" title={p.didKey}>
                          {p.didKey}
                        </code>
                      </p>
                    ) : (
                      <p className="kasa-card__did kasa-card__did--muted">
                        <code className="kasa__inline">did:key</code> loads from the API when the
                        backend is running.
                      </p>
                    )}
                    <div className="kasa-card__kata">
                      <h3 className="kasa-card__kataTitle">Kata (suites)</h3>
                      <ul className="kasa-card__kataList">
                        {p.kataSamples.map((k) => (
                          <li key={k}>
                            <code>{k}</code>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </article>
                </li>
              ))}
        </ul>
        {note ? <p className="kasa__note">{note}</p> : null}
        <p className="kasa__cta">
          <Link
            className="dojoZenPage__back"
            to="/"
            title="Home: Kata carousel, Kinchaku pouch, and lexicon cards"
          >
            ← Practice kata on the home dojo
          </Link>
        </p>
      </div>
    </div>
  )
}
