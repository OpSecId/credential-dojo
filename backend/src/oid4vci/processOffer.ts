/**
 * OID4VCI demo processor — runs on the server to avoid browser CORS.
 * Supports credential offers with `credential_issuer` and optional
 * `urn:ietf:params:oauth:grant-type:pre-authorized_code` grants when
 * `token_endpoint` and `credential_endpoint` can be discovered.
 */

const FETCH_TIMEOUT_MS = 25_000

export type Oid4vciStep = {
  id: string
  ok: boolean
  detail?: string
  url?: string
}

export type Oid4vciProcessOk = {
  ok: true
  steps: Oid4vciStep[]
  credentialOffer: unknown
  credentialIssuer: string
  issuerMetadata: unknown | null
  tokenResponse: unknown | null
  credentialResponse: unknown | null
}

export type Oid4vciProcessErr = {
  ok: false
  steps: Oid4vciStep[]
  error: string
  detail?: string
}

export type Oid4vciProcessResult = Oid4vciProcessOk | Oid4vciProcessErr

type OfferBody = {
  credentialOfferUri?: string
  credentialOffer?: unknown
}

function push(steps: Oid4vciStep[], step: Oid4vciStep) {
  steps.push(step)
}

function assertHttpsIssuerUrl(raw: string): URL {
  const u = new URL(raw)
  if (u.protocol !== "https:") {
    throw new Error(`credential_issuer must use https (got ${u.protocol})`)
  }
  const host = u.hostname.toLowerCase()
  if (
    host === "localhost" ||
    host === "127.0.0.1" ||
    host === "0.0.0.0" ||
    host.endsWith(".local") ||
    host === "::1"
  ) {
    throw new Error("credential_issuer host is not allowed for this demo proxy")
  }
  if (/^(10\.|192\.168\.|172\.(1[6-9]|2\d|3[0-1])\.)/.test(host) || host.startsWith("169.254.")) {
    throw new Error("credential_issuer resolves to a private / link-local host — blocked")
  }
  return u
}

function assertHttpsFetchUrl(raw: string): URL {
  const u = new URL(raw)
  if (u.protocol !== "https:") throw new Error(`Only https URLs can be fetched (got ${u.protocol})`)
  assertHttpsIssuerUrl(raw)
  return u
}

async function fetchWithTimeout(
  url: string,
  init: RequestInit & { timeoutMs?: number } = {},
): Promise<{ res: Response; text: string }> {
  const { timeoutMs = FETCH_TIMEOUT_MS, ...rest } = init
  const ac = new AbortController()
  const t = setTimeout(() => ac.abort(), timeoutMs)
  try {
    const res = await fetch(url, { ...rest, signal: ac.signal })
    const text = await res.text()
    return { res, text }
  } finally {
    clearTimeout(t)
  }
}

function* issuerMetadataCandidateUrls(credentialIssuer: string): Generator<string> {
  const base = credentialIssuer.replace(/\/+$/, "")
  let path = base
  for (;;) {
    yield `${path}/.well-known/openid-credential-issuer`
    const slash = path.lastIndexOf("/")
    const originSlash = base.indexOf("/", base.indexOf("//") + 2)
    if (slash <= originSlash) break
    path = path.slice(0, slash)
  }
}

async function discoverIssuerMetadata(credentialIssuer: string, steps: Oid4vciStep[]): Promise<unknown | null> {
  assertHttpsIssuerUrl(credentialIssuer)
  for (const metaUrl of issuerMetadataCandidateUrls(credentialIssuer)) {
    try {
      const { res, text } = await fetchWithTimeout(metaUrl, {
        headers: { Accept: "application/json" },
      })
      if (!res.ok) continue
      let json: unknown
      try {
        json = JSON.parse(text) as unknown
      } catch {
        continue
      }
      push(steps, { id: "issuer_metadata", ok: true, url: metaUrl, detail: `HTTP ${res.status}` })
      return json
    } catch {
      /* try next */
    }
  }
  push(steps, {
    id: "issuer_metadata",
    ok: false,
    detail: "No openid-credential-issuer metadata document found along issuer path",
  })
  return null
}

async function discoverTokenEndpoint(
  issuerMetadata: Record<string, unknown>,
  credentialIssuer: string,
  steps: Oid4vciStep[],
): Promise<string | null> {
  const direct = issuerMetadata.token_endpoint
  if (typeof direct === "string" && direct.startsWith("https://")) {
    push(steps, { id: "token_endpoint", ok: true, url: direct, detail: "from credential issuer metadata" })
    return direct
  }
  const servers = issuerMetadata.authorization_servers
  if (!Array.isArray(servers)) return null
  for (const s of servers) {
    if (typeof s !== "string" || !s.startsWith("https://")) continue
    const asUrl = `${s.replace(/\/+$/, "")}/.well-known/oauth-authorization-server`
    try {
      const { res, text } = await fetchWithTimeout(asUrl, { headers: { Accept: "application/json" } })
      if (!res.ok) continue
      const doc = JSON.parse(text) as Record<string, unknown>
      const te = doc.token_endpoint
      if (typeof te === "string" && te.startsWith("https://")) {
        push(steps, { id: "token_endpoint", ok: true, url: te, detail: `via ${asUrl}` })
        return te
      }
    } catch {
      /* next */
    }
  }
  push(steps, { id: "token_endpoint", ok: false, detail: "Not found in issuer or authorization server metadata" })
  return null
}

function readPreAuthorizedCode(offer: Record<string, unknown>): {
  code: string
  txCode?: string
} | null {
  const grants = grantsRecord(offer)
  if (!grants) return null
  const block = grants["urn:ietf:params:oauth:grant-type:pre-authorized_code"]
  if (!block || typeof block !== "object" || Array.isArray(block)) return null
  const b = block as Record<string, unknown>
  const code = (b["pre-authorized_code"] ?? b["pre_authorized_code"]) as unknown
  if (typeof code !== "string" || !code.trim()) return null
  const tx = b.tx_code
  return { code: code.trim(), txCode: typeof tx === "string" ? tx : undefined }
}

function grantsRecord(offer: Record<string, unknown>): Record<string, unknown> | null {
  const g = offer.grants
  if (!g || typeof g !== "object" || Array.isArray(g)) return null
  return g as Record<string, unknown>
}

async function exchangePreAuthorizedCode(
  tokenEndpoint: string,
  preAuthorizedCode: string,
  txCode: string | undefined,
  steps: Oid4vciStep[],
): Promise<unknown | null> {
  const body = new URLSearchParams({
    grant_type: "urn:ietf:params:oauth:grant-type:pre-authorized_code",
    "pre-authorized_code": preAuthorizedCode,
  })
  if (txCode) body.set("tx_code", txCode)
  try {
    const { res, text } = await fetchWithTimeout(tokenEndpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        Accept: "application/json",
      },
      body: body.toString(),
    })
    let json: unknown
    try {
      json = JSON.parse(text) as unknown
    } catch {
      json = null
    }
    if (!res.ok) {
      push(steps, {
        id: "token_exchange",
        ok: false,
        url: tokenEndpoint,
        detail: `HTTP ${res.status}: ${text.slice(0, 400)}`,
      })
      return null
    }
    push(steps, { id: "token_exchange", ok: true, url: tokenEndpoint, detail: `HTTP ${res.status}` })
    return json
  } catch (e) {
    push(steps, {
      id: "token_exchange",
      ok: false,
      url: tokenEndpoint,
      detail: e instanceof Error ? e.message : String(e),
    })
    return null
  }
}

function accessTokenFromTokenResponse(tr: unknown): string | null {
  if (!tr || typeof tr !== "object" || Array.isArray(tr)) return null
  const t = (tr as Record<string, unknown>).access_token
  return typeof t === "string" && t.length > 0 ? t : null
}

async function requestCredential(
  credentialEndpoint: string,
  accessToken: string,
  configurationId: string,
  formatHint: string | undefined,
  steps: Oid4vciStep[],
): Promise<unknown | null> {
  const body: Record<string, unknown> = { credential_configuration_id: configurationId }
  if (formatHint) body.format = formatHint
  try {
    const { res, text } = await fetchWithTimeout(credentialEndpoint, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify(body),
    })
    let json: unknown
    try {
      json = JSON.parse(text) as unknown
    } catch {
      json = { raw: text }
    }
    if (!res.ok) {
      push(steps, {
        id: "credential_request",
        ok: false,
        url: credentialEndpoint,
        detail: `HTTP ${res.status}: ${typeof json === "object" ? JSON.stringify(json).slice(0, 500) : text.slice(0, 500)}`,
      })
      return null
    }
    push(steps, { id: "credential_request", ok: true, url: credentialEndpoint, detail: `HTTP ${res.status}` })
    return json
  } catch (e) {
    push(steps, {
      id: "credential_request",
      ok: false,
      url: credentialEndpoint,
      detail: e instanceof Error ? e.message : String(e),
    })
    return null
  }
}

function firstConfigurationId(offer: Record<string, unknown>): string | null {
  const ids = offer.credential_configuration_ids
  if (!Array.isArray(ids) || !ids.length) return null
  const first = ids[0]
  return typeof first === "string" ? first : null
}

function formatForConfiguration(
  issuerMetadata: Record<string, unknown>,
  configurationId: string,
): string | undefined {
  const supported = issuerMetadata.credential_configurations_supported
  if (!supported || typeof supported !== "object" || Array.isArray(supported)) return undefined
  const cfg = (supported as Record<string, unknown>)[configurationId]
  if (!cfg || typeof cfg !== "object" || Array.isArray(cfg)) return undefined
  const fmt = (cfg as Record<string, unknown>).format
  return typeof fmt === "string" ? fmt : undefined
}

export async function processOid4vciOfferBody(body: unknown): Promise<Oid4vciProcessResult> {
  const steps: Oid4vciStep[] = []
  if (!body || typeof body !== "object" || Array.isArray(body)) {
    return { ok: false, steps, error: "Expected JSON object body" }
  }
  const b = body as OfferBody
  let offer: unknown = b.credentialOffer ?? null

  if (!offer && b.credentialOfferUri) {
    try {
      assertHttpsFetchUrl(b.credentialOfferUri)
    } catch (e) {
      return {
        ok: false,
        steps,
        error: "Invalid credentialOfferUri",
        detail: e instanceof Error ? e.message : String(e),
      }
    }
    try {
      const { res, text } = await fetchWithTimeout(b.credentialOfferUri, {
        headers: { Accept: "application/json, */*" },
      })
      if (!res.ok) {
        push(steps, {
          id: "fetch_offer",
          ok: false,
          url: b.credentialOfferUri,
          detail: `HTTP ${res.status}: ${text.slice(0, 400)}`,
        })
        return { ok: false, steps, error: "Failed to fetch credential offer", detail: text.slice(0, 200) }
      }
      offer = JSON.parse(text) as unknown
      push(steps, { id: "fetch_offer", ok: true, url: b.credentialOfferUri, detail: `HTTP ${res.status}` })
    } catch (e) {
      push(steps, {
        id: "fetch_offer",
        ok: false,
        url: b.credentialOfferUri,
        detail: e instanceof Error ? e.message : String(e),
      })
      return { ok: false, steps, error: "Failed to fetch or parse credential offer" }
    }
  }

  if (!offer || typeof offer !== "object" || Array.isArray(offer)) {
    return { ok: false, steps, error: "Provide credentialOffer (object) and/or credentialOfferUri (https)" }
  }

  const offerObj = offer as Record<string, unknown>
  const issuerRaw = offerObj.credential_issuer
  if (typeof issuerRaw !== "string" || !issuerRaw.trim()) {
    return { ok: false, steps, error: "credential_offer must include string credential_issuer" }
  }
  const credentialIssuer = issuerRaw.trim()
  try {
    assertHttpsIssuerUrl(credentialIssuer)
  } catch (e) {
    return {
      ok: false,
      steps,
      error: "credential_issuer URL not allowed",
      detail: e instanceof Error ? e.message : String(e),
    }
  }

  const issuerMetadata = await discoverIssuerMetadata(credentialIssuer, steps)
  if (!issuerMetadata || typeof issuerMetadata !== "object" || Array.isArray(issuerMetadata)) {
    return {
      ok: false,
      steps,
      error: "Could not load credential issuer metadata",
      detail: "Issuer may use a non-standard layout; check steps.",
    }
  }
  const meta = issuerMetadata as Record<string, unknown>

  const credentialEndpointRaw = meta.credential_endpoint
  let credentialEndpoint: string | null = null
  if (typeof credentialEndpointRaw === "string" && credentialEndpointRaw.startsWith("https://")) {
    credentialEndpoint = credentialEndpointRaw
    push(steps, { id: "credential_endpoint", ok: true, url: credentialEndpoint })
  } else {
    push(steps, {
      id: "credential_endpoint",
      ok: false,
      detail: "credential_endpoint missing or not https in issuer metadata",
    })
  }

  const pre = readPreAuthorizedCode(offerObj)
  if (!pre) {
    push(steps, {
      id: "pre_authorized_code",
      ok: false,
      detail: "No pre-authorized_code grant in offer — cannot exchange for access token from this demo",
    })
    return {
      ok: true,
      steps,
      credentialOffer: offer,
      credentialIssuer,
      issuerMetadata,
      tokenResponse: null,
      credentialResponse: null,
    }
  }
  push(steps, { id: "pre_authorized_code", ok: true, detail: "Found urn:ietf:params:oauth:grant-type:pre-authorized_code" })

  const tokenEndpoint = await discoverTokenEndpoint(meta, credentialIssuer, steps)
  if (!tokenEndpoint) {
    return {
      ok: true,
      steps,
      credentialOffer: offer,
      credentialIssuer,
      issuerMetadata,
      tokenResponse: null,
      credentialResponse: null,
    }
  }

  const tokenResponse = await exchangePreAuthorizedCode(tokenEndpoint, pre.code, pre.txCode, steps)
  const accessToken = accessTokenFromTokenResponse(tokenResponse)
  if (!accessToken) {
    return {
      ok: true,
      steps,
      credentialOffer: offer,
      credentialIssuer,
      issuerMetadata,
      tokenResponse,
      credentialResponse: null,
    }
  }

  const cfgId = firstConfigurationId(offerObj)
  if (!cfgId) {
    push(steps, { id: "credential_configuration_ids", ok: false, detail: "offer missing credential_configuration_ids" })
    return {
      ok: true,
      steps,
      credentialOffer: offer,
      credentialIssuer,
      issuerMetadata,
      tokenResponse,
      credentialResponse: null,
    }
  }

  if (!credentialEndpoint) {
    return {
      ok: true,
      steps,
      credentialOffer: offer,
      credentialIssuer,
      issuerMetadata,
      tokenResponse,
      credentialResponse: null,
    }
  }

  const formatHint = formatForConfiguration(meta, cfgId)
  const credentialResponse = await requestCredential(
    credentialEndpoint,
    accessToken,
    cfgId,
    formatHint,
    steps,
  )

  return {
    ok: true,
    steps,
    credentialOffer: offer,
    credentialIssuer,
    issuerMetadata,
    tokenResponse,
    credentialResponse,
  }
}
