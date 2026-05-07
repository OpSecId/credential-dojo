import type { ReactNode } from 'react'
import { Fragment } from 'react'
import { Link } from 'react-router-dom'
import './App.css'
import './LexiconPage.css'
import { LEXICON_ARTICLES } from './lexiconData'
import { productTerminology } from './terminology'

/** Renders `**segments**` as bold; leaves other text plain. */
function formatBold(text: string): ReactNode {
  const parts = text.split(/\*\*/)
  return parts.map((chunk, i) =>
    i % 2 === 1 ? (
      <strong key={i}>{chunk}</strong>
    ) : (
      <Fragment key={i}>{chunk}</Fragment>
    ),
  )
}

export default function LexiconPage() {
  return (
    <div className="dojo-scene dojo-scene--night">
      <div className="dojo-scene__moon" aria-hidden />
      <div className="dojo-scene__bg" aria-hidden />
      <div className="dojo-scene__grid" aria-hidden />

      <div className="lex">
        <header className="lex__header">
          <Link
            className="lex__home"
            to="/"
            title="Back to home"
            aria-label="Back to home"
          >
            <span className="lex__homeIcon" aria-hidden>
              <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
                <path d="M3 10.5 12 3l9 7.5" />
                <path d="M5.5 9.5V20h13V9.5" />
                <path d="M9.5 20v-6h5v6" />
              </svg>
            </span>
          </Link>
          <div className="lex__headerBody">
            <p className="lex__eyebrow">The Credential Dojo</p>
            <h1 className="lex__title">Lexicon</h1>
            <p className="lex__intro">
              <strong>What this is.</strong> Japanese terms in the product are <strong>metaphors for copy and navigation</strong>—a shared vocabulary, not a security model. They are <strong>not</strong> claims about cryptographic strength, compliance, or threat models.
            </p>
            <p className="lex__intro lex__intro--second">
              <strong>What each entry does.</strong> We give the word in its everyday or dōjō sense, then how we use it for <strong>W3C Verifiable Credentials</strong>, holder/issuer language, and this CRMS.
            </p>
          </div>
        </header>

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

        <div className="lex__articles">
          {LEXICON_ARTICLES.map((article) => {
            const t = productTerminology[article.key]
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

                <h3 className="lex-article__sub">Original meaning</h3>
                {article.literal.map((p, i) => (
                  <p key={i} className="lex-article__p">
                    {formatBold(p)}
                  </p>
                ))}

                <h3 className="lex-article__sub">How we use it here</h3>
                {article.inPlatform.map((p, i) => (
                  <p key={i} className="lex-article__p">
                    {formatBold(p)}
                  </p>
                ))}
              </article>
            )
          })}
        </div>

      </div>
    </div>
  )
}
