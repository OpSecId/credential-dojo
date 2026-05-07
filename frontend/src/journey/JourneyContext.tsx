import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react'
import { useLocation } from 'react-router-dom'
import { readNinjaProfile } from '../ninjaProfileStorage'
import {
  clearJourneyPendingStart,
  loadJourney,
  readJourneyPendingStart,
  saveJourney,
} from './journeyStorage'
import { computeJourneyLevel, routeLearningWeight, type JourneyState } from './journeyTypes'

const MAX_DELTA_MS = 6 * 60 * 60 * 1000

type JourneyCtx = {
  state: JourneyState
  level: ReturnType<typeof computeJourneyLevel>
  panelOpen: boolean
  setPanelOpen: (open: boolean) => void
  togglePanel: () => void
  startJourney: () => void
  pendingStart: boolean
  clearPendingStart: () => void
  reportLearningFocus: (focus0to100: number) => void
}

const JourneyContext = createContext<JourneyCtx | null>(null)

export function JourneyProvider({ children }: { children: ReactNode }) {
  const loc = useLocation()
  const [state, setState] = useState<JourneyState>(() => loadJourney())
  const [panelOpen, setPanelOpen] = useState(false)
  const [pendingStart, setPendingStart] = useState(() => readJourneyPendingStart())
  const focusRef = useRef(0)

  const tick = useCallback(
    (now: number) => {
      setState((prev) => {
        const hasProfile = readNinjaProfile() !== null
        if (!prev.started || !hasProfile) {
          const next = { ...prev, lastTickMs: now }
          saveJourney(next)
          return next
        }
        const delta = Math.max(0, Math.min(MAX_DELTA_MS, now - prev.lastTickMs))
        if (delta < 50) return { ...prev, lastTickMs: now }

        const base = 0.08
        const route = routeLearningWeight(loc.pathname)
        const visMult = document.visibilityState === 'visible' ? 1 : 0.35
        const focusMult = loc.pathname === '/' ? 1 + focusRef.current * 0.45 : 1
        const bonus = 1 + Math.min(0.6, prev.learningXp / 8000)
        const gainBase = (delta / 1000) * base * visMult * focusMult * bonus
        const gainIssuer = gainBase * route.issuer
        const gainVerifier = gainBase * route.verifier
        const gainWallet = gainBase * route.wallet
        const next: JourneyState = {
          ...prev,
          lastTickMs: now,
          learningXp: prev.learningXp + gainBase * 1.2,
          issuerTokens: prev.issuerTokens + gainIssuer,
          verifierTokens: prev.verifierTokens + gainVerifier,
          walletTokens: prev.walletTokens + gainWallet,
        }
        saveJourney(next)
        return next
      })
    },
    [loc.pathname],
  )

  useEffect(() => {
    tick(Date.now())
  }, [loc.pathname, tick])

  useEffect(() => {
    const id = window.setInterval(() => tick(Date.now()), 1000)
    return () => clearInterval(id)
  }, [tick])

  useEffect(() => {
    const onVis = () => tick(Date.now())
    document.addEventListener('visibilitychange', onVis)
    return () => document.removeEventListener('visibilitychange', onVis)
  }, [tick])

  const startJourney = useCallback(() => {
    const now = Date.now()
    setState((prev) => {
      const next = { ...prev, started: true, lastTickMs: now }
      saveJourney(next)
      return next
    })
    clearJourneyPendingStart()
    setPendingStart(false)
    setPanelOpen(true)
  }, [])

  const clearPendingStart = useCallback(() => {
    clearJourneyPendingStart()
    setPendingStart(false)
  }, [])

  const reportLearningFocus = useCallback((focus0to100: number) => {
    focusRef.current = Math.max(0, Math.min(1, focus0to100 / 100))
  }, [])

  const togglePanel = useCallback(() => setPanelOpen((v) => !v), [])

  const level = useMemo(() => computeJourneyLevel(state.learningXp), [state.learningXp])

  const value = useMemo<JourneyCtx>(
    () => ({
      state,
      level,
      panelOpen,
      setPanelOpen,
      togglePanel,
      startJourney,
      pendingStart,
      clearPendingStart,
      reportLearningFocus,
    }),
    [state, level, panelOpen, togglePanel, startJourney, pendingStart, clearPendingStart, reportLearningFocus],
  )

  return <JourneyContext.Provider value={value}>{children}</JourneyContext.Provider>
}

export function useJourney(): JourneyCtx {
  const ctx = useContext(JourneyContext)
  if (!ctx) throw new Error('useJourney must be used within JourneyProvider')
  return ctx
}
