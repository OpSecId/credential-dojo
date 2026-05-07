import { DEMO_PERSONAS_OFFLINE } from './demoPersonas'

/** Same key as Home persona tabs — kept in sync when a ninja profile exists. */
export const PERSONA_STORAGE_KEY = 'credential-dojo-persona'

export const NINJA_PROFILE_STORAGE_KEY = 'credential-dojo-ninja-profile'

export type NinjaProfile = {
  codename: string
  schoolId: string
  createdAt: string
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
  return cut.length > 0 ? cut : 'Anonymous ninja'
}

export function readNinjaProfile(): NinjaProfile | null {
  try {
    const raw = localStorage.getItem(NINJA_PROFILE_STORAGE_KEY)
    if (!raw) return null
    const data = JSON.parse(raw) as unknown
    if (!data || typeof data !== 'object') return null
    const o = data as Record<string, unknown>
    const codename = typeof o.codename === 'string' ? o.codename : ''
    const schoolIdRaw = typeof o.schoolId === 'string' ? o.schoolId : ''
    const schoolId = migrateLegacySchoolId(schoolIdRaw)
    const createdAt = typeof o.createdAt === 'string' ? o.createdAt : ''
    if (!isValidSchoolId(schoolId) || !createdAt) return null
    const profile: NinjaProfile = {
      codename: normalizeCodename(codename),
      schoolId,
      createdAt,
    }
    if (schoolId !== schoolIdRaw) {
      try {
        localStorage.setItem(NINJA_PROFILE_STORAGE_KEY, JSON.stringify(profile))
        localStorage.setItem(PERSONA_STORAGE_KEY, schoolId)
      } catch {
        /* ignore */
      }
    }
    return profile
  } catch {
    return null
  }
}

export function writeNinjaProfile(profile: NinjaProfile): void {
  const normalized: NinjaProfile = {
    codename: normalizeCodename(profile.codename),
    schoolId: migrateLegacySchoolId(profile.schoolId),
    createdAt: profile.createdAt,
  }
  if (!isValidSchoolId(normalized.schoolId)) return
  try {
    localStorage.setItem(NINJA_PROFILE_STORAGE_KEY, JSON.stringify(normalized))
    localStorage.setItem(PERSONA_STORAGE_KEY, normalized.schoolId)
  } catch {
    /* ignore */
  }
}

export function clearNinjaProfile(): void {
  try {
    localStorage.removeItem(NINJA_PROFILE_STORAGE_KEY)
    localStorage.setItem(PERSONA_STORAGE_KEY, 'ed-ryu')
  } catch {
    /* ignore */
  }
}

/** When the holder switches school on the home dojo, keep the saved profile aligned. */
export function patchNinjaProfileSchool(schoolId: string): void {
  const p = readNinjaProfile()
  const resolved = migrateLegacySchoolId(schoolId)
  if (!p || !isValidSchoolId(resolved)) return
  writeNinjaProfile({ ...p, schoolId: resolved })
}

export function createOrUpdateNinjaProfile(codename: string, schoolId: string): NinjaProfile {
  const existing = readNinjaProfile()
  const resolvedSchool = migrateLegacySchoolId(schoolId)
  const profile: NinjaProfile = {
    codename: normalizeCodename(codename),
    schoolId: resolvedSchool,
    createdAt: existing?.createdAt ?? new Date().toISOString(),
  }
  writeNinjaProfile(profile)
  return profile
}
