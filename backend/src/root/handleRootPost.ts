import type { Request, Response } from "express";
import { debugLog } from "../debugLog.js";
import { issueCredentialFromRequest } from "../issuance/demoCredential.js";
import { signDemoPresentation } from "../issuance/signPresentation.js";
import {
  inspectJson,
  inspectPresentationRequest,
  type InspectLevel,
  type RequestProtocol,
} from "../kensa/kensaInspect.js";
import { normalizeKensaInspectRequest, runKensaInspect } from "../kensa/handleInspect.js";

export type RootOperation =
  | "credential"
  | "verifiableCredential"
  | "presentation"
  | "verifiablePresentation";

const OPERATION_KEYS: readonly RootOperation[] = [
  "credential",
  "verifiableCredential",
  "presentation",
  "verifiablePresentation",
];

const REQUEST_PROTOCOLS = new Set<RequestProtocol>(["oid4vp", "didcomm", "chapi", "custom"]);

export type ParsedRootPost =
  | { ok: true; operation: RootOperation; payload: unknown; requestProtocol?: RequestProtocol }
  | { ok: false; error: string };

export function parseRootPostBody(body: unknown): ParsedRootPost {
  if (body === null || typeof body !== "object" || Array.isArray(body)) {
    return { ok: false, error: "Expected a JSON object request body." };
  }

  const o = body as Record<string, unknown>;
  const present = OPERATION_KEYS.filter((key) => o[key] !== undefined);

  if (present.length > 1) {
    return {
      ok: false,
      error: `Use exactly one operation key: ${OPERATION_KEYS.join(", ")}.`,
    };
  }

  if (present.length === 1) {
    const operation = present[0]!;
    const requestProtocol = o.requestProtocol;
    if (
      requestProtocol !== undefined &&
      (typeof requestProtocol !== "string" || !REQUEST_PROTOCOLS.has(requestProtocol as RequestProtocol))
    ) {
      return {
        ok: false,
        error: '"requestProtocol" must be one of: oid4vp, didcomm, chapi, custom.',
      };
    }
    return {
      ok: true,
      operation,
      payload: o[operation],
      requestProtocol: requestProtocol as RequestProtocol | undefined,
    };
  }

  return {
    ok: false,
    error: `Request body must include exactly one of: ${OPERATION_KEYS.join(", ")}.`,
  };
}

function inspectVerifyCredential(document: unknown): { level: InspectLevel; lines: string[] } {
  return inspectJson(document, "menkyo");
}

function inspectVerifyPresentation(
  document: unknown,
  requestProtocol?: RequestProtocol,
): { level: InspectLevel; lines: string[] } {
  if (document !== null && typeof document === "object" && !Array.isArray(document)) {
    const o = document as Record<string, unknown>;
    const looksLikeRequest =
      o.presentation_definition !== undefined ||
      o.dcql_query !== undefined ||
      (typeof o.type === "string" && o.type.toLowerCase().includes("request-presentation"));
    if (looksLikeRequest) {
      return inspectPresentationRequest(document, requestProtocol ?? "oid4vp");
    }
  }
  return inspectJson(document, "enbu");
}

export function handleRootPost(req: Request, res: Response): void {
  const t0 = Date.now();
  debugLog("POST / (root): begin");

  const parsed = parseRootPostBody(req.body);
  if (!parsed.ok) {
    const legacy = normalizeKensaInspectRequest(req.body);
    if (legacy.ok) {
      const result = runKensaInspect(legacy.request, legacy.document);
      debugLog("POST / (root): legacy kensa inspect", { ms: Date.now() - t0, mode: legacy.request.mode });
      res.status(200).json({
        ok: true,
        operation: legacy.request.mode === "menkyo" ? "verifiableCredential" : "verifiablePresentation",
        level: result.level,
        lines: result.lines,
        mode: legacy.request.mode,
        artifact: legacy.request.artifact,
        requestProtocol: legacy.request.requestProtocol,
        note: "Structural heuristics only — no cryptographic verification.",
      });
      return;
    }
    debugLog("POST / (root): invalid body", { error: parsed.error, ms: Date.now() - t0 });
    res.status(422).json({ ok: false, error: parsed.error, operation: null });
    return;
  }

  const { operation, payload } = parsed;
  const requestProtocol = parsed.requestProtocol;

  if (operation === "credential") {
    const issued = issueCredentialFromRequest(payload);
    if (!issued.ok) {
      res.status(422).json({ ok: false, error: issued.error, operation });
      return;
    }
    debugLog("POST / (root): issue credential", { ms: Date.now() - t0 });
    res.status(200).json({
      ok: true,
      operation,
      verifiableCredential: issued.verifiableCredential,
      note: "Demo issuance — proof value is not real cryptography.",
    });
    return;
  }

  if (operation === "presentation") {
    const signed = signDemoPresentation(payload);
    if (!signed.ok) {
      res.status(422).json({ ok: false, error: signed.error, operation });
      return;
    }
    debugLog("POST / (root): sign presentation", { ms: Date.now() - t0 });
    res.status(200).json({
      ok: true,
      operation,
      verifiablePresentation: signed.verifiablePresentation,
      note: "Demo presentation signature — proof value is not real cryptography.",
    });
    return;
  }

  if (operation === "verifiableCredential") {
    const result = inspectVerifyCredential(payload);
    debugLog("POST / (root): verify credential", {
      ms: Date.now() - t0,
      level: result.level,
    });
    res.status(200).json({
      ok: true,
      operation,
      level: result.level,
      lines: result.lines,
      note: "Structural heuristics only — no cryptographic verification.",
    });
    return;
  }

  const result = inspectVerifyPresentation(payload, requestProtocol);
  debugLog("POST / (root): verify presentation", { ms: Date.now() - t0, level: result.level });
  res.status(200).json({
    ok: true,
    operation,
    level: result.level,
    lines: result.lines,
    requestProtocol: requestProtocol ?? "oid4vp",
    note: "Structural heuristics only — no cryptographic verification.",
  });
}

/** @deprecated Use handleRootPost — kept as alias for imports. */
export const handleKensaInspectPost = handleRootPost;
