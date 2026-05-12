import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import './App.css'
import './KensaPage.css'
import { useDojoLandingTheme } from './DojoLandingThemeContext'
import { productTerminology } from './terminology'
import {
  inspectJson,
  inspectPresentationRequest,
  type InspectMode,
  type RequestProtocol,
} from './kensa/kensaInspect'
import { addWalletItem } from './walletInventory'

type EnbuArtifact = 'response' | 'request'

const REQUEST_PROTOCOLS: readonly {
  id: RequestProtocol
  label: string
  hint: string
}[] = [
  {
    id: 'oid4vp',
    label: 'OID4VP',
    hint: 'Expect client_id / nonce plus presentation_definition or dcql_query.',
  },
  {
    id: 'didcomm',
    label: 'DIDComm',
    hint: 'Expect DIDComm type/body with request-presentation style semantics.',
  },
  {
    id: 'chapi',
    label: 'CHAPI',
    hint: 'Expect browser-wallet request style fields like query / challenge / domain.',
  },
  {
    id: 'custom',
    label: 'Custom',
    hint: 'Project-specific request shape; at minimum include challenge and intent.',
  },
]

const SAMPLE_VP = `{
  "@context": ["https://www.w3.org/ns/credentials/v2"],
  "type": ["VerifiablePresentation"],
  "holder": "did:key:z6MkHolderExample",
  "verifiableCredential": [
    {
      "@context": ["https://www.w3.org/ns/credentials/v2"],
      "type": ["VerifiableCredential", "UniversityDegreeCredential"],
      "issuer": "did:key:z6MkIssuerExample",
      "credentialSubject": {
        "id": "did:key:z6MkHolderExample",
        "name": "Aiko"
      },
      "proof": {
        "type": "DataIntegrityProof",
        "verificationMethod": "did:key:z6MkIssuerExample#z6MkIssuerExample",
        "proofPurpose": "assertionMethod",
        "created": "2026-05-07T00:00:00Z",
        "proofValue": "z58SampleProofValue"
      }
    }
  ],
  "proof": {
    "type": "DataIntegrityProof",
    "verificationMethod": "did:key:z6MkHolderExample#z6MkHolderExample",
    "proofPurpose": "authentication",
    "created": "2026-05-07T00:00:10Z",
    "proofValue": "z58SamplePresentationProof"
  }
}`

const SAMPLE_VC = `{
  "@context": ["https://www.w3.org/ns/credentials/v2"],
  "id": "urn:uuid:7fd22f56-ec2a-4de8-9d9b-0f6aabf9f67b",
  "type": ["VerifiableCredential", "UniversityDegreeCredential"],
  "issuer": "did:key:z6MkIssuerExample",
  "validFrom": "2026-05-01T00:00:00Z",
  "credentialSchema": {
    "id": "https://credential.ninja/schemas/degree-v1",
    "type": "JsonSchema"
  },
  "credentialSubject": {
    "id": "did:key:z6MkHolderExample",
    "name": "Aiko",
    "degree": {
      "name": "Bachelor of Science"
    }
  },
  "proof": {
    "type": "DataIntegrityProof",
    "verificationMethod": "did:key:z6MkIssuerExample#z6MkIssuerExample",
    "proofPurpose": "assertionMethod",
    "created": "2026-05-01T10:15:00Z",
    "proofValue": "z58SampleCredentialProof"
  }
}`

const SAMPLE_REQ_OID4VP = `{
  "client_id": "https://verifier.example",
  "response_uri": "https://verifier.example/callback",
  "nonce": "n-0S6_WzA2Mj",
  "presentation_definition": {
    "id": "pd-degree",
    "input_descriptors": [
      {
        "id": "degree-input",
        "constraints": {
          "fields": [
            {
              "path": ["$.type"],
              "filter": { "type": "array", "contains": { "const": "UniversityDegreeCredential" } }
            }
          ]
        }
      }
    ]
  }
}`

const SAMPLE_REQ_DIDCOMM = `{
  "id": "5f7a",
  "type": "https://didcomm.org/present-proof/3.0/request-presentation",
  "from": "did:example:verifier",
  "to": ["did:example:holder"],
  "body": {
    "goal_code": "request-vp",
    "comment": "Please share your degree credential",
    "challenge": "a4fbe6d2"
  }
}`

const SAMPLE_REQ_CHAPI = `{
  "web": {
    "VerifiablePresentation": {
      "query": [
        {
          "type": "QueryByExample",
          "credentialQuery": {
            "reason": "Proof of degree",
            "example": {
              "@context": ["https://www.w3.org/ns/credentials/v2"],
              "type": ["UniversityDegreeCredential"]
            }
          }
        }
      ]
    }
  },
  "challenge": "9f8f9c3a",
  "domain": "credential.ninja"
}`

const SAMPLE_REQ_CUSTOM = `{
  "intent": "employment-screening",
  "challenge": "c-42",
  "audience": "did:example:verifier",
  "requirements": {
    "credentialTypes": ["UniversityDegreeCredential"],
    "proofPurpose": "authentication"
  }
}`

export default function KensaPage({ initialMode = 'enbu' }: { initialMode?: InspectMode }) {
  const { theme } = useDojoLandingTheme()
  const [mode, setMode] = useState<InspectMode>(initialMode)
  const [enbuArtifact, setEnbuArtifact] = useState<EnbuArtifact>('response')
  const [requestProtocol, setRequestProtocol] = useState<RequestProtocol>('oid4vp')
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
    if (mode === 'enbu' && enbuArtifact === 'request') {
      return inspectPresentationRequest(parsed, requestProtocol)
    }
    return inspectJson(parsed, mode)
  }, [applied, parsed, parseError, mode, enbuArtifact, requestProtocol])

  const apply = useCallback(() => {
    try {
      JSON.parse(raw)
      setParseError(null)
      setApplied(raw)
      addWalletItem({
        type: mode === 'menkyo' ? 'credential' : 'artifact',
        title:
          mode === 'menkyo'
            ? 'Kensa Inspection · Menkyo'
            : enbuArtifact === 'request'
              ? `Kensa Inspection · Shokan (${requestProtocol.toUpperCase()})`
              : 'Kensa Inspection · Enbu',
        subtitle: 'Manual inspection run from Kensa',
        issuerOrSource: 'Kensa',
        status: enbuArtifact === 'request' ? 'queued' : 'ready',
        tags: [
          'Kensa',
          mode === 'menkyo' ? 'Menkyo' : enbuArtifact === 'request' ? 'Shokan' : 'Enbu',
          requestProtocol.toUpperCase(),
        ],
        preview: raw.slice(0, 180),
      })
    } catch (e) {
      setParseError(e instanceof Error ? e.message : 'Invalid JSON')
    }
  }, [raw, mode, enbuArtifact, requestProtocol])

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
  const selectedProtocol = REQUEST_PROTOCOLS.find((p) => p.id === requestProtocol) ?? REQUEST_PROTOCOLS[0]

  const loadSample = useCallback(() => {
    let sample = SAMPLE_VC
    if (mode === 'enbu' && enbuArtifact === 'response') sample = SAMPLE_VP
    if (mode === 'enbu' && enbuArtifact === 'request') {
      if (requestProtocol === 'oid4vp') sample = SAMPLE_REQ_OID4VP
      else if (requestProtocol === 'didcomm') sample = SAMPLE_REQ_DIDCOMM
      else if (requestProtocol === 'chapi') sample = SAMPLE_REQ_CHAPI
      else sample = SAMPLE_REQ_CUSTOM
    }
    setRaw(sample)
    setApplied(sample)
    setParseError(null)
    setLastUploadNote('Sample loaded')
    addWalletItem({
      type: mode === 'menkyo' ? 'credential' : 'artifact',
      title: mode === 'menkyo' ? 'Sample Menkyo loaded' : 'Sample payload loaded',
      subtitle: 'Kensa sample loaded into editor',
      issuerOrSource: 'Kensa',
      status: 'archived',
      tags: ['Sample', 'Kensa', mode === 'menkyo' ? 'Menkyo' : 'Enbu'],
      preview: sample.slice(0, 180),
    })
  }, [mode, enbuArtifact, requestProtocol])

  useEffect(() => {
    setMode(initialMode)
  }, [initialMode])

  return (
    <div className={`dojo-scene dojo-scene--${theme} dojo-scene--zen`}>
      <div className="dojo-scene__moon" aria-hidden />
      <div className="dojo-scene__bg" aria-hidden />
      <div className="dojo-scene__grid" aria-hidden />

      <div className="kensa dojoZenPage dojoZenPage--wide">
        <header className="dojoZenPage__header">
          <p className="dojoZenPage__eyebrow">Credential Dojo</p>
          <h1
            className="dojoZenPage__title"
            title="Inspection (検査): choose Enbu (presentation) or Menkyo (credential) structural checks"
          >
            Kensa
          </h1>
          <p className="dojoZenPage__intro">
            Two inspection paths: presentation-shaped JSON (<strong>{tEnbu.name}</strong>,{' '}
            <span lang="ja">{tEnbu.glyph}</span>) versus a single credential (<strong>{tMenkyo.name}</strong>,{' '}
            <span lang="ja">{tMenkyo.glyph}</span>). Heuristics only—no cryptographic verification on this page.
          </p>
          <nav className="dojoZenPage__nav" aria-label="Kensa navigation">
            <Link className="dojoZenPage__back" to="/" title="Back Home">
              ← Back Home
            </Link>
            <Link
              className="dojoZenPage__back"
              to="/lexicon"
              title="Glossary including Enbu の Kensa and Menkyo の Kensa articles"
            >
              Lexicon
            </Link>
            <Link
              className="dojoZenPage__back"
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
            ? enbuArtifact === 'request'
              ? `Paste a Shōkan (presentation request) payload. Protocol: ${selectedProtocol.label}.`
              : 'Paste a verifiable presentation JSON (holder → verifier package).'
            : 'Paste a single verifiable credential JSON object.'}
        </p>
        {mode === 'enbu' ? (
          <>
            <div className="kensa__toggles" role="radiogroup" aria-label="Enbu artifact type">
              <button
                type="button"
                role="radio"
                aria-checked={enbuArtifact === 'response'}
                className={`kensa__modeBtn${enbuArtifact === 'response' ? ' kensa__modeBtn--active' : ''}`}
                onClick={() => setEnbuArtifact('response')}
                title="Inspect a holder response presentation"
              >
                Enbu response
              </button>
              <button
                type="button"
                role="radio"
                aria-checked={enbuArtifact === 'request'}
                className={`kensa__modeBtn${enbuArtifact === 'request' ? ' kensa__modeBtn--active' : ''}`}
                onClick={() => setEnbuArtifact('request')}
                title="Inspect a verifier presentation request"
              >
                Shōkan request
              </button>
            </div>
            {enbuArtifact === 'request' ? (
              <>
                <div className="kensa__protocols" role="radiogroup" aria-label="Presentation request protocol">
                  {REQUEST_PROTOCOLS.map((protocol) => (
                    <button
                      key={protocol.id}
                      type="button"
                      role="radio"
                      aria-checked={requestProtocol === protocol.id}
                      className={`kensa__modeBtn${requestProtocol === protocol.id ? ' kensa__modeBtn--active' : ''}`}
                      onClick={() => setRequestProtocol(protocol.id)}
                      title={protocol.hint}
                    >
                      {protocol.label}
                    </button>
                  ))}
                </div>
                <p className="kensa__protocolHint">{selectedProtocol.hint}</p>
              </>
            ) : null}
          </>
        ) : null}

        <div className="kensa__workspace">
          <section className="kensa__editorCard">
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
                placeholder={
                  mode === 'enbu' && enbuArtifact === 'request'
                    ? '{ "client_id": "https://verifier.example", "nonce": "...", "presentation_definition": { ... } }'
                    : '{ "type": ["VerifiablePresentation"], ... }'
                }
                title={
                  mode === 'enbu'
                    ? enbuArtifact === 'request'
                      ? 'Paste a presentation request payload (Shōkan) for protocol-aware structural checks'
                      : 'Paste a verifiable presentation (VP) JSON object for heuristic checks'
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
                onClick={loadSample}
                title="Load a sample payload for the current path"
              >
                Load sample
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
          </section>

          <section className="kensa__resultCard" aria-live="polite">
            <p className="kensa__label">Inspection output</p>
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
            ) : (
              <p className="kensa__emptyResult">
                Run inspection to populate structured findings for the selected path.
              </p>
            )}
          </section>
        </div>
      </section>
      </div>
    </div>
  )
}
