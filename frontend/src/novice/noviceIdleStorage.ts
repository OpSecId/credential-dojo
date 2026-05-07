import {
  NOVICE_IDLE_STORAGE_KEY,
  NOVICE_IDLE_VERSION,
  type NoviceIdlePersisted,
} from './noviceIdleTypes'

export function defaultNoviceIdle(nowMs: number): NoviceIdlePersisted {
  return {
    v: NOVICE_IDLE_VERSION,
    totalInsight: 0,
    lastTickMs: nowMs,
    lessonsDone: {},
    everFocusPeak: false,
    issuerXp: 0,
    verifierXp: 0,
    walletXp: 0,
    issuedCount: 0,
    verifiedCount: 0,
    receivedCount: 0,
    presentedCount: 0,
  }
}

export function loadNoviceIdle(): NoviceIdlePersisted {
  const now = Date.now()
  try {
    const raw = localStorage.getItem(NOVICE_IDLE_STORAGE_KEY)
    if (!raw) return defaultNoviceIdle(now)
    const data = JSON.parse(raw) as unknown
    if (!data || typeof data !== 'object') return defaultNoviceIdle(now)
    const o = data as Record<string, unknown>
    const v = typeof o.v === 'number' ? o.v : 0
    if (v !== 1 && v !== NOVICE_IDLE_VERSION) return defaultNoviceIdle(now)
    const totalInsight = typeof o.totalInsight === 'number' && o.totalInsight >= 0 ? o.totalInsight : 0
    const lastTickMs = typeof o.lastTickMs === 'number' ? o.lastTickMs : now
    const lessonsDone =
      o.lessonsDone && typeof o.lessonsDone === 'object' && !Array.isArray(o.lessonsDone)
        ? (o.lessonsDone as Record<string, boolean>)
        : {}
    const everFocusPeak = o.everFocusPeak === true
    const issuerXp = typeof o.issuerXp === 'number' && o.issuerXp >= 0 ? o.issuerXp : 0
    const verifierXp = typeof o.verifierXp === 'number' && o.verifierXp >= 0 ? o.verifierXp : 0
    const walletXp = typeof o.walletXp === 'number' && o.walletXp >= 0 ? o.walletXp : 0
    const issuedCount = typeof o.issuedCount === 'number' && o.issuedCount >= 0 ? o.issuedCount : 0
    const verifiedCount = typeof o.verifiedCount === 'number' && o.verifiedCount >= 0 ? o.verifiedCount : 0
    const receivedCount = typeof o.receivedCount === 'number' && o.receivedCount >= 0 ? o.receivedCount : 0
    const presentedCount =
      typeof o.presentedCount === 'number' && o.presentedCount >= 0 ? o.presentedCount : 0
    return {
      v: NOVICE_IDLE_VERSION,
      totalInsight,
      lastTickMs,
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
  } catch {
    return defaultNoviceIdle(now)
  }
}

export function saveNoviceIdle(state: NoviceIdlePersisted): void {
  try {
    localStorage.setItem(NOVICE_IDLE_STORAGE_KEY, JSON.stringify(state))
  } catch {
    /* ignore */
  }
}
