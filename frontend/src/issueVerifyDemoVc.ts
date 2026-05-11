import type { PersonaPublic } from './demoPersonas'

/** Demo holder `did:key` — not tied to a live wallet; for sample Menkyo only. */
export const ISSUE_VERIFY_DEMO_HOLDER_DID = 'did:key:z6MkHolderExampleDemoDojo000000000000000'

/** Build a VC-shaped demo Menkyo for UI / Kensa-style checks (proof value is not real crypto). */
export function buildDemoMenkyo(persona: PersonaPublic): Record<string, unknown> {
  const isoNow = new Date().toISOString()
  const suite = persona.kataSamples[0] ?? 'eddsa-rdfc-2022'
  const vmFragment = persona.didKey.startsWith('did:key:')
    ? persona.didKey.slice('did:key:'.length)
    : persona.didKey
  return {
    '@context': ['https://www.w3.org/ns/credentials/v2'],
    id: `urn:uuid:${crypto.randomUUID()}`,
    type: ['VerifiableCredential', 'DojoDemoCredential'],
    issuer: persona.didKey,
    validFrom: isoNow,
    credentialSchema: { id: 'https://credential.ninja/schemas/dojo-demo-v1', type: 'JsonSchema' },
    credentialSubject: {
      id: ISSUE_VERIFY_DEMO_HOLDER_DID,
      note: `Demo Menkyo for proof school ${persona.label} (${persona.proofSchool}).`,
      pathway: 'Credential Dojo · Issue & verify',
    },
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
