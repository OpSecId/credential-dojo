import { Link } from 'react-router-dom'
import { useMemo, useState } from 'react'
import ReactFlow, {
  Background,
  Controls,
  Panel,
  MarkerType,
  MiniMap,
  Position,
  type NodeMouseHandler,
  type Edge,
  type Node,
} from 'reactflow'
import 'reactflow/dist/style.css'
import './TejunViewerPage.css'
import { EXPEDITION_STEPS } from './expeditionSteps'

type LaneKey = 'define' | 'issue' | 'present' | 'inspect' | 'operate'

const LANE_LABELS: Record<LaneKey, string> = {
  define: 'Define',
  issue: 'Issue',
  present: 'Present',
  inspect: 'Inspect',
  operate: 'Operate',
}

const LANE_Y: Record<LaneKey, number> = {
  define: 90,
  issue: 250,
  present: 410,
  inspect: 570,
  operate: 730,
}

function laneForStepIndex(i: number): LaneKey {
  if (i <= 3) return 'define'
  if (i <= 6) return 'issue'
  if (i <= 8) return 'present'
  if (i <= 11) return 'inspect'
  return 'operate'
}

export default function TejunViewerPage() {
  const [selectedId, setSelectedId] = useState('s0')

  const { nodes, edges } = useMemo(() => {
    const n: Node[] = EXPEDITION_STEPS.map((step, i) => ({
      id: `s${i}`,
      position: { x: 80 + i * 260, y: LANE_Y[laneForStepIndex(i)] },
      data: {
        label: `${i + 1}. ${step.title}`,
      },
      type: 'default',
      sourcePosition: Position.Right,
      targetPosition: Position.Left,
      style: {
        width: 220,
        borderRadius: 12,
        border: '1px solid rgba(90, 232, 255, 0.35)',
        background: 'linear-gradient(165deg, rgba(10, 16, 30, 0.94), rgba(7, 10, 18, 0.9))',
        color: 'var(--text-h)',
        fontSize: 12.5,
        padding: '10px 12px',
      },
    }))

    const e: Edge[] = EXPEDITION_STEPS.slice(1).map((_, i) => ({
      id: `e${i}-${i + 1}`,
      source: `s${i}`,
      target: `s${i + 1}`,
      type: 'smoothstep',
      pathOptions: { borderRadius: 20, offset: 18 },
      markerEnd: { type: MarkerType.ArrowClosed },
      animated: i >= 7 && i <= 9,
      label: i === 7 ? 'Shōkan → Enbu' : undefined,
      labelStyle: { fill: 'var(--cyber-cyan)', fontSize: 11, fontWeight: 700 },
      style: { stroke: 'rgba(90, 232, 255, 0.55)', strokeWidth: 1.6 },
    }))
    return { nodes: n, edges: e }
  }, [])

  const selected = useMemo(() => {
    const idx = Number(selectedId.replace('s', ''))
    return Number.isNaN(idx) ? null : EXPEDITION_STEPS[idx] ?? null
  }, [selectedId])

  const onNodeClick: NodeMouseHandler = (_e, node) => {
    setSelectedId(node.id)
  }

  return (
    <div className="dojo-scene dojo-scene--night tejun-viewer">
      <div className="dojo-scene__moon" aria-hidden />
      <div className="dojo-scene__bg" aria-hidden />
      <div className="dojo-scene__grid" aria-hidden />

      <header className="tejun-viewer__header">
        <p className="tejun-viewer__eyebrow">Tejun Viewer</p>
        <h1 className="tejun-viewer__title">Expedition Flow Map</h1>
        <p className="tejun-viewer__intro">
          Interactive runbook view of the expedition narrative, from Tehon through Tejun.
        </p>
        <nav className="tejun-viewer__nav">
          <Link className="tejun-viewer__back" to="/" title="Back Home">
            ← Back Home
          </Link>
          <Link className="tejun-viewer__back" to="/expedition">
            Expedition
          </Link>
        </nav>
      </header>

      <div className="tejun-viewer__layout">
        <aside className="tejun-viewer__details dojo-augmented dojo-augmented--panel" data-augmented-ui="tl-clip br-clip border">
          <p className="tejun-viewer__detailsLabel">Selected Step</p>
          {selected ? (
            <>
              <h2 className="tejun-viewer__detailsTitle">{selected.title}</h2>
              <p className="tejun-viewer__detailsTerm">
                {selected.term.name} <span lang="ja">{selected.term.glyph}</span>
              </p>
              {selected.unionAction ? (
                <p className="tejun-viewer__detailsAction">Action: {selected.unionAction}</p>
              ) : null}
              <p className="tejun-viewer__detailsText">{selected.scene}</p>
              <p className="tejun-viewer__detailsText tejun-viewer__detailsText--muted">{selected.action}</p>
            </>
          ) : null}
          <p className="tejun-viewer__detailsHint">Click a node to inspect the expedition step details.</p>
        </aside>

        <section className="tejun-viewer__canvas dojo-augmented dojo-augmented--panel" data-augmented-ui="tl-clip tr-clip bl-clip br-clip border">
          <ReactFlow
            fitView
            nodes={nodes}
            edges={edges}
            onNodeClick={onNodeClick}
            proOptions={{ hideAttribution: true }}
            defaultViewport={{ x: -40, y: -40, zoom: 0.66 }}
          >
            <Panel position="top-left">
              <div className="tejun-viewer__lanes" aria-label="Flow lanes">
                {(Object.keys(LANE_LABELS) as LaneKey[]).map((lane) => (
                  <span key={lane} className="tejun-viewer__laneChip">
                    {LANE_LABELS[lane]}
                  </span>
                ))}
              </div>
            </Panel>
            <Background gap={22} size={1} />
            <MiniMap pannable zoomable />
            <Controls />
          </ReactFlow>
        </section>
      </div>
    </div>
  )
}

