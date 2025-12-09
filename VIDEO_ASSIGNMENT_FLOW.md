# Video Assignment Flow - Complete Documentation

## Overview
When a supervisor assigns a video to miners, here's the complete journey from assignment to display.

---

## 📊 Flow Diagram

```
Supervisor (SmartWorkAssignment.tsx)
    ↓
1. Searches for videos matching work description
    ↓
2. Selects a matched video from videoLibrary
    ↓
3. Selects miners to assign
    ↓
4. Creates assignment → Firestore: videoAssignments collection
    ↓
5. Creates notifications → Firestore: notifications collection
    ↓
Miner (MinerHome.tsx)
    ↓
6. Clicks "Watch Video" button
    ↓
7. Routes to /miner/AssignedVideos
    ↓
AssignedVideos.tsx
    ↓
8. Queries videoAssignments where assignedTo contains miner ID
    ↓
9. Fetches video details from videoLibrary
    ↓
10. Displays incomplete assignments
    ↓
11. Miner watches video
    ↓
12. Progress saved to assignmentProgress collection
```

---

## 🔍 Detailed Breakdown

### Step 1-3: Supervisor Assignment (SmartWorkAssignment.tsx)

**Location:** `frontend/app/supervisor/SmartWorkAssignment.tsx`

**Function:** `assignVideoToMiners()` (Line 180)

**What Happens:**
1. Supervisor enters work description
2. System searches videoLibrary for matching videos
3. Shows matched videos with similarity scores
4. Supervisor selects best match
5. Selects miners from assigned team
6. Sets deadline and priority

---

### Step 4: Create Assignment in Firestore

**Collection:** `videoAssignments`
**Document ID:** `assignment_${timestamp}_${random}`

**Data Structure:**
```javascript
{
  id: "assignment_1733745600_abc123",
  videoId: "video_safety_training_001",  // Reference to videoLibrary
  videoTopic: "Underground Safety Procedures",
  workTitle: "Daily Safety Training",
  assignedTo: ["1234567890", "800000001"],  // Array of miner IDs
  assignedBy: "1234567892",  // Supervisor ID
  assignedAt: Timestamp,
  deadline: Timestamp,
  isMandatory: true,
  isDailyTask: true,
  taskDate: "2025-12-09",
  departments: ["Mining Operations"],
  description: "Watch and understand safety protocols",
  status: "active",
  priority: "high",
  progress: {
    "1234567890": {
      status: "pending",
      watchedDuration: 0,
      totalDuration: 0,
      completedAt: null
    },
    "800000001": {
      status: "pending",
      watchedDuration: 0,
      totalDuration: 0,
      completedAt: null
    }
  }
}
```

**Key Points:**
- ✅ `assignedTo` is an array of miner IDs
- ✅ `videoId` references the video in `videoLibrary` collection
- ✅ Each miner gets a progress entry in the `progress` map
- ✅ Document saved with `setDoc()` to ensure specific ID

---

### Step 5: Create Notifications

**Collection:** `notifications`
**For Each:** Assigned miner

**Data Structure:**
```javascript
{
  recipientId: "1234567890",  // Miner ID
  recipientName: "Miner Test User",
  senderId: "1234567892",  // Supervisor ID
  senderName: "Supervisor Test User",
  type: "video_assignment",
  title: "📹 New Training Video Assigned",
  message: "You have been assigned to watch 'Underground Safety' for 2025-12-09",
  priority: "high",
  read: false,
  actionRequired: true,
  createdAt: Timestamp,
  metadata: {
    assignmentId: "assignment_1733745600_abc123",
    videoId: "video_safety_training_001",
    videoTopic: "Underground Safety Procedures",
    deadline: Timestamp,
    taskDate: "2025-12-09"
  }
}
```

---

### Step 6-7: Miner Dashboard (MinerHome.tsx)

**Location:** `frontend/app/miner/MinerHome.tsx`

**UI Element:** (Line ~147)
```tsx
{
  icon: Video,
  label: 'Watch Video',
  route: '/miner/AssignedVideos',
  completed: moduleProgress.video,
  locked: false
}
```

**What Miner Sees:**
- 🎬 "Watch Video" card in Training Modules section
- Completion badge if videos are completed
- Click navigates to `/miner/AssignedVideos`

---

### Step 8-9: Load Assigned Videos (AssignedVideos.tsx)

**Location:** `frontend/app/miner/AssignedVideos.tsx`

**Function:** `loadData()` (Line 91)

**Query Logic:**
```javascript
// 1. Query videoAssignments
const assignmentsQuery = query(
  collection(db, 'videoAssignments'),
  where('assignedTo', 'array-contains', currentMinerId),  // Current miner's ID
  where('status', '==', 'active')
);

// 2. For each assignment, fetch video details
const videoDoc = await getDoc(doc(db, 'videoLibrary', assignmentData.videoId));

// 3. Fetch progress
const progressDoc = await getDoc(
  doc(db, 'assignmentProgress', `${assignmentId}_${minerId}`)
);
```

**Important:** The query uses `array-contains` to find all assignments where the miner's ID is in the `assignedTo` array.

---

### Step 10: Display Logic

**Filter:** Only shows **incomplete** assignments

```javascript
const myAssignments = useMemo(() => {
  return assignments.filter(assignment => {
    // 1. Check if assigned to current miner
    if (!assignment.assignedTo.includes(currentMinerId)) return false;
    
    // 2. Find progress record
    const progress = assignmentProgress.find(p =>
      p.assignmentId === assignment.id && p.minerId === currentMinerId
    );
    
    // 3. Only show if NOT completed
    // progress.watched is true if: watched=true OR status='completed' OR progress>=100
    return !progress?.watched;
  });
}, [assignments, assignmentProgress, currentMinerId]);
```

**UI Display:**
- ✅ Pending assignments (red icon)
- ✅ In-progress assignments (yellow icon)
- ❌ Completed assignments (hidden from list, shown in "Completed" tab)

---

## 🐛 Common Issues & Solutions

### Issue 1: Miner ID Mismatch
**Problem:** Assignment created with wrong miner ID format

**Check:**
- Supervisor document has correct `assignedMiners` array
- Miner document exists with correct ID
- Assignment uses exact same ID as miner document

**Solution:**
```javascript
// Verify IDs match
console.log('Miner Doc ID:', minerDocId);  // e.g., "1234567890"
console.log('Assignment assignedTo:', assignment.assignedTo);  // Should include "1234567890"
```

---

### Issue 2: Video Not Found
**Problem:** Video exists in assignment but not in videoLibrary

**Check:**
```javascript
// In AssignedVideos.tsx line 143-147
const videoDoc = await getDoc(doc(db, 'videoLibrary', assignmentData.videoId));
if (!videoDoc.exists()) {
  console.log('❌ Video not found:', assignmentData.videoId);
}
```

**Solution:** Ensure video exists in `videoLibrary` collection before assigning

---

### Issue 3: Assignment Not Appearing
**Problem:** Assignment created but miner doesn't see it

**Debug Checklist:**
1. ✅ Check assignment exists in Firestore `videoAssignments`
2. ✅ Verify `assignedTo` array contains correct miner ID
3. ✅ Confirm `status` is "active"
4. ✅ Check video exists in `videoLibrary` with matching `videoId`
5. ✅ Verify miner is logged in with correct user ID
6. ✅ Check assignment isn't already marked as completed

**Debug Query:**
```javascript
// Run in Firebase Console or debug script
const assignments = await getDocs(
  query(
    collection(db, 'videoAssignments'),
    where('assignedTo', 'array-contains', '1234567890'),  // Your miner ID
    where('status', '==', 'active')
  )
);
console.log('Found assignments:', assignments.size);
```

---

## 📝 Data Flow Summary

| Collection | Document ID | Purpose |
|-----------|-------------|---------|
| `videoLibrary` | `video_id` | Stores video URLs, topics, metadata |
| `videoAssignments` | `assignment_id` | Links videos to miners with deadlines |
| `assignmentProgress` | `{assignmentId}_{minerId}` | Tracks watch progress and completion |
| `notifications` | Auto-generated | Notifies miners of new assignments |
| `users` | `minerId` / `supervisorId` | User profiles with roles |

---

## 🎯 Key Takeaways

1. **Miner ID is Critical:** Must match exactly between:
   - User document ID in `users` collection
   - `assignedTo` array in `videoAssignments`
   - Query parameter in `AssignedVideos.tsx`

2. **Two Collections Required:**
   - `videoLibrary` (video content)
   - `videoAssignments` (who should watch what)

3. **Progress Tracking:**
   - Separate `assignmentProgress` collection
   - Composite key: `${assignmentId}_${minerId}`
   - Multiple completion conditions (watched/status/progress)

4. **UI Filters:**
   - Miner dashboard only shows **incomplete** assignments
   - Completed videos hidden from main list
   - Shown in separate "Completed" tab

---

## 🧪 Testing the Flow

### Test Assignment:
1. Login as supervisor: `+911234567892`, OTP: `111111`
2. Go to Smart Work Assignment
3. Enter work description
4. Select matched video
5. Select miner: `1234567890`
6. Assign video

### Verify on Miner:
1. Login as miner: `+911234567890`, OTP: `222222`
2. Go to Miner Dashboard
3. Click "Watch Video"
4. Should see assigned video in pending list

### Check Firestore:
```
videoAssignments/{assignmentId}
  └── assignedTo: ["1234567890"]
  └── videoId: "video_xxx"
  └── status: "active"

videoLibrary/{videoId}
  └── topic: "..."
  └── videoUrl: "..."
```

---

## 🔧 Quick Fix Script

If assignments aren't showing, run this verification:

```javascript
// In frontend/scripts/verifyAssignment.js
const minerId = '1234567890';

// 1. Check user exists
const userDoc = await getDoc(doc(db, 'users', minerId));
console.log('User exists:', userDoc.exists());

// 2. Check assignments
const assignments = await getDocs(
  query(
    collection(db, 'videoAssignments'),
    where('assignedTo', 'array-contains', minerId)
  )
);
console.log('Assignments found:', assignments.size);

// 3. Check each video exists
for (const assignment of assignments.docs) {
  const videoDoc = await getDoc(
    doc(db, 'videoLibrary', assignment.data().videoId)
  );
  console.log('Video exists:', videoDoc.exists());
}
```

---

**Last Updated:** December 9, 2025
**Author:** GitHub Copilot
**Project:** SIH-Minerva Mining Safety Platform
