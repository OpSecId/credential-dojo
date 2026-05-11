import { useCallback, useEffect, useId, useRef, useState } from 'react'
import './ZenSoundWidget.css'
import { startZenPad } from './zenAmbient'

const STORAGE_VOL = 'credential-dojo-zen-sound-vol'

function readVol(): number {
  try {
    const v = Number(localStorage.getItem(STORAGE_VOL))
    if (Number.isFinite(v) && v >= 0 && v <= 1) return v
  } catch {
    /* ignore */
  }
  return 0.45
}

export default function ZenSoundWidget() {
  const labelId = useId()
  const ctxRef = useRef<AudioContext | null>(null)
  const padRef = useRef<ReturnType<typeof startZenPad> | null>(null)
  const [playing, setPlaying] = useState(false)
  const [expanded, setExpanded] = useState(false)
  const [volume, setVolume] = useState(readVol)

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_VOL, String(volume))
    } catch {
      /* ignore */
    }
    padRef.current?.setVolume(volume)
  }, [volume])

  const teardown = useCallback(() => {
    padRef.current?.stop()
    padRef.current = null
    const ctx = ctxRef.current
    if (ctx && ctx.state !== 'closed') {
      void ctx.close().catch(() => {})
    }
    ctxRef.current = null
    setPlaying(false)
  }, [])

  useEffect(() => () => teardown(), [teardown])

  const togglePlay = useCallback(() => {
    if (playing) {
      teardown()
      return
    }
    const AC = window.AudioContext || (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext
    if (!AC) return
    const ctx = new AC()
    ctxRef.current = ctx
    padRef.current = startZenPad(ctx, volume)
    void ctx.resume().then(() => setPlaying(true))
  }, [playing, teardown, volume])

  return (
    <div className={`zen-sound${expanded ? ' zen-sound--open' : ''}`}>
      <div className="zen-sound__row">
        <button
          type="button"
          className={`zen-sound__toggle${playing ? ' zen-sound__toggle--on' : ''}`}
          onClick={togglePlay}
          aria-pressed={playing}
          aria-labelledby={labelId}
          title={playing ? 'Pause zen pad' : 'Play calm zen pad (generated in browser)'}
        >
          <span className="zen-sound__icon" aria-hidden>
            {playing ? '◌' : '〰'}
          </span>
        </button>
        <button
          type="button"
          className="zen-sound__expand"
          onClick={() => setExpanded((e) => !e)}
          aria-expanded={expanded}
          title={expanded ? 'Hide volume' : 'Volume'}
        >
          ···
        </button>
      </div>
      <p id={labelId} className="zen-sound__label">
        {playing ? 'Zen pad' : 'Calm sound'}
      </p>
      {expanded ? (
        <div className="zen-sound__panel">
          <label className="zen-sound__volLabel" htmlFor={`${labelId}-vol`}>
            Softness
          </label>
          <input
            id={`${labelId}-vol`}
            className="zen-sound__slider"
            type="range"
            min={0}
            max={100}
            value={Math.round(volume * 100)}
            onChange={(e) => setVolume(Number(e.target.value) / 100)}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={Math.round(volume * 100)}
          />
          <p className="zen-sound__hint">No files — gentle tones in this browser only.</p>
        </div>
      ) : null}
    </div>
  )
}
