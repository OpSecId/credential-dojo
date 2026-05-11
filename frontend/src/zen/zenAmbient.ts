import type { ZenPadControls } from './zenAmbientTypes'

/**
 * Soft procedural pad: low sines + filtered noise. Stops cleanly for React unmount.
 * Call only after a user gesture (click) so AudioContext is allowed.
 */
export function startZenPad(ctx: AudioContext, volume01: number): ZenPadControls {
  const master = ctx.createGain()
  master.gain.value = 0
  master.connect(ctx.destination)

  const bus = ctx.createGain()
  bus.gain.value = Math.max(0.04, Math.min(0.22, volume01 * 0.2))
  bus.connect(master)

  const freqs = [174.61, 220, 277.18] as const
  const oscillators: OscillatorNode[] = []
  for (const f of freqs) {
    const o = ctx.createOscillator()
    o.type = 'sine'
    o.frequency.setValueAtTime(f, ctx.currentTime)
    const g = ctx.createGain()
    g.gain.value = 0.18
    o.connect(g)
    g.connect(bus)
    o.start()
    oscillators.push(o)
  }

  const bufferSize = Math.floor(1.8 * ctx.sampleRate)
  const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate)
  const data = buffer.getChannelData(0)
  for (let i = 0; i < bufferSize; i++) {
    data[i] = (Math.random() * 2 - 1) * 0.12
  }
  const noise = ctx.createBufferSource()
  noise.buffer = buffer
  noise.loop = true
  const nf = ctx.createBiquadFilter()
  nf.type = 'lowpass'
  nf.frequency.value = 620
  const ng = ctx.createGain()
  ng.gain.value = 0.05
  noise.connect(nf)
  nf.connect(ng)
  ng.connect(bus)
  noise.start()

  let raf = 0
  const t0 = performance.now()
  const breathe = () => {
    const t = ctx.currentTime
    const phase = (performance.now() - t0) / 1000
    const v = 0.08 + Math.sin(phase * 0.42) * 0.05 + Math.sin(phase * 0.11) * 0.025
    master.gain.setTargetAtTime(Math.max(0.02, Math.min(0.2, v)), t, 0.12)
    raf = requestAnimationFrame(breathe)
  }
  raf = requestAnimationFrame(breathe)

  return {
    setVolume(v01: number) {
      const v = Math.max(0.04, Math.min(0.26, v01 * 0.24))
      bus.gain.setTargetAtTime(v, ctx.currentTime, 0.06)
    },
    stop() {
      cancelAnimationFrame(raf)
      for (const o of oscillators) {
        try {
          o.stop()
        } catch {
          /* already stopped */
        }
      }
      try {
        noise.stop()
      } catch {
        /* */
      }
      try {
        bus.disconnect()
      } catch {
        /* */
      }
      try {
        master.disconnect()
      } catch {
        /* */
      }
    },
  }
}
