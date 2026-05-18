export const ISSUANCE_DEMO_VCI_BASE = "https://credential.ninja/demo-vci";

export const CREDENTIAL_NINJA_V1_CONTEXT = "https://credential.ninja/v1";

export const VC_DEMO_CONTEXTS = [
  "https://www.w3.org/ns/credentials/v2",
  CREDENTIAL_NINJA_V1_CONTEXT,
] as const;

export type DidMethod = "did:key" | "did:web";

export type RenderMethodTemplate = "svg" | "pdf" | "html";

export const ISSUANCE_DEMO_DID_WEB_ISSUER = "did:web:credential.ninja";

export const ISSUANCE_DEMO_DID_WEB_VERIFICATION_METHOD = `${ISSUANCE_DEMO_DID_WEB_ISSUER}#key-1`;

export const ISSUE_VERIFY_DEMO_HOLDER_DID =
  "did:key:z6MkHolderExampleDemoDojo000000000000000";
