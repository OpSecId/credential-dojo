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
      "Demo school for Ed25519-based Data Integrity suites (e.g. eddsa-rdfc-2022, eddsa-jcs-2022).",
    proofSchool: "ed25519",
    didKey,
    kataSamples: [
      ALL_KATA[0],
      ALL_KATA[1],
      ALL_KATA[6],
      ALL_KATA[2],
      ALL_KATA[3],
      ALL_KATA[4],
      ALL_KATA[5],
      ALL_KATA[7],
      ALL_KATA[8],
      ALL_KATA[9],
    ],
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
      "Demo school for NIST P-256 / ECDSA classic Data Integrity: RFC canonicalization (ecdsa-rdfc-2019) and JSON canonicalization (ecdsa-jcs-2019).",
    proofSchool: "ecdsa",
    didKey,
    kataSamples: [ALL_KATA[2], ALL_KATA[3]],
  });
}

function sdPersona(): PersonaPublic {
  const id = "sd-ryu";
  const { publicKey } = p256.keygen(deriveSeed48(id, "p256-seed"));
  const didKey = encodeDidKey(MULTICODEC.P256_PUB, publicKey);
  return buildPersona({
    id,
    label: "Ec-ryū (SD)",
    labelJa: "エック流（SD）",
    description:
      "Ec-ryū selective-disclosure track (ecdsa-sd-2023): same P-256 family as classic Ec-ryū, separate deterministic issuer key for SD-focused flows.",
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
      "Demo school for BLS12-381 / BBS unlinkable proofs — kata locked to bbs-2023. Issuer key is encoded on G2 per did:key conventions.",
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
      "Demo school for FIPS 204 ML-DSA-44 Data Integrity (mldsa44-rdfc-2024, mldsa44-jcs-2024). Issuer public key uses multicodec mldsa-44-pub in did:key.",
    proofSchool: "mldsa",
    didKey,
    kataSamples: [ALL_KATA[7], ALL_KATA[8]],
  });
}

function anoncredsPersona(): PersonaPublic {
  const id = "anoncreds-ryu";
  const secretKey = deriveDigest("ed25519-sk", id);
  const publicKey = ed.getPublicKey(secretKey);
  const didKey = encodeDidKey(MULTICODEC.ED25519_PUB, publicKey);
  return buildPersona({
    id,
    label: "AnonCreds-ryū",
    labelJa: "アノンクレッズ流",
    description:
      "Demo school for the AnonCreds Data Integrity cryptosuite (anoncreds-2023): issuer material uses Ed25519 in did:key, aligned with common Hyperledger AnonCreds stacks.",
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
      sdPersona(),
      bbsPersona(),
      anoncredsPersona(),
      mlDsaPersona(),
    ];
  }
  return cached;
}
