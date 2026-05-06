/** Product metaphor names — keep in sync with `backend/src/terminology.ts` and README. */
export const productTerminology = {
  wallet: { name: 'Kinchaku', glyph: '巾着' },
  cryptosuites: { name: 'Kata', glyph: '型' },
  template: { name: 'Tehon', glyph: '手本' },
  credential: { name: 'Menkyo', glyph: '免許' },
  presentation: { name: 'Enbu', glyph: '演武' },
  /** Multi-step protocol back-and-forth (e.g. DIDComm, OID4* chases). */
  exchange: { name: 'Randori', glyph: '乱取り' },
  /** Initial pairing / capability handshake before deeper flows. */
  handshake: { name: 'Teawase', glyph: '手合わせ' },
} as const;
