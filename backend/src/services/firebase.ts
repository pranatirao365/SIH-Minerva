import admin from 'firebase-admin';
import fs from 'fs';

export async function initFirebase() {
  if (admin.apps.length) return admin.app();

  const jsonEnv = process.env.SERVICE_ACCOUNT_JSON;
  const pathEnv = process.env.SERVICE_ACCOUNT_PATH;

  let cred: admin.ServiceAccount | null = null;

  if (jsonEnv) {
    try {
      const parsed = JSON.parse(jsonEnv);
      cred = parsed as admin.ServiceAccount;
    } catch (e) {
      // eslint-disable-next-line no-console
      console.error('Invalid SERVICE_ACCOUNT_JSON');
      throw e;
    }
  } else if (pathEnv) {
    if (!fs.existsSync(pathEnv)) {
      // eslint-disable-next-line no-console
      console.warn(`Service account path not found: ${pathEnv}`);
    } else {
      const raw = fs.readFileSync(pathEnv, 'utf8');
      cred = JSON.parse(raw) as admin.ServiceAccount;
    }
  } else {
    // rely on GOOGLE_APPLICATION_CREDENTIALS or environment when hosted
    // admin.initializeApp() will pick that up
  }

  if (cred) {
    admin.initializeApp({
      credential: admin.credential.cert(cred),
      projectId: process.env.FIREBASE_PROJECT_ID,
    });
  } else {
    admin.initializeApp();
  }

  return admin.app();
}

export const firebaseAdmin = admin;
