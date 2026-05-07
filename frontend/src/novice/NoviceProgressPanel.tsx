import { useEffect, useId, useRef } from 'react'
import { Link } from 'react-router-dom'
import { computePerkState, computeTrackProgress, NOVICE_LESSONS, NOVICE_PERKS } from './noviceIdleTypes'
import { useNoviceIdle } from './NoviceIdleContext'
import './NoviceProgressPanel.css'

export default function NoviceProgressPanel() {
  const { state, rank, insightPerSec, panelOpen, setPanelOpen, togglePanel } = useNoviceIdle()
  const panelRef = useRef<HTMLDivElement>(null)
  const titleId = useId()

  useEffect(() => {
    if (!panelOpen) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setPanelOpen(false)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [panelOpen, setPanelOpen])

  useEffect(() => {
    if (!panelOpen) return
    const onPointer = (e: MouseEvent) => {
      const t = e.target as Node
      if (panelRef.current && !panelRef.current.contains(t)) {
        const fab = document.querySelector('.novice-fab')
        if (fab && fab.contains(t)) return
        setPanelOpen(false)
      }
    }
    window.addEventListener('click', onPointer, true)
    return () => window.removeEventListener('click', onPointer, true)
  }, [panelOpen, setPanelOpen])

  const doneCount = NOVICE_LESSONS.filter((L) => state.lessonsDone[L.id]).length
  const issuer = computeTrackProgress(state.issuerXp)
  const verifier = computeTrackProgress(state.verifierXp)
  const wallet = computeTrackProgress(state.walletXp)
  const perks = computePerkState({
    issuerXp: state.issuerXp,
    verifierXp: state.verifierXp,
    verifiedCount: state.verifiedCount,
  })

  return (
    <div className="novice-dock" aria-live="polite">
      <button
        type="button"
        className="novice-fab"
        aria-expanded={panelOpen}
        aria-controls={panelOpen ? 'novice-progress-panel' : undefined}
        onClick={togglePanel}
        title="Dojo progression — issuer, verifier, and cloud wallet paths"
      >
        <span className="novice-fab__glyph" aria-hidden>
          修
        </span>
        <span className="novice-fab__label">Dojo progress</span>
        <span className="novice-fab__rank" aria-hidden>
          {rank.rank.titleJa}
        </span>
      </button>

      {panelOpen ? (
        <div
          ref={panelRef}
          id="novice-progress-panel"
          className="novice-panel dojo-augmented dojo-augmented--panel"
          data-augmented-ui="tl-clip tr-clip br-clip bl-clip border"
          role="dialog"
          aria-modal="false"
          aria-labelledby={titleId}
        >
          <header className="novice-panel__head">
            <div>
              <h2 id={titleId} className="novice-panel__title">
                Dojo operations path
              </h2>
              <p className="novice-panel__sub">
                Idle progression: become an issuer, a verifier, and a cloud wallet operator
              </p>
            </div>
            <button
              type="button"
              className="novice-panel__close"
              onClick={() => setPanelOpen(false)}
              aria-label="Close novice path panel"
            >
              ×
            </button>
          </header>

          <section className="novice-panel__rank" aria-label="Current rank">
            <div className="novice-panel__rankRow">
              <p className="novice-panel__rankTitle">
                <span className="novice-panel__rankEn">{rank.rank.titleEn}</span>{' '}
                <span lang="ja" className="novice-panel__rankJa">
                  {rank.rank.titleJa}
                </span>
              </p>
              <p className="novice-panel__insightRate">
                +{insightPerSec.toFixed(2)} <span className="novice-panel__unit">insight/s</span>
              </p>
            </div>
            <p className="novice-panel__blurb">{rank.rank.blurb}</p>
            {rank.insightToNext !== null ? (
              <>
                <div className="novice-panel__bar" role="presentation">
                  <div
                    className="novice-panel__barFill"
                    style={{ width: `${Math.round(rank.progress01 * 100)}%` }}
                  />
                </div>
                <p className="novice-panel__next">
                  Next rank in ~
                  {Math.max(0, Math.ceil(rank.insightToNext ?? 0)).toLocaleString()} insight
                </p>
              </>
            ) : (
              <p className="novice-panel__next novice-panel__next--max">Highest rank — keep practicing.</p>
            )}
            <p className="novice-panel__total">
              Total insight{' '}
              <strong>{Math.floor(state.totalInsight).toLocaleString()}</strong>
            </p>
          </section>

          <section className="novice-panel__tracks" aria-label="Operational progression tracks">
            <h3 className="novice-panel__h3">Progression tracks</h3>

            <article className="novice-track">
              <header className="novice-track__head">
                <p className="novice-track__title">Issuer progression</p>
                <p className="novice-track__level">Lv {issuer.level}</p>
              </header>
              <div className="novice-track__bar" role="presentation">
                <div
                  className="novice-track__barFill novice-track__barFill--issuer"
                  style={{ width: `${Math.round(issuer.progress01 * 100)}%` }}
                />
              </div>
              <p className="novice-track__meta">
                Issued credentials: <strong>{Math.floor(state.issuedCount).toLocaleString()}</strong>
              </p>
              <p className="novice-track__meta">
                Next level in ~{Math.ceil(issuer.xpToNext).toLocaleString()} issuer XP
              </p>
            </article>

            <article className="novice-track">
              <header className="novice-track__head">
                <p className="novice-track__title">Verifier progression</p>
                <p className="novice-track__level">Lv {verifier.level}</p>
              </header>
              <div className="novice-track__bar" role="presentation">
                <div
                  className="novice-track__barFill novice-track__barFill--verifier"
                  style={{ width: `${Math.round(verifier.progress01 * 100)}%` }}
                />
              </div>
              <p className="novice-track__meta">
                Verified credentials/presentations:{' '}
                <strong>{Math.floor(state.verifiedCount).toLocaleString()}</strong>
              </p>
              <p className="novice-track__meta">
                Next level in ~{Math.ceil(verifier.xpToNext).toLocaleString()} verifier XP
              </p>
            </article>

            <article className="novice-track">
              <header className="novice-track__head">
                <p className="novice-track__title">Cloud wallet services</p>
                <p className="novice-track__level">Lv {wallet.level}</p>
              </header>
              <div className="novice-track__bar" role="presentation">
                <div
                  className="novice-track__barFill novice-track__barFill--wallet"
                  style={{ width: `${Math.round(wallet.progress01 * 100)}%` }}
                />
              </div>
              <p className="novice-track__meta">
                Received credentials: <strong>{Math.floor(state.receivedCount).toLocaleString()}</strong>
              </p>
              <p className="novice-track__meta">
                Presented credentials: <strong>{Math.floor(state.presentedCount).toLocaleString()}</strong>
              </p>
              <p className="novice-track__meta">
                Next level in ~{Math.ceil(wallet.xpToNext).toLocaleString()} wallet XP
              </p>
            </article>
          </section>

          <section className="novice-panel__perks" aria-label="Unlocked operational perks">
            <h3 className="novice-panel__h3">Perks</h3>
            <ul className="novice-panel__perkList">
              {NOVICE_PERKS.map((perk) => {
                const unlocked =
                  perk.id === 'validity_watch' ? perks.validityWatch : perks.revocationGuard
                return (
                  <li
                    key={perk.id}
                    className={`novice-panel__perk${unlocked ? ' novice-panel__perk--on' : ''}`}
                  >
                    <p className="novice-panel__perkTitle">
                      {unlocked ? '◆' : '◇'} {perk.title}
                    </p>
                    <p className="novice-panel__perkDesc">
                      {unlocked ? perk.description : perk.unlockHint}
                    </p>
                  </li>
                )
              })}
            </ul>
          </section>

          <section className="novice-panel__lessons" aria-label="Platform lessons">
            <h3 className="novice-panel__h3">Lessons</h3>
            <p className="novice-panel__lessonsMeta">
              {doneCount} / {NOVICE_LESSONS.length} complete · bonuses stack into insight rate
            </p>
            <ul className="novice-panel__lessonList">
              {NOVICE_LESSONS.map((L) => {
                const done = state.lessonsDone[L.id] === true
                return (
                  <li
                    key={L.id}
                    className={`novice-panel__lesson${done ? ' novice-panel__lesson--done' : ''}`}
                  >
                    <span className="novice-panel__lessonMark" aria-hidden>
                      {done ? '✓' : '○'}
                    </span>
                    <div>
                      <p className="novice-panel__lessonLabel">{L.label}</p>
                      <p className="novice-panel__lessonTip">{L.tip}</p>
                    </div>
                  </li>
                )
              })}
            </ul>
          </section>

          <footer className="novice-panel__foot">
            <p>
              On the <Link to="/">home dojo</Link>, the <strong>training focus</strong> meter boosts
              passive insight while you stay sharp — kata, Kinchaku, and school switches feed issuer,
              verifier, and wallet growth.
            </p>
            <p className="novice-panel__footNote">
              Progress saves in this browser only. Hidden tabs earn insight slower.
            </p>
          </footer>
        </div>
      ) : null}
    </div>
  )
}
