/**
 * Platform root POST /api — exactly one operation key per request.
 * Keys map to actions: issue, verify VC, sign VP, verify VP.
 */

import type { DojoIssuanceConfigure } from './issueVerifyDemoVc'
import type { InspectLevel, RequestProtocol } from './kensa/kensaInspect'

export type PlatformOperation =
  | 'credential'
  | 'verifiableCredential'
  | 'presentation'
  | 'verifiablePresentation'

export function apiBase(): string {
  return import.meta.env.VITE_API_BASE ?? ''
}

export type IssueCredentialRequest = {
  personaId?: string
  templateId?: string
  operatorCodename?: string
  credentialId?: string
  configure?: DojoIssuanceConfigure
}

export type InspectResult = {
  level: InspectLevel
  lines: string[]
  note?: string
}

type PlatformError = { ok: false; error: string }

type PlatformOk = { ok: true; operation: PlatformOperation; note?: string }

function rootPostBody(
  operation: PlatformOperation,
  payload: unknown,
  options?: { requestProtocol?: RequestProtocol },
): Record<string, unknown> {
  const body: Record<string, unknown> = { [operation]: payload }
  if (options?.requestProtocol) {
    body.requestProtocol = options.requestProtocol
  }
  return body
}

async function postPlatformRoot(
  operation: PlatformOperation,
  payload: unknown,
  options?: { requestProtocol?: RequestProtocol },
): Promise<(PlatformOk & Record<string, unknown>) | PlatformError> {
  const base = apiBase()
  try {
    const res = await fetch(`${base}/api`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(rootPostBody(operation, payload, options)),
    })
    const json = (await res.json()) as { ok?: boolean; error?: string; operation?: PlatformOperation }
    if (!res.ok || !json.ok) {
      return { ok: false, error: json.error ?? `Request failed (${res.status})` }
    }
    return json as PlatformOk & Record<string, unknown>
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : 'Network error' }
  }
}

/** Issue demo Menkyo — body key `credential`. */
export async function platformIssueCredential(
  request: IssueCredentialRequest,
): Promise<
  | { ok: true; verifiableCredential: Record<string, unknown>; note?: string }
  | PlatformError
> {
  const out = await postPlatformRoot('credential', request)
  if (!out.ok) return out
  const vc = out.verifiableCredential
  if (!vc || typeof vc !== 'object' || Array.isArray(vc)) {
    return { ok: false, error: 'API response missing verifiableCredential.' }
  }
  return {
    ok: true,
    verifiableCredential: vc as Record<string, unknown>,
    note: typeof out.note === 'string' ? out.note : undefined,
  }
}

/** Menkyo の Kensa — body key `verifiableCredential`. */
export async function platformVerifyCredential(
  document: unknown,
): Promise<({ ok: true } & InspectResult) | PlatformError> {
  const out = await postPlatformRoot('verifiableCredential', document)
  if (!out.ok) return out
  return {
    ok: true,
    level: out.level as InspectLevel,
    lines: Array.isArray(out.lines) ? (out.lines as string[]) : [],
    note: typeof out.note === 'string' ? out.note : undefined,
  }
}

/** Sign demo VP — body key `presentation`. */
export async function platformSignPresentation(
  request: Record<string, unknown>,
): Promise<
  | { ok: true; verifiablePresentation: Record<string, unknown>; note?: string }
  | PlatformError
> {
  const out = await postPlatformRoot('presentation', request)
  if (!out.ok) return out
  const vp = out.verifiablePresentation
  if (!vp || typeof vp !== 'object' || Array.isArray(vp)) {
    return { ok: false, error: 'API response missing verifiablePresentation.' }
  }
  return {
    ok: true,
    verifiablePresentation: vp as Record<string, unknown>,
    note: typeof out.note === 'string' ? out.note : undefined,
  }
}

/** Enbu の Kensa — body key `verifiablePresentation` (VP or Shōkan request). */
export async function platformVerifyPresentation(
  document: unknown,
  requestProtocol?: RequestProtocol,
): Promise<({ ok: true } & InspectResult) | PlatformError> {
  const out = await postPlatformRoot('verifiablePresentation', document, { requestProtocol })
  if (!out.ok) return out
  return {
    ok: true,
    level: out.level as InspectLevel,
    lines: Array.isArray(out.lines) ? (out.lines as string[]) : [],
    note: typeof out.note === 'string' ? out.note : undefined,
  }
}

/** Kensa UI mode → platform verify operation key. */
export function verifyOperationForKensaMode(
  mode: 'menkyo' | 'enbu',
): 'verifiableCredential' | 'verifiablePresentation' {
  return mode === 'menkyo' ? 'verifiableCredential' : 'verifiablePresentation'
}
