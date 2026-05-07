export const PASSKEY_STORAGE_KEY = 'credential-dojo-passkey'

export type StoredPasskey = {
  credentialIdB64Url: string
  createdAt: string
  label: string
}

export function readPasskey(): StoredPasskey | null {
  try {
    const raw = localStorage.getItem(PASSKEY_STORAGE_KEY)
    if (!raw) return null
    const data = JSON.parse(raw) as unknown
    if (!data || typeof data !== 'object') return null
    const o = data as Record<string, unknown>
    const credentialIdB64Url = typeof o.credentialIdB64Url === 'string' ? o.credentialIdB64Url : ''
    const createdAt = typeof o.createdAt === 'string' ? o.createdAt : ''
    const label = typeof o.label === 'string' ? o.label : 'Passkey'
    if (!credentialIdB64Url || !createdAt) return null
    return { credentialIdB64Url, createdAt, label }
  } catch {
    return null
  }
}

export function writePasskey(p: StoredPasskey): void {
  try {
    localStorage.setItem(PASSKEY_STORAGE_KEY, JSON.stringify(p))
  } catch {
    /* ignore */
  }
}

export function clearPasskey(): void {
  try {
    localStorage.removeItem(PASSKEY_STORAGE_KEY)
  } catch {
    /* ignore */
  }
}
