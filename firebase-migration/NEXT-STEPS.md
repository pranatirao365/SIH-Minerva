# Firebase Migration - Next Steps

## ✅ Completed:
1. ✓ Exported data from old project (sihtut-1)
2. ✓ Created backup file: firestore-backup.json
3. ✓ Downloaded new service account key

## ❌ Error: Firestore Not Enabled

The import failed because Firestore is not enabled in your new project `sih-dec-2025`.

## Steps to Fix:

### 1. Enable Firestore in New Project
1. Go to: https://console.firebase.google.com/project/sih-dec-2025/firestore
2. Click **"Create Database"**
3. Choose **"Start in production mode"** (or test mode if preferred)
4. Select a location (choose same region as your old project if possible)
5. Click **"Enable"**

### 2. Run Import Again
Once Firestore is enabled, run:
```powershell
cd D:\SIH-Minerva\firebase-migration
npm run import
```

### 3. After Successful Import

Update your application configuration files:

#### Backend: `backend_main/backend/.env`
```env
SERVICE_ACCOUNT_PATH=./serviceAccountKey.json
FIREBASE_PROJECT_ID=sih-dec-2025
PORT=4000
```

Also replace `backend_main/backend/serviceAccountKey.json` with the new key.

#### Frontend: `frontend/config/firebase.ts`
Get the new config from:
https://console.firebase.google.com/project/sih-dec-2025/settings/general

Then update the `firebaseConfig` object.

### 4. Enable Other Services (if needed)
- **Authentication**: https://console.firebase.google.com/project/sih-dec-2025/authentication
- **Storage**: https://console.firebase.google.com/project/sih-dec-2025/storage

---

**After enabling Firestore, let me know and I'll re-run the import!**
