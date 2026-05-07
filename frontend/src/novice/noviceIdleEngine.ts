import {
  computePerkState,
  NOVICE_LESSONS,
  type NoviceIdlePersisted,
  type TickEnv,
  routeInsightBonus,
} from './noviceIdleTypes'

const MAX_DELTA_MS = 8 * 60 * 60 * 1000

/** Live rate estimate (for UI) — keep in sync with `applyIdleTick` multipliers. */
export function previewInsightPerSec(
  env: TickEnv,
  lessonsDone: Record<string, boolean>,
  totalInsight: number,
  hasNinjaProfile: boolean,
): number {
  const routeMult = routeInsightBonus(env.pathname)
  const profileMult = hasNinjaProfile ? 1.14 : 1
  const lessonBonus =
    1 +
    Math.min(0.45, Object.values(lessonsDone).filter(Boolean).length * 0.04)
  const tierApprox = Math.floor(totalInsight / 500)
  const rankMult = 1 + Math.min(0.85, tierApprox * 0.06)
  const focusMult = env.onHome ? 1 + env.homeFocus01 * 0.65 : 1
  const visMult = env.documentVisible ? 1 : 0.32
  const basePerSec = 0.11
  return basePerSec * routeMult * profileMult * lessonBonus * rankMult * focusMult * visMult
}

function routeTrackWeights(pathname: string): { issuer: number; verifier: number; wallet: number } {
  if (pathname.startsWith('/kensa')) return { issuer: 0.45, verifier: 1.55, wallet: 0.85 }
  if (pathname.startsWith('/json-explorer')) return { issuer: 0.9, verifier: 1.1, wallet: 1.2 }
  if (pathname.startsWith('/discover-kasa')) return { issuer: 1.35, verifier: 0.8, wallet: 0.95 }
  if (pathname.startsWith('/lexicon')) return { issuer: 1.05, verifier: 1.05, wallet: 1.05 }
  if (pathname.startsWith('/create-ninja-profile')) return { issuer: 0.95, verifier: 0.7, wallet: 1.35 }
  return { issuer: 1.15, verifier: 0.95, wallet: 1.15 }
}

function applyLessonFlags(
  lessons: Record<string, boolean>,
  env: TickEnv,
): Record<string, boolean> {
  const next = { ...lessons }
  for (const L of NOVICE_LESSONS) {
    if (L.exactPath !== undefined && env.pathname === L.exactPath) {
      next[L.id] = true
    }
    if (L.pathPrefix && env.pathname.startsWith(L.pathPrefix)) {
      next[L.id] = true
    }
    if (L.flag === 'ninja_profile' && env.hasNinjaProfile) {
      next[L.id] = true
    }
    if (L.flag === 'focus_peak' && env.onHome && env.homeFocus01 >= 0.999) {
      next[L.id] = true
    }
  }
  return next
}

/**
 * Advance idle state by wall time. Insight rate scales with rank tier, route, profile,
 * home focus meter (only on `/`), and tab visibility.
 */
export function applyIdleTick(prev: NoviceIdlePersisted, nowMs: number, env: TickEnv): NoviceIdlePersisted {
  const delta = Math.min(MAX_DELTA_MS, Math.max(0, nowMs - prev.lastTickMs))
  if (delta < 50) {
    return { ...prev, lastTickMs: nowMs }
  }

  const lessonsDone = applyLessonFlags(prev.lessonsDone, env)
  const everFocusPeak = prev.everFocusPeak || lessonsDone.focus_peak === true

  const routeMult = routeInsightBonus(env.pathname)
  const profileMult = env.hasNinjaProfile ? 1.14 : 1
  const lessonBonus =
    1 +
    Math.min(
      0.45,
      Object.values(lessonsDone).filter(Boolean).length * 0.04,
    )
  const tierApprox = Math.floor(prev.totalInsight / 500)
  const rankMult = 1 + Math.min(0.85, tierApprox * 0.06)
  const focusMult = env.onHome ? 1 + env.homeFocus01 * 0.65 : 1
  const visMult = env.documentVisible ? 1 : 0.32

  const basePerSec = 0.11
  const gain =
    (delta / 1000) * basePerSec * routeMult * profileMult * lessonBonus * rankMult * focusMult * visMult

  const levelIssuer = Math.floor(prev.issuerXp / 140)
  const levelVerifier = Math.floor(prev.verifierXp / 140)
  const levelWallet = Math.floor(prev.walletXp / 140)

  const trackGainBase = gain * 0.95
  const weights = routeTrackWeights(env.pathname)
  const issuerGain = trackGainBase * weights.issuer
  const verifierGain = trackGainBase * weights.verifier
  const walletGain = trackGainBase * weights.wallet

  const issuerXp = prev.issuerXp + issuerGain
  const verifierXp = prev.verifierXp + verifierGain
  const walletXp = prev.walletXp + walletGain

  const perk = computePerkState({
    issuerXp: prev.issuerXp,
    verifierXp: prev.verifierXp,
    verifiedCount: prev.verifiedCount,
  })
  const verifierPerkMult = perk.validityWatch ? 1.1 : 1
  const issuerPerkMult = perk.revocationGuard ? 1.08 : 1
  const walletPerkMult = perk.validityWatch ? 1.06 : 1
  const insightPerkMult =
    (perk.validityWatch ? 1.04 : 1) * (perk.revocationGuard ? 1.05 : 1)

  // Action output scales with rising mastery and unlocked perks.
  const issuedCount =
    prev.issuedCount +
    issuerGain *
      issuerPerkMult *
      (1.7 + levelIssuer * 0.22) *
      (env.hasNinjaProfile ? 1.08 : 1)
  const verifiedCount =
    prev.verifiedCount +
    verifierGain * verifierPerkMult * (1.45 + levelVerifier * 0.2)
  const receivedCount =
    prev.receivedCount +
    walletGain * walletPerkMult * (1.35 + levelWallet * 0.18)
  const presentedCount =
    prev.presentedCount +
    walletGain *
      walletPerkMult *
      (0.95 + levelWallet * 0.15) *
      (env.onHome ? 1 + env.homeFocus01 * 0.2 : 1)

  return {
    ...prev,
    lastTickMs: nowMs,
    totalInsight: prev.totalInsight + gain * insightPerkMult,
    lessonsDone,
    everFocusPeak,
    issuerXp,
    verifierXp,
    walletXp,
    issuedCount,
    verifiedCount,
    receivedCount,
    presentedCount,
  }
}
