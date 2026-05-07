import { useCallback, useEffect, useId, useMemo, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import './App.css'
import {
  DEFAULT_KATA_SAMPLES,
  DEMO_PERSONAS_OFFLINE,
  type PersonaPublic,
  type PersonasPayload,
} from './demoPersonas'
import { LEXICON_ENTRIES } from './lexiconData'
import {
  isValidSchoolId,
  patchNinjaProfileSchool,
  PERSONA_STORAGE_KEY,
  readNinjaProfile,
  type NinjaProfile,
} from './ninjaProfileStorage'
import { productTerminology } from './terminology'

const SITE = 'https://credential.ninja'
const THEME_KEY = 'credential-dojo-theme'

const OFFLINE_PERSONAS = DEMO_PERSONAS_OFFLINE

type HelloPayload = {
  message: string
  site: string
  wallet?: string
  cryptosuitesMetaphor?: string
  templateMetaphor?: string
  credentialMetaphor?: string
  presentationMetaphor?: string
  exchangeMetaphor?: string
  handshakeMetaphor?: string
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

function readStoredPersonaId(): string {
  try {
    const n = readNinjaProfile()
    if (n && isValidSchoolId(n.schoolId)) {
      return n.schoolId
    }
    const v = localStorage.getItem(PERSONA_STORAGE_KEY)
    if (v && isValidSchoolId(v)) return v
  } catch {
    /* ignore */
  }
  return 'ed-ryu'
}

function prefersReducedMotion(): boolean {
  if (typeof window === 'undefined') return false
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches
}

export default function HomePage() {
  const pouchGradId = useId().replace(/:/g, '')
  const sceneRef = useRef<HTMLDivElement>(null)
  const strikeTimerRef = useRef<number>(0)
  const [theme, setTheme] = useState<DojoTheme>(readStoredTheme)
  const [personas, setPersonas] = useState<readonly PersonaPublic[] | null>(null)
  const [personasNote, setPersonasNote] = useState<string | null>(null)
  const [selectedPersonaId, setSelectedPersonaId] = useState(readStoredPersonaId)
  const [kataIndex, setKataIndex] = useState(0)
  const [kataStrike, setKataStrike] = useState(false)
  const [kinchakuCinched, setKinchakuCinched] = useState(false)
  const [focusMeter, setFocusMeter] = useState(38)
  const [apiMessage, setApiMessage] = useState<string | null>(null)
  const [apiStandardsFocus, setApiStandardsFocus] = useState<string | null>(null)
  const [apiError, setApiError] = useState<string | null>(null)
  const [ninjaProfile, setNinjaProfile] = useState<NinjaProfile | null>(() => readNinjaProfile())

  const activePersonas = personas ?? OFFLINE_PERSONAS

  const kataSamples = useMemo(() => {
    const p = activePersonas.find((x) => x.id === selectedPersonaId)
    const list = p?.kataSamples?.length ? [...p.kataSamples] : [...DEFAULT_KATA_SAMPLES]
    return list
  }, [activePersonas, selectedPersonaId])

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
    fetch(`${base}/api/personas`)
      .then((res) => {
        if (!res.ok) throw new Error(`${res.status} ${res.statusText}`)
        return res.json() as Promise<PersonasPayload>
      })
      .then((data) => {
        setPersonas(data.personas)
        setPersonasNote(data.note ?? null)
      })
      .catch(() => {
        setPersonas(null)
        setPersonasNote(null)
      })
  }, [])

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

  useEffect(() => {
    if (!personas?.length) return
    if (!personas.some((p) => p.id === selectedPersonaId)) {
      setSelectedPersonaId('ed-ryu')
    }
  }, [personas, selectedPersonaId])

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

  const selectPersona = (id: string) => {
    setSelectedPersonaId(id)
    setKataIndex(0)
    setFocusMeter((f) => Math.min(100, f + 3))
    patchNinjaProfileSchool(id)
    setNinjaProfile(readNinjaProfile())
    try {
      localStorage.setItem(PERSONA_STORAGE_KEY, id)
    } catch {
      /* ignore */
    }
  }

  const nextKata = () => {
    setKataIndex((i) => (i + 1) % kataSamples.length)
    setKataStrike(true)
    window.clearTimeout(strikeTimerRef.current)
    strikeTimerRef.current = window.setTimeout(() => setKataStrike(false), 480)
    setFocusMeter((f) => Math.min(100, f + 15))
  }

  const selectedPersona = activePersonas.find((p) => p.id === selectedPersonaId)

  useEffect(() => {
    const onVis = () => setNinjaProfile(readNinjaProfile())
    document.addEventListener('visibilitychange', onVis)
    return () => document.removeEventListener('visibilitychange', onVis)
  }, [])

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
        <div
          className="dojo__focusMeter dojo-augmented dojo-augmented--meter"
          data-augmented-ui="tl-clip br-clip border"
        >
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
            <strong>W3C Verifiable Credentials</strong>: operators shape{' '}
            <strong>Tehon</strong> into <strong>Menkyo</strong>; agents open flows with{' '}
            <strong>Teawase</strong> handshakes and run <strong>Randori</strong>{' '}
            exchanges; holders stage <strong>Enbu</strong> for verifiers under{' '}
            <strong>Kata</strong> suites. Artifacts live in <strong>Kinchaku</strong>, the
            built-in wallet.
          </p>
          {ninjaProfile ? (
            <p
              className="dojo__ninjaBar dojo-augmented dojo-augmented--ninja"
              data-augmented-ui="tl-clip br-clip border"
            >
              <span className="dojo__ninjaBar-label">Ninja profile</span>{' '}
              <strong className="dojo__ninjaBar-name">{ninjaProfile.codename}</strong>
              <span className="dojo__ninjaBar-sep"> · </span>
              <span className="dojo__ninjaBar-school">
                {activePersonas.find((p) => p.id === ninjaProfile.schoolId)?.label ??
                  ninjaProfile.schoolId}
              </span>
              <span className="dojo__ninjaBar-sep"> · </span>
              <Link className="dojo__ninjaBar-edit" to="/create-ninja-profile">
                Edit
              </Link>
            </p>
          ) : null}
          <p className="dojo__headerActions">
            <Link className="dojo__linkNav" to="/create-ninja-profile">
              {ninjaProfile ? 'Ninja profile' : 'Create ninja profile'}
            </Link>
            <Link className="dojo__linkNav" to="/discover-kasa">
              Discover Kasa
            </Link>
            <Link className="dojo__linkNav" to="/lexicon">
              Full lexicon
            </Link>
            <a className="dojo__link" href={SITE}>
              {SITE.replace(/^https?:\/\//, '')}
            </a>
          </p>
        </header>

        <section className="dojo__lex" aria-labelledby="lexicon-heading">
          <h2 id="lexicon-heading" className="dojo__lexTitle">
            Dojo lexicon · artifacts · flows{' '}
            <Link className="dojo__lexMore" to="/lexicon">
              (full guide)
            </Link>
          </h2>
          <div className="dojo__lexGrid">
            {LEXICON_ENTRIES.map((entry) => (
              <article
                key={entry.key}
                className="dojo-lexCard dojo-augmented dojo-augmented--lex"
                data-augmented-ui="tl-clip br-clip border"
              >
                <h3 className="dojo-lexCard__title">
                  {entry.title}{' '}
                  <span className="dojo-lexCard__glyph" lang="ja">
                    {entry.glyph}
                  </span>
                </h3>
                <p className="dojo-lexCard__body">{entry.blurb}</p>
              </article>
            ))}
          </div>
        </section>

        <div className="dojo__panels">
          <section
            className="dojo__panel dojo__panel--kinchaku dojo-augmented dojo-augmented--panel"
            data-augmented-ui="tl-clip tr-clip bl-clip br-clip border"
            aria-labelledby="kinchaku-heading"
          >
            <h2 id="kinchaku-heading" className="dojo__panelTitle">
              {productTerminology.wallet.name}{' '}
              <span className="dojo__panelJa" lang="ja">
                {productTerminology.wallet.glyph}
              </span>
            </h2>
            <p className="dojo__panelBody">
              The platform wallet: hold <strong>Menkyo</strong> (issued credentials),
              compose an <strong>Enbu</strong> (verifiable presentation) when a
              verifier asks for proofs, and keep everything aligned with{' '}
              <strong>Tehon</strong> templates and <strong>Kata</strong> suites—without
              leaving the CRMS story.
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

            <div
              className="dojo-persona dojo-augmented dojo-augmented--inset"
              data-augmented-ui="tl-clip br-clip border"
              role="group"
              aria-label="Demo proof school"
            >
              <p className="dojo-persona__label">Demo school (persona)</p>
              <div className="dojo-persona__tabs">
                {activePersonas.map((p) => (
                  <button
                    key={p.id}
                    type="button"
                    className="dojo-persona__tab"
                    aria-pressed={p.id === selectedPersonaId}
                    onClick={() => selectPersona(p.id)}
                  >
                    <span className="dojo-persona__tabName">{p.label}</span>
                    <span className="dojo-persona__tabJa" lang="ja">
                      {p.labelJa}
                    </span>
                  </button>
                ))}
              </div>
              {selectedPersona ? (
                <>
                  <p className="dojo-persona__desc">{selectedPersona.description}</p>
                  {selectedPersona.didKey ? (
                    <p className="dojo-persona__did">
                      <span className="dojo-persona__didLabel">Issuer </span>
                      <code className="dojo-persona__didCode">{selectedPersona.didKey}</code>
                    </p>
                  ) : (
                    <p className="dojo-persona__did dojo-persona__did--muted">
                      Start the backend to load deterministic <code>did:key</code> values.
                    </p>
                  )}
                </>
              ) : null}
              {personasNote ? <p className="dojo-persona__note">{personasNote}</p> : null}
            </div>

            <div className="dojo__kataPlay">
              <div
                className={`dojo-kata-display dojo-augmented dojo-augmented--kata${kataStrike ? ' dojo-kata-display--strike' : ''}`}
                data-augmented-ui="tl-clip br-clip border"
              >
                <code className="dojo-kata-display__code">{kataSamples[kataIndex]}</code>
              </div>
              <button type="button" className="dojo-btn dojo-btn--kata" onClick={nextKata}>
                <span className="dojo-btn__glyph" aria-hidden>
                  型
                </span>
                <span className="dojo-btn__text">Practice next kata</span>
              </button>
            </div>
          </section>

          <section
            className="dojo__panel dojo__panel--api dojo-augmented dojo-augmented--panel"
            data-augmented-ui="tl-clip tr-clip bl-clip br-clip border"
            aria-live="polite"
          >
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

