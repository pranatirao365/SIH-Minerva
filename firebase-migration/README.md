# Firebase Migration Guide

## Step 1: Export Data from Current Project (sihtut-1)

1. Install dependencies:
```bash
npm install
```

2. Run the export script:
```bash
npm run export
```

This will create a `firestore-backup.json` file with all your data.

## Step 2: Create New Firebase Project

1. Go to https://console.firebase.google.com/
2. Create a new project
3. Enable Firestore, Authentication, and Storage
4. Go to Project Settings → Service Accounts
5. Click "Generate New Private Key"
6. Save the file as `new-serviceAccountKey.json` in this directory

## Step 3: Update Import Script

Edit `import-firestore.js`:
- Line 7: Update the path to `new-serviceAccountKey.json`
- Line 11: Replace `YOUR_NEW_PROJECT_ID` with your actual new project ID

## Step 4: Import Data to New Project

```bash
npm run import
```

## Step 5: Update Your Application Configuration

### Backend (.env file)
Update `backend_main/backend/.env`:
```
SERVICE_ACCOUNT_PATH=./serviceAccountKey.json
FIREBASE_PROJECT_ID=your-new-project-id
PORT=4000
```

Replace the old serviceAccountKey.json with the new one.

### Frontend (firebase.ts)
Update `frontend/config/firebase.ts` with the new Firebase config from:
Project Settings → General → Your apps → Web app

## Step 6: Migrate Storage (if needed)

If you have files in Firebase Storage, you'll need to download and re-upload them or use gsutil (requires Google Cloud SDK).

## Step 7: Update Authentication

If you're using Firebase Authentication:
- Users will need to re-authenticate in the new project
- Or you can export/import users via Firebase Console
- Go to Authentication → Users → three dots menu → Export users

## Notes

- The export/import preserves document IDs
- Subcollections are not automatically exported (add custom logic if needed)
- This process does NOT migrate Firebase Authentication users
