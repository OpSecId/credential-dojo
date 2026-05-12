import { DEMO_PERSONAS_OFFLINE } from './demoPersonas'

/** Same key as Home persona tabs — kept in sync with the active ninja profile’s school. */
export const PERSONA_STORAGE_KEY = 'credential-dojo-persona'

/** Legacy single-profile blob; migrated once into the vault. */
export const NINJA_PROFILE_STORAGE_KEY = 'credential-dojo-ninja-profile'

const NINJA_VAULT_KEY = 'credential-dojo-ninja-vault'

/** Fired on same-tab profile writes so shell UI can refresh (e.g. after wizard save). */
export const NINJA_PROFILE_CHANGED_EVENT = 'credential-dojo-ninja-profile-changed'

/** Default in-browser identity when the vault is empty or codename is left blank. */
export const DEFAULT_NINJA_CODENAME = 'Anonymous'

function notifyNinjaProfileChanged(): void {
  try {
    window.dispatchEvent(new CustomEvent(NINJA_PROFILE_CHANGED_EVENT))
  } catch {
    /* ignore */
  }
}

export type NinjaProfile = {
  codename: string
  schoolId: string
  createdAt: string
}

export type NinjaProfileRecord = NinjaProfile & { id: string }

type VaultV1 = {
  v: 1
  profiles: NinjaProfileRecord[]
  activeId: string | null
}

/** Map retired persona ids so stored profiles keep working after renames. */
export function migrateLegacySchoolId(id: string): string {
  if (id === 'sd-ryu') return 'ec-sd-ryu'
  if (id === 'anoncreds-ryu') return 'cl-ryu'
  return id
}

export function isValidSchoolId(id: string): boolean {
  return DEMO_PERSONAS_OFFLINE.some((p) => p.id === id)
}

function normalizeCodename(raw: string): string {
  const t = raw.trim().replace(/\s+/g, ' ')
  const cut = t.slice(0, 48)
  return cut.length > 0 ? cut : DEFAULT_NINJA_CODENAME
}

function generateProfileId(): string {
  try {
    if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
      return crypto.randomUUID()
    }
  } catch {
    /* ignore */
  }
  return `np-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`
}

function parseProfileRecord(o: Record<string, unknown>, id: string): NinjaProfileRecord | null {
  const codename = typeof o.codename === 'string' ? o.codename : ''
  const schoolIdRaw = typeof o.schoolId === 'string' ? o.schoolId : ''
  const schoolId = migrateLegacySchoolId(schoolIdRaw)
  const createdAt = typeof o.createdAt === 'string' ? o.createdAt : ''
  if (!isValidSchoolId(schoolId) || !createdAt) return null
  return {
    id,
    codename: normalizeCodename(codename),
    schoolId,
    createdAt,
  }
}

function readLegacySingleProfile(): NinjaProfile | null {
  try {
    const raw = localStorage.getItem(NINJA_PROFILE_STORAGE_KEY)
    if (!raw) return null
    const data = JSON.parse(raw) as unknown
    if (!data || typeof data !== 'object') return null
    const o = data as Record<string, unknown>
    if (typeof o.id === 'string') return null
    const codename = typeof o.codename === 'string' ? o.codename : ''
    const schoolIdRaw = typeof o.schoolId === 'string' ? o.schoolId : ''
    const schoolId = migrateLegacySchoolId(schoolIdRaw)
    const createdAt = typeof o.createdAt === 'string' ? o.createdAt : ''
    if (!isValidSchoolId(schoolId) || !createdAt) return null
    return {
      codename: normalizeCodename(codename),
      schoolId,
      createdAt,
    }
  } catch {
    return null
  }
}

function readVaultRaw(): VaultV1 | null {
  try {
    const raw = localStorage.getItem(NINJA_VAULT_KEY)
    if (!raw) return null
    const data = JSON.parse(raw) as unknown
    if (!data || typeof data !== 'object') return null
    const v = (data as Record<string, unknown>).v
    if (v !== 1) return null
    const profilesRaw = (data as Record<string, unknown>).profiles
    if (!Array.isArray(profilesRaw)) return null
    const profiles: NinjaProfileRecord[] = []
    for (const row of profilesRaw) {
      if (!row || typeof row !== 'object') continue
      const r = row as Record<string, unknown>
      const id = typeof r.id === 'string' ? r.id : ''
      if (!id) continue
      const rec = parseProfileRecord(r, id)
      if (rec) profiles.push(rec)
    }
    const rawActive = (data as Record<string, unknown>).activeId
    let activeId: string | null = typeof rawActive === 'string' ? rawActive : null
    if (activeId && !profiles.some((p) => p.id === activeId)) activeId = profiles[0]?.id ?? null
    return { v: 1, profiles, activeId }
  } catch {
    return null
  }
}

function persistVault(vault: VaultV1): void {
  const active = vault.activeId ? vault.profiles.find((p) => p.id === vault.activeId) : null
  try {
    localStorage.setItem(NINJA_VAULT_KEY, JSON.stringify(vault))
    localStorage.setItem(PERSONA_STORAGE_KEY, active?.schoolId ?? 'ed-ryu')
    try {
      localStorage.removeItem(NINJA_PROFILE_STORAGE_KEY)
    } catch {
      /* ignore */
    }
    notifyNinjaProfileChanged()
  } catch {
    /* ignore */
  }
}

function createDefaultAnonymousRecord(): NinjaProfileRecord {
  return {
    id: generateProfileId(),
    codename: DEFAULT_NINJA_CODENAME,
    schoolId: 'ed-ryu',
    createdAt: new Date().toISOString(),
  }
}

/** If the vault has no profiles, persist a default Anonymous session (Ed-ryū). */
function seedVaultIfEmpty(vault: VaultV1): VaultV1 {
  if (vault.profiles.length > 0) return vault
  const rec = createDefaultAnonymousRecord()
  const next: VaultV1 = { v: 1, profiles: [rec], activeId: rec.id }
  persistVault(next)
  return next
}

function ensureVault(): VaultV1 {
  const existing = readVaultRaw()
  if (existing) {
    return seedVaultIfEmpty(existing)
  }

  const legacy = readLegacySingleProfile()
  if (legacy) {
    const id = generateProfileId()
    const vault: VaultV1 = {
      v: 1,
      profiles: [{ ...legacy, id }],
      activeId: id,
    }
    persistVault(vault)
    return vault
  }

  return seedVaultIfEmpty({ v: 1, profiles: [], activeId: null })
}

/** All stored profiles (browser only). */
export function listNinjaProfileRecords(): readonly NinjaProfileRecord[] {
  return ensureVault().profiles
}

/** Active session profile id, or null when signed out. */
export function readActiveNinjaProfileId(): string | null {
  return ensureVault().activeId
}

/** Switch active profile (signed in). */
export function setActiveNinjaProfile(id: string): boolean {
  const vault = ensureVault()
  if (!vault.profiles.some((p) => p.id === id)) return false
  persistVault({ ...vault, activeId: id })
  return true
}

/** End session without deleting saved profiles. */
export function signOutNinjaSession(): void {
  const vault = ensureVault()
  persistVault({ ...vault, activeId: null })
}

/** Remove the active profile from the vault; activate another if any remain. */
export function clearNinjaProfile(): void {
  const vault = ensureVault()
  if (!vault.activeId) {
    persistVault({ v: 1, profiles: [], activeId: null })
    return
  }
  const profiles = vault.profiles.filter((p) => p.id !== vault.activeId)
  const activeId = profiles[0]?.id ?? null
  persistVault({ v: 1, profiles, activeId })
}

export function readNinjaProfile(): NinjaProfile | null {
  const vault = ensureVault()
  if (!vault.activeId) return null
  const rec = vault.profiles.find((p) => p.id === vault.activeId)
  if (!rec) return null
  const { id: _id, ...rest } = rec
  return rest
}

export function writeNinjaProfile(profile: NinjaProfile): void {
  const vault = ensureVault()
  if (!vault.activeId) return
  const idx = vault.profiles.findIndex((p) => p.id === vault.activeId)
  if (idx < 0) return
  const normalized: NinjaProfile = {
    codename: normalizeCodename(profile.codename),
    schoolId: migrateLegacySchoolId(profile.schoolId),
    createdAt: profile.createdAt,
  }
  if (!isValidSchoolId(normalized.schoolId)) return
  const next = [...vault.profiles]
  next[idx] = { ...normalized, id: vault.activeId }
  persistVault({ ...vault, profiles: next })
}

export function patchNinjaProfileSchool(schoolId: string): void {
  const p = readNinjaProfile()
  const resolved = migrateLegacySchoolId(schoolId)
  if (!p || !isValidSchoolId(resolved)) return
  writeNinjaProfile({ ...p, schoolId: resolved })
}

export function createOrUpdateNinjaProfile(codename: string, schoolId: string): NinjaProfile {
  const vault = ensureVault()
  const resolvedSchool = migrateLegacySchoolId(schoolId)
  if (!isValidSchoolId(resolvedSchool)) {
    const cur = readNinjaProfile()
    if (cur) return cur
    return appendNinjaProfile(codename, 'ed-ryu')
  }

  if (vault.activeId) {
    const cur = vault.profiles.find((p) => p.id === vault.activeId)
    const profile: NinjaProfile = {
      codename: normalizeCodename(codename),
      schoolId: resolvedSchool,
      createdAt: cur?.createdAt ?? new Date().toISOString(),
    }
    writeNinjaProfile(profile)
    return profile
  }

  return appendNinjaProfile(codename, schoolId)
}

/** Add a new profile and make it active (does not remove existing vault entries). */
export function appendNinjaProfile(codename: string, schoolId: string): NinjaProfile {
  const vault = ensureVault()
  const resolvedSchool = migrateLegacySchoolId(schoolId)
  const school = isValidSchoolId(resolvedSchool) ? resolvedSchool : 'ed-ryu'
  const id = generateProfileId()
  const rec: NinjaProfileRecord = {
    id,
    codename: normalizeCodename(codename),
    schoolId: school,
    createdAt: new Date().toISOString(),
  }
  persistVault({
    v: 1,
    profiles: [...vault.profiles, rec],
    activeId: id,
  })
  const { id: _i, ...out } = rec
  return out
}
