# Diagnostic Logging Added - Miner Dashboard Video Issues

## What Was Changed

Added comprehensive diagnostic logging to identify why videos are not appearing in:
1. **Miner Dashboard → Assigned Videos** (AssignedVideos.tsx)
2. **Watch Video → Watched Videos** (WatchVideoModule.tsx)

**NO FUNCTIONALITY WAS CHANGED** - Only logging was added to help diagnose the issue.

## Files Modified

1. `frontend/app/miner/AssignedVideos.tsx` - Added detailed logging for:
   - User information (ID, phone, name)
   - Query parameters
   - Query results (how many assignments found)
   - Supervisor filtering (why assignments might be skipped)
   - Video fetching (which videos found/missing)
   - Final results

2. `frontend/app/miner/WatchVideoModule.tsx` - Added detailed logging for:
   - User information
   - Assignments query results
   - Progress record checks
   - Completion status checks
   - Final results with diagnostics

## How to Test

### Step 1: Start the App
```powershell
cd frontend
npx expo start --clear
```

### Step 2: Test Assigned Videos
1. Log in as a miner
2. Navigate to their dashboard
3. Open Metro console (press `j` in terminal)
4. Look for logs starting with `[ASSIGNED_VIDEOS]`

**Expected Console Output:**
```
============================================================
[ASSIGNED_VIDEOS] Loading data for miner
[ASSIGNED_VIDEOS] User ID: <firestore_document_id>
[ASSIGNED_VIDEOS] User Phone: +91XXXXXXXXXX
[ASSIGNED_VIDEOS] User Name: <miner_name>
[ASSIGNED_VIDEOS] Query minerId: <firestore_document_id>
============================================================
[ASSIGNED_VIDEOS] Query returned X assignments
[ASSIGNED_VIDEOS] Sample assignment data:
[ASSIGNED_VIDEOS]   Assignment 1: { id: ..., assignedTo: [...], ... }
...
[ASSIGNED_VIDEOS] ✅ FINAL RESULT: X assignments loaded
============================================================
```

### Step 3: Test Watched Videos
1. While logged in as miner, go to Watch Video section
2. Switch to "Watched" tab
3. Check console for logs starting with `[WATCH_VIDEO]`

**Expected Console Output:**
```
============================================================
[WATCH_VIDEO] Loading completed videos
[WATCH_VIDEO] User ID: <firestore_document_id>
[WATCH_VIDEO] User Phone: +91XXXXXXXXXX
[WATCH_VIDEO] Query minerId: <firestore_document_id>
============================================================
[WATCH_VIDEO] Query returned X total assignments
...
[WATCH_VIDEO] ✅ FINAL RESULT: X completed videos loaded
============================================================
```

## Diagnostic Indicators

### If Assigned Videos Not Showing:

**Scenario 1: Query returns 0 assignments**
```
[ASSIGNED_VIDEOS] Query returned 0 assignments
```
**Issue:** The `assignedTo` array in Firestore doesn't contain the miner's document ID
**Check:** Open Firebase Console → videoAssignments → verify `assignedTo` array format

**Scenario 2: Assignments found but filtered out**
```
[ASSIGNED_VIDEOS] Query returned 5 assignments
[ASSIGNED_VIDEOS] ⏭️ Skipped: Different supervisor
[ASSIGNED_VIDEOS] ✅ FINAL RESULT: 0 assignments loaded
```
**Issue:** Supervisor mismatch - assignments were created by different supervisor
**Check:** Verify miner's `supervisorId` field matches assignment's `assignedBy` field

**Scenario 3: Videos missing from library**
```
[ASSIGNED_VIDEOS] Query returned 3 assignments
[ASSIGNED_VIDEOS] ❌ Video xyz123 not found in videoLibrary
```
**Issue:** Videos referenced in assignments don't exist in videoLibrary collection
**Check:** Verify video documents exist in Firestore videoLibrary collection

### If Watched Videos Not Showing:

**Scenario 1: No progress records**
```
[WATCH_VIDEO] Query returned 5 assignments
[WATCH_VIDEO]   ⏭️ Skipping - no progress record found
```
**Issue:** No documents in `assignmentProgress` collection
**Check:** Progress tracking not working - videos might not be saving completion status

**Scenario 2: Not marked as completed**
```
[WATCH_VIDEO]   ⏭️ Skipping - not marked as completed
[WATCH_VIDEO]      watched: false status: undefined progress: 50
```
**Issue:** Videos watched but not marked as complete (progress < 100%)
**Check:** Video progress tracking - ensure videos reach 100% to be marked complete

## Key Data Points to Collect

When reporting issues, provide:

1. **User Information:**
   - User ID (Firestore document ID)
   - User Phone number
   - User Name

2. **Query Results:**
   - How many assignments returned by query
   - Sample `assignedTo` array values
   - Sample `assignedBy` values

3. **Filtering Results:**
   - How many assignments before filtering
   - How many after filtering
   - Why assignments were skipped (supervisor mismatch, video missing, etc.)

4. **For Watched Videos:**
   - Progress record IDs being checked
   - Progress values (watched, status, progress percentage)
   - Whether videos marked as completed

## Next Steps Based on Logs

The console logs will reveal the exact issue. Common fixes:

1. **assignedTo format mismatch** → Update supervisor assignment creation code
2. **Supervisor mismatch** → Verify supervisor linkage during miner creation
3. **Missing videos** → Ensure videos exist before creating assignments
4. **No progress tracking** → Fix video player progress updates
5. **Completion threshold** → Adjust what counts as "watched" (currently 100%)

---

**Note:** This is diagnostic logging only. Once we identify the root cause from the logs, we'll apply the appropriate fix.
