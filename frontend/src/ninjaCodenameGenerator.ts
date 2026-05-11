const ADJECTIVES = [
  'Silent',
  'Winter',
  'Bronze',
  'Paper',
  'Azure',
  'Cedar',
  'Iron',
  'Jade',
  'Shadow',
  'Golden',
  'Crimson',
  'Swift',
  'Dawn',
  'Neon',
  'Crystal',
  'Hidden',
  'Bright',
  'Ancient',
  'Verdant',
  'Steady',
] as const

const NOUNS = [
  'Heron',
  'Crane',
  'Ledger',
  'Anchor',
  'Cipher',
  'Token',
  'Proof',
  'Path',
  'River',
  'Owl',
  'Fox',
  'Lotus',
  'Shard',
  'Key',
  'Vault',
  'Drift',
  'Bloom',
  'Sigil',
  'Badge',
  'Thread',
] as const

/** Random two-word codename (dojo flavor); trimmed length stays under profile limits. */
export function generateNinjaCodename(): string {
  const a = ADJECTIVES[Math.floor(Math.random() * ADJECTIVES.length)]
  const b = NOUNS[Math.floor(Math.random() * NOUNS.length)]
  return `${a} ${b}`
}
