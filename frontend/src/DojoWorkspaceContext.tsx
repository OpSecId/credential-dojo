import { createContext, useContext, type Dispatch, type SetStateAction } from 'react'

export type DojoWorkspaceTool = 'issuance' | 'enbu'

export type DojoWorkspaceContextValue = {
  tool: DojoWorkspaceTool
  setTool: Dispatch<SetStateAction<DojoWorkspaceTool>>
}

const DojoWorkspaceContext = createContext<DojoWorkspaceContextValue | null>(null)

export function DojoWorkspaceProvider({
  tool,
  setTool,
  children,
}: DojoWorkspaceContextValue & { children: React.ReactNode }) {
  return (
    <DojoWorkspaceContext.Provider value={{ tool, setTool }}>
      {children}
    </DojoWorkspaceContext.Provider>
  )
}

export function useDojoWorkspace() {
  const value = useContext(DojoWorkspaceContext)
  if(!value) {
    throw new Error('useDojoWorkspace must be used within DojoWorkspaceProvider')
  }
  return value
}

/** `react-router` location state for deep-linking into Enbu on `/dojo`. */
export type DojoWorkspaceLocationState = {
  dojoTool?: DojoWorkspaceTool
}

export function dojoToolFromLocationState(state: unknown): DojoWorkspaceTool {
  const dojoTool = (state as DojoWorkspaceLocationState | null)?.dojoTool
  return dojoTool === 'enbu' ? 'enbu' : 'issuance'
}
