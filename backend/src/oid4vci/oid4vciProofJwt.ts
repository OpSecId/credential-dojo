/**
 * OID4VCI 1.0 key proof JWT (Appendix F.1) for credential requests — ACA-Py / OpenWallet expect
 * typ "openid4vci-proof+jwt", aud = credential issuer id, nonce = c_nonce from token or nonce endpoint.
 */

import { getPublicKey, hashes as edHashes, sign, utils as edUtils } from "@noble/ed25519"
import { p256 } from "@noble/curves/nist.js"
import { sha256, sha512 } from "@noble/hashes/sha2.js"

edHashes.sha512 = sha512

export type Oid4vciProofAlg = "EdDSA" | "ES256"

const PROOF_TYP = "openid4vci-proof+jwt"

function b64urlJson(obj: unknown): string {
  return Buffer.from(JSON.stringify(obj), "utf8").toString("base64url")
}

function b64urlBytes(b: Uint8Array): string {
  return Buffer.from(b).toString("base64url")
}

export function cNonceFromTokenResponse(tr: unknown): string | null {
  if (!tr || typeof tr !== "object" || Array.isArray(tr)) return null
  const n = (tr as Record<string, unknown>).c_nonce
  return typeof n === "string" && n.length > 0 ? n : null
}

function proofTypesJwtMeta(
  issuerMetadata: Record<string, unknown>,
  configurationId: string,
): { proofSigningAlgValuesSupported?: string[] } | null {
  const supported = issuerMetadata.credential_configurations_supported
  if (!supported || typeof supported !== "object" || Array.isArray(supported)) return null
  const cfg = (supported as Record<string, unknown>)[configurationId]
  if (!cfg || typeof cfg !== "object" || Array.isArray(cfg)) return null
  const pts = (cfg as Record<string, unknown>).proof_types_supported
  if (!pts || typeof pts !== "object" || Array.isArray(pts)) return null
  const jwtBlock = (pts as Record<string, unknown>).jwt
  if (!jwtBlock || typeof jwtBlock !== "object" || Array.isArray(jwtBlock)) return null
  const algs = (jwtBlock as Record<string, unknown>).proof_signing_alg_values_supported
  if (!Array.isArray(algs)) return {}
  const out: string[] = []
  for (const a of algs) {
    if (typeof a === "string") out.push(a)
  }
  return { proofSigningAlgValuesSupported: out }
}

/** Prefer ES256 when listed (common for ACA-Py demos), then EdDSA. */
export function pickProofAlg(
  issuerMetadata: Record<string, unknown>,
  configurationId: string,
): Oid4vciProofAlg {
  const meta = proofTypesJwtMeta(issuerMetadata, configurationId)
  const algs = meta?.proofSigningAlgValuesSupported ?? []
  for (const a of algs) {
    if (a === "ES256") return "ES256"
  }
  for (const a of algs) {
    if (a === "EdDSA") return "EdDSA"
  }
  return "ES256"
}

function ed25519JwkFromPublicKey(pub32: Uint8Array): { kty: string; crv: string; x: string } {
  return { kty: "OKP", crv: "Ed25519", x: b64urlBytes(pub32) }
}

function p256JwkFromUncompressed(pub65: Uint8Array): { kty: string; crv: string; x: string; y: string } {
  if (pub65.length !== 65 || pub65[0] !== 4) {
    throw new Error("Expected uncompressed P-256 public key (0x04 + 32 + 32 bytes)")
  }
  return {
    kty: "EC",
    crv: "P-256",
    x: b64urlBytes(pub65.subarray(1, 33)),
    y: b64urlBytes(pub65.subarray(33, 65)),
  }
}

export function buildOid4vciProofJwt(params: {
  alg: Oid4vciProofAlg
  credentialIssuerId: string
  cNonce: string
  nowSeconds?: number
}): string {
  const iat = params.nowSeconds ?? Math.floor(Date.now() / 1000)
  const payload = {
    aud: params.credentialIssuerId,
    iat,
    nonce: params.cNonce,
  }

  if (params.alg === "EdDSA") {
    const secretKey = edUtils.randomSecretKey()
    const publicKey = getPublicKey(secretKey)
    const header = {
      alg: "EdDSA",
      typ: PROOF_TYP,
      jwk: ed25519JwkFromPublicKey(publicKey),
    }
    const signingInput = `${b64urlJson(header)}.${b64urlJson(payload)}`
    const sig = sign(new TextEncoder().encode(signingInput), secretKey)
    return `${signingInput}.${b64urlBytes(sig)}`
  }

  const { secretKey } = p256.keygen()
  const uncompressed = p256.getPublicKey(secretKey, false)
  const header = {
    alg: "ES256",
    typ: PROOF_TYP,
    jwk: p256JwkFromUncompressed(uncompressed),
  }
  const signingInput = `${b64urlJson(header)}.${b64urlJson(payload)}`
  const hash = sha256(new TextEncoder().encode(signingInput))
  const sig = p256.sign(hash, secretKey, { prehash: false })
  return `${signingInput}.${b64urlBytes(sig)}`
}
