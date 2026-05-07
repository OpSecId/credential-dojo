import * as ed from "@noble/ed25519";
import { ml_dsa44 } from "@noble/post-quantum/ml-dsa.js";
import { bls12_381 } from "@noble/curves/bls12-381.js";
import { p256 } from "@noble/curves/nist.js";
import { sha256, sha512 } from "@noble/hashes/sha2.js";
import { encodeDidKey, MULTICODEC } from "./didKey.js";

ed.hashes.sha512 = sha512;

const DEMO_PERSONA_DOMAIN = "credential-dojo:demo-persona:v1";

function deriveDigest(label: string, personaId: string): Uint8Array {
  const input = new TextEncoder().encode(`${DEMO_PERSONA_DOMAIN}:${personaId}:${label}`);
  return sha256(input);
}

/** Noble BLS / P-256 keygen expects a fixed-width high-entropy seed (48 bytes). */
function deriveSeed48(personaId: string, label: string): Uint8Array {
  const input = new TextEncoder().encode(`${DEMO_PERSONA_DOMAIN}:${personaId}:${label}`);
  return sha512(input).subarray(0, 48);
}

export type ProofSchool = "ed25519" | "ecdsa" | "bbs" | "mldsa" | "anoncreds";

export type PersonaPublic = {
  id: string;
  label: string;
  labelJa: string;
  description: string;
  proofSchool: ProofSchool;
  didKey: string;
  /** Kata (cryptosuite) strings in preferred order for this school. */
  kataSamples: readonly string[];
};

/** Full demo carousel vocabulary (personas pick focused subsets). */
const ALL_KATA = [
  "eddsa-rdfc-2022",
  "eddsa-jcs-2022",
  "ecdsa-rdfc-2019",
  "ecdsa-jcs-2019",
  "ecdsa-sd-2023",
  "bbs-2023",
  "vc-jwt",
  "mldsa44-rdfc-2024",
  "mldsa44-jcs-2024",
  "anoncreds-2023",
] as const;

function buildPersona(persona: {
  id: string;
  label: string;
  labelJa: string;
  description: string;
  proofSchool: ProofSchool;
  kataSamples: readonly string[];
  didKey: string;
}): PersonaPublic {
  return {
    id: persona.id,
    label: persona.label,
    labelJa: persona.labelJa,
    description: persona.description,
    proofSchool: persona.proofSchool,
    didKey: persona.didKey,
    kataSamples: persona.kataSamples,
  };
}

function edPersona(): PersonaPublic {
  const id = "ed-ryu";
  const secretKey = deriveDigest("ed25519-sk", id);
  const publicKey = ed.getPublicKey(secretKey);
  const didKey = encodeDidKey(MULTICODEC.ED25519_PUB, publicKey);
  return buildPersona({
    id,
    label: "Ed-ryū",
    labelJa: "エド流",
    description:
      "Ed25519 issuer. Kata: eddsa-rdfc-2022, eddsa-jcs-2022, vc-jwt.",
    proofSchool: "ed25519",
    didKey,
    kataSamples: [ALL_KATA[0], ALL_KATA[1], ALL_KATA[6]],
  });
}

function ecPersona(): PersonaPublic {
  const id = "ec-ryu";
  const { publicKey } = p256.keygen(deriveSeed48(id, "p256-seed"));
  const didKey = encodeDidKey(MULTICODEC.P256_PUB, publicKey);
  return buildPersona({
    id,
    label: "Ec-ryū",
    labelJa: "エック流",
    description:
      "NIST P-256 / ECDSA issuer (classic Data Integrity). Kata: ecdsa-rdfc-2019, ecdsa-jcs-2019.",
    proofSchool: "ecdsa",
    didKey,
    kataSamples: [ALL_KATA[2], ALL_KATA[3]],
  });
}

function ecSdPersona(): PersonaPublic {
  const id = "ec-sd-ryu";
  const { publicKey } = p256.keygen(deriveSeed48(id, "p256-seed"));
  const didKey = encodeDidKey(MULTICODEC.P256_PUB, publicKey);
  return buildPersona({
    id,
    label: "Ec-sd-ryū",
    labelJa: "エックSD流",
    description:
      "NIST P-256 / ECDSA issuer (selective disclosure; key distinct from Ec-ryū). Kata: ecdsa-sd-2023.",
    proofSchool: "ecdsa",
    didKey,
    kataSamples: [ALL_KATA[4]],
  });
}

function bbsPersona(): PersonaPublic {
  const id = "bbs-ryu";
  const bls = bls12_381.shortSignatures;
  const { publicKey } = bls.keygen(deriveSeed48(id, "bls12-fr-seed"));
  const publicKeyBytes = publicKey.toBytes(true);
  const didKey = encodeDidKey(MULTICODEC.BLS12_381_G2_PUB, publicKeyBytes);
  return buildPersona({
    id,
    label: "BBS-ryū",
    labelJa: "ビービーエス流",
    description:
      "BLS12-381 BBS issuer (public key on G2 per did:key). Kata: bbs-2023.",
    proofSchool: "bbs",
    didKey,
    kataSamples: [ALL_KATA[5]],
  });
}

function mlDsaPersona(): PersonaPublic {
  const id = "ml-ryu";
  const seed = deriveDigest("mldsa44-seed", id);
  const { publicKey } = ml_dsa44.keygen(seed);
  const didKey = encodeDidKey(MULTICODEC.ML_DSA_44_PUB, publicKey);
  return buildPersona({
    id,
    label: "ML-ryū",
    labelJa: "エムエル流",
    description:
      "ML-DSA-44 issuer (FIPS 204 Data Integrity). Kata: mldsa44-rdfc-2024, mldsa44-jcs-2024.",
    proofSchool: "mldsa",
    didKey,
    kataSamples: [ALL_KATA[7], ALL_KATA[8]],
  });
}

function clPersona(): PersonaPublic {
  const id = "cl-ryu";
  const secretKey = deriveDigest("ed25519-sk", id);
  const publicKey = ed.getPublicKey(secretKey);
  const didKey = encodeDidKey(MULTICODEC.ED25519_PUB, publicKey);
  return buildPersona({
    id,
    label: "CL-ryū",
    labelJa: "シーエル流",
    description:
      "Ed25519 issuer (AnonCreds-style CL / Data Integrity). Kata: anoncreds-2023.",
    proofSchool: "anoncreds",
    didKey,
    kataSamples: [ALL_KATA[9]],
  });
}

let cached: readonly PersonaPublic[] | undefined;

export function listDemoPersonas(): readonly PersonaPublic[] {
  if (!cached) {
    cached = [
      edPersona(),
      ecPersona(),
      ecSdPersona(),
      bbsPersona(),
      clPersona(),
      mlDsaPersona(),
    ];
  }
  return cached;
}
