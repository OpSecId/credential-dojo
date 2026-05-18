export const JOURNEY_STORAGE_KEY = 'credential-dojo-learning-journey'
export const JOURNEY_PENDING_START_KEY = 'credential-dojo-learning-journey-pending'
export const JOURNEY_VERSION = 1 as const

export type JourneyState = {
  v: typeof JOURNEY_VERSION
  started: boolean
  lastTickMs: number
  learningXp: number
  issuerTokens: number
  verifierTokens: number
  walletTokens: number
}

export type JourneyLevel = {
  level: number
  xpToNext: number
  progress01: number
}

export function journeyLevelThreshold(level: number): number {
  if (level <= 1) return 0
  return Math.floor(90 * Math.pow(level - 1, 1.42))
}

export function computeJourneyLevel(xp: number): JourneyLevel {
  const safe = Math.max(0, xp)
  let level = 1
  while (level < 999 && safe >= journeyLevelThreshold(level + 1)) level += 1
  const floor = journeyLevelThreshold(level)
  const next = journeyLevelThreshold(level + 1)
  return {
    level,
    xpToNext: Math.max(0, next - safe),
    progress01: Math.min(1, (safe - floor) / Math.max(1, next - floor)),
  }
}

export function routeLearningWeight(pathname: string): { issuer: number; verifier: number; wallet: number } {
  if (pathname.startsWith('/kensa') || pathname.startsWith('/verify') || pathname.startsWith('/menkyo')) {
    return { issuer: 0.75, verifier: 1.45, wallet: 0.95 }
  }
  if (pathname.startsWith('/issue-verify')) return { issuer: 1.25, verifier: 1.35, wallet: 0.75 }
  if (pathname === '/dojo' || pathname.startsWith('/dojo/')) {
    return { issuer: 1.4, verifier: 0.85, wallet: 1.05 }
  }
  if (pathname.startsWith('/json-explorer')) return { issuer: 1.05, verifier: 1.12, wallet: 1.18 }
  if (pathname.startsWith('/discover-kasa')) return { issuer: 1.4, verifier: 0.82, wallet: 0.96 }
  if (pathname.startsWith('/journey')) return { issuer: 1.15, verifier: 1.1, wallet: 1.2 }
  if (pathname.startsWith('/lexicon')) return { issuer: 1.2, verifier: 1.2, wallet: 1.2 }
  if (pathname.startsWith('/create-ninja-profile')) return { issuer: 0.92, verifier: 0.74, wallet: 1.35 }
  return { issuer: 1.1, verifier: 1.0, wallet: 1.15 }
}
