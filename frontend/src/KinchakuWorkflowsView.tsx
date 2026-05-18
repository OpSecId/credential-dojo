import { Link } from 'react-router-dom'
import { useEffect, useMemo, useState } from 'react'
import { productTerminology } from './terminology'
import { getWalletItems, type WalletItem, type WalletItemStatus } from './walletInventory'

const STATUS_LABEL: Record<WalletItemStatus, string> = {
  ready: 'Ready',
  queued: 'In progress',
  archived: 'Archived',
}

function isActiveWorkflow(item: WalletItem): boolean {
  if (item.status === 'queued') return true
  return item.tags.some((t) => /OID4|Shōkan|Shokan|Randori|Tejun/i.test(t))
}

export default function KinchakuWorkflowsView() {
  const workflow = productTerminology.workflow
  const exchange = productTerminology.exchange

  const [items, setItems] = useState(() => getWalletItems())

  useEffect(() => {
    const onStorage = () => setItems(getWalletItems())
    window.addEventListener('storage', onStorage)
    return () => window.removeEventListener('storage', onStorage)
  }, [])

  const active = useMemo(() => items.filter(isActiveWorkflow), [items])

  return (
    <section className="kinchakuPage__card" aria-labelledby="kinchaku-workflows-label">
      <h2 id="kinchaku-workflows-label" className="kinchakuPage__inventoryHeading">
        Active {workflow.name}
      </h2>
      <p className="kinchakuPage__workflowsHint">
        Queued artifacts and in-flight <strong>{exchange.name}</strong> steps appear here until they finish or you
        archive them.
      </p>

      <ul className="kinchakuPage__workflowStarts" aria-label="Start a workflow">
        <li>
          <Link className="kinchakuPage__workflowStart" to="/kinchaku-oid4vci">
            OID4VCI credential offer
          </Link>
        </li>
        <li>
          <Link className="kinchakuPage__workflowStart" to="/kinchaku/scan">
            Scan offer QR
          </Link>
        </li>
      </ul>

      {active.length === 0 ? (
        <p className="kinchakuPage__empty">No active workflows—start OID4VCI intake or scan a QR to begin.</p>
      ) : (
        <ul className="kinchakuPage__list kinchakuPage__list--workflows">
          {active.map((item) => (
            <li key={item.id}>
              <article className="kinchakuPage__workflowCard">
                <div className="kinchakuPage__itemTop">
                  <span className="kinchakuPage__itemType">{item.type === 'credential' ? 'Menkyo' : 'Artifact'}</span>
                  <span className="kinchakuPage__itemStatus">{STATUS_LABEL[item.status]}</span>
                </div>
                <h3 className="kinchakuPage__workflowTitle">{item.title}</h3>
                <p className="kinchakuPage__itemMeta">
                  {item.subtitle} · {item.issuerOrSource}
                </p>
                <p className="kinchakuPage__workflowUpdated">
                  Updated {new Date(item.updatedAt).toLocaleString()}
                </p>
                <div className="kinchakuPage__tags" aria-label="Workflow tags">
                  {item.tags.map((tag) => (
                    <span key={tag} className="kinchakuPage__tag">
                      {tag}
                    </span>
                  ))}
                </div>
              </article>
            </li>
          ))}
        </ul>
      )}

      <button type="button" className="kinchakuPage__btn kinchakuPage__btn--ghost" onClick={() => setItems(getWalletItems())}>
        Refresh workflows
      </button>
    </section>
  )
}
