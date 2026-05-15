import type { PersonaPublic } from './demoPersonas'
import { ISSUANCE_DEMO_VCI_BASE, type IssuanceProtocol } from './issuanceConstants'

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

/** Issuance deck options (Creddeck-style) applied when building `/dojo/issuance` demo VCs. */
export type DojoIssuanceConfigure = {
  protocols: readonly IssuanceProtocol[]
  cryptosuite: string
  didMethod: 'did:key' | 'did:web'
  validFromDate: string
  validUntilDate: string
  includeCredentialSchema: boolean
  includeRevocation: boolean
  includeSuspension: boolean
  includeTimestamp: boolean
  renderMethodTemplate: 'svg' | 'pdf' | 'html' | null
}

export type BuildDemoCredentialOptions = BuildDemoMenkyoOptions & {
  configure?: DojoIssuanceConfigure
}

export type IssueCredentialTemplateId =
  | 'dojo-demo'
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
  /** Technology label for issuanceProfile.credential_configuration.type */
  formatType: string
  /** Stable id for issuanceProfile.credential_configuration.id */
  configurationId: string
}

/** `/dojo/issuance` — five demo Tehon-style shapes users can mint (browser-only JSON). */
export const ISSUE_CREDENTIAL_TEMPLATES: readonly IssueCredentialTemplateMeta[] = [
  {
    id: 'dojo-demo',
    title: 'Dojo demo',
    subtitle: 'Baseline Menkyo · Dojo path',
    glyph: '忍',
    formatType: 'jwt_vc_json',
    configurationId: 'dojo-demo',
  },
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

const PREVIEW_CREDENTIAL_IDS: Record<IssueCredentialTemplateId, string> = {
  'dojo-demo': 'urn:uuid:00000000-0000-4000-8000-000000000001',
  'university-degree': 'urn:uuid:00000000-0000-4000-8000-000000000002',
  'employment-offer': 'urn:uuid:00000000-0000-4000-8000-000000000003',
  'training-milestone': 'urn:uuid:00000000-0000-4000-8000-000000000004',
  'event-access': 'urn:uuid:00000000-0000-4000-8000-000000000005',
}

export function previewCredentialIdForTemplate(templateId: IssueCredentialTemplateId): string {
  return PREVIEW_CREDENTIAL_IDS[templateId]
}

function proofBlock(persona: PersonaPublic, isoNow: string, cryptosuiteOverride?: string): Record<string, unknown> {
  const suite =
    cryptosuiteOverride?.trim() || (persona.kataSamples[0] ?? 'eddsa-rdfc-2022')
  const vmFragment = persona.didKey.startsWith('did:key:')
    ? persona.didKey.slice('did:key:'.length)
    : persona.didKey
  return {
    type: 'DataIntegrityProof',
    cryptosuite: suite,
    verificationMethod: `${persona.didKey}#${vmFragment}`,
    proofPurpose: 'assertionMethod',
    created: isoNow,
    proofValue: 'z58DEMODOJOPLACEHOLDERNOTAVERIFIEDSIGNATURE',
  }
}

function subjectWithOperator(base: Record<string, unknown>, operatorCodename?: string | null): Record<string, unknown> {
  const op = operatorCodename?.trim()
  if (!op) return base
  return { ...base, issuerOperator: op }
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

function buildIssuanceProfileBlock(
  meta: IssueCredentialTemplateMeta,
  cfg: DojoIssuanceConfigure,
  isoNow: string,
): Record<string, unknown> {
  const base = ISSUANCE_DEMO_VCI_BASE.replace(/\/$/, '')
  const profile: Record<string, unknown> = {
    protocols: [...cfg.protocols],
    cryptosuite: cfg.cryptosuite,
    did_method: cfg.didMethod,
    credential_configuration: {
      id: meta.configurationId,
      name: meta.title,
      type: meta.formatType,
      description: meta.subtitle,
    },
  }
  if (cfg.validFromDate.trim()) {
    profile.validFrom = `${cfg.validFromDate.trim()}T00:00:00.000Z`
  }
  if (cfg.validUntilDate.trim()) {
    profile.validUntil = `${cfg.validUntilDate.trim()}T23:59:59.999Z`
  }

  const statusEntries: Record<string, unknown>[] = []
  if (cfg.includeRevocation) statusEntries.push(bitstringStatusEntry('revocation', '0'))
  if (cfg.includeSuspension) statusEntries.push(bitstringStatusEntry('suspension', '0'))
  if (statusEntries.length > 0) {
    profile.credentialStatus = statusEntries
  }

  if (cfg.includeCredentialSchema) {
    profile.credentialSchema = [
      {
        id: `${base}/schemas/${meta.configurationId}.json`,
        type: 'JsonSchema',
        jsonSchema: {
          $schema: 'https://json-schema.org/draft/2020-12/schema',
          title: meta.title,
          description: meta.subtitle,
          type: 'object',
          properties: {
            credentialSubject: {
              type: 'object',
              description: 'Claims about the subject; shape is illustrative for Dojo mock issuance.',
            },
          },
          required: ['credentialSubject'],
        },
      },
    ]
  }

  if (cfg.includeTimestamp) {
    profile.issuedAt = isoNow
  }

  if (cfg.renderMethodTemplate) {
    const t = cfg.renderMethodTemplate
    const templateMediaType =
      t === 'svg' ? 'image/svg+xml' : t === 'pdf' ? 'application/pdf' : 'text/html'
    profile.renderMethod = [
      {
        id: `${base}/render-methods/${meta.configurationId}-${t}`,
        type: 'TemplateRenderMethod',
        template: `${base}/render-templates/${meta.configurationId}.${t}`,
        templateMediaType,
      },
    ]
  }

  return profile
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
  const isoNow = new Date().toISOString()
  const credentialId = options?.credentialId ?? `urn:uuid:${crypto.randomUUID()}`
  const cfg = options?.configure

  let validFrom = isoNow
  if (cfg?.validFromDate?.trim()) {
    validFrom = `${cfg.validFromDate.trim()}T00:00:00.000Z`
  }

  const includeRootSchema = !cfg || cfg.includeCredentialSchema

  const out: Record<string, unknown> = {
    '@context': ['https://www.w3.org/ns/credentials/v2'],
    id: credentialId,
    type: params.types,
    issuer: persona.didKey,
    validFrom,
    credentialSubject: params.credentialSubject,
    proof: proofBlock(persona, isoNow, cfg?.cryptosuite),
  }

  if (includeRootSchema) {
    out.credentialSchema = { id: params.schemaId, type: 'JsonSchema' }
  }

  if (cfg?.validUntilDate?.trim()) {
    out.validUntil = `${cfg.validUntilDate.trim()}T23:59:59.999Z`
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

  if (cfg) {
    out.issuanceProfile = buildIssuanceProfileBlock(params.templateMeta, cfg, isoNow)
  }

  return out
}

/** Build a VC-shaped demo Menkyo for UI / Kensa-style checks (proof value is not real crypto). */
export function buildDemoMenkyo(persona: PersonaPublic, options?: BuildDemoMenkyoOptions): Record<string, unknown> {
  return buildDemoCredential(persona, 'dojo-demo', options)
}

/** Mint-shaped demo VC for the selected `/dojo/issuance` template (same proof posture as Dojo demo). */
export function buildDemoCredential(
  persona: PersonaPublic,
  templateId: IssueCredentialTemplateId,
  options?: BuildDemoCredentialOptions,
): Record<string, unknown> {
  const isoNow = new Date().toISOString()
  const op = options?.operatorCodename?.trim()
  const templateMeta = ISSUE_CREDENTIAL_TEMPLATES.find((t) => t.id === templateId)
  if (!templateMeta) {
    throw new Error(`Unknown issue template: ${templateId}`)
  }

  switch (templateId) {
    case 'dojo-demo':
      return vcEnvelope(persona, options, {
        types: ['VerifiableCredential', 'DojoDemoCredential'],
        schemaId: 'https://credential.ninja/schemas/dojo-demo-v1',
        templateMeta,
        credentialSubject: subjectWithOperator(
          {
            id: ISSUE_VERIFY_DEMO_HOLDER_DID,
            note: `Demo Menkyo for proof school ${persona.label} (${persona.proofSchool}).`,
            pathway: 'Credential Dojo · Issue',
          },
          op,
        ),
      })

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
