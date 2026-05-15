import type { ReactNode } from 'react'
import { Fragment, useMemo } from 'react'
import { Link, useLocation } from 'react-router-dom'
import './LexiconPage.css'
import { DojoFlowPageHero, DojoFlowPageShell } from './dojoFlowPage'
import { LEXICON_ARTICLES, lexiconAnchorForBoldSegment } from './lexiconData'
import { productTerminology } from './terminology'
import type { LexiconKey } from './lexiconData'

/** Renders `**segments**` as bold; known Dojo terms link to `#article-id` on this page. */
function formatLexiconRichText(text: string): ReactNode {
  const parts = text.split(/\*\*/)
  return parts.map((chunk, i) => {
    if (i % 2 === 0) {
      return <Fragment key={i}>{chunk}</Fragment>
    }
    const anchorKey = lexiconAnchorForBoldSegment(chunk)
    if (anchorKey) {
      return (
        <a
          key={i}
          href={`#${anchorKey}`}
          className="lex-term-link"
          title={`Jump to ${chunk.trim()} in glossary`}
        >
          {chunk}
        </a>
      )
    }
    return <strong key={i}>{chunk}</strong>
  })
}

const FLOW_STEPS: readonly { label: string; anchor: LexiconKey }[] = [
  { label: 'Tehon', anchor: 'template' },
  { label: 'Tehon の Menkyo', anchor: 'credentialFromTemplate' },
  { label: 'Menkyo', anchor: 'credential' },
  { label: 'Shōkan', anchor: 'presentationRequest' },
  { label: 'Enbu', anchor: 'presentation' },
  { label: 'Kensa', anchor: 'presentationInspection' },
]

function tryLinkForKey(key: LexiconKey): { to: string; label: string } {
  if (key === 'presentationInspection') return { to: '/kensa', label: 'Try in Kensa' }
  if (key === 'credentialInspection') return { to: '/verify', label: 'Try in Kensa' }
  if (key === 'credentialFromTemplate') return { to: '/dojo/issuance', label: 'Try issuance' }
  if (key === 'render' || key === 'katachi') return { to: '/json-explorer', label: 'Try in Shinbi' }
  if (key === 'kasa' || key === 'cryptosuites') return { to: '/discover-kasa', label: 'Try in Discover Kasa' }
  if (key === 'workflow' || key === 'exchange' || key === 'handshake') return { to: '/tejun-viewer', label: 'Try in Tejun viewer' }
  return { to: '/expedition', label: 'Try in Expedition' }
}

export default function LexiconPage() {
  const location = useLocation()
  const printMode = useMemo(() => new URLSearchParams(location.search).get('print') === '1', [location.search])

  return (
    <DojoFlowPageShell sceneExtraClass={printMode ? 'lex-print' : undefined}>
      <DojoFlowPageHero title="Lexicon">
        <p className="dojo-flowPage__intro">
          <strong>What this is.</strong> Japanese terms in the product are <strong>metaphors for copy and navigation</strong>—a shared vocabulary, not a security model. They are <strong>not</strong> claims about cryptographic strength, compliance, or threat models.
        </p>
        <p className="dojo-flowPage__introFollow">
          <strong>What each entry does.</strong> We give the word in its everyday or dōjō sense, then how we use it for <strong>W3C Verifiable Credentials</strong>, holder/issuer language, and this CRMS.
        </p>
      </DojoFlowPageHero>

      <div className="dojo-flowPage__body">
        <div className="lex dojoZenPage dojoZenPage--wide">
        <ol
          className="lex__toc dojo-augmented dojo-augmented--toc"
          data-augmented-ui="tl-clip br-clip border"
          aria-label="On this page"
        >
          {LEXICON_ARTICLES.map((article) => {
            const t = productTerminology[article.key]
            return (
              <li key={article.key}>
                <a href={`#${article.key}`} title={article.credentialTerm}>
                  {t.name} <span lang="ja">{t.glyph}</span>
                </a>
              </li>
            )
          })}
        </ol>

        <section className="lex-flow dojo-augmented dojo-augmented--panel" data-augmented-ui="tl-clip tr-clip bl-clip br-clip border">
          <h2 className="lex-flow__title">Credential Journey Map</h2>
          <p className="lex-flow__desc">
            Quick orientation for the full line: definition, issuance, request, response, inspection.
          </p>
          <div className="lex-flow__rail" aria-label="Flow map">
            {FLOW_STEPS.map((step, i) => (
              <Fragment key={step.anchor}>
                <a className="lex-flow__chip" href={`#${step.anchor}`}>
                  {step.label}
                </a>
                {i < FLOW_STEPS.length - 1 ? <span className="lex-flow__arrow">→</span> : null}
              </Fragment>
            ))}
          </div>
        </section>

        <section className="lex-contrast dojo-augmented dojo-augmented--panel" data-augmented-ui="tl-clip tr-clip bl-clip br-clip border">
          <h2 className="lex-contrast__title">Katachi vs Kata</h2>
          <div className="lex-contrast__grid">
            <article className="lex-contrast__card">
              <p className="lex-contrast__label">
                {productTerminology.katachi.name} <span lang="ja">{productTerminology.katachi.glyph}</span>
              </p>
              <p className="lex-contrast__body">Data form: schema, context, and claim structure constraints.</p>
            </article>
            <article className="lex-contrast__card">
              <p className="lex-contrast__label">
                {productTerminology.cryptosuites.name} <span lang="ja">{productTerminology.cryptosuites.glyph}</span>
              </p>
              <p className="lex-contrast__body">Proof form: cryptosuite, canonicalization, and signature rules.</p>
            </article>
          </div>
        </section>

        <p className="lex__printHint">For documentation/offline use, open this page with <code>?print=1</code>.</p>

        <div className="lex__articles">
          {LEXICON_ARTICLES.map((article) => {
            const t = productTerminology[article.key]
            const tryLink = tryLinkForKey(article.key)
            return (
              <article
                key={article.key}
                id={article.key}
                className="lex-article dojo-augmented dojo-augmented--panel"
                data-augmented-ui="tl-clip tr-clip bl-clip br-clip border"
              >
                <h2 className="lex-article__heading">
                  <span className="lex-article__name">{t.name}</span>{' '}
                  <span className="lex-article__glyph" lang="ja">
                    {t.glyph}
                  </span>
                </h2>
                <p className="lex-article__credentialLabel">Credential platform meaning</p>
                <p className="lex-article__credential">{article.credentialTerm}</p>
                <p className="lex-article__try">
                  <Link className="lex-article__tryLink" to={tryLink.to}>
                    {tryLink.label}
                  </Link>
                </p>

                <h3 className="lex-article__sub">Original meaning</h3>
                {article.literal.map((p, i) => (
                  <p key={i} className="lex-article__p">
                    {formatLexiconRichText(p)}
                  </p>
                ))}

                <h3 className="lex-article__sub">How we use it here</h3>
                {article.inPlatform.map((p, i) => (
                  <p key={i} className="lex-article__p">
                    {formatLexiconRichText(p)}
                  </p>
                ))}
              </article>
            )
          })}
        </div>

        </div>

      </div>
    </DojoFlowPageShell>
  )
}
