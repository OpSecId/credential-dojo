/**
 * OpenAPI 3 document for The Credential Dojo API (served at GET /api/openapi.json and UI at /api/docs).
 */
export const openApiDocument = {
  openapi: "3.0.3",
  info: {
    title: "The Credential Dojo API",
    description:
      "CRMS platform API for W3C Verifiable Credentials. Product terminology: Tehon, Katachi, Menkyo, Tehon の Menkyo, Enbu, Shinbi (render), Kensa, Randori, Teawase, Tejun (workflows), Kinchaku, Kata, Kasa — see `terminology` in responses and the project README.",
    version: "0.1.0",
    contact: {
      name: "credential.ninja",
      url: "https://credential.ninja",
    },
  },
  servers: [{ url: "/", description: "Current host (same origin as this request)" }],
  tags: [
    { name: "Platform", description: "Health and introspection" },
    { name: "Demo", description: "Deterministic demo data (not production)" },
  ],
  paths: {
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
    },
  },
} as const;
