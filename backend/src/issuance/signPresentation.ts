import { randomUUID } from "node:crypto";
import {
  ISSUE_VERIFY_DEMO_HOLDER_DID,
  VC_DEMO_CONTEXTS,
} from "./constants.js";

export type SignPresentationRequest = {
  holderDid?: string;
  /** One or more credentials to embed in the VP. */
  verifiableCredential?: unknown;
  /** Alias for verifiableCredential when passing an array. */
  credentials?: unknown;
  challenge?: string;
  domain?: string;
};

function isoUtcNoMs(d: Date = new Date()): string {
  return d.toISOString().replace(/\.\d{3}Z$/, "Z");
}

function normalizeCredentials(input: unknown): unknown[] {
  if (input === undefined || input === null) return [];
  if (Array.isArray(input)) return input;
  return [input];
}

export function signDemoPresentation(
  body: unknown,
): { ok: true; verifiablePresentation: Record<string, unknown> } | { ok: false; error: string } {
  const params =
    body !== null && typeof body === "object" && !Array.isArray(body)
      ? (body as SignPresentationRequest)
      : {};

  const holderDid =
    typeof params.holderDid === "string" && params.holderDid.trim()
      ? params.holderDid.trim()
      : ISSUE_VERIFY_DEMO_HOLDER_DID;

  const embedded = normalizeCredentials(params.verifiableCredential ?? params.credentials);
  if (embedded.length === 0) {
    return {
      ok: false,
      error:
        'Provide at least one credential under "verifiableCredential" (object or array) when signing a presentation.',
    };
  }

  const isoNow = isoUtcNoMs();
  const holderVm = holderDid.includes("#") ? holderDid : `${holderDid}#key-1`;

  const verifiablePresentation: Record<string, unknown> = {
    "@context": [...VC_DEMO_CONTEXTS],
    id: `urn:uuid:${randomUUID()}`,
    type: ["VerifiablePresentation"],
    holder: holderDid,
    verifiableCredential: embedded,
    proof: {
      type: "DataIntegrityProof",
      cryptosuite: "eddsa-rdfc-2022",
      verificationMethod: holderVm,
      proofPurpose: "authentication",
      proofValue: "z58DEMODOJOPLACEHOLDERHOLDERPRESENTATIONSIGNATURE",
      created: isoNow,
    },
  };

  if (typeof params.challenge === "string" && params.challenge.trim()) {
    verifiablePresentation.challenge = params.challenge.trim();
  }
  if (typeof params.domain === "string" && params.domain.trim()) {
    verifiablePresentation.domain = params.domain.trim();
  }

  return { ok: true, verifiablePresentation };
}
