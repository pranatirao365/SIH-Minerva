# 🎯 Watch Video Module & Assigned Videos - Quick Reference

## 📱 User Interface Layout

### WATCH VIDEO MODULE (WatchVideoModule.tsx)

```
┌─────────────────────────────────────────────────────────┐
│                 Watch Video Module                      │
│  [← Back]                                               │
├─────────────────────────────────────────────────────────┤
│  ┌──────────────────┬──────────────────────────────┐   │
│  │ Training Model   │   Watched Videos             │   │
│  │   (Active)       │   (Inactive)                 │   │
│  └──────────────────┴──────────────────────────────┘   │
├─────────────────────────────────────────────────────────┤
│                                                          │
│  TAB A - TRAINING MODEL (Static Content)                │
│  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━  │
│                                                          │
│  📚 Training Model Content                               │
│  Access general safety training materials               │
│                                                          │
│  ┌────────────────────────────────────────────────┐    │
│  │ 📖  Safety Fundamentals                        │    │
│  │     Learn basic principles of mine safety      │    │
│  │     [Start Learning]                           │    │
│  └────────────────────────────────────────────────┘    │
│                                                          │
│  ┌────────────────────────────────────────────────┐    │
│  │ 🦺  PPE Guidelines                              │    │
│  │     Understand proper use of PPE               │    │
│  │     [Start Learning]                           │    │
│  └────────────────────────────────────────────────┘    │
│                                                          │
│  ┌────────────────────────────────────────────────┐    │
│  │ 🚨  Emergency Response                          │    │
│  │     Critical emergency procedures              │    │
│  │     [Start Learning]                           │    │
│  └────────────────────────────────────────────────┘    │
│                                                          │
│  💡 These modules are available anytime               │
│                                                          │
└─────────────────────────────────────────────────────────┘
```

```
┌─────────────────────────────────────────────────────────┐
│                 Watch Video Module                      │
│  [← Back]                                               │
├─────────────────────────────────────────────────────────┤
│  ┌──────────────────┬──────────────────────────────┐   │
│  │ Training Model   │   Watched Videos             │   │
│  │ (Inactive)       │   (Active)                   │   │
│  └──────────────────┴──────────────────────────────┘   │
├─────────────────────────────────────────────────────────┤
│                                                          │
│  TAB B - WATCHED VIDEOS (Dynamic from Firestore)        │
│  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━  │
│                                                          │
│  ✅ Completed Videos (3)                                 │
│  Videos you have successfully watched and completed     │
│                                                          │
│  ┌────────────────────────────────────────────────┐    │
│  │ 🎥  Hazard Identification Training              │    │
│  │     Completed: Dec 7, 2025                     │    │
│  │     Duration: 15 min                           │    │
│  │     ✅ Completed                                │    │
│  │     [▶ Watch Again]                            │    │
│  └────────────────────────────────────────────────┘    │
│                                                          │
│  ┌────────────────────────────────────────────────┐    │
│  │ 🎥  PPE Safety Procedures                       │    │
│  │     Completed: Dec 6, 2025                     │    │
│  │     Duration: 10 min                           │    │
│  │     ✅ Completed                                │    │
│  │     [▶ Watch Again]                            │    │
│  └────────────────────────────────────────────────┘    │
│                                                          │
│  ┌────────────────────────────────────────────────┐    │
│  │ 🎥  Emergency Evacuation Protocol               │    │
│  │     Completed: Dec 5, 2025                     │    │
│  │     Duration: 20 min                           │    │
│  │     ✅ Completed                                │    │
│  │     [▶ Watch Again]                            │    │
│  └────────────────────────────────────────────────┘    │
│                                                          │
└─────────────────────────────────────────────────────────┘
```

---

### ASSIGNED VIDEOS MODULE (AssignedVideos.tsx)

```
┌─────────────────────────────────────────────────────────┐
│                 Assigned Videos                         │
│  [← Back]                                               │
├─────────────────────────────────────────────────────────┤
│                                                          │
│  Your Assignments                                        │
│  3 assignments                                           │
│                                                          │
│  ┌────────────────────────────────────────────────┐    │
│  │ Hazard Identification Training                 │    │
│  │ ⚠️ Mandatory • ⏰ Due: Dec 10, 2025             │    │
│  │ Learn to identify potential hazards...         │    │
│  │                                      ⏳ Pending │    │
│  │ [▶️ Watch Video]                               │    │
│  │ Progress: 0%                                   │    │
│  │ ▪▪▪▪▪▪▪▪▪▪▪▪▪▪▪▪▪▪▪▪                           │    │
│  └────────────────────────────────────────────────┘    │
│                                                          │
│  ┌────────────────────────────────────────────────┐    │
│  │ PPE Safety Procedures                          │    │
│  │ ⚠️ Mandatory • ⏰ Due: Dec 9, 2025              │    │
│  │ Proper use of personal protective equipment    │    │
│  │                                      ⏳ Pending │    │
│  │ [▶️ Watch Video]                               │    │
│  │ Progress: 0%                                   │    │
│  │ ▪▪▪▪▪▪▪▪▪▪▪▪▪▪▪▪▪▪▪▪                           │    │
│  └────────────────────────────────────────────────┘    │
│                                                          │
│  ┌────────────────────────────────────────────────┐    │
│  │ Emergency Evacuation Protocol                  │    │
│  │ ⚠️ Mandatory • ⏰ Due: Dec 8, 2025              │    │
│  │ Critical emergency procedures and exits        │    │
│  │                                      ⏳ Pending │    │
│  │ [▶️ Watch Video]                               │    │
│  │ Progress: 0%                                   │    │
│  │ ▪▪▪▪▪▪▪▪▪▪▪▪▪▪▪▪▪▪▪▪                           │    │
│  └────────────────────────────────────────────────┘    │
│                                                          │
└─────────────────────────────────────────────────────────┘
```

---

## 🔄 Data Flow Diagram

```
┌──────────────────────────────────────────────────────────────────┐
│                         FIRESTORE                                │
└──────────────────────────────────────────────────────────────────┘
                               │
                               │ Query
                               ▼
┌──────────────────────────────────────────────────────────────────┐
│               getValidAssignedVideos(minerId)                    │
│                                                                   │
│  1. Query videoAssignments                                       │
│     • where('assignedTo', 'array-contains', minerId)            │
│     • where('status', '==', 'active')                           │
│                                                                   │
│  2. Validate Supervisor                                          │
│     • Check assignedBy === miner.supervisorId                   │
│     • Skip if not from miner's supervisor                       │
│                                                                   │
│  3. Join videoLibrary/{videoId}                                  │
│     • Fetch video details (topic, url, thumbnail)               │
│     • Skip if video missing or invalid                          │
│                                                                   │
│  4. Join assignmentProgress/{assignmentId}_{minerId}             │
│     • Fetch completion status                                    │
│     • watched, progress, completedAt                            │
│                                                                   │
│  5. Return EnrichedAssignment[]                                  │
│     • { assignment, video, progress, isValid: true }            │
└──────────────────────────────────────────────────────────────────┘
                               │
                               │ Data
                               ▼
┌──────────────────────────────────────────────────────────────────┐
│                    ASSIGNED VIDEOS SCREEN                        │
│                                                                   │
│  • Display all pending assignments                               │
│  • Show video topic, deadline, description                       │
│  • Display progress bar                                          │
│  • Status badges (Pending, Overdue, Completed)                  │
│  • Watch button to start video                                   │
│                                                                   │
│  NO STATIC DATA - 100% from Firestore                           │
└──────────────────────────────────────────────────────────────────┘
                               │
                               │ Filter completed
                               ▼
┌──────────────────────────────────────────────────────────────────┐
│                  WATCH VIDEO MODULE                              │
│                                                                   │
│  TAB A - Training Model                                          │
│  • Static content only                                           │
│  • Training cards with educational info                          │
│  • No dynamic data                                               │
│                                                                   │
│  TAB B - Watched Videos                                          │
│  • Filter: progress.watched === true                             │
│  • OR progress.progress >= 100                                   │
│  • OR status === 'completed'                                     │
│  • Show completion date, duration                                │
│  • Rewatch functionality                                         │
│  • Sorted by completion date (newest first)                      │
│                                                                   │
│  NO STATIC DATA in Watched Videos tab                           │
└──────────────────────────────────────────────────────────────────┘
```

---

## 📊 Data Structure

### EnrichedAssignment (returned by service)

```typescript
{
  assignment: {
    id: "assignment_123",
    videoId: "video_456",
    videoTopic: "Hazard Identification",
    assignedTo: ["miner_789"],
    assignedBy: "supervisor_012",  // Must match miner's supervisor
    deadline: 1733961600000,
    isMandatory: true,
    assignedAt: 1733788800000,
    description: "Learn to identify hazards"
  },
  video: {
    id: "video_456",
    topic: "Hazard Identification Training",
    language: "en",
    videoUrl: "https://example.com/video.mp4",
    timestamp: 1733702400000,
    thumbnail: "https://example.com/thumb.jpg"
  },
  progress: {
    assignmentId: "assignment_123",
    minerId: "miner_789",
    watched: false,        // ← Key for filtering completed
    watchedAt: undefined,
    progress: 0            // ← 0-100 percentage
  },
  isValid: true
}
```

---

## ✅ Completion Detection Logic

A video is considered **COMPLETED** if **ANY** of these conditions are true:

```typescript
// In Watch Video Module - Watched Videos tab
const isCompleted = 
  item.progress?.watched === true ||              // 1. Explicit flag
  item.progress?.watchedAt !== undefined ||       // 2. Has completion timestamp
  (item.progress?.progress ?? 0) >= 100;          // 3. Progress is 100%

// Additional check in assignmentProgress collection
const status = progress.status === 'completed';   // 4. Status field

// Or in progress map
const mapStatus = progressMap[minerId].status === 'completed';  // 5. Map status
```

---

## 🔍 Filtering & Validation

### Assigned Videos Screen

```typescript
// Already filtered by service:
✅ minerId === current miner
✅ supervisorId === miner's supervisor
✅ video exists in videoLibrary
✅ video has valid data (topic, videoUrl)

// Additional component filter:
const myAssignments = assignments.filter(assignment => 
  assignment.assignedTo.includes(currentMinerId)
);

// Result: Only valid assignments from miner's supervisor
```

### Watched Videos Tab

```typescript
// Start with all valid assignments
const allAssignments = await getValidAssignedVideos(minerId);

// Filter only completed
const completedVideos = allAssignments
  .filter(item => {
    const isWatched = item.progress?.watched === true;
    const hasCompletedAt = item.progress?.watchedAt !== undefined;
    const progressComplete = (item.progress?.progress ?? 0) >= 100;
    
    return isWatched || hasCompletedAt || progressComplete;
  })
  .sort((a, b) => b.completedAt - a.completedAt);

// Result: Only completed assignments, newest first
```

---

## 🎨 Visual States

### Loading State
```
┌────────────────────────────────┐
│      🔄 Loading...              │
│                                 │
│  (ActivityIndicator)            │
└────────────────────────────────┘
```

### Empty State (No Assignments)
```
┌────────────────────────────────┐
│      📹                         │
│   No assignments                │
│                                 │
│   You don't have any video      │
│   assignments at the moment     │
└────────────────────────────────┘
```

### Empty State (No Completed Videos)
```
┌────────────────────────────────┐
│      ✅                         │
│   No Completed Videos           │
│                                 │
│   Videos you complete from      │
│   your assignments will         │
│   appear here.                  │
│                                 │
│   [View Assignments]            │
└────────────────────────────────┘
```

### Error State
```
┌────────────────────────────────┐
│      ❌                         │
│   Failed to load videos         │
│                                 │
│   Please check your connection  │
│   and try again.                │
│                                 │
│   [Retry]                       │
└────────────────────────────────┘
```

---

## 🚀 Quick Usage

### For Developers

```typescript
// 1. Import the service
import { getValidAssignedVideos } from '@/services/validatedAssignmentsService';

// 2. Fetch assignments
const enrichedAssignments = await getValidAssignedVideos(minerId);

// 3. Use the data
enrichedAssignments.forEach(item => {
  console.log('Video:', item.video.topic);
  console.log('Assigned by:', item.assignment.assignedBy);
  console.log('Completed:', item.progress?.watched);
});

// 4. Filter completed
const completed = enrichedAssignments.filter(item => 
  item.progress?.watched === true
);

// 5. Render
<FlatList
  data={enrichedAssignments}
  renderItem={({ item }) => (
    <VideoCard 
      title={item.video.topic}
      url={item.video.videoUrl}
      completed={item.progress?.watched}
    />
  )}
/>
```

---

## 📝 Summary

✅ **Watch Video Module**
- Tab A: Static training content
- Tab B: Dynamic completed videos from Firestore
- Simple header toggle, no crashes

✅ **Assigned Videos**
- 100% dynamic data from Firestore
- Zero static/mock data
- Proper supervisor filtering
- Safe fallback handling
- Real-time progress tracking

**Status: PRODUCTION READY** 🎉
