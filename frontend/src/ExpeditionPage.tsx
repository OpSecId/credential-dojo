import { Link } from 'react-router-dom'
import { useMemo, useState } from 'react'
import './ExpeditionPage.css'
import { EXPEDITION_STEPS } from './expeditionSteps'

export default function ExpeditionPage() {
  const [index, setIndex] = useState(0)
  const step = EXPEDITION_STEPS[index]
  const pct = useMemo(() => Math.round(((index + 1) / EXPEDITION_STEPS.length) * 100), [index])

  return (
    <div className="dojo-scene dojo-scene--night expedition">
      <div className="dojo-scene__moon" aria-hidden />
      <div className="dojo-scene__bg" aria-hidden />
      <div className="dojo-scene__grid" aria-hidden />

      <header className="expedition__header">
        <p className="expedition__eyebrow">Story Adventure</p>
        <h1 className="expedition__title">Dojo Expedition</h1>
        <p className="expedition__intro">
          Follow a narrative mission through the full credential flow, one term at a time.
        </p>
        <nav className="expedition__nav">
          <Link className="expedition__back" to="/">
            ← Home
          </Link>
          <Link className="expedition__back" to="/lexicon">
            Lexicon
          </Link>
          <Link className="expedition__back" to="/tejun-viewer">
            Tejun viewer
          </Link>
        </nav>
      </header>

      <section
        className="expedition__panel dojo-augmented dojo-augmented--panel"
        data-augmented-ui="tl-clip tr-clip bl-clip br-clip border"
      >
        <p className="expedition__progress">
          Step {index + 1} / {EXPEDITION_STEPS.length} · {pct}%
        </p>
        <div className="expedition__meter" role="progressbar" aria-valuemin={1} aria-valuenow={index + 1} aria-valuemax={EXPEDITION_STEPS.length}>
          <span style={{ width: `${pct}%` }} />
        </div>

        <p className="expedition__term">
          <strong>{step.term.name}</strong> <span lang="ja">{step.term.glyph}</span>
        </p>
        {step.unionAction ? <p className="expedition__unionAction">Action: {step.unionAction}</p> : null}
        <h2 className="expedition__stepTitle">{step.title}</h2>
        <p className="expedition__scene">{step.scene}</p>
        <p className="expedition__action">{step.action}</p>

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
            <button type="button" className="expedition__btn expedition__btn--primary" onClick={() => setIndex((i) => Math.min(EXPEDITION_STEPS.length - 1, i + 1))}>
              Next step
            </button>
          ) : (
            <button type="button" className="expedition__btn expedition__btn--primary" onClick={() => setIndex(0)}>
              Restart expedition
            </button>
          )}
        </div>
      </section>
    </div>
  )
}

