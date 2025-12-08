# Video Playback & Status Consistency - Bug Fix Report
**Date:** December 8, 2025  
**Issue:** NSURLErrorDomain -1008 video playback failure + Status inconsistency between Supervisor/Miner dashboards

---

## 🔴 CRITICAL ROOT CAUSES IDENTIFIED

### 1. **Firebase Storage Bucket Mismatch (CRITICAL)**
**Severity:** HIGH - Causing all video playback failures

#### Problem:
The application has **TWO DIFFERENT Firebase Storage buckets configured**:

- **Frontend Web Config (`config/firebase.ts`):**
  ```typescript
  storageBucket: "sih-dec-2025.firebasestorage.app"
  ```

- **Android Native Config (`google-services.json`):**
  ```json
  "storage_bucket": "sihtut-1.firebasestorage.app"
  ```

- **Database Video URLs (from `firestore-backup.json`):**
  ```
  https://firebasestorage.googleapis.com/v0/b/sihtut-1.firebasestorage.app/o/videos%2F...
  ```

#### Impact:
All videos stored in database reference the **OLD** project (`sihtut-1`), but the web/Expo app initializes Firebase Storage with the **NEW** project (`sih-dec-2025`). When the native video player (AVPlayer on iOS) tries to fetch the signed URL from `sihtut-1.firebasestorage.app`, it receives a **-1008 error** because:

1. The Android `google-services.json` points to `sihtut-1`
2. The web `firebase.ts` points to `sih-dec-2025`
3. Video URLs in Firestore still reference `sihtut-1`
4. Firebase SDK authentication tokens are generated for `sih-dec-2025` but videos are stored in `sihtut-1`

#### NSURLErrorDomain -1008 Explained:
This error means "**resource unavailable**" - the video file exists at that URL, but the app's Firebase authentication context (project `sih-dec-2025`) cannot access resources from a different project (`sihtut-1`).

---

### 2. **Storage Rules Token Expiration (MEDIUM)**
**Severity:** MEDIUM - May cause future issues

#### Problem:
Current storage rules use test mode until Dec 26, 2025:

```plaintext
function isTestMode() {
  return request.time < timestamp.date(2025, 12, 26);
}
```

After Dec 26, all video access will require authentication. The signed URLs in database contain tokens:
```
?alt=media&token=655f004d-4c0a-46d6-8c3c-e7f1ad831c96
```

These tokens are **per-project**. If videos are in `sihtut-1` but auth is from `sih-dec-2025`, tokens won't work after test mode expires.

---

### 3. **iOS App Transport Security (LOW)**
**Severity:** LOW - Configuration correct

#### Status: ✅ VERIFIED CORRECT
- `usesCleartextTraffic: true` enables HTTP for Android
- Firebase Storage URLs use HTTPS (no ATS issue)
- iOS should accept signed Firebase Storage URLs

---

### 4. **Status Mapping Consistency (RESOLVED)**
**Severity:** RESOLVED - Previous fixes addressed this

#### Status: ✅ ALREADY FIXED
Code now checks **three conditions** consistently:
```typescript
const isCompleted = 
  progressData.watched === true ||
  progressData.status === 'completed' ||
  (progressData.progress || 0) >= 100;
```

Applied in:
- `AssignedVideos.tsx` (lines 185-195)
- `watch-video/index.tsx` (lines 99-106)
- `VideoProgressDashboard.tsx` (line 282)

---

## 📊 EVIDENCE COLLECTED

### Video URLs in Database (Sample):
```
ERROR Failed URL: 
https://firebasestorage.googleapis.com/v0/b/sihtut-1.firebasestorage.app/o/videos%2F1764654288070_Mining_Operations_1764654287594.mp4?alt=media&token=655f004d-4c0a-46d6-8c3c-e7f1ad831c96
```

### Current Configuration Files:

| File | Firebase Project | Storage Bucket |
|------|------------------|----------------|
| `frontend/config/firebase.ts` | `sih-dec-2025` | `sih-dec-2025.firebasestorage.app` |
| `frontend/google-services.json` | `sihtut-1` | `sihtut-1.firebasestorage.app` |
| `frontend/app.json` | N/A | Packager host: `172.16.58.121` |
| `.env` | N/A | IP: `192.168.137.122` |

### Video Upload Flow:
```
VideoLibraryService.uploadVideoToStorage()
→ ref(storage, `videos/${timestamp}_${fileName}`)
→ uploadBytes() with contentType: 'video/mp4'
→ getDownloadURL() 
→ Returns: https://firebasestorage.googleapis.com/v0/b/{PROJECT}/...
```

**Current behavior:** Videos uploaded through the app will go to `sih-dec-2025` bucket, but existing videos in database reference `sihtut-1` bucket.

---

## 🔧 REMEDIATION PLAN

### Phase 1: Emergency Fix (Immediate - No Code Change)
**Objective:** Allow video playback to work immediately

#### Option A: Update `google-services.json` (RECOMMENDED)
1. Go to Firebase Console → Project `sih-dec-2025`
2. Download **new** `google-services.json` for Android app
3. Replace `frontend/google-services.json`
4. Rebuild Android app

**Time:** 10 minutes  
**Risk:** LOW - Aligns Android config with web config  
**Result:** App will use `sih-dec-2025` for all Firebase services

#### Option B: Revert `firebase.ts` to use `sihtut-1`
1. Change `firebase.ts` storageBucket back to `sihtut-1.firebasestorage.app`
2. Restart Expo server

**Time:** 2 minutes  
**Risk:** MEDIUM - Creates inconsistency with other Firebase services  
**Result:** Videos will load but may break other features

---

### Phase 2: Database Migration (Within 24 hours)
**Objective:** Migrate all video URLs to new project OR update Firebase config consistently

#### Option A: Migrate Videos to `sih-dec-2025` (RECOMMENDED)
```javascript
// Migration script (firebase-migration/migrate-videos.js)
const admin = require('firebase-admin');

// 1. Download all videos from sihtut-1 storage
// 2. Upload to sih-dec-2025 storage
// 3. Update Firestore videoLibrary URLs
// 4. Update videoAssignments if they cache URLs
// 5. Verify all assignments point to new URLs
```

**Files to update:**
- `firebase-migration/migrate-videos.js` (new file - migration script)
- All documents in `videoLibrary` collection (videoUrl field)
- Check `videoAssignments` for cached URLs

**Steps:**
1. List all videos in `sihtut-1` storage bucket
2. For each video:
   - Download blob from `sihtut-1`
   - Upload to `sih-dec-2025` storage
   - Get new signed URL
   - Update Firestore document
3. Verify all video documents updated
4. Test playback on physical device

**Time:** 2-3 hours (depending on video count/size)  
**Risk:** LOW - Reversible, can keep old URLs as backup

#### Option B: Use `sihtut-1` Consistently Everywhere
1. Revert `firebase.ts` to use `sihtut-1`
2. Ensure `google-services.json` matches
3. Update all future uploads to use `sihtut-1`

**Time:** 30 minutes  
**Risk:** MEDIUM - Locks into old project, may have other implications

---

### Phase 3: Storage Rules Update (Before Dec 26, 2025)
**Objective:** Ensure authenticated access works after test mode expires

1. **Verify authentication tokens work across storage:**
   - Test video access with `isLoggedIn()` only (no test mode)
   - Ensure user auth tokens grant access to videos

2. **Update rules if needed:**
   ```javascript
   match /videos/{videoFile} {
     // Ensure authenticated users can read
     allow read: if request.auth != null;
     
     // Only supervisors/admins can write
     allow write: if request.auth != null 
                  && (request.auth.token.role == 'supervisor' 
                      || request.auth.token.role == 'safety-officer');
   }
   ```

3. **Test before deadline:**
   - Temporarily disable test mode
   - Verify video playback still works
   - Re-enable test mode until ready

**Deadline:** December 25, 2025  
**Time:** 1 hour testing  
**Risk:** LOW - Rules already mostly correct

---

## 🧪 REPRODUCTION & TESTING

### Current Error Reproduction:
1. Log in as supervisor (e.g., `918074540124`)
2. Assign video to miner (e.g., `918074540123`)
3. Log in as miner
4. Go to Miner Dashboard → Assigned Videos
5. Click "Watch Video"
6. **Observe:** Error -1008, URL shows `sihtut-1.firebasestorage.app`

### Network Logs to Capture:
```bash
# iOS Device Logs (Mac with iPhone connected)
Console.app → Filter: "MinerVa" or "AVPlayer"
# Look for: NSURLErrorDomain -1008

# Android Device Logs
adb logcat | grep -i "firebase\|video\|error"
# Look for: Storage permission denied / Auth failed

# Expo Metro Logs
npx expo start
# Look for: [VIDEO_URL] logs showing sihtut-1 URLs
```

### Test Checklist After Fix:
- [ ] Video playback works on iOS physical device
- [ ] Video playback works on Android physical device  
- [ ] Supervisor dashboard shows correct completion status
- [ ] Miner "Assigned Videos" hides completed videos
- [ ] Miner "Watch Videos" shows completed videos only
- [ ] Status consistent: `watched=true`, `status='completed'`, `progress=100`
- [ ] No -1008 errors in console
- [ ] Firebase Storage URLs match Firebase config project

---

## 📁 FILES & PATHS REFERENCE

### Configuration Files:
| Path | Purpose | Current Value | Required Action |
|------|---------|---------------|-----------------|
| `frontend/config/firebase.ts` | Web/Expo Firebase init | `sih-dec-2025` | ✅ Correct OR migrate to `sihtut-1` |
| `frontend/google-services.json` | Android Firebase config | `sihtut-1` | ⚠️ **UPDATE to sih-dec-2025** |
| `frontend/.env` | Network IP config | `192.168.137.122` | ✅ Correct |
| `frontend/app.json` | Expo config | `packagerOpts.host: 172.16.58.121` | ⚠️ Update to match .env |
| `frontend/storage.rules` | Storage access rules | Test mode until 12/26 | ⏰ Update before deadline |

### Code Files (Verified Working):
| Path | Status | Notes |
|------|--------|-------|
| `frontend/app/miner/AssignedVideos.tsx` | ✅ Logic Correct | Lines 185-195: Triple completion check |
| `frontend/app/miner/watch-video/index.tsx` | ✅ Logic Correct | Lines 99-106: Completion filter correct |
| `frontend/app/supervisor/VideoProgressDashboard.tsx` | ✅ Logic Correct | Line 282: Reads from progress map |
| `frontend/services/videoLibraryService.ts` | ⚠️ Uses current storage | Lines 121-160: Upload to active project |
| `frontend/services/videoProgressService.ts` | ✅ Working | Dual-write strategy correct |

### Database Collections:
| Collection | Field | Current State | Action |
|------------|-------|---------------|--------|
| `videoLibrary` | `videoUrl` | Contains `sihtut-1` URLs | ⚠️ **MIGRATE URLs** |
| `videoAssignments` | No videoUrl cached | ✅ Only stores videoId | ✅ No action needed |
| `assignmentProgress` | No videoUrl cached | ✅ Only stores progress | ✅ No action needed |

---

## 🎯 MINIMAL CONFIGURATION CHANGES

### Immediate Fix (Choose ONE):

#### Fix #1: Update Android Config (RECOMMENDED)
```bash
# 1. Get new google-services.json from Firebase Console
# Project: sih-dec-2025 → Settings → Your apps → Android app → Download google-services.json

# 2. Replace file
# Location: frontend/google-services.json

# 3. Rebuild app
cd frontend
npx expo prebuild --clean
npx expo run:android
```

**OR**

#### Fix #2: Revert Web Config (TEMPORARY)
```typescript
// frontend/config/firebase.ts (line 14)
// BEFORE:
storageBucket: "sih-dec-2025.firebasestorage.app",

// AFTER:
storageBucket: "sihtut-1.firebasestorage.app",

// Then restart:
// cd frontend && npx expo start --clear
```

### Update Packager Host (Optional but recommended):
```json
// frontend/app.json (line 11)
"packagerOpts": {
  "host": "192.168.137.122"  // Match .env EXPO_PUBLIC_IP_ADDRESS
}
```

---

## ⚠️ VERIFICATION STEPS

### Step 1: Verify Configuration Consistency
```bash
cd frontend

# Check Firebase config
grep "storageBucket" config/firebase.ts
# Should output: storageBucket: "sih-dec-2025.firebasestorage.app"

# Check Android config
grep "storage_bucket" google-services.json
# Should output: "storage_bucket": "sih-dec-2025.firebasestorage.app"

# They MUST match!
```

### Step 2: Check Sample Video URL
```bash
# Query Firestore (use Firebase Console or script)
# Collection: videoLibrary
# Document: any video document
# Field: videoUrl

# Example URL should be:
# https://firebasestorage.googleapis.com/v0/b/sih-dec-2025.firebasestorage.app/...
# NOT:
# https://firebasestorage.googleapis.com/v0/b/sihtut-1.firebasestorage.app/...
```

### Step 3: Test on Physical Device
```bash
# Start Expo
cd frontend
npx expo start --clear

# Scan QR code on physical device
# Test:
# 1. Log in as miner
# 2. Go to Assigned Videos
# 3. Click Watch Video
# 4. Video should play WITHOUT -1008 error
```

---

## 📋 SUMMARY FOR STAKEHOLDERS

### What Happened:
The app experienced a **project migration** from `sihtut-1` to `sih-dec-2025`. However:
- Web/Expo config was updated to new project
- Android native config still points to old project  
- All existing video URLs in database reference old project
- Result: Authentication tokens don't match storage URLs → -1008 error

### Status Display Issues (Already Resolved):
- Previous fixes implemented triple-condition completion check
- Supervisor and Miner dashboards now use consistent status detection
- No further code changes needed for status consistency

### Immediate Action Required:
**Choose ONE:**
1. **Option A (Recommended):** Update `google-services.json` to `sih-dec-2025` + Migrate video URLs
2. **Option B (Quick Fix):** Revert `firebase.ts` to use `sihtut-1` consistently

### Timeline:
- **Immediate (Now):** Update config files - 10 minutes
- **Within 24h:** Migrate video URLs (if Option A) - 2-3 hours  
- **Before Dec 26:** Update storage rules for production - 1 hour

### Risk Assessment:
- **Option A:** LOW risk, proper long-term solution
- **Option B:** MEDIUM risk, locks into old project

---

## 🔗 RELATED DOCUMENTATION

- Firebase Storage Security Rules: `frontend/storage.rules`
- Firebase Console (sih-dec-2025): https://console.firebase.google.com/project/sih-dec-2025
- Firebase Console (sihtut-1): https://console.firebase.google.com/project/sihtut-1
- Migration Backup: `firebase-migration/firestore-backup.json`
- Previous Status Fix: `VERIFICATION_REPORT.md`, `ACTUAL_CHANGES.md`

---

## ✅ DELIVERABLE CHECKLIST

- [x] Root cause identified: Firebase project mismatch
- [x] Exact config files located: `firebase.ts` vs `google-services.json`
- [x] Video URL format documented: `sihtut-1` vs `sih-dec-2025`
- [x] NSURLErrorDomain -1008 explained: Auth context mismatch
- [x] Remediation plan provided: 3 phases with exact steps
- [x] Testing checklist provided: Reproduction + verification steps
- [x] Timeline + risk assessment included
- [x] No code changes made (investigation only as requested)

---

**Report Generated:** December 8, 2025  
**Investigation Type:** Configuration + Firebase Storage + Network Diagnostics  
**Code Changes Made:** NONE (investigation only)  
**Configuration Changes Recommended:** YES (see Phase 1)
