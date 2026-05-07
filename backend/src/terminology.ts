/** Product metaphor names — keep in sync with `frontend/src/terminology.ts` and README. */
export const productTerminology = {
  wallet: { name: "Kinchaku", glyph: "巾着" },
  cryptosuites: { name: "Kata", glyph: "型" },
  kasa: { name: "Kasa", glyph: "笠" },
  template: { name: "Tehon", glyph: "手本" },
  /** Claim / credential structure (schemas, contexts)—形 vs Kata 型 (cryptosuites). */
  katachi: { name: "Katachi", glyph: "形" },
  credential: { name: "Menkyo", glyph: "免許" },
  credentialFromTemplate: { name: "Tehon の Menkyo", glyph: "手本の免許" },
  presentation: { name: "Enbu", glyph: "演武" },
  render: { name: "Shinbi", glyph: "審美" },
  presentationInspection: { name: "Enbu の Kensa", glyph: "演武の検査" },
  credentialInspection: { name: "Menkyo の Kensa", glyph: "免許の検査" },
  /** Multi-step protocol back-and-forth (e.g. DIDComm, OID4* chases). */
  exchange: { name: "Randori", glyph: "乱取り" },
  /** Initial pairing / capability handshake before deeper flows. */
  handshake: { name: "Teawase", glyph: "手合わせ" },
  workflow: { name: "Tejun", glyph: "手順" },
} as const;
