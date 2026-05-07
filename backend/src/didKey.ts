import { varint } from "multiformats";
import { base58btc } from "multiformats/bases/base58";

/** Multicodec table values (https://github.com/multiformats/multicodec/blob/master/table.csv). */
export const MULTICODEC = {
  ED25519_PUB: 0xed,
  P256_PUB: 0x1200,
  BLS12_381_G2_PUB: 0xeb,
  /** ML-DSA-44 public key (FIPS 204); multicodec table `mldsa-44-pub`. */
  ML_DSA_44_PUB: 0x1210,
} as const;

/**
 * `did:key` using multicodec prefix + raw public key bytes, multibase base58-btc (`z…`).
 */
export function encodeDidKey(multicodec: number, publicKeyBytes: Uint8Array): string {
  const prefixLen = varint.encodingLength(multicodec);
  const buf = new Uint8Array(prefixLen + publicKeyBytes.length);
  varint.encodeTo(multicodec, buf, 0);
  buf.set(publicKeyBytes, prefixLen);
  return `did:key:${base58btc.encode(buf)}`;
}
