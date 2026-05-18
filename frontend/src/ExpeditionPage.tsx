import { Link } from 'react-router-dom'
import { useEffect, useMemo, useRef, useState } from 'react'
import './App.css'
import './ExpeditionPage.css'
import { useDojoLandingTheme } from './DojoLandingThemeContext'
import { EXPEDITION_STEPS } from './expeditionSteps'
import { addWalletItem } from './walletInventory'

const STEP_ICONS = ['📜', '🧭', '🎓', '🗡️', '🔥', '🏵️', '👛', '📣', '🎭', '🛂', '🔎', '🖼️', '🤝', '🌉', '🗺️'] as const
const SCHOOL_CHOICES = [
  { id: 'ed-ryu', label: 'Ed-ryū', kata: 'eddsa-rdfc-2022' },
  { id: 'ec-ryu', label: 'Ec-ryū', kata: 'ecdsa-rdfc-2019' },
  { id: 'bbs-ryu', label: 'BBS-ryū', kata: 'bbs-2023' },
] as const

function phaseForStep(i: number): string {
  if (i <= 3) return 'define'
  if (i <= 6) return 'issue'
  if (i <= 8) return 'present'
  if (i <= 11) return 'inspect'
  return 'operate'
}

export default function ExpeditionPage() {
  const { theme } = useDojoLandingTheme()
  const [index, setIndex] = useState(0)
  const [schoolId, setSchoolId] = useState<(typeof SCHOOL_CHOICES)[number]['id']>('ed-ryu')
  const [wallet, setWallet] = useState<string[]>([])
  const [artifacts, setArtifacts] = useState<string[]>([])
  const [exchanges, setExchanges] = useState<string[]>([])
  const [exchangeTurns, setExchangeTurns] = useState(0)
  const seenStepsRef = useRef<Set<number>>(new Set())
  const step = EXPEDITION_STEPS[index]
  const pct = useMemo(() => Math.round(((index + 1) / EXPEDITION_STEPS.length) * 100), [index])
  const icon = STEP_ICONS[index] ?? '🥷'
  const phase = phaseForStep(index)
  const selectedSchool = SCHOOL_CHOICES.find((s) => s.id === schoolId) ?? SCHOOL_CHOICES[0]

  useEffect(() => {
    if (seenStepsRef.current.has(index)) return
    seenStepsRef.current.add(index)
    addWalletItem({
      type: 'artifact',
      title: `Mission Log · Step ${index + 1}`,
      subtitle: step.title,
      issuerOrSource: 'Expedition Chronicle',
      status: 'archived',
      tags: ['Mission', phase, step.term.name],
      preview: `{ "scene": "${step.scene.replace(/"/g, "'").slice(0, 160)}" }`,
    })
    if (index === 0) {
      setArtifacts((prev) => ['Tehon draft created', ...prev].slice(0, 8))
      addWalletItem({
        type: 'artifact',
        title: 'Tehon Draft',
        subtitle: 'Expedition setup artifact',
        issuerOrSource: 'Dojo Expedition',
        status: 'archived',
        tags: ['Tehon', 'Expedition'],
        preview: '{ "event": "tehon-draft-created" }',
      })
    }
    if (index === 4) {
      setWallet((prev) => [`Menkyo: First forged credential (${selectedSchool.label})`, ...prev])
      setArtifacts((prev) => [`Tehon の Menkyo issued (${selectedSchool.kata})`, ...prev].slice(0, 8))
      addWalletItem({
        type: 'credential',
        title: `Menkyo · ${selectedSchool.label}`,
        subtitle: 'First forged expedition credential',
        issuerOrSource: selectedSchool.label,
        status: 'ready',
        tags: ['Menkyo', selectedSchool.kata, 'Expedition'],
        preview: `{ "type": ["VerifiableCredential"], "issuer": "${selectedSchool.kata}" }`,
      })
    }
    if (index === 7) setExchanges((prev) => ['Verifier opened Shōkan channel', ...prev].slice(0, 10))
    if (index === 8) setArtifacts((prev) => ['Enbu package assembled', ...prev].slice(0, 8))
    if (index === 13) setExchanges((prev) => ['Randori session started', ...prev].slice(0, 10))
  }, [index, phase, selectedSchool.kata, selectedSchool.label, step.scene, step.term.name, step.title])

  const receiveShokan = () => {
    setExchanges((prev) => [`Shōkan received for ${selectedSchool.label} proofs`, ...prev].slice(0, 10))
    setArtifacts((prev) => [`Request artifact: ${selectedSchool.kata} requirements`, ...prev].slice(0, 8))
    addWalletItem({
      type: 'artifact',
      title: `Shokan Request · ${selectedSchool.label}`,
      subtitle: 'Verifier challenge received during expedition',
      issuerOrSource: 'Verifier Channel',
      status: 'queued',
      tags: ['Shokan', selectedSchool.kata, 'Request'],
      preview: `{ "challenge": "${selectedSchool.kata}-proofs" }`,
    })
  }

  const assembleEnbu = () => {
    const entry = `Enbu response #${artifacts.filter((a) => a.startsWith('Enbu response')).length + 1} (${selectedSchool.label})`
    setArtifacts((prev) => [entry, ...prev].slice(0, 8))
    addWalletItem({
      type: 'artifact',
      title: `Enbu Response · ${selectedSchool.label}`,
      subtitle: 'Presentation bundle assembled',
      issuerOrSource: 'Local wallet composer',
      status: 'ready',
      tags: ['Enbu', selectedSchool.kata, 'Response'],
      preview: '{ "type": ["VerifiablePresentation"] }',
    })
  }

  const runExchangeTurn = () => {
    const turn = exchangeTurns + 1
    setExchangeTurns(turn)
      setExchanges((prev) => [`Randori turn ${turn}: verifier ↔ holder (${selectedSchool.kata})`, ...prev].slice(0, 10))
    if (turn % 2 === 0) {
      setWallet((prev) => [`Menkyo proof receipt #${turn / 2} (${selectedSchool.label})`, ...prev].slice(0, 8))
      addWalletItem({
        type: 'credential',
        title: `Menkyo Proof Receipt #${turn / 2}`,
        subtitle: 'Received from Randori exchange turn',
        issuerOrSource: selectedSchool.label,
        status: 'ready',
        tags: ['Menkyo', 'Randori', selectedSchool.kata],
        preview: `{ "turn": ${turn}, "school": "${selectedSchool.id}" }`,
      })
    }
  }

  return (
    <div className={`dojo-scene dojo-scene--${theme} dojo-scene--zen`}>
      <div className="dojo-scene__moon" aria-hidden />
      <div className="dojo-scene__bg" aria-hidden />
      <div className="dojo-scene__grid" aria-hidden />

      <div className="expedition dojoZenPage dojoZenPage--wide">
        <header className="dojoZenPage__header">
          <p className="dojoZenPage__eyebrow">Dojo</p>
          <h1 className="dojoZenPage__title">Dojo Expedition</h1>
          <p className="dojoZenPage__intro">
            Story adventure: march through a credential-combat campaign—earn Menkyo, answer Shōkan challenges, and keep
            Kinchaku stocked after every step.
          </p>
          <nav className="dojoZenPage__nav" aria-label="Expedition navigation">
            <Link className="dojoZenPage__back" to="/" title="Back Home">
              ← Back Home
            </Link>
            <Link className="dojoZenPage__back" to="/lexicon">
              Lexicon
            </Link>
            <Link className="dojoZenPage__back" to="/tejun-viewer">
              Tejun viewer
            </Link>
            <Link className="dojoZenPage__back" to="/kinchaku">
              Kinchaku
            </Link>
          </nav>
        </header>

        <section className="expedition__layout">
        <aside
          className={`expedition__visual expedition__visual--${phase} dojo-augmented dojo-augmented--panel`}
          data-augmented-ui="tl-clip tr-clip bl-clip br-clip border"
        >
          <p className="expedition__visualLabel">Current stage</p>
          <p className="expedition__visualIcon" aria-hidden>
            {icon}
          </p>
          <p className="expedition__visualTitle">{step.title}</p>
          <p className="expedition__visualTerm">
            {step.term.name} <span lang="ja">{step.term.glyph}</span>
          </p>
          {step.unionAction ? <p className="expedition__visualAction">Action: {step.unionAction}</p> : null}
          <div className="expedition__stepRail" aria-label="Step chooser">
            {EXPEDITION_STEPS.map((s, i) => (
              <button
                key={`${s.title}-${i}`}
                type="button"
                className={`expedition__stepDot${i === index ? ' expedition__stepDot--active' : ''}`}
                onClick={() => setIndex(i)}
                title={`Step ${i + 1}: ${s.title}`}
                aria-label={`Go to step ${i + 1}`}
              />
            ))}
          </div>
        </aside>

        <div
          className="expedition__panel dojo-augmented dojo-augmented--panel"
          data-augmented-ui="tl-clip tr-clip bl-clip br-clip border"
        >
          <p className="expedition__progress">
            Step {index + 1} / {EXPEDITION_STEPS.length} · {pct}%
          </p>
          <div
            className="expedition__meter"
            role="progressbar"
            aria-valuemin={1}
            aria-valuenow={index + 1}
            aria-valuemax={EXPEDITION_STEPS.length}
          >
            <span style={{ width: `${pct}%` }} />
          </div>

          <h2 className="expedition__stepTitle">{step.title}</h2>
          <p className="expedition__scene">{step.scene}</p>
          <p className="expedition__action">{step.action}</p>

          {index === 2 ? (
            <div className="expedition__interact">
              <p className="expedition__choiceLabel">Choose issuer school</p>
              <div className="expedition__choiceRow" role="radiogroup" aria-label="Issuer school">
                {SCHOOL_CHOICES.map((school) => (
                  <button
                    key={school.id}
                    type="button"
                    role="radio"
                    aria-checked={schoolId === school.id}
                    className={`expedition__choiceBtn${schoolId === school.id ? ' expedition__choiceBtn--active' : ''}`}
                    onClick={() => {
                      setSchoolId(school.id)
                      setExchanges((prev) => [`Issuer school chosen: ${school.label}`, ...prev].slice(0, 10))
                      addWalletItem({
                        type: 'artifact',
                        title: `School Selection · ${school.label}`,
                        subtitle: 'Issuer school chosen for expedition',
                        issuerOrSource: 'Dojo Expedition',
                        status: 'archived',
                        tags: ['Kasa', school.kata, 'Choice'],
                        preview: `{ "school": "${school.id}", "kata": "${school.kata}" }`,
                      })
                    }}
                    title={`${school.label} · ${school.kata}`}
                  >
                    {school.label}
                  </button>
                ))}
              </div>
              <p className="expedition__choiceHint">
                Active school: <strong>{selectedSchool.label}</strong> ({selectedSchool.kata})
              </p>
            </div>
          ) : null}

          {index === 7 ? (
            <div className="expedition__interact">
              <button type="button" className="expedition__btn expedition__btn--primary" onClick={receiveShokan}>
                Receive Shōkan
              </button>
            </div>
          ) : null}
          {index === 8 ? (
            <div className="expedition__interact">
              <button type="button" className="expedition__btn expedition__btn--primary" onClick={assembleEnbu}>
                Assemble Enbu Artifact
              </button>
            </div>
          ) : null}
          {index === 13 ? (
            <div className="expedition__interact">
              <button type="button" className="expedition__btn expedition__btn--primary" onClick={runExchangeTurn}>
                Run Randori Exchange Turn
              </button>
            </div>
          ) : null}

          <div className="expedition__telemetry">
            <section className="expedition__logCard">
              <p className="expedition__logTitle">Wallet Store</p>
              {wallet.length ? (
                wallet.slice(0, 5).map((item, i) => (
                  <p key={`${item}-${i}`} className="expedition__logItem">
                    {item}
                  </p>
                ))
              ) : (
                <p className="expedition__logEmpty">No credentials stored yet.</p>
              )}
            </section>
            <section className="expedition__logCard">
              <p className="expedition__logTitle">Exchange Record</p>
              {exchanges.length ? (
                exchanges.slice(0, 6).map((item, i) => (
                  <p key={`${item}-${i}`} className="expedition__logItem">
                    {item}
                  </p>
                ))
              ) : (
                <p className="expedition__logEmpty">No exchange events yet.</p>
              )}
            </section>
            <section className="expedition__logCard">
              <p className="expedition__logTitle">Artifact Ledger</p>
              {artifacts.length ? (
                artifacts.slice(0, 6).map((item, i) => (
                  <p key={`${item}-${i}`} className="expedition__logItem">
                    {item}
                  </p>
                ))
              ) : (
                <p className="expedition__logEmpty">No artifacts recorded yet.</p>
              )}
            </section>
          </div>

          <div className="expedition__actions">
            <button
              type="button"
              className="expedition__btn"
              onClick={() => setIndex((i) => Math.max(0, i - 1))}
              disabled={index === 0}
            >
              Previous
            </button>
            {index < EXPEDITION_STEPS.length - 1 ? (
              <button
                type="button"
                className="expedition__btn expedition__btn--primary"
                onClick={() => setIndex((i) => Math.min(EXPEDITION_STEPS.length - 1, i + 1))}
              >
                Next step
              </button>
            ) : (
              <button
                type="button"
                className="expedition__btn expedition__btn--primary"
                onClick={() => setIndex(0)}
              >
                Restart expedition
              </button>
            )}
          </div>
        </div>
      </section>
      </div>
    </div>
  )
}

