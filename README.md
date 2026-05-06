# credential-dojo

**The Credential Dojo** — React frontend and Node API for experiments around verifiable credentials.

Public site: [credential.ninja](https://credential.ninja)

## Structure

- `frontend/` — Vite + React + TypeScript (`credential.ninja` metadata and branding)
- `backend/` — Express + TypeScript (`/api/*`, CORS allows the public site and local dev)

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
