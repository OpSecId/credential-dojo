import { useCallback, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import JsonAugWidget from './components/JsonAugWidget'
import VcEnvelopeRail from './components/VcEnvelopeRail'
import './App.css'
import './JsonExplorerPage.css'
import { VC_ROOT_EXPLAIN, looksLikeVerifiableCredential } from './utils/vcEnvelope'

const SAMPLE_JSON = `{
  "@context": ["https://www.w3.org/ns/credentials/v2"],
  "id": "urn:uuid:7b883e8f-1c2d-4a3e-9f0a-example",
  "type": ["VerifiableCredential", "ExampleDegreeCredential"],
  "issuer": "did:example:issuer123",
  "validFrom": "2024-01-01T00:00:00Z",
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
    "cryptosuite": "eddsa-rdfc-2022",
    "proofValue": "z58D..."
  }
}`

const SAMPLE_EXPLAIN: Record<string, string> = {
  '': 'Verifiable Credential structure: fixed top-level slots (see rail) plus nested subject and proof.',
  '/issuer': 'Issuer DID or URI: who vouched for this credential.',
  '/credentialSubject': 'Claims about the subject—the holder or entity this credential describes.',
  '/credentialSubject/degree': 'Nested object: structured claim (here, an academic degree).',
  '/proof': 'Cryptographic proof block; verifiers use it with issuer metadata and agreed Kata.',
}

const EXPLAIN_BY_POINTER: Record<string, string> = {
  ...VC_ROOT_EXPLAIN,
  ...SAMPLE_EXPLAIN,
}

export default function JsonExplorerPage() {
  const [raw, setRaw] = useState(SAMPLE_JSON)
  const [applied, setApplied] = useState(SAMPLE_JSON)
  const [parseError, setParseError] = useState<string | null>(null)
  const [editorOpen, setEditorOpen] = useState(true)
  const [focusPointer, setFocusPointer] = useState<string | null>(null)
  const [focusTick, setFocusTick] = useState(0)

  const parsed = useMemo(() => {
    try {
      return JSON.parse(applied) as unknown
    } catch {
      return null
    }
  }, [applied])

  const vcRoot = useMemo(() => {
    if (parsed !== null && looksLikeVerifiableCredential(parsed)) return parsed
    return null
  }, [parsed])

  const apply = useCallback(() => {
    try {
      JSON.parse(raw)
      setParseError(null)
      setApplied(raw)
      setFocusPointer(null)
    } catch (e) {
      setParseError(e instanceof Error ? e.message : 'Invalid JSON')
    }
  }, [raw])

  const formatPretty = useCallback(() => {
    try {
      const j = JSON.parse(raw)
      setRaw(JSON.stringify(j, null, 2))
      setParseError(null)
    } catch (e) {
      setParseError(e instanceof Error ? e.message : 'Invalid JSON')
    }
  }, [raw])

  const formatMin = useCallback(() => {
    try {
      const j = JSON.parse(raw)
      setRaw(JSON.stringify(j))
      setParseError(null)
    } catch (e) {
      setParseError(e instanceof Error ? e.message : 'Invalid JSON')
    }
  }, [raw])

  const jumpTo = useCallback((ptr: string) => {
    setFocusPointer(ptr)
    setFocusTick(Date.now())
  }, [])

  return (
    <div className="dojo-scene dojo-scene--night json-ex">
      <div className="dojo-scene__moon" aria-hidden />
      <div className="dojo-scene__bg" aria-hidden />
      <div className="dojo-scene__grid" aria-hidden />

      <header className="json-ex__hero">
        <div className="json-ex__heroGlow" aria-hidden />
        <p className="json-ex__eyebrow">The Credential Dojo · Shinbi</p>
        <h1 className="json-ex__title">JSON explorer</h1>
        <p className="json-ex__lede">
          Parse JSON, skim the augmented tree, and read RFC 6901 pointers with context. For{' '}
          <strong>Verifiable Credentials</strong>, the top-level keys follow a stable structure—use
          the rail to jump between slots instantly.
        </p>
        <nav className="json-ex__nav" aria-label="Back navigation">
          <Link className="json-ex__back" to="/" title="Back Home">
            ← Back Home
          </Link>
        </nav>
      </header>

      <div className="json-ex__workspace">
        <aside className={`json-ex__editor${editorOpen ? '' : ' json-ex__editor--collapsed'}`}>
          <div className="json-ex__editorHead">
            <h2 className="json-ex__editorTitle">Source</h2>
            <button
              type="button"
              className="json-ex__iconBtn"
              onClick={() => setEditorOpen((o) => !o)}
              aria-expanded={editorOpen}
              title={editorOpen ? 'Collapse editor' : 'Expand editor'}
            >
              {editorOpen ? '◂' : '▸'}
            </button>
          </div>
          {editorOpen ? (
            <>
              <label className="json-ex__label" htmlFor="json-ex-input">
                Paste or edit JSON
              </label>
              <textarea
                id="json-ex-input"
                className="json-ex__textarea"
                value={raw}
                onChange={(e) => setRaw(e.target.value)}
                spellCheck={false}
                rows={16}
                title="JSON source — Apply to refresh the explorer"
              />
              <div className="json-ex__toolbar">
                <button type="button" className="json-ex__btn json-ex__btn--primary" onClick={apply}>
                  Apply
                </button>
                <button type="button" className="json-ex__btn" onClick={formatPretty} title="Pretty-print">
                  Format
                </button>
                <button type="button" className="json-ex__btn" onClick={formatMin} title="Single-line JSON">
                  Minify
                </button>
                <button
                  type="button"
                  className="json-ex__btn json-ex__btn--ghost"
                  title="Restore sample VC"
                  onClick={() => {
                    setRaw(SAMPLE_JSON)
                    setApplied(SAMPLE_JSON)
                    setParseError(null)
                    setFocusPointer(null)
                  }}
                >
                  Sample VC
                </button>
              </div>
              {parseError ? <p className="json-ex__error">{parseError}</p> : null}
            </>
          ) : (
            <p className="json-ex__editorPeek">Editor collapsed — open to edit source.</p>
          )}
        </aside>

        <div className="json-ex__main">
          {parsed === null ? (
            <p className="json-ex__empty">Apply valid JSON to open the explorer.</p>
          ) : (
            <>
              {vcRoot ? (
                <VcEnvelopeRail
                  root={vcRoot}
                  activePointer={focusPointer}
                  onSelectPointer={(ptr) => jumpTo(ptr)}
                />
              ) : (
                <p className="json-ex__genericNote">
                  Generic JSON — no VC structure rail. Add{' '}
                  <code className="json-ex__code">@context</code>,{' '}
                  <code className="json-ex__code">credentialSubject</code>, and{' '}
                  <code className="json-ex__code">type</code> / <code className="json-ex__code">issuer</code> /{' '}
                  <code className="json-ex__code">proof</code> for Menkyo-shaped navigation.
                </p>
              )}
              <div className="json-ex__aug">
                <JsonAugWidget
                  key={applied}
                  value={parsed}
                  title={vcRoot ? 'Menkyo tree' : 'Document tree'}
                  explainByPointer={EXPLAIN_BY_POINTER}
                  defaultExpandDepth={2}
                  focusPointer={focusPointer}
                  focusTick={focusTick}
                />
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
