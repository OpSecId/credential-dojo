import { Link } from 'react-router-dom'
import { DojoFlowPageHero, DojoFlowPageShell } from './dojoFlowPage'
import { useJourney } from './journey/JourneyContext'
import { productTerminology } from './terminology'
import { useNinjaProfileSnapshot } from './useNinjaProfileSnapshot'
import './JourneyPage.css'

export default function JourneyPage() {
  const { state: journeyState, level: journeyLevel, startJourney, pendingStart, clearPendingStart } =
    useJourney()
  const profile = useNinjaProfileSnapshot()

  return (
    <DojoFlowPageShell>
      <DojoFlowPageHero
        title={
          <>
            Journey <span lang="ja">(旅程)</span>
          </>
        }
      >
        <p className="dojo-flowPage__intro">
          <strong>Learn</strong> the rhythm of W3C Verifiable Credentials here: milestones, lexicon, and light{' '}
          <strong>trials</strong> that unlock as you explore. Parallel <strong>learning XP</strong> and issuer /
          verifier / wallet resources accrue in the background while you visit Dojo and Trials routes—browser-local
          only, not production credentials.
        </p>
      </DojoFlowPageHero>

      <div className="dojo-flowPage__body">
        {!profile ? (
          <section className="journeyPage__panel journeyPage__panel--prompt" aria-labelledby="journey-profile-heading">
            <h2 id="journey-profile-heading" className="journeyPage__panelTitle">
              Step one — ninja profile
            </h2>
            <p className="journeyPage__panelBody">
              Shape a browser-local <strong>codename</strong> and <strong>Kasa</strong> (proof school) so issuance demos
              and journey bonuses align with your persona.
            </p>
            <Link className="journeyPage__primaryBtn" to="/create-ninja-profile">
              Create ninja profile
            </Link>
          </section>
        ) : null}

        {profile && !journeyState.started ? (
          <section className="journeyPage__panel journeyPage__panel--start" aria-labelledby="journey-start-heading">
            <h2 id="journey-start-heading" className="journeyPage__panelTitle">
              Begin the path
            </h2>
            <p className="journeyPage__panelBody">
              {pendingStart
                ? 'Profile created—opt in to interactive learning pathways? '
                : 'Opt in to track learning XP and parallel resources while you explore the Dojo and Trials lanes.'}
            </p>
            <div className="journeyPage__startActions">
              <button type="button" className="journeyPage__primaryBtn journeyPage__primaryBtn--button" onClick={startJourney}>
                Start Journey
              </button>
              {pendingStart ? (
                <button type="button" className="journeyPage__dismissBtn" onClick={clearPendingStart}>
                  Dismiss
                </button>
              ) : null}
            </div>
          </section>
        ) : null}

        {profile && journeyState.started ? (
          <section className="journeyPage__panel journeyPage__panel--progress" aria-labelledby="journey-progress-heading">
            <h2 id="journey-progress-heading" className="journeyPage__panelTitle">
              Your progress
            </h2>
            <p className="journeyPage__panelMeta">
              Level <strong>{journeyLevel.level}</strong>
              {journeyLevel.xpToNext > 0 ? (
                <>
                  {' '}
                  · ~{Math.ceil(journeyLevel.xpToNext).toLocaleString()} learning XP to next
                </>
              ) : null}
            </p>
            <div className="journeyPage__bar" role="presentation" aria-hidden>
              <div
                className="journeyPage__barFill"
                style={{ width: `${Math.round(journeyLevel.progress01 * 100)}%` }}
              />
            </div>
            <ul className="journeyPage__resourceList">
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
          </section>
        ) : null}

        <nav className="journeyHub" aria-label="Learn and explore">
          <Link className="journeyHub__card" to="/lexicon">
            <span className="journeyHub__kicker">Terms</span>
            <span className="journeyHub__title">Lexicon</span>
            <span className="journeyHub__desc">Dojo metaphors mapped to W3C VC concepts—start here if names are new.</span>
          </Link>
          <Link className="journeyHub__card" to="/faq#faq-dojo-journey">
            <span className="journeyHub__kicker">About</span>
            <span className="journeyHub__title">DOJO &amp; Journey FAQ</span>
            <span className="journeyHub__desc">What the path is, how progress works, and DOJO vs Credo.</span>
          </Link>
          <Link className="journeyHub__card" to="/discover-kasa">
            <span className="journeyHub__kicker">Schools</span>
            <span className="journeyHub__title">Discover {productTerminology.kasa.name}</span>
            <span className="journeyHub__desc">Proof-school personas, did:key issuers, and Kata samples.</span>
          </Link>
          <Link className="journeyHub__card" to="/expedition">
            <span className="journeyHub__kicker">Story</span>
            <span className="journeyHub__title">Expedition</span>
            <span className="journeyHub__desc">Narrative walkthrough across Tehon, Menkyo, Enbu, and wallet flows.</span>
          </Link>
          <Link className="journeyHub__card" to="/tejun-viewer">
            <span className="journeyHub__kicker">Map</span>
            <span className="journeyHub__title">Tejun viewer</span>
            <span className="journeyHub__desc">Interactive flow map of the expedition runbook.</span>
          </Link>
          <Link className="journeyHub__card" to={{ pathname: '/', hash: 'dojo-playground' }}>
            <span className="journeyHub__kicker">Playground</span>
            <span className="journeyHub__title">Full tools strip</span>
            <span className="journeyHub__desc">Lexicon cards, Kinchaku panel, and the wider demo playground on home.</span>
          </Link>
        </nav>
      </div>
    </DojoFlowPageShell>
  )
}
