import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import './App.css'
import './KinchakuPage.css'
import { useDojoLandingTheme } from './DojoLandingThemeContext'
import { productTerminology } from './terminology'
import { getWalletItems, type WalletItemType, type WalletItemStatus } from './walletInventory'

const STATUS_LABEL: Record<WalletItemStatus, string> = {
  ready: 'Ready',
  queued: 'Queued',
  archived: 'Archived',
}

export default function KinchakuPage() {
  const { theme } = useDojoLandingTheme()
  const [items, setItems] = useState(() => getWalletItems())
  const [tab, setTab] = useState<'all' | WalletItemType>('all')
  const [activeId, setActiveId] = useState(items[0]?.id ?? '')

  const filtered = useMemo(() => {
    if (tab === 'all') return items
    return items.filter((item) => item.type === tab)
  }, [tab, items])

  const activeItem = filtered.find((item) => item.id === activeId) ?? filtered[0]

  useEffect(() => {
    const onStorage = () => setItems(getWalletItems())
    window.addEventListener('storage', onStorage)
    return () => window.removeEventListener('storage', onStorage)
  }, [])

  const stats = useMemo(() => {
    const credentials = items.filter((i) => i.type === 'credential').length
    const artifacts = items.filter((i) => i.type === 'artifact').length
    const queued = items.filter((i) => i.status === 'queued').length
    return { credentials, artifacts, queued }
  }, [items])

  return (
    <div className={`dojo-scene dojo-scene--${theme} dojo-scene--zen`}>
      <div className="dojo-scene__moon" aria-hidden />
      <div className="dojo-scene__bg" aria-hidden />
      <div className="dojo-scene__grid" aria-hidden />
      <main className="kinchaku-page__main kinchaku-page dojoZenPage dojoZenPage--wide">
        <header className="dojoZenPage__header">
          <p className="dojoZenPage__eyebrow">Credential Dojo</p>
          <h1 className="dojoZenPage__title">
            {productTerminology.wallet.name}{' '}
            <span lang="ja">{productTerminology.wallet.glyph}</span>
          </h1>
          <p className="dojoZenPage__intro">
            A full inventory of stored <strong>Menkyo</strong> credentials and flow artifacts like{' '}
            <strong>Shokan</strong> requests and <strong>Enbu</strong> responses. Select a credential to view the full
            issued JSON when it was saved from <Link to="/issue">issuance</Link> or Kensa; the seed student Menkyo
            includes a complete demo VC.
          </p>
          <nav className="dojoZenPage__nav" aria-label="Kinchaku navigation">
            <Link className="dojoZenPage__back" to="/">
              ← Back Home
            </Link>
            <Link className="dojoZenPage__back" to="/kensa">
              Open Kensa
            </Link>
            <Link className="dojoZenPage__back" to="/expedition">
              Open Expedition
            </Link>
            <Link className="dojoZenPage__back" to="/kinchaku-oid4vci">
              OID4VCI offer URI
            </Link>
            <button type="button" className="dojoZenPage__back" onClick={() => setItems(getWalletItems())}>
              Refresh Wallet
            </button>
          </nav>
        </header>

        <section className="kinchaku-page__stats" aria-label="Wallet totals">
          <article className="kinchaku-page__statCard">
            <p className="kinchaku-page__statLabel">Menkyo stored</p>
            <p className="kinchaku-page__statValue">{stats.credentials}</p>
          </article>
          <article className="kinchaku-page__statCard">
            <p className="kinchaku-page__statLabel">Artifacts logged</p>
            <p className="kinchaku-page__statValue">{stats.artifacts}</p>
          </article>
          <article className="kinchaku-page__statCard">
            <p className="kinchaku-page__statLabel">Queue waiting</p>
            <p className="kinchaku-page__statValue">{stats.queued}</p>
          </article>
        </section>

        <section className="kinchaku-page__workspace">
          <div className="kinchaku-page__listCard">
            <div className="kinchaku-page__tabs" role="tablist" aria-label="Inventory filter">
              <button
                type="button"
                className={`kinchaku-page__tab${tab === 'all' ? ' kinchaku-page__tab--active' : ''}`}
                onClick={() => setTab('all')}
              >
                All
              </button>
              <button
                type="button"
                className={`kinchaku-page__tab${tab === 'credential' ? ' kinchaku-page__tab--active' : ''}`}
                onClick={() => setTab('credential')}
              >
                Credentials
              </button>
              <button
                type="button"
                className={`kinchaku-page__tab${tab === 'artifact' ? ' kinchaku-page__tab--active' : ''}`}
                onClick={() => setTab('artifact')}
              >
                Artifacts
              </button>
            </div>
            <ul className="kinchaku-page__list">
              {filtered.map((item) => (
                <li key={item.id}>
                  <button
                    type="button"
                    className={`kinchaku-page__item${activeItem?.id === item.id ? ' kinchaku-page__item--active' : ''}`}
                    onClick={() => setActiveId(item.id)}
                  >
                    <p className="kinchaku-page__itemTitle">{item.title}</p>
                    <p className="kinchaku-page__itemMeta">
                      {item.subtitle} · {item.issuerOrSource}
                    </p>
                  </button>
                </li>
              ))}
            </ul>
          </div>

          <aside className="kinchaku-page__detailCard">
            {activeItem ? (
              <>
                <p className="kinchaku-page__detailType">
                  {activeItem.type === 'credential' ? 'Credential' : 'Artifact'} ·{' '}
                  {STATUS_LABEL[activeItem.status]}
                </p>
                <h2 className="kinchaku-page__detailTitle">{activeItem.title}</h2>
                <p className="kinchaku-page__detailSubtitle">{activeItem.subtitle}</p>
                <p className="kinchaku-page__detailRow">
                  <strong>Source:</strong> {activeItem.issuerOrSource}
                </p>
                <p className="kinchaku-page__detailRow">
                  <strong>Updated:</strong> {new Date(activeItem.updatedAt).toLocaleString()}
                </p>
                <div className="kinchaku-page__tags" aria-label="Item tags">
                  {activeItem.tags.map((tag) => (
                    <span key={tag} className="kinchaku-page__tag">
                      {tag}
                    </span>
                  ))}
                </div>
                {activeItem.bodyJson ? (
                  <>
                    <p className="kinchaku-page__jsonLabel">
                      {activeItem.type === 'credential' ? 'Menkyo · full JSON' : 'Artifact · full JSON'}
                    </p>
                    <pre className="kinchaku-page__bodyJson">{activeItem.bodyJson}</pre>
                  </>
                ) : (
                  <>
                    <p className="kinchaku-page__jsonHint">Preview only — no full JSON stored for this row.</p>
                    <pre className="kinchaku-page__preview">{activeItem.preview}</pre>
                  </>
                )}
              </>
            ) : (
              <p className="kinchaku-page__empty">No inventory for the selected filter yet.</p>
            )}
          </aside>
        </section>
      </main>
    </div>
  )
}
