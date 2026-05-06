import cors from "cors";
import express from "express";

const app = express();
const PORT = Number(process.env.PORT) || 3001;

const publicSite = "https://credential.ninja";
const allowedOrigins = new Set([
  publicSite,
  "http://credential.ninja",
  "http://localhost:5173",
  "http://127.0.0.1:5173",
  "http://localhost:4173",
  "http://127.0.0.1:4173",
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

app.get("/api/health", (_req, res) => {
  res.json({ ok: true, service: "credential-dojo-api" });
});

app.get("/api/hello", (_req, res) => {
  res.json({
    message: "Welcome to The Credential Dojo API",
    site: publicSite,
  });
});

app.listen(PORT, () => {
  console.log(`API listening on http://localhost:${PORT}`);
});
