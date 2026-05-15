import type { PersonaPublic } from './demoPersonas'

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
}

/** `/dojo/issuance` — five demo Tehon-style shapes users can mint (browser-only JSON). */
export const ISSUE_CREDENTIAL_TEMPLATES: readonly IssueCredentialTemplateMeta[] = [
  {
    id: 'dojo-demo',
    title: 'Dojo demo',
    subtitle: 'Baseline Menkyo · Dojo path',
    glyph: '忍',
  },
  {
    id: 'university-degree',
    title: 'University degree',
    subtitle: 'Academic award VC',
    glyph: '卒',
  },
  {
    id: 'employment-offer',
    title: 'Employment',
    subtitle: 'Role & employer',
    glyph: '職',
  },
  {
    id: 'training-milestone',
    title: 'Training pass',
    subtitle: 'Course completion',
    glyph: '錬',
  },
  {
    id: 'event-access',
    title: 'Event access',
    subtitle: 'Admission / tier',
    glyph: '門',
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

function proofBlock(persona: PersonaPublic, isoNow: string): Record<string, unknown> {
  const suite = persona.kataSamples[0] ?? 'eddsa-rdfc-2022'
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

function vcEnvelope(
  persona: PersonaPublic,
  options: BuildDemoMenkyoOptions | undefined,
  params: {
    types: string[]
    schemaId: string
    credentialSubject: Record<string, unknown>
  },
): Record<string, unknown> {
  const isoNow = new Date().toISOString()
  const credentialId = options?.credentialId ?? `urn:uuid:${crypto.randomUUID()}`
  return {
    '@context': ['https://www.w3.org/ns/credentials/v2'],
    id: credentialId,
    type: params.types,
    issuer: persona.didKey,
    validFrom: isoNow,
    credentialSchema: { id: params.schemaId, type: 'JsonSchema' },
    credentialSubject: params.credentialSubject,
    proof: proofBlock(persona, isoNow),
  }
}

/** Build a VC-shaped demo Menkyo for UI / Kensa-style checks (proof value is not real crypto). */
export function buildDemoMenkyo(persona: PersonaPublic, options?: BuildDemoMenkyoOptions): Record<string, unknown> {
  return buildDemoCredential(persona, 'dojo-demo', options)
}

/** Mint-shaped demo VC for the selected `/dojo/issuance` template (same proof posture as Dojo demo). */
export function buildDemoCredential(
  persona: PersonaPublic,
  templateId: IssueCredentialTemplateId,
  options?: BuildDemoMenkyoOptions,
): Record<string, unknown> {
  const isoNow = new Date().toISOString()
  const op = options?.operatorCodename?.trim()

  switch (templateId) {
    case 'dojo-demo':
      return vcEnvelope(persona, options, {
        types: ['VerifiableCredential', 'DojoDemoCredential'],
        schemaId: 'https://credential.ninja/schemas/dojo-demo-v1',
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
