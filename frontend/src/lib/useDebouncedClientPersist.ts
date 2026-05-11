import { useEffect, useRef } from 'react'

const DEFAULT_DEBOUNCE_MS = 5000

/**
 * Writes `state` through `persist` after `debounceMs` of stability, instead of on every update.
 * Flushes when the tab becomes hidden, on `pagehide`, and when the hook unmounts so idle
 * progress is not lost on close or full navigation away.
 */
export function useDebouncedClientPersist<T>(
  state: T,
  persist: (value: T) => void,
  debounceMs: number = DEFAULT_DEBOUNCE_MS,
): void {
  const stateRef = useRef(state)
  const persistRef = useRef(persist)
  stateRef.current = state
  persistRef.current = persist

  const flush = useRef(() => {
    persistRef.current(stateRef.current)
  })
  flush.current = () => persistRef.current(stateRef.current)

  useEffect(() => {
    const t = window.setTimeout(() => flush.current(), debounceMs)
    return () => {
      window.clearTimeout(t)
    }
  }, [state, debounceMs])

  useEffect(() => {
    const onVis = () => {
      if (document.visibilityState === 'hidden') flush.current()
    }
    const onPageHide = () => flush.current()
    document.addEventListener('visibilitychange', onVis)
    window.addEventListener('pagehide', onPageHide)
    return () => {
      document.removeEventListener('visibilitychange', onVis)
      window.removeEventListener('pagehide', onPageHide)
      flush.current()
    }
  }, [])
}
