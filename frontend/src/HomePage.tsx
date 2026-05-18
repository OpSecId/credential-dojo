import { useEffect, useState, type ReactNode } from 'react'
import { Link } from 'react-router-dom'
import './App.css'
import { productTerminology } from './terminology'
import {
  NINJA_PROFILE_CHANGED_EVENT,
  readNinjaProfile,
  type NinjaProfile,
} from './ninjaProfileStorage'
import { useJourney } from './journey/JourneyContext'
import { useNoviceIdle } from './novice/NoviceIdleContext'
import { useDojoLandingTheme } from './DojoLandingThemeContext'

const TRAINING_FOCUS_DECAY_MS = 3500
const TRAINING_FOCUS_DECAY_STEP = 0.07

function prefersReducedMotion(): boolean {
  if (typeof window === 'undefined') return false
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches
}

type CalmLane = 'credo' | 'dojo' | 'trials'

function CalmLaneCard({
  lane,
  to,
  title,
  desc,
  cta,
  linkTitle,
}: {
  lane: CalmLane
  to: string
  title: ReactNode
  desc: ReactNode
  cta: string
  linkTitle?: string
}) {
  return (
    <Link
      className={`dojo__calmActionCard dojo__calmActionCard--${lane}`}
      to={to}
      title={linkTitle}
    >
      <span className="dojo__calmActionCard-title">{title}</span>
      <p className="dojo__calmActionCard-desc">{desc}</p>
      <span className="dojo__calmActionCard-cta">{cta}</span>
    </Link>
  )
}

export default function HomePage() {
  const { theme } = useDojoLandingTheme()
  const { reportFocusMeter, clearHomeFocus } = useNoviceIdle()
  const { reportLearningFocus } = useJourney()
  const [focusMeter, setFocusMeter] = useState(38)
  const [ninjaProfile, setNinjaProfile] = useState<NinjaProfile | null>(() => readNinjaProfile())
  const reduceMotion = prefersReducedMotion()

  useEffect(() => {
    if (reduceMotion) return
    const id = window.setInterval(() => {
      setFocusMeter((f) => Math.max(0, f - TRAINING_FOCUS_DECAY_STEP))
    }, TRAINING_FOCUS_DECAY_MS)
    return () => clearInterval(id)
  }, [reduceMotion])

  useEffect(() => {
    reportFocusMeter(focusMeter)
    reportLearningFocus(focusMeter)
    return () => clearHomeFocus()
  }, [focusMeter, reportFocusMeter, clearHomeFocus, reportLearningFocus])

  useEffect(() => {
    const sync = () => setNinjaProfile(readNinjaProfile())
    document.addEventListener('visibilitychange', sync)
    window.addEventListener(NINJA_PROFILE_CHANGED_EVENT, sync)
    window.addEventListener('storage', sync)
    return () => {
      document.removeEventListener('visibilitychange', sync)
      window.removeEventListener(NINJA_PROFILE_CHANGED_EVENT, sync)
      window.removeEventListener('storage', sync)
    }
  }, [])

  return (
    <div
      className={`dojo-scene dojo-scene--landing dojo-scene--calm dojo-scene--${theme}`}
      data-reduce-motion={reduceMotion ? 'true' : undefined}
    >
      <div className="dojo-scene__moon" aria-hidden />
      <div className="dojo-scene__bg" aria-hidden />
      <div className="dojo-scene__embers" aria-hidden />
      <div className="dojo-scene__grid" aria-hidden />

      <div className="dojo dojo--calmLanding">
        <div className="dojo__calmStage">
          <div className="dojo__introBand dojo__introBand--calm">
            <header className="dojo__header dojo__header--calm">
              <p className="dojo__eyebrow">credential.ninja</p>
              <h1 className="dojo__title dojo__title--calm">
                <span className="dojo__titleLine dojo__titleLine--wayLead">Way of the </span>
                <span className="dojo__titleLine dojo__titleLine--accent">Credential</span>
              </h1>
              <p className="dojo__lede dojo__lede--calm">
                <strong>W3C Verifiable Credentials</strong> in the browser—guided demos and inspection,
                distilled.
              </p>
              {!ninjaProfile ? (
                <nav className="dojo__calmStart" aria-label="Get started">
                  <Link className="dojo__calmStart-link dojo__calmStart-link--primary" to="/journey">
                    Start journey
                  </Link>
                  <span className="dojo__calmStart-sep" aria-hidden>
                    ·
                  </span>
                  <Link className="dojo__calmStart-link" to="/lexicon">
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
            </header>
          </div>

          <nav className="dojo__calmActionCards" aria-label="Journey, Dojo, and Trials">
            <CalmLaneCard
              lane="credo"
              to="/journey"
              linkTitle="Journey — milestones, lexicon, and learning pathways"
              title={
                <>
                  Journey <span lang="ja">(旅程)</span>
                </>
              }
              desc={
                <>
                  <strong>Learn</strong>—milestones, lexicon, profile (Kasa), and light <strong>trials</strong>{' '}
                  as you explore routes and tools.
                </>
              }
              cta="Start Journey"
            />
            <CalmLaneCard
              lane="dojo"
              to="/dojo"
              linkTitle="Dojo — issuance, templates, and guided demos"
              title={
                <>
                  Dojo <span lang="ja">(道場)</span>
                </>
              }
              desc={
                <>
                  <strong>Practice</strong>—issuance ({productTerminology.credentialFromTemplate.issueCredentialLabel}
                  ), previews, and workspace flows in the browser demo.
                </>
              }
              cta="Enter Dojo"
            />
            <CalmLaneCard
              lane="trials"
              to="/trials"
              linkTitle="Trials — structural conformance (Kensa, verify, round-trip)"
              title={
                <>
                  Trials <span lang="ja">(試験)</span>
                </>
              }
              desc={
                <>
                  <strong>Conformance</strong>—VC- and VP-shaped checks (Kensa,{' '}
                  {productTerminology.credentialInspection.name}, round-trip). Structural feedback, not
                  cryptography.
                </>
              }
              cta="Face Trials"
            />
          </nav>

          <div className="dojo__calmBand">
            <p className="dojo__calmBand-label">Tools</p>
            <nav aria-label="Tools and demos">
              <ul className="dojo__calmEssentials">
                <li>
                  <Link
                    className="dojo__calmEssentials-link--spotlight"
                    to="/discover-kasa"
                    title={`Discover ${productTerminology.kasa.name} — proof schools and personas`}
                  >
                    {productTerminology.kasa.name}
                  </Link>
                </li>
                <li>
                  <Link
                    className="dojo__calmEssentials-link--spotlight"
                    to="/faq"
                    title="FAQ — Journey, Dojo, and DOJO vs Credo"
                  >
                    FAQ
                  </Link>
                </li>
              </ul>
            </nav>
            <Link className="dojo__calmExpand dojo__calmExpand--quiet" to="/test/home-playground">
              All tools &amp; playground
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
