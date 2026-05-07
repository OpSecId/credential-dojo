import { useCallback, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import JsonAugWidget from './components/JsonAugWidget'
import './App.css'
import './JsonExplorerPage.css'

const SAMPLE_JSON = `{
  "@context": ["https://www.w3.org/ns/credentials/v2"],
  "type": ["VerifiableCredential"],
  "issuer": "did:example:issuer123",
  "credentialSubject": {
    "id": "did:example:holder456",
    "name": "A. Student",
    "degree": {
      "type": "BachelorDegree",
      "name": "Bachelor of Science"
    }
  },
  "proof": {
    "type": "DataIntegrityProof",
    "proofValue": "z58D..."
  }
}`

const SAMPLE_EXPLAIN: Record<string, string> = {
  '': 'Verifiable Credential-shaped sample: outer envelope plus nested subject and proof.',
  '/issuer': 'Issuer DID or URI: who vouched for this credential.',
  '/credentialSubject': 'Claims about the subject—the holder or entity this credential describes.',
  '/credentialSubject/degree': 'Nested object: structured claim (here, an academic degree).',
  '/proof': 'Cryptographic proof block; verifiers use it with issuer metadata.',
}

export default function JsonExplorerPage() {
  const [raw, setRaw] = useState(SAMPLE_JSON)
  const [applied, setApplied] = useState(SAMPLE_JSON)
  const [parseError, setParseError] = useState<string | null>(null)

  const parsed = useMemo(() => {
    try {
      return JSON.parse(applied) as unknown
    } catch {
      return null
    }
  }, [applied])

  const apply = useCallback(() => {
    try {
      JSON.parse(raw)
      setParseError(null)
      setApplied(raw)
    } catch (e) {
      setParseError(e instanceof Error ? e.message : 'Invalid JSON')
    }
  }, [raw])

  return (
    <div className="dojo-scene dojo-scene--night json-ex">
      <div className="dojo-scene__moon" aria-hidden />
      <div className="dojo-scene__bg" aria-hidden />
      <div className="dojo-scene__grid" aria-hidden />

      <header className="json-ex__header">
        <p className="json-ex__eyebrow">The Credential Dojo</p>
        <h1 className="json-ex__title">JSON explorer</h1>
        <p className="json-ex__intro">
          Paste JSON, apply, then hover the augmented tree to see RFC 6901 pointers and notes.
          Custom explanations use the same pointer strings as keys.
        </p>
        <nav className="json-ex__nav">
          <Link className="json-ex__back" to="/">
            ← Home
          </Link>
          <Link className="json-ex__back" to="/lexicon">
            Lexicon
          </Link>
          <Link className="json-ex__back" to="/discover-kasa">
            Discover Kasa
          </Link>
        </nav>
      </header>

      <div className="json-ex__editor">
        <label className="json-ex__label" htmlFor="json-ex-input">
          JSON input
        </label>
        <textarea
          id="json-ex-input"
          className="json-ex__textarea"
          value={raw}
          onChange={(e) => setRaw(e.target.value)}
          spellCheck={false}
          rows={14}
        />
        <div className="json-ex__actions">
          <button type="button" className="json-ex__btn" onClick={apply}>
            Apply
          </button>
          <button
            type="button"
            className="json-ex__btn json-ex__btn--ghost"
            onClick={() => {
              setRaw(SAMPLE_JSON)
              setApplied(SAMPLE_JSON)
              setParseError(null)
            }}
          >
            Load sample VC
          </button>
        </div>
        {parseError ? <p className="json-ex__error">{parseError}</p> : null}
      </div>

      {parsed !== null ? (
        <JsonAugWidget
          key={applied}
          value={parsed}
          title="Explore JSON"
          explainByPointer={SAMPLE_EXPLAIN}
          defaultExpandDepth={2}
        />
      ) : (
        <p className="json-ex__empty">Apply valid JSON to render the widget.</p>
      )}
    </div>
  )
}
