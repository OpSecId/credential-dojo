import { useEffect, useState, type ReactNode } from 'react'
import './App.css'
import './dojoFlowPage.css'
import { useDojoLandingTheme } from './DojoLandingThemeContext'

function usePrefersReducedMotion(): boolean {
  const [v, setV] = useState(false)
  useEffect(() => {
    if (typeof window === 'undefined') return
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)')
    const fn = () => setV(mq.matches)
    fn()
    mq.addEventListener('change', fn)
    return () => mq.removeEventListener('change', fn)
  }, [])
  return v
}

/** Same scene stack + calm landing atmosphere as the home page (moon, embers, bg, grid). */
export function DojoFlowPageShell({
  children,
  sceneExtraClass,
}: {
  children: ReactNode
  /** Appended to the scene root (e.g. `lex-print`). */
  sceneExtraClass?: string
}) {
  const { theme } = useDojoLandingTheme()
  const reduceMotion = usePrefersReducedMotion()
  return (
    <div
      className={`dojo-scene dojo-scene--landing dojo-scene--calm dojo-scene--${theme}${sceneExtraClass ? ` ${sceneExtraClass}` : ''}`}
      data-reduce-motion={reduceMotion ? 'true' : undefined}
    >
      <div className="dojo-scene__moon" aria-hidden />
      <div className="dojo-scene__embers" aria-hidden />
      <div className="dojo-scene__bg" aria-hidden />
      <div className="dojo-scene__grid" aria-hidden />
      <div className="dojo dojo--calmLanding dojo-flowPage">
        <div className="dojo-flowPage__stage">{children}</div>
      </div>
    </div>
  )
}

/** Centered masthead: eyebrow (default credential.ninja) + title + optional intro children. */
export function DojoFlowPageHero({
  title,
  eyebrow = 'credential.ninja',
  children,
}: {
  title: ReactNode
  eyebrow?: string
  children?: ReactNode
}) {
  return (
    <header className="dojo-flowPage__hero">
      <p className="dojo-flowPage__eyebrow">{eyebrow}</p>
      <h1 className="dojo-flowPage__title">{title}</h1>
      {children}
    </header>
  )
}
