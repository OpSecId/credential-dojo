import cors from "cors";
import express from "express";
import swaggerUi from "swagger-ui-express";
import { openApiDocument } from "./openapi.js";
import { listDemoPersonas } from "./personas.js";
import { productTerminology } from "./terminology.js";

const app = express();
const PORT = Number(process.env.PORT) || 3001;

const publicSite = "https://credential.ninja";
const extraOrigins =
  process.env.CORS_ORIGINS?.split(",").map((s) => s.trim()).filter(Boolean) ?? [];
const allowedOrigins = new Set([
  publicSite,
  "http://credential.ninja",
  "http://localhost:5173",
  "http://127.0.0.1:5173",
  "http://localhost:4173",
  "http://127.0.0.1:4173",
  ...extraOrigins,
]);

app.use(
  cors({
    origin(origin, callback) {
      if (!origin || allowedOrigins.has(origin)) {
        callback(null, true);
        return;
      }
      callback(null, false);
    },
  }),
);
app.use(express.json());

app.get("/api/openapi.json", (_req, res) => {
  res.json(openApiDocument);
});

app.use(
  "/api/docs",
  swaggerUi.serve,
  swaggerUi.setup(openApiDocument, {
    customSiteTitle: "The Credential Dojo API",
  }),
);

const standardsFocus = "W3C Verifiable Credentials";

app.get("/api/health", (_req, res) => {
  res.json({
    ok: true,
    service: "credential-dojo-api",
    product: "The Credential Dojo",
    role: "crms",
    wallet: productTerminology.wallet.name,
    cryptosuitesMetaphor: productTerminology.cryptosuites.name,
    templateMetaphor: productTerminology.template.name,
    credentialMetaphor: productTerminology.credential.name,
    credentialFromTemplateMetaphor: productTerminology.credentialFromTemplate.name,
    presentationMetaphor: productTerminology.presentation.name,
    renderMetaphor: productTerminology.render.name,
    presentationInspectionMetaphor: productTerminology.presentationInspection.name,
    credentialInspectionMetaphor: productTerminology.credentialInspection.name,
    exchangeMetaphor: productTerminology.exchange.name,
    handshakeMetaphor: productTerminology.handshake.name,
    workflowMetaphor: productTerminology.workflow.name,
    standardsFocus,
    terminology: productTerminology,
  });
});

app.get("/api/personas", (_req, res) => {
  res.json({
    personas: listDemoPersonas(),
    note:
      "Demo-only issuer personas: public keys are deterministically derived from fixed labels for repeatable demos — not for production secrets.",
  });
});

app.get("/api/hello", (_req, res) => {
  res.json({
    message:
      "The Credential Dojo platform API — Tehon (definitions), Menkyo, Tehon の Menkyo, Enbu, Shinbi (render), Kensa, Randori, Teawase, Tejun (workflows), Kinchaku, Kata — W3C VC–aligned endpoints.",
    site: publicSite,
    wallet: productTerminology.wallet.name,
    cryptosuitesMetaphor: productTerminology.cryptosuites.name,
    templateMetaphor: productTerminology.template.name,
    credentialMetaphor: productTerminology.credential.name,
    credentialFromTemplateMetaphor: productTerminology.credentialFromTemplate.name,
    presentationMetaphor: productTerminology.presentation.name,
    renderMetaphor: productTerminology.render.name,
    presentationInspectionMetaphor: productTerminology.presentationInspection.name,
    credentialInspectionMetaphor: productTerminology.credentialInspection.name,
    exchangeMetaphor: productTerminology.exchange.name,
    handshakeMetaphor: productTerminology.handshake.name,
    workflowMetaphor: productTerminology.workflow.name,
    standardsFocus,
    terminology: productTerminology,
  });
});

app.listen(PORT, () => {
  console.log(`API listening on http://localhost:${PORT}`);
});
