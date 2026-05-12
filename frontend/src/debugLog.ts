/**
 * Verbose `console.log` when either:
 * - `VITE_DEBUG=true` at build time (e.g. in `.env` / `.env.local`), or
 * - In the browser: `localStorage.setItem('credential-dojo-debug', '1')` then reload (no rebuild).
 */

export function isDebugEnabled(): boolean {
  if (import.meta.env.VITE_DEBUG === "true") return true
  try {
    if (typeof localStorage !== "undefined" && localStorage.getItem("credential-dojo-debug") === "1") return true
  } catch {
    /* private mode / SSR */
  }
  return false
}

export function debugLog(...args: unknown[]): void {
  if (!isDebugEnabled()) return
  console.log("[Credential Dojo]", ...args)
}
