import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import './IssueVerifyPage.css'
import { DojoFlowPageHero, DojoFlowPageShell } from './dojoFlowPage'
import { DEMO_PERSONAS_OFFLINE, type PersonaPublic, type PersonasPayload } from './demoPersonas'
import {
  buildDemoCredential,
  buildDemoMenkyo,
  ISSUE_CREDENTIAL_TEMPLATES,
  previewCredentialIdForTemplate,
  type DojoIssuanceConfigure,
  type IssueCredentialTemplateId,
} from './issueVerifyDemoVc'
import { IssuanceConfigurePanel } from './IssuanceConfigurePanel'
import { CRYPTOSUITES, type IssuanceConfigureSection } from './issuanceConstants'
import { inspectJson } from './kensa/kensaInspect'
import {
  NINJA_PROFILE_CHANGED_EVENT,
  readNinjaProfile,
  type NinjaProfile,
} from './ninjaProfileStorage'
import { productTerminology } from './terminology'
import { addWalletItem } from './walletInventory'

const COMBINED_PREVIEW_CREDENTIAL_ID = previewCredentialIdForTemplate('dojo-demo')

const DEFAULT_ISSUANCE_CONFIGURE: DojoIssuanceConfigure = {
  protocols: [],
  cryptosuite: 'eddsa-rdfc-2022',
  didMethod: 'did:web',
  validFromDate: '',
  validUntilDate: '',
  includeCredentialSchema: false,
  includeRevocation: false,
  includeSuspension: false,
  includeTimestamp: false,
  renderMethodTemplate: null,
}

type VcPreviewSummary = {
  headline: string
  types: string[]
  issuer: string
  credentialId: string
  cryptosuite: string
  proofPurpose: string
  validFrom: string
  subjectTeaser: string
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

  const issuer = typeof vc.issuer === 'string' ? vc.issuer : ''
  const credentialId = typeof vc.id === 'string' ? vc.id : ''
  const validFrom = typeof vc.validFrom === 'string' ? vc.validFrom : ''

  const proof =
    vc.proof && typeof vc.proof === 'object' && vc.proof !== null ? (vc.proof as Record<string, unknown>) : {}
  const cryptosuite = typeof proof.cryptosuite === 'string' ? proof.cryptosuite : '—'
  const proofPurpose = typeof proof.proofPurpose === 'string' ? proof.proofPurpose : '—'

  const sub =
    vc.credentialSubject && typeof vc.credentialSubject === 'object' && vc.credentialSubject !== null
      ? (vc.credentialSubject as Record<string, unknown>)
      : {}
  const subjectTeaser = subjectTeaserFromVc(sub)

  const primaryType = types.find((t) => t !== 'VerifiableCredential') ?? types[0] ?? 'VerifiableCredential'
  const headline = opts.templateTitle
    ? `${opts.templateTitle} · ${opts.personaLabel}`
    : `${primaryType.replace(/Credential$/, '') || 'Demo'} · ${opts.personaLabel}`

  return {
    headline,
    types,
    issuer,
    credentialId,
    cryptosuite,
    proofPurpose,
    validFrom,
    subjectTeaser,
  }
}

function truncateDid(s: string, lead = 14, tail = 10): string {
  if (s.length <= lead + tail + 3) return s
  return `${s.slice(0, lead)}…${s.slice(-tail)}`
}

function MenkyoPreviewAside({
  issueOnly,
  stretchCard,
  previewSummary,
  previewText,
  onCopy,
}: {
  issueOnly: boolean
  stretchCard?: boolean
  previewSummary: VcPreviewSummary
  previewText: string
  onCopy: () => void
}) {
  return (
    <aside
      className={`issueVerify__previewCard${stretchCard ? ' issueVerify__previewCard--stretch' : ''}`}
      aria-labelledby="issue-verify-preview-title"
    >
      <div className="issueVerify__previewCard-head">
        <div className="issueVerify__previewCard-titles">
          <p className="issueVerify__previewCard-kicker">Menkyo preview</p>
          <h3 className="issueVerify__previewCard-title" id="issue-verify-preview-title">
            {previewSummary.headline}
          </h3>
          <p className="issueVerify__previewCard-sub">
            {issueOnly
              ? 'Shape for the selected template — same envelope your Issue button will mint.'
              : 'Shape from your active Kasa — same envelope Issue will mint here.'}
          </p>
        </div>
        <div className="issueVerify__previewCard-actions">
          <span className="issueVerify__previewPill" title="Preview only; not yet written to the editor">
            Read-only
          </span>
          <button type="button" className="issueVerify__previewCopy" onClick={onCopy}>
            Copy JSON
          </button>
        </div>
      </div>

      {previewSummary.types.length > 0 ? (
        <ul className="issueVerify__previewTypes" aria-label="Credential types">
          {previewSummary.types.map((t) => (
            <li key={t} className="issueVerify__previewTypeChip">
              {t}
            </li>
          ))}
        </ul>
      ) : null}

      {previewSummary.subjectTeaser ? (
        <p className="issueVerify__previewSubject">{previewSummary.subjectTeaser}</p>
      ) : null}

      <dl className="issueVerify__previewMeta">
        <div className="issueVerify__previewMetaRow">
          <dt>Issuer (did:key)</dt>
          <dd className="issueVerify__previewMetaMono" title={previewSummary.issuer}>
            {truncateDid(previewSummary.issuer)}
          </dd>
        </div>
        <div className="issueVerify__previewMetaRow">
          <dt>Cryptosuite</dt>
          <dd className="issueVerify__previewMetaMono">{previewSummary.cryptosuite}</dd>
        </div>
        <div className="issueVerify__previewMetaRow">
          <dt>Proof purpose</dt>
          <dd>{previewSummary.proofPurpose}</dd>
        </div>
        {previewSummary.validFrom ? (
          <div className="issueVerify__previewMetaRow">
            <dt>Valid from</dt>
            <dd className="issueVerify__previewMetaMono">{previewSummary.validFrom}</dd>
          </div>
        ) : null}
        <div className="issueVerify__previewMetaRow">
          <dt>Credential id</dt>
          <dd className="issueVerify__previewMetaMono" title={previewSummary.credentialId}>
            {truncateDid(previewSummary.credentialId, 22, 14)}
          </dd>
        </div>
      </dl>

      <div className="issueVerify__previewJson">
        <div className="issueVerify__previewJson-bar">
          <span className="issueVerify__previewJson-label">application/vc+json</span>
        </div>
        <pre className="issueVerify__preview" title="Read-only preview of the next Issue payload">
          {previewText}
        </pre>
      </div>
    </aside>
  )
}

export type IssueVerifyPageProps = {
  /** `issue` — issuance only (`/dojo/issuance`). Default `both` is the combined Issue & verify page. */
  mode?: 'both' | 'issue'
}

export default function IssueVerifyPage({ mode = 'both' }: IssueVerifyPageProps) {
  const issueOnly = mode === 'issue'
  const [personas, setPersonas] = useState<readonly PersonaPublic[] | null>(null)
  const [ninjaProfile, setNinjaProfile] = useState<NinjaProfile | null>(() => readNinjaProfile())
  const [selectedTemplate, setSelectedTemplate] = useState<IssueCredentialTemplateId>('dojo-demo')
  const [configure, setConfigure] = useState<DojoIssuanceConfigure>(DEFAULT_ISSUANCE_CONFIGURE)
  const [configureSection, setConfigureSection] = useState<IssuanceConfigureSection | null>(null)
  const [issuancePersonaId, setIssuancePersonaId] = useState<string | null>(null)
  const [rawJson, setRawJson] = useState('')
  const [appliedJson, setAppliedJson] = useState('')
  const [parseError, setParseError] = useState<string | null>(null)

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
    setConfigure((cur) => {
      const allowed = new Set(effectivePersona.kataSamples)
      if (allowed.has(cur.cryptosuite)) return cur
      const next = CRYPTOSUITES.find((c) => allowed.has(c.value))?.value ?? CRYPTOSUITES[0]?.value
      return next ? { ...cur, cryptosuite: next } : cur
    })
  }, [effectivePersona, issueOnly])

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

  const previewText = useMemo(() => JSON.stringify(previewVc, null, 2), [previewVc])

  const selectedTemplateMeta = issueOnly
    ? ISSUE_CREDENTIAL_TEMPLATES.find((t) => t.id === selectedTemplate)
    : undefined

  const previewSummary = useMemo(
    () =>
      summarizeVcPreview(previewVc as Record<string, unknown>, {
        templateTitle: issueOnly ? selectedTemplateMeta?.title : 'Dojo demo',
        personaLabel: issueOnly ? effectivePersona.label : persona.label,
      }),
    [previewVc, issueOnly, selectedTemplateMeta?.title, effectivePersona.label, persona.label],
  )

  const copyPreview = useCallback(() => {
    try {
      void navigator.clipboard.writeText(previewText)
    } catch {
      /* ignore */
    }
  }, [previewText])

  const verifyResult = useMemo(() => {
    const t = appliedJson.trim()
    if (!t) return null
    try {
      return inspectJson(JSON.parse(t) as unknown, 'menkyo')
    } catch {
      return null
    }
  }, [appliedJson])

  const issueDemo = useCallback(() => {
    const issuer = issueOnly ? effectivePersona : persona
    const vc = issueOnly
      ? buildDemoCredential(issuer, selectedTemplate, { operatorCodename, configure })
      : buildDemoMenkyo(persona, { operatorCodename })
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
        mode === 'issue' ? 'Issued from /dojo/issuance (browser demo)' : 'Issued from Issue & verify (browser demo)',
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

  const runVerify = useCallback(() => {
    try {
      JSON.parse(rawJson)
      setParseError(null)
      setAppliedJson(rawJson)
    } catch (e) {
      setParseError(e instanceof Error ? e.message : 'Invalid JSON')
      setAppliedJson('')
    }
  }, [rawJson])

  const tCred = productTerminology.credential
  const tInspect = productTerminology.credentialInspection
  const tFromTemplate = productTerminology.credentialFromTemplate
  const tTehon = productTerminology.template
  const tKasa = productTerminology.kasa

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

      <div className="dojo-flowPage__body">
        {issueOnly ? (
          <div className="issueVerify issueVerify--issuanceCreddeck dojoZenPage dojoZenPage--wide">
            <div className="issueVerify__issuanceRoot">
              <div className="issueVerify__issuanceGrid">
                <header className="issueVerify__issuanceMasthead">
                  <p className="dojo-flowPage__eyebrow issueVerify__mastheadEyebrow">credential.ninja</p>
                  <h1 className="dojo-flowPage__title issueVerify__mastheadTitle">
                    {tFromTemplate.issueCredentialLabel}
                  </h1>
                  <p className="dojo-flowPage__intro issueVerify__mastheadIntro">
                    <strong>{tTehon.name}</strong> <span lang="ja">({tTehon.glyph})</span> — issuer copybook.
                    <br />
                    <strong>{tCred.name}</strong> <span lang="ja">({tCred.glyph})</span> — what you hold after issuance.
                    <br />
                    <strong>{tFromTemplate.name}</strong> <span lang="ja">({tFromTemplate.glyph})</span> is that thread:
                    Tehon into Menkyo. (Issuance)
                  </p>
                </header>

                <section
                  className="issueVerify__configurePanel issueVerify__panel dojo-augmented dojo-augmented--panel"
                  data-augmented-ui="tl-clip tr-clip bl-clip br-clip border"
                  aria-labelledby="dojo-issuance-config-heading"
                >
                  <p className="issueVerify__augIndex">Configure</p>
                  <h2 id="dojo-issuance-config-heading" className="issueVerify__augTitle">
                    Credential configuration
                  </h2>
                  <IssuanceConfigurePanel
                    configure={configure}
                    patchConfigure={patchConfigure}
                    configureSection={configureSection}
                    setConfigureSection={setConfigureSection}
                    personas={list}
                    issuancePersonaId={issuancePersonaId ?? schoolId}
                    onIssuancePersonaId={setIssuancePersonaId}
                    ninjaProfile={!!ninjaProfile}
                    selectedTemplate={selectedTemplate}
                    onSelectTemplate={setSelectedTemplate}
                    onIssue={issueDemo}
                  />
                </section>

                <section className="issueVerify__previewColumn" aria-label="Menkyo preview output">
                  <div className="issueVerify__offerBand">
                    <h2 className="issueVerify__offerLabel">Menkyo</h2>
                  </div>
                  <div className="issueVerify__previewPane">
                    <MenkyoPreviewAside
                      issueOnly
                      stretchCard
                      previewSummary={previewSummary}
                      previewText={previewText}
                      onCopy={copyPreview}
                    />
                  </div>
                </section>
              </div>

              <p className="issueVerify__footerNote">
                This page is educational: proofs use a placeholder <code>proofValue</code>. For VP-shaped packages, use{' '}
                <Link to="/kensa">Kensa · Enbu</Link>. For credential-shaped checks without issuing here, open{' '}
                <Link to="/verify">{tInspect.name}</Link>.
              </p>
            </div>
          </div>
        ) : (
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
                    school), <strong>Kata</strong> flavor, and your codename on the subject. Change school or codename
                    in <Link to="/create-ninja-profile">ninja profile</Link> or the shell profile menu. With no profile
                    saved, we use the default <strong>Ed-ryū</strong> demo school and no operator name.
                  </p>

                  {!ninjaProfile ? (
                    <p className="issueVerify__profileHint">
                      No ninja profile in this browser —{' '}
                      <Link to="/create-ninja-profile">create one</Link> to issue under your identity, or continue with
                      the default demo issuer.
                    </p>
                  ) : null}

                  <div className="issueVerify__actions">
                    <button type="button" className="issueVerify__btn issueVerify__btn--primary" onClick={issueDemo}>
                      Issue demo Menkyo
                    </button>
                  </div>
                  <MenkyoPreviewAside
                    issueOnly={false}
                    previewSummary={previewSummary}
                    previewText={previewText}
                    onCopy={copyPreview}
                  />
                </div>

                <div>
                  <h2 className="issueVerify__sectionTitle">Verify (Menkyo path)</h2>
                  <p className="issueVerify__sectionBody">
                    After issuing, edit the JSON if you like, then run checks. Errors and warnings mirror the Kensa
                    credential tab.
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
                    }}
                    spellCheck={false}
                    placeholder='Click "Issue demo Menkyo" or paste a VerifiableCredential-shaped object.'
                  />
                  {parseError ? <p className="issueVerify__parseErr">{parseError}</p> : null}
                  <div className="issueVerify__actions" style={{ marginTop: '0.65rem' }}>
                    <button type="button" className="issueVerify__btn" onClick={runVerify}>
                      Run verify
                    </button>
                    <button
                      type="button"
                      className="issueVerify__btn"
                      onClick={() => {
                        setRawJson('')
                        setAppliedJson('')
                        setParseError(null)
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

              <p className="issueVerify__footerNote">
                This page is educational: proofs use a placeholder <code>proofValue</code>. For VP-shaped packages, use{' '}
                <Link to="/kensa">Kensa · Enbu</Link>.
              </p>
            </section>
          </div>
        )}
      </div>
    </DojoFlowPageShell>
  )
}
