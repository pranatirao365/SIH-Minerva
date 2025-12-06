# Running the Minerva Backend (Windows / PowerShell)

This document helps a new developer run the backend locally.

## Prerequisites

- Node.js (v16+) — recommended Node 18+ or the version used in project. Verify with:

```powershell
node --version
```

- Recommended package manager: `pnpm` (faster). `npm` also supported.

## Environment / Firebase credentials

1. Copy `backend/.env.example` to `backend/.env` and edit values if needed.
2. Place your Firebase service account JSON at `backend/serviceAccountKey.json`, or set the environment variable `SERVICE_ACCOUNT_JSON` to the JSON string.

Minimal `.env` example (use the provided `.env.example`):

```text
PORT=4000
SERVICE_ACCOUNT_PATH=./serviceAccountKey.json
FIREBASE_PROJECT_ID=your-project-id
```

Important: do NOT commit your `serviceAccountKey.json` or `.env` to source control.

## Install dependencies (recommended)

Using pnpm (recommended, typically faster):

```powershell
cd d:\SIH-Minerva\backend
npx pnpm@latest install
```

If pnpm prompts about build scripts being ignored, you can approve them with:

```powershell
npx pnpm@latest approve-builds
```

Fallback using npm (slower/more disk usage):

```powershell
cd d:\SIH-Minerva\backend
npm install
```

Notes:
- If you have a `package-lock.json` and want reproducible installs, `npm ci` is preferred after the lockfile is in place.
- If installation is slow, try `--prefer-offline` or use `pnpm`.

## Build (TypeScript)

```powershell
cd d:\SIH-Minerva\backend
npm run build
```

This compiles TypeScript to `backend/dist/`.

## Run the server (development)

Set the `PORT` environment variable (PowerShell):

```powershell
cd d:\SIH-Minerva\backend
$env:PORT='4000'; npm start
```

- `npm start` runs the dev server (`ts-node-dev`) and will print the listening URL (e.g. `http://localhost:4000`).
- If the port is in use, change `PORT` to another port (e.g. `4001`) and restart.

Run the compiled dist file directly (production-ish):

```powershell
cd d:\SIH-Minerva\backend
$env:PORT='4000'; node dist/index.js
```

## Health check / Verify

Open in a browser or use PowerShell:

```powershell
Invoke-RestMethod "http://localhost:4000/"
```

Expected JSON: `{"ok":true,"service":"minerva-backend"}`

## Authentication / Testing protected endpoints

- The backend expects a Firebase ID token in the `Authorization: Bearer <token>` header for protected routes. The `firebaseAuth` middleware will verify the token and attach user data from Firestore `users/{uid}`.
- To get a test token you can use the Firebase client SDK (from your mobile app) after signing in, or create a custom token using the Admin SDK.

Example curl (replace `<ID_TOKEN>`):

```powershell
curl -H "Authorization: Bearer <ID_TOKEN>" http://localhost:4000/api/ping
```

Note: `api/ping` is protected by auth; you can also hit `/ping` without auth to check server liveness.

## Troubleshooting

- Port already in use: choose a different `PORT` or kill the process using it (`netstat -ano | findstr :4000`).
- `The default Firebase app does not exist` error: ensure your service account is present or environment credentials are set and that `initFirebase()` runs before any service usage. Restart server after placing `serviceAccountKey.json`.
- Long `npm install` times: try `pnpm`, `--prefer-offline`, or check antivirus/Windows Defender exclusions for `node_modules`.
- If installs fail with pnpm about matching versions, bump the dependency in `package.json` (we've used compatible versions in this repo).

## Additional notes for contributors

- Routes are under `backend/src/routes/` and controllers under `backend/src/controllers/`.
- Firestore collections used by the backend are documented in the controllers as comments; you can inspect them to learn required document shapes.
- No UI is included here — this service provides REST endpoints to be consumed by the mobile app or other clients.

If anything fails or you want me to automate start scripts or dockerize the backend, tell me and I can add that next.
