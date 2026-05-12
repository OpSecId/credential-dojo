/**
 * Client-side parsing of OID4VCI credential-offer entry points.
 * Supports:
 * - `openid-credential-offer://?credential_offer=...` (URL-encoded JSON)
 * - `https?://...?credential_offer=...` or `credential_offer_uri=...`
 * - Raw JSON object pasted directly (treated as an inline offer payload).
 *
 * Does not perform issuance; fetch of `credential_offer_uri` is opt-in from the UI.
 */

export type Oid4vciParseSuccess = {
  kind: 'success'
  /** URL protocol (no colon), or `direct-json` when pasted JSON */
  sourceScheme: string
  queryParamKeys: string[]
  credentialOfferJson: unknown | null
  /** Decoded `credential_offer_uri` when present */
  credentialOfferUri: string | null
  notes: string[]
}

export type Oid4vciParseFailure = {
  kind: 'error'
  message: string
  detail?: string
}

export type Oid4vciParseResult = Oid4vciParseSuccess | Oid4vciParseFailure

const ALLOWED_SCHEMES = new Set(['https', 'http', 'openid-credential-offer'])

function structuralNotes(offer: unknown): string[] {
  const notes: string[] = []
  if (offer === null || typeof offer !== 'object' || Array.isArray(offer)) {
    notes.push('Credential offer is not a JSON object.')
    return notes
  }
  const o = offer as Record<string, unknown>
  if (typeof o.credential_issuer !== 'string' || !o.credential_issuer.trim()) {
    notes.push('Missing or empty string field `credential_issuer` (expected issuer base URL).')
  }
  const ids = o.credential_configuration_ids
  if (ids !== undefined && !Array.isArray(ids)) {
    notes.push('Field `credential_configuration_ids` should be an array when present.')
  }
  if (Array.isArray(ids) && ids.length === 0) {
    notes.push('`credential_configuration_ids` is an empty array.')
  }
  return notes
}

export function parseOid4vciCredentialOfferInput(raw: string): Oid4vciParseResult {
  const t = raw.trim()
  if (!t) {
    return { kind: 'error', message: 'Paste an OID4VCI offer URI or raw credential-offer JSON.' }
  }

  if (t.startsWith('{')) {
    try {
      const obj = JSON.parse(t) as unknown
      const notes = ['Interpreted as raw JSON (not a URI).', ...structuralNotes(obj)]
      return {
        kind: 'success',
        sourceScheme: 'direct-json',
        queryParamKeys: [],
        credentialOfferJson: obj,
        credentialOfferUri: null,
        notes,
      }
    } catch (e) {
      return {
        kind: 'error',
        message: 'Input looks like JSON but failed to parse.',
        detail: e instanceof Error ? e.message : String(e),
      }
    }
  }

  let url: URL
  try {
    url = new URL(t)
  } catch {
    return {
      kind: 'error',
      message: 'Could not parse as a URL.',
      detail:
        'Use openid-credential-offer://… or https://… with credential_offer or credential_offer_uri query parameters, or paste the credential offer JSON object.',
    }
  }

  const scheme = url.protocol.replace(/:$/, '').toLowerCase()
  if (!ALLOWED_SCHEMES.has(scheme)) {
    return {
      kind: 'error',
      message: `Unsupported URI scheme “${scheme}”.`,
      detail: 'Expected openid-credential-offer, https, or http.',
    }
  }

  const queryParamKeys = [...url.searchParams.keys()]
  const offerParam = url.searchParams.get('credential_offer')
  const offerUriParam = url.searchParams.get('credential_offer_uri')

  if (!offerParam && !offerUriParam) {
    return {
      kind: 'error',
      message: 'No credential_offer or credential_offer_uri query parameter found.',
      detail: `Query keys present: ${queryParamKeys.length ? queryParamKeys.join(', ') : '(none)'}`,
    }
  }

  const notes: string[] = []
  let credentialOfferJson: unknown | null = null

  if (offerParam && offerUriParam) {
    notes.push('Both credential_offer and credential_offer_uri are present; using inline credential_offer per OID4VCI.')
  }

  if (offerParam) {
    try {
      credentialOfferJson = JSON.parse(offerParam) as unknown
    } catch (e) {
      return {
        kind: 'error',
        message: 'credential_offer query parameter is not valid JSON.',
        detail: e instanceof Error ? e.message : String(e),
      }
    }
    notes.push(...structuralNotes(credentialOfferJson))
  } else {
    notes.push('Only credential_offer_uri is set; use “Fetch offer JSON” to retrieve the offer (may fail due to CORS).')
  }

  let credentialOfferUri: string | null = null
  if (offerUriParam) {
    try {
      credentialOfferUri = new URL(offerUriParam).toString()
    } catch {
      notes.push('credential_offer_uri is present but is not a valid absolute URL after decoding.')
    }
  }

  return {
    kind: 'success',
    sourceScheme: scheme,
    queryParamKeys,
    credentialOfferJson,
    credentialOfferUri,
    notes,
  }
}
