import { createContext, useContext, useMemo, useState, type Dispatch, type ReactNode, type SetStateAction } from 'react'

type HomeTrainingFocusShellValue = {
  meter: number
  setMeter: Dispatch<SetStateAction<number>>
}

const HomeTrainingFocusShellContext = createContext<HomeTrainingFocusShellValue | null>(null)

/** Holds live training-focus (0–100) from HomePage for the AppShell top nav. */
export function HomeTrainingFocusShellProvider({ children }: { children: ReactNode }) {
  const [meter, setMeter] = useState(38)
  const value = useMemo(() => ({ meter, setMeter }), [meter])
  return <HomeTrainingFocusShellContext.Provider value={value}>{children}</HomeTrainingFocusShellContext.Provider>
}

export function useHomeTrainingFocusShell(): HomeTrainingFocusShellValue {
  const c = useContext(HomeTrainingFocusShellContext)
  if (!c) {
    throw new Error('useHomeTrainingFocusShell must be used within HomeTrainingFocusShellProvider')
  }
  return c
}
