import { useCallback, useEffect, useId, useMemo, useRef, useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import './App.css'
import './NinjaProfileMenu.css'
import { useDojoLandingTheme } from './DojoLandingThemeContext'
import { DEMO_PERSONAS_OFFLINE } from './demoPersonas'
import {
  NINJA_PROFILE_CHANGED_EVENT,
  clearNinjaProfile,
  listNinjaProfileRecords,
  readActiveNinjaProfileId,
  setActiveNinjaProfile,
  signOutNinjaSession,
  type NinjaProfileRecord,
} from './ninjaProfileStorage'
import { useNinjaProfileSnapshot } from './useNinjaProfileSnapshot'

function monogram(codename: string): string {
  const t = codename.trim()
  if (!t) return '忍'
  const ch = t[0]
  return ch === ch.toLowerCase() ? ch.toUpperCase() : ch
}

export default function NinjaProfileMenu() {
  const { theme, toggleTheme } = useDojoLandingTheme()
  const location = useLocation()
  const activeProfile = useNinjaProfileSnapshot()
  const [open, setOpen] = useState(false)
  const [vaultTick, setVaultTick] = useState(0)
  const rootRef = useRef<HTMLDivElement>(null)
  const menuId = useId()

  const bumpVault = useCallback(() => setVaultTick((n) => n + 1), [])

  useEffect(() => {
    const onDoc = (e: MouseEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false)
    }
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false)
    }
    if (open) {
      document.addEventListener('mousedown', onDoc)
      document.addEventListener('keydown', onKey)
    }
    return () => {
      document.removeEventListener('mousedown', onDoc)
      document.removeEventListener('keydown', onKey)
    }
  }, [open])

  useEffect(() => {
    bumpVault()
    window.addEventListener(NINJA_PROFILE_CHANGED_EVENT, bumpVault)
    window.addEventListener('storage', bumpVault)
    return () => {
      window.removeEventListener(NINJA_PROFILE_CHANGED_EVENT, bumpVault)
      window.removeEventListener('storage', bumpVault)
    }
  }, [bumpVault, location.pathname, location.search])

  useEffect(() => {
    setOpen(false)
  }, [location.pathname, location.search])

  const profiles = useMemo(() => [...listNinjaProfileRecords()], [vaultTick])
  const activeId = useMemo(() => readActiveNinjaProfileId(), [vaultTick, activeProfile])

  const schoolLabel = useCallback((schoolId: string) => {
    return DEMO_PERSONAS_OFFLINE.find((p) => p.id === schoolId)?.label ?? schoolId
  }, [])

  const onPickProfile = (id: string) => {
    setActiveNinjaProfile(id)
    setOpen(false)
  }

  const onSignOut = () => {
    signOutNinjaSession()
    setOpen(false)
  }

  const onRemoveProfile = () => {
    const ok = window.confirm(
      'Remove this ninja profile from this browser? Other saved profiles stay until you remove them.',
    )
    if (!ok) return
    clearNinjaProfile()
    setOpen(false)
  }

  const isHome = location.pathname === '/'
  const shellClass = `ninjaProfileMenuShell${isHome ? ' ninjaProfileMenuShell--home' : ''}`

  return (
    <div
      className={shellClass}
      ref={rootRef}
      data-dojo-theme={isHome ? theme : undefined}
    >
      {isHome ? (
        <button
          type="button"
          className="dojo-lantern dojo-lantern--toolbar"
          onClick={toggleTheme}
          aria-pressed={theme === 'night'}
          aria-label={
            theme === 'night'
              ? 'Switch to day dojo (paper theme)'
              : 'Switch to night dojo (lantern theme)'
          }
        >
          <span className="dojo-lantern__glow" aria-hidden />
          <span className="dojo-lantern__body" aria-hidden />
          <span className="dojo-lantern__label">{theme === 'night' ? '夜' : '昼'}</span>
        </button>
      ) : null}
      <div className="ninjaProfileMenu">
      <button
        type="button"
        className="ninjaProfileMenu__toggle"
        aria-expanded={open}
        aria-haspopup="menu"
        aria-controls={menuId}
        onClick={() => setOpen((o) => !o)}
        title={activeProfile ? activeProfile.codename : 'Ninja profile'}
      >
        <span className="ninjaProfileMenu__glyph" aria-hidden>
          {activeProfile ? monogram(activeProfile.codename) : '◇'}
        </span>
        {activeProfile ? (
          <span className="ninjaProfileMenu__name">{activeProfile.codename}</span>
        ) : (
          <span className="ninjaProfileMenu__name ninjaProfileMenu__name--muted">Sign in</span>
        )}
        <span className="ninjaProfileMenu__chev" aria-hidden>
          {open ? '▴' : '▾'}
        </span>
      </button>

      {open ? (
        <div id={menuId} className="ninjaProfileMenu__panel" role="menu">
          {profiles.length > 0 ? (
            <div className="ninjaProfileMenu__section" role="none">
              <p className="ninjaProfileMenu__sectionLabel">Profiles</p>
              <ul className="ninjaProfileMenu__list">
                {profiles.map((p: NinjaProfileRecord) => {
                  const isActive = p.id === activeId && activeProfile !== null
                  return (
                    <li key={p.id} role="none">
                      <button
                        type="button"
                        role="menuitem"
                        className={`ninjaProfileMenu__row${isActive ? ' ninjaProfileMenu__row--active' : ''}`}
                        onClick={() => onPickProfile(p.id)}
                      >
                        <span className="ninjaProfileMenu__rowName">{p.codename}</span>
                        <span className="ninjaProfileMenu__rowMeta">{schoolLabel(p.schoolId)}</span>
                        {isActive ? <span className="ninjaProfileMenu__check">✓</span> : null}
                      </button>
                    </li>
                  )
                })}
              </ul>
            </div>
          ) : null}

          <div className="ninjaProfileMenu__section" role="none">
            {profiles.length > 0 ? (
              <Link
                role="menuitem"
                className="ninjaProfileMenu__link"
                to="/create-ninja-profile?new=1"
                onClick={() => setOpen(false)}
              >
                New profile
              </Link>
            ) : (
              <Link
                role="menuitem"
                className="ninjaProfileMenu__link ninjaProfileMenu__link--primary"
                to="/create-ninja-profile"
                onClick={() => setOpen(false)}
              >
                Create profile
              </Link>
            )}
            {activeProfile ? (
              <Link
                role="menuitem"
                className="ninjaProfileMenu__link"
                to="/create-ninja-profile"
                onClick={() => setOpen(false)}
              >
                Edit current profile
              </Link>
            ) : null}
          </div>

          <div className="ninjaProfileMenu__section ninjaProfileMenu__section--actions" role="none">
            {activeProfile ? (
              <>
                <button type="button" role="menuitem" className="ninjaProfileMenu__btn" onClick={onSignOut}>
                  Sign out
                </button>
                <button
                  type="button"
                  role="menuitem"
                  className="ninjaProfileMenu__btn ninjaProfileMenu__btn--danger"
                  onClick={onRemoveProfile}
                >
                  Remove this profile…
                </button>
              </>
            ) : profiles.length > 0 ? (
              <p className="ninjaProfileMenu__hint">Choose a profile above or create a new one.</p>
            ) : null}
          </div>
        </div>
      ) : null}
      </div>
    </div>
  )
}
