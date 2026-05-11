import { useEffect, useId, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { useJourney } from './journey/JourneyContext'
import {
  computePerkState,
  computeTrackProgress,
  NOVICE_LESSONS,
  NOVICE_PERKS,
} from './novice/noviceIdleTypes'
import { useNoviceIdle } from './novice/NoviceIdleContext'
import { useNinjaProfileSnapshot } from './useNinjaProfileSnapshot'
import './DojoProgressHub.css'

export default function DojoProgressHub() {
  const { state: journeyState, level: journeyLevel, startJourney } = useJourney()
  const { state: noviceState, rank, insightPerSec } = useNoviceIdle()
  const profile = useNinjaProfileSnapshot()
  const [open, setOpen] = useState(false)
  const panelRef = useRef<HTMLDivElement>(null)
  const titleId = useId()

  const doneCount = NOVICE_LESSONS.filter((L) => noviceState.lessonsDone[L.id]).length
  const issuer = computeTrackProgress(noviceState.issuerXp)
  const verifier = computeTrackProgress(noviceState.verifierXp)
  const wallet = computeTrackProgress(noviceState.walletXp)
  const perks = computePerkState({
    issuerXp: noviceState.issuerXp,
    verifierXp: noviceState.verifierXp,
    verifiedCount: noviceState.verifiedCount,
  })

  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open])

  useEffect(() => {
    if (!open) return
    const onPointer = (e: MouseEvent) => {
      const t = e.target as Node
      if (panelRef.current && !panelRef.current.contains(t)) {
        const fab = document.querySelector('.dojo-hub-fab')
        if (fab && fab.contains(t)) return
        setOpen(false)
      }
    }
    window.addEventListener('click', onPointer, true)
    return () => window.removeEventListener('click', onPointer, true)
  }, [open])

  const onStartJourney = () => {
    startJourney()
    setOpen(true)
  }

  return (
    <div className="dojo-hub-dock" aria-live="polite">
      <button
        type="button"
        className="dojo-hub-fab"
        aria-expanded={open}
        aria-controls={open ? 'dojo-progress-hub' : undefined}
        onClick={() => setOpen((o) => !o)}
        title="Your dojo — rank, journey, tracks, and achievements"
      >
        <span className="dojo-hub-fab__glyph" aria-hidden>
          道
        </span>
        <span className="dojo-hub-fab__label">Your dojo</span>
        <span className="dojo-hub-fab__meta" aria-hidden>
          <span lang="ja">{rank.rank.titleJa}</span>
          {journeyState.started ? <span className="dojo-hub-fab__sep">·</span> : null}
          {journeyState.started ? <span>L{journeyLevel.level}</span> : null}
        </span>
      </button>

      {open ? (
        <div
          ref={panelRef}
          id="dojo-progress-hub"
          className="dojo-hub-panel"
          role="dialog"
          aria-modal="false"
          aria-labelledby={titleId}
        >
          <header className="dojo-hub__head">
            <div>
              <h2 id={titleId} className="dojo-hub__title">
                Your dojo
              </h2>
              <p className="dojo-hub__sub">
                Rank, parallel journey resources, practice tracks, and achievements — one place.
              </p>
              {!profile ? (
                <p className="dojo-hub__profile dojo-hub__profile--muted">
                  No ninja profile —{' '}
                  <Link to="/create-ninja-profile">create one</Link> to sign into the shell and boost some bonuses.
                </p>
              ) : null}
            </div>
            <button type="button" className="dojo-hub__close" onClick={() => setOpen(false)} aria-label="Close panel">
              ×
            </button>
          </header>

          <section className="dojo-hub__stats" aria-label="Your stats">
            <div className="dojo-hub__stat">
              <p className="dojo-hub__statLabel">Insight</p>
              <p className="dojo-hub__statValue">{Math.floor(noviceState.totalInsight).toLocaleString()}</p>
              <p className="dojo-hub__statHint">+{insightPerSec.toFixed(2)} /s</p>
            </div>
            <div className="dojo-hub__stat">
              <p className="dojo-hub__statLabel">Rank</p>
              <p className="dojo-hub__statValue">
                {rank.rank.titleEn} <span lang="ja">{rank.rank.titleJa}</span>
              </p>
              <p className="dojo-hub__statHint">
                {rank.insightToNext !== null
                  ? `~${Math.max(0, Math.ceil(rank.insightToNext)).toLocaleString()} to next`
                  : 'Top rank'}
              </p>
            </div>
            <div className="dojo-hub__stat">
              <p className="dojo-hub__statLabel">Journey</p>
              <p className="dojo-hub__statValue">{journeyState.started ? `Level ${journeyLevel.level}` : 'Paused'}</p>
              <p className="dojo-hub__statHint">
                {journeyState.started
                  ? `~${Math.ceil(journeyLevel.xpToNext).toLocaleString()} XP to next`
                  : 'Start to accrue parallel resources'}
              </p>
            </div>
            <div className="dojo-hub__stat">
              <p className="dojo-hub__statLabel">Achievements</p>
              <p className="dojo-hub__statValue">
                {doneCount}/{NOVICE_LESSONS.length}
              </p>
              <p className="dojo-hub__statHint">Tours & milestones</p>
            </div>
          </section>

          <section className="dojo-hub__rank" aria-label="Rank progress">
            <p className="dojo-hub__blurb">{rank.rank.blurb}</p>
            {rank.insightToNext !== null ? (
              <div className="dojo-hub__bar" role="presentation">
                <div className="dojo-hub__barFill" style={{ width: `${Math.round(rank.progress01 * 100)}%` }} />
              </div>
            ) : (
              <p className="dojo-hub__maxRank">Highest rank — keep practicing for track XP.</p>
            )}
          </section>

          <section className="dojo-hub__journey" aria-label="Learning journey">
            <h3 className="dojo-hub__h3">Parallel journey</h3>
            {!journeyState.started ? (
              <div className="dojo-hub__journeyStart">
                <p>
                  Grow issuer, verifier, and cloud wallet <strong>resources</strong> in the background while you use the
                  dojo. This is separate from insight rank — both reward showing up on learning routes.
                </p>
                <button type="button" className="dojo-hub__btn" onClick={onStartJourney}>
                  Start journey
                </button>
              </div>
            ) : (
              <>
                <div className="dojo-hub__bar dojo-hub__bar--journey" role="presentation">
                  <div
                    className="dojo-hub__barFill dojo-hub__barFill--journey"
                    style={{ width: `${Math.round(journeyLevel.progress01 * 100)}%` }}
                  />
                </div>
                <ul className="dojo-hub__journeyList">
                  <li>
                    Issuer resources: <strong>{Math.floor(journeyState.issuerTokens).toLocaleString()}</strong>
                  </li>
                  <li>
                    Verifier resources: <strong>{Math.floor(journeyState.verifierTokens).toLocaleString()}</strong>
                  </li>
                  <li>
                    Wallet resources: <strong>{Math.floor(journeyState.walletTokens).toLocaleString()}</strong>
                  </li>
                </ul>
              </>
            )}
          </section>

          <section className="dojo-hub__tracks" aria-label="Practice tracks">
            <h3 className="dojo-hub__h3">Practice tracks</h3>
            <p className="dojo-hub__tracksIntro">
              Tutorial-style paths — level up by issuing, verifying, and moving credentials through Kinchaku-style
              flows.
            </p>

            <article className="dojo-hub-track">
              <header className="dojo-hub-track__head">
                <p className="dojo-hub-track__title">Issuer</p>
                <p className="dojo-hub-track__level">Lv {issuer.level}</p>
              </header>
              <div className="dojo-hub-track__bar" role="presentation">
                <div
                  className="dojo-hub-track__fill dojo-hub-track__fill--issuer"
                  style={{ width: `${Math.round(issuer.progress01 * 100)}%` }}
                />
              </div>
              <p className="dojo-hub-track__meta">
                Issued: <strong>{Math.floor(noviceState.issuedCount).toLocaleString()}</strong> · next ~
                {Math.ceil(issuer.xpToNext).toLocaleString()} XP
              </p>
            </article>

            <article className="dojo-hub-track">
              <header className="dojo-hub-track__head">
                <p className="dojo-hub-track__title">Verifier</p>
                <p className="dojo-hub-track__level">Lv {verifier.level}</p>
              </header>
              <div className="dojo-hub-track__bar" role="presentation">
                <div
                  className="dojo-hub-track__fill dojo-hub-track__fill--verifier"
                  style={{ width: `${Math.round(verifier.progress01 * 100)}%` }}
                />
              </div>
              <p className="dojo-hub-track__meta">
                Verified: <strong>{Math.floor(noviceState.verifiedCount).toLocaleString()}</strong> · next ~
                {Math.ceil(verifier.xpToNext).toLocaleString()} XP
              </p>
            </article>

            <article className="dojo-hub-track">
              <header className="dojo-hub-track__head">
                <p className="dojo-hub-track__title">Cloud wallet</p>
                <p className="dojo-hub-track__level">Lv {wallet.level}</p>
              </header>
              <div className="dojo-hub-track__bar" role="presentation">
                <div
                  className="dojo-hub-track__fill dojo-hub-track__fill--wallet"
                  style={{ width: `${Math.round(wallet.progress01 * 100)}%` }}
                />
              </div>
              <p className="dojo-hub-track__meta">
                Received <strong>{Math.floor(noviceState.receivedCount).toLocaleString()}</strong> · presented{' '}
                <strong>{Math.floor(noviceState.presentedCount).toLocaleString()}</strong> · next ~
                {Math.ceil(wallet.xpToNext).toLocaleString()} XP
              </p>
            </article>
          </section>

          <section className="dojo-hub__perks" aria-label="Unlocked perks">
            <h3 className="dojo-hub__h3">Perks</h3>
            <ul className="dojo-hub__perkList">
              {NOVICE_PERKS.map((perk) => {
                const unlocked = perk.id === 'validity_watch' ? perks.validityWatch : perks.revocationGuard
                return (
                  <li key={perk.id} className={`dojo-hub__perk${unlocked ? ' dojo-hub__perk--on' : ''}`}>
                    <p className="dojo-hub__perkTitle">
                      {unlocked ? '◆' : '◇'} {perk.title}
                    </p>
                    <p className="dojo-hub__perkDesc">{unlocked ? perk.description : perk.unlockHint}</p>
                  </li>
                )
              })}
            </ul>
          </section>

          <section className="dojo-hub__achievements" aria-label="Achievements and guided tours">
            <h3 className="dojo-hub__h3">Achievements & tours</h3>
            <p className="dojo-hub__achHint">
              Check these off as you explore — each completion nudges your passive insight rate.
            </p>
            <ul className="dojo-hub__lessonList">
              {NOVICE_LESSONS.map((L) => {
                const done = noviceState.lessonsDone[L.id] === true
                return (
                  <li key={L.id} className={`dojo-hub__lesson${done ? ' dojo-hub__lesson--done' : ''}`}>
                    <span className="dojo-hub__lessonMark" aria-hidden>
                      {done ? '✓' : '○'}
                    </span>
                    <div>
                      <p className="dojo-hub__lessonLabel">{L.label}</p>
                      <p className="dojo-hub__lessonTip">{L.tip}</p>
                    </div>
                  </li>
                )
              })}
            </ul>
          </section>

          <footer className="dojo-hub__foot">
            <p>
              On the <Link to="/">home dojo</Link>, the <strong>training focus</strong> strip boosts insight while you
              stay sharp — kata, Kinchaku, and school switches feed all tracks. Hidden tabs earn slower.
            </p>
            <p className="dojo-hub__footNote">Progress saves in this browser only.</p>
          </footer>
        </div>
      ) : null}
    </div>
  )
}
