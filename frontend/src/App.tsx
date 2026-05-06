import { useCallback, useEffect, useId, useRef, useState } from 'react'
import './App.css'
import { productTerminology } from './terminology'

const SITE = 'https://credential.ninja'
const THEME_KEY = 'credential-dojo-theme'

const KATA_SAMPLES = [
  'eddsa-rdfc-2022',
  'ecdsa-rdfc-2019',
  'bbs-2023',
  'ecdsa-sd-2023',
  'vc-jwt',
]

type HelloPayload = {
  message: string
  site: string
  wallet?: string
  cryptosuitesMetaphor?: string
  standardsFocus?: string
  terminology?: typeof productTerminology
}

type DojoTheme = 'night' | 'day'

function readStoredTheme(): DojoTheme {
  try {
    const v = localStorage.getItem(THEME_KEY)
    if (v === 'day' || v === 'night') return v
  } catch {
    /* ignore */
  }
  return 'night'
}

function prefersReducedMotion(): boolean {
  if (typeof window === 'undefined') return false
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches
}

function App() {
  const pouchGradId = useId().replace(/:/g, '')
  const sceneRef = useRef<HTMLDivElement>(null)
  const strikeTimerRef = useRef<number>(0)
  const [theme, setTheme] = useState<DojoTheme>(readStoredTheme)
  const [kataIndex, setKataIndex] = useState(0)
  const [kataStrike, setKataStrike] = useState(false)
  const [kinchakuCinched, setKinchakuCinched] = useState(false)
  const [focusMeter, setFocusMeter] = useState(38)
  const [apiMessage, setApiMessage] = useState<string | null>(null)
  const [apiStandardsFocus, setApiStandardsFocus] = useState<string | null>(null)
  const [apiError, setApiError] = useState<string | null>(null)

  const reduceMotion = prefersReducedMotion()

  useEffect(() => {
    try {
      localStorage.setItem(THEME_KEY, theme)
    } catch {
      /* ignore */
    }
  }, [theme])

  useEffect(() => {
    if (reduceMotion) return
    const id = window.setInterval(() => {
      setFocusMeter((f) => Math.max(0, f - 0.6))
    }, 700)
    return () => clearInterval(id)
  }, [reduceMotion])

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

  const onSceneMove = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      if (reduceMotion) return
      const el = sceneRef.current
      if (!el) return
      const r = el.getBoundingClientRect()
      const x = (e.clientX - r.left) / r.width - 0.5
      const y = (e.clientY - r.top) / r.height - 0.5
      el.style.setProperty('--mx', String(x))
      el.style.setProperty('--my', String(y))
    },
    [reduceMotion],
  )

  const leaveScene = useCallback(() => {
    const el = sceneRef.current
    if (!el) return
    el.style.setProperty('--mx', '0')
    el.style.setProperty('--my', '0')
  }, [])

  const toggleTheme = () => {
    setTheme((t) => (t === 'night' ? 'day' : 'night'))
  }

  const nextKata = () => {
    setKataIndex((i) => (i + 1) % KATA_SAMPLES.length)
    setKataStrike(true)
    window.clearTimeout(strikeTimerRef.current)
    strikeTimerRef.current = window.setTimeout(() => setKataStrike(false), 480)
    setFocusMeter((f) => Math.min(100, f + 15))
  }

  const toggleKinchaku = () => {
    setKinchakuCinched((c) => !c)
    setFocusMeter((f) => Math.min(100, f + 10))
  }

  useEffect(
    () => () => {
      window.clearTimeout(strikeTimerRef.current)
    },
    [],
  )

  return (
    <div
      ref={sceneRef}
      className={`dojo-scene dojo-scene--${theme}`}
      data-reduce-motion={reduceMotion ? 'true' : undefined}
      onMouseMove={onSceneMove}
      onMouseLeave={leaveScene}
    >
      <div className="dojo-scene__moon" aria-hidden />
      <div className="dojo-scene__bg" aria-hidden />
      <div className="dojo-scene__embers" aria-hidden />
      <div className="dojo-scene__grid" aria-hidden />

      <button
        type="button"
        className="dojo-lantern"
        onClick={toggleTheme}
        aria-pressed={theme === 'night'}
        aria-label={
          theme === 'night'
            ? 'Switch to day dojo (paper theme)'
            : 'Switch to night dojo (lantern theme)'
        }
      >
        <span className="dojo-lantern__glow" aria-hidden />
        <span className="dojo-lantern__body" aria-hidden />
        <span className="dojo-lantern__label">{theme === 'night' ? '夜' : '昼'}</span>
      </button>

      <div className="dojo">
        <div className="dojo__focusMeter">
          <div className="dojo__focusMeter-track" role="presentation">
            <div
              className="dojo__focusMeter-fill"
              style={{ width: `${Math.round(focusMeter)}%` }}
            />
          </div>
          <span className="dojo__focusMeter-caption">
            修業 · training focus — practice kata or cinch Kinchaku to build it
          </span>
        </div>

        <header className="dojo__header">
          <p className="dojo__eyebrow">
            credential.ninja ·{' '}
            <abbr title="Credential Management & Registry System">CRMS</abbr>
            {' · '}
            <abbr title="World Wide Web Consortium">W3C</abbr> Verifiable Credentials
          </p>
          <h1 className="dojo__title">
            <span className="dojo__titleLine">The Credential</span>
            <span className="dojo__titleLine dojo__titleLine--accent">Dojo</span>
          </h1>
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

            <div className="dojo__kinchakuPlay">
              <button
                type="button"
                className={`dojo-pouch${kinchakuCinched ? ' dojo-pouch--cinched' : ''}`}
                onClick={toggleKinchaku}
                aria-pressed={kinchakuCinched}
                aria-label={
                  kinchakuCinched
                    ? 'Loosen Kinchaku drawstrings'
                    : 'Cinch Kinchaku drawstrings'
                }
              >
                <svg
                  className="dojo-pouch__svg"
                  viewBox="0 0 88 108"
                  width="88"
                  height="108"
                  aria-hidden
                >
                  <defs>
                    <linearGradient
                      id={pouchGradId}
                      x1="0%"
                      y1="0%"
                      x2="100%"
                      y2="100%"
                    >
                      <stop offset="0%" stopColor="var(--pouch-highlight)" />
                      <stop offset="100%" stopColor="var(--pouch-shadow)" />
                    </linearGradient>
                  </defs>
                  <path
                    fill={`url(#${pouchGradId})`}
                    d="M44 8 C20 8 8 28 8 48 C8 78 22 98 44 100 C66 98 80 78 80 48 C80 28 68 8 44 8Z"
                  />
                  <path
                    fill="none"
                    stroke="var(--pouch-rim)"
                    strokeWidth="2"
                    d="M44 8 C20 8 8 28 8 48 C8 78 22 98 44 100 C66 98 80 78 80 48 C80 28 68 8 44 8Z"
                  />
                  <ellipse cx="44" cy="22" rx="28" ry="10" fill="var(--pouch-mouth)" />
                </svg>
                <span className="dojo-pouch__cord dojo-pouch__cord--l" aria-hidden />
                <span className="dojo-pouch__cord dojo-pouch__cord--r" aria-hidden />
              </button>
              <p className="dojo__hint">
                {kinchakuCinched
                  ? 'Cinched tight — tap to loosen.'
                  : 'Tap the pouch to cinch the drawstrings.'}
              </p>
            </div>
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

            <div className="dojo__kataPlay">
              <div
                className={`dojo-kata-display${kataStrike ? ' dojo-kata-display--strike' : ''}`}
              >
                <code className="dojo-kata-display__code">{KATA_SAMPLES[kataIndex]}</code>
              </div>
              <button type="button" className="dojo-btn dojo-btn--kata" onClick={nextKata}>
                <span className="dojo-btn__glyph" aria-hidden>
                  型
                </span>
                <span className="dojo-btn__text">Practice next kata</span>
              </button>
            </div>
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
    </div>
  )
}

export default App
