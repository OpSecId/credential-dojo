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
    if (o.v !== NOVICE_IDLE_VERSION) return defaultNoviceIdle(now)
    const totalInsight = typeof o.totalInsight === 'number' && o.totalInsight >= 0 ? o.totalInsight : 0
    const lastTickMs = typeof o.lastTickMs === 'number' ? o.lastTickMs : now
    const lessonsDone =
      o.lessonsDone && typeof o.lessonsDone === 'object' && !Array.isArray(o.lessonsDone)
        ? (o.lessonsDone as Record<string, boolean>)
        : {}
    const everFocusPeak = o.everFocusPeak === true
    return {
      v: NOVICE_IDLE_VERSION,
      totalInsight,
      lastTickMs,
      lessonsDone,
      everFocusPeak,
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
