import {
  JOURNEY_PENDING_START_KEY,
  JOURNEY_STORAGE_KEY,
  JOURNEY_VERSION,
  type JourneyState,
} from './journeyTypes'

export function defaultJourney(now = Date.now()): JourneyState {
  return {
    v: JOURNEY_VERSION,
    started: false,
    lastTickMs: now,
    learningXp: 0,
    issuerTokens: 0,
    verifierTokens: 0,
    walletTokens: 0,
  }
}

export function loadJourney(): JourneyState {
  try {
    const raw = localStorage.getItem(JOURNEY_STORAGE_KEY)
    if (!raw) return defaultJourney()
    const o = JSON.parse(raw) as Partial<JourneyState> | null
    if (!o || o.v !== JOURNEY_VERSION) return defaultJourney()
    return {
      v: JOURNEY_VERSION,
      started: o.started === true,
      lastTickMs: typeof o.lastTickMs === 'number' ? o.lastTickMs : Date.now(),
      learningXp: typeof o.learningXp === 'number' ? Math.max(0, o.learningXp) : 0,
      issuerTokens: typeof o.issuerTokens === 'number' ? Math.max(0, o.issuerTokens) : 0,
      verifierTokens: typeof o.verifierTokens === 'number' ? Math.max(0, o.verifierTokens) : 0,
      walletTokens: typeof o.walletTokens === 'number' ? Math.max(0, o.walletTokens) : 0,
    }
  } catch {
    return defaultJourney()
  }
}

export function saveJourney(s: JourneyState): void {
  try {
    localStorage.setItem(JOURNEY_STORAGE_KEY, JSON.stringify(s))
  } catch {
    /* ignore */
  }
}

export function markJourneyPendingStart(): void {
  try {
    localStorage.setItem(JOURNEY_PENDING_START_KEY, '1')
  } catch {
    /* ignore */
  }
}

export function readJourneyPendingStart(): boolean {
  try {
    return localStorage.getItem(JOURNEY_PENDING_START_KEY) === '1'
  } catch {
    return false
  }
}

export function clearJourneyPendingStart(): void {
  try {
    localStorage.removeItem(JOURNEY_PENDING_START_KEY)
  } catch {
    /* ignore */
  }
}
