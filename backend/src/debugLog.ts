/** Verbose `console.log` when `CREDENTIAL_DOJO_DEBUG=1` or `DEBUG` lists `credential-dojo`. Never log secrets. */

export function isDebugEnabled(): boolean {
  if (process.env.CREDENTIAL_DOJO_DEBUG === "1") return true
  const d = process.env.DEBUG ?? ""
  return d.split(/[\s,]+/).includes("credential-dojo")
}

/** Issuer HTTP bodies (errors) in steps + logs: short when debug is off, long when on. */
const BODY_CLIP_NORMAL = 8_000
const BODY_CLIP_DEBUG = 512_000

export function maxIssuerResponseBodyChars(): number {
  return isDebugEnabled() ? BODY_CLIP_DEBUG : BODY_CLIP_NORMAL
}

/** Truncate issuer error/response text for JSON steps and UI; full(er) when debug is on. */
export function clipIssuerResponseBody(s: string): string {
  const max = maxIssuerResponseBodyChars()
  if (s.length <= max) return s
  return `${s.slice(0, max)}\n… [truncated ${s.length - max} chars; CREDENTIAL_DOJO_DEBUG=1 allows up to ${BODY_CLIP_DEBUG}]`
}

export function debugLog(...args: unknown[]): void {
  if (!isDebugEnabled()) return
  console.log("[credential-dojo:debug]", ...args)
}
