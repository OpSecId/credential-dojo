import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'

export const DOJO_LANDING_THEME_KEY = 'credential-dojo-theme'

export type DojoLandingTheme = 'night' | 'day'

function readStoredTheme(): DojoLandingTheme {
  try {
    const v = localStorage.getItem(DOJO_LANDING_THEME_KEY)
    if (v === 'day' || v === 'night') return v
  } catch {
    /* ignore */
  }
  return 'night'
}

type Ctx = {
  theme: DojoLandingTheme
  setTheme: (t: DojoLandingTheme) => void
  toggleTheme: () => void
}

const DojoLandingThemeContext = createContext<Ctx | null>(null)

export function DojoLandingThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = useState<DojoLandingTheme>(readStoredTheme)

  useEffect(() => {
    try {
      localStorage.setItem(DOJO_LANDING_THEME_KEY, theme)
    } catch {
      /* ignore */
    }
  }, [theme])

  const toggleTheme = useCallback(() => {
    setTheme((t) => (t === 'night' ? 'day' : 'night'))
  }, [])

  const value = useMemo(() => ({ theme, setTheme, toggleTheme }), [theme, toggleTheme])

  return <DojoLandingThemeContext.Provider value={value}>{children}</DojoLandingThemeContext.Provider>
}

export function useDojoLandingTheme(): Ctx {
  const v = useContext(DojoLandingThemeContext)
  if (!v) {
    throw new Error('useDojoLandingTheme must be used within DojoLandingThemeProvider')
  }
  return v
}
