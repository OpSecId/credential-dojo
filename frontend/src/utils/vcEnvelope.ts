import { appendPointer } from './jsonPointer'

/** Canonical top-level Verifiable Credential properties (v1.1 + v2 overlap), display order. */
export type VcRootSlot = {
  key: string
  label: string
  blurb: string
  /** Shown more prominently when missing */
  core?: boolean
}

export const VC_ROOT_SLOTS: readonly VcRootSlot[] = [
  {
    key: '@context',
    label: '@context',
    blurb: 'JSON-LD context(s): vocabulary URLs that define terms used in this credential.',
    core: true,
  },
  {
    key: 'id',
    label: 'id',
    blurb: 'Optional URI that identifies this credential (not the subject).',
    core: true,
  },
  {
    key: 'type',
    label: 'type',
    blurb: 'Credential types; must include VerifiableCredential (or enveloped variant).',
    core: true,
  },
  {
    key: 'issuer',
    label: 'issuer',
    blurb: 'Issuer DID, URI, or object with id — who attests to the claims.',
    core: true,
  },
  {
    key: 'name',
    label: 'name',
    blurb: 'Human-readable credential title.',
  },
  {
    key: 'description',
    label: 'description',
    blurb: 'Short summary of what this credential represents.',
  },
  {
    key: 'validFrom',
    label: 'validFrom',
    blurb: 'VC 2.0: earliest instant the credential is valid (ISO 8601).',
  },
  {
    key: 'validUntil',
    label: 'validUntil',
    blurb: 'VC 2.0: expiry instant (ISO 8601).',
  },
  {
    key: 'issuanceDate',
    label: 'issuanceDate',
    blurb: 'VC 1.x: when the credential was issued (ISO 8601).',
  },
  {
    key: 'expirationDate',
    label: 'expirationDate',
    blurb: 'VC 1.x: optional expiry (ISO 8601).',
  },
  {
    key: 'credentialSubject',
    label: 'credentialSubject',
    blurb: 'Claims about the subject — the holder or entity this credential describes.',
    core: true,
  },
  {
    key: 'credentialStatus',
    label: 'credentialStatus',
    blurb: 'Revocation or suspension metadata (e.g. status list).',
  },
  {
    key: 'credentialSchema',
    label: 'credentialSchema',
    blurb: 'Optional schema hints for validating the credential shape.',
  },
  {
    key: 'evidence',
    label: 'evidence',
    blurb: 'Supporting evidence documents or references.',
  },
  {
    key: 'termsOfUse',
    label: 'termsOfUse',
    blurb: 'Policies governing use of this credential.',
  },
  {
    key: 'renderMethod',
    label: 'renderMethod',
    blurb: 'How to render the credential for display.',
  },
  {
    key: 'refreshService',
    label: 'refreshService',
    blurb: 'How to refresh an expiring credential (VC 1.x).',
  },
  {
    key: 'related',
    label: 'related',
    blurb: 'Related resources (VC 2.0).',
  },
  {
    key: 'holder',
    label: 'holder',
    blurb: 'Intended holder when distinct from subject (VC 2.0).',
  },
  {
    key: 'proof',
    label: 'proof',
    blurb: 'Data Integrity proof (or use JWT envelope instead of this property).',
    core: true,
  },
]

export function vcRootPointer(key: string): string {
  return appendPointer('', key)
}

/** True when the JSON object looks like a VC-shaped document (structure rail + blurbs). */
export function looksLikeVerifiableCredential(v: unknown): v is Record<string, unknown> {
  if (v === null || typeof v !== 'object' || Array.isArray(v)) return false
  const o = v as Record<string, unknown>
  return (
    'credentialSubject' in o &&
    ('@context' in o || 'type' in o || 'issuer' in o || 'proof' in o)
  )
}

export function rootHasKey(root: Record<string, unknown>, key: string): boolean {
  return Object.prototype.hasOwnProperty.call(root, key)
}

/** Pointer → explanation for standard VC top-level keys (merge into explainByPointer). */
export const VC_ROOT_EXPLAIN: Record<string, string> = Object.fromEntries(
  VC_ROOT_SLOTS.map((s) => [vcRootPointer(s.key), s.blurb]),
)
