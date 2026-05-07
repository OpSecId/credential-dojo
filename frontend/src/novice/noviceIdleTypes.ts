/** Browser-only idle progression — ties to routes, ninja profile, and home focus meter. */

export const NOVICE_IDLE_STORAGE_KEY = 'credential-dojo-novice-idle'
export const NOVICE_IDLE_VERSION = 2 as const

export type NoviceIdlePersisted = {
  v: typeof NOVICE_IDLE_VERSION
  totalInsight: number
  lastTickMs: number
  lessonsDone: Record<string, boolean>
  /** Training focus on home hit 100% at least once */
  everFocusPeak: boolean
  issuerXp: number
  verifierXp: number
  walletXp: number
  issuedCount: number
  verifiedCount: number
  receivedCount: number
  presentedCount: number
}

export type NoviceRankDef = {
  id: string
  titleEn: string
  titleJa: string
  minTotal: number
  blurb: string
}

/** Cumulative insight thresholds — same length as rank meta below. */
export const RANK_THRESHOLDS = [0, 140, 420, 980, 2100, 4500] as const

export const NOVICE_RANKS: readonly NoviceRankDef[] = [
  {
    id: 'novice',
    titleEn: 'Novice',
    titleJa: '見習い',
    minTotal: 0,
    blurb: 'You stand on the porch. Insight accrues while the dojo is open — faster on learning routes and when training focus is high at home.',
  },
  {
    id: 'initiate',
    titleEn: 'Initiate',
    titleJa: '門弟',
    minTotal: 140,
    blurb: 'Tehon, Menkyo, and Katachi start to feel distinct. Keep the lexicon and tools in rotation.',
  },
  {
    id: 'student',
    titleEn: 'Student',
    titleJa: '弟子',
    minTotal: 420,
    blurb: 'Kata suites and Kinchaku make sense together. Kensa and Shinbi are part of your routine.',
  },
  {
    id: 'adept',
    titleEn: 'Adept',
    titleJa: '熟練',
    minTotal: 980,
    blurb: 'Randori and Teawase are not just vocabulary — you see where they land in the CRMS story.',
  },
  {
    id: 'scholar',
    titleEn: 'Scholar',
    titleJa: '学士',
    minTotal: 2100,
    blurb: 'Proof schools, credential structures, and VC inspection paths feel like one continuous practice.',
  },
  {
    id: 'mentor',
    titleEn: 'Mentor',
    titleJa: '師範',
    minTotal: 4500,
    blurb: 'You could guide another operator through the dojo without losing the thread — highest rank for this idle path.',
  },
] as const

export type NoviceLessonDef = {
  id: string
  /** Exact pathname match (e.g. home only). */
  exactPath?: string
  /** Matched with pathname.startsWith — do not use `/` alone (matches everything). */
  pathPrefix?: string
  label: string
  tip: string
  /** Set by app logic, not path alone */
  flag?: 'ninja_profile' | 'focus_peak'
}

export const NOVICE_LESSONS: readonly NoviceLessonDef[] = [
  {
    id: 'visit_home',
    exactPath: '/',
    label: 'Train at the home dojo',
    tip: 'Kata carousel, Kinchaku, and the focus meter live here.',
  },
  {
    id: 'visit_lexicon',
    pathPrefix: '/lexicon',
    label: 'Open the full lexicon',
    tip: 'Canonical metaphors: Tehon, Katachi, Menkyo, Enbu, …',
  },
  {
    id: 'visit_kensa',
    pathPrefix: '/kensa',
    label: 'Run Kensa inspection',
    tip: 'Enbu の Kensa vs Menkyo の Kensa — structural passes.',
  },
  {
    id: 'visit_shinbi',
    pathPrefix: '/json-explorer',
    label: 'Explore with Shinbi',
    tip: 'JSON tree, pointers, and VC structure rail.',
  },
  {
    id: 'visit_kasa',
    pathPrefix: '/discover-kasa',
    label: 'Discover Kasa',
    tip: 'Proof schools, did:key issuers, and kata lists.',
  },
  {
    id: 'visit_profile',
    pathPrefix: '/create-ninja-profile',
    label: 'Shape your ninja profile',
    tip: 'Codename + Kasa — browser-only identity.',
  },
  {
    id: 'ninja_profile',
    flag: 'ninja_profile',
    label: 'Save a ninja profile',
    tip: 'Complete the wizard so the shell signs you in.',
  },
  {
    id: 'focus_peak',
    flag: 'focus_peak',
    label: 'Max the training focus meter',
    tip: 'On home: practice kata, switch school, cinch Kinchaku — 修業 to 100%.',
  },
] as const

/** Extra insight multiplier from current route (learning bonus). */
export function routeInsightBonus(pathname: string): number {
  if (pathname === '/') return 1.08
  if (pathname.startsWith('/lexicon')) return 1.38
  if (pathname.startsWith('/kensa')) return 1.28
  if (pathname.startsWith('/json-explorer')) return 1.22
  if (pathname.startsWith('/discover-kasa')) return 1.18
  if (pathname.startsWith('/create-ninja-profile')) return 1.12
  return 1
}

export type TickEnv = {
  pathname: string
  hasNinjaProfile: boolean
  /** 0–1 from home focus meter while on `/` */
  homeFocus01: number
  onHome: boolean
  documentVisible: boolean
}

export type NovicePerkDef = {
  id: 'validity_watch' | 'revocation_guard'
  title: string
  description: string
  unlockHint: string
}

export const NOVICE_PERKS: readonly NovicePerkDef[] = [
  {
    id: 'validity_watch',
    title: 'Validity Watch',
    description:
      'Your verifier and wallet routines tighten validity-window handling (validFrom/validUntil, issuanceDate/expirationDate).',
    unlockHint: 'Unlock at Verifier Lv 4 or 500+ verified.',
  },
  {
    id: 'revocation_guard',
    title: 'Revocation Guard',
    description:
      'Status checks become second nature (credentialStatus / status lists), reducing stale-credential risk across issuer and verifier flows.',
    unlockHint: 'Unlock at Issuer Lv 5 and Verifier Lv 5, or 1200+ verified.',
  },
] as const

export type NovicePerkState = {
  validityWatch: boolean
  revocationGuard: boolean
}

export type RankProgress = {
  rankIndex: number
  rank: NoviceRankDef
  progress01: number
  insightInRank: number
  insightToNext: number | null
}

export type NoviceTrackKey = 'issuer' | 'verifier' | 'wallet'

export type TrackProgress = {
  level: number
  xp: number
  xpInLevel: number
  xpToNext: number
  progress01: number
}

/** Increasing XP thresholds per level; reused for issuer/verifier/wallet tracks. */
export function trackLevelThreshold(level: number): number {
  if (level <= 1) return 0
  return Math.floor(70 * Math.pow(level - 1, 1.45))
}

export function computeTrackProgress(xp: number): TrackProgress {
  const safeXp = Math.max(0, xp)
  let level = 1
  while (level < 999 && safeXp >= trackLevelThreshold(level + 1)) {
    level += 1
  }
  const floor = trackLevelThreshold(level)
  const next = trackLevelThreshold(level + 1)
  const span = Math.max(1, next - floor)
  const xpInLevel = safeXp - floor
  return {
    level,
    xp: safeXp,
    xpInLevel,
    xpToNext: Math.max(0, next - safeXp),
    progress01: Math.min(1, xpInLevel / span),
  }
}

export function computePerkState(input: {
  issuerXp: number
  verifierXp: number
  verifiedCount: number
}): NovicePerkState {
  const issuer = computeTrackProgress(input.issuerXp)
  const verifier = computeTrackProgress(input.verifierXp)
  const validityWatch =
    verifier.level >= 4 || input.verifiedCount >= 500
  const revocationGuard =
    (issuer.level >= 5 && verifier.level >= 5) || input.verifiedCount >= 1200
  return { validityWatch, revocationGuard }
}

export function computeRankProgress(totalInsight: number): RankProgress {
  let rankIndex = 0
  for (let i = RANK_THRESHOLDS.length - 1; i >= 0; i--) {
    if (totalInsight >= RANK_THRESHOLDS[i]) {
      rankIndex = i
      break
    }
  }
  const rank = NOVICE_RANKS[rankIndex] ?? NOVICE_RANKS[0]
  const nextThreshold =
    rankIndex < RANK_THRESHOLDS.length - 1 ? RANK_THRESHOLDS[rankIndex + 1] : null
  const floor = RANK_THRESHOLDS[rankIndex]
  const insightInRank = totalInsight - floor
  if (nextThreshold === null) {
    return {
      rankIndex,
      rank,
      progress01: 1,
      insightInRank,
      insightToNext: null,
    }
  }
  const span = nextThreshold - floor
  const progress01 = Math.min(1, span > 0 ? insightInRank / span : 1)
  return {
    rankIndex,
    rank,
    progress01,
    insightInRank,
    insightToNext: nextThreshold - totalInsight,
  }
}
