export type WalletItemType = 'credential' | 'artifact'
export type WalletItemStatus = 'ready' | 'queued' | 'archived'

export type WalletItem = {
  id: string
  type: WalletItemType
  title: string
  subtitle: string
  issuerOrSource: string
  status: WalletItemStatus
  tags: string[]
  updatedAt: string
  /** Short line for list rows / legacy display */
  preview: string
  /** Full JSON payload when available (e.g. issued Menkyo VC) */
  bodyJson?: string
}

type WalletItemInput = Omit<WalletItem, 'id' | 'updatedAt'>

const STORAGE_KEY = 'dojo.kinchaku.inventory.v1'
const MAX_ITEMS = 60

/** Removed from inventory; still stripped if present in older localStorage. */
const LEGACY_SEED_CREDENTIAL_ID = 'seed-menkyo-student'

function withoutLegacySeedCredential(items: WalletItem[]): WalletItem[] {
  return items.filter((it) => it.id !== LEGACY_SEED_CREDENTIAL_ID)
}

const DEFAULT_ITEMS: WalletItem[] = [
  {
    id: 'seed-shokan-oid4vp',
    type: 'artifact',
    title: 'Shokan Request',
    subtitle: 'OID4VP presentation request',
    issuerOrSource: 'Verifier Gate',
    status: 'queued',
    tags: ['Shokan', 'OID4VP', 'Challenge'],
    updatedAt: '2026-05-07T08:36:00Z',
    preview: '{ "client_id": "verifier.example", "nonce": "n-0S6_WzA2Mj", "presentation_definition": {} }',
  },
]

function safeReadRaw(): WalletItem[] | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw) as unknown
    if (!Array.isArray(parsed)) return null
    return parsed.filter(Boolean) as WalletItem[]
  } catch {
    return null
  }
}

export function getWalletItems(): WalletItem[] {
  if (typeof window === 'undefined') return [...DEFAULT_ITEMS]
  const existing = safeReadRaw()
  if (existing && existing.length) {
    const cleaned = withoutLegacySeedCredential(existing)
    if (cleaned.length !== existing.length) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(cleaned))
    }
    return cleaned
  }
  localStorage.setItem(STORAGE_KEY, JSON.stringify(DEFAULT_ITEMS))
  return [...DEFAULT_ITEMS]
}

export function addWalletItem(input: WalletItemInput): WalletItem[] {
  const nextItem: WalletItem = {
    ...input,
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    updatedAt: new Date().toISOString(),
  }
  const next = [nextItem, ...getWalletItems()].slice(0, MAX_ITEMS)
  localStorage.setItem(STORAGE_KEY, JSON.stringify(next))
  return next
}
