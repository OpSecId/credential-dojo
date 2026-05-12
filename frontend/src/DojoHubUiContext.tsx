import { createContext, useCallback, useContext, useMemo, useState, type Dispatch, type ReactNode, type SetStateAction } from 'react'

type DojoHubUiValue = {
  open: boolean
  setOpen: Dispatch<SetStateAction<boolean>>
  toggle: () => void
}

const DojoHubUiContext = createContext<DojoHubUiValue | null>(null)

export function DojoHubUiProvider({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false)
  const toggle = useCallback(() => setOpen((o) => !o), [])
  const value = useMemo(() => ({ open, setOpen, toggle }), [open, toggle])
  return <DojoHubUiContext.Provider value={value}>{children}</DojoHubUiContext.Provider>
}

export function useDojoHubUi(): DojoHubUiValue {
  const c = useContext(DojoHubUiContext)
  if (!c) {
    throw new Error('useDojoHubUi must be used within DojoHubUiProvider')
  }
  return c
}
