import { useDojoLandingTheme } from './DojoLandingThemeContext'

/** Day / night dojo theme toggle (home landing only). */
export default function DojoLandingThemeLantern() {
  const { theme, toggleTheme } = useDojoLandingTheme()
  return (
    <button
      type="button"
      className="dojo-lantern dojo-lantern--toolbar"
      onClick={toggleTheme}
      aria-pressed={theme === 'night'}
      aria-label={
        theme === 'night' ? 'Switch to day dojo (paper theme)' : 'Switch to night dojo (lantern theme)'
      }
    >
      <span className="dojo-lantern__glow" aria-hidden />
      <span className="dojo-lantern__body" aria-hidden />
      <span className="dojo-lantern__label">{theme === 'night' ? '夜' : '昼'}</span>
    </button>
  )
}
