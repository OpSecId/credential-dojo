# credential-dojo

**The Credential Dojo** — a **credential management platform** (CRMS) focused on **W3C Verifiable Credentials**: web UI plus API for operating standards-aligned VCs across their lifecycle—credential definitions, issuance, holders, verification, and registry-style discovery—hosted at [credential.ninja](https://credential.ninja).

## Product terminology

The Dojo uses a small set of **Japanese martial-arts–adjacent names** so product language stays memorable and consistent. These are **metaphors for documentation and UX**, not security claims.

### Kinchaku (巾着) — the wallet

**Kinchaku** (literally a drawstring pouch) is the **holder wallet** in this platform: where people **carry, organize, and present** **W3C Verifiable Credentials** issued through the CRMS. It pairs operator-side lifecycle tooling with a first-class wallet experience.

### Kata (型) — cryptosuites

**Kata** (型, “form”) in budō is a **fixed, repeatable pattern** everyone recognizes—the same shape, executed the same way, so skill and interoperability can be judged.

In **The Credential Dojo**, **Kata** names the metaphor for **cryptosuites** (and closely related **proof / signature suites**): the **named, standardized recipe** of algorithms and options used when creating or checking proofs—e.g. Data Integrity cryptosuites, canonicalization rules, and key material expectations. The credential may live in **Kinchaku**; the **proof machinery** follows a **Kata**.

### Kasa (笠) — proof schools

**Kasa** (笠) is a **woven travel hat**—shade on the road. Here it names the **proof school porch**: the lineup of **demo issuer personas** on **Discover Kasa**, each with a **`did:key`** and preferred **Kata** samples. The in-browser **ninja profile** picks one **Kasa** so the home **Kata** carousel matches that school.

### Tehon (手本) — issuer definitions & exemplars

**Tehon** (手本) is the **model or exemplar**—the copybook. In the CRMS, **Tehon** maps to **issuer-side definitions**: **credential definitions** (the VC *type* you issue from), offer layouts, and blueprints. **Structural shape** of claims and types—schemas, JSON-LD contexts—is **Katachi** (形), not **Tehon** itself. **Tehon is not an issued credential**; issuance produces **Menkyo** (**Tehon の Menkyo**).

### Katachi (形) — credential & claim structure

**Katachi** (形) is **form** or **figure**—the shape data is supposed to take. It is **not** **Kata** (型), the fixed **pattern** of a cryptosuite (proof recipe) in this product. **Katachi** names **schemas and constraints**: JSON Schema, JSON-LD `@context` / typing rules, and other artifacts that define **what shape** claims and credentials must have. **Tehon** is the issuer copybook; **Katachi** is the **form** those definitions align with.

### Menkyo (免許) — issued credentials

**Menkyo** (免許) is a **license or formal transmission**—proof of standing. Here it names **issued W3C Verifiable Credentials**: the artifacts holders keep in **Kinchaku**, bound to issuer policy and **Kata** proofs.

### Tehon の Menkyo (手本の免許) — Menkyo from a Tehon

**Tehon no menkyo** (手本の免許) reads as **the Menkyo from the Tehon**—the concrete issued credential **instantiated from** a given definition. Use this phrase when copy must show **lineage** from **Tehon** (definition) to **Menkyo** (issued VC), e.g. issuance previews or offers.

### Enbu (演武) — presentations

**Enbu** (演武) is a **formal martial demonstration**—structured, visible, and bounded. It maps to **verifiable presentations**: what the holder **shows** a verifier (proof package, selective disclosure surface) assembled from **Menkyo** in **Kinchaku**.

### Shinbi (審美) — rendering and display

**Shinbi** (審美) is the lens of **how something is presented and perceived**. In the product, it names the **render/display layer** for credential data: readable JSON views, visual framing, and formatting for humans. **Shinbi is not verification**—that role is **Kensa**.

### Enbu の Kensa (演武の検査) — presentation inspection

**Kensa** (検査) is **inspection** or **examination**. **Enbu no kensa** (演武の検査) reads as **inspection of the demonstration**—the verifier-side pass over **Enbu**-shaped JSON. The SPA uses the hybrid title **Enbu の Kensa** with the proper Japanese phrase **演武の検査** as the subtitle pattern. The **`/kensa`** page includes this path for VP-shaped payloads (heuristics only; not a substitute for running proofs under the agreed **Kata**).

### Menkyo の Kensa (免許の検査) — credential inspection

**Menkyo no kensa** (免許の検査) is the parallel label for **inspection of a single Menkyo**—one VC-shaped object rather than a full presentation package. Product copy uses **Menkyo の Kensa** with **免許の検査** as the Japanese phrase on the same **`/kensa`** surface (second tab).

### Randori (乱取り) — protocol exchanges

**Randori** (乱取り) is **free, adaptive practice**—partners move within rules in a **multi-step back-and-forth**, not a single scripted move. In the CRMS, **Randori** names **protocol exchanges**: DIDComm-style flows, OID4VCI/OID4VP chases, and other **stateful message dances** between agents.

### Teawase (手合わせ) — handshakes / pairing

**Teawase** (手合わせ) is **“matching hands”**—a **light, mutual test** before serious work. It maps to **connection or capability handshakes**: first contact, offer/answer alignment, polite pairing **before** a longer **Randori** or an **Enbu**.

### Tejun (手順) — workflows

**Tejun** (手順) is **procedure**—the **ordered steps** of a task. In the CRMS it names **operator-side workflows**: orchestrated runs (issuance, verification, approvals) as **step sequences** you define and execute. This is **not** **Randori**, which is adaptive **protocol exchange** between agents on the wire. A workflow **template** can be described as **Tejun の Tehon** (手順の手本)—the exemplar for the procedure—alongside **Tehon** (issuer definitions for **Menkyo**) and **Enbu** (presentations).

**How to use the terms**

| Concept | Dojo name | Notes |
|--------|-----------|--------|
| Issuer definitions & exemplar (Tehon) | **Tehon** | Copybook for shapes and offers—not issued **Menkyo** |
| Issued verifiable credential | **Menkyo** | Holder-facing artifact / license record |
| Credential issued from a Tehon | **Tehon の Menkyo** / **手本の免許** | Lineage: definition → issued Menkyo |
| Verifiable presentation | **Enbu** | Demonstration package to a verifier |
| Credential render/display layer | **Shinbi** / **審美** | How Menkyo/Enbu data is shown to people |
| Presentation inspection (VP-shaped JSON) | **Enbu の Kensa** / **演武の検査** | Heuristic “kensa” path on `/kensa` |
| Single-credential inspection (VC-shaped JSON) | **Menkyo の Kensa** / **免許の検査** | Heuristic “kensa” path on `/kensa` |
| Multi-step protocol exchange | **Randori** | Stateful back-and-forth between parties |
| Orchestrated workflow (operator runbook / pipeline) | **Tejun** | Ordered steps in the platform—not wire-level Randori |
| Workflow template (procedure blueprint) | **Tejun の Tehon** / **手順の手本** | Parallel to **Tehon** for credentials; defines the Tejun |
| Handshake / first pairing | **Teawase** | Capability probe before deeper flows |
| Holder wallet UI / experience | **Kinchaku** | Where Menkyo live; Enbu are composed from here |
| Cryptosuite / proof suite selection | **Kata** | Which “form” signing and verification run |
| Demo proof school / issuer persona | **Kasa** / **笠** | Discover Kasa + ninja profile school; ties **did:key** and default **Kata** |

**In code:** canonical labels live in `backend/src/terminology.ts` (returned on `/api/health` and `/api/hello` as `terminology`, plus `templateMetaphor`, `katachiMetaphor`, `credentialMetaphor`, `credentialFromTemplateMetaphor`, `presentationMetaphor`, `presentationInspectionMetaphor`, `credentialInspectionMetaphor`, `exchangeMetaphor`, `handshakeMetaphor`, `workflowMetaphor`, `cryptosuitesMetaphor`) and are mirrored for the SPA in `frontend/src/terminology.ts`—**keep the two files aligned** when names or glyphs change.

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

- **Lexicon (SPA):** http://localhost:5173/lexicon — glossary of Dojo terms vs credential meanings.
- **Kensa (SPA):** http://localhost:5173/kensa — Enbu の Kensa / Menkyo の Kensa inspection (structural heuristics).
- **JSON explorer (SPA):** http://localhost:5173/json-explorer — interactive JSON tree with pointer blurbs.

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
| Web | **`API_UPSTREAM`** | **Required on Railway** (unless the API is colocated on loopback): full base URL of the API **without** a trailing path — e.g. `https://your-api.up.railway.app` — so nginx can `proxy_pass` `/api/*` there. The Docker image defaults to `http://127.0.0.1:3001` only so nginx can start when `api` DNS does not exist; **Compose** sets `http://api:3001` for the two-container stack. |
| Web | **`PORT`** | Set automatically by Railway — nginx **must** listen on this port inside the container (the frontend Dockerfile does). Do **not** override unless you know what you’re doing. |

Leave **`VITE_API_BASE`** unset for the Web image build so the SPA keeps calling **same-origin** `/api/...` (nginx forwards to the API). Only set **`VITE_API_BASE`** at build time if the browser must talk to an API on another origin **without** nginx proxying.

If you use **Railway private networking** between services, you may point **`API_UPSTREAM`** at the internal URL Railway documents for service-to-service calls instead of the public HTTPS URL.

### Railway without Docker — frontend only (Railpack)

Easiest path: create **one** Railway service, set **Root Directory** to **`frontend`**, connect the repo, redeploy. **`frontend/railway.toml`** tells Railpack:

- **Build:** `npm run build` (no extra `npm ci` — Railpack already installs deps; a second `npm ci` was blowing up on `node_modules/.vite`).
- **Start:** `npm start` → static **`serve`** of **`dist/`** on **`PORT`** (defaults to listening where Railway expects).

Do **not** use **`npm run dev`** or port **5173** in production.

| Step | What to do |
|------|------------|
| **API is on another Railway URL** | In the **frontend** service, add a **build** variable **`VITE_API_BASE`** = your API base (e.g. `https://your-api.up.railway.app`, no `/api` suffix). Rebuild. The app uses that for `fetch`. On the **API** service, set **`CORS_ORIGINS`** to your frontend URL. |
| **Monorepo root** (Root Directory = `.`) | In the service settings, set **Build** to `npm run build -w frontend` and **Start** to `npm run start -w frontend` — still **no** `npm ci &&` in the build line. |

Vite’s cache is under **`$TMPDIR/vite-cache-credential-dojo`**, not `node_modules/.vite`, so Railpack/`npm ci` no longer hits **`EBUSY`** on `.vite`.

## Environment

- **Backend:** `PORT` (default `3001` locally; **Railway sets `PORT`**)
- **Backend:** `CORS_ORIGINS` — optional comma-separated extra origins (see above)
- **Frontend (Docker nginx):** `API_UPSTREAM` — upstream URL for `/api` (default `http://api:3001` in the image)
- **Frontend (Vite):** optional `VITE_API_BASE` if the API is not same-origin (see `frontend/.env.example`)
- **Frontend (Railway):** build-time **`VITE_API_BASE`** when the API is on another host (see Railway section). Optional **`API_PROXY_TARGET`** only if you use **`vite preview`** locally (production uses **`serve`**).
