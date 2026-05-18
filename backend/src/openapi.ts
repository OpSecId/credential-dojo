/**
 * OpenAPI 3 document for The Credential Dojo API (served at GET /api/openapi.json and UI at /api/docs).
 */
export const openApiDocument = {
  openapi: "3.0.3",
  info: {
    title: "The Credential Dojo API",
    description:
      "CRMS platform API for W3C Verifiable Credentials. Product terminology: Tehon, Katachi, Menkyo, Tehon の Menkyo, Shōkan, Enbu, Shinbi (render), Kensa, Randori, Teawase, Tejun (workflows), Kinchaku, Kata, Kasa — see `terminology` in responses and the project README.",
    version: "0.1.0",
    contact: {
      name: "DOJO",
      url: "https://credential.ninja",
    },
  },
  servers: [{ url: "/", description: "Current host (same origin as this request)" }],
  tags: [
    { name: "Platform", description: "Health, issue, sign, verify (demo — no real cryptography)" },
    { name: "Demo", description: "Deterministic demo data (not production)" },
  ],
  paths: {
    "/api": {
      post: {
        tags: ["Platform"],
        summary: "Platform root (issue · sign · verify)",
        description:
          "Exactly **one** top-level key selects the operation: `credential` (issue Menkyo), `verifiableCredential` (verify VC), `presentation` (sign VP), or `verifiablePresentation` (verify VP or Shōkan request). Optional `requestProtocol` when verifying presentation requests. Legacy `{ mode, document }` bodies still work. Same behavior as POST `/`.",
        operationId: "postPlatformRootApi",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/RootPostRequest" },
            },
          },
        },
        responses: {
          "200": {
            description: "Operation completed",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/RootPostResponse" },
              },
            },
          },
          "422": {
            description: "Invalid request",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/RootPostErrorResponse" },
              },
            },
          },
        },
      },
    },
    "/": {
      post: {
        tags: ["Platform"],
        summary: "Platform root (direct listener)",
        description: "Same as POST `/api`. Prefer `/api` on the web origin behind nginx.",
        operationId: "postPlatformRoot",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/RootPostRequest" },
            },
          },
        },
        responses: {
          "200": {
            description: "Operation completed",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/RootPostResponse" },
              },
            },
          },
          "422": {
            description: "Invalid request",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/RootPostErrorResponse" },
              },
            },
          },
        },
      },
    },
    "/api/health": {
      get: {
        tags: ["Platform"],
        summary: "Health check",
        description:
          "Liveness probe and API metadata including product terminology metaphors.",
        operationId: "getHealth",
        responses: {
          "200": {
            description: "API is healthy",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/HealthResponse" },
              },
            },
          },
        },
      },
    },
    "/api/personas": {
      get: {
        tags: ["Demo"],
        summary: "Demo issuer personas (deterministic keys)",
        description:
          "Six proof schools / issuer personas (Ed-ryū, Ec-ryū, Ec-sd-ryū, BBS-ryū, CL-ryū, ML-ryū) with `did:key` identifiers. Keys are derived from stable demo labels — suitable for repeatable demos only.",
        operationId: "getPersonas",
        responses: {
          "200": {
            description: "Persona list with public DIDs and ordered kata samples",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/PersonasResponse" },
              },
            },
          },
        },
      },
    },
    "/api/hello": {
      get: {
        tags: ["Platform"],
        summary: "Hello / capability blurb",
        description:
          "Short welcome message and terminology aligned with the SPA landing page.",
        operationId: "getHello",
        responses: {
          "200": {
            description: "Greeting payload",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/HelloResponse" },
              },
            },
          },
        },
      },
    },
    "/api/oid4vci/process-offer": {
      post: {
        tags: ["Demo"],
        summary: "OID4VCI demo — process credential offer (server-side)",
        description:
          "Fetches credential_offer via https URI when needed, resolves openid-credential-issuer metadata, may exchange a pre-authorized_code for an access token, and POSTs a credential request. Demo proxy: https only, no mTLS / DPoP / rich client auth.",
        operationId: "postOid4vciProcessOffer",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  credentialOfferUri: { type: "string", description: "HTTPS URL returning credential offer JSON" },
                  credentialOffer: { type: "object", description: "Inline credential offer object" },
                },
              },
            },
          },
        },
        responses: {
          "200": {
            description: "Pipeline completed (may include partial success)",
            content: { "application/json": { schema: { type: "object" } } },
          },
          "422": {
            description: "Invalid input or upstream fetch/metadata failure",
            content: { "application/json": { schema: { type: "object" } } },
          },
          "500": {
            description: "Unexpected server error",
            content: { "application/json": { schema: { type: "object" } } },
          },
        },
      },
    },
    "/api/openapi.json": {
      get: {
        tags: ["Platform"],
        summary: "OpenAPI document",
        description:
          "Machine-readable OpenAPI 3 specification (same document Swagger UI uses).",
        operationId: "getOpenApi",
        responses: {
          "200": {
            description: "OpenAPI 3.0 JSON document",
            content: {
              "application/json": {
                schema: { type: "object" },
              },
            },
          },
        },
      },
    },
  },
  components: {
    schemas: {
      TerminologyEntry: {
        type: "object",
        required: ["name", "glyph"],
        properties: {
          name: { type: "string", example: "Kinchaku" },
          glyph: { type: "string", example: "巾着" },
        },
      },
      ProductTerminology: {
        type: "object",
        description: "Dojo product metaphors (names match README).",
        properties: {
          wallet: { $ref: "#/components/schemas/TerminologyEntry" },
          cryptosuites: { $ref: "#/components/schemas/TerminologyEntry" },
          kasa: { $ref: "#/components/schemas/TerminologyEntry" },
          template: { $ref: "#/components/schemas/TerminologyEntry" },
          katachi: { $ref: "#/components/schemas/TerminologyEntry" },
          credential: { $ref: "#/components/schemas/TerminologyEntry" },
          credentialFromTemplate: { $ref: "#/components/schemas/TerminologyEntry" },
          presentation: { $ref: "#/components/schemas/TerminologyEntry" },
          presentationRequest: { $ref: "#/components/schemas/TerminologyEntry" },
          render: { $ref: "#/components/schemas/TerminologyEntry" },
          presentationInspection: { $ref: "#/components/schemas/TerminologyEntry" },
          credentialInspection: { $ref: "#/components/schemas/TerminologyEntry" },
          exchange: { $ref: "#/components/schemas/TerminologyEntry" },
          handshake: { $ref: "#/components/schemas/TerminologyEntry" },
          workflow: { $ref: "#/components/schemas/TerminologyEntry" },
        },
      },
      HealthResponse: {
        type: "object",
        required: ["ok", "service", "product", "role", "standardsFocus", "terminology"],
        properties: {
          ok: { type: "boolean", example: true },
          service: { type: "string", example: "credential-dojo-api" },
          product: { type: "string", example: "The Credential Dojo" },
          role: { type: "string", example: "crms" },
          wallet: { type: "string" },
          cryptosuitesMetaphor: { type: "string" },
          templateMetaphor: { type: "string" },
          katachiMetaphor: { type: "string" },
          credentialMetaphor: { type: "string" },
          credentialFromTemplateMetaphor: { type: "string" },
          presentationMetaphor: { type: "string" },
          presentationRequestMetaphor: { type: "string" },
          renderMetaphor: { type: "string" },
          presentationInspectionMetaphor: { type: "string" },
          credentialInspectionMetaphor: { type: "string" },
          exchangeMetaphor: { type: "string" },
          handshakeMetaphor: { type: "string" },
          workflowMetaphor: { type: "string" },
          standardsFocus: { type: "string", example: "W3C Verifiable Credentials" },
          terminology: { $ref: "#/components/schemas/ProductTerminology" },
        },
      },
      PersonaPublic: {
        type: "object",
        required: [
          "id",
          "label",
          "labelJa",
          "description",
          "proofSchool",
          "didKey",
          "kataSamples",
        ],
        properties: {
          id: { type: "string", example: "ed-ryu" },
          label: { type: "string", example: "Ed-ryū" },
          labelJa: { type: "string", example: "エド流" },
          description: { type: "string" },
          proofSchool: {
            type: "string",
            enum: ["ed25519", "ecdsa", "bbs", "mldsa", "anoncreds"],
            example: "ed25519",
          },
          didKey: {
            type: "string",
            description: "Public `did:key` for the demo issuer (multicodec + multibase).",
            example: "did:key:z6MkhaXgBZDvotDkL5257faiztiGiC2QtKLGpbnnEGta2doK",
          },
          kataSamples: {
            type: "array",
            items: { type: "string" },
            description: "Preferred kata (cryptosuite) strings for this school.",
          },
        },
      },
      PersonasResponse: {
        type: "object",
        required: ["personas", "note"],
        properties: {
          personas: {
            type: "array",
            items: { $ref: "#/components/schemas/PersonaPublic" },
          },
          note: { type: "string" },
        },
      },
      HelloResponse: {
        type: "object",
        required: ["message", "site", "standardsFocus", "terminology"],
        properties: {
          message: { type: "string" },
          site: { type: "string", format: "uri", example: "https://credential.ninja" },
          wallet: { type: "string" },
          cryptosuitesMetaphor: { type: "string" },
          templateMetaphor: { type: "string" },
          katachiMetaphor: { type: "string" },
          credentialMetaphor: { type: "string" },
          credentialFromTemplateMetaphor: { type: "string" },
          presentationMetaphor: { type: "string" },
          presentationRequestMetaphor: { type: "string" },
          renderMetaphor: { type: "string" },
          presentationInspectionMetaphor: { type: "string" },
          credentialInspectionMetaphor: { type: "string" },
          exchangeMetaphor: { type: "string" },
          handshakeMetaphor: { type: "string" },
          workflowMetaphor: { type: "string" },
          standardsFocus: { type: "string" },
          terminology: { $ref: "#/components/schemas/ProductTerminology" },
        },
      },
      RootPostRequest: {
        description:
          "Use exactly one operation property. Optional requestProtocol for Shōkan-shaped verifiablePresentation payloads.",
        oneOf: [
          {
            type: "object",
            required: ["credential"],
            properties: {
              credential: { $ref: "#/components/schemas/IssueCredentialRequest" },
            },
          },
          {
            type: "object",
            required: ["verifiableCredential"],
            properties: {
              verifiableCredential: { type: "object", description: "VC JSON to inspect (Menkyo の Kensa)." },
              requestProtocol: { $ref: "#/components/schemas/RequestProtocol" },
            },
          },
          {
            type: "object",
            required: ["presentation"],
            properties: {
              presentation: { $ref: "#/components/schemas/SignPresentationRequest" },
            },
          },
          {
            type: "object",
            required: ["verifiablePresentation"],
            properties: {
              verifiablePresentation: {
                type: "object",
                description: "VP or presentation-request JSON (Enbu の Kensa).",
              },
              requestProtocol: { $ref: "#/components/schemas/RequestProtocol" },
            },
          },
        ],
      },
      RequestProtocol: {
        type: "string",
        enum: ["oid4vp", "didcomm", "chapi", "custom"],
      },
      IssueCredentialRequest: {
        type: "object",
        properties: {
          personaId: { type: "string", example: "ed-ryu" },
          templateId: {
            type: "string",
            enum: ["university-degree", "employment-offer", "training-milestone", "event-access"],
          },
          operatorCodename: { type: "string" },
          credentialId: { type: "string" },
          configure: { $ref: "#/components/schemas/DojoIssuanceConfigure" },
        },
      },
      DojoIssuanceConfigure: {
        type: "object",
        properties: {
          didMethod: { type: "string", enum: ["did:key", "did:web"] },
          validFromDate: { type: "string", format: "date" },
          validUntilDate: { type: "string", format: "date" },
          includeCredentialSchema: { type: "boolean" },
          includeRevocation: { type: "boolean" },
          includeSuspension: { type: "boolean" },
          includeProofCreated: { type: "boolean" },
          renderMethodTemplate: { type: "string", enum: ["svg", "pdf", "html", null] },
        },
      },
      SignPresentationRequest: {
        type: "object",
        properties: {
          holderDid: { type: "string" },
          verifiableCredential: {
            description: "Credential object or array to embed.",
          },
          credentials: { description: "Alias for verifiableCredential." },
          challenge: { type: "string" },
          domain: { type: "string" },
        },
      },
      RootPostResponse: {
        type: "object",
        required: ["ok", "operation"],
        properties: {
          ok: { type: "boolean", example: true },
          operation: {
            type: "string",
            enum: ["credential", "verifiableCredential", "presentation", "verifiablePresentation"],
          },
          verifiableCredential: { type: "object" },
          verifiablePresentation: { type: "object" },
          level: { type: "string", enum: ["ok", "warn", "error"] },
          lines: { type: "array", items: { type: "string" } },
          note: { type: "string" },
          requestProtocol: { $ref: "#/components/schemas/RequestProtocol" },
        },
      },
      RootPostErrorResponse: {
        type: "object",
        required: ["ok", "error"],
        properties: {
          ok: { type: "boolean", example: false },
          error: { type: "string" },
          operation: { type: "string", nullable: true },
        },
      },
    },
  },
} as const;
