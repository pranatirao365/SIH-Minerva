# Firebase Project Migration - Complete Implementation Guide

**Migration Date:** December 8, 2025  
**From:** `sihtut-1.firebasestorage.app`  
**To:** `sih-dec-2025.firebasestorage.app`

---

## ✅ COMPLETED CONFIGURATION UPDATES

### 1. Android Configuration Updated
**File:** `frontend/google-services.json`

**Changes:**
- ✅ Project ID: `sihtut-1` → `sih-dec-2025`
- ✅ Project Number: `929345200458` → `163692260644`
- ✅ Storage Bucket: `sihtut-1.firebasestorage.app` → `sih-dec-2025.firebasestorage.app`
- ✅ API Key: Updated to match new project
- ✅ Mobile SDK App ID: Updated to new project

### 2. Web/Expo Configuration Verified
**File:** `frontend/config/firebase.ts`

**Status:** ✅ Already correct
- Project ID: `sih-dec-2025` ✓
- Storage Bucket: `sih-dec-2025.firebasestorage.app` ✓
- All credentials match new project ✓

### 3. Expo Packager Configuration Updated
**File:** `frontend/app.json`

**Changes:**
- ✅ Packager host: `172.16.58.121` → `192.168.137.122` (matches .env)

### 4. Migration Script Created
**File:** `firebase-migration/migrate-video-urls.js`

**Purpose:** Updates all video and thumbnail URLs in database from old bucket to new bucket

---

## 🚀 STEP-BY-STEP EXECUTION GUIDE

### Step 1: Migrate Database URLs ⚡ CRITICAL

Run the migration script to update all video URLs in Firestore:

```powershell
cd firebase-migration
npm install firebase-admin
node migrate-video-urls.js
```

**Expected Output:**
```
🔄 Migrating videoLibrary URLs...
✏️  Updating video_abc123:
   OLD: https://firebasestorage.googleapis.com/v0/b/sihtut-1.firebasestorage.app/...
   NEW: https://firebasestorage.googleapis.com/v0/b/sih-dec-2025.firebasestorage.app/...
✅ Committed batch of X updates

📊 Video URL Migration Results:
   ✅ Updated: X
   ⏭️  Skipped: Y
```

**What it does:**
- ✅ Updates `videoLibrary` collection → `videoUrl` field
- ✅ Updates `videoLibrary` collection → `thumbnailUrl` field
- ✅ Checks other collections for old bucket references
- ✅ Uses batch writes for efficiency

**⚠️ CRITICAL:** Do NOT proceed to Step 2 until migration completes successfully!

---

### Step 2: Clean Prebuild Android Configuration

Remove old native build artifacts and regenerate with new config:

```powershell
cd ..\frontend
npx expo prebuild --clean --platform android
```

**What this does:**
- Removes `android/` folder completely
- Regenerates native Android project with updated `google-services.json`
- Links the new Firebase project (`sih-dec-2025`) to native code

**Expected Output:**
```
✔ Android prebuild complete
✔ google-services.json linked
```

---

### Step 3: Clear Expo Cache and Restart

Clear all caches to ensure new configuration is used:

```powershell
# Clear Expo cache
npx expo start --clear

# Or for a complete clean start:
rm -r node_modules/.cache
rm -r .expo
npx expo start --clear
```

---

### Step 4: Build and Run on Device

#### Option A: Android Device (Recommended for testing)

```powershell
# Build and install on connected Android device/emulator
npx expo run:android
```

**Requirements:**
- Android device connected via USB (with USB debugging enabled)
- OR Android emulator running

#### Option B: iOS Device (Mac only)

```powershell
npx expo prebuild --clean --platform ios
npx expo run:ios
```

---

### Step 5: Verify Video Playback

After app builds and installs:

#### Test 1: Assigned Videos (Incomplete)
1. Log in as **Supervisor** (`918074540124`)
2. Go to Video Assignment
3. Assign a video to a miner
4. Log out, log in as **Miner** (`918074540123`)
5. Go to **Miner Dashboard** → **Assigned Videos**
6. Click "Watch Video"
7. **Expected:** Video plays without error ✅
8. **Check console logs:**
   ```
   [VIDEO_URL] Original URL: https://...sih-dec-2025.firebasestorage.app/...
   [VIDEO_URL] Final URL: https://...sih-dec-2025.firebasestorage.app/...
   Video loading started for: https://...
   Video loaded: {...}
   ```

#### Test 2: Watch Videos (Completed)
1. Complete a video (watch to 100%)
2. Go to **Watch Videos** tab
3. **Expected:** Completed video appears in list ✅
4. Click to replay
5. **Expected:** Video plays without error ✅

#### Test 3: Supervisor Dashboard
1. Log in as **Supervisor**
2. Go to **Video Progress Dashboard**
3. **Expected:** Miner completion status shows "Completed" ✅
4. **Expected:** No "overdue" for completed videos ✅

---

## 🧪 VERIFICATION CHECKLIST

Use this checklist to verify the migration was successful:

### Configuration Verification
- [ ] `google-services.json` shows project: `sih-dec-2025`
- [ ] `firebase.ts` shows storageBucket: `sih-dec-2025.firebasestorage.app`
- [ ] `app.json` packagerOpts.host matches `.env` IP address
- [ ] No references to `sihtut-1` in frontend code (except backup files)

### Database Verification
- [ ] Run migration script completes without errors
- [ ] All video URLs in `videoLibrary` use `sih-dec-2025.firebasestorage.app`
- [ ] Thumbnail URLs also updated (if any)
- [ ] Query a sample video document and verify URL

### App Verification
- [ ] App builds successfully with `npx expo run:android`
- [ ] No NSURLErrorDomain -1008 errors in logs
- [ ] No AVPlayerItem failed errors in logs
- [ ] Video playback works in Assigned Videos
- [ ] Video playback works in Watch Videos
- [ ] Status consistency: Supervisor ↔ Miner dashboards match

### Console Logs Verification
Expected logs after successful migration:
```
[VIDEO_URL] Original URL: https://firebasestorage.googleapis.com/v0/b/sih-dec-2025.firebasestorage.app/...
[VIDEO_URL] Final URL: https://firebasestorage.googleapis.com/v0/b/sih-dec-2025.firebasestorage.app/...
[START_WATCHING] Video URL: https://firebasestorage.googleapis.com/v0/b/sih-dec-2025.firebasestorage.app/...
Video loading started for: https://...
Video loaded: {...}
[VIDEO_LOAD] Load finished successfully
```

**NO MORE:**
- ❌ `sihtut-1.firebasestorage.app` in URLs
- ❌ NSURLErrorDomain -1008 errors
- ❌ AVPlayerItem failed errors

---

## 🔧 TROUBLESHOOTING

### Issue 1: Migration Script Fails

**Error:** `Cannot find module 'firebase-admin'`

**Fix:**
```powershell
cd firebase-migration
npm install firebase-admin
```

**Error:** `Service account not found`

**Fix:** Ensure `new-serviceAccountKey.json` exists in `firebase-migration/` folder. Download from:
- Firebase Console → Project Settings → Service Accounts → Generate New Private Key

---

### Issue 2: Videos Still Show Old URLs

**Symptoms:** Console logs show `sihtut-1.firebasestorage.app` after migration

**Fix:**
1. Verify migration script ran successfully
2. Check Firestore directly (Firebase Console → Firestore → videoLibrary)
3. Look at a video document → `videoUrl` field should be `sih-dec-2025`
4. If still old, re-run migration script
5. Clear app cache and restart: `npx expo start --clear`

---

### Issue 3: App Build Fails After Prebuild

**Error:** `google-services.json is invalid`

**Fix:**
```powershell
# Verify google-services.json is valid JSON
Get-Content frontend\google-services.json | ConvertFrom-Json

# If error, manually download from Firebase Console
# Project: sih-dec-2025 → Settings → Your apps → Android → google-services.json
```

---

### Issue 4: Video Playback Still Fails with -1008

**Possible Causes:**
1. Migration script didn't run
2. Old app build cached
3. Network connectivity issue

**Diagnostic Steps:**
```powershell
# 1. Check database URLs
cd firebase-migration
node -e "
const admin = require('firebase-admin');
admin.initializeApp({
  credential: admin.credential.cert(require('./new-serviceAccountKey.json'))
});
admin.firestore().collection('videoLibrary').limit(1).get()
  .then(snap => {
    snap.docs.forEach(doc => console.log('URL:', doc.data().videoUrl));
    process.exit(0);
  });
"

# 2. Completely clean and rebuild
cd ..\frontend
rm -r android, ios, node_modules/.cache, .expo
npx expo prebuild --clean
npx expo start --clear
```

---

### Issue 5: Supervisor Shows Completed, Miner Shows Overdue

**Status:** This should be RESOLVED by previous status detection fixes

**If still occurs:**
1. Check console logs for progress data
2. Verify `AssignedVideos.tsx` lines 185-195 use triple-condition check
3. Verify `watch-video/index.tsx` lines 99-106 use same conditions
4. Verify `VideoProgressDashboard.tsx` line 282 checks `status === 'completed'`

**All three conditions must be checked:**
```typescript
const isCompleted = 
  progressData.watched === true ||
  progressData.status === 'completed' ||
  (progressData.progress || 0) >= 100;
```

---

## 📊 MIGRATION SUMMARY

### Files Modified
1. ✅ `frontend/google-services.json` - Android Firebase config updated
2. ✅ `frontend/app.json` - Packager host updated to match .env
3. ✅ `firebase-migration/migrate-video-urls.js` - Migration script created

### Files Verified (Already Correct)
1. ✅ `frontend/config/firebase.ts` - Web config already uses `sih-dec-2025`
2. ✅ `frontend/.env` - IP address already correct (`192.168.137.122`)
3. ✅ `frontend/storage.rules` - Rules are correct (no changes needed)
4. ✅ `frontend/firestore.rules` - Rules are correct (no changes needed)

### Database Collections Updated (by migration script)
1. ✅ `videoLibrary` → `videoUrl` field
2. ✅ `videoLibrary` → `thumbnailUrl` field

### Expected Outcome
After completing all steps:

**Before Migration:**
- ❌ Videos fail to load: NSURLErrorDomain -1008
- ❌ URLs reference: `sihtut-1.firebasestorage.app`
- ❌ Android config: Project `sihtut-1`
- ❌ Web config: Project `sih-dec-2025` (mismatch!)

**After Migration:**
- ✅ Videos load and play successfully
- ✅ All URLs reference: `sih-dec-2025.firebasestorage.app`
- ✅ Android config: Project `sih-dec-2025`
- ✅ Web config: Project `sih-dec-2025` (consistent!)
- ✅ No NSURLErrorDomain errors
- ✅ Status consistency across all dashboards

---

## 🎯 FINAL STEPS SUMMARY

Execute in this exact order:

```powershell
# 1. Migrate database URLs
cd firebase-migration
node migrate-video-urls.js

# 2. Clean prebuild (regenerate native config)
cd ..\frontend
npx expo prebuild --clean --platform android

# 3. Clear cache and restart
npx expo start --clear

# 4. Build and test (in separate terminal)
npx expo run:android

# 5. Test video playback on device
# - Log in as miner
# - Go to Assigned Videos
# - Click Watch Video
# - Verify: Video plays without -1008 error
```

---

## 📞 SUPPORT

If issues persist after following this guide:

1. Check console logs for `[VIDEO_URL]` messages
2. Verify Firestore URLs directly in Firebase Console
3. Ensure device is on same WiFi as dev machine (192.168.137.x)
4. Try on different device (iOS vs Android)
5. Check video backend server is NOT running (we're using Firebase Storage now)

---

**Migration Status:** ✅ READY TO EXECUTE  
**Estimated Time:** 15-20 minutes  
**Risk Level:** LOW (reversible, database backup exists)
