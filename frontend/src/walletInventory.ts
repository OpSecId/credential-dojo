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
  preview: string
}

type WalletItemInput = Omit<WalletItem, 'id' | 'updatedAt'>

const STORAGE_KEY = 'dojo.kinchaku.inventory.v1'
const MAX_ITEMS = 60

const DEFAULT_ITEMS: WalletItem[] = [
  {
    id: 'seed-menkyo-student',
    type: 'credential',
    title: 'Student ID Menkyo',
    subtitle: 'Holder identity credential',
    issuerOrSource: 'Ed-ryu Registrar',
    status: 'ready',
    tags: ['Menkyo', 'Identity', 'EdDSA'],
    updatedAt: '2026-05-07T07:10:00Z',
    preview: '{ "type": ["VerifiableCredential", "StudentCredential"], "issuer": "did:key:z6M..." }',
  },
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
  if (typeof window === 'undefined') return DEFAULT_ITEMS
  const existing = safeReadRaw()
  if (existing && existing.length) return existing
  localStorage.setItem(STORAGE_KEY, JSON.stringify(DEFAULT_ITEMS))
  return DEFAULT_ITEMS
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
