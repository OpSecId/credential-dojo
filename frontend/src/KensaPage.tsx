import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import './App.css'
import './KensaPage.css'
import { productTerminology } from './terminology'

type InspectMode = 'enbu' | 'menkyo'
type InspectLevel = 'ok' | 'warn' | 'error'

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

function asProofArray(v: unknown): Record<string, unknown>[] {
  if (v && typeof v === 'object' && !Array.isArray(v)) return [v as Record<string, unknown>]
  if (Array.isArray(v)) return v.filter((x): x is Record<string, unknown> => !!x && typeof x === 'object')
  return []
}

function isJwtLike(v: unknown): boolean {
  if (typeof v !== 'string') return false
  const parts = v.split('.')
  return parts.length === 3 && parts.every((p) => p.length > 0)
}

function pushIssue(
  bucket: { errors: string[]; warnings: string[]; passes: string[] },
  level: InspectLevel,
  line: string,
) {
  if (level === 'error') bucket.errors.push(line)
  else if (level === 'warn') bucket.warnings.push(line)
  else bucket.passes.push(line)
}

function checkValidityWindows(
  o: Record<string, unknown>,
  bucket: { errors: string[]; warnings: string[]; passes: string[] },
) {
  const now = Date.now()
  const parse = (v: unknown) => (typeof v === 'string' ? Date.parse(v) : NaN)
  const validFrom = parse(o.validFrom ?? o.issuanceDate)
  const validUntil = parse(o.validUntil ?? o.expirationDate)
  if (o.validFrom !== undefined || o.issuanceDate !== undefined) {
    if (Number.isNaN(validFrom)) pushIssue(bucket, 'error', 'Invalid validity start timestamp.')
    else if (validFrom > now) pushIssue(bucket, 'warn', 'Credential validity start is in the future.')
    else pushIssue(bucket, 'ok', 'Validity start timestamp parses correctly.')
  }
  if (o.validUntil !== undefined || o.expirationDate !== undefined) {
    if (Number.isNaN(validUntil)) pushIssue(bucket, 'error', 'Invalid validity end timestamp.')
    else if (validUntil < now) pushIssue(bucket, 'warn', 'Credential appears expired by validity end timestamp.')
    else pushIssue(bucket, 'ok', 'Validity end timestamp parses correctly.')
  }
}

function checkCredentialSchema(
  o: Record<string, unknown>,
  bucket: { errors: string[]; warnings: string[]; passes: string[] },
) {
  const schema = o.credentialSchema
  if (schema === undefined) {
    pushIssue(bucket, 'warn', 'No credentialSchema property found (optional but recommended for shape contracts).')
    return
  }
  const schemas = Array.isArray(schema) ? schema : [schema]
  let anyInvalid = false
  for (const s of schemas) {
    if (!s || typeof s !== 'object' || Array.isArray(s)) {
      anyInvalid = true
      continue
    }
    const so = s as Record<string, unknown>
    if (typeof so.id !== 'string' || typeof so.type !== 'string') {
      anyInvalid = true
    }
  }
  if (anyInvalid) {
    pushIssue(bucket, 'error', 'credentialSchema exists but does not match expected object shape (`id` + `type` strings).')
  } else {
    pushIssue(bucket, 'ok', 'credentialSchema shape looks valid (`id` and `type` present).')
  }
}

function checkProofs(
  label: string,
  value: unknown,
  bucket: { errors: string[]; warnings: string[]; passes: string[] },
) {
  const proofs = asProofArray(value)
  if (proofs.length === 0) {
    pushIssue(bucket, 'warn', `${label}: no object proof found.`)
    return
  }
  proofs.forEach((p, i) => {
    const idx = proofs.length > 1 ? ` #${i + 1}` : ''
    const hasType = typeof p.type === 'string'
    const hasVm = typeof p.verificationMethod === 'string'
    const hasPurpose = typeof p.proofPurpose === 'string'
    const hasSig =
      typeof p.proofValue === 'string' ||
      typeof p.jws === 'string' ||
      typeof p.signatureValue === 'string'
    if (!hasType) pushIssue(bucket, 'error', `${label}${idx}: missing proof.type.`)
    if (!hasVm) pushIssue(bucket, 'warn', `${label}${idx}: missing verificationMethod.`)
    if (!hasPurpose) pushIssue(bucket, 'warn', `${label}${idx}: missing proofPurpose.`)
    if (!hasSig) pushIssue(bucket, 'error', `${label}${idx}: missing signature payload (proofValue / jws / signatureValue).`)
    if (typeof p.created === 'string') {
      const t = Date.parse(p.created)
      if (Number.isNaN(t)) pushIssue(bucket, 'warn', `${label}${idx}: invalid created timestamp.`)
      else pushIssue(bucket, 'ok', `${label}${idx}: created timestamp parses.`)
    }
    if (hasType && hasSig) pushIssue(bucket, 'ok', `${label}${idx}: proof carries type + signature material.`)
  })
}

function inspectJson(parsed: unknown, mode: InspectMode): { level: InspectLevel; lines: string[] } {
  const bucket = { errors: [] as string[], warnings: [] as string[], passes: [] as string[] }
  if (parsed === null || typeof parsed !== 'object' || Array.isArray(parsed)) {
    return { level: 'error', lines: ['Expected a single JSON object (not an array or primitive).'] }
  }
  const o = parsed as Record<string, unknown>
  const vp = isVpShaped(o)
  const vc = isVcShaped(o)

  if (mode === 'menkyo') {
    if (vp && !vc) {
      bucket.warnings.push(
        'This looks like a verifiable presentation (Enbu): switch to Enbu の Kensa, or paste one object from verifiableCredential.',
      )
      return { level: 'warn', lines: bucket.warnings }
    }
    if (vc) {
      pushIssue(
        bucket,
        'ok',
        'Structural cues match a VC-shaped object (VerifiableCredential type or @context + issuer/credentialSubject).',
      )
      checkCredentialSchema(o, bucket)
      checkValidityWindows(o, bucket)
      if (isJwtLike(o.proof)) {
        pushIssue(bucket, 'ok', 'Proof appears JWT-like (compact JWS).')
      } else {
        checkProofs('Credential proof', o.proof, bucket)
      }
    } else {
      pushIssue(bucket, 'warn', 'No strong VC heuristics — JSON is still valid for manual review.')
    }
    const level: InspectLevel = bucket.errors.length ? 'error' : bucket.warnings.length ? 'warn' : 'ok'
    return { level, lines: [...bucket.errors, ...bucket.warnings, ...bucket.passes] }
  }

  /* enbu */
  if (vc && !vp) {
    bucket.warnings.push(
      'This looks like a lone credential (Menkyo). Presentation (Enbu) payloads usually declare VerifiablePresentation or include `verifiableCredential`.',
    )
    return { level: 'warn', lines: bucket.warnings }
  }
  if (vp) {
    pushIssue(
      bucket,
      'ok',
      'Structural cues match a VP-shaped object (VerifiablePresentation or verifiableCredential array).',
    )
    checkProofs('Presentation proof', o.proof, bucket)
    const vcArray = Array.isArray(o.verifiableCredential) ? o.verifiableCredential : []
    vcArray.forEach((item, i) => {
      const name = `Embedded credential #${i + 1}`
      if (typeof item === 'string') {
        if (isJwtLike(item)) pushIssue(bucket, 'ok', `${name}: JWT-like VC token.`)
        else pushIssue(bucket, 'warn', `${name}: string VC is not JWT-like compact format.`)
        return
      }
      if (item && typeof item === 'object' && !Array.isArray(item)) {
        const c = item as Record<string, unknown>
        checkCredentialSchema(c, bucket)
        checkValidityWindows(c, bucket)
        checkProofs(`${name} proof`, c.proof, bucket)
      } else {
        pushIssue(bucket, 'warn', `${name}: unexpected entry type in verifiableCredential array.`)
      }
    })
  } else {
    pushIssue(bucket, 'warn', 'No strong VP heuristics — JSON is still valid for manual review.')
  }
  const level: InspectLevel = bucket.errors.length ? 'error' : bucket.warnings.length ? 'warn' : 'ok'
  return { level, lines: [...bucket.errors, ...bucket.warnings, ...bucket.passes] }
}

export default function KensaPage({ initialMode = 'enbu' }: { initialMode?: InspectMode }) {
  const [mode, setMode] = useState<InspectMode>(initialMode)
  const [raw, setRaw] = useState('')
  const [applied, setApplied] = useState('')
  const [parseError, setParseError] = useState<string | null>(null)
  const [isDragOver, setIsDragOver] = useState(false)
  const [uploadMode, setUploadMode] = useState<'replace' | 'append'>('replace')
  const [lastUploadNote, setLastUploadNote] = useState<string | null>(null)

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

  const loadJsonFiles = useCallback(
    async (files: readonly File[], modeForLoad: 'replace' | 'append') => {
      if (!files.length) return
      const chunks = await Promise.all(files.map((f) => f.text()))
      const merged = chunks.join('\n\n')
      setRaw((prev) => (modeForLoad === 'append' && prev.trim() ? `${prev}\n\n${merged}` : merged))
      setParseError(null)
      setLastUploadNote(
        `${modeForLoad === 'append' ? 'Appended' : 'Loaded'} ${files.length} file${
          files.length === 1 ? '' : 's'
        }: ${files
          .slice(0, 3)
          .map((f) => f.name)
          .join(', ')}${files.length > 3 ? ' …' : ''}`,
      )
    },
    [],
  )

  const onPickFile = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = e.target.files ? Array.from(e.target.files) : []
      if (!files.length) return
      try {
        await loadJsonFiles(files, uploadMode)
      } catch {
        setParseError('Unable to read file content.')
      } finally {
        e.currentTarget.value = ''
      }
    },
    [loadJsonFiles, uploadMode],
  )

  const onDropFile = useCallback(
    async (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault()
      setIsDragOver(false)
      const files = e.dataTransfer.files ? Array.from(e.dataTransfer.files) : []
      if (!files.length) return
      try {
        await loadJsonFiles(files, uploadMode)
      } catch {
        setParseError('Unable to read dropped file content.')
      }
    },
    [loadJsonFiles, uploadMode],
  )

  const tEnbu = productTerminology.presentationInspection
  const tMenkyo = productTerminology.credentialInspection

  useEffect(() => {
    setMode(initialMode)
  }, [initialMode])

  return (
    <div className="dojo-scene dojo-scene--night kensa">
      <div className="dojo-scene__moon" aria-hidden />
      <div className="dojo-scene__bg" aria-hidden />
      <div className="dojo-scene__grid" aria-hidden />

      <header className="kensa__header">
        <p className="kensa__eyebrow">The Credential Dojo</p>
        <h1
          className="kensa__title"
          title="Inspection (検査): choose Enbu (presentation) or Menkyo (credential) structural checks"
        >
          Kensa
        </h1>
        <p className="kensa__intro">
          Two inspection paths: presentation-shaped JSON (<strong>{tEnbu.name}</strong>,{' '}
          <span lang="ja">{tEnbu.glyph}</span>) versus a single credential (<strong>{tMenkyo.name}</strong>,{' '}
          <span lang="ja">{tMenkyo.glyph}</span>). Heuristics only—no cryptographic verification on this page.
        </p>
        <nav className="kensa__nav">
          <Link className="kensa__back" to="/" title="Credential Dojo home">
            ← Home
          </Link>
          <Link
            className="kensa__back"
            to="/lexicon"
            title="Glossary including Enbu の Kensa and Menkyo の Kensa articles"
          >
            Lexicon
          </Link>
          <Link
            className="kensa__back"
            to="/json-explorer"
            title="Shinbi render view: interactive JSON tree with RFC 6901 pointer tooltips"
          >
            Shinbi
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
          title="Enbu (演武): verifiable presentation — inspect VP-shaped JSON (not crypto verification)"
          onClick={() => setMode('enbu')}
        >
          <span className="kensa__tabMode">Presentation</span>
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
          title="Menkyo (免許): issued credential — inspect a single VC-shaped JSON object"
          onClick={() => setMode('menkyo')}
        >
          <span className="kensa__tabMode">Credential</span>
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
        <div
          className={`kensa__dropzone${isDragOver ? ' kensa__dropzone--active' : ''}`}
          onDragEnter={(e) => {
            e.preventDefault()
            setIsDragOver(true)
          }}
          onDragOver={(e) => {
            e.preventDefault()
            if (!isDragOver) setIsDragOver(true)
          }}
          onDragLeave={(e) => {
            e.preventDefault()
            setIsDragOver(false)
          }}
          onDrop={onDropFile}
        >
          <textarea
            id="kensa-json"
            className="kensa__textarea"
            value={raw}
            onChange={(e) => setRaw(e.target.value)}
            spellCheck={false}
            rows={12}
            placeholder='{ "type": ["VerifiablePresentation"], ... }'
            title={
              mode === 'enbu'
                ? 'Paste a verifiable presentation (VP) JSON object for heuristic checks'
                : 'Paste one verifiable credential (VC) JSON object for heuristic checks'
            }
          />
          <p className="kensa__dropHint">
            Drop one or many `.json` files here ({uploadMode} mode), or use Upload JSON.
          </p>
        </div>
        <div className="kensa__uploadMode" role="radiogroup" aria-label="Upload mode">
          <button
            type="button"
            role="radio"
            aria-checked={uploadMode === 'replace'}
            className={`kensa__modeBtn${uploadMode === 'replace' ? ' kensa__modeBtn--active' : ''}`}
            onClick={() => setUploadMode('replace')}
            title="Replace editor content with uploaded file contents"
          >
            Replace
          </button>
          <button
            type="button"
            role="radio"
            aria-checked={uploadMode === 'append'}
            className={`kensa__modeBtn${uploadMode === 'append' ? ' kensa__modeBtn--active' : ''}`}
            onClick={() => setUploadMode('append')}
            title="Append uploaded file contents under current editor content"
          >
            Append
          </button>
        </div>
        <div className="kensa__actions">
          <label className="kensa__btn kensa__btn--upload" title="Upload a local JSON file into the editor">
            Upload JSON
            <input
              type="file"
              accept="application/json,.json"
              className="kensa__fileInput"
              multiple
              onChange={onPickFile}
            />
          </label>
          <button
            type="button"
            className="kensa__btn"
            onClick={() => {
              setRaw('')
              setApplied('')
              setParseError(null)
              setLastUploadNote(null)
            }}
            title="Clear editor and inspection result"
          >
            Clear
          </button>
          <button
            type="button"
            className="kensa__btn"
            onClick={apply}
            title="Parse JSON and run VP vs VC shape heuristics for the selected tab (no signature verification)"
          >
            Run inspection
          </button>
        </div>
        {lastUploadNote ? <p className="kensa__uploadNote">{lastUploadNote}</p> : null}
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
