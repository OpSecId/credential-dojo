/** Shared demo persona types and offline mirror of GET /api/personas (Home + Discover Kasa). */

export type ProofSchool = 'ed25519' | 'ecdsa' | 'bbs' | 'mldsa' | 'anoncreds'

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
  'anoncreds-2023',
] as const

/**
 * Mirrors backend `listDemoPersonas` for offline UI.
 * `did:key` strings are copied from the API implementation (`credential-dojo:demo-persona:v1`);
 * keep them aligned when backend key derivation changes.
 */
export const DEMO_PERSONAS_OFFLINE: readonly PersonaPublic[] = [
  {
    id: 'ed-ryu',
    label: 'Ed-ryū',
    labelJa: 'エド流',
    description:
      'Ed25519 issuer; kataSamples is the full dojo carousel (every demo suite string). Other Kasa list only suites aligned with their issuer key.',
    proofSchool: 'ed25519',
    didKey: 'did:key:z6Mkjv9qpuroLvWybHc9yppTwTjZjid5EWSpRPfo7wXaKE4e',
    kataSamples: [...DEFAULT_KATA_SAMPLES],
  },
  {
    id: 'ec-ryu',
    label: 'Ec-ryū',
    labelJa: 'エック流',
    description:
      'Demo school for NIST P-256 / ECDSA classic Data Integrity: RFC canonicalization (ecdsa-rdfc-2019) and JSON canonicalization (ecdsa-jcs-2019).',
    proofSchool: 'ecdsa',
    didKey: 'did:key:zDnaeyno2z6yEZAoUUGrLJxALx5s2UjATrPAKc8omWDH4vTYR',
    kataSamples: ['ecdsa-rdfc-2019', 'ecdsa-jcs-2019'],
  },
  {
    id: 'sd-ryu',
    label: 'Ec-ryū (SD)',
    labelJa: 'エック流（SD）',
    description:
      'Ec-ryū selective-disclosure track (ecdsa-sd-2023): same P-256 family as classic Ec-ryū, separate deterministic issuer key for SD-focused flows.',
    proofSchool: 'ecdsa',
    didKey: 'did:key:zDnaepAwC6i8pBuwTDt91zrhNRAa972E68i6rnHAua25dsT4C',
    kataSamples: ['ecdsa-sd-2023'],
  },
  {
    id: 'bbs-ryu',
    label: 'BBS-ryū',
    labelJa: 'ビービーエス流',
    description:
      'Demo school for BLS12-381 / BBS unlinkable proofs — kata locked to bbs-2023. Issuer key is encoded on G2 per did:key conventions.',
    proofSchool: 'bbs',
    didKey:
      'did:key:zUC7F4WWHiN9M95MmvRG5kYLbigioPXXiVCDMX16eeiibmJMuqNpeW4R7Y6rgqpzUmyepMVGE1AvSBe8RieJ22XVofZmi9GCVmhoNvELpmpsjwJ74xg8f6jQyz9pSYDZqk8XB9h',
    kataSamples: ['bbs-2023'],
  },
  {
    id: 'anoncreds-ryu',
    label: 'AnonCreds-ryū',
    labelJa: 'アノンクレッズ流',
    description:
      'Demo school for the AnonCreds Data Integrity cryptosuite (anoncreds-2023): issuer material uses Ed25519 in did:key, aligned with common Hyperledger AnonCreds stacks.',
    proofSchool: 'anoncreds',
    didKey: 'did:key:z6Mkg9Ju4xrGZ6T1mNjQnNSHicdQqKzBaCFyzTYKH6dHFKaj',
    kataSamples: ['anoncreds-2023'],
  },
  {
    id: 'ml-ryu',
    label: 'ML-ryū',
    labelJa: 'エムエル流',
    description:
      'Demo school for FIPS 204 ML-DSA-44 Data Integrity (mldsa44-rdfc-2024, mldsa44-jcs-2024). Issuer public key uses multicodec mldsa-44-pub in did:key.',
    proofSchool: 'mldsa',
    didKey:
      'did:key:z4sdZTVVjJ3GKVhy8u4soqHH3BNH14LULTJSaBW4VvAppsdKqy2MCaibJe4E9dbTDeq4VAbeJSCwzL6TYKc6DUzVrpQhpYhPFPtG5yyKwXmnyBnMtDNx7baPgjCf9dordANq4fiBPHHhiUcRkzEnyTW6uMRxd77jAp6VXtf1exu1Xvqh85Cf3vvvjTxZRg9ncrJGTdoLVLGYkJxC8FZm2upkqgKpvrSuDm3NC3BkAnK3bzp6axiEuy1GpeSuNKqg3buhgDZUvk9ZGZocz4GmQbAFyooPJxQj5VaJQ6B4bfidxNgxuWhEY4jsbkZh1RhDfB9KipyJsGuivBnpW41pjJJNKzTk8t1xwMg94T34zMBPcRpy9avHNBXbi1Fgv3TtC4Ch31ttqY2Pp7j8YrEEZsmH9bhK7wAbdVyFeqTH5YW9WdS4L5Po4aKFFxms3ydyKxcTzKiJzCRT841QKrCRS7GbAbcBHi739M7s83zUzhnRaCA9KwaBUaGdEUrcikZffWo9h5gDBNPCck58c7X1nWmmgtNoNTCysQ6cA2Dci9gF3X7viXekuXZnwYNR4oSRNM5Qa3TJTMPPaQ7nUmA7gP5bbzbSAfqMUyYKXkQa5kAeymKHJySeeghUmWJMd6TQt5cJ88e6wCAok5wYThNVqZXg23YJ6wRXnxCQn6HzHQEwvyu9wHwuvdH4yM58MtqTFQJ4urdNDpUfRVFrKp6Yu65bGRUV4rfCu2DRyrGUNavd1m2qV92bVStkeTKBY9KDPXPgwzotcHzurAsaMmvnCvpehVMjZbwH3f7i2bUSVNNiGxpeDhHKwv8bJw5dbAfNmhXNng6QVrLDxhhN6TRWyA7GrmDxkqepmc2PHLQu5rmLBoLtzYjjgfdU3Fjktzbr491E621mmzRheuG9gMJdmbjpwL1NdiEjhwewwSPN3scsuqYXamHhpGM6NrGZBVPcEthj9eqTTRopdWgZrtxeNaQYfFMEbrvXyxru7QKuyqQbNAPkUn8dqsaRsftB5rMiy1q4cWfA8LiSvbiJNQh79yoCPSjRahxxkP4asu9XT5dkNsGhAxdUbmeitvJsMzwtNaWh5EAajKSMjy1FZUvyXTeSihApajDobRhZxYm8bLq47ZzypTD3gnvoia8CG4aFTWKfrHWUdWeVDAEyzhgc7cMNvaBoKnxGNBBfe55QtLaQHSztbvgSud3QqvEgG32ZkdYJAzXgzTPencVkDY6bgPYDpArjmx2nXcLJVGMY6sBTBBqY6CrgepwQWwNsy2tKBoJHHvuasYnxY1H24yUpizzJYKYewzoVkGdnz5QfFZkhe1cMDEBzocnxYskL5yPAC19edc3qrtHTuPQYjd1ujkfFM6bHvbYStaZpDgoS15GeUPs3DH7xiMZbdWotoWKXaqL4GMRMp1Xqc9Pf8QZcW6ZkGTdYNxr1j7jsmhm2ZgNMHM7mRcgWycYotyd8wWcrMJycEaJuWqEhM5ZZkCaBg4op67HZiENhAa59hReHV6BRDmmwHy5AosAYu1saAXwEHaW5juStmTurrX7k9frhXN8CEAEYQZ36cwkGTNFRwBRwJuMsHGm9nyfwjYttvVAY5ueHVV91YJTpoJ9yBQyGkazVVnLWE69vLq1RAXoKsrfkAiKcFGvSvCpnERkw6hkUXF5Vuqrjyemop6376gc7VdiN7DrzqdjZZ1cba6MwbnLenT2rNMttYCnVJKsXLWy6a7dmQwaMS2ryE7ykvYu6qE8XhV8YBq8Hgyvz2iTDyGoZGZdmrMdvgzpMBMmckfwV5p7u',
    kataSamples: ['mldsa44-rdfc-2024', 'mldsa44-jcs-2024'],
  },
]
