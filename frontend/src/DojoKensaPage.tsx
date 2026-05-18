import { useCallback, useEffect, useRef, useState } from 'react'
import './DojoKensaPage.css'
import './DojoIssuancePage.css'
import { DojoFlowPageHero, DojoFlowPageShell } from './dojoFlowPage'
import { ConfigSection } from './IssuanceConfigurePanel'
import { productTerminology } from './terminology'
import {
  inspectJson,
  inspectPresentationRequest,
  type InspectLevel,
  type InspectMode,
  type RequestProtocol,
} from './kensa/kensaInspect'
import { KensaPayloadIntake } from './kensa/KensaPayloadIntake'
import { platformVerifyCredential, platformVerifyPresentation } from './platformApi'
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

function IconCopyJson({ className }: { className?: string }) {
  return (
    <svg className={className} width={16} height={16} viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M8 5.5h10a1.5 1.5 0 0 1 1.5 1.5v11a1.5 1.5 0 0 1-1.5 1.5H8A1.5 1.5 0 0 1 6.5 18V7A1.5 1.5 0 0 1 8 5.5Z"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinejoin="round"
      />
      <path
        d="M6 5.5V4.25A1.25 1.25 0 0 1 7.25 3h5.5A1.25 1.25 0 0 1 14 4.25V5.5"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
      />
    </svg>
  )
}

function IconCopyOk({ className }: { className?: string }) {
  return (
    <svg className={className} width={16} height={16} viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M6.5 12.5 10 16l7.5-8"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

export type DojoKensaPageProps = {
  initialMode?: InspectMode
  /** Omit outer `DojoFlowPageShell` / hero / body chrome (nested under `DojoWorkspaceLayout`). */
  embedded?: boolean
  /** With `embedded`: Enbu presentation inspection only (hide Menkyo tab). */
  enbuOnly?: boolean
}

export default function DojoKensaPage({
  initialMode = 'enbu',
  embedded = false,
  enbuOnly = false,
}: DojoKensaPageProps) {
  const [mode, setMode] = useState<InspectMode>(initialMode)
  const [enbuArtifact, setEnbuArtifact] = useState<EnbuArtifact>('response')
  const [requestProtocol, setRequestProtocol] = useState<RequestProtocol>('oid4vp')
  const [raw, setRaw] = useState('')
  const [parseError, setParseError] = useState<string | null>(null)
  const [isDragOver, setIsDragOver] = useState(false)
  const [uploadMode, setUploadMode] = useState<'replace' | 'append'>('replace')
  const [lastUploadNote, setLastUploadNote] = useState<string | null>(null)
  const [jsonCopied, setJsonCopied] = useState(false)
  const jsonCopyTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const [inspectResult, setInspectResult] = useState<{ level: InspectLevel; lines: string[] } | null>(null)
  const [inspecting, setInspecting] = useState(false)

  const runInspection = useCallback(
    async (jsonText: string) => {
      let parsed: unknown
      try {
        parsed = JSON.parse(jsonText)
      } catch (e) {
        setParseError(e instanceof Error ? e.message : 'Invalid JSON')
        setInspectResult(null)
        return
      }
      setParseError(null)
      setInspecting(true)
      setInspectResult(null)

      const localFallback = () => {
        if (mode === 'enbu' && enbuArtifact === 'request') {
          return inspectPresentationRequest(parsed, requestProtocol)
        }
        return inspectJson(parsed, mode)
      }

      const api =
        mode === 'menkyo'
          ? await platformVerifyCredential(parsed)
          : await platformVerifyPresentation(parsed, requestProtocol)

      setInspectResult(api.ok ? { level: api.level, lines: api.lines } : localFallback())
      setInspecting(false)

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
        preview: jsonText.slice(0, 180),
        bodyJson: jsonText,
      })
    },
    [mode, enbuArtifact, requestProtocol],
  )

  const apply = useCallback(() => {
    void runInspection(raw)
  }, [raw, runInspection])

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

  const enbuJsonPlaceholder =
    enbuArtifact === 'request'
      ? '{ "client_id": "https://verifier.example", "nonce": "…" }'
      : '{ "type": ["VerifiablePresentation"], … }'

  const clearPayload = useCallback(() => {
    setRaw('')
    setParseError(null)
    setLastUploadNote(null)
    setInspectResult(null)
  }, [])

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
    setParseError(null)
    setLastUploadNote('Sample loaded')
    void runInspection(sample)
    addWalletItem({
      type: mode === 'menkyo' ? 'credential' : 'artifact',
      title: mode === 'menkyo' ? 'Sample Menkyo loaded' : 'Sample payload loaded',
      subtitle: 'Kensa sample loaded into editor',
      issuerOrSource: 'Kensa',
      status: 'archived',
      tags: ['Sample', 'Kensa', mode === 'menkyo' ? 'Menkyo' : 'Enbu'],
      preview: sample.slice(0, 180),
      bodyJson: sample,
    })
  }, [mode, enbuArtifact, requestProtocol, runInspection])

  useEffect(() => {
    if (enbuOnly) {
      setMode('enbu')
      return
    }
    setMode(initialMode)
  }, [initialMode, enbuOnly])

  const copyEditorJson = useCallback(async () => {
    if (jsonCopyTimeoutRef.current) {
      window.clearTimeout(jsonCopyTimeoutRef.current)
      jsonCopyTimeoutRef.current = null
    }
    try {
      await navigator.clipboard.writeText(raw)
      setJsonCopied(true)
      jsonCopyTimeoutRef.current = window.setTimeout(() => {
        setJsonCopied(false)
        jsonCopyTimeoutRef.current = null
      }, 1600)
    } catch {
      setJsonCopied(false)
    }
  }, [raw])

  const enbuCreddeckColumn = (
    <div className="kensa kensa--enbuCreddeck issueVerify issueVerify--issuanceCreddeck dojoZenPage dojoZenPage--wide">
      <div className="issueVerify__issuanceRoot kensa__enbuRoot">
        <header className="issueVerify__issuanceMasthead">
          <p className="dojo-flowPage__eyebrow issueVerify__mastheadEyebrow">DOJO</p>
          <h1 className="dojo-flowPage__title issueVerify__mastheadTitle">{tEnbu.name}</h1>
          <p className="dojo-flowPage__intro issueVerify__mastheadIntro">
            Load a presentation via file, JSON snippet, or URL—then run structural checks. Heuristics only—no
            cryptographic verification on this page.
          </p>
        </header>

        <div className="issueVerify__issuanceGrid">
          <section
            className="issueVerify__configurePanel issueVerify__panel dojo-augmented dojo-augmented--panel"
            data-augmented-ui="tl-clip tr-clip bl-clip br-clip border"
            aria-labelledby="dojo-enbu-config-heading"
          >
            <div className="issueVerify__configureHeadRow">
              <div className="issueVerify__configureHeadText">
                <p className="issueVerify__augIndex">
                  {tEnbu.name} <span lang="ja">({tEnbu.glyph})</span>
                </p>
                <h2 id="dojo-enbu-config-heading" className="issueVerify__augTitle">
                  Verifier template
                </h2>
              </div>
              <div className="issueVerify__configureActions issueVerify__configureActions--masthead">
                <button
                  type="button"
                  className="issueVerify__btn issueVerify__btn--primary"
                  onClick={apply}
                  disabled={inspecting}
                >
                  {inspecting ? 'Inspecting…' : 'Run inspection'}
                </button>
              </div>
            </div>

            <div className="issueVerify__configureScroll">
              <ConfigSection label="Payload">
                <div className="kensa__enbuIntakeConfigure">
                  {raw.trim() ? (
                    <div className="issueVerify__previewJson-bar kensa__enbuIntakeCopyBar">
                      <span className="issueVerify__previewJson-label">application/json</span>
                      <button
                        type="button"
                        className={`issueVerify__previewJson-copy${jsonCopied ? ' issueVerify__previewJson-copy--ok' : ''}`}
                        onClick={copyEditorJson}
                        aria-label={jsonCopied ? 'JSON copied' : 'Copy JSON'}
                        title={jsonCopied ? 'Copied' : 'Copy JSON'}
                      >
                        {jsonCopied ? <IconCopyOk /> : <IconCopyJson />}
                        {jsonCopied ? (
                          <span className="issueVerify__previewJson-copyLabel">Copied</span>
                        ) : null}
                      </button>
                    </div>
                  ) : null}
                  <KensaPayloadIntake
                    raw={raw}
                    onRawChange={setRaw}
                    uploadMode={uploadMode}
                    onUploadModeChange={setUploadMode}
                    onFilesLoaded={loadJsonFiles}
                    jsonPlaceholder={enbuJsonPlaceholder}
                    onClear={clearPayload}
                    onLoadSample={loadSample}
                    lastNote={lastUploadNote}
                  />
                </div>
              </ConfigSection>

              <ConfigSection label="Artifact">
                <div
                  className="issuanceCfg__didSeg issuanceCfg__didSeg--render"
                  role="radiogroup"
                  aria-label="Enbu artifact type"
                >
                  <span className="issuanceCfg__didSegGlow" aria-hidden />
                  <button
                    type="button"
                    role="radio"
                    aria-checked={enbuArtifact === 'response'}
                    className={`issuanceCfg__didSegBtn${enbuArtifact === 'response' ? ' issuanceCfg__didSegBtn--selected' : ''}`}
                    onClick={() => setEnbuArtifact('response')}
                    title="Inspect a holder response presentation"
                  >
                    <span className="issuanceCfg__didSegMono">Enbu response</span>
                  </button>
                  <button
                    type="button"
                    role="radio"
                    aria-checked={enbuArtifact === 'request'}
                    className={`issuanceCfg__didSegBtn${enbuArtifact === 'request' ? ' issuanceCfg__didSegBtn--selected' : ''}`}
                    onClick={() => setEnbuArtifact('request')}
                    title="Inspect a verifier presentation request"
                  >
                    <span className="issuanceCfg__didSegMono">Shōkan request</span>
                  </button>
                </div>
              </ConfigSection>

              {enbuArtifact === 'request' ? (
                <ConfigSection
                  label="Request protocol"
                  hint={<span>{selectedProtocol.hint}</span>}
                >
                  <div
                    className="issuanceCfg__didSeg issuanceCfg__didSeg--render"
                    role="radiogroup"
                    aria-label="Presentation request protocol"
                  >
                    <span className="issuanceCfg__didSegGlow" aria-hidden />
                    {REQUEST_PROTOCOLS.map((protocol) => (
                      <button
                        key={protocol.id}
                        type="button"
                        role="radio"
                        aria-checked={requestProtocol === protocol.id}
                        className={`issuanceCfg__didSegBtn${
                          requestProtocol === protocol.id ? ' issuanceCfg__didSegBtn--selected' : ''
                        }`}
                        onClick={() => setRequestProtocol(protocol.id)}
                        title={protocol.hint}
                      >
                        <span className="issuanceCfg__didSegMono">{protocol.label}</span>
                      </button>
                    ))}
                  </div>
                </ConfigSection>
              ) : null}

            </div>
          </section>

          <section className="issueVerify__previewColumn kensa__enbuPreviewColumn" aria-label="Enbu inspection output">
            <div className="issueVerify__previewPane kensa__enbuWorkspace">
              <section className="kensa__enbuInspectCard kensa__enbuInspectCard--fill" aria-live="polite">
                <p className="issueVerify__previewJson-label kensa__enbuInspectLabel">Inspection output</p>
                {parseError ? (
                  <div className="kensa__msg kensa__msg--error" role="alert">
                    {parseError}
                  </div>
                ) : inspectResult ? (
                  <div className={`kensa__msg kensa__msg--${inspectResult.level}`} role="status">
                    {inspectResult.lines.map((line, i) => (
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
    </div>
  )

  const kensaColumn = (
    <div className={`kensa dojoZenPage dojoZenPage--wide${embedded ? ' kensa--embeddedDojo' : ''}`}>
        {!enbuOnly ? (
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
        ) : null}

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
                onClick={clearPayload}
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
                disabled={inspecting}
                title="Parse JSON and run VP vs VC shape heuristics for the selected tab (no signature verification)"
              >
                {inspecting ? 'Inspecting…' : 'Run inspection'}
              </button>
            </div>
            {lastUploadNote ? <p className="kensa__uploadNote">{lastUploadNote}</p> : null}
            {parseError ? <p className="kensa__msg kensa__msg--error">{parseError}</p> : null}
          </section>

          <section className="kensa__resultCard" aria-live="polite">
            <p className="kensa__label">Inspection output</p>
            {inspectResult && !parseError ? (
              <div
                className={`kensa__msg kensa__msg--${inspectResult.level}`}
                role="status"
                aria-live="polite"
              >
                {inspectResult.lines.map((line, i) => (
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
  )

  if (embedded && enbuOnly) {
    return enbuCreddeckColumn
  }

  if (embedded) {
    return kensaColumn
  }

  return (
    <DojoFlowPageShell>
      <DojoFlowPageHero
        title={
          <span title="Inspection (検査): choose Enbu (presentation) or Menkyo (credential) structural checks">
            Kensa
          </span>
        }
      >
        <p className="dojo-flowPage__intro">
          Two inspection paths: presentation-shaped JSON (<strong>{tEnbu.name}</strong>,{' '}
          <span lang="ja">{tEnbu.glyph}</span>) versus a single credential (<strong>{tMenkyo.name}</strong>,{' '}
          <span lang="ja">{tMenkyo.glyph}</span>). Heuristics only—no cryptographic verification on this page.
        </p>
      </DojoFlowPageHero>

      <div className="dojo-flowPage__body">{kensaColumn}</div>
    </DojoFlowPageShell>
  )
}
