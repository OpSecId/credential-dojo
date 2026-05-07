import { NOVICE_LESSONS, type NoviceIdlePersisted, type TickEnv, routeInsightBonus } from './noviceIdleTypes'

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

  const totalInsight = prev.totalInsight + gain

  return {
    ...prev,
    lastTickMs: nowMs,
    totalInsight,
    lessonsDone,
    everFocusPeak,
  }
}
