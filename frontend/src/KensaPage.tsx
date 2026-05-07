import { useCallback, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import './App.css'
import './KensaPage.css'
import { productTerminology } from './terminology'

type InspectMode = 'enbu' | 'menkyo'

function typeList(o: Record<string, unknown>): string[] {
  const t = o.type
  if (Array.isArray(t)) return t.filter((x): x is string => typeof x === 'string')
  if (typeof t === 'string') return [t]
  return []
}

function isVpShaped(o: Record<string, unknown>): boolean {
  const types = typeList(o)
  if (types.includes('VerifiablePresentation')) return true
  const vc = o.verifiableCredential
  if (Array.isArray(vc) && vc.length > 0) return true
  return false
}

function isVcShaped(o: Record<string, unknown>): boolean {
  const types = typeList(o)
  if (types.includes('VerifiableCredential')) return true
  if (o['@context'] !== undefined && (o.issuer !== undefined || o.credentialSubject !== undefined)) {
    return true
  }
  return false
}

function inspectJson(parsed: unknown, mode: InspectMode): { level: 'ok' | 'warn' | 'error'; lines: string[] } {
  const lines: string[] = []
  if (parsed === null || typeof parsed !== 'object' || Array.isArray(parsed)) {
    return { level: 'error', lines: ['Expected a single JSON object (not an array or primitive).'] }
  }
  const o = parsed as Record<string, unknown>
  const vp = isVpShaped(o)
  const vc = isVcShaped(o)

  if (mode === 'menkyo') {
    if (vp && !vc) {
      lines.push(
        'This looks like a verifiable presentation (Enbu): switch to Enbu の Kensa, or paste one object from verifiableCredential.',
      )
      return { level: 'warn', lines }
    }
    if (vc) {
      lines.push('Structural cues match a VC-shaped object (e.g. VerifiableCredential type or @context with issuer / credentialSubject).')
      return { level: 'ok', lines }
    }
    lines.push('No strong VC heuristics — JSON is still valid for manual review.')
    return { level: 'warn', lines }
  }

  /* enbu */
  if (vc && !vp) {
    lines.push(
      'This looks like a lone credential (Menkyo). Presentation (Enbu) payloads usually declare VerifiablePresentation or include `verifiableCredential`.',
    )
    return { level: 'warn', lines }
  }
  if (vp) {
    lines.push('Structural cues match a VP-shaped object (VerifiablePresentation or verifiableCredential array).')
    return { level: 'ok', lines }
  }
  lines.push('No strong VP heuristics — JSON is still valid for manual review.')
  return { level: 'warn', lines }
}

export default function KensaPage() {
  const [mode, setMode] = useState<InspectMode>('enbu')
  const [raw, setRaw] = useState('')
  const [applied, setApplied] = useState('')
  const [parseError, setParseError] = useState<string | null>(null)

  const parsed = useMemo(() => {
    if (!applied) return null
    try {
      return JSON.parse(applied) as unknown
    } catch {
      return null
    }
  }, [applied])

  const result = useMemo(() => {
    if (!applied || parseError) return null
    if (parsed === null) return null
    return inspectJson(parsed, mode)
  }, [applied, parsed, parseError, mode])

  const apply = useCallback(() => {
    try {
      JSON.parse(raw)
      setParseError(null)
      setApplied(raw)
    } catch (e) {
      setParseError(e instanceof Error ? e.message : 'Invalid JSON')
    }
  }, [raw])

  const tEnbu = productTerminology.presentationInspection
  const tMenkyo = productTerminology.credentialInspection

  return (
    <div className="dojo-scene dojo-scene--night kensa">
      <div className="dojo-scene__moon" aria-hidden />
      <div className="dojo-scene__bg" aria-hidden />
      <div className="dojo-scene__grid" aria-hidden />

      <header className="kensa__header">
        <p className="kensa__eyebrow">The Credential Dojo</p>
        <h1 className="kensa__title">Kensa</h1>
        <p className="kensa__intro">
          Two inspection paths: presentation-shaped JSON (<strong>{tEnbu.name}</strong>,{' '}
          <span lang="ja">{tEnbu.glyph}</span>) versus a single credential (<strong>{tMenkyo.name}</strong>,{' '}
          <span lang="ja">{tMenkyo.glyph}</span>). Heuristics only—no cryptographic verification on this page.
        </p>
        <nav className="kensa__nav">
          <Link className="kensa__back" to="/">
            ← Home
          </Link>
          <Link className="kensa__back" to="/lexicon">
            Lexicon
          </Link>
          <Link className="kensa__back" to="/json-explorer">
            JSON explorer
          </Link>
        </nav>
      </header>

      <div className="kensa__tabs" role="tablist" aria-label="Inspection mode">
        <button
          type="button"
          role="tab"
          id="kensa-tab-enbu"
          aria-selected={mode === 'enbu'}
          className={`kensa__tab${mode === 'enbu' ? ' kensa__tab--active' : ''}`}
          onClick={() => setMode('enbu')}
        >
          <span className="kensa__tabTitle">{tEnbu.name}</span>
          <span className="kensa__tabGlyph" lang="ja">
            {tEnbu.glyph}
          </span>
        </button>
        <button
          type="button"
          role="tab"
          id="kensa-tab-menkyo"
          aria-selected={mode === 'menkyo'}
          className={`kensa__tab${mode === 'menkyo' ? ' kensa__tab--active' : ''}`}
          onClick={() => setMode('menkyo')}
        >
          <span className="kensa__tabTitle">{tMenkyo.name}</span>
          <span className="kensa__tabGlyph" lang="ja">
            {tMenkyo.glyph}
          </span>
        </button>
      </div>

      <section
        className="kensa__panel dojo-augmented dojo-augmented--panel"
        data-augmented-ui="tl-clip tr-clip bl-clip br-clip border"
        aria-labelledby="kensa-panel-heading"
      >
        <h2 id="kensa-panel-heading" className="kensa__panelHeading">
          {mode === 'enbu' ? (
            <>
              {tEnbu.name} <span lang="ja">({tEnbu.glyph})</span>
            </>
          ) : (
            <>
              {tMenkyo.name} <span lang="ja">({tMenkyo.glyph})</span>
            </>
          )}
        </h2>
        <p className="kensa__hint">
          {mode === 'enbu'
            ? 'Paste a verifiable presentation JSON (holder → verifier package).'
            : 'Paste a single verifiable credential JSON object.'}
        </p>

        <label className="kensa__label" htmlFor="kensa-json">
          JSON
        </label>
        <textarea
          id="kensa-json"
          className="kensa__textarea"
          value={raw}
          onChange={(e) => setRaw(e.target.value)}
          spellCheck={false}
          rows={12}
          placeholder='{ "type": ["VerifiablePresentation"], ... }'
        />
        <div className="kensa__actions">
          <button type="button" className="kensa__btn" onClick={apply}>
            Run inspection
          </button>
        </div>
        {parseError ? <p className="kensa__msg kensa__msg--error">{parseError}</p> : null}
        {result && !parseError ? (
          <div
            className={`kensa__msg kensa__msg--${result.level}`}
            role="status"
            aria-live="polite"
          >
            {result.lines.map((line, i) => (
              <p key={i}>{line}</p>
            ))}
          </div>
        ) : null}
      </section>
    </div>
  )
}
