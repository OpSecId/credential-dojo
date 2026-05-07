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

/** Ed-ryū (Ed25519 issuer): suites aligned with this school's key—Discover Kasa + home carousel. */
export const ED_RYU_KATA_SAMPLES = [
  'eddsa-rdfc-2022',
  'eddsa-jcs-2022',
] as const

/** Full demo suite vocabulary when a persona omits `kataSamples` (fallback). */
export const DEFAULT_KATA_SAMPLES = [
  ...ED_RYU_KATA_SAMPLES,
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
    description: 'Ed25519 baseline issuer for core Data Integrity credential demos.',
    proofSchool: 'ed25519',
    didKey: 'did:key:z6Mkjv9qpuroLvWybHc9yppTwTjZjid5EWSpRPfo7wXaKE4e',
    kataSamples: [...ED_RYU_KATA_SAMPLES],
  },
  {
    id: 'ec-ryu',
    label: 'Ec-ryū',
    labelJa: 'エック流',
    description: 'NIST P-256 issuer focused on classic ECDSA Data Integrity flows.',
    proofSchool: 'ecdsa',
    didKey: 'did:key:zDnaeyno2z6yEZAoUUGrLJxALx5s2UjATrPAKc8omWDH4vTYR',
    kataSamples: ['ecdsa-rdfc-2019', 'ecdsa-jcs-2019'],
  },
  {
    id: 'ec-sd-ryu',
    label: 'Ec-sd-ryū',
    labelJa: 'エックSD流',
    description: 'NIST P-256 issuer for selective-disclosure scenarios; key isolated from Ec-ryū.',
    proofSchool: 'ecdsa',
    didKey: 'did:key:zDnaeph83bpFMikC9uhDHKfoQXFdghzjBf9zWVZkdJEoNwZ2T',
    kataSamples: ['ecdsa-sd-2023'],
  },
  {
    id: 'bbs-ryu',
    label: 'BBS-ryū',
    labelJa: 'ビービーエス流',
    description: 'BLS12-381 issuer for unlinkable/selective-disclosure proof style (BBS family).',
    proofSchool: 'bbs',
    didKey:
      'did:key:zUC7F4WWHiN9M95MmvRG5kYLbigioPXXiVCDMX16eeiibmJMuqNpeW4R7Y6rgqpzUmyepMVGE1AvSBe8RieJ22XVofZmi9GCVmhoNvELpmpsjwJ74xg8f6jQyz9pSYDZqk8XB9h',
    kataSamples: ['bbs-2023'],
  },
  {
    id: 'cl-ryu',
    label: 'CL-ryū',
    labelJa: 'シーエル流',
    description: 'Ed25519 issuer tuned for AnonCreds-style CL credential interoperability.',
    proofSchool: 'anoncreds',
    didKey: 'did:key:z6Mkf8qftdETUv6rssaPJWEHX7EqVdk9zfFB7eVmWfbxvq1M',
    kataSamples: ['anoncreds-2023'],
  },
  {
    id: 'ml-ryu',
    label: 'ML-ryū',
    labelJa: 'エムエル流',
    description: 'Post-quantum ML-DSA-44 issuer aligned with FIPS 204 Data Integrity exploration.',
    proofSchool: 'mldsa',
    didKey:
      'did:key:z4sdZTVVjJ3GKVhy8u4soqHH3BNH14LULTJSaBW4VvAppsdKqy2MCaibJe4E9dbTDeq4VAbeJSCwzL6TYKc6DUzVrpQhpYhPFPtG5yyKwXmnyBnMtDNx7baPgjCf9dordANq4fiBPHHhiUcRkzEnyTW6uMRxd77jAp6VXtf1exu1Xvqh85Cf3vvvjTxZRg9ncrJGTdoLVLGYkJxC8FZm2upkqgKpvrSuDm3NC3BkAnK3bzp6axiEuy1GpeSuNKqg3buhgDZUvk9ZGZocz4GmQbAFyooPJxQj5VaJQ6B4bfidxNgxuWhEY4jsbkZh1RhDfB9KipyJsGuivBnpW41pjJJNKzTk8t1xwMg94T34zMBPcRpy9avHNBXbi1Fgv3TtC4Ch31ttqY2Pp7j8YrEEZsmH9bhK7wAbdVyFeqTH5YW9WdS4L5Po4aKFFxms3ydyKxcTzKiJzCRT841QKrCRS7GbAbcBHi739M7s83zUzhnRaCA9KwaBUaGdEUrcikZffWo9h5gDBNPCck58c7X1nWmmgtNoNTCysQ6cA2Dci9gF3X7viXekuXZnwYNR4oSRNM5Qa3TJTMPPaQ7nUmA7gP5bbzbSAfqMUyYKXkQa5kAeymKHJySeeghUmWJMd6TQt5cJ88e6wCAok5wYThNVqZXg23YJ6wRXnxCQn6HzHQEwvyu9wHwuvdH4yM58MtqTFQJ4urdNDpUfRVFrKp6Yu65bGRUV4rfCu2DRyrGUNavd1m2qV92bVStkeTKBY9KDPXPgwzotcHzurAsaMmvnCvpehVMjZbwH3f7i2bUSVNNiGxpeDhHKwv8bJw5dbAfNmhXNng6QVrLDxhhN6TRWyA7GrmDxkqepmc2PHLQu5rmLBoLtzYjjgfdU3Fjktzbr491E621mmzRheuG9gMJdmbjpwL1NdiEjhwewwSPN3scsuqYXamHhpGM6NrGZBVPcEthj9eqTTRopdWgZrtxeNaQYfFMEbrvXyxru7QKuyqQbNAPkUn8dqsaRsftB5rMiy1q4cWfA8LiSvbiJNQh79yoCPSjRahxxkP4asu9XT5dkNsGhAxdUbmeitvJsMzwtNaWh5EAajKSMjy1FZUvyXTeSihApajDobRhZxYm8bLq47ZzypTD3gnvoia8CG4aFTWKfrHWUdWeVDAEyzhgc7cMNvaBoKnxGNBBfe55QtLaQHSztbvgSud3QqvEgG32ZkdYJAzXgzTPencVkDY6bgPYDpArjmx2nXcLJVGMY6sBTBBqY6CrgepwQWwNsy2tKBoJHHvuasYnxY1H24yUpizzJYKYewzoVkGdnz5QfFZkhe1cMDEBzocnxYskL5yPAC19edc3qrtHTuPQYjd1ujkfFM6bHvbYStaZpDgoS15GeUPs3DH7xiMZbdWotoWKXaqL4GMRMp1Xqc9Pf8QZcW6ZkGTdYNxr1j7jsmhm2ZgNMHM7mRcgWycYotyd8wWcrMJycEaJuWqEhM5ZZkCaBg4op67HZiENhAa59hReHV6BRDmmwHy5AosAYu1saAXwEHaW5juStmTurrX7k9frhXN8CEAEYQZ36cwkGTNFRwBRwJuMsHGm9nyfwjYttvVAY5ueHVV91YJTpoJ9yBQyGkazVVnLWE69vLq1RAXoKsrfkAiKcFGvSvCpnERkw6hkUXF5Vuqrjyemop6376gc7VdiN7DrzqdjZZ1cba6MwbnLenT2rNMttYCnVJKsXLWy6a7dmQwaMS2ryE7ykvYu6qE8XhV8YBq8Hgyvz2iTDyGoZGZdmrMdvgzpMBMmckfwV5p7u',
    kataSamples: ['mldsa44-rdfc-2024', 'mldsa44-jcs-2024'],
  },
]
