# credential-dojo

**The Credential Dojo** — a **credential management platform** (CRMS) focused on **W3C Verifiable Credentials**: web UI plus API for operating standards-aligned VCs across their lifecycle—credential definitions, issuance, holders, verification, and registry-style discovery—hosted at [credential.ninja](https://credential.ninja).

### Wallet: Kinchaku

**Kinchaku** (巾着) is the platform wallet: where holders keep, organize, and present **W3C Verifiable Credentials** issued and governed through the Dojo—pairing operator workflows with a first-class wallet experience.

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
