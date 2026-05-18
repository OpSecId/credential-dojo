import { useEffect, useMemo, useState } from 'react'
import { getWalletItems, type WalletItemStatus } from './walletInventory'
import { productTerminology } from './terminology'

const STATUS_LABEL: Record<WalletItemStatus, string> = {
  ready: 'Ready',
  queued: 'Queued',
  archived: 'Archived',
}

export default function KinchakuWalletView() {
  const menkyo = productTerminology.credential.name

  const [items, setItems] = useState(() => getWalletItems())
  const [activeId, setActiveId] = useState('')

  const credentials = useMemo(() => items.filter((item) => item.type === 'credential'), [items])

  const activeItem = credentials.find((item) => item.id === activeId) ?? credentials[0] ?? null

  useEffect(() => {
    const onStorage = () => setItems(getWalletItems())
    window.addEventListener('storage', onStorage)
    return () => window.removeEventListener('storage', onStorage)
  }, [])

  useEffect(() => {
    if (credentials.length === 0) {
      setActiveId('')
      return
    }
    if (!credentials.some((c) => c.id === activeId)) {
      setActiveId(credentials[0]!.id)
    }
  }, [credentials, activeId])

  const readyCount = credentials.filter((c) => c.status === 'ready').length

  return (
    <section className="kinchakuPage__card kinchakuPage__inventoryCard" aria-labelledby="kinchaku-wallet-label">
      <h2 id="kinchaku-wallet-label" className="kinchakuPage__inventoryHeading">
        Stored {menkyo}
      </h2>

      <div className="kinchakuPage__stats" aria-label="Wallet totals">
        <article className="kinchakuPage__statCard">
          <p className="kinchakuPage__statLabel">{menkyo} stored</p>
          <p className="kinchakuPage__statValue">{credentials.length}</p>
        </article>
        <article className="kinchakuPage__statCard">
          <p className="kinchakuPage__statLabel">Ready</p>
          <p className="kinchakuPage__statValue">{readyCount}</p>
        </article>
      </div>

      <div className="kinchakuPage__layout">
        <div className="kinchakuPage__listCard">
          {credentials.length === 0 ? (
            <p className="kinchakuPage__empty">
              No credentials yet—issue from <strong>Tehon の Menkyo</strong> or add via OID4VCI.
            </p>
          ) : (
            <ul className="kinchakuPage__list">
              {credentials.map((item) => (
                <li key={item.id}>
                  <button
                    type="button"
                    className={`kinchakuPage__item${
                      activeItem?.id === item.id ? ' kinchakuPage__item--active' : ''
                    }`}
                    onClick={() => setActiveId(item.id)}
                  >
                    <div className="kinchakuPage__itemTop">
                      <span className="kinchakuPage__itemType">{menkyo}</span>
                      <span className="kinchakuPage__itemStatus">{STATUS_LABEL[item.status]}</span>
                    </div>
                    <div className="kinchakuPage__itemTitle">{item.title}</div>
                    <div className="kinchakuPage__itemMeta">
                      {item.subtitle} · {item.issuerOrSource}
                    </div>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        <aside className="kinchakuPage__detailCard" aria-label="Selected credential">
          {activeItem ? (
            <>
              <p className="kinchakuPage__detailType">
                {menkyo} · {STATUS_LABEL[activeItem.status]}
              </p>
              <h3 className="kinchakuPage__detailTitle">{activeItem.title}</h3>
              <p className="kinchakuPage__detailSubtitle">{activeItem.subtitle}</p>
              <p className="kinchakuPage__detailRow">
                <strong>Source:</strong> {activeItem.issuerOrSource}
              </p>
              <p className="kinchakuPage__detailRow">
                <strong>Updated:</strong> {new Date(activeItem.updatedAt).toLocaleString()}
              </p>
              <div className="kinchakuPage__tags" aria-label="Credential tags">
                {activeItem.tags.map((tag) => (
                  <span key={tag} className="kinchakuPage__tag">
                    {tag}
                  </span>
                ))}
              </div>

              {activeItem.bodyJson ? (
                <>
                  <p className="kinchakuPage__jsonLabel">{menkyo} · full JSON</p>
                  <pre className="kinchakuPage__bodyJson">{activeItem.bodyJson}</pre>
                </>
              ) : (
                <>
                  <p className="kinchakuPage__jsonHint">Preview only — no full JSON stored for this row.</p>
                  <pre className="kinchakuPage__preview">{activeItem.preview}</pre>
                </>
              )}
            </>
          ) : (
            <p className="kinchakuPage__empty">Select a stored credential to inspect its JSON.</p>
          )}
        </aside>
      </div>

      <button type="button" className="kinchakuPage__btn kinchakuPage__btn--ghost" onClick={() => setItems(getWalletItems())}>
        Refresh wallet
      </button>
    </section>
  )
}
