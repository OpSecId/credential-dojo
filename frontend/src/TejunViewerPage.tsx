import { Link } from 'react-router-dom'
import { useMemo } from 'react'
import ReactFlow, { Background, Controls, MarkerType, MiniMap, type Edge, type Node } from 'reactflow'
import 'reactflow/dist/style.css'
import './TejunViewerPage.css'
import { EXPEDITION_STEPS } from './expeditionSteps'

const GAP_X = 290
const START_X = 30
const START_Y = 80

export default function TejunViewerPage() {
  const { nodes, edges } = useMemo(() => {
    const n: Node[] = EXPEDITION_STEPS.map((step, i) => ({
      id: `s${i}`,
      position: { x: START_X + i * GAP_X, y: START_Y + (i % 2 ? 120 : 0) },
      data: {
        label: `${i + 1}. ${step.term.name} (${step.term.glyph})`,
      },
      type: 'default',
      sourcePosition: 'right',
      targetPosition: 'left',
    }))

    const e: Edge[] = EXPEDITION_STEPS.slice(1).map((_, i) => ({
      id: `e${i}-${i + 1}`,
      source: `s${i}`,
      target: `s${i + 1}`,
      markerEnd: { type: MarkerType.ArrowClosed },
      animated: i === EXPEDITION_STEPS.length - 2,
      label: i === 7 ? 'Shōkan → Enbu' : undefined,
    }))
    return { nodes: n, edges: e }
  }, [])

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
          <Link className="tejun-viewer__back" to="/">
            ← Home
          </Link>
          <Link className="tejun-viewer__back" to="/expedition">
            Expedition
          </Link>
        </nav>
      </header>

      <section className="tejun-viewer__canvas dojo-augmented dojo-augmented--panel" data-augmented-ui="tl-clip tr-clip bl-clip br-clip border">
        <ReactFlow fitView nodes={nodes} edges={edges} proOptions={{ hideAttribution: true }}>
          <Background gap={20} size={1} />
          <MiniMap pannable zoomable />
          <Controls />
        </ReactFlow>
      </section>
    </div>
  )
}

