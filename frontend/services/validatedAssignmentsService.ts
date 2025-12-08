/**
 * Assigned Videos Service - Complete End-to-End Fixed Implementation
 * Handles safe fetching, validation, and joining of assignment data
 * Fixes: Data integrity, progress tracking, filtering, and rendering
 */

import { collection, query, where, getDocs, doc, getDoc } from 'firebase/firestore';
import { db } from '../config/firebase';

// Safe timestamp utility - handles all timestamp types
function safeToMillis(timestamp: any): number {
  if (!timestamp) return 0; // Return 0 for missing timestamps, not Date.now()
  try {
    if (typeof timestamp.toMillis === 'function') return timestamp.toMillis();
    if (typeof timestamp.toDate === 'function') return timestamp.toDate().getTime();
    if (typeof timestamp === 'number') return timestamp;
    if (typeof timestamp === 'string') return new Date(timestamp).getTime();
    if (timestamp instanceof Date) return timestamp.getTime();
  } catch (e) {
    console.warn('⚠️ Failed to convert timestamp:', e);
  }
  return 0;
}

export interface ValidatedVideo {
  id: string;
  topic: string;
  language: string;
  languageName: string;
  videoUrl: string;
  timestamp: number;
  thumbnail?: string;
  duration?: number;
  description?: string;
}

export interface ValidatedAssignment {
  id: string;
  videoId: string;
  videoTopic: string;
  assignedTo: string[];
  assignedBy: string;
  deadline: number;
  isMandatory: boolean;
  assignedAt: number;
  description?: string;
}

export interface ValidatedProgress {
  assignmentId: string;
  minerId: string;
  watched: boolean;
  watchedAt?: number;
  progress: number;
}

export interface EnrichedAssignment {
  assignment: ValidatedAssignment;
  video: ValidatedVideo;
  progress: ValidatedProgress | null;
  isValid: true; // Only valid assignments are returned
}

/**
 * Get miner's supervisor ID from user document
 * Returns supervisor's empId or document ID
 */
async function getMinerSupervisorId(minerId: string): Promise<string | null> {
  try {
    const minerRef = doc(db, 'users', minerId);
    const minerSnap = await getDoc(minerRef);
    
    if (minerSnap.exists()) {
      const minerData = minerSnap.data();
      const supervisorId = minerData.supervisorId || minerData.assignedSupervisor;
      
      if (supervisorId) {
        console.log(`   📎 Miner ${minerId} has supervisorId: ${supervisorId}`);
        
        // Check if this is an empId - if so, find the actual supervisor document
        const supervisorsRef = collection(db, 'users');
        const supervisorQuery = query(
          supervisorsRef,
          where('role', '==', 'supervisor'),
          where('empId', '==', supervisorId)
        );
        const supervisorSnap = await getDocs(supervisorQuery);
        
        if (!supervisorSnap.empty) {
          const actualSupervisorDocId = supervisorSnap.docs[0].id;
          console.log(`   ✅ Resolved empId ${supervisorId} to document ID: ${actualSupervisorDocId}`);
          return actualSupervisorDocId;
        }
        
        // If not found by empId, return the supervisorId as-is (might be document ID)
        console.log(`   ℹ️ Using supervisorId as-is: ${supervisorId}`);
        return supervisorId;
      }
    }
  } catch (error) {
    console.error('❌ Error fetching miner supervisor:', error);
  }
  return null;
}

/**
 * Validate video document has all required fields
 */
function validateVideoData(videoId: string, data: any): ValidatedVideo | null {
  try {
    // Check required fields
    if (!data.topic || !data.videoUrl) {
      console.warn(`⚠️ Video ${videoId} missing required fields (topic or videoUrl)`);
      return null;
    }

    // Check video URL is not empty or invalid
    if (typeof data.videoUrl !== 'string' || data.videoUrl.trim() === '') {
      console.warn(`⚠️ Video ${videoId} has invalid videoUrl`);
      return null;
    }

    return {
      id: videoId,
      topic: data.topic || 'Untitled Video',
      language: data.language || 'en',
      languageName: data.languageName || data.language || 'English',
      videoUrl: data.videoUrl,
      timestamp: safeToMillis(data.createdAt),
      thumbnail: data.thumbnailUrl,
      duration: data.duration,
      description: data.description,
    };
  } catch (error) {
    console.error(`Error validating video ${videoId}:`, error);
    return null;
  }
}

/**
 * Validate assignment document
 */
function validateAssignmentData(assignmentId: string, data: any): ValidatedAssignment | null {
  try {
    // Check required fields
    if (!data.videoId || !data.assignedTo || !data.assignedBy) {
      console.warn(`⚠️ Assignment ${assignmentId} missing required fields`);
      return null;
    }

    // Ensure assignedTo is an array
    const assignedTo = Array.isArray(data.assignedTo) ? data.assignedTo : [data.assignedTo];

    return {
      id: assignmentId,
      videoId: data.videoId,
      videoTopic: data.videoTopic || 'Video Assignment',
      assignedTo,
      assignedBy: data.assignedBy,
      deadline: safeToMillis(data.deadline),
      isMandatory: data.isMandatory ?? false,
      assignedAt: safeToMillis(data.assignedAt),
      description: data.description,
    };
  } catch (error) {
    console.error(`Error validating assignment ${assignmentId}:`, error);
    return null;
  }
}

/**
 * Get progress for assignment (checks both progress map and assignmentProgress collection)
 */
async function getAssignmentProgress(
  assignmentId: string,
  assignmentData: any,
  minerId: string
): Promise<ValidatedProgress> {
  try {
    let progressData: any = null;
    let source = 'none';

    // Strategy 1: Check progress map in assignment document
    const progressMap = assignmentData.progress || {};
    const minerProgress = progressMap[minerId];
    
    if (minerProgress && Object.keys(minerProgress).length > 0) {
      progressData = minerProgress;
      source = 'assignment.progress';
    }

    // Strategy 2: Check assignmentProgress collection
    if (!progressData) {
      const progressId = `${assignmentId}_${minerId}`;
      const progressRef = doc(db, 'assignmentProgress', progressId);
      const progressSnap = await getDoc(progressRef);
      
      if (progressSnap.exists()) {
        progressData = progressSnap.data();
        source = 'assignmentProgress';
      }
    }

    // If no progress data found, return default (not watched)
    if (!progressData) {
      return {
        assignmentId,
        minerId,
        watched: false,
        watchedAt: undefined,
        progress: 0,
      };
    }

    // Determine completion using MULTIPLE indicators (comprehensive check)
    const isCompleted = 
      // Direct boolean flag
      progressData.watched === true ||
      // Status field
      progressData.status === 'completed' ||
      // Progress percentage
      (progressData.progress !== undefined && progressData.progress >= 100) ||
      // WatchedDuration vs totalDuration
      (progressData.watchedDuration !== undefined && 
       progressData.watchedDuration >= 100) ||
      (progressData.watchedDuration !== undefined && 
       progressData.totalDuration !== undefined && 
       progressData.watchedDuration >= progressData.totalDuration) ||
      // Has completedAt timestamp
      (progressData.completedAt !== undefined && progressData.completedAt !== null);

    const progressPercent = 
      progressData.progress ?? 
      progressData.watchedDuration ?? 
      (isCompleted ? 100 : 0);

    const result = {
      assignmentId,
      minerId,
      watched: isCompleted,
      watchedAt: progressData.completedAt ? safeToMillis(progressData.completedAt) : undefined,
      progress: progressPercent,
    };

    // Debug logging
    if (isCompleted) {
      console.log(`✅ COMPLETED progress found (${source}):`, {
        assignmentId: assignmentId.substring(0, 8),
        watched: result.watched,
        progress: result.progress,
        indicators: {
          watched: progressData.watched,
          status: progressData.status,
          progress: progressData.progress,
          watchedDuration: progressData.watchedDuration,
          completedAt: !!progressData.completedAt,
        }
      });
    }

    return result;
  } catch (error) {
    console.error(`❌ Error fetching progress for ${assignmentId}:`, error);
    // Return default on error (not watched)
    return {
      assignmentId,
      minerId,
      watched: false,
      watchedAt: undefined,
      progress: 0,
    };
  }
}

/**
 * Fetch and validate all assigned videos for a miner
 * Only returns valid assignments where:
 * - Assignment is assigned to this miner
 * - Assignment was created by miner's supervisor (if supervisor exists)
 * - Video exists in videoLibrary
 * - Video has valid data
 */
export async function getValidAssignedVideos(minerId: string): Promise<EnrichedAssignment[]> {
  console.log('🔍 Fetching assignments for miner:', minerId);
  
  try {
    // Step 1: Get miner's supervisor ID
    const supervisorId = await getMinerSupervisorId(minerId);
    console.log('👤 Miner supervisor:', supervisorId || 'None');

    // Step 2: Fetch assignments for this miner
    const assignmentsRef = collection(db, 'videoAssignments');
    const assignmentsQuery = query(
      assignmentsRef,
      where('assignedTo', 'array-contains', minerId),
      where('status', '==', 'active')
    );
    
    const assignmentsSnapshot = await getDocs(assignmentsQuery);
    console.log(`📋 Found ${assignmentsSnapshot.size} raw assignments`);

    // Step 3: Process each assignment
    const enrichedAssignments: EnrichedAssignment[] = [];
    let skippedCount = 0;

    for (const assignmentDoc of assignmentsSnapshot.docs) {
      const assignmentData = assignmentDoc.data();
      
      // Validate assignment data
      const validatedAssignment = validateAssignmentData(assignmentDoc.id, assignmentData);
      if (!validatedAssignment) {
        skippedCount++;
        console.warn(`⏭️ Skipping assignment ${assignmentDoc.id} - invalid data`);
        continue;
      }

      // Check if assignment is from miner's supervisor (if supervisor exists)
      if (supervisorId && validatedAssignment.assignedBy !== supervisorId) {
        // Assignment's assignedBy might be empId, so also check if supervisor has matching empId
        const supervisorRef = doc(db, 'users', supervisorId);
        const supervisorSnap = await getDoc(supervisorRef);
        
        let isFromSupervisor = false;
        if (supervisorSnap.exists()) {
          const supervisorData = supervisorSnap.data();
          const supervisorEmpId = supervisorData.empId;
          
          // Check if assignment was created by supervisor's empId
          if (supervisorEmpId && validatedAssignment.assignedBy === supervisorEmpId) {
            isFromSupervisor = true;
            console.log(`   ✅ Assignment from supervisor's empId: ${supervisorEmpId}`);
          }
        }
        
        if (!isFromSupervisor) {
          skippedCount++;
          console.warn(`⏭️ Skipping assignment ${assignmentDoc.id} - not from miner's supervisor (expected: ${supervisorId}, got: ${validatedAssignment.assignedBy})`);
          continue;
        }
      }

      // Fetch and validate video
      const videoRef = doc(db, 'videoLibrary', validatedAssignment.videoId);
      const videoSnap = await getDoc(videoRef);
      
      if (!videoSnap.exists()) {
        skippedCount++;
        console.warn(`⏭️ Skipping assignment ${assignmentDoc.id} - video ${validatedAssignment.videoId} not found`);
        continue;
      }

      const validatedVideo = validateVideoData(videoSnap.id, videoSnap.data());
      if (!validatedVideo) {
        skippedCount++;
        console.warn(`⏭️ Skipping assignment ${assignmentDoc.id} - video ${validatedAssignment.videoId} has invalid data`);
        continue;
      }

      // Get progress
      const progress = await getAssignmentProgress(assignmentDoc.id, assignmentData, minerId);

      // Add to results - all validation passed!
      enrichedAssignments.push({
        assignment: validatedAssignment,
        video: validatedVideo,
        progress,
        isValid: true,
      });
    }

    // Log statistics
    const watchedCount = enrichedAssignments.filter(a => a.progress?.watched === true).length;
    const pendingCount = enrichedAssignments.filter(a => !a.progress?.watched).length;
    
    console.log(`✅ Loaded ${enrichedAssignments.length} valid assignments`);
    console.log(`   📊 Breakdown: ${pendingCount} pending, ${watchedCount} completed`);
    
    if (skippedCount > 0) {
      console.log(`⚠️ Skipped ${skippedCount} invalid/unauthorized assignments`);
    }

    // Debug: Log each completed assignment
    enrichedAssignments.forEach(item => {
      if (item.progress?.watched === true) {
        console.log(`   ✅ Completed: "${item.assignment.videoTopic}" (${item.assignment.id.substring(0, 8)})`);
      }
    });

    // Sort by completion status, then deadline
    enrichedAssignments.sort((a, b) => {
      // Unwatched first
      if (!a.progress?.watched && b.progress?.watched) return -1;
      if (a.progress?.watched && !b.progress?.watched) return 1;
      // Then by deadline
      return (a.assignment.deadline || 0) - (b.assignment.deadline || 0);
    });

    return enrichedAssignments;

  } catch (error) {
    console.error('❌ Error fetching assignments:', error);
    throw error;
  }
}

/**
 * Update assignment progress after watching
 */
/**
 * Update video progress - writes to BOTH locations for maximum reliability
 */
export async function updateVideoProgress(
  assignmentId: string,
  minerId: string,
  progressPercent: number,
  isCompleted: boolean
): Promise<void> {
  console.log(`📝 Updating progress: assignment=${assignmentId.substring(0, 8)}, miner=${minerId.substring(0, 8)}, progress=${progressPercent}%, completed=${isCompleted}`);
  
  try {
    const { doc: firestoreDoc, runTransaction, Timestamp, setDoc } = await import('firebase/firestore');
    const now = Timestamp.now();
    
    const progressUpdate: any = {
      status: isCompleted ? 'completed' : 'in_progress',
      watchedDuration: progressPercent,
      totalDuration: 100,
      lastUpdated: now,
      watched: isCompleted, // Add explicit watched flag
    };

    if (isCompleted) {
      progressUpdate.completedAt = now;
    }

    // Write 1: Update progress map in assignment document
    const assignmentRef = firestoreDoc(db, 'videoAssignments', assignmentId);
    
    await runTransaction(db, async (transaction) => {
      const assignmentDoc = await transaction.get(assignmentRef);
      
      if (!assignmentDoc.exists()) {
        throw new Error(`Assignment ${assignmentId} not found`);
      }

      const progressPath = `progress.${minerId}`;
      transaction.update(assignmentRef, {
        [progressPath]: progressUpdate,
      });
    });

    console.log(`✅ Updated videoAssignments/${assignmentId}/progress/${minerId}`);

    // Write 2: Update/create document in assignmentProgress collection (ALWAYS, not just if completed)
    const progressDocRef = firestoreDoc(db, 'assignmentProgress', `${assignmentId}_${minerId}`);
    await setDoc(progressDocRef, {
      assignmentId,
      minerId,
      watched: isCompleted,
      status: isCompleted ? 'completed' : 'in_progress',
      progress: progressPercent,
      watchedDuration: progressPercent,
      totalDuration: 100,
      completedAt: isCompleted ? now : null,
      updatedAt: now,
    }, { merge: true });

    console.log(`✅ Updated assignmentProgress/${assignmentId}_${minerId}`);
    
    if (isCompleted) {
      console.log(`🎉 Video marked as COMPLETED for miner ${minerId.substring(0, 8)}`);
    }

  } catch (error) {
    console.error('❌ Error updating progress:', error);
    throw error;
  }
}
