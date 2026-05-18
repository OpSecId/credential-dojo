/** Structural VC/VP inspection heuristics (no cryptographic verification). */

export type InspectMode = "enbu" | "menkyo";
export type InspectLevel = "ok" | "warn" | "error";
export type RequestProtocol = "oid4vp" | "didcomm" | "chapi" | "custom";

function typeList(o: Record<string, unknown>): string[] {
  const t = o.type;
  if (Array.isArray(t)) return t.filter((x): x is string => typeof x === "string");
  if (typeof t === "string") return [t];
  return [];
}

function isVpShaped(o: Record<string, unknown>): boolean {
  const types = typeList(o);
  if (types.includes("VerifiablePresentation")) return true;
  const vc = o.verifiableCredential;
  if (Array.isArray(vc) && vc.length > 0) return true;
  return false;
}

function isVcShaped(o: Record<string, unknown>): boolean {
  const types = typeList(o);
  if (types.includes("VerifiableCredential")) return true;
  if (o["@context"] !== undefined && (o.issuer !== undefined || o.credentialSubject !== undefined)) {
    return true;
  }
  return false;
}

function asProofArray(v: unknown): Record<string, unknown>[] {
  if (v && typeof v === "object" && !Array.isArray(v)) return [v as Record<string, unknown>];
  if (Array.isArray(v)) return v.filter((x): x is Record<string, unknown> => !!x && typeof x === "object");
  return [];
}

function isJwtLike(v: unknown): boolean {
  if (typeof v !== "string") return false;
  const parts = v.split(".");
  return parts.length === 3 && parts.every((p) => p.length > 0);
}

function pushIssue(
  bucket: { errors: string[]; warnings: string[]; passes: string[] },
  level: InspectLevel,
  line: string,
) {
  if (level === "error") bucket.errors.push(line);
  else if (level === "warn") bucket.warnings.push(line);
  else bucket.passes.push(line);
}

function checkValidityWindows(
  o: Record<string, unknown>,
  bucket: { errors: string[]; warnings: string[]; passes: string[] },
) {
  const now = Date.now();
  const parse = (v: unknown) => (typeof v === "string" ? Date.parse(v) : NaN);
  const validFrom = parse(o.validFrom ?? o.issuanceDate);
  const validUntil = parse(o.validUntil ?? o.expirationDate);
  if (o.validFrom !== undefined || o.issuanceDate !== undefined) {
    if (Number.isNaN(validFrom)) pushIssue(bucket, "error", "Invalid validity start timestamp.");
    else if (validFrom > now) pushIssue(bucket, "warn", "Credential validity start is in the future.");
    else pushIssue(bucket, "ok", "Validity start timestamp parses correctly.");
  }
  if (o.validUntil !== undefined || o.expirationDate !== undefined) {
    if (Number.isNaN(validUntil)) pushIssue(bucket, "error", "Invalid validity end timestamp.");
    else if (validUntil < now) pushIssue(bucket, "warn", "Credential appears expired by validity end timestamp.");
    else pushIssue(bucket, "ok", "Validity end timestamp parses correctly.");
  }
}

function checkCredentialSchema(
  o: Record<string, unknown>,
  bucket: { errors: string[]; warnings: string[]; passes: string[] },
) {
  const schema = o.credentialSchema;
  if (schema === undefined) {
    pushIssue(bucket, "warn", "No credentialSchema property found (optional but recommended for shape contracts).");
    return;
  }
  const schemas = Array.isArray(schema) ? schema : [schema];
  let anyInvalid = false;
  for (const s of schemas) {
    if (!s || typeof s !== "object" || Array.isArray(s)) {
      anyInvalid = true;
      continue;
    }
    const so = s as Record<string, unknown>;
    if (typeof so.id !== "string" || typeof so.type !== "string") {
      anyInvalid = true;
    }
  }
  if (anyInvalid) {
    pushIssue(
      bucket,
      "error",
      "credentialSchema exists but does not match expected object shape (`id` + `type` strings).",
    );
  } else {
    pushIssue(bucket, "ok", "credentialSchema shape looks valid (`id` and `type` present).");
  }
}

function checkProofs(
  label: string,
  value: unknown,
  bucket: { errors: string[]; warnings: string[]; passes: string[] },
) {
  const proofs = asProofArray(value);
  if (proofs.length === 0) {
    pushIssue(bucket, "warn", `${label}: no object proof found.`);
    return;
  }
  proofs.forEach((p, i) => {
    const idx = proofs.length > 1 ? ` #${i + 1}` : "";
    const hasType = typeof p.type === "string";
    const hasVm = typeof p.verificationMethod === "string";
    const hasPurpose = typeof p.proofPurpose === "string";
    const hasSig =
      typeof p.proofValue === "string" ||
      typeof p.jws === "string" ||
      typeof p.signatureValue === "string";
    if (!hasType) pushIssue(bucket, "error", `${label}${idx}: missing proof.type.`);
    if (!hasVm) pushIssue(bucket, "warn", `${label}${idx}: missing verificationMethod.`);
    if (!hasPurpose) pushIssue(bucket, "warn", `${label}${idx}: missing proofPurpose.`);
    if (!hasSig) pushIssue(bucket, "error", `${label}${idx}: missing signature payload (proofValue / jws / signatureValue).`);
    if (typeof p.created === "string") {
      const t = Date.parse(p.created);
      if (Number.isNaN(t)) pushIssue(bucket, "warn", `${label}${idx}: invalid created timestamp.`);
      else pushIssue(bucket, "ok", `${label}${idx}: created timestamp parses.`);
    }
    if (hasType && hasSig) pushIssue(bucket, "ok", `${label}${idx}: proof carries type + signature material.`);
  });
}

export function inspectJson(parsed: unknown, mode: InspectMode): { level: InspectLevel; lines: string[] } {
  const bucket = { errors: [] as string[], warnings: [] as string[], passes: [] as string[] };
  if (parsed === null || typeof parsed !== "object" || Array.isArray(parsed)) {
    return { level: "error", lines: ["Expected a single JSON object (not an array or primitive)."] };
  }
  const o = parsed as Record<string, unknown>;
  const vp = isVpShaped(o);
  const vc = isVcShaped(o);

  if (mode === "menkyo") {
    if (vp && !vc) {
      bucket.warnings.push(
        "This looks like a verifiable presentation (Enbu): switch to Enbu の Kensa, or paste one object from verifiableCredential.",
      );
      return { level: "warn", lines: bucket.warnings };
    }
    if (vc) {
      pushIssue(
        bucket,
        "ok",
        "Structural cues match a VC-shaped object (VerifiableCredential type or @context + issuer/credentialSubject).",
      );
      checkCredentialSchema(o, bucket);
      checkValidityWindows(o, bucket);
      if (isJwtLike(o.proof)) {
        pushIssue(bucket, "ok", "Proof appears JWT-like (compact JWS).");
      } else {
        checkProofs("Credential proof", o.proof, bucket);
      }
    } else {
      pushIssue(bucket, "warn", "No strong VC heuristics — JSON is still valid for manual review.");
    }
    const level: InspectLevel = bucket.errors.length ? "error" : bucket.warnings.length ? "warn" : "ok";
    return { level, lines: [...bucket.errors, ...bucket.warnings, ...bucket.passes] };
  }

  if (vc && !vp) {
    bucket.warnings.push(
      "This looks like a lone credential (Menkyo). Presentation (Enbu) payloads usually declare VerifiablePresentation or include `verifiableCredential`.",
    );
    return { level: "warn", lines: bucket.warnings };
  }
  if (vp) {
    pushIssue(
      bucket,
      "ok",
      "Structural cues match a VP-shaped object (VerifiablePresentation or verifiableCredential array).",
    );
    checkProofs("Presentation proof", o.proof, bucket);
    const vcArray = Array.isArray(o.verifiableCredential) ? o.verifiableCredential : [];
    vcArray.forEach((item, i) => {
      const name = `Embedded credential #${i + 1}`;
      if (typeof item === "string") {
        if (isJwtLike(item)) pushIssue(bucket, "ok", `${name}: JWT-like VC token.`);
        else pushIssue(bucket, "warn", `${name}: string VC is not JWT-like compact format.`);
        return;
      }
      if (item && typeof item === "object" && !Array.isArray(item)) {
        const c = item as Record<string, unknown>;
        checkCredentialSchema(c, bucket);
        checkValidityWindows(c, bucket);
        checkProofs(`${name} proof`, c.proof, bucket);
      } else {
        pushIssue(bucket, "warn", `${name}: unexpected entry type in verifiableCredential array.`);
      }
    });
  } else {
    pushIssue(bucket, "warn", "No strong VP heuristics — JSON is still valid for manual review.");
  }
  const level: InspectLevel = bucket.errors.length ? "error" : bucket.warnings.length ? "warn" : "ok";
  return { level, lines: [...bucket.errors, ...bucket.warnings, ...bucket.passes] };
}

export function inspectPresentationRequest(
  parsed: unknown,
  protocol: RequestProtocol,
): { level: InspectLevel; lines: string[] } {
  const bucket = { errors: [] as string[], warnings: [] as string[], passes: [] as string[] };
  if (parsed === null || typeof parsed !== "object" || Array.isArray(parsed)) {
    return { level: "error", lines: ["Expected a request JSON object (not an array or primitive)."] };
  }
  const o = parsed as Record<string, unknown>;
  const hasChallenge = typeof o.challenge === "string" || typeof o.nonce === "string";
  const hasDomain = typeof o.domain === "string" || typeof o.audience === "string" || typeof o.client_id === "string";

  if (hasChallenge) pushIssue(bucket, "ok", "Request has challenge/nonce material.");
  else pushIssue(bucket, "warn", "No challenge/nonce found in request payload.");
  if (hasDomain) pushIssue(bucket, "ok", "Request includes verifier domain/audience/client context.");
  else pushIssue(bucket, "warn", "No verifier domain/audience/client context found.");

  if (protocol === "oid4vp") {
    const hasDef = o.presentation_definition !== undefined || o.dcql_query !== undefined;
    if (hasDef) pushIssue(bucket, "ok", "OID4VP request definition found (presentation_definition or dcql_query).");
    else pushIssue(bucket, "error", "OID4VP request missing presentation_definition / dcql_query.");
  } else if (protocol === "didcomm") {
    const type = typeof o.type === "string" ? o.type.toLowerCase() : "";
    const hasBody = o.body && typeof o.body === "object" && !Array.isArray(o.body);
    if (type.includes("request-presentation") || type.includes("present-proof")) {
      pushIssue(bucket, "ok", "DIDComm request type indicates presentation request flow.");
    } else {
      pushIssue(bucket, "warn", "DIDComm type does not clearly indicate request-presentation.");
    }
    if (hasBody) pushIssue(bucket, "ok", "DIDComm message body present.");
    else pushIssue(bucket, "warn", "DIDComm request body missing or invalid.");
  } else if (protocol === "chapi") {
    const hasQuery = Array.isArray(o.query) || Array.isArray(o.acceptedQuery);
    if (hasQuery) pushIssue(bucket, "ok", "CHAPI-style query array detected.");
    else pushIssue(bucket, "warn", "CHAPI request usually includes query/acceptedQuery arrays.");
  } else {
    const hasIntent = typeof o.purpose === "string" || typeof o.intent === "string";
    if (hasIntent) pushIssue(bucket, "ok", "Custom request includes intent/purpose.");
    else pushIssue(bucket, "warn", "Custom request has no explicit intent/purpose field.");
  }

  const level: InspectLevel = bucket.errors.length ? "error" : bucket.warnings.length ? "warn" : "ok";
  return { level, lines: [...bucket.errors, ...bucket.warnings, ...bucket.passes] };
}
