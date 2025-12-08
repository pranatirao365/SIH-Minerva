/**
 * Video Progress Service
 * Comprehensive service for tracking and updating video watch progress
 * Handles: Progress tracking, completion status, dual-write to Firestore
 */

import { 
  doc, 
  setDoc, 
  getDoc, 
  runTransaction, 
  Timestamp,
  collection,
  query,
  where,
  getDocs,
} from 'firebase/firestore';
import { db } from '../config/firebase';

export interface VideoProgressUpdate {
  assignmentId: string;
  minerId: string;
  videoId: string;
  watchedDuration: number; // in seconds
  totalDuration: number; // in seconds
  progressPercent: number; // 0-100
  isCompleted: boolean;
}

export interface VideoProgressData {
  assignmentId: string;
  minerId: string;
  videoId: string;
  watched: boolean;
  status: 'not_started' | 'in_progress' | 'completed' | 'overdue';
  progress: number; // 0-100
  watchedDuration: number;
  totalDuration: number;
  startedAt?: Timestamp;
  completedAt?: Timestamp;
  lastWatchedAt: Timestamp;
  watchCount: number; // Number of times watched
}

/**
 * Initialize progress tracking when a miner starts watching a video
 */
export async function startVideoProgress(
  assignmentId: string,
  minerId: string,
  videoId: string,
  totalDuration: number
): Promise<void> {
  console.log(`▶️ Starting video progress: assignment=${assignmentId.substring(0, 8)}, miner=${minerId.substring(0, 8)}`);
  
  try {
    const now = Timestamp.now();
    const progressDocId = `${assignmentId}_${minerId}`;

    // Check if progress already exists
    const progressRef = doc(db, 'assignmentProgress', progressDocId);
    const existingProgress = await getDoc(progressRef);

    const watchCount = existingProgress.exists() 
      ? (existingProgress.data()?.watchCount || 0) + 1 
      : 1;

    const progressData: Partial<VideoProgressData> = {
      assignmentId,
      minerId,
      videoId,
      watched: false,
      status: 'in_progress',
      progress: 0,
      watchedDuration: 0,
      totalDuration,
      startedAt: existingProgress.exists() ? existingProgress.data()?.startedAt : now,
      lastWatchedAt: now,
      watchCount,
    };

    // Write to assignmentProgress collection
    await setDoc(progressRef, progressData, { merge: true });

    // Update progress map in assignment document
    const assignmentRef = doc(db, 'videoAssignments', assignmentId);
    await runTransaction(db, async (transaction) => {
      const assignmentDoc = await transaction.get(assignmentRef);
      
      if (assignmentDoc.exists()) {
        const progressPath = `progress.${minerId}`;
        transaction.update(assignmentRef, {
          [progressPath]: {
            status: 'in_progress',
            watchedDuration: 0,
            totalDuration,
            completedAt: null,
            lastUpdated: now,
          },
        });
      }
    });

    console.log(`✅ Video progress started (watch count: ${watchCount})`);
  } catch (error) {
    console.error('❌ Error starting video progress:', error);
    throw error;
  }
}

/**
 * Update progress during video playback
 * Should be called periodically (e.g., every 5-10 seconds)
 */
export async function updateVideoProgress(update: VideoProgressUpdate): Promise<void> {
  const { assignmentId, minerId, videoId, watchedDuration, totalDuration, progressPercent, isCompleted } = update;
  
  console.log(`📝 Updating progress: ${progressPercent.toFixed(1)}% (${watchedDuration}/${totalDuration}s) - completed: ${isCompleted}`);
  
  try {
    const now = Timestamp.now();
    const progressDocId = `${assignmentId}_${minerId}`;

    // Determine status
    let status: VideoProgressData['status'] = 'in_progress';
    if (isCompleted) {
      status = 'completed';
    } else if (progressPercent === 0) {
      status = 'not_started';
    }

    // Update assignmentProgress collection
    const progressRef = doc(db, 'assignmentProgress', progressDocId);
    const progressData: Partial<VideoProgressData> = {
      assignmentId,
      minerId,
      videoId,
      watched: isCompleted,
      status,
      progress: Math.min(progressPercent, 100),
      watchedDuration,
      totalDuration,
      lastWatchedAt: now,
    };

    if (isCompleted) {
      progressData.completedAt = now;
    }

    await setDoc(progressRef, progressData, { merge: true });

    // Update progress map in assignment document
    const assignmentRef = doc(db, 'videoAssignments', assignmentId);
    await runTransaction(db, async (transaction) => {
      const assignmentDoc = await transaction.get(assignmentRef);
      
      if (assignmentDoc.exists()) {
        const progressPath = `progress.${minerId}`;
        const progressMapData: any = {
          status: isCompleted ? 'completed' : 'pending',
          watchedDuration,
          totalDuration,
          lastUpdated: now,
          watched: isCompleted, // Add explicit watched flag
        };

        if (isCompleted) {
          progressMapData.completedAt = now;
        } else {
          progressMapData.completedAt = null;
        }

        transaction.update(assignmentRef, {
          [progressPath]: progressMapData,
        });
      }
    });

    if (isCompleted) {
      console.log(`🎉 Video marked as COMPLETED for miner ${minerId.substring(0, 8)}`);
    }
  } catch (error) {
    console.error('❌ Error updating video progress:', error);
    throw error;
  }
}

/**
 * Mark video as completed (convenience method)
 */
export async function markVideoAsCompleted(
  assignmentId: string,
  minerId: string,
  videoId: string,
  totalDuration: number
): Promise<void> {
  console.log(`✅ Marking video as completed: assignment=${assignmentId.substring(0, 8)}`);
  
  await updateVideoProgress({
    assignmentId,
    minerId,
    videoId,
    watchedDuration: totalDuration,
    totalDuration,
    progressPercent: 100,
    isCompleted: true,
  });
}

/**
 * Get progress for a specific assignment and miner
 */
export async function getVideoProgress(
  assignmentId: string,
  minerId: string
): Promise<VideoProgressData | null> {
  try {
    const progressDocId = `${assignmentId}_${minerId}`;
    const progressRef = doc(db, 'assignmentProgress', progressDocId);
    const progressSnap = await getDoc(progressRef);

    if (progressSnap.exists()) {
      return progressSnap.data() as VideoProgressData;
    }

    return null;
  } catch (error) {
    console.error('❌ Error getting video progress:', error);
    return null;
  }
}

/**
 * Get all completed videos for a miner
 */
export async function getCompletedVideosForMiner(minerId: string): Promise<VideoProgressData[]> {
  try {
    const progressRef = collection(db, 'assignmentProgress');
    const progressQuery = query(
      progressRef,
      where('minerId', '==', minerId),
      where('watched', '==', true)
    );

    const querySnapshot = await getDocs(progressQuery);
    const completedVideos: VideoProgressData[] = [];

    querySnapshot.forEach((doc) => {
      completedVideos.push(doc.data() as VideoProgressData);
    });

    // Sort by completion date (most recent first)
    completedVideos.sort((a, b) => {
      const timeA = a.completedAt ? a.completedAt.toMillis() : 0;
      const timeB = b.completedAt ? b.completedAt.toMillis() : 0;
      return timeB - timeA;
    });

    return completedVideos;
  } catch (error) {
    console.error('❌ Error getting completed videos:', error);
    return [];
  }
}

/**
 * Get all in-progress videos for a miner
 */
export async function getInProgressVideosForMiner(minerId: string): Promise<VideoProgressData[]> {
  try {
    const progressRef = collection(db, 'assignmentProgress');
    const progressQuery = query(
      progressRef,
      where('minerId', '==', minerId),
      where('status', '==', 'in_progress')
    );

    const querySnapshot = await getDocs(progressQuery);
    const inProgressVideos: VideoProgressData[] = [];

    querySnapshot.forEach((doc) => {
      inProgressVideos.push(doc.data() as VideoProgressData);
    });

    // Sort by last watched date (most recent first)
    inProgressVideos.sort((a, b) => {
      const timeA = a.lastWatchedAt ? a.lastWatchedAt.toMillis() : 0;
      const timeB = b.lastWatchedAt ? b.lastWatchedAt.toMillis() : 0;
      return timeB - timeA;
    });

    return inProgressVideos;
  } catch (error) {
    console.error('❌ Error getting in-progress videos:', error);
    return [];
  }
}

/**
 * Get completion statistics for a miner
 */
export async function getMinerCompletionStats(minerId: string): Promise<{
  totalAssigned: number;
  completed: number;
  inProgress: number;
  notStarted: number;
  completionRate: number;
}> {
  try {
    // Get all assignments for this miner
    const assignmentsRef = collection(db, 'videoAssignments');
    const assignmentsQuery = query(
      assignmentsRef,
      where('assignedTo', 'array-contains', minerId),
      where('status', '==', 'active')
    );

    const assignmentsSnapshot = await getDocs(assignmentsQuery);
    const totalAssigned = assignmentsSnapshot.size;

    // Get all progress records for this miner
    const progressRef = collection(db, 'assignmentProgress');
    const progressQuery = query(progressRef, where('minerId', '==', minerId));
    const progressSnapshot = await getDocs(progressQuery);

    let completed = 0;
    let inProgress = 0;

    progressSnapshot.forEach((doc) => {
      const data = doc.data() as VideoProgressData;
      if (data.watched || data.status === 'completed') {
        completed++;
      } else if (data.status === 'in_progress') {
        inProgress++;
      }
    });

    const notStarted = Math.max(0, totalAssigned - completed - inProgress);
    const completionRate = totalAssigned > 0 ? (completed / totalAssigned) * 100 : 0;

    return {
      totalAssigned,
      completed,
      inProgress,
      notStarted,
      completionRate,
    };
  } catch (error) {
    console.error('❌ Error getting miner completion stats:', error);
    return {
      totalAssigned: 0,
      completed: 0,
      inProgress: 0,
      notStarted: 0,
      completionRate: 0,
    };
  }
}

/**
 * Check if all mandatory videos are completed
 */
export async function areAllMandatoryVideosCompleted(minerId: string): Promise<boolean> {
  try {
    // Get all mandatory assignments for this miner
    const assignmentsRef = collection(db, 'videoAssignments');
    const mandatoryQuery = query(
      assignmentsRef,
      where('assignedTo', 'array-contains', minerId),
      where('status', '==', 'active'),
      where('isMandatory', '==', true)
    );

    const mandatorySnapshot = await getDocs(mandatoryQuery);
    
    if (mandatorySnapshot.empty) {
      // No mandatory assignments
      return true;
    }

    // Check progress for each mandatory assignment
    for (const assignmentDoc of mandatorySnapshot.docs) {
      const assignmentId = assignmentDoc.id;
      const progress = await getVideoProgress(assignmentId, minerId);

      if (!progress || !progress.watched) {
        // At least one mandatory video is not completed
        return false;
      }
    }

    // All mandatory videos are completed
    return true;
  } catch (error) {
    console.error('❌ Error checking mandatory videos completion:', error);
    return false;
  }
}

/**
 * Reset video progress (for re-watching)
 */
export async function resetVideoProgress(
  assignmentId: string,
  minerId: string
): Promise<void> {
  console.log(`🔄 Resetting video progress: assignment=${assignmentId.substring(0, 8)}`);
  
  try {
    const progressDocId = `${assignmentId}_${minerId}`;
    const progressRef = doc(db, 'assignmentProgress', progressDocId);
    
    // Get existing data to preserve watchCount
    const existingProgress = await getDoc(progressRef);
    const watchCount = existingProgress.exists() 
      ? (existingProgress.data()?.watchCount || 0) + 1 
      : 1;

    const now = Timestamp.now();

    // Update progress document
    await setDoc(progressRef, {
      progress: 0,
      watchedDuration: 0,
      status: 'in_progress',
      watched: false,
      completedAt: null,
      lastWatchedAt: now,
      watchCount,
    }, { merge: true });

    // Update progress map in assignment
    const assignmentRef = doc(db, 'videoAssignments', assignmentId);
    await runTransaction(db, async (transaction) => {
      const assignmentDoc = await transaction.get(assignmentRef);
      
      if (assignmentDoc.exists()) {
        const progressPath = `progress.${minerId}`;
        transaction.update(assignmentRef, {
          [progressPath]: {
            status: 'pending',
            watchedDuration: 0,
            completedAt: null,
            lastUpdated: now,
          },
        });
      }
    });

    console.log(`✅ Video progress reset (watch count: ${watchCount})`);
  } catch (error) {
    console.error('❌ Error resetting video progress:', error);
    throw error;
  }
}
