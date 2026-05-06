# credential-dojo

**The Credential Dojo** — a **credential management platform** (CRMS) focused on **W3C Verifiable Credentials**: web UI plus API for operating standards-aligned VCs across their lifecycle—credential definitions, issuance, holders, verification, and registry-style discovery—hosted at [credential.ninja](https://credential.ninja).

## Product terminology

The Dojo uses a small set of **Japanese martial-arts–adjacent names** so product language stays memorable and consistent. These are **metaphors for documentation and UX**, not security claims.

### Kinchaku (巾着) — the wallet

**Kinchaku** (literally a drawstring pouch) is the **holder wallet** in this platform: where people **carry, organize, and present** **W3C Verifiable Credentials** issued through the CRMS. It pairs operator-side lifecycle tooling with a first-class wallet experience.

### Kata (型) — cryptosuites

**Kata** (型, “form”) in budō is a **fixed, repeatable pattern** everyone recognizes—the same shape, executed the same way, so skill and interoperability can be judged.

In **The Credential Dojo**, **Kata** names the metaphor for **cryptosuites** (and closely related **proof / signature suites**): the **named, standardized recipe** of algorithms and options used when creating or checking proofs—e.g. Data Integrity cryptosuites, canonicalization rules, and key material expectations. The credential may live in **Kinchaku**; the **proof machinery** follows a **Kata**.

**How to use the terms**

| Concept | Dojo name | Notes |
|--------|-----------|--------|
| Holder wallet UI / experience | **Kinchaku** | Container and presentation for VCs |
| Cryptosuite / proof suite selection | **Kata** | Which “form” signing and verification run |

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

## Environment

- **Backend:** `PORT` (default `3001`)
- **Frontend:** optional `VITE_API_BASE` if the API is not same-origin (see `frontend/.env.example`)
