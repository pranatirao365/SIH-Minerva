# Video Assignment System - API Quick Reference

## 📚 Service Methods

### 1. **validatedAssignmentsService.ts**

#### `getValidAssignedVideos(minerId: string)`
Fetches all valid video assignments for a miner with full validation.

```typescript
import { getValidAssignedVideos } from '@/services/validatedAssignmentsService';

// Usage
const assignments = await getValidAssignedVideos(minerId);

// Returns: EnrichedAssignment[]
[{
  assignment: {
    id: string,
    videoId: string,
    videoTopic: string,
    assignedTo: string[],
    assignedBy: string,
    deadline: number,
    isMandatory: boolean,
    assignedAt: number,
    description?: string
  },
  video: {
    id: string,
    topic: string,
    language: string,
    videoUrl: string,
    timestamp: number,
    thumbnail?: string
  },
  progress: {
    assignmentId: string,
    minerId: string,
    watched: boolean,
    watchedAt?: number,
    progress: number
  },
  isValid: true
}]
```

**Features:**
- ✅ Filters by supervisor
- ✅ Validates video exists
- ✅ Joins progress data
- ✅ Safe error handling

---

#### `updateVideoProgress(assignmentId, minerId, progressPercent, isCompleted)`
Updates video watch progress in both locations.

```typescript
import { updateVideoProgress } from '@/services/validatedAssignmentsService';

// Usage
await updateVideoProgress(
  assignmentId,
  minerId,
  85,      // progress percentage
  false    // is completed
);
```

**Writes to:**
1. `videoAssignments/{id}/progress/{minerId}`
2. `assignmentProgress/{assignmentId}_{minerId}`

---

### 2. **videoProgressService.ts**

#### `startVideoProgress(assignmentId, minerId, videoId, totalDuration)`
Initialize progress tracking when video playback starts.

```typescript
import { startVideoProgress } from '@/services/videoProgressService';

// Usage
await startVideoProgress(
  'assignment_123',
  'miner_456',
  'video_789',
  600  // total duration in seconds
);
```

---

#### `updateVideoProgress(update: VideoProgressUpdate)`
Update progress during video playback.

```typescript
import { updateVideoProgress } from '@/services/videoProgressService';

// Usage
await updateVideoProgress({
  assignmentId: 'assignment_123',
  minerId: 'miner_456',
  videoId: 'video_789',
  watchedDuration: 450,    // seconds watched
  totalDuration: 600,      // total seconds
  progressPercent: 75,     // 0-100
  isCompleted: false
});
```

**Recommended:** Call every 5-10 seconds during playback.

---

#### `markVideoAsCompleted(assignmentId, minerId, videoId, totalDuration)`
Mark video as fully completed (convenience method).

```typescript
import { markVideoAsCompleted } from '@/services/videoProgressService';

// Usage
await markVideoAsCompleted(
  'assignment_123',
  'miner_456',
  'video_789',
  600
);
```

---

#### `getVideoProgress(assignmentId, minerId)`
Get current progress for an assignment.

```typescript
import { getVideoProgress } from '@/services/videoProgressService';

// Usage
const progress = await getVideoProgress('assignment_123', 'miner_456');

// Returns: VideoProgressData | null
{
  assignmentId: string,
  minerId: string,
  videoId: string,
  watched: boolean,
  status: 'not_started' | 'in_progress' | 'completed' | 'overdue',
  progress: number,
  watchedDuration: number,
  totalDuration: number,
  startedAt?: Timestamp,
  completedAt?: Timestamp,
  lastWatchedAt: Timestamp,
  watchCount: number
}
```

---

#### `getCompletedVideosForMiner(minerId)`
Get all completed videos for a miner.

```typescript
import { getCompletedVideosForMiner } from '@/services/videoProgressService';

// Usage
const completedVideos = await getCompletedVideosForMiner('miner_456');

// Returns: VideoProgressData[] (sorted by completion date)
```

---

#### `getInProgressVideosForMiner(minerId)`
Get all in-progress videos for a miner.

```typescript
import { getInProgressVideosForMiner } from '@/services/videoProgressService';

// Usage
const inProgressVideos = await getInProgressVideosForMiner('miner_456');
```

---

#### `getMinerCompletionStats(minerId)`
Get completion statistics for a miner.

```typescript
import { getMinerCompletionStats } from '@/services/videoProgressService';

// Usage
const stats = await getMinerCompletionStats('miner_456');

// Returns:
{
  totalAssigned: number,
  completed: number,
  inProgress: number,
  notStarted: number,
  completionRate: number  // percentage
}
```

---

#### `areAllMandatoryVideosCompleted(minerId)`
Check if all mandatory videos are completed.

```typescript
import { areAllMandatoryVideosCompleted } from '@/services/videoProgressService';

// Usage
const canAccessWork = await areAllMandatoryVideosCompleted('miner_456');

if (canAccessWork) {
  // Allow access to work routes
} else {
  // Show mandatory videos message
}
```

---

#### `resetVideoProgress(assignmentId, minerId)`
Reset progress for re-watching (increments watch count).

```typescript
import { resetVideoProgress } from '@/services/videoProgressService';

// Usage
await resetVideoProgress('assignment_123', 'miner_456');
```

---

### 3. **supervisorVideoAssignmentService.ts**

#### `createVideoAssignment(assignmentData)`
Create a new video assignment and send notifications.

```typescript
import { createVideoAssignment } from '@/services/supervisorVideoAssignmentService';

// Usage
const result = await createVideoAssignment({
  videoId: 'video_789',
  videoTopic: 'Safety Procedures',
  workTitle: 'Daily Safety Briefing',
  workDescription: 'Complete safety training before shift',
  workDate: '2025-12-08',
  assignedMinerIds: ['miner_1', 'miner_2', 'miner_3'],
  supervisorId: 'supervisor_123',
  supervisorName: 'John Doe',
  language: 'en',
  priority: 'high'
});

// Returns: AssignmentResult
{
  assignmentId: string,
  success: boolean,
  notificationsSent: number,
  errors: string[]
}
```

**Features:**
- ✅ Creates assignment document
- ✅ Initializes progress map
- ✅ Sends notifications to miners
- ✅ Handles errors gracefully

---

#### `getSupervisorAssignments(supervisorId)`
Get all assignments created by a supervisor.

```typescript
import { getSupervisorAssignments } from '@/services/supervisorVideoAssignmentService';

// Usage
const assignments = await getSupervisorAssignments('supervisor_123');
```

---

#### `getAssignmentCompletionSummary(assignmentId)`
Get completion summary for an assignment.

```typescript
import { getAssignmentCompletionSummary } from '@/services/supervisorVideoAssignmentService';

// Usage
const summary = await getAssignmentCompletionSummary('assignment_123');

// Returns:
{
  totalMiners: number,
  completed: number,
  pending: number,
  completionRate: number
}
```

---

#### `getMinerProgressForAssignment(assignmentId, minerId)`
Get specific miner's progress for an assignment.

```typescript
import { getMinerProgressForAssignment } from '@/services/supervisorVideoAssignmentService';

// Usage
const progress = await getMinerProgressForAssignment('assignment_123', 'miner_456');

// Returns:
{
  status: 'pending' | 'completed' | 'in_progress',
  watched: boolean,
  watchedDuration: number,
  totalDuration: number,
  completedAt: Timestamp | null
} | null
```

---

## 🎬 Complete Usage Examples

### Example 1: Miner Watching Video

```typescript
import { 
  startVideoProgress, 
  updateVideoProgress, 
  markVideoAsCompleted 
} from '@/services/videoProgressService';

// Component state
const [watchedSeconds, setWatchedSeconds] = useState(0);
const [totalSeconds, setTotalSeconds] = useState(0);

// When video starts
const handleVideoStart = async () => {
  await startVideoProgress(
    assignmentId,
    minerId,
    videoId,
    totalSeconds
  );
};

// During playback (every 10 seconds)
const handleProgressUpdate = async (currentPosition: number) => {
  const progressPercent = (currentPosition / totalSeconds) * 100;
  
  await updateVideoProgress({
    assignmentId,
    minerId,
    videoId,
    watchedDuration: currentPosition,
    totalDuration: totalSeconds,
    progressPercent,
    isCompleted: progressPercent >= 95  // Consider 95% as complete
  });
};

// On video completion
const handleVideoComplete = async () => {
  await markVideoAsCompleted(
    assignmentId,
    minerId,
    videoId,
    totalSeconds
  );
  
  Alert.alert('Completed!', 'You have completed this training video.');
};
```

---

### Example 2: Supervisor Creating Assignment

```typescript
import { createVideoAssignment } from '@/services/supervisorVideoAssignmentService';

const assignVideo = async () => {
  try {
    const result = await createVideoAssignment({
      videoId: selectedVideo.id,
      videoTopic: selectedVideo.topic,
      workTitle: workTitle,
      workDescription: workDescription,
      workDate: workDate,
      assignedMinerIds: selectedMiners,
      supervisorId: user.id,
      supervisorName: user.name,
      priority: 'high'
    });

    if (result.success) {
      Alert.alert(
        'Success!',
        `Assigned to ${selectedMiners.length} miners. ` +
        `${result.notificationsSent} notifications sent.`
      );
    }
  } catch (error) {
    Alert.alert('Error', 'Failed to create assignment');
  }
};
```

---

### Example 3: Loading Miner's Assignments

```typescript
import { getValidAssignedVideos } from '@/services/validatedAssignmentsService';
import { getMinerCompletionStats } from '@/services/videoProgressService';

const loadMinerDashboard = async () => {
  // Get all assignments
  const assignments = await getValidAssignedVideos(minerId);
  
  // Get completion stats
  const stats = await getMinerCompletionStats(minerId);
  
  // Separate pending and completed
  const pending = assignments.filter(a => !a.progress?.watched);
  const completed = assignments.filter(a => a.progress?.watched);
  
  // Check if work access is granted
  const canAccessWork = await areAllMandatoryVideosCompleted(minerId);
  
  setAssignments(pending);
  setCompletedAssignments(completed);
  setStats(stats);
  setWorkAccessGranted(canAccessWork);
};
```

---

### Example 4: Supervisor Dashboard Progress

```typescript
import { 
  getSupervisorAssignments, 
  getAssignmentCompletionSummary 
} from '@/services/supervisorVideoAssignmentService';

const loadSupervisorDashboard = async () => {
  // Get all assignments
  const assignments = await getSupervisorAssignments(supervisorId);
  
  // Get completion summary for each
  const summaries = await Promise.all(
    assignments.map(async (assignment) => {
      const summary = await getAssignmentCompletionSummary(assignment.id);
      return {
        assignment,
        ...summary
      };
    })
  );
  
  setSummaries(summaries);
};
```

---

## 🔔 Real-time Updates

### Listen to Assignment Progress Changes

```typescript
import { onSnapshot, collection, query, where } from 'firebase/firestore';
import { db } from '@/config/firebase';

// Supervisor listening to assignments
const unsubscribe = onSnapshot(
  query(
    collection(db, 'videoAssignments'),
    where('assignedBy', '==', supervisorId),
    where('status', '==', 'active')
  ),
  (snapshot) => {
    const assignments = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    setAssignments(assignments);
  }
);

// Cleanup
return () => unsubscribe();
```

---

## 🎯 Best Practices

### 1. Progress Updates
- Call `startVideoProgress()` once when video begins
- Call `updateVideoProgress()` every 5-10 seconds during playback
- Call `markVideoAsCompleted()` when video finishes
- Don't update on every second (too many writes)

### 2. Error Handling
- Always wrap in try-catch
- Show user-friendly error messages
- Log errors for debugging
- Provide fallback behavior

### 3. Loading States
- Show loading indicators during async operations
- Disable buttons during processing
- Provide feedback on success/failure
- Handle network errors gracefully

### 4. Data Validation
- Validate input before API calls
- Check for required fields
- Handle missing/invalid data
- Use safe accessors (optional chaining)

### 5. Performance
- Use useMemo for expensive calculations
- Batch multiple updates when possible
- Avoid unnecessary re-renders
- Clean up listeners on unmount

---

## 🐛 Troubleshooting

### Progress not updating?
```typescript
// Check both locations
const progressDoc = await getDoc(doc(db, 'assignmentProgress', `${assignmentId}_${minerId}`));
const assignmentDoc = await getDoc(doc(db, 'videoAssignments', assignmentId));

console.log('Progress doc:', progressDoc.data());
console.log('Progress map:', assignmentDoc.data()?.progress[minerId]);
```

### Miner can't see assignments?
```typescript
// Verify supervisor link
const minerDoc = await getDoc(doc(db, 'users', minerId));
const supervisorId = minerDoc.data()?.supervisorId;
console.log('Miner supervisor:', supervisorId);

// Check assignment
const assignmentDoc = await getDoc(doc(db, 'videoAssignments', assignmentId));
console.log('Assignment supervisor:', assignmentDoc.data()?.assignedBy);
```

### Completion not detected?
```typescript
// Check multiple indicators
const progress = await getVideoProgress(assignmentId, minerId);
console.log('Watched:', progress?.watched);
console.log('Status:', progress?.status);
console.log('Progress:', progress?.progress);
console.log('CompletedAt:', progress?.completedAt);
```

---

## 📞 Support

For issues or questions:
1. Check the IMPLEMENTATION_GUIDE.md
2. Review Firestore data structure
3. Check console logs for errors
4. Verify user permissions
5. Test with different user roles

Happy coding! 🚀
