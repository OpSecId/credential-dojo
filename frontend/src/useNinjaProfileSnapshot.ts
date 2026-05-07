import { useEffect, useState } from 'react'
import { useLocation } from 'react-router-dom'
import {
  NINJA_PROFILE_CHANGED_EVENT,
  readNinjaProfile,
  type NinjaProfile,
} from './ninjaProfileStorage'

/** Live read of ninja profile for layout chrome (same-tab updates via custom event). */
export function useNinjaProfileSnapshot(): NinjaProfile | null {
  const location = useLocation()
  const [profile, setProfile] = useState<NinjaProfile | null>(() => readNinjaProfile())

  useEffect(() => {
    const sync = () => setProfile(readNinjaProfile())
    sync()
    window.addEventListener(NINJA_PROFILE_CHANGED_EVENT, sync)
    document.addEventListener('visibilitychange', sync)
    window.addEventListener('storage', sync)
    return () => {
      window.removeEventListener(NINJA_PROFILE_CHANGED_EVENT, sync)
      document.removeEventListener('visibilitychange', sync)
      window.removeEventListener('storage', sync)
    }
  }, [location.pathname, location.search, location.hash])

  return profile
}
