import cors from "cors";
import express from "express";
import swaggerUi from "swagger-ui-express";
import { openApiDocument } from "./openapi.js";
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
    presentationMetaphor: productTerminology.presentation.name,
    exchangeMetaphor: productTerminology.exchange.name,
    handshakeMetaphor: productTerminology.handshake.name,
    standardsFocus,
    terminology: productTerminology,
  });
});

app.get("/api/hello", (_req, res) => {
  res.json({
    message:
      "The Credential Dojo platform API — Tehon templates, Menkyo credentials, Enbu presentations, Randori exchanges, Teawase handshakes, Kinchaku wallet, Kata cryptosuites, W3C VC–aligned endpoints.",
    site: publicSite,
    wallet: productTerminology.wallet.name,
    cryptosuitesMetaphor: productTerminology.cryptosuites.name,
    templateMetaphor: productTerminology.template.name,
    credentialMetaphor: productTerminology.credential.name,
    presentationMetaphor: productTerminology.presentation.name,
    exchangeMetaphor: productTerminology.exchange.name,
    handshakeMetaphor: productTerminology.handshake.name,
    standardsFocus,
    terminology: productTerminology,
  });
});

app.listen(PORT, () => {
  console.log(`API listening on http://localhost:${PORT}`);
});
