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
          <p className="lex__eyebrow">The Credential Dojo</p>
          <h1 className="lex__title">Lexicon</h1>
          <p className="lex__intro">
            Japanese names used in product copy are <strong>metaphors</strong> for documentation
            and UX—they are not security claims. Each entry below gives the word&apos;s
            everyday or martial-arts sense, then how we map it to{' '}
            <strong>W3C Verifiable Credentials</strong> and CRMS concepts.
          </p>
          <nav className="lex__nav">
            <Link className="lex__back" to="/">
              ← Home
            </Link>
            <Link className="lex__back" to="/discover-kasa">
              Discover Kasa
            </Link>
            <Link className="lex__back" to="/create-ninja-profile">
              Create ninja profile
            </Link>
            <Link className="lex__back" to="/json-explorer">
              JSON explorer
            </Link>
            <Link className="lex__back" to="/kensa">
              Kensa
            </Link>
          </nav>
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
                <a href={`#${article.key}`}>
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

        <footer className="lex__footer">
          <Link to="/">Return home</Link>
        </footer>
      </div>
    </div>
  )
}
