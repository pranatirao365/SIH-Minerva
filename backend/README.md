# Minerva Backend (prototype)

This folder contains a small Express + TypeScript backend scaffold for the Minerva project. It provides route skeletons, middleware and controllers for Supervisor, Miner, Safety Officer and Admin responsibilities. The operations use Firebase Admin SDK (Firestore + Auth) for storage and authentication.

How to run

1. Copy a service account JSON into `backend/serviceAccountKey.json` or set `SERVICE_ACCOUNT_JSON` environment variable with the JSON string.
2. Copy `.env.example` to `.env` and update values.
3. Install dependencies and start the dev server:

```powershell
cd d:\SIH-Minerva\backend
npm ci
npm start
```

Notes
- The routes and controllers are intentionally minimal and return stubs or connect to Firestore. No UI is included.
- Protect endpoints by providing a Firebase ID token in the `Authorization: Bearer <token>` header. The auth middleware will fetch the user document from `users/{uid}` in Firestore for role checks.
