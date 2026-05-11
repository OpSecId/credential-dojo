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
import { useDebouncedClientPersist } from '../lib/useDebouncedClientPersist'
import { readNinjaProfile } from '../ninjaProfileStorage'
import { applyIdleTick, previewInsightPerSec } from './noviceIdleEngine'
import { loadNoviceIdle, saveNoviceIdle } from './noviceIdleStorage'
import {
  computeRankProgress,
  type NoviceIdlePersisted,
  type TickEnv,
} from './noviceIdleTypes'

type FocusRef = {
  homeFocus01: number
  onHome: boolean
}

type NoviceIdleContextValue = {
  state: NoviceIdlePersisted
  rank: ReturnType<typeof computeRankProgress>
  /** Insight / second (approx) at current route and bonuses */
  insightPerSec: number
  panelOpen: boolean
  setPanelOpen: (open: boolean) => void
  togglePanel: () => void
  /** Call from HomePage when training focus (0–100) changes */
  reportFocusMeter: (focus0to100: number) => void
  /** HomePage unmount: stop treating synergy as active */
  clearHomeFocus: () => void
}

const NoviceIdleContext = createContext<NoviceIdleContextValue | null>(null)

function buildEnv(pathname: string, focusRef: React.MutableRefObject<FocusRef>): TickEnv {
  return {
    pathname,
    hasNinjaProfile: readNinjaProfile() !== null,
    homeFocus01: focusRef.current.homeFocus01,
    onHome: focusRef.current.onHome,
    documentVisible: typeof document !== 'undefined' && document.visibilityState === 'visible',
  }
}

export function NoviceIdleProvider({ children }: { children: ReactNode }) {
  const location = useLocation()
  const pathname = location.pathname
  const [state, setState] = useState<NoviceIdlePersisted>(() => loadNoviceIdle())
  const [panelOpen, setPanelOpen] = useState(false)
  const focusRef = useRef<FocusRef>({ homeFocus01: 0, onHome: false })

  const flushTick = useCallback(
    (now: number) => {
      setState((prev) => {
        const env = buildEnv(pathname, focusRef)
        return applyIdleTick(prev, now, env)
      })
    },
    [pathname],
  )

  useEffect(() => {
    flushTick(Date.now())
  }, [pathname, flushTick])

  useEffect(() => {
    const id = window.setInterval(() => flushTick(Date.now()), 1000)
    return () => clearInterval(id)
  }, [flushTick])

  useEffect(() => {
    const onVis = () => flushTick(Date.now())
    document.addEventListener('visibilitychange', onVis)
    return () => document.removeEventListener('visibilitychange', onVis)
  }, [flushTick])

  useDebouncedClientPersist(state, saveNoviceIdle, 5000)

  const rank = useMemo(() => computeRankProgress(state.totalInsight), [state.totalInsight])

  /** Rate text refreshes on idle ticks (~1s); `focusRef` is read here so accrual stays correct between ticks. */
  const insightPerSec = useMemo(() => {
    const env = buildEnv(pathname, focusRef)
    return previewInsightPerSec(env, state.lessonsDone, state.totalInsight, env.hasNinjaProfile)
  }, [pathname, state.lessonsDone, state.totalInsight, state.lastTickMs])

  const reportFocusMeter = useCallback((focus0to100: number) => {
    focusRef.current = {
      homeFocus01: Math.max(0, Math.min(1, focus0to100 / 100)),
      onHome: true,
    }
  }, [])

  const clearHomeFocus = useCallback(() => {
    focusRef.current = { homeFocus01: focusRef.current.homeFocus01, onHome: false }
  }, [])

  const togglePanel = useCallback(() => setPanelOpen((o) => !o), [])

  const value = useMemo<NoviceIdleContextValue>(
    () => ({
      state,
      rank,
      insightPerSec,
      panelOpen,
      setPanelOpen,
      togglePanel,
      reportFocusMeter,
      clearHomeFocus,
    }),
    [state, rank, insightPerSec, panelOpen, reportFocusMeter, clearHomeFocus],
  )

  return <NoviceIdleContext.Provider value={value}>{children}</NoviceIdleContext.Provider>
}

export function useNoviceIdle(): NoviceIdleContextValue {
  const ctx = useContext(NoviceIdleContext)
  if (!ctx) {
    throw new Error('useNoviceIdle must be used within NoviceIdleProvider')
  }
  return ctx
}

/** Safe hook when provider might be absent (avoid if we always wrap App). */
export function useNoviceIdleOptional(): NoviceIdleContextValue | null {
  return useContext(NoviceIdleContext)
}
