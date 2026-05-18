import { useCallback, useEffect, useId, useLayoutEffect, useMemo, useRef, useState } from 'react'
import { createPortal } from 'react-dom'

function pad2(n: number): string {
  return String(n).padStart(2, '0')
}

export function toIsoLocalDate(d: Date): string {
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`
}

function parseIsoLocal(iso: string): Date | null {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso.trim())
  if (!m) return null
  const y = Number(m[1])
  const mo = Number(m[2]) - 1
  const day = Number(m[3])
  const d = new Date(y, mo, day)
  if (d.getFullYear() !== y || d.getMonth() !== mo || d.getDate() !== day) return null
  return d
}

const WEEKDAY_SHORT = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'] as const

function CalendarInputIcon() {
  return (
    <span className="issuanceCfg__dateInput-icon" aria-hidden>
      <svg width={16} height={16} viewBox="0 0 24 24" fill="none">
        <rect x="3" y="5" width="18" height="16" rx="2.5" stroke="currentColor" strokeWidth="2" />
        <path d="M3 9.5h18M8 5V3M16 5V3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      </svg>
    </span>
  )
}

export type IssuanceDatePickerProps = {
  id: string
  fieldLabelId: string
  value: string
  onCommit: (isoDate: string) => void
}

export function IssuanceDatePicker({ id, fieldLabelId, value, onCommit }: IssuanceDatePickerProps) {
  const dialogLabelId = useId()
  const anchorRef = useRef<HTMLDivElement>(null)
  const popoverRef = useRef<HTMLDivElement>(null)
  const [open, setOpen] = useState(false)
  const [pos, setPos] = useState({ top: 0, left: 0, width: 0 })
  const selected = useMemo(() => (value ? parseIsoLocal(value) : null), [value])
  const [viewY, setViewY] = useState(() => selected?.getFullYear() ?? new Date().getFullYear())
  const [viewM, setViewM] = useState(() => selected?.getMonth() ?? new Date().getMonth())

  useLayoutEffect(() => {
    if (!open || !anchorRef.current) return
    const measure = () => {
      if (!anchorRef.current) return
      const r = anchorRef.current.getBoundingClientRect()
      const w = Math.max(r.width, 248)
      let left = r.left
      if (left + w > window.innerWidth - 8) left = Math.max(8, window.innerWidth - w - 8)
      setPos({ top: r.bottom + 6, left, width: w })
    }
    measure()
    window.addEventListener('resize', measure)
    return () => window.removeEventListener('resize', measure)
  }, [open])

  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false)
    }
    const onPointer = (e: MouseEvent | PointerEvent) => {
      const t = e.target as Node
      if (anchorRef.current?.contains(t) || popoverRef.current?.contains(t)) return
      setOpen(false)
    }
    const onScroll = () => setOpen(false)
    window.addEventListener('keydown', onKey)
    window.addEventListener('pointerdown', onPointer, true)
    window.addEventListener('scroll', onScroll, true)
    return () => {
      window.removeEventListener('keydown', onKey)
      window.removeEventListener('pointerdown', onPointer, true)
      window.removeEventListener('scroll', onScroll, true)
    }
  }, [open])

  useEffect(() => {
    if (!open) return
    if (selected) {
      setViewY(selected.getFullYear())
      setViewM(selected.getMonth())
    }
  }, [open, selected])

  const monthLabel = useMemo(
    () => new Date(viewY, viewM, 1).toLocaleString(undefined, { month: 'long', year: 'numeric' }),
    [viewY, viewM],
  )

  const cells = useMemo(() => {
    const firstDow = new Date(viewY, viewM, 1).getDay()
    const dim = new Date(viewY, viewM + 1, 0).getDate()
    const out: ({ kind: 'pad' } | { kind: 'day'; day: number })[] = []
    for (let i = 0; i < firstDow; i++) out.push({ kind: 'pad' })
    for (let d = 1; d <= dim; d++) out.push({ kind: 'day', day: d })
    while (out.length % 7 !== 0) out.push({ kind: 'pad' })
    while (out.length < 42) out.push({ kind: 'pad' })
    return out
  }, [viewY, viewM])

  const pickDay = useCallback(
    (day: number) => {
      const iso = toIsoLocalDate(new Date(viewY, viewM, day))
      onCommit(iso)
      setOpen(false)
    },
    [onCommit, viewM, viewY],
  )

  const display = value
    ? (parseIsoLocal(value)?.toLocaleDateString(undefined, { dateStyle: 'medium' }) ?? value)
    : 'Select date…'

  return (
    <>
      <div
        ref={anchorRef}
        className="issuanceCfg__dateShell issuanceCfg__dateShell--picker"
        data-calendar-open={open ? '' : undefined}
      >
        <button
          type="button"
          id={id}
          className="issuanceCfg__dateInput issuanceCfg__dateInput--pickerBtn"
          aria-expanded={open}
          aria-haspopup="dialog"
          aria-controls={open ? `${id}-calendar` : undefined}
          aria-labelledby={fieldLabelId}
          onClick={() => setOpen((o) => !o)}
        >
          <span className="issuanceCfg__dateInput-display">{display}</span>
          <CalendarInputIcon />
        </button>
      </div>
      {open
        ? createPortal(
            <div
              ref={popoverRef}
              id={`${id}-calendar`}
              className="issuanceCfg__datePopover"
              role="dialog"
              aria-modal="true"
              aria-labelledby={dialogLabelId}
              style={{ top: pos.top, left: pos.left, width: pos.width }}
            >
              <div className="issuanceCfg__datePopover-head">
                <button
                  type="button"
                  className="issuanceCfg__datePopover-nav"
                  aria-label="Previous month"
                  onClick={() => {
                    if (viewM === 0) {
                      setViewM(11)
                      setViewY((y) => y - 1)
                    } else setViewM((m) => m - 1)
                  }}
                >
                  ‹
                </button>
                <p id={dialogLabelId} className="issuanceCfg__datePopover-title">
                  {monthLabel}
                </p>
                <button
                  type="button"
                  className="issuanceCfg__datePopover-nav"
                  aria-label="Next month"
                  onClick={() => {
                    if (viewM === 11) {
                      setViewM(0)
                      setViewY((y) => y + 1)
                    } else setViewM((m) => m + 1)
                  }}
                >
                  ›
                </button>
              </div>
              <div className="issuanceCfg__datePopover-weekdays" aria-hidden>
                {WEEKDAY_SHORT.map((d) => (
                  <span key={d} className="issuanceCfg__datePopover-wd">
                    {d}
                  </span>
                ))}
              </div>
              <div className="issuanceCfg__datePopover-grid" role="listbox" aria-label="Choose day">
                {cells.map((c, i) =>
                  c.kind === 'pad' ? (
                    <span key={`p-${i}`} className="issuanceCfg__datePopover-cell issuanceCfg__datePopover-cell--pad" />
                  ) : (
                    <button
                      key={`d-${viewY}-${viewM}-${c.day}`}
                      type="button"
                      role="option"
                      aria-selected={Boolean(
                        selected &&
                          selected.getFullYear() === viewY &&
                          selected.getMonth() === viewM &&
                          selected.getDate() === c.day,
                      )}
                      className="issuanceCfg__datePopover-cell issuanceCfg__datePopover-cell--day"
                      onClick={() => pickDay(c.day)}
                    >
                      {c.day}
                    </button>
                  ),
                )}
              </div>
            </div>,
            document.body,
          )
        : null}
    </>
  )
}
