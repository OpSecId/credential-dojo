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

const SEED_STUDENT_CREDENTIAL_JSON = `{
  "@context": ["https://www.w3.org/ns/credentials/v2"],
  "id": "urn:uuid:seed-student-menkyo-demo",
  "type": ["VerifiableCredential", "StudentCredential"],
  "issuer": "did:key:z6MkregistrarEdRyuDemoDojo000000000000000",
  "validFrom": "2026-05-07T07:10:00.000Z",
  "credentialSubject": {
    "id": "did:key:z6MkholderStudentExampleDemo000000000000",
    "studentId": "STU-2048",
    "program": "Credential Dojo · Demo pathway",
    "pathway": "Kinchaku seed · Student ID Menkyo"
  },
  "credentialSchema": {
    "id": "https://credential.ninja/schemas/student-demo-v1",
    "type": "JsonSchema"
  },
  "proof": {
    "type": "DataIntegrityProof",
    "cryptosuite": "eddsa-rdfc-2022",
    "verificationMethod": "did:key:z6MkregistrarEdRyuDemoDojo000000000000000#z6MkregistrarEdRyuDemoDojo000000000000000",
    "proofPurpose": "assertionMethod",
    "created": "2026-05-07T07:10:00.000Z",
    "proofValue": "z58DEMODOJOPLACEHOLDERNOTAVERIFIEDSIGNATURE"
  }
}`

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
    bodyJson: SEED_STUDENT_CREDENTIAL_JSON,
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
    const items = parsed.filter(Boolean) as WalletItem[]
    return items.map((it) =>
      it.id === 'seed-menkyo-student' && !it.bodyJson ? { ...it, bodyJson: SEED_STUDENT_CREDENTIAL_JSON } : it,
    )
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
