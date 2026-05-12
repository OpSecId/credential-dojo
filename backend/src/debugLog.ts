/** Verbose logging when `CREDENTIAL_DOJO_DEBUG=1` or `DEBUG` lists `credential-dojo`. Never log secrets. */

import fs from "node:fs"
import { inspect } from "node:util"

/** Host log pipelines (Railway, Docker) often buffer or drop huge single writes; cap debug lines. */
const DEBUG_LOG_LINE_MAX = 28_000

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

function formatDebugArg(arg: unknown): string {
  if (typeof arg === "string") return arg
  return inspect(arg, {
    depth: 8,
    maxArrayLength: 40,
    maxStringLength: 2_500,
    breakLength: 100,
    colors: false,
  })
}

/**
 * Writes synchronously to stdout when possible so lines show up immediately under Docker /
 * Railway (non-TTY). Very large payloads are capped so aggregators do not drop the whole line.
 */
export function debugLog(...args: unknown[]): void {
  if (!isDebugEnabled()) return
  const body = args.map(formatDebugArg).join(" ")
  let line = `[credential-dojo:debug] ${body}`
  if (line.length > DEBUG_LOG_LINE_MAX) {
    line =
      `${line.slice(0, DEBUG_LOG_LINE_MAX)}\n… [debug log line truncated to ${DEBUG_LOG_LINE_MAX} chars; full OID4VCI step details remain in the JSON response]\n`
  } else {
    line += "\n"
  }
  try {
    const fd = process.stdout.fd
    if (typeof fd === "number" && fd >= 0) {
      fs.writeSync(fd, line)
      return
    }
  } catch {
    /* fall through */
  }
  process.stdout.write(line)
}
