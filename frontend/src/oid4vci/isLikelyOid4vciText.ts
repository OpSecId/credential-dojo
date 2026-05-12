/** Heuristic: QR / pasted text is probably an OID4VCI entry point we can parse on Kinchaku · OID4VCI. */
export function isLikelyOid4vciText(raw: string): boolean {
  const t = raw.trim()
  if (!t) return false
  if (t.startsWith('{')) return true
  if (t.toLowerCase().startsWith('openid-credential-offer:')) return true
  try {
    const u = new URL(t)
    if (u.searchParams.has('credential_offer') || u.searchParams.has('credential_offer_uri')) return true
  } catch {
    /* not a URL */
  }
  return false
}
