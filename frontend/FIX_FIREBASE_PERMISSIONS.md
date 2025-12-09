# 🔧 Fix Firebase Permissions Error

## Problem
```
FirebaseError: [code=permission-denied]: Missing or insufficient permissions.
```

## ✅ Solution: Update Firestore Rules

### Method 1: Firebase Console (FASTEST - Do this now!)

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project: **sih-dec-2025**
3. Click **Firestore Database** in the left menu
4. Click the **Rules** tab at the top
5. You should see line 49 has `videoAssignments` rules
6. **After line 57**, add these lines:

```javascript
    // --- POSTS COLLECTION (Reels, Photos, Videos uploaded by miners) ---
    match /posts/{postId} {
      // Test Mode → allow all
      allow read, write: if isTestMode();

      // Normal Mode → authenticated users can read all posts
      allow read: if isLoggedIn();

      // Users can create posts
      allow create: if isLoggedIn();

      // Users can update/delete only their own posts
      allow update, delete: if isLoggedIn() && request.auth.uid == resource.data.userId;
    }
```

7. Click **Publish** button
8. Reload your app - error should be gone! ✅

### Method 2: Using Firebase CLI

Run this command in PowerShell:
```bash
cd E:\SIH\FINALH\SIH-Minerva\frontend
firebase deploy --only firestore:rules
```

Or double-click the file: `deploy-rules.bat`

---

## What This Does

The new rules allow:
- ✅ **Test Mode** (until Dec 26, 2025): Full read/write access
- ✅ **Read**: All authenticated users can view posts
- ✅ **Create**: All users can upload content
- ✅ **Update/Delete**: Only post owners can modify their own content

---

## Verify It Worked

After updating, you should see in your app logs:
```
✅ Firestore: posts collection accessible
```

The error **"Missing or insufficient permissions"** should disappear!
