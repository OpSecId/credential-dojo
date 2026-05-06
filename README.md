# credential-dojo

**The Credential Dojo** — a **credential management platform** (CRMS) focused on **W3C Verifiable Credentials**: web UI plus API for operating standards-aligned VCs across their lifecycle—credential definitions, issuance, holders, verification, and registry-style discovery—hosted at [credential.ninja](https://credential.ninja).

## Product terminology

The Dojo uses a small set of **Japanese martial-arts–adjacent names** so product language stays memorable and consistent. These are **metaphors for documentation and UX**, not security claims.

### Kinchaku (巾着) — the wallet

**Kinchaku** (literally a drawstring pouch) is the **holder wallet** in this platform: where people **carry, organize, and present** **W3C Verifiable Credentials** issued through the CRMS. It pairs operator-side lifecycle tooling with a first-class wallet experience.

### Kata (型) — cryptosuites

**Kata** (型, “form”) in budō is a **fixed, repeatable pattern** everyone recognizes—the same shape, executed the same way, so skill and interoperability can be judged.

In **The Credential Dojo**, **Kata** names the metaphor for **cryptosuites** (and closely related **proof / signature suites**): the **named, standardized recipe** of algorithms and options used when creating or checking proofs—e.g. Data Integrity cryptosuites, canonicalization rules, and key material expectations. The credential may live in **Kinchaku**; the **proof machinery** follows a **Kata**.

### Tehon (手本) — credential templates

**Tehon** (手本) is the **model or exemplar**—the copybook pattern issuers instantiate. In the CRMS, **Tehon** maps to **credential templates**: JSON shapes, credential definitions, and offer layouts that become live **Menkyo** when issued.

### Menkyo (免許) — credentials

**Menkyo** (免許) is a **license or formal transmission**—proof of standing. Here it names **issued W3C Verifiable Credentials**: the artifacts holders keep in **Kinchaku**, bound to issuer policy and **Kata** proofs.

### Enbu (演武) — presentations

**Enbu** (演武) is a **formal martial demonstration**—structured, visible, and bounded. It maps to **verifiable presentations**: what the holder **shows** a verifier (proof package, selective disclosure surface) assembled from **Menkyo** in **Kinchaku**.

### Randori (乱取り) — protocol exchanges

**Randori** (乱取り) is **free, adaptive practice**—partners move within rules in a **multi-step back-and-forth**, not a single scripted move. In the CRMS, **Randori** names **protocol exchanges**: DIDComm-style flows, OID4VCI/OID4VP chases, and other **stateful message dances** between agents.

### Teawase (手合わせ) — handshakes / pairing

**Teawase** (手合わせ) is **“matching hands”**—a **light, mutual test** before serious work. It maps to **connection or capability handshakes**: first contact, offer/answer alignment, polite pairing **before** a longer **Randori** or an **Enbu**.

**How to use the terms**

| Concept | Dojo name | Notes |
|--------|-----------|--------|
| Credential template / definition | **Tehon** | Canonical “copybook” before issuance |
| Issued verifiable credential | **Menkyo** | Holder-facing artifact / license record |
| Verifiable presentation | **Enbu** | Demonstration package to a verifier |
| Multi-step protocol exchange | **Randori** | Stateful back-and-forth between parties |
| Handshake / first pairing | **Teawase** | Capability probe before deeper flows |
| Holder wallet UI / experience | **Kinchaku** | Where Menkyo live; Enbu are composed from here |
| Cryptosuite / proof suite selection | **Kata** | Which “form” signing and verification run |

**In code:** canonical labels live in `backend/src/terminology.ts` (returned on `/api/health` and `/api/hello` as `terminology`, plus `templateMetaphor`, `credentialMetaphor`, `presentationMetaphor`, `exchangeMetaphor`, `handshakeMetaphor`, `cryptosuitesMetaphor`) and are mirrored for the SPA in `frontend/src/terminology.ts`—**keep the two files aligned** when names or glyphs change.

## Structure

- `frontend/` — Vite + React + TypeScript (operator console for the CRMS; VC-centric UX)
- `backend/` — Express + TypeScript (platform `/api/*` for W3C VC flows; CORS for `credential.ninja` and local dev)

## Prerequisites

- Node.js 20+ recommended

## Development

From the repo root:

```bash
npm install
npm run dev
```

- Web: http://localhost:5173 (proxies `/api` to the API)
- API: http://localhost:3001
- **Swagger UI:** http://localhost:3001/api/docs  
- **OpenAPI JSON:** http://localhost:3001/api/openapi.json  

Behind Docker/nginx, use the same paths on your web origin (e.g. `https://…/api/docs`).

Or run each workspace separately:

```bash
npm run dev:backend
npm run dev:frontend
```

## Production build

```bash
npm run build
```

Backend output: `backend/dist/`. Frontend output: `frontend/dist/`.

Serve the SPA and reverse-proxy `/api` to the Node process, or host the API on the same origin behind your edge router.

## Docker

Multi-stage images live under `docker/`. **Compose** builds the API and an nginx front that proxies `/api` to the API service.

```bash
docker compose up --build
```

- UI: http://localhost:8080  
- API (direct): http://localhost:3001  

Set **`CORS_ORIGINS`** in `docker-compose.yml` (or override) to match the browser `Origin` you use (default includes `http://localhost:8080`). The API also reads **`CORS_ORIGINS`** as a comma-separated list from the environment.

The **frontend image** (`docker/frontend/Dockerfile`) reads **`API_UPSTREAM`**: the URL nginx uses for `proxy_pass` to the API (Compose default: `http://api:3001`). Override when the API has another hostname.

## Deploying on [Railway](https://railway.app/)

Typical setup is **two services** from this repo (same GitHub project):

| Service | Dockerfile | Role |
|--------|------------|------|
| **API** | `docker/backend/Dockerfile` | Express on **`PORT`** (Railway injects this — **don’t hard-code `3001`** in Railway unless it matches the assigned port). |
| **Web** | `docker/frontend/Dockerfile` | nginx serving `frontend/dist`; proxies **`/api`** to **`API_UPSTREAM`**. |

**Environment variables**

| Where | Variable | Purpose |
|-------|----------|---------|
| API | **`PORT`** | Usually **unset** — Railway sets it; the server listens on `process.env.PORT`. |
| API | **`CORS_ORIGINS`** | Comma-separated browser origins allowed to call the API. Include your **public Web URL** (e.g. `https://your-web.up.railway.app`). Also add a **custom domain** once configured (e.g. `https://credential.ninja`). |
| Web | **`API_UPSTREAM`** | Full base URL of the API **without** a trailing path — e.g. `https://your-api.up.railway.app` — so nginx can `proxy_pass` `/api/*` to that host. Must match what Railway exposes for the API service. |

Leave **`VITE_API_BASE`** unset for the Web image build so the SPA keeps calling **same-origin** `/api/...` (nginx forwards to the API). Only set **`VITE_API_BASE`** at build time if the browser must talk to an API on another origin **without** nginx proxying.

If you use **Railway private networking** between services, you may point **`API_UPSTREAM`** at the internal URL Railway documents for service-to-service calls instead of the public HTTPS URL.

## Environment

- **Backend:** `PORT` (default `3001` locally; **Railway sets `PORT`**)
- **Backend:** `CORS_ORIGINS` — optional comma-separated extra origins (see above)
- **Frontend (Docker nginx):** `API_UPSTREAM` — upstream URL for `/api` (default `http://api:3001` in the image)
- **Frontend (Vite):** optional `VITE_API_BASE` if the API is not same-origin (see `frontend/.env.example`)
