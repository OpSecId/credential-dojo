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
    blurb:
      'Credential templates—the exemplar “copybook” issuers stamp into live records.',
  },
  {
    key: 'credential',
    title: productTerminology.credential.name,
    glyph: productTerminology.credential.glyph,
    blurb:
      'Issued W3C Verifiable Credentials—the license-like artifact a holder keeps.',
  },
  {
    key: 'presentation',
    title: productTerminology.presentation.name,
    glyph: productTerminology.presentation.glyph,
    blurb:
      'Verifiable presentations—a structured demonstration shown to verifiers.',
  },
  {
    key: 'exchange',
    title: productTerminology.exchange.name,
    glyph: productTerminology.exchange.glyph,
    blurb:
      'Protocol exchanges—multi-step, adaptive flows between agents (DIDComm, OID4*, …).',
  },
  {
    key: 'handshake',
    title: productTerminology.handshake.name,
    glyph: productTerminology.handshake.glyph,
    blurb:
      'Handshakes and pairing—light mutual “matching hands” before a longer Randori.',
  },
  {
    key: 'wallet',
    title: productTerminology.wallet.name,
    glyph: productTerminology.wallet.glyph,
    blurb:
      'The holder wallet—where Menkyo live and Enbu are composed.',
  },
  {
    key: 'cryptosuites',
    title: productTerminology.cryptosuites.name,
    glyph: productTerminology.cryptosuites.glyph,
    blurb:
      'Cryptosuites and proof suites—the fixed “form” for signing and verifying proofs.',
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
    credentialTerm: 'Credential templates & definitions',
    literal: [
      '**Tehon** (手本) literally means a model, pattern, or copybook—the example you copy when learning brushwork, craft, or procedure. It is the authoritative “this is how it should look.”',
    ],
    inPlatform: [
      'In the Dojo, **Tehon** names **credential templates**: JSON-LD shapes, credential definitions, offer layouts, and issuer-side blueprints that become concrete **Menkyo** (issued credentials) when you run issuance.',
    ],
  },
  {
    key: 'credential',
    credentialTerm: 'Issued W3C Verifiable Credentials',
    literal: [
      '**Menkyo** (免許) combines “exempt” and “permit.” In everyday Japanese it is a **license** (driving, etc.). In classical arts it can mean a **scroll or record** certifying transmission or rank.',
    ],
    inPlatform: [
      'Here **Menkyo** is the metaphor for **issued verifiable credentials**: signed artifacts that attest claims, bound to issuer policy and proof **Kata**. Holders carry them in **Kinchaku**.',
    ],
  },
  {
    key: 'presentation',
    credentialTerm: 'Verifiable presentations',
    literal: [
      '**Enbu** (演武) is a **public martial demonstration**—choreographed, visible to observers, and bounded in time. It shows skill and control rather than a private drill.',
    ],
    inPlatform: [
      '**Enbu** maps to **verifiable presentations**: the package a holder **shows** a verifier—proofs, selective disclosure, derived predicates—assembled from **Menkyo** and verified under the agreed **Kata**.',
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
]
