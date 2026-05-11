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

/** Build a VC-shaped demo Menkyo for UI / Kensa-style checks (proof value is not real crypto). */
export function buildDemoMenkyo(persona: PersonaPublic, options?: BuildDemoMenkyoOptions): Record<string, unknown> {
  const isoNow = new Date().toISOString()
  const suite = persona.kataSamples[0] ?? 'eddsa-rdfc-2022'
  const vmFragment = persona.didKey.startsWith('did:key:')
    ? persona.didKey.slice('did:key:'.length)
    : persona.didKey
  const credentialId = options?.credentialId ?? `urn:uuid:${crypto.randomUUID()}`
  const op = options?.operatorCodename?.trim()
  const credentialSubject: Record<string, unknown> = {
    id: ISSUE_VERIFY_DEMO_HOLDER_DID,
    note: `Demo Menkyo for proof school ${persona.label} (${persona.proofSchool}).`,
    pathway: 'Credential Dojo · Issue & verify',
  }
  if (op) {
    credentialSubject.issuerOperator = op
  }
  return {
    '@context': ['https://www.w3.org/ns/credentials/v2'],
    id: credentialId,
    type: ['VerifiableCredential', 'DojoDemoCredential'],
    issuer: persona.didKey,
    validFrom: isoNow,
    credentialSchema: { id: 'https://credential.ninja/schemas/dojo-demo-v1', type: 'JsonSchema' },
    credentialSubject,
    proof: {
      type: 'DataIntegrityProof',
      cryptosuite: suite,
      verificationMethod: `${persona.didKey}#${vmFragment}`,
      proofPurpose: 'assertionMethod',
      created: isoNow,
      proofValue: 'z58DEMODOJOPLACEHOLDERNOTAVERIFIEDSIGNATURE',
    },
  }
}
