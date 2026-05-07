/** Product metaphor names — keep in sync with `backend/src/terminology.ts` and README. */
export const productTerminology = {
  wallet: { name: 'Kinchaku', glyph: '巾着' },
  cryptosuites: { name: 'Kata', glyph: '型' },
  /** Proof school / issuer persona bucket (Discover Kasa, ninja profile school). */
  kasa: { name: 'Kasa', glyph: '笠' },
  /** Issuer-side definitions, offers, and blueprints — not an issued Menkyo. */
  template: { name: 'Tehon', glyph: '手本' },
  /**
   * Claim / credential structure (schemas, JSON-LD constraints)—the form data must take.
   * Glyph 形 (katachi) is “shape”; distinct from Kata (型), the cryptosuite pattern.
   */
  katachi: { name: 'Katachi', glyph: '形' },
  /** Issued W3C Verifiable Credential (the holder-facing license-like record). */
  credential: { name: 'Menkyo', glyph: '免許' },
  /** Menkyo produced from a Tehon: issuance / instantiated credential from a definition. */
  credentialFromTemplate: { name: 'Tehon の Menkyo', glyph: '手本の免許' },
  presentation: { name: 'Enbu', glyph: '演武' },
  /** Credential rendering/display experience (visual presentation layer). */
  render: { name: 'Shinbi', glyph: '審美' },
  /** Inspection of a verifiable presentation (Enbu): hybrid UI title + proper Japanese phrase. */
  presentationInspection: { name: 'Enbu の Kensa', glyph: '演武の検査' },
  /** Inspection of a single verifiable credential (Menkyo). */
  credentialInspection: { name: 'Menkyo の Kensa', glyph: '免許の検査' },
  /** Multi-step protocol back-and-forth (e.g. DIDComm, OID4* chases). */
  exchange: { name: 'Randori', glyph: '乱取り' },
  /** Initial pairing / capability handshake before deeper flows. */
  handshake: { name: 'Teawase', glyph: '手合わせ' },
  /** Orchestrated operational workflows — ordered steps in the platform (not protocol Randori). */
  workflow: { name: 'Tejun', glyph: '手順' },
} as const;
