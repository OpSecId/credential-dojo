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
  clearNinjaProfile,
  isValidSchoolId,
  migrateLegacySchoolId,
  NINJA_PROFILE_CHANGED_EVENT,
  patchNinjaProfileSchool,
  PERSONA_STORAGE_KEY,
  readNinjaProfile,
  type NinjaProfile,
} from './ninjaProfileStorage'
import { useJourney } from './journey/JourneyContext'
import { useNoviceIdle } from './novice/NoviceIdleContext'
import { productTerminology } from './terminology'

const SITE = 'https://credential.ninja'
const THEME_KEY = 'credential-dojo-theme'
/** Default true — zen landing; user can open full tools & playground */
const CALM_LANDING_KEY = 'credential-dojo-calm-landing'
const HELLO_FETCH_MS = 8000

function readCalmLandingPref(): boolean {
  try {
    const v = localStorage.getItem(CALM_LANDING_KEY)
    if (v === '0') return false
    if (v === '1') return true
  } catch {
    /* ignore */
  }
  return true
}

const OFFLINE_PERSONAS = DEMO_PERSONAS_OFFLINE

type HelloPayload = {
  message: string
  site: string
  wallet?: string
  cryptosuitesMetaphor?: string
  templateMetaphor?: string
  katachiMetaphor?: string
  credentialMetaphor?: string
  credentialFromTemplateMetaphor?: string
  presentationMetaphor?: string
  presentationRequestMetaphor?: string
  renderMetaphor?: string
  presentationInspectionMetaphor?: string
  credentialInspectionMetaphor?: string
  exchangeMetaphor?: string
  handshakeMetaphor?: string
  workflowMetaphor?: string
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
    const personaId = v ? migrateLegacySchoolId(v) : ''
    if (v && personaId !== v) {
      try {
        localStorage.setItem(PERSONA_STORAGE_KEY, personaId)
      } catch {
        /* ignore */
      }
    }
    if (personaId && isValidSchoolId(personaId)) return personaId
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
  const { reportFocusMeter, clearHomeFocus } = useNoviceIdle()
  const { state: journeyState, pendingStart, startJourney, clearPendingStart, reportLearningFocus } = useJourney()
  const pouchGradId = useId().replace(/:/g, '')
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
  const [calmLanding, setCalmLanding] = useState(readCalmLandingPref)

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
    try {
      localStorage.setItem(CALM_LANDING_KEY, calmLanding ? '1' : '0')
    } catch {
      /* ignore */
    }
  }, [calmLanding])

  useEffect(() => {
    if (reduceMotion) return
    const id = window.setInterval(() => {
      setFocusMeter((f) => Math.max(0, f - 0.6))
    }, 700)
    return () => clearInterval(id)
  }, [reduceMotion])

  useEffect(() => {
    reportFocusMeter(focusMeter)
    reportLearningFocus(focusMeter)
    return () => clearHomeFocus()
  }, [focusMeter, reportFocusMeter, clearHomeFocus, reportLearningFocus])

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
    const ac = new AbortController()
    const tid = window.setTimeout(() => ac.abort(), HELLO_FETCH_MS)

    fetch(`${base}/api/hello`, { signal: ac.signal })
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
        setApiError(
          'API unreachable or timed out. Use same-origin `/api` proxy to the backend, run `npm run dev -w backend` locally, or set build-time `VITE_API_BASE` if the API is on another host.',
        )
      })
      .finally(() => {
        window.clearTimeout(tid)
      })

    return () => {
      ac.abort()
      window.clearTimeout(tid)
    }
  }, [])

  useEffect(() => {
    if (!personas?.length) return
    if (!personas.some((p) => p.id === selectedPersonaId)) {
      setSelectedPersonaId('ed-ryu')
    }
  }, [personas, selectedPersonaId])

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
  const kinchakuMenkyoCount = Math.max(1, (ninjaProfile ? 2 : 1) + (selectedPersona ? 1 : 0))
  const kinchakuState = kinchakuCinched ? 'Locked' : 'Ready'
  const kinchakuEnbuState = focusMeter >= 50 ? 'Ready to present' : 'Charging focus'
  const kinchakuShokanQueue = focusMeter >= 65 ? 2 : 1

  const handleClearProfile = useCallback(() => {
    const ok = window.confirm(
      'Remove your ninja profile from this browser? This cannot be undone here.',
    )
    if (!ok) return
    clearNinjaProfile()
    setNinjaProfile(readNinjaProfile())
    setSelectedPersonaId(readStoredPersonaId())
  }, [])

  useEffect(() => {
    const sync = () => {
      setNinjaProfile(readNinjaProfile())
      setSelectedPersonaId(readStoredPersonaId())
    }
    document.addEventListener('visibilitychange', sync)
    window.addEventListener(NINJA_PROFILE_CHANGED_EVENT, sync)
    window.addEventListener('storage', sync)
    return () => {
      document.removeEventListener('visibilitychange', sync)
      window.removeEventListener(NINJA_PROFILE_CHANGED_EVENT, sync)
      window.removeEventListener('storage', sync)
    }
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
      className={`dojo-scene dojo-scene--landing${calmLanding ? ' dojo-scene--calm' : ''} dojo-scene--${theme}`}
      data-reduce-motion={reduceMotion ? 'true' : undefined}
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
        <div className={`dojo__introBand${calmLanding ? ' dojo__introBand--calm' : ''}`}>
          <aside className="dojo__meterAside">
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
                修業 · training focus — kata, Kinchaku, and school switches feed it; high focus speeds
                novice-path insight (修 · Novice path)
              </span>
            </div>
          </aside>

          <header className={`dojo__header${calmLanding ? ' dojo__header--calm' : ''}`}>
            <p className="dojo__eyebrow">
              {calmLanding ? (
                <>
                  credential.ninja ·{' '}
                  <abbr title="Credential Management & Registry System">CRMS</abbr>
                  {' · '}
                  <abbr title="World Wide Web Consortium">W3C</abbr> VCs
                </>
              ) : (
                <>
                  credential.ninja ·{' '}
                  <abbr title="Credential Management & Registry System">CRMS</abbr>
                  {' · '}
                  <abbr title="World Wide Web Consortium">W3C</abbr> Verifiable Credentials
                </>
              )}
            </p>
            <h1 className="dojo__title">
              <span className="dojo__titleLine">The Credential</span>
              <span className="dojo__titleLine dojo__titleLine--accent">Dojo</span>
            </h1>
            {calmLanding ? (
              <p className="dojo__lede dojo__lede--calm">
                W3C Verifiable Credentials in this UI—Dojo names (Tehon, Menkyo, Enbu, …) map to real artifacts
                and flows.
              </p>
            ) : (
              <p className="dojo__lede">
                Credential operations for <strong>W3C Verifiable Credentials</strong>. Dojo names
                (Tehon, Menkyo, Enbu, …) are metaphors for real artifacts and steps in this UI.
              </p>
            )}
            {!ninjaProfile && calmLanding ? (
              <nav className="dojo__calmStart" aria-label="Get started">
                <Link className="dojo__calmStart-link dojo__calmStart-link--primary" to="/lexicon">
                  Lexicon
                </Link>
                <span className="dojo__calmStart-sep" aria-hidden>
                  ·
                </span>
                <Link className="dojo__calmStart-link" to="/create-ninja-profile">
                  Ninja profile
                </Link>
              </nav>
            ) : null}
            {!ninjaProfile && !calmLanding ? (
              <p className="dojo__heroCtas" aria-label="Get started">
                <Link
                  className="dojo__heroPrimary dojo__heroPrimary--lexicon"
                  to="/lexicon"
                  title="Start here if the Dojo metaphors are new"
                >
                  Start with Lexicon
                </Link>
                <Link
                  className="dojo__heroLexicon"
                  to="/create-ninja-profile"
                  title="Codename and Kasa — stored in this browser only"
                >
                  Create ninja profile
                </Link>
              </p>
            ) : null}
            {!ninjaProfile && !calmLanding ? (
              <section
                className="dojo__lexPrimer dojo-augmented dojo-augmented--inset"
                data-augmented-ui="tl-clip br-clip border"
                aria-label="Lexicon primer"
              >
                <p className="dojo__lexPrimer-title">New to the Dojo terms?</p>
                <p className="dojo__lexPrimer-body">
                  The platform uses a small set of metaphors. The Lexicon maps them to W3C VC concepts so
                  the rest of the UI reads clearly.
                </p>
                <ul className="dojo__lexPrimer-list">
                  <li>
                    <strong>Tehon</strong> — issuer definitions (copybook)
                  </li>
                  <li>
                    <strong>Katachi</strong> — schema/shape of claims &amp; types
                  </li>
                  <li>
                    <strong>Menkyo</strong> — issued credentials
                  </li>
                </ul>
                <Link className="dojo__lexPrimer-cta" to="/lexicon" title="Open the full lexicon">
                  Open Lexicon →
                </Link>
              </section>
            ) : null}
            {ninjaProfile ? (
              <>
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
                  <Link
                    className="dojo__ninjaBar-edit"
                    to="/create-ninja-profile"
                    title="Change codename or proof school (Kasa) for your ninja profile"
                  >
                    Edit
                  </Link>
                  <span className="dojo__ninjaBar-sep"> · </span>
                  <button
                    type="button"
                    className="dojo__ninjaBar-clear"
                    onClick={handleClearProfile}
                    title="Remove ninja profile from this browser"
                  >
                    Clear profile
                  </button>
                </p>
                {!journeyState.started ? (
                  <p className="dojo__journeyStart dojo-augmented dojo-augmented--inset" data-augmented-ui="tl-clip br-clip border">
                    <span className="dojo__journeyStart-label">Learning Journey</span>{' '}
                    {pendingStart ? 'Profile created — begin your resource journey now.' : 'Begin your parallel resource journey anytime.'}
                    <button type="button" className="dojo__journeyStart-btn" onClick={startJourney}>
                      Start journey
                    </button>
                    {pendingStart ? (
                      <button type="button" className="dojo__journeyStart-dismiss" onClick={clearPendingStart}>
                        Dismiss
                      </button>
                    ) : null}
                  </p>
                ) : null}
              </>
            ) : null}
          </header>
        </div>

        {calmLanding ? (
          <div className="dojo__calmBand">
            <p className="dojo__calmBand-label">Tools</p>
            <nav className="dojo__calmEssentials" aria-label="Tools and demos">
              <Link to="/issue-verify">Issue &amp; verify</Link>
              <span className="dojo__calmDot" aria-hidden>
                ·
              </span>
              <Link to="/kensa">Kensa</Link>
              <span className="dojo__calmDot" aria-hidden>
                ·
              </span>
              <Link to="/expedition">Expedition</Link>
              <span className="dojo__calmDot" aria-hidden>
                ·
              </span>
              <Link to="/discover-kasa">Kasa</Link>
            </nav>
            <button type="button" className="dojo__calmExpand dojo__calmExpand--quiet" onClick={() => setCalmLanding(false)}>
              All tools &amp; playground
            </button>
          </div>
        ) : null}

        {!calmLanding ? (
          <button type="button" className="dojo__calmCollapse" onClick={() => setCalmLanding(true)}>
            Return to calm view
          </button>
        ) : null}

        {!calmLanding ? (
          <>
        <nav className="dojo__ctaBand" aria-label="Quick tools">
          <Link
            className="dojo__ctaTile"
            to="/kensa"
            title="Enbu の Kensa / Menkyo の Kensa — structural VP vs VC inspection"
          >
            <span className="dojo__ctaTile-kicker">Inspect</span>
            <span className="dojo__ctaTile-title">Kensa</span>
            <span className="dojo__ctaTile-desc">Presentation vs credential checks</span>
          </Link>
          <Link
            className="dojo__ctaTile"
            to="/json-explorer"
            title="Shinbi render view with RFC 6901 pointers and explainByPointer blurbs"
          >
            <span className="dojo__ctaTile-kicker">Explore</span>
            <span className="dojo__ctaTile-title">Shinbi</span>
            <span className="dojo__ctaTile-desc">Pointers &amp; nested drill-down</span>
          </Link>
          <Link
            className="dojo__ctaTile"
            to="/discover-kasa"
            title="Issuer personas: did:key and Kata per proof school"
          >
            <span className="dojo__ctaTile-kicker">Discover</span>
            <span className="dojo__ctaTile-title">Kasa</span>
            <span className="dojo__ctaTile-desc">Schools · suites · did:key</span>
          </Link>
          <Link
            className="dojo__ctaTile"
            to="/expedition"
            title="Story adventure across the full credential flow"
          >
            <span className="dojo__ctaTile-kicker">Journey</span>
            <span className="dojo__ctaTile-title">Expedition</span>
            <span className="dojo__ctaTile-desc">Narrative walkthrough of all terms</span>
          </Link>
          <Link
            className="dojo__ctaTile"
            to="/tejun-viewer"
            title="React Flow map of the expedition runbook"
          >
            <span className="dojo__ctaTile-kicker">Map</span>
            <span className="dojo__ctaTile-title">Tejun viewer</span>
            <span className="dojo__ctaTile-desc">Interactive flow of expedition steps</span>
          </Link>
        </nav>

        <section
          id="dojo-lexicon"
          className="dojo__lex dojo__lex--compact"
          aria-labelledby="lexicon-heading"
        >
          <div className="dojo__lexHead">
            <h2 id="lexicon-heading" className="dojo__lexTitle">
              Lexicon · artifacts · flows{' '}
              <Link
                className="dojo__lexMore"
                to="/lexicon"
                title="Long-form articles for each Dojo metaphor vs credentials and flows"
              >
                Guide →
              </Link>
            </h2>
            {!ninjaProfile ? (
              <nav className="dojo__lexQuick" aria-label="Lexicon shortcuts">
                <Link className="dojo__lexQuickLink" to="/lexicon" title="Glossary: Dojo metaphors vs W3C VC concepts">
                  Full lexicon
                </Link>
                <span className="dojo__lexQuickSep" aria-hidden>
                  ·
                </span>
                <a className="dojo__lexQuickLink dojo__lexQuickLink--mono" href={SITE} title={SITE}>
                  {SITE.replace(/^https?:\/\//, '')}
                </a>
              </nav>
            ) : null}
          </div>
          <div className="dojo__lexGrid">
            {LEXICON_ENTRIES.map((entry) => (
              <article
                key={entry.key}
                className="dojo-lexCard dojo-augmented dojo-augmented--lex"
                data-augmented-ui="tl-clip br-clip border"
                title={entry.blurb}
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

        <section id="dojo-playground" className="dojo__playground" aria-labelledby="playground-heading">
          <h2 id="playground-heading" className="dojo__sectionLabel">
            Playground
          </h2>
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
                issuer <strong>Tehon</strong>, <strong>Katachi</strong>, and <strong>Kata</strong>—without
                leaving the CRMS story.
              </p>

              <div className="kinchaku-widget dojo-augmented dojo-augmented--inset" data-augmented-ui="tl-clip br-clip border">
                <div className="kinchaku-widget__top">
                  <p className="kinchaku-widget__label">Wallet status</p>
                  <span className={`kinchaku-widget__badge${kinchakuCinched ? '' : ' kinchaku-widget__badge--ok'}`}>
                    {kinchakuState}
                  </span>
                </div>

                <div className="kinchaku-widget__stats">
                  <article className="kinchaku-widget__stat">
                    <p className="kinchaku-widget__statLabel">Menkyo stored</p>
                    <p className="kinchaku-widget__statValue">{kinchakuMenkyoCount}</p>
                  </article>
                  <article className="kinchaku-widget__stat">
                    <p className="kinchaku-widget__statLabel">Shōkan queue</p>
                    <p className="kinchaku-widget__statValue">{kinchakuShokanQueue}</p>
                  </article>
                  <article className="kinchaku-widget__stat">
                    <p className="kinchaku-widget__statLabel">Enbu readiness</p>
                    <p className="kinchaku-widget__statValue kinchaku-widget__statValue--small">
                      {kinchakuEnbuState}
                    </p>
                  </article>
                </div>

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

                <div className="kinchaku-widget__actions" aria-label="Wallet quick actions">
                  <Link className="kinchaku-widget__action" to="/kensa">
                    Inspect
                  </Link>
                  <Link className="kinchaku-widget__action" to="/json-explorer">
                    Shinbi
                  </Link>
                  <Link className="kinchaku-widget__action" to="/expedition">
                    Expedition
                  </Link>
                </div>
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
              aria-label="Proof school"
            >
              <p className="dojo-persona__label">Proof school (persona)</p>
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
        </section>
          </>
        ) : null}
      </div>
    </div>
  )
}

