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
    title: 'Gate of Oaths',
    scene:
      'At first light, the gate captain hands you the war copybook: issuer doctrine, allowable claims, and the mission oath.',
    action: 'You bind your run to a Tehon so every later credential has a trusted origin.',
  },
  {
    term: productTerminology.katachi,
    title: 'Valley of Forms',
    scene:
      'Wind lashes through hanging scrolls as schema wardens test every field, context, and claim shape.',
    action: 'You survive the first trial by aligning Katachi before any proof steel is drawn.',
  },
  {
    term: productTerminology.kasa,
    title: 'Ridge of Schools',
    scene:
      'Three rival schools stand on the ridge, each carrying a distinct did:key banner and preferred proof kata.',
    action: 'You swear allegiance to one Kasa school for this mission run.',
  },
  {
    term: productTerminology.cryptosuites,
    title: 'Hall of Blades',
    scene:
      'Inside the hall, kata patterns are treated like blade forms: strict, repeatable, and unforgiving.',
    action: 'You lock in your cryptographic Kata stance for sign and verify combat.',
  },
  {
    term: productTerminology.credential,
    unionAction: productTerminology.credentialFromTemplate.name,
    title: 'Forge of Lineage',
    scene:
      'Sparks rise as the forge master hammers your copybook into a live credential line with traceable lineage.',
    action: 'A Tehon becomes Menkyo under fire, preserving its ancestral definition chain.',
  },
  {
    term: productTerminology.credential,
    title: 'License of the Road',
    scene:
      'Your new Menkyo is sealed with policy marks and mounted for the long road ahead.',
    action: 'Issuance completes: one battle-ready credential enters your possession.',
  },
  {
    term: productTerminology.wallet,
    title: 'Kinchaku Camp',
    scene:
      'You return to camp and pack issued records into the Kinchaku before night patrol begins.',
    action: 'Wallet inventory is organized for fast retrieval under pressure.',
  },
  {
    term: productTerminology.presentationRequest,
    title: 'Summons at Dusk',
    scene:
      'A verifier flare cuts the dusk sky and calls your unit to present proof under strict constraints.',
    action: 'A Shōkan challenge lands with required claims and timing pressure.',
  },
  {
    term: productTerminology.presentation,
    unionAction: 'Shōkan の Enbu',
    title: 'Circle of Demonstration',
    scene:
      'In the torchlit circle, you compose a response package from your wallet without over-sharing.',
    action: 'You craft Enbu precisely to satisfy the active Shōkan request.',
  },
  {
    term: productTerminology.presentation,
    unionAction: productTerminology.presentationInspection.name,
    title: 'Presentation Checkpoint',
    scene:
      'Checkpoint inspectors fan out your presentation and inspect its structure like battlefield intelligence.',
    action: 'Enbu no Kensa runs structural checks before the gate opens.',
  },
  {
    term: productTerminology.credential,
    unionAction: productTerminology.credentialInspection.name,
    title: 'Credential Checkpoint',
    scene:
      'A second inspection isolates each Menkyo, verifying it can stand alone under scrutiny.',
    action: 'Menkyo no Kensa validates credential structure one artifact at a time.',
  },
  {
    term: productTerminology.render,
    title: 'Gallery of Shinbi',
    scene:
      'After combat checks, the gallery renders raw records into readable proof stories for commanders.',
    action: 'Shinbi translates machine payloads into human-readable mission context.',
  },
  {
    term: productTerminology.handshake,
    title: 'Bridge Greeting',
    scene:
      'On the hanging bridge, both sides exchange first-contact signals before crossing together.',
    action: 'Teawase establishes trust and capability alignment for the final exchange.',
  },
  {
    term: productTerminology.exchange,
    title: 'Randori Crossing',
    scene:
      'Steel rings in the gorge as verifier and holder trade protocol moves in a live back-and-forth duel.',
    action: 'Randori continues turn-by-turn until both challenge and response settle.',
  },
  {
    term: productTerminology.workflow,
    title: 'War Map of Procedures',
    scene:
      'Back at command, veterans pin your route on the wall so future teams can repeat the mission.',
    action: 'Tejun captures the full runbook from issuance to presentation victory.',
  },
]

