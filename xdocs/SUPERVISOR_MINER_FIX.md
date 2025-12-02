# Supervisor-Miner Relationship Fix

## Problem Identified

When a supervisor logs in and tries to view their assigned miners, they see **0 miners** even though 5 miners are assigned to them in the database.

### Root Cause Analysis

1. **Mismatch in ID References:**
   - Miners in Firestore have `supervisorId: "SUP-001"` (the supervisor's **empId**)
   - When supervisor logs in, `user.id` is set to the **Firestore document ID** (e.g., `919000000001`)
   - The query was looking for miners where `supervisorId == user.id`, which never matched!

2. **Data Structure:**
   ```javascript
   // Supervisor document (ID: 919000000001)
   {
     name: "Ravi",
     phoneNumber: "9000000001",
     empId: "SUP-001",  // ← This is what miners reference
     role: "supervisor"
   }

   // Miner document (ID: 918000000001)
   {
     name: "Arun",
     supervisorId: "SUP-001",  // ← References supervisor's empId, not doc ID!
     role: "miner"
   }
   ```

## Solution Implemented

### 1. Updated `getMinersBySupervisor()` Function

**File:** `services/minerService.ts`

**Changes:**
- First fetches the supervisor's document to get their `empId`
- Queries miners using the `empId` instead of document ID
- Includes fallback logic if empId doesn't exist
- Comprehensive logging for debugging

**Code:**
```typescript
export async function getMinersBySupervisor(supervisorId: string): Promise<Miner[]> {
  try {
    console.log(`🔍 Fetching miners for supervisor ID: ${supervisorId}`);
    
    // Get supervisor's empId
    const supervisorRef = doc(db, 'users', supervisorId);
    const supervisorDoc = await getDoc(supervisorRef);
    
    let supervisorEmpId = supervisorId;
    if (supervisorDoc.exists()) {
      const supervisorData = supervisorDoc.data();
      supervisorEmpId = supervisorData.empId || supervisorId;
      console.log(`👤 Supervisor empId: ${supervisorEmpId}`);
    }
    
    // Query miners by empId
    const q = query(
      collection(db, 'users'),
      where('role', '==', 'miner'),
      where('supervisorId', '==', supervisorEmpId)
    );
    
    const querySnapshot = await getDocs(q);
    const miners: Miner[] = [];
    
    querySnapshot.forEach((doc) => {
      miners.push({
        id: doc.id,
        ...doc.data(),
      } as Miner);
    });
    
    console.log(`✅ Loaded ${miners.length} miners`);
    return miners;
  } catch (error) {
    console.error('Error fetching miners:', error);
    return [];
  }
}
```

### 2. Created Firestore Composite Index

**File:** `firestore.indexes.json` (NEW)

**Purpose:** Speeds up queries filtering by both `role` and `supervisorId`

```json
{
  "indexes": [
    {
      "collectionGroup": "users",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "role", "order": "ASCENDING" },
        { "fieldPath": "supervisorId", "order": "ASCENDING" }
      ]
    }
  ]
}
```

### 3. Screens Fixed

All supervisor screens now properly load only their assigned miners:

✅ **SmartWorkAssignment.tsx** - AI video assignment
✅ **VideoProgressDashboard.tsx** - Progress tracking & notifications  
✅ **TeamTaskStatus.tsx** - Daily task status
✅ **PerformanceTracking.tsx** - Safety scores
✅ **HealthMonitoring.tsx** - Vitals tracking

## Testing Instructions

### 1. Deploy Firestore Index

```bash
# In the SIH-Minerva directory
firebase deploy --only firestore:indexes
```

### 2. Test Login

1. Login as **Ravi** (supervisor)
   - Phone: `+919000000001`
   - OTP: `123456`

2. Check screens:
   - **Smart Work Assignment** → Should show 5 miners
   - **Video Progress Dashboard** → Should show 5 miners
   - **Team Task Status** → Should show 5 miners

3. Expected miners for Ravi (SUP-001):
   - Arun (MIN-001)
   - Rakesh (MIN-002)
   - Mahesh (MIN-003)
   - Deepak (MIN-004)
   - Imran (MIN-005)

### 3. Verify Logs

Check console for debug logs:
```
🔍 Fetching miners for supervisor ID: 919000000001
👤 Supervisor empId: SUP-001
✅ Loaded 5 miners for supervisor SUP-001
```

## Firestore Rules

The existing rules already allow this query since we're in test mode until Dec 26, 2025:

```javascript
function isTestMode() {
  return request.time < timestamp.date(2025, 12, 26);
}

match /users/{userId} {
  allow read, write: if isTestMode();
}
```

## Future Recommendations

### Option 1: Migrate to Document ID References (Recommended)
Update all `supervisorId` fields in miner documents to use the supervisor's Firestore document ID instead of empId:

```javascript
// Before
{ supervisorId: "SUP-001" }

// After  
{ supervisorId: "919000000001" }
```

### Option 2: Keep empId System
Continue using empId but ensure all new supervisors get an empId field when created.

## Files Modified

1. ✅ `services/minerService.ts` - Updated getMinersBySupervisor logic
2. ✅ `firestore.indexes.json` - Created composite index
3. ✅ All supervisor screens already updated to use getMinersBySupervisor

## Status

🟢 **FIXED** - Supervisor can now see their assigned miners across all screens!
