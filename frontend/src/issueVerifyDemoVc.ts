import type { PersonaPublic, ProofSchool } from './demoPersonas'
import {
  ISSUANCE_DEMO_DID_WEB_ISSUER,
  ISSUANCE_DEMO_DID_WEB_VERIFICATION_METHOD,
  ISSUANCE_DEMO_VCI_BASE,
  VC_DEMO_CONTEXTS,
  type DidMethod,
} from './issuanceConstants'

/** Demo holder `did:key` — not tied to a live wallet; for sample Menkyo only. */
export const ISSUE_VERIFY_DEMO_HOLDER_DID = 'did:key:z6MkHolderExampleDemoDojo000000000000000'

export type BuildDemoMenkyoOptions = {
  /** Ninja profile codename — recorded on the credential subject as issuer operator context. */
  operatorCodename?: string | null
  /**
   * Fixed credential id (e.g. stable preview). If omitted, a new `urn:uuid:…` is generated.
   */
  credentialId?: string
}

/** Issuance deck options (Creddeck-style) applied when building `/dojo` demo VCs. */
export type DojoIssuanceConfigure = {
  didMethod: 'did:key' | 'did:web'
  validFromDate: string
  validUntilDate: string
  includeCredentialSchema: boolean
  includeRevocation: boolean
  includeSuspension: boolean
  /** When true, set `proof.created` on the Data Integrity proof (not credential issuanceDate). */
  includeProofCreated: boolean
  renderMethodTemplate: 'svg' | 'pdf' | 'html' | null
}

export type BuildDemoCredentialOptions = BuildDemoMenkyoOptions & {
  configure?: DojoIssuanceConfigure
}

export type IssueCredentialTemplateId =
  | 'university-degree'
  | 'employment-offer'
  | 'training-milestone'
  | 'event-access'

export type IssueCredentialTemplateMeta = {
  id: IssueCredentialTemplateId
  /** Short label on the template card */
  title: string
  /** One-line hint under the title */
  subtitle: string
  /** Decorative mark (emoji or single character) */
  glyph: string
  /** Technology label for credential_configuration-style hints (not embedded on VC). */
  formatType: string
  /** Stable id for render/schema paths in this demo. */
  configurationId: string
}

/** Fallback Tehon id when issuer mapping has no entry (browser demo only). */
export const DEFAULT_ISSUE_TEMPLATE_ID: IssueCredentialTemplateId = 'university-degree'

/** `/dojo` — demo Tehon-style shapes users can mint (browser-only JSON). */
export const ISSUE_CREDENTIAL_TEMPLATES: readonly IssueCredentialTemplateMeta[] = [
  {
    id: 'university-degree',
    title: 'University degree',
    subtitle: 'Academic award VC',
    glyph: '卒',
    formatType: 'jwt_vc_json',
    configurationId: 'university-degree',
  },
  {
    id: 'employment-offer',
    title: 'Employment',
    subtitle: 'Role & employer',
    glyph: '職',
    formatType: 'jwt_vc_json',
    configurationId: 'employment-offer',
  },
  {
    id: 'training-milestone',
    title: 'Training pass',
    subtitle: 'Course completion',
    glyph: '錬',
    formatType: 'jwt_vc_json',
    configurationId: 'training-milestone',
  },
  {
    id: 'event-access',
    title: 'Event access',
    subtitle: 'Admission / tier',
    glyph: '門',
    formatType: 'jwt_vc_json',
    configurationId: 'event-access',
  },
]

/**
 * Creddeck-style: one primary demo Tehon (template) per proof-school issuer.
 * Unknown persona ids fall back by `proofSchool`, then to `DEFAULT_ISSUE_TEMPLATE_ID`.
 */
const ISSUE_CREDENTIAL_PRIMARY_TEMPLATE_BY_PERSONA_ID: Readonly<
  Record<string, IssueCredentialTemplateId>
> = {
  'ed-ryu': 'university-degree',
  'ec-ryu': 'university-degree',
  'ec-sd-ryu': 'employment-offer',
  'bbs-ryu': 'event-access',
  'cl-ryu': 'training-milestone',
  'ml-ryu': 'university-degree',
}

const PRIMARY_TEMPLATE_BY_PROOF_SCHOOL: Readonly<Record<ProofSchool, IssueCredentialTemplateId>> = {
  ed25519: 'university-degree',
  ecdsa: 'university-degree',
  bbs: 'event-access',
  anoncreds: 'training-milestone',
  mldsa: 'university-degree',
}

export function issueCredentialTemplatesForIssuer(
  persona: PersonaPublic,
): readonly IssueCredentialTemplateMeta[] {
  const id =
    ISSUE_CREDENTIAL_PRIMARY_TEMPLATE_BY_PERSONA_ID[persona.id] ??
    PRIMARY_TEMPLATE_BY_PROOF_SCHOOL[persona.proofSchool] ??
    DEFAULT_ISSUE_TEMPLATE_ID
  const meta = ISSUE_CREDENTIAL_TEMPLATES.find((t) => t.id === id)
  if (!meta) throw new Error(`Missing issue template meta for id: ${id}`)
  return [meta]
}

const PREVIEW_CREDENTIAL_IDS: Record<IssueCredentialTemplateId, string> = {
  'university-degree': 'urn:uuid:00000000-0000-4000-8000-000000000002',
  'employment-offer': 'urn:uuid:00000000-0000-4000-8000-000000000003',
  'training-milestone': 'urn:uuid:00000000-0000-4000-8000-000000000004',
  'event-access': 'urn:uuid:00000000-0000-4000-8000-000000000005',
}

export function previewCredentialIdForTemplate(templateId: IssueCredentialTemplateId): string {
  return PREVIEW_CREDENTIAL_IDS[templateId]
}

export function issuerDidForMethod(persona: PersonaPublic, didMethod: DidMethod = 'did:key'): string {
  if (didMethod === 'did:web') return ISSUANCE_DEMO_DID_WEB_ISSUER
  return persona.didKey
}

function verificationMethodForIssuer(persona: PersonaPublic, didMethod: DidMethod = 'did:key'): string {
  if (didMethod === 'did:web') return ISSUANCE_DEMO_DID_WEB_VERIFICATION_METHOD
  const issuerDid = persona.didKey
  const vmFragment = issuerDid.startsWith('did:key:') ? issuerDid.slice('did:key:'.length) : issuerDid
  return `${issuerDid}#${vmFragment}`
}

function issuerBlock(persona: PersonaPublic, didMethod: DidMethod = 'did:key'): Record<string, unknown> {
  return {
    id: issuerDidForMethod(persona, didMethod),
    name: persona.label,
    description: persona.description,
  }
}

function proofBlock(
  persona: PersonaPublic,
  isoNow: string,
  didMethod: DidMethod,
  includeCreated: boolean,
): Record<string, unknown> {
  const suite = persona.kataSamples[0] ?? 'eddsa-rdfc-2022'
  const proof: Record<string, unknown> = {
    type: 'DataIntegrityProof',
    cryptosuite: suite,
    verificationMethod: verificationMethodForIssuer(persona, didMethod),
    proofPurpose: 'assertionMethod',
    proofValue: 'z58DEMODOJOPLACEHOLDERNOTAVERIFIEDSIGNATURE',
  }
  if (includeCreated) {
    proof.created = isoNow
  }
  return proof
}

function subjectWithOperator(base: Record<string, unknown>, operatorCodename?: string | null): Record<string, unknown> {
  const op = operatorCodename?.trim()
  if (!op) return base
  return { ...base, issuerOperator: op }
}

/** ISO 8601 UTC without fractional seconds (e.g. `2026-05-06T00:00:00Z`). */
function isoUtcNoMs(d: Date = new Date()): string {
  return d.toISOString().replace(/\.\d{3}Z$/, 'Z')
}

function bitstringStatusEntry(purpose: 'revocation' | 'suspension', index: string): Record<string, unknown> {
  const base = ISSUANCE_DEMO_VCI_BASE.replace(/\/$/, '')
  return {
    id: `${base}/status/${purpose}#${index}`,
    type: 'BitstringStatusListEntry',
    statusPurpose: purpose,
    statusListIndex: index,
    statusListCredential: `${base}/status/${purpose}-list.jwt`,
  }
}

function vcEnvelope(
  persona: PersonaPublic,
  options: BuildDemoCredentialOptions | undefined,
  params: {
    types: string[]
    schemaId: string
    credentialSubject: Record<string, unknown>
    templateMeta: IssueCredentialTemplateMeta
  },
): Record<string, unknown> {
  const isoNow = isoUtcNoMs()
  const credentialId = options?.credentialId ?? `urn:uuid:${crypto.randomUUID()}`
  const cfg = options?.configure
  const didMethod: DidMethod = cfg?.didMethod ?? 'did:key'

  const includeRootSchema = !cfg || cfg.includeCredentialSchema

  const out: Record<string, unknown> = {
    '@context': [...VC_DEMO_CONTEXTS],
    id: credentialId,
    type: params.types,
    name: params.templateMeta.title,
    description: params.templateMeta.subtitle,
    issuer: issuerBlock(persona, didMethod),
    credentialSubject: params.credentialSubject,
    proof: proofBlock(persona, isoNow, didMethod, cfg ? cfg.includeProofCreated : true),
  }

  const validFromTrimmed = cfg?.validFromDate?.trim()
  if (validFromTrimmed) {
    out.validFrom = `${validFromTrimmed}T00:00:00Z`
  } else if (!cfg) {
    out.validFrom = isoNow
  }

  if (includeRootSchema) {
    out.credentialSchema = { id: params.schemaId, type: 'JsonSchema' }
  }

  if (cfg?.validUntilDate?.trim()) {
    out.validUntil = `${cfg.validUntilDate.trim()}T23:59:59Z`
  }

  if (cfg && (cfg.includeRevocation || cfg.includeSuspension)) {
    const vcStatus: Record<string, unknown>[] = []
    if (cfg.includeRevocation) vcStatus.push(bitstringStatusEntry('revocation', '0'))
    if (cfg.includeSuspension) vcStatus.push(bitstringStatusEntry('suspension', '0'))
    out.credentialStatus = vcStatus
  }

  if (cfg?.renderMethodTemplate) {
    const t = cfg.renderMethodTemplate
    const base = ISSUANCE_DEMO_VCI_BASE.replace(/\/$/, '')
    const templateMediaType =
      t === 'svg' ? 'image/svg+xml' : t === 'pdf' ? 'application/pdf' : 'text/html'
    out.renderMethod = [
      {
        id: `${base}/render-methods/${params.templateMeta.configurationId}-${t}`,
        type: 'TemplateRenderMethod',
        template: `${base}/render-templates/${params.templateMeta.configurationId}.${t}`,
        templateMediaType,
      },
    ]
  }

  return out
}

/** Build a VC-shaped demo Menkyo for UI / Kensa-style checks (proof value is not real crypto). */
export function buildDemoMenkyo(persona: PersonaPublic, options?: BuildDemoMenkyoOptions): Record<string, unknown> {
  return buildDemoCredential(persona, DEFAULT_ISSUE_TEMPLATE_ID, options)
}

/** Mint-shaped demo VC for the selected `/dojo` template (browser demo). */
export function buildDemoCredential(
  persona: PersonaPublic,
  templateId: IssueCredentialTemplateId,
  options?: BuildDemoCredentialOptions,
): Record<string, unknown> {
  const isoNow = isoUtcNoMs()
  const op = options?.operatorCodename?.trim()
  const templateMeta = ISSUE_CREDENTIAL_TEMPLATES.find((t) => t.id === templateId)
  if (!templateMeta) {
    throw new Error(`Unknown issue template: ${templateId}`)
  }

  switch (templateId) {
    case 'university-degree':
      return vcEnvelope(persona, options, {
        types: ['VerifiableCredential', 'UniversityDegreeCredential'],
        schemaId: 'https://example.edu/schemas/university-degree-v1',
        templateMeta,
        credentialSubject: subjectWithOperator(
          {
            id: ISSUE_VERIFY_DEMO_HOLDER_DID,
            degreeName: 'B.Sc. Computer Science',
            degreeType: 'BachelorDegree',
            college: { id: 'https://example.edu', name: 'Example University' },
            yearAwarded: String(new Date(isoNow).getUTCFullYear()),
            pathway: 'Credential Dojo · Issue · degree template',
          },
          op,
        ),
      })

    case 'employment-offer':
      return vcEnvelope(persona, options, {
        types: ['VerifiableCredential', 'EmploymentCredential'],
        schemaId: 'https://credential.ninja/schemas/employment-demo-v1',
        templateMeta,
        credentialSubject: subjectWithOperator(
          {
            id: ISSUE_VERIFY_DEMO_HOLDER_DID,
            organizationName: 'Example Corp',
            roleTitle: 'Senior Software Engineer',
            employmentType: 'full-time',
            startDate: isoNow.slice(0, 10),
            pathway: 'Credential Dojo · Issue · employment template',
          },
          op,
        ),
      })

    case 'training-milestone':
      return vcEnvelope(persona, options, {
        types: ['VerifiableCredential', 'TrainingCompletionCredential'],
        schemaId: 'https://credential.ninja/schemas/training-completion-v1',
        templateMeta,
        credentialSubject: subjectWithOperator(
          {
            id: ISSUE_VERIFY_DEMO_HOLDER_DID,
            courseTitle: 'Verifiable credentials foundations',
            provider: { name: 'Credential Dojo Academy' },
            completedDate: isoNow.slice(0, 10),
            outcome: 'pass',
            pathway: 'Credential Dojo · Issue · training template',
          },
          op,
        ),
      })

    case 'event-access':
      return vcEnvelope(persona, options, {
        types: ['VerifiableCredential', 'EventAdmissionCredential'],
        schemaId: 'https://credential.ninja/schemas/event-admission-v1',
        templateMeta,
        credentialSubject: subjectWithOperator(
          {
            id: ISSUE_VERIFY_DEMO_HOLDER_DID,
            eventName: 'OpenWallet Summit 2026',
            admissionTier: 'general',
            venue: 'Example Convention Center',
            pathway: 'Credential Dojo · Issue · event template',
          },
          op,
        ),
      })
  }
}
