import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import './DojoIssuancePage.css'
import { DojoFlowPageHero, DojoFlowPageShell } from './dojoFlowPage'
import { DEMO_PERSONAS_OFFLINE, type PersonaPublic, type PersonasPayload } from './demoPersonas'
import {
  buildDemoCredential,
  buildDemoMenkyo,
  DEFAULT_ISSUE_TEMPLATE_ID,
  ISSUE_CREDENTIAL_TEMPLATES,
  issueCredentialTemplatesForIssuer,
  previewCredentialIdForTemplate,
  type DojoIssuanceConfigure,
  type IssueCredentialTemplateId,
} from './issueVerifyDemoVc'
import { IssuanceConfigurePanel } from './IssuanceConfigurePanel'
import { inspectJson, type InspectLevel } from './kensa/kensaInspect'
import { platformIssueCredential, platformVerifyCredential } from './platformApi'
import {
  NINJA_PROFILE_CHANGED_EVENT,
  readNinjaProfile,
  type NinjaProfile,
} from './ninjaProfileStorage'
import { productTerminology } from './terminology'
import { addWalletItem } from './walletInventory'

const COMBINED_PREVIEW_CREDENTIAL_ID = previewCredentialIdForTemplate(DEFAULT_ISSUE_TEMPLATE_ID)

const DEFAULT_ISSUANCE_CONFIGURE: DojoIssuanceConfigure = {
  didMethod: 'did:key',
  validFromDate: '',
  validUntilDate: '',
  includeCredentialSchema: false,
  includeRevocation: false,
  includeSuspension: false,
  includeProofCreated: false,
  renderMethodTemplate: null,
}

type VcPreviewSummary = {
  headline: string
  types: string[]
  issuerDid: string
  issuerName: string
  validFrom: string
  subjectTeaser: string
}

function issuerPreviewFromVc(vc: Record<string, unknown>): { did: string; name: string } {
  const issuer = vc.issuer
  if (typeof issuer === 'string') return { did: issuer, name: '' }
  if (issuer && typeof issuer === 'object' && issuer !== null) {
    const o = issuer as Record<string, unknown>
    return {
      did: typeof o.id === 'string' ? o.id : '',
      name: typeof o.name === 'string' ? o.name : '',
    }
  }
  return { did: '', name: '' }
}

function subjectTeaserFromVc(subject: Record<string, unknown>): string {
  if (typeof subject.degreeName === 'string') return subject.degreeName
  if (typeof subject.roleTitle === 'string' && typeof subject.organizationName === 'string') {
    return `${subject.roleTitle} · ${subject.organizationName}`
  }
  if (typeof subject.courseTitle === 'string') return subject.courseTitle
  if (typeof subject.note === 'string') {
    const n = subject.note.trim()
    return n.length > 140 ? `${n.slice(0, 137)}…` : n
  }
  if (typeof subject.eventName === 'string') return subject.eventName
  return ''
}

function summarizeVcPreview(
  vc: Record<string, unknown>,
  opts: { templateTitle?: string; personaLabel: string },
): VcPreviewSummary {
  const typesRaw = vc.type
  const types = Array.isArray(typesRaw)
    ? typesRaw.map((x) => String(x))
    : typeof typesRaw === 'string'
      ? [typesRaw]
      : []

  const { did: issuerDid, name: issuerName } = issuerPreviewFromVc(vc)
  const validFrom = typeof vc.validFrom === 'string' ? vc.validFrom : ''

  const sub =
    vc.credentialSubject && typeof vc.credentialSubject === 'object' && vc.credentialSubject !== null
      ? (vc.credentialSubject as Record<string, unknown>)
      : {}
  const subjectTeaser = subjectTeaserFromVc(sub)

  const primaryType = types.find((t) => t !== 'VerifiableCredential') ?? types[0] ?? 'VerifiableCredential'
  const credentialName = typeof vc.name === 'string' ? vc.name : ''
  const headline = credentialName
    ? `${credentialName} · ${opts.personaLabel}`
    : opts.templateTitle
      ? `${opts.templateTitle} · ${opts.personaLabel}`
      : `${primaryType.replace(/Credential$/, '') || 'Demo'} · ${opts.personaLabel}`

  return {
    headline,
    types,
    issuerDid,
    issuerName,
    validFrom,
    subjectTeaser,
  }
}

function truncateDid(s: string, lead = 14, tail = 10): string {
  if (s.length <= lead + tail + 3) return s
  return `${s.slice(0, lead)}…${s.slice(-tail)}`
}

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

function MenkyoPreviewAside({
  issueOnly,
  stretchCard,
  compact,
  previewSummary,
  previewText,
  jsonCopied,
  onCopy,
}: {
  issueOnly: boolean
  stretchCard?: boolean
  /** Issuance layout: tighter preview, fewer chrome rows. */
  compact?: boolean
  previewSummary: VcPreviewSummary
  previewText: string
  jsonCopied: boolean
  onCopy: () => void
}) {
  const tMenkyo = productTerminology.credential

  return (
    <aside
      className={`issueVerify__previewCard${stretchCard ? ' issueVerify__previewCard--stretch' : ''}${
        compact ? ' issueVerify__previewCard--issuanceCompact' : ''
      }`}
      aria-labelledby="issue-verify-preview-title"
    >
      <div className={`issueVerify__previewCard-head${compact ? ' issueVerify__previewCard-head--compact' : ''}`}>
        <div className="issueVerify__previewCard-titles">
          <p className="issueVerify__previewCard-kicker">
            {compact ? (
              <>
                {tMenkyo.name} <span lang="ja">({tMenkyo.glyph})</span>
              </>
            ) : (
              'Menkyo preview'
            )}
          </p>
          <h3
            className="issueVerify__previewCard-title"
            id="issue-verify-preview-title"
            title={compact ? previewSummary.headline : undefined}
          >
            {compact ? 'Issued Credential' : previewSummary.headline}
          </h3>
          {!compact ? (
            <p className="issueVerify__previewCard-sub">
              {issueOnly
                ? 'Shape for the selected template — same envelope your Issue button will mint.'
                : 'Shape from your active Kasa — same envelope Issue will mint here.'}
            </p>
          ) : null}
        </div>
        {!compact ? (
          <div className="issueVerify__previewCard-actions">
            <span className="issueVerify__previewPill" title="Preview only; not yet written to the editor">
              Read-only
            </span>
          </div>
        ) : null}
      </div>

      {!compact && previewSummary.types.length > 0 ? (
        <ul className="issueVerify__previewTypes" aria-label="Credential types">
          {previewSummary.types.map((t) => (
            <li key={t} className="issueVerify__previewTypeChip">
              {t}
            </li>
          ))}
        </ul>
      ) : null}

      {!compact && previewSummary.subjectTeaser ? (
        <p className="issueVerify__previewSubject">{previewSummary.subjectTeaser}</p>
      ) : null}

      {!compact ? (
        <dl className="issueVerify__previewMeta">
          <div className="issueVerify__previewMetaRow">
            <dt>Issuer</dt>
            <dd className="issueVerify__previewMetaMono" title={previewSummary.issuerDid}>
              {previewSummary.issuerName || truncateDid(previewSummary.issuerDid)}
            </dd>
          </div>
          {previewSummary.validFrom ? (
            <div className="issueVerify__previewMetaRow">
              <dt>Valid from</dt>
              <dd className="issueVerify__previewMetaMono">{previewSummary.validFrom}</dd>
            </div>
          ) : null}
        </dl>
      ) : null}

      <div className="issueVerify__previewJson">
        <div className="issueVerify__previewJson-bar">
          <span className="issueVerify__previewJson-label">application/vc</span>
          <button
            type="button"
            className={`issueVerify__previewJson-copy${jsonCopied ? ' issueVerify__previewJson-copy--ok' : ''}`}
            onClick={onCopy}
            aria-label={jsonCopied ? 'JSON copied' : 'Copy JSON'}
            title={jsonCopied ? 'Copied' : 'Copy JSON'}
          >
            {jsonCopied ? <IconCopyOk /> : <IconCopyJson />}
            {jsonCopied ? (
              <span className="issueVerify__previewJson-copyLabel">Copied</span>
            ) : null}
          </button>
        </div>
        <pre
          className={`issueVerify__preview${compact ? ' issueVerify__preview--dojoIssuanceScroll' : ''}`}
          title="Read-only preview of the next Issue payload"
        >
          {previewText}
        </pre>
      </div>
    </aside>
  )
}

export type DojoIssuancePageProps = {
  /** `issue` — issuance only (`/dojo`). Default `both` is the combined Issue & verify page. */
  mode?: 'both' | 'issue'
  /** When true with `mode="issue"`, omit `DojoFlowPageShell` / body chrome (nested under `DojoWorkspaceLayout`). */
  embedded?: boolean
}

export default function DojoIssuancePage({ mode = 'both', embedded = false }: DojoIssuancePageProps) {
  const issueOnly = mode === 'issue'
  const [personas, setPersonas] = useState<readonly PersonaPublic[] | null>(null)
  const [ninjaProfile, setNinjaProfile] = useState<NinjaProfile | null>(() => readNinjaProfile())
  const [selectedTemplate, setSelectedTemplate] = useState<IssueCredentialTemplateId>(DEFAULT_ISSUE_TEMPLATE_ID)
  const [configure, setConfigure] = useState<DojoIssuanceConfigure>(DEFAULT_ISSUANCE_CONFIGURE)
  const [issuancePersonaId, setIssuancePersonaId] = useState<string | null>(null)
  const [rawJson, setRawJson] = useState('')
  const [appliedJson, setAppliedJson] = useState('')
  const [parseError, setParseError] = useState<string | null>(null)
  const [previewJsonCopied, setPreviewJsonCopied] = useState(false)
  const previewJsonCopyTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const [verifyResult, setVerifyResult] = useState<{ level: InspectLevel; lines: string[] } | null>(null)
  const [verifying, setVerifying] = useState(false)
  const [issuing, setIssuing] = useState(false)

  useEffect(() => {
    const sync = () => setNinjaProfile(readNinjaProfile())
    window.addEventListener(NINJA_PROFILE_CHANGED_EVENT, sync)
    window.addEventListener('storage', sync)
    return () => {
      window.removeEventListener(NINJA_PROFILE_CHANGED_EVENT, sync)
      window.removeEventListener('storage', sync)
    }
  }, [])

  useEffect(() => {
    const base = import.meta.env.VITE_API_BASE ?? ''
    fetch(`${base}/api/personas`)
      .then((res) => {
        if (!res.ok) throw new Error(`${res.status}`)
        return res.json() as Promise<PersonasPayload>
      })
      .then((data) => setPersonas(data.personas))
      .catch(() => setPersonas(DEMO_PERSONAS_OFFLINE))
  }, [])

  const list = personas ?? DEMO_PERSONAS_OFFLINE

  const schoolId = useMemo(() => {
    const id = ninjaProfile?.schoolId ?? 'ed-ryu'
    return list.some((p) => p.id === id) ? id : 'ed-ryu'
  }, [ninjaProfile, list])

  const persona = list.find((p) => p.id === schoolId) ?? list[0]

  useEffect(() => {
    setIssuancePersonaId(null)
  }, [schoolId])

  const effectivePersona = useMemo(() => {
    const id = issuancePersonaId ?? schoolId
    return list.find((p) => p.id === id) ?? list[0]
  }, [issuancePersonaId, schoolId, list])

  const patchConfigure = useCallback((patch: Partial<DojoIssuanceConfigure>) => {
    setConfigure((c) => ({ ...c, ...patch }))
  }, [])

  useEffect(() => {
    if (!issueOnly) return
    const deck = issueCredentialTemplatesForIssuer(effectivePersona)
    const allowed = new Set(deck.map((t) => t.id))
    if (!allowed.has(selectedTemplate)) {
      setSelectedTemplate(deck[0]!.id)
    }
  }, [issueOnly, effectivePersona, selectedTemplate])

  const operatorCodename = ninjaProfile?.codename

  const previewVc = useMemo(() => {
    if (issueOnly) {
      return buildDemoCredential(effectivePersona, selectedTemplate, {
        operatorCodename,
        credentialId: previewCredentialIdForTemplate(selectedTemplate),
        configure,
      })
    }
    return buildDemoMenkyo(persona, {
      operatorCodename,
      credentialId: COMBINED_PREVIEW_CREDENTIAL_ID,
    })
  }, [
    issueOnly,
    effectivePersona,
    persona,
    operatorCodename,
    selectedTemplate,
    configure,
  ])

  const previewText = useMemo(() => {
    const v = { ...(previewVc as Record<string, unknown>) }
    delete v.proof
    delete v.id
    const cs = v.credentialSubject
    if (cs && typeof cs === 'object' && cs !== null) {
      const sub = { ...(cs as Record<string, unknown>) }
      delete sub.id
      v.credentialSubject = sub
    }
    return JSON.stringify(v, null, 2)
  }, [previewVc])

  const selectedTemplateMeta = issueOnly
    ? ISSUE_CREDENTIAL_TEMPLATES.find((t) => t.id === selectedTemplate)
    : undefined

  const previewSummary = useMemo(
    () =>
      summarizeVcPreview(previewVc as Record<string, unknown>, {
        templateTitle: issueOnly
          ? selectedTemplateMeta?.title
          : ISSUE_CREDENTIAL_TEMPLATES.find((t) => t.id === DEFAULT_ISSUE_TEMPLATE_ID)?.title ?? 'Demo',
        personaLabel: issueOnly ? effectivePersona.label : persona.label,
      }),
    [previewVc, issueOnly, selectedTemplateMeta?.title, effectivePersona.label, persona.label],
  )

  useEffect(() => {
    setPreviewJsonCopied(false)
  }, [previewText])

  useEffect(
    () => () => {
      if (previewJsonCopyTimeoutRef.current) {
        window.clearTimeout(previewJsonCopyTimeoutRef.current)
      }
    },
    [],
  )

  const copyPreview = useCallback(async () => {
    if (previewJsonCopyTimeoutRef.current) {
      window.clearTimeout(previewJsonCopyTimeoutRef.current)
      previewJsonCopyTimeoutRef.current = null
    }
    try {
      await navigator.clipboard.writeText(previewText)
      setPreviewJsonCopied(true)
      previewJsonCopyTimeoutRef.current = window.setTimeout(() => {
        setPreviewJsonCopied(false)
        previewJsonCopyTimeoutRef.current = null
      }, 1600)
    } catch {
      setPreviewJsonCopied(false)
    }
  }, [previewText])

  const issueDemo = useCallback(async () => {
    const issuer = issueOnly ? effectivePersona : persona
    setIssuing(true)
    const api = await platformIssueCredential(
      issueOnly
        ? {
            personaId: issuer.id,
            templateId: selectedTemplate,
            operatorCodename,
            configure,
          }
        : { personaId: issuer.id, operatorCodename },
    )
    const vc = api.ok
      ? api.verifiableCredential
      : ((issueOnly
          ? buildDemoCredential(issuer, selectedTemplate, { operatorCodename, configure })
          : buildDemoMenkyo(persona, { operatorCodename })) as Record<string, unknown>)
    setIssuing(false)
    const text = JSON.stringify(vc, null, 2)
    setRawJson(text)
    setAppliedJson(text)
    setParseError(null)
    const opSuffix = operatorCodename ? ` · ${operatorCodename}` : ''
    const tpl = issueOnly ? ISSUE_CREDENTIAL_TEMPLATES.find((t) => t.id === selectedTemplate) : undefined
    addWalletItem({
      type: 'credential',
      title: tpl ? `Demo · ${tpl.title}${opSuffix}` : `Demo Menkyo · ${persona.label}${opSuffix}`,
      subtitle:
        mode === 'issue' ? 'Issued from /dojo (browser demo)' : 'Issued from Issue & verify (browser demo)',
      issuerOrSource: issuer.label,
      status: 'ready',
      tags: [
        'Menkyo',
        'Demo',
        mode === 'issue' ? 'Issue' : 'Issue-verify',
        issuer.proofSchool,
        ...(tpl ? [tpl.title] : []),
      ],
      preview: text.slice(0, 180),
      bodyJson: text,
    })
  }, [
    persona,
    effectivePersona,
    operatorCodename,
    mode,
    issueOnly,
    selectedTemplate,
    configure,
  ])

  const runVerify = useCallback(async () => {
    let parsed: unknown
    try {
      parsed = JSON.parse(rawJson)
      setParseError(null)
      setAppliedJson(rawJson)
    } catch (e) {
      setParseError(e instanceof Error ? e.message : 'Invalid JSON')
      setAppliedJson('')
      setVerifyResult(null)
      return
    }
    setVerifying(true)
    setVerifyResult(null)
    const api = await platformVerifyCredential(parsed)
    setVerifyResult(api.ok ? { level: api.level, lines: api.lines } : inspectJson(parsed, 'menkyo'))
    setVerifying(false)
  }, [rawJson])

  const tCred = productTerminology.credential
  const tInspect = productTerminology.credentialInspection
  const tFromTemplate = productTerminology.credentialFromTemplate
  const tTehon = productTerminology.template
  const tKasa = productTerminology.kasa

  const issuanceCreddeck = (
    <div className="issueVerify issueVerify--issuanceCreddeck dojoZenPage dojoZenPage--wide">
            <div className="issueVerify__issuanceRoot">
              <header className="issueVerify__issuanceMasthead">
                <p className="dojo-flowPage__eyebrow issueVerify__mastheadEyebrow">DOJO</p>
                <h1 className="dojo-flowPage__title issueVerify__mastheadTitle">
                  {tFromTemplate.issueCredentialLabel}
                </h1>
                <p className="dojo-flowPage__intro issueVerify__mastheadIntro">
                  Configure a credential template and issue it to your wallet.
                </p>
              </header>

              <div className="issueVerify__issuanceGrid">
                <section
                  className="issueVerify__configurePanel issueVerify__panel dojo-augmented dojo-augmented--panel"
                  data-augmented-ui="tl-clip tr-clip bl-clip br-clip border"
                  aria-labelledby="dojo-issuance-config-heading"
                >
                  <div className="issueVerify__configureHeadRow">
                    <div className="issueVerify__configureHeadText">
                      <p className="issueVerify__augIndex">
                        {tTehon.name} <span lang="ja">({tTehon.glyph})</span>
                      </p>
                      <h2 id="dojo-issuance-config-heading" className="issueVerify__augTitle">
                        Issuer template
                      </h2>
                    </div>
                    <div className="issueVerify__configureActions issueVerify__configureActions--masthead">
                      <button
                        type="button"
                        className="issueVerify__btn issueVerify__btn--primary"
                        onClick={() => void issueDemo()}
                        disabled={issuing}
                      >
                        {issuing ? 'Issuing…' : 'Issue Credential'}
                      </button>
                    </div>
                  </div>
                  <IssuanceConfigurePanel
                    configure={configure}
                    patchConfigure={patchConfigure}
                    personas={list}
                    issuancePersonaId={issuancePersonaId ?? schoolId}
                    onIssuancePersonaId={setIssuancePersonaId}
                    ninjaProfile={!!ninjaProfile}
                    selectedTemplate={selectedTemplate}
                    onSelectTemplate={setSelectedTemplate}
                  />
                </section>

                <section className="issueVerify__previewColumn" aria-label="Menkyo preview output">
                  <div className="issueVerify__previewPane">
                    <MenkyoPreviewAside
                      issueOnly
                      stretchCard
                      compact
                      previewSummary={previewSummary}
                      previewText={previewText}
                      jsonCopied={previewJsonCopied}
                      onCopy={copyPreview}
                    />
                  </div>
                </section>
              </div>
            </div>
          </div>
  )

  const combinedIssueVerify = (
    <div className="issueVerify dojoZenPage dojoZenPage--wide">
      <section
        className="issueVerify__panel dojo-augmented dojo-augmented--panel"
        data-augmented-ui="tl-clip tr-clip bl-clip br-clip border"
      >
        <div className="issueVerify__grid">
          <div>
            <h2 className="issueVerify__sectionTitle">Issue (demo)</h2>
            <p className="issueVerify__sectionBody">
              The demo issuer follows your <strong>active ninja profile</strong>: its <strong>Kasa</strong> (proof
              school), <strong>Kata</strong> flavor, and your codename on the subject. Change school or codename in{' '}
              <Link to="/create-ninja-profile">ninja profile</Link> or the shell profile menu. With no profile saved, we
              use the default <strong>Ed-ryū</strong> demo school and no operator name.
            </p>

            {!ninjaProfile ? (
              <p className="issueVerify__profileHint">
                No ninja profile in this browser —{' '}
                <Link to="/create-ninja-profile">create one</Link> to issue under your identity, or continue with the
                default demo issuer.
              </p>
            ) : null}

            <div className="issueVerify__actions">
              <button
                type="button"
                className="issueVerify__btn issueVerify__btn--primary"
                onClick={() => void issueDemo()}
                disabled={issuing}
              >
                {issuing ? 'Issuing…' : 'Issue demo Menkyo'}
              </button>
            </div>
            <MenkyoPreviewAside
              issueOnly={false}
              previewSummary={previewSummary}
              previewText={previewText}
              jsonCopied={previewJsonCopied}
              onCopy={copyPreview}
            />
          </div>

          <div>
            <h2 className="issueVerify__sectionTitle">Verify (Menkyo path)</h2>
            <p className="issueVerify__sectionBody">
              After issuing, edit the JSON if you like, then run checks. Errors and warnings mirror the Kensa credential
              tab.
            </p>
            <label className="issueVerify__label" htmlFor="issue-verify-json">
              Credential JSON
            </label>
            <textarea
              id="issue-verify-json"
              className="issueVerify__textarea"
              value={rawJson}
              onChange={(e) => {
                setRawJson(e.target.value)
                setParseError(null)
                setAppliedJson('')
                setVerifyResult(null)
              }}
              spellCheck={false}
              placeholder='Click "Issue demo Menkyo" or paste a VerifiableCredential-shaped object.'
            />
            {parseError ? <p className="issueVerify__parseErr">{parseError}</p> : null}
            <div className="issueVerify__actions" style={{ marginTop: '0.65rem' }}>
              <button
                type="button"
                className="issueVerify__btn"
                onClick={() => void runVerify()}
                disabled={verifying}
              >
                {verifying ? 'Verifying…' : 'Run verify'}
              </button>
              <button
                type="button"
                className="issueVerify__btn"
                onClick={() => {
                  setRawJson('')
                  setAppliedJson('')
                  setParseError(null)
                  setVerifyResult(null)
                }}
              >
                Clear
              </button>
            </div>
            {verifyResult ? (
              <div
                className={`issueVerify__result issueVerify__result--${verifyResult.level}`}
                role="status"
                aria-live="polite"
              >
                {verifyResult.lines.map((line, i) => (
                  <p key={i}>{line}</p>
                ))}
              </div>
            ) : (
              <p className="issueVerify__empty">
                {parseError
                  ? 'Fix JSON and click Run verify.'
                  : appliedJson.trim()
                    ? 'Could not derive inspection output.'
                    : 'Issue or paste JSON, then click Run verify.'}
              </p>
            )}
          </div>
        </div>
      </section>
    </div>
  )

  if (embedded && issueOnly) {
    return issuanceCreddeck
  }

  return (
    <DojoFlowPageShell>
      {!issueOnly ? (
        <DojoFlowPageHero title={<>Issue &amp; verify</>}>
          <p className="dojo-flowPage__intro">
            Mint a <strong>{tCred.name}</strong>-shaped demo JSON from a proof school (<strong>{tKasa.name}</strong>
            ), then run the same structural checks as <strong>{tInspect.name}</strong> — still no cryptographic
            verification, only shape and field heuristics.
          </p>
        </DojoFlowPageHero>
      ) : null}

      <div className="dojo-flowPage__body">{issueOnly ? issuanceCreddeck : combinedIssueVerify}</div>
    </DojoFlowPageShell>
  )
}
