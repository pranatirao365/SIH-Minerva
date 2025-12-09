# Deploy Firebase Storage Rules

## Error Fix
The error `Firebase Storage: User does not have permission to access 'photos/...'` occurs because the storage rules need to be deployed.

## Updated Rules
Added support for the `photos/` path to store user-uploaded photos (reels, posts, etc.).

## How to Deploy

### Option 1: Firebase Console (Recommended - No CLI needed)
1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select project: **sih-dec-2025**
3. Navigate to **Storage** → **Rules** tab
4. Copy the contents from `storage.rules` file
5. Paste into the Firebase Console editor
6. Click **Publish**

### Option 2: Using Firebase CLI
```bash
# First time setup (if not done already)
npm install -g firebase-tools
firebase login

# Deploy storage rules
cd frontend
firebase deploy --only storage --project sih-dec-2025
```

## Current Rules Summary
- **Test Mode**: Active until December 26, 2025 (open access for development)
- **Photos Path**: `photos/{allPaths}` - allows read/write for images up to 10MB
- **Incidents**: `incidents/{userId}/{allPaths}` - user incident media
- **Videos**: `videos/{videoFile}` - training videos (max 100MB)
- **Thumbnails**: `thumbnails/{thumbnailFile}` - video thumbnails (max 5MB)
- **PPE**: `ppe/{imageFile}` - PPE scan images
- **Profiles**: `profiles/{userId}/{imageFile}` - profile pictures

## Quick Fix (Manual Deploy)
Copy the entire `storage.rules` file content and paste it in Firebase Console → Storage → Rules, then click Publish.
