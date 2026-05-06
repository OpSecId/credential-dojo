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

## Environment

- **Backend:** `PORT` (default `3001`)
- **Frontend:** optional `VITE_API_BASE` if the API is not same-origin (see `frontend/.env.example`)
