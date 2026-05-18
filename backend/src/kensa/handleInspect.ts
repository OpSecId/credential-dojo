import type { Request, Response } from "express";
import { debugLog } from "../debugLog.js";
import {
  inspectJson,
  inspectPresentationRequest,
  type InspectLevel,
  type InspectMode,
  type RequestProtocol,
} from "./kensaInspect.js";

export type EnbuArtifact = "response" | "request";

export type KensaInspectRequest = {
  mode: InspectMode;
  artifact?: EnbuArtifact;
  requestProtocol?: RequestProtocol;
  document?: unknown;
};

const CONTROL_KEYS = new Set([
  "mode",
  "artifact",
  "requestProtocol",
  "document",
  "json",
  "payload",
]);

const REQUEST_PROTOCOLS = new Set<RequestProtocol>(["oid4vp", "didcomm", "chapi", "custom"]);

export function normalizeKensaInspectRequest(
  body: unknown,
):
  | { ok: true; request: KensaInspectRequest; document: unknown }
  | { ok: false; error: string } {
  if (body === null || typeof body !== "object" || Array.isArray(body)) {
    return { ok: false, error: "Expected a JSON object request body." };
  }

  const o = body as Record<string, unknown>;
  const mode = o.mode;
  if (mode !== "enbu" && mode !== "menkyo") {
    return { ok: false, error: 'Required field "mode" must be "enbu" or "menkyo".' };
  }

  let document: unknown = o.document ?? o.json ?? o.payload;
  if (document === undefined) {
    const rest: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(o)) {
      if (!CONTROL_KEYS.has(key)) rest[key] = value;
    }
    if (Object.keys(rest).length === 0) {
      return {
        ok: false,
        error: 'Provide a VC/VP as "document", or embed credential fields in the body alongside "mode".',
      };
    }
    document = rest;
  }

  const artifact = o.artifact;
  if (artifact !== undefined && artifact !== "response" && artifact !== "request") {
    return { ok: false, error: '"artifact" must be "response" or "request" when mode is "enbu".' };
  }

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
    request: {
      mode,
      artifact: artifact as EnbuArtifact | undefined,
      requestProtocol: requestProtocol as RequestProtocol | undefined,
    },
    document,
  };
}

export function runKensaInspect(
  request: KensaInspectRequest,
  document: unknown,
): { level: InspectLevel; lines: string[] } {
  if (request.mode === "menkyo") {
    return inspectJson(document, "menkyo");
  }
  if (request.artifact === "request") {
    return inspectPresentationRequest(document, request.requestProtocol ?? "oid4vp");
  }
  return inspectJson(document, "enbu");
}

export function handleKensaInspectPost(req: Request, res: Response): void {
  const t0 = Date.now();
  debugLog("POST / (kensa inspect): begin");

  const parsed = normalizeKensaInspectRequest(req.body);
  if (!parsed.ok) {
    debugLog("POST / (kensa inspect): invalid body", { error: parsed.error, ms: Date.now() - t0 });
    res.status(422).json({
      ok: false,
      error: parsed.error,
      level: "error" as const,
      lines: [] as string[],
    });
    return;
  }

  const result = runKensaInspect(parsed.request, parsed.document);
  debugLog("POST / (kensa inspect): done", {
    ms: Date.now() - t0,
    level: result.level,
    lineCount: result.lines.length,
    mode: parsed.request.mode,
    artifact: parsed.request.artifact,
  });

  res.status(200).json({
    ok: true,
    level: result.level,
    lines: result.lines,
    mode: parsed.request.mode,
    artifact: parsed.request.artifact ?? (parsed.request.mode === "enbu" ? "response" : undefined),
    requestProtocol:
      parsed.request.mode === "enbu" && parsed.request.artifact === "request"
        ? (parsed.request.requestProtocol ?? "oid4vp")
        : undefined,
    note: "Structural heuristics only — no cryptographic verification.",
  });
}
