import { Link } from 'react-router-dom'
import './FaqPage.css'
import { DojoFlowPageHero, DojoFlowPageShell } from './dojoFlowPage'

const CREDO_SITE = 'https://credo.js.org/'

export default function FaqPage() {
  return (
    <DojoFlowPageShell>
      <DojoFlowPageHero title="FAQ">
        <p className="dojo-flowPage__intro">
          Short answers about <strong>DOJO</strong>, the <strong>DOJO Journey</strong>, the{' '}
          <strong>Credential Dojo</strong> workspace, and how that naming sits next to similarly spelled VC tooling.
        </p>
      </DojoFlowPageHero>

      <div className="dojo-flowPage__body">
        <div className="faq dojoZenPage dojoZenPage--wide">
          <dl className="faq__list">
            <div className="faq__item">
              <dt className="faq__q">What is this platform?</dt>
              <dd className="faq__a">
                <p>
                  <strong>DOJO</strong> is a browser-based <strong>W3C Verifiable Credentials</strong> demo
                  and practice surface: guided flows, JSON inspection, a small wallet (Kinchaku), and playful Dojo
                  vocabulary (Tehon, Menkyo, Kensa, …) mapped in the <Link to="/lexicon">Lexicon</Link>. It is meant for
                  learning and sandboxes—not a production identity provider.
                </p>
              </dd>
            </div>

            <div className="faq__item" id="faq-dojo-journey">
              <dt className="faq__q">What is the DOJO Journey?</dt>
              <dd className="faq__a">
                <p>
                  The <strong>DOJO Journey</strong> is how we invite you onto the mat: start from the home page with{' '}
                  <strong>Start DOJO journey</strong> (read this first, then shape a{' '}
                  <Link to="/create-ninja-profile">ninja profile</Link>—codename, school (Kasa), and a browser-local
                  identity). That profile step is part of the path, not a detour. Once you are signed in, you can opt
                  into the <strong>DOJO Journey</strong>: tutorial-style milestones and small <strong>trials</strong>{' '}
                  unlock as you explore routes and tools, while the journey quietly accrues <strong>learning XP</strong>{' '}
                  and playful <strong>issuer / verifier / wallet</strong> “parallel resources” depending on which pages
                  you visit—rewards curiosity, not production credentials. Progress stays in this browser only.
                </p>
                <p>
                  <strong>DOJO</strong> is our name for that training floor—the <strong>Credential Dojo</strong> path
                  where you practice issuance and verification. It is not the same word as the unrelated{' '}
                  <strong>Credo</strong> library used across the SSI ecosystem at{' '}
                  <a href={CREDO_SITE} target="_blank" rel="noopener noreferrer">
                    credo.js.org
                  </a>
                  . Credo is code you import into apps; this site is a productized playground. We like Credo, use it
                  sometimes, and are <strong>not affiliated</strong>—friends of the maintainers, not a fork in disguise.
                </p>
              </dd>
            </div>

            <div className="faq__item">
              <dt className="faq__q">What is the Credential Dojo?</dt>
              <dd className="faq__a">
                <p>
                  The <strong>Credential Dojo</strong> is the named workspace at <Link to="/dojo">/dojo</Link>: issuance
                  from a Tehon-style template (<strong>Tehon の Menkyo</strong>), previews, and related demos.{' '}
                  <strong>Enbu の Kensa</strong> (presentation-shaped JSON) lives in the <strong>same</strong> shell—use
                  the workspace tabs at the bottom to switch between issuance and Enbu inspection. Use{' '}
                  <Link to="/dojo" state={{ dojoTool: 'enbu' }}>
                    /dojo
                  </Link>{' '}
                  with the Enbu tab selected for deep links and bookmarks.
                </p>
              </dd>
            </div>
          </dl>
        </div>
      </div>
    </DojoFlowPageShell>
  )
}
