/** Mirrors Creddeck issuance demo options for the Dojo `/dojo/issuance` configure panel. */

export const ISSUANCE_DEMO_VCI_BASE = 'https://credential.ninja/demo-vci'

export const CRYPTOSUITES = [
  { value: 'eddsa-rdfc-2022', label: 'EdDSA + RDFC' },
  { value: 'ecdsa-rdfc-2019', label: 'ECDSA + RDFC' },
  { value: 'eddsa-jcs-2022', label: 'EdDSA + JCS' },
  { value: 'ecdsa-jcs-2019', label: 'ECDSA + JCS' },
] as const

export type RenderMethodTemplate = 'svg' | 'pdf' | 'html'

export const RENDER_SUITE_TOGGLES: readonly { id: string; value: RenderMethodTemplate; title: string }[] = [
  { id: 'dojo-issuance-render-svg', value: 'svg', title: 'SVG' },
  { id: 'dojo-issuance-render-pdf', value: 'pdf', title: 'PDF' },
  { id: 'dojo-issuance-render-html', value: 'html', title: 'HTML' },
]

export const PROTOCOLS = [
  { value: 'oid4vci' as const, label: 'OID4VCI — openid-credential-offer' },
  { value: 'vcalm' as const, label: 'VCALM — vcalm://' },
  { value: 'didcomm' as const, label: 'DIDComm — didcomm://' },
] as const

export type IssuanceProtocol = (typeof PROTOCOLS)[number]['value']

export type DidMethod = 'did:key' | 'did:web'

export const DID_METHODS: { value: DidMethod; label: string }[] = [
  { value: 'did:web', label: 'did:web — HTTP(S) hosted DID document' },
  { value: 'did:key', label: 'did:key — inline public-key DID' },
]

export type IssuanceConfigureSection = 'proof' | 'protocols' | 'schema' | 'render' | 'status'

export function credentialFormatLabel(type: string): string {
  if (type === 'jwt_vc_json') return 'JWT VC'
  if (type === 'sd-jwt-vc') return 'SD-JWT VC'
  if (type === 'ld_vc') return 'JSON-LD VC'
  return type
}
