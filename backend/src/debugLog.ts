/** Verbose `console.log` when `CREDENTIAL_DOJO_DEBUG=1` or `DEBUG` lists `credential-dojo`. Never log secrets. */

function isDebugEnabled(): boolean {
  if (process.env.CREDENTIAL_DOJO_DEBUG === "1") return true
  const d = process.env.DEBUG ?? ""
  return d.split(/[\s,]+/).includes("credential-dojo")
}

export function debugLog(...args: unknown[]): void {
  if (!isDebugEnabled()) return
  console.log("[credential-dojo:debug]", ...args)
}
