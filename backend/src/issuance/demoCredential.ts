import { randomUUID } from "node:crypto";
import type { PersonaPublic, ProofSchool } from "../personas.js";
import { findDemoPersona } from "../personas.js";
import {
  ISSUANCE_DEMO_DID_WEB_ISSUER,
  ISSUANCE_DEMO_DID_WEB_VERIFICATION_METHOD,
  ISSUANCE_DEMO_VCI_BASE,
  ISSUE_VERIFY_DEMO_HOLDER_DID,
  VC_DEMO_CONTEXTS,
  type DidMethod,
  type RenderMethodTemplate,
} from "./constants.js";

export type DojoIssuanceConfigure = {
  didMethod?: DidMethod;
  validFromDate?: string;
  validUntilDate?: string;
  includeCredentialSchema?: boolean;
  includeRevocation?: boolean;
  includeSuspension?: boolean;
  includeProofCreated?: boolean;
  renderMethodTemplate?: RenderMethodTemplate | null;
};

export type IssueCredentialTemplateId =
  | "university-degree"
  | "employment-offer"
  | "training-milestone"
  | "event-access";

export type IssueCredentialTemplateMeta = {
  id: IssueCredentialTemplateId;
  title: string;
  subtitle: string;
  glyph: string;
  configurationId: string;
};

export const DEFAULT_ISSUE_TEMPLATE_ID: IssueCredentialTemplateId = "university-degree";

export const ISSUE_CREDENTIAL_TEMPLATES: readonly IssueCredentialTemplateMeta[] = [
  {
    id: "university-degree",
    title: "University degree",
    subtitle: "Academic award VC",
    glyph: "卒",
    configurationId: "university-degree",
  },
  {
    id: "employment-offer",
    title: "Employment",
    subtitle: "Role & employer",
    glyph: "職",
    configurationId: "employment-offer",
  },
  {
    id: "training-milestone",
    title: "Training pass",
    subtitle: "Course completion",
    glyph: "錬",
    configurationId: "training-milestone",
  },
  {
    id: "event-access",
    title: "Event access",
    subtitle: "Admission / tier",
    glyph: "門",
    configurationId: "event-access",
  },
];

const ISSUE_CREDENTIAL_PRIMARY_TEMPLATE_BY_PERSONA_ID: Readonly<
  Record<string, IssueCredentialTemplateId>
> = {
  "ed-ryu": "university-degree",
  "ec-ryu": "university-degree",
  "ec-sd-ryu": "employment-offer",
  "bbs-ryu": "event-access",
  "cl-ryu": "training-milestone",
  "ml-ryu": "university-degree",
};

const PRIMARY_TEMPLATE_BY_PROOF_SCHOOL: Readonly<Record<ProofSchool, IssueCredentialTemplateId>> = {
  ed25519: "university-degree",
  ecdsa: "university-degree",
  bbs: "event-access",
  anoncreds: "training-milestone",
  mldsa: "university-degree",
};

export type IssueCredentialRequest = {
  personaId?: string;
  templateId?: IssueCredentialTemplateId;
  operatorCodename?: string;
  configure?: DojoIssuanceConfigure;
  credentialId?: string;
};

function isoUtcNoMs(d: Date = new Date()): string {
  return d.toISOString().replace(/\.\d{3}Z$/, "Z");
}

function issuerDidForMethod(persona: PersonaPublic, didMethod: DidMethod = "did:key"): string {
  if (didMethod === "did:web") return ISSUANCE_DEMO_DID_WEB_ISSUER;
  return persona.didKey;
}

function verificationMethodForIssuer(persona: PersonaPublic, didMethod: DidMethod = "did:key"): string {
  if (didMethod === "did:web") return ISSUANCE_DEMO_DID_WEB_VERIFICATION_METHOD;
  const issuerDid = persona.didKey;
  const vmFragment = issuerDid.startsWith("did:key:") ? issuerDid.slice("did:key:".length) : issuerDid;
  return `${issuerDid}#${vmFragment}`;
}

function issuerBlock(persona: PersonaPublic, didMethod: DidMethod = "did:key"): Record<string, unknown> {
  return {
    id: issuerDidForMethod(persona, didMethod),
    name: persona.label,
    description: persona.description,
  };
}

function proofBlock(
  persona: PersonaPublic,
  isoNow: string,
  didMethod: DidMethod,
  includeCreated: boolean,
): Record<string, unknown> {
  const suite = persona.kataSamples[0] ?? "eddsa-rdfc-2022";
  const proof: Record<string, unknown> = {
    type: "DataIntegrityProof",
    cryptosuite: suite,
    verificationMethod: verificationMethodForIssuer(persona, didMethod),
    proofPurpose: "assertionMethod",
    proofValue: "z58DEMODOJOPLACEHOLDERNOTAVERIFIEDSIGNATURE",
  };
  if (includeCreated) proof.created = isoNow;
  return proof;
}

function subjectWithOperator(
  base: Record<string, unknown>,
  operatorCodename?: string | null,
): Record<string, unknown> {
  const op = operatorCodename?.trim();
  if (!op) return base;
  return { ...base, issuerOperator: op };
}

function bitstringStatusEntry(purpose: "revocation" | "suspension", index: string): Record<string, unknown> {
  const base = ISSUANCE_DEMO_VCI_BASE.replace(/\/$/, "");
  return {
    id: `${base}/status/${purpose}#${index}`,
    type: "BitstringStatusListEntry",
    statusPurpose: purpose,
    statusListIndex: index,
    statusListCredential: `${base}/status/${purpose}-list.jwt`,
  };
}

function vcEnvelope(
  persona: PersonaPublic,
  options: { credentialId?: string; configure?: DojoIssuanceConfigure; operatorCodename?: string } | undefined,
  params: {
    types: string[];
    schemaId: string;
    credentialSubject: Record<string, unknown>;
    templateMeta: IssueCredentialTemplateMeta;
  },
): Record<string, unknown> {
  const isoNow = isoUtcNoMs();
  const credentialId = options?.credentialId ?? `urn:uuid:${randomUUID()}`;
  const cfg = options?.configure;
  const didMethod: DidMethod = cfg?.didMethod ?? "did:key";
  const includeRootSchema = cfg?.includeCredentialSchema !== false;

  const out: Record<string, unknown> = {
    "@context": [...VC_DEMO_CONTEXTS],
    id: credentialId,
    type: params.types,
    name: params.templateMeta.title,
    description: params.templateMeta.subtitle,
    issuer: issuerBlock(persona, didMethod),
    credentialSubject: params.credentialSubject,
    proof: proofBlock(persona, isoNow, didMethod, cfg?.includeProofCreated !== false),
  };

  const validFromTrimmed = cfg?.validFromDate?.trim();
  if (validFromTrimmed) out.validFrom = `${validFromTrimmed}T00:00:00Z`;
  else if (!cfg) out.validFrom = isoNow;

  if (includeRootSchema) {
    out.credentialSchema = { id: params.schemaId, type: "JsonSchema" };
  }

  if (cfg?.validUntilDate?.trim()) {
    out.validUntil = `${cfg.validUntilDate.trim()}T23:59:59Z`;
  }

  if (cfg?.includeRevocation || cfg?.includeSuspension) {
    const vcStatus: Record<string, unknown>[] = [];
    if (cfg.includeRevocation) vcStatus.push(bitstringStatusEntry("revocation", "0"));
    if (cfg.includeSuspension) vcStatus.push(bitstringStatusEntry("suspension", "0"));
    out.credentialStatus = vcStatus;
  }

  if (cfg?.renderMethodTemplate) {
    const t = cfg.renderMethodTemplate;
    const base = ISSUANCE_DEMO_VCI_BASE.replace(/\/$/, "");
    const templateMediaType =
      t === "svg" ? "image/svg+xml" : t === "pdf" ? "application/pdf" : "text/html";
    out.renderMethod = [
      {
        id: `${base}/render-methods/${params.templateMeta.configurationId}-${t}`,
        type: "TemplateRenderMethod",
        template: `${base}/render-templates/${params.templateMeta.configurationId}.${t}`,
        templateMediaType,
      },
    ];
  }

  return out;
}

function resolveTemplateId(
  persona: PersonaPublic,
  templateId?: IssueCredentialTemplateId,
): IssueCredentialTemplateId {
  if (templateId) return templateId;
  return (
    ISSUE_CREDENTIAL_PRIMARY_TEMPLATE_BY_PERSONA_ID[persona.id] ??
    PRIMARY_TEMPLATE_BY_PROOF_SCHOOL[persona.proofSchool] ??
    DEFAULT_ISSUE_TEMPLATE_ID
  );
}

export function buildDemoCredential(
  persona: PersonaPublic,
  templateId: IssueCredentialTemplateId,
  options?: { credentialId?: string; configure?: DojoIssuanceConfigure; operatorCodename?: string },
): Record<string, unknown> {
  const isoNow = isoUtcNoMs();
  const op = options?.operatorCodename?.trim();
  const templateMeta = ISSUE_CREDENTIAL_TEMPLATES.find((t) => t.id === templateId);
  if (!templateMeta) throw new Error(`Unknown issue template: ${templateId}`);

  switch (templateId) {
    case "university-degree":
      return vcEnvelope(persona, options, {
        types: ["VerifiableCredential", "UniversityDegreeCredential"],
        schemaId: "https://example.edu/schemas/university-degree-v1",
        templateMeta,
        credentialSubject: subjectWithOperator(
          {
            id: ISSUE_VERIFY_DEMO_HOLDER_DID,
            degreeName: "B.Sc. Computer Science",
            degreeType: "BachelorDegree",
            college: { id: "https://example.edu", name: "Example University" },
            yearAwarded: String(new Date(isoNow).getUTCFullYear()),
            pathway: "Credential Dojo · Issue · degree template",
          },
          op,
        ),
      });
    case "employment-offer":
      return vcEnvelope(persona, options, {
        types: ["VerifiableCredential", "EmploymentCredential"],
        schemaId: "https://credential.ninja/schemas/employment-demo-v1",
        templateMeta,
        credentialSubject: subjectWithOperator(
          {
            id: ISSUE_VERIFY_DEMO_HOLDER_DID,
            organizationName: "Example Corp",
            roleTitle: "Senior Software Engineer",
            employmentType: "full-time",
            startDate: isoNow.slice(0, 10),
            pathway: "Credential Dojo · Issue · employment template",
          },
          op,
        ),
      });
    case "training-milestone":
      return vcEnvelope(persona, options, {
        types: ["VerifiableCredential", "TrainingCompletionCredential"],
        schemaId: "https://credential.ninja/schemas/training-completion-v1",
        templateMeta,
        credentialSubject: subjectWithOperator(
          {
            id: ISSUE_VERIFY_DEMO_HOLDER_DID,
            courseTitle: "Verifiable credentials foundations",
            provider: { name: "Credential Dojo Academy" },
            completedDate: isoNow.slice(0, 10),
            outcome: "pass",
            pathway: "Credential Dojo · Issue · training template",
          },
          op,
        ),
      });
    case "event-access":
      return vcEnvelope(persona, options, {
        types: ["VerifiableCredential", "EventAdmissionCredential"],
        schemaId: "https://credential.ninja/schemas/event-admission-v1",
        templateMeta,
        credentialSubject: subjectWithOperator(
          {
            id: ISSUE_VERIFY_DEMO_HOLDER_DID,
            eventName: "OpenWallet Summit 2026",
            admissionTier: "general",
            venue: "Example Convention Center",
            pathway: "Credential Dojo · Issue · event template",
          },
          op,
        ),
      });
  }
}

export function issueCredentialFromRequest(
  body: unknown,
): { ok: true; verifiableCredential: Record<string, unknown> } | { ok: false; error: string } {
  const params =
    body !== null && typeof body === "object" && !Array.isArray(body)
      ? (body as IssueCredentialRequest)
      : {};

  const persona = findDemoPersona(params.personaId);
  if (!persona) {
    return { ok: false, error: `Unknown personaId "${String(params.personaId)}".` };
  }

  const templateId = params.templateId
    ? resolveTemplateId(persona, params.templateId)
    : resolveTemplateId(persona);

  if (params.templateId && !ISSUE_CREDENTIAL_TEMPLATES.some((t) => t.id === params.templateId)) {
    return {
      ok: false,
      error: `Unknown templateId "${params.templateId}".`,
    };
  }

  try {
    const verifiableCredential = buildDemoCredential(persona, templateId, {
      configure: params.configure,
      operatorCodename: params.operatorCodename,
      credentialId: params.credentialId,
    });
    return { ok: true, verifiableCredential };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : String(e) };
  }
}
