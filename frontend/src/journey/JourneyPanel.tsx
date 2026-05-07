import { useEffect, useId, useRef } from 'react'
import { useJourney } from './JourneyContext'
import './JourneyPanel.css'

export default function JourneyPanel() {
  const { state, level, panelOpen, setPanelOpen, togglePanel, startJourney } = useJourney()
  const ref = useRef<HTMLDivElement>(null)
  const titleId = useId()

  useEffect(() => {
    if (!panelOpen) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setPanelOpen(false)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [panelOpen, setPanelOpen])

  return (
    <div className="journey-dock">
      <button type="button" className="journey-fab" aria-expanded={panelOpen} onClick={togglePanel}>
        <span aria-hidden>旅</span>
        <span>Journey</span>
      </button>
      {panelOpen ? (
        <div
          ref={ref}
          className="journey-panel dojo-augmented dojo-augmented--panel"
          data-augmented-ui="tl-clip tr-clip br-clip bl-clip border"
          role="dialog"
          aria-modal="false"
          aria-labelledby={titleId}
        >
          <h2 id={titleId} className="journey-panel__title">Learning Journey</h2>
          {!state.started ? (
            <div className="journey-panel__start">
              <p>Start your parallel journey to grow issuer, verifier, and cloud wallet resources.</p>
              <button type="button" className="journey-panel__btn" onClick={startJourney}>
                Start journey
              </button>
            </div>
          ) : (
            <>
              <p className="journey-panel__meta">
                Level {level.level} · next in ~{Math.ceil(level.xpToNext).toLocaleString()} XP
              </p>
              <div className="journey-panel__bar" role="presentation">
                <div className="journey-panel__barFill" style={{ width: `${Math.round(level.progress01 * 100)}%` }} />
              </div>
              <ul className="journey-panel__list">
                <li>Issuer resources: <strong>{Math.floor(state.issuerTokens).toLocaleString()}</strong></li>
                <li>Verifier resources: <strong>{Math.floor(state.verifierTokens).toLocaleString()}</strong></li>
                <li>Cloud wallet resources: <strong>{Math.floor(state.walletTokens).toLocaleString()}</strong></li>
              </ul>
            </>
          )}
        </div>
      ) : null}
    </div>
  )
}
