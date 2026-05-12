import { useDojoHubUi } from './DojoHubUiContext'
import { useNoviceIdle } from './novice/NoviceIdleContext'
import './DojoNavRankProgress.css'

/** Compact rank bar in the shell top nav; opens the shared Dojo progress hub panel. */
export default function DojoNavRankProgress() {
  const { rank } = useNoviceIdle()
  const { open, setOpen } = useDojoHubUi()
  const pct = rank.insightToNext === null ? 100 : Math.round(rank.progress01 * 100)

  return (
    <button
      type="button"
      className="dojo-hub-openTrigger dojo-hub-navRank"
      onClick={() => setOpen(true)}
      aria-expanded={open}
      aria-controls="dojo-progress-hub"
      title="Your dojo — rank, journey, tracks, and achievements"
    >
      <span className="dojo-hub-navRank__bar" role="presentation">
        <span className="dojo-hub-navRank__fill" style={{ width: `${pct}%` }} />
      </span>
      <span className="dojo-hub-navRank__meta">
        <span className="dojo-hub-navRank__label">Rank</span>
        <span className="dojo-hub-navRank__ja" lang="ja">
          {rank.rank.titleJa}
        </span>
      </span>
    </button>
  )
}
