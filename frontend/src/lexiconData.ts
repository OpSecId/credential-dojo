import { productTerminology } from './terminology'

export type LexiconKey = keyof typeof productTerminology

/** Short cards on the home page */
export const LEXICON_ENTRIES: {
  key: LexiconKey
  title: string
  glyph: string
  blurb: string
}[] = [
  {
    key: 'template',
    title: productTerminology.template.name,
    glyph: productTerminology.template.glyph,
    blurb: 'Issuer copybook—definitions & offers; not Menkyo until issued.',
  },
  {
    key: 'katachi',
    title: productTerminology.katachi.name,
    glyph: productTerminology.katachi.glyph,
    blurb: 'Claim & type structure—schemas & contexts; not proof Kata.',
  },
  {
    key: 'credential',
    title: productTerminology.credential.name,
    glyph: productTerminology.credential.glyph,
    blurb: 'Issued VCs—holder “license” record.',
  },
  {
    key: 'credentialFromTemplate',
    title: productTerminology.credentialFromTemplate.name,
    glyph: productTerminology.credentialFromTemplate.glyph,
    blurb: 'Menkyo from a Tehon—definition → issued credential lineage.',
  },
  {
    key: 'presentation',
    title: productTerminology.presentation.name,
    glyph: productTerminology.presentation.glyph,
    blurb: 'Verifiable presentations shown to verifiers.',
  },
  {
    key: 'presentationRequest',
    title: productTerminology.presentationRequest.name,
    glyph: productTerminology.presentationRequest.glyph,
    blurb: 'Verifier presentation request/challenge before Enbu.',
  },
  {
    key: 'render',
    title: productTerminology.render.name,
    glyph: productTerminology.render.glyph,
    blurb: 'Render Menkyo/Enbu JSON for people—not cryptographic Kensa.',
  },
  {
    key: 'presentationInspection',
    title: productTerminology.presentationInspection.name,
    glyph: productTerminology.presentationInspection.glyph,
    blurb: 'VP-shaped JSON checks (heuristics only).',
  },
  {
    key: 'credentialInspection',
    title: productTerminology.credentialInspection.name,
    glyph: productTerminology.credentialInspection.glyph,
    blurb: 'Single VC-shaped JSON checks (heuristics only).',
  },
  {
    key: 'exchange',
    title: productTerminology.exchange.name,
    glyph: productTerminology.exchange.glyph,
    blurb: 'Stateful protocol chases—DIDComm, OID4*, …',
  },
  {
    key: 'handshake',
    title: productTerminology.handshake.name,
    glyph: productTerminology.handshake.glyph,
    blurb: 'Light pairing before a longer Randori.',
  },
  {
    key: 'workflow',
    title: productTerminology.workflow.name,
    glyph: productTerminology.workflow.glyph,
    blurb: 'Operator runbooks—ordered steps, not wire Randori.',
  },
  {
    key: 'wallet',
    title: productTerminology.wallet.name,
    glyph: productTerminology.wallet.glyph,
    blurb: 'Holder wallet—store Menkyo, compose Enbu.',
  },
  {
    key: 'cryptosuites',
    title: productTerminology.cryptosuites.name,
    glyph: productTerminology.cryptosuites.glyph,
    blurb: 'Named proof “forms”—suites & canonicalization.',
  },
  {
    key: 'kasa',
    title: productTerminology.kasa.name,
    glyph: productTerminology.kasa.glyph,
    blurb: 'Proof schools—did:key + Kata per persona.',
  },
]

export type LexiconArticle = {
  key: LexiconKey
  credentialTerm: string
  /** Paragraphs; use **term** for bold spans */
  literal: string[]
  inPlatform: string[]
}

/** Full lexicon: original sense vs credential / VC role */
export const LEXICON_ARTICLES: LexiconArticle[] = [
  {
    key: 'template',
    credentialTerm: 'Issuer-side definitions, offers, and exemplars (Tehon)',
    literal: [
      '**Tehon** (手本) literally means a model, pattern, or copybook—the example you copy when learning brushwork, craft, or procedure. It is the authoritative “this is how it should look.”',
    ],
    inPlatform: [
      '**Tehon** names **issuer-side definitions and exemplars**: **credential definitions** (the VC *kind* you will issue), offer layouts, and issuer blueprints—the **copybook**, not the holder artifact. Structural **shape** of claims and types is **Katachi** (形). None of this is **Menkyo** yet. When issuance runs, the platform produces **Tehon の Menkyo**: a concrete **Menkyo** instantiated from that **Tehon**.',
    ],
  },
  {
    key: 'katachi',
    credentialTerm: 'Credential & claim structure (schemas, contexts)',
    literal: [
      '**Katachi** (形) means **form** or **figure**—the shape something is meant to take. It is not the same character as **Kata** (型), the **fixed pattern** of a budō form or, in this product, a cryptosuite recipe.',
    ],
    inPlatform: [
      '**Katachi** names **schemas and structural constraints** for credentials and claims: JSON Schema, JSON-LD `@context` and type rules, and similar “what shape must this data have?” artifacts. **Tehon** is the issuer **copybook** (definitions, offers, blueprints); **Katachi** is the **form** those pieces conform to. **Kata** stays the **proof machinery**—algorithms and suites—not the claim skeleton.',
    ],
  },
  {
    key: 'credential',
    credentialTerm: 'Issued W3C Verifiable Credentials',
    literal: [
      '**Menkyo** (免許) combines “exempt” and “permit.” In everyday Japanese it is a **license** (driving, etc.). In classical arts it can mean a **scroll or record** certifying transmission or rank.',
    ],
    inPlatform: [
      '**Menkyo** means **issued** verifiable credentials: signed artifacts that attest claims, bound to issuer policy and proof **Kata**. Holders carry them in **Kinchaku**. When a **Menkyo** is minted from issuer definitions, call that lineage **Tehon の Menkyo**—the Menkyo **of** (from) the Tehon.',
    ],
  },
  {
    key: 'credentialFromTemplate',
    credentialTerm: 'Issued Menkyo from a Tehon (definition → credential)',
    literal: [
      '**Tehon no menkyo** (手本の免許) reads as **the Menkyo from the Tehon**—the licensed record that follows the exemplar. Grammatically **の** ties **definition → issued artifact**, like **Enbu no kensa** ties **demonstration → inspection**.',
    ],
    inPlatform: [
      'Use **Tehon の Menkyo** when copy must stress **issuance lineage**: preview of what will be issued, credential-offer flows, or “live Menkyo bound to this Tehon.” It is still **Menkyo** (same holder artifact); the phrase clarifies **which Tehon** it came from.',
    ],
  },
  {
    key: 'presentation',
    credentialTerm: 'Verifiable presentations',
    literal: [
      '**Enbu** (演武) is a **public martial demonstration**—choreographed, visible to observers, and bounded in time. It shows skill and control rather than a private drill.',
    ],
    inPlatform: [
      '**Enbu** maps to **verifiable presentations**: the package a holder **shows** a verifier—proofs, selective disclosure, derived predicates—assembled from **Menkyo** and verified under the agreed **Kata**. In normal flow, a verifier sends a **Shōkan** first, then the holder prepares the matching Enbu response.',
    ],
  },
  {
    key: 'presentationRequest',
    credentialTerm: 'Verifier presentation request / proof challenge',
    literal: [
      '**Shōkan** (招喚) is a summons or call-in: an explicit request to appear and demonstrate. It implies a directed ask rather than a full exchange.',
    ],
    inPlatform: [
      '**Shōkan** names a **presentation request**: verifier requirements, requested claims/predicates, and proof expectations sent to a holder before any **Enbu** is returned. Think of it as the “ask” that shapes what Enbu gets assembled from available **Menkyo**.',
    ],
  },
  {
    key: 'presentationInspection',
    credentialTerm: 'Verifiable presentation inspection (Enbu)',
    literal: [
      '**Kensa** (検査) is **inspection** or **examination**—the same word used for audits, safety checks, and quality gates. **Enbu no kensa** (演武の検査) reads naturally as **“inspection of the demonstration.”**',
    ],
    inPlatform: [
      'In the SPA we surface **Enbu の Kensa** as the hybrid product title and **演武の検査** as the proper Japanese phrase. The **Kensa** page runs **structural heuristics** on VP-shaped JSON (e.g. `VerifiablePresentation` or `verifiableCredential` arrays)—**not** full cryptographic verification, which belongs to a verifier running the agreed **Kata**.',
    ],
  },
  {
    key: 'render',
    credentialTerm: 'Credential rendering and display layer',
    literal: [
      '**Shinbi** (審美) concerns appreciation, appearance, and how something is perceived when presented.',
    ],
    inPlatform: [
      '**Shinbi** names the **render/display experience**: formatting, visual framing, and readable presentation of Menkyo/Enbu JSON. It is about how credential data is shown to people, not whether it cryptographically passes checks.',
    ],
  },
  {
    key: 'credentialInspection',
    credentialTerm: 'Single credential inspection (Menkyo)',
    literal: [
      '**Menkyo no kensa** (免許の検査) parallels **Enbu no kensa**: **inspection of the license-like record**—one **Menkyo** artifact rather than the whole presentation package.',
    ],
    inPlatform: [
      '**Menkyo の Kensa** / **免許の検査** names the **credential-shaped** inspection path: paste a VC JSON object and get light structural hints (`VerifiableCredential`, `@context`, issuer / subject fields). Use **Enbu の Kensa** when the payload is a **presentation**.',
    ],
  },
  {
    key: 'exchange',
    credentialTerm: 'Protocol exchanges (multi-step flows)',
    literal: [
      '**Randori** (乱取り) is “free taking”—partners practice **without a fixed script**, responding to each other within rules. It is the back-and-forth of engagement, not a single strike.',
    ],
    inPlatform: [
      '**Randori** names **protocol exchanges**: DIDComm threads, OID4VCI/OID4VP chases, and other **stateful, multi-message** interactions between issuer, holder, and verifier agents.',
    ],
  },
  {
    key: 'handshake',
    credentialTerm: 'Connection & capability handshakes',
    literal: [
      '**Teawase** (手合わせ) means **matching hands**—a light, mutual touch to test distance, timing, or respect before serious work. It is cooperative sizing-up, not a match to the finish.',
    ],
    inPlatform: [
      '**Teawase** is the metaphor for **first contact and pairing**: DID exchange intros, capability lists, offer/answer alignment—before a longer **Randori** or a full **Enbu**.',
    ],
  },
  {
    key: 'workflow',
    credentialTerm: 'Orchestrated workflows & runbooks (operator-side)',
    literal: [
      '**Tejun** (手順) means **procedure** or **sequence of steps**—the ordered hand movements of a task. It is the checklist shape of work, not the improvisational sparring of randori.',
    ],
    inPlatform: [
      '**Tejun** names **workflows** in the platform: issuance pipelines, verification runbooks, approvals—**authored step graphs** you operate inside the CRMS. Contrast **Randori**: adaptive **protocol** messaging between parties across the wire. A reusable workflow definition can be glossed **Tejun の Tehon** (手順の手本)—the copybook for the procedure—parallel to **Tehon の Menkyo** for credentials.',
    ],
  },
  {
    key: 'wallet',
    credentialTerm: 'Holder wallet experience',
    literal: [
      '**Kinchaku** (巾着) is a **small drawstring bag**—something you cinch shut, carry daily, and open when you need what is inside.',
    ],
    inPlatform: [
      '**Kinchaku** is the **platform wallet**: where holders **store, organize, and present** **Menkyo**, and where they prepare an **Enbu** when a verifier asks for proofs.',
    ],
  },
  {
    key: 'cryptosuites',
    credentialTerm: 'Cryptosuites & proof / signature suites',
    literal: [
      '**Kata** (型) is a **fixed form**—a pattern repeated the same way so everyone can see whether execution is correct. In budō it is the syllabus of movement everyone recognizes.',
    ],
    inPlatform: [
      '**Kata** names **cryptosuites** (and related proof suites): the **named, standardized recipe**—algorithms, canonicalization, key expectations—used when minting or checking proofs for W3C VCs (e.g. Data Integrity suite strings).',
    ],
  },
  {
    key: 'kasa',
    credentialTerm: 'Proof schools (issuer personas)',
    literal: [
      '**Kasa** (笠) is a **woven straw hat**—travel gear that shades the face on the road. It suggests a **portable identity** and a little shelter while you move between places.',
    ],
    inPlatform: [
      '**Kasa** names the **proof school porch**: the lineup of **issuer personas** (Ed-ryū, Ec-ryū, …) on **Discover Kasa**, each with a stable **`did:key`** and preferred **Kata** samples. In the SPA, your **ninja profile** picks one **Kasa** so the home **Kata** carousel and persona context match that school.',
    ],
  },
]

/**
 * Bold spans (`**…**`) link only when they exactly match a canonical product title
 * (`productTerminology.*.name`). Longest title wins (e.g. `Tehon の Menkyo` before `Tehon`).
 */
export function lexiconAnchorForBoldSegment(segment: string): LexiconKey | null {
  const t = segment.trim()
  const entries = Object.entries(productTerminology) as [LexiconKey, { name: string }][]
  const sorted = entries.sort(
    (a, b) =>
      b[1].name.length - a[1].name.length || a[1].name.localeCompare(b[1].name),
  )
  for (const [key, { name }] of sorted) {
    if (t === name) return key
  }
  return null
}
