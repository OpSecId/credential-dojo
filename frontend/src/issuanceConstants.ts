/** Mirrors Creddeck issuance demo options for the Dojo `/dojo` configure panel. */

export const ISSUANCE_DEMO_VCI_BASE = 'https://credential.ninja/demo-vci'

/** JSON-LD @context for DOJO / credential.ninja demo VCs. */
export const CREDENTIAL_NINJA_V1_CONTEXT = 'https://credential.ninja/v1'

export const VC_DEMO_CONTEXTS = [
  'https://www.w3.org/ns/credentials/v2',
  CREDENTIAL_NINJA_V1_CONTEXT,
] as const

/** Data Integrity cryptosuites for interaction / proof generation — not issuance configure. */
export const INTERACTION_CRYPTOSUITES = [
  { value: 'eddsa-rdfc-2022', label: 'EdDSA + RDFC' },
  { value: 'ecdsa-rdfc-2019', label: 'ECDSA + RDFC' },
  { value: 'eddsa-jcs-2022', label: 'EdDSA + JCS' },
  { value: 'ecdsa-jcs-2019', label: 'ECDSA + JCS' },
] as const

export type InteractionCryptosuite = (typeof INTERACTION_CRYPTOSUITES)[number]['value']

/** @deprecated Use INTERACTION_CRYPTOSUITES — kept for upcoming VCALM interaction URI UI. */
export const CRYPTOSUITES = INTERACTION_CRYPTOSUITES

export type RenderMethodTemplate = 'svg' | 'pdf' | 'html'

export const RENDER_SUITE_TOGGLES: readonly { id: string; value: RenderMethodTemplate; title: string }[] = [
  { id: 'dojo-issuance-render-svg', value: 'svg', title: 'SVG' },
  { id: 'dojo-issuance-render-pdf', value: 'pdf', title: 'PDF' },
  { id: 'dojo-issuance-render-html', value: 'html', title: 'HTML' },
]

export type StatusListPurpose = 'revocation' | 'suspension'

export const STATUS_LIST_TOGGLES: readonly { value: StatusListPurpose; title: string }[] = [
  { value: 'revocation', title: 'Revocation' },
  { value: 'suspension', title: 'Suspension' },
]

/** Credential schema format — demo panel exposes JSON (JsonSchema) only. */
export type CredentialSchemaFormat = 'json'

export const SCHEMA_FORMAT_TOGGLES: readonly { value: CredentialSchemaFormat; title: string }[] = [
  { value: 'json', title: 'JSON' },
]

/** Holder interaction URI protocols (VCALM / DIDComm / OID4VCI) — not part of the VC envelope. */
export const INTERACTION_PROTOCOLS = [
  { value: 'didcomm' as const, label: 'DIDComm — didcomm://' },
  { value: 'vcalm' as const, label: 'VCALM — vcalm://' },
  { value: 'oid4vci' as const, label: 'OID4VCI — openid-credential-offer' },
] as const

export type InteractionProtocol = (typeof INTERACTION_PROTOCOLS)[number]['value']

/** @deprecated Use INTERACTION_PROTOCOLS — kept for upcoming VCALM interaction URI UI. */
export const PROTOCOLS = INTERACTION_PROTOCOLS

/** @deprecated Use InteractionProtocol */
export type IssuanceProtocol = InteractionProtocol

export const PROTOCOL_TOGGLES: readonly { value: InteractionProtocol; title: string }[] = [
  { value: 'didcomm', title: 'DIDComm' },
  { value: 'vcalm', title: 'VCALM' },
  { value: 'oid4vci', title: 'OID4VCI' },
]

export type DidMethod = 'did:key' | 'did:web'

export const DID_METHODS: { value: DidMethod; label: string }[] = [
  { value: 'did:key', label: 'did:key — inline public-key DID' },
  { value: 'did:web', label: 'did:web — HTTP(S) hosted DID document' },
]

/** Demo issuer when Verification method is did:web (hosted at credential.ninja). */
export const ISSUANCE_DEMO_DID_WEB_ISSUER = 'did:web:credential.ninja'

/** Assertion verification method referenced on the demo Data Integrity proof. */
export const ISSUANCE_DEMO_DID_WEB_VERIFICATION_METHOD = `${ISSUANCE_DEMO_DID_WEB_ISSUER}#key-1`
