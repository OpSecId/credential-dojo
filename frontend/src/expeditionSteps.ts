import { productTerminology } from './terminology'

export type ExpeditionStep = {
  term: { name: string; glyph: string }
  unionAction?: string
  title: string
  scene: string
  action: string
}

export const EXPEDITION_STEPS: readonly ExpeditionStep[] = [
  {
    term: productTerminology.template,
    title: 'The Copybook Gate',
    scene:
      'At sunrise, you arrive at the gates and receive the master copybook: issuer definitions, offer shapes, and mission intent.',
    action: 'You study what can be issued, but nothing is minted yet.',
  },
  {
    term: productTerminology.katachi,
    title: 'Valley of Forms',
    scene:
      'Every scroll in the valley must match strict form: schemas, contexts, and typed claim structure.',
    action: 'You align data shape before touching proofs.',
  },
  {
    term: productTerminology.kasa,
    title: 'Schools of the Ridge',
    scene:
      'On the ridge, proof schools gather under different hats. Each school carries a did:key identity and preferred kata.',
    action: 'You choose your issuer school for this run.',
  },
  {
    term: productTerminology.cryptosuites,
    title: 'Hall of Kata',
    scene:
      'You enter the practice hall where each kata is a fixed cryptographic form with strict execution.',
    action: 'You choose the suite pattern to sign and verify with.',
  },
  {
    term: productTerminology.credential,
    unionAction: productTerminology.credentialFromTemplate.name,
    title: 'Forge of Lineage',
    scene:
      'At the forge, the copybook becomes a live artifact. Definition lineage is preserved in every strike.',
    action: 'Issuance creates a Menkyo from the Tehon definition lineage.',
  },
  {
    term: productTerminology.credential,
    title: 'License of the Road',
    scene:
      'The issued record is sealed and ready to travel with the holder through future exchanges.',
    action: 'A Menkyo is minted and bound to policy and proofs.',
  },
  {
    term: productTerminology.wallet,
    title: 'Kinchaku Camp',
    scene:
      'At camp, holders secure their records in the pouch and prepare what can be presented later.',
    action: 'Menkyo are stored and organized in the wallet.',
  },
  {
    term: productTerminology.presentationRequest,
    title: 'Summons at Dusk',
    scene:
      'A verifier beacon lights the horizon with a challenge: exactly what proof must be shown.',
    action: 'A Shōkan arrives with constraints and requested claims.',
  },
  {
    term: productTerminology.presentation,
    unionAction: 'Shōkan の Enbu',
    title: 'Demonstration Circle',
    scene:
      'Under torchlight, the holder performs the response package shaped by the summons.',
    action: 'The holder assembles Enbu as the response to the active Shōkan.',
  },
  {
    term: productTerminology.presentation,
    unionAction: productTerminology.presentationInspection.name,
    title: 'Presentation Checkpoint',
    scene:
      'At the checkpoint, inspectors evaluate presentation structure and embedded credential cues.',
    action: 'Enbu no Kensa runs heuristic VP checks.',
  },
  {
    term: productTerminology.credential,
    unionAction: productTerminology.credentialInspection.name,
    title: 'Credential Checkpoint',
    scene:
      'A second checkpoint focuses on one credential at a time for cleaner structural review.',
    action: 'Menkyo no Kensa runs heuristic VC checks.',
  },
  {
    term: productTerminology.render,
    title: 'Gallery of Shinbi',
    scene:
      'Beyond inspection, records are displayed for humans with readable framing and context.',
    action: 'Credential and presentation data are rendered clearly.',
  },
  {
    term: productTerminology.handshake,
    title: 'Bridge Greeting',
    scene:
      'Before the deeper mission, parties exchange first-contact signals and align capabilities.',
    action: 'Teawase sets the initial pairing.',
  },
  {
    term: productTerminology.exchange,
    title: 'Randori Crossing',
    scene:
      'Now the full back-and-forth begins: multi-step protocol movement across issuer, holder, and verifier.',
    action: 'Stateful exchange continues until mission completion.',
  },
  {
    term: productTerminology.workflow,
    title: 'Map of Procedures',
    scene:
      'At the command tent, operators codify repeatable routes so future expeditions can run reliably.',
    action: 'Tejun captures the runbook from start to finish.',
  },
]

