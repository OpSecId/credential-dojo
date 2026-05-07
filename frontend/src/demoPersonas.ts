/** Shared demo persona types and offline mirror of GET /api/personas (Home + Discover Kasa). */

export type ProofSchool = 'ed25519' | 'ecdsa' | 'bbs' | 'mldsa'

export type PersonaPublic = {
  id: string
  label: string
  labelJa: string
  description: string
  proofSchool: ProofSchool
  didKey: string
  kataSamples: readonly string[]
}

export type PersonasPayload = {
  personas: PersonaPublic[]
  note: string
}

/** Default kata carousel when `/api/personas` is unavailable (order matches Ed-ryū). */
export const DEFAULT_KATA_SAMPLES = [
  'eddsa-rdfc-2022',
  'eddsa-jcs-2022',
  'vc-jwt',
  'ecdsa-rdfc-2019',
  'ecdsa-jcs-2019',
  'ecdsa-sd-2023',
  'bbs-2023',
  'mldsa44-rdfc-2024',
  'mldsa44-jcs-2024',
] as const

/** Mirrors backend `listDemoPersonas` for offline UI. */
export const DEMO_PERSONAS_OFFLINE: readonly PersonaPublic[] = [
  {
    id: 'ed-ryu',
    label: 'Ed-ryū',
    labelJa: 'エド流',
    description:
      'Demo school for Ed25519-based Data Integrity suites (e.g. eddsa-rdfc-2022, eddsa-jcs-2022).',
    proofSchool: 'ed25519',
    didKey: '',
    kataSamples: [...DEFAULT_KATA_SAMPLES],
  },
  {
    id: 'ec-ryu',
    label: 'Ec-ryū',
    labelJa: 'エック流',
    description:
      'Demo school for NIST P-256 / ECDSA classic Data Integrity: RFC canonicalization (ecdsa-rdfc-2019) and JSON canonicalization (ecdsa-jcs-2019).',
    proofSchool: 'ecdsa',
    didKey: '',
    kataSamples: ['ecdsa-rdfc-2019', 'ecdsa-jcs-2019'],
  },
  {
    id: 'sd-ryu',
    label: 'Sd-ryū',
    labelJa: 'エスディ流',
    description:
      'Demo school for ECDSA selective disclosure (ecdsa-sd-2023): same curve family as Ec-ryū, separate deterministic issuer key for SD-focused flows.',
    proofSchool: 'ecdsa',
    didKey: '',
    kataSamples: ['ecdsa-sd-2023'],
  },
  {
    id: 'bbs-ryu',
    label: 'BBS-ryū',
    labelJa: 'ビービーエス流',
    description:
      'Demo school for BLS12-381 / BBS unlinkable proofs — kata locked to bbs-2023. Issuer key is encoded on G2 per did:key conventions.',
    proofSchool: 'bbs',
    didKey: '',
    kataSamples: ['bbs-2023'],
  },
  {
    id: 'ml-ryu',
    label: 'ML-ryū',
    labelJa: 'エムエル流',
    description:
      'Demo school for FIPS 204 ML-DSA-44 Data Integrity (mldsa44-rdfc-2024, mldsa44-jcs-2024). Issuer public key uses multicodec mldsa-44-pub in did:key.',
    proofSchool: 'mldsa',
    didKey: '',
    kataSamples: ['mldsa44-rdfc-2024', 'mldsa44-jcs-2024'],
  },
]
