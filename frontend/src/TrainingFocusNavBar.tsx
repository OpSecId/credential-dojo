import { useHomeTrainingFocusShell } from './HomeTrainingFocusShellContext'

/** Slim training-focus strip in the shell top bar (home only; value from HomePage). */
export default function TrainingFocusNavBar() {
  const { meter } = useHomeTrainingFocusShell()
  const pct = Math.round(meter)

  return (
    <div
      className="app-shell__trainingFocus"
      aria-label={`Training focus, ${pct} percent`}
      title="Training focus (修 · shū) — kata, Kinchaku, and school switches raise it; drifts down slowly when idle. Higher levels speed novice-path insight."
    >
      <div className="app-shell__trainingFocus-track" role="presentation">
        <div className="app-shell__trainingFocus-fill" style={{ width: `${pct}%` }} />
      </div>
      <span className="app-shell__trainingFocus-label">Training · {pct}%</span>
    </div>
  )
}
