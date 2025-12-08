/**
 * Supervisor Video Assignment Service
 * Handles video assignment creation with proper supervisor-miner linking
 */

import { 
  doc, 
  setDoc, 
  collection,
  addDoc,
  Timestamp,
  getDoc,
  query,
  where,
  getDocs,
} from 'firebase/firestore';
import { db } from '../config/firebase';

export interface VideoAssignmentData {
  videoId: string;
  videoTopic: string;
  workTitle: string;
  workDescription: string;
  workDate: string; // YYYY-MM-DD format
  assignedMinerIds: string[];
  supervisorId: string;
  supervisorName?: string;
  language?: string;
  priority?: 'low' | 'medium' | 'high' | 'critical';
}

export interface AssignmentResult {
  assignmentId: string;
  success: boolean;
  notificationsSent: number;
  errors: string[];
}

/**
 * Create a video assignment and send notifications to miners
 */
export async function createVideoAssignment(
  assignmentData: VideoAssignmentData
): Promise<AssignmentResult> {
  const {
    videoId,
    videoTopic,
    workTitle,
    workDescription,
    workDate,
    assignedMinerIds,
    supervisorId,
    supervisorName,
    language = 'en',
    priority = 'high',
  } = assignmentData;

  console.log('📝 Creating video assignment:', {
    videoId,
    videoTopic,
    assignedTo: assignedMinerIds.length,
    supervisor: supervisorId,
  });

  const errors: string[] = [];
  let notificationsSent = 0;

  try {
    // Validate inputs
    if (!videoId || !supervisorId || assignedMinerIds.length === 0) {
      throw new Error('Missing required fields for assignment');
    }

    // Get miner details for department information
    const minerDepartments: string[] = [];
    for (const minerId of assignedMinerIds) {
      try {
        const minerRef = doc(db, 'users', minerId);
        const minerSnap = await getDoc(minerRef);
        if (minerSnap.exists()) {
          const dept = minerSnap.data()?.department;
          if (dept && !minerDepartments.includes(dept)) {
            minerDepartments.push(dept);
          }
        }
      } catch (err) {
        console.warn(`Could not fetch department for miner ${minerId}`);
      }
    }

    // Create assignment ID
    const assignmentId = `assignment_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const now = Timestamp.now();
    
    // Calculate deadline (24 hours from work date)
    const deadlineDate = new Date(workDate);
    deadlineDate.setDate(deadlineDate.getDate() + 1); // Next day
    const deadline = Timestamp.fromDate(deadlineDate);

    // Initialize progress map for each miner
    const progressMap: Record<string, any> = {};
    assignedMinerIds.forEach((minerId) => {
      progressMap[minerId] = {
        status: 'pending',
        watchedDuration: 0,
        totalDuration: 0,
        completedAt: null,
        lastUpdated: now,
        watched: false, // Explicit watched flag
      };
    });

    // Create assignment document
    const assignmentDocData = {
      id: assignmentId,
      videoId,
      videoTopic,
      workTitle: workTitle.trim(),
      assignedTo: assignedMinerIds,
      assignedBy: supervisorId, // Store supervisor's document ID
      assignedAt: now,
      deadline,
      isMandatory: true,
      isDailyTask: true,
      taskDate: workDate,
      departments: minerDepartments,
      description: workDescription.trim(),
      status: 'active' as const,
      priority,
      language,
      progress: progressMap, // Progress tracking map
      createdAt: now,
      updatedAt: now,
    };

    // Write to Firestore
    const assignmentRef = doc(db, 'videoAssignments', assignmentId);
    await setDoc(assignmentRef, assignmentDocData);
    
    console.log('✅ Assignment created:', assignmentId);
    console.log('📊 Progress map initialized for', assignedMinerIds.length, 'miners');

    // Send notifications to each assigned miner
    for (const minerId of assignedMinerIds) {
      try {
        // Get miner name
        const minerRef = doc(db, 'users', minerId);
        const minerSnap = await getDoc(minerRef);
        const minerName = minerSnap.exists() ? minerSnap.data()?.name || 'Miner' : 'Miner';

        // Create notification
        await addDoc(collection(db, 'notifications'), {
          recipientId: minerId,
          recipientName: minerName,
          senderId: supervisorId,
          senderName: supervisorName || 'Supervisor',
          type: 'video_assignment',
          title: '📹 New Training Video Assigned',
          message: `You have been assigned to watch "${videoTopic}" for ${workDate}. Please complete before the deadline.`,
          priority,
          read: false,
          actionRequired: true,
          createdAt: now,
          metadata: {
            assignmentId,
            videoId,
            videoTopic,
            deadline,
            taskDate: workDate,
            workTitle,
          },
        });

        notificationsSent++;
        console.log(`✅ Notification sent to: ${minerName}`);
      } catch (notifError) {
        console.error(`Failed to send notification to miner ${minerId}:`, notifError);
        errors.push(`Failed to notify miner ${minerId}`);
      }
    }

    console.log(`🎉 Assignment complete: ${notificationsSent}/${assignedMinerIds.length} notifications sent`);

    return {
      assignmentId,
      success: true,
      notificationsSent,
      errors,
    };
  } catch (error) {
    console.error('❌ Error creating video assignment:', error);
    throw error;
  }
}

/**
 * Get all assignments created by a supervisor
 */
export async function getSupervisorAssignments(supervisorId: string): Promise<any[]> {
  try {
    const assignmentsRef = collection(db, 'videoAssignments');
    const assignmentsQuery = query(
      assignmentsRef,
      where('assignedBy', '==', supervisorId),
      where('status', '==', 'active')
    );

    const querySnapshot = await getDocs(assignmentsQuery);
    const assignments: any[] = [];

    querySnapshot.forEach((doc) => {
      assignments.push({
        id: doc.id,
        ...doc.data(),
      });
    });

    return assignments;
  } catch (error) {
    console.error('❌ Error getting supervisor assignments:', error);
    return [];
  }
}

/**
 * Get completion summary for an assignment
 */
export async function getAssignmentCompletionSummary(assignmentId: string): Promise<{
  totalMiners: number;
  completed: number;
  pending: number;
  completionRate: number;
}> {
  try {
    const assignmentRef = doc(db, 'videoAssignments', assignmentId);
    const assignmentSnap = await getDoc(assignmentRef);

    if (!assignmentSnap.exists()) {
      return {
        totalMiners: 0,
        completed: 0,
        pending: 0,
        completionRate: 0,
      };
    }

    const assignmentData = assignmentSnap.data();
    const assignedTo = assignmentData.assignedTo || [];
    const progressMap = assignmentData.progress || {};

    let completed = 0;
    assignedTo.forEach((minerId: string) => {
      const minerProgress = progressMap[minerId];
      if (minerProgress && (minerProgress.status === 'completed' || minerProgress.watched === true)) {
        completed++;
      }
    });

    const pending = assignedTo.length - completed;
    const completionRate = assignedTo.length > 0 ? (completed / assignedTo.length) * 100 : 0;

    return {
      totalMiners: assignedTo.length,
      completed,
      pending,
      completionRate,
    };
  } catch (error) {
    console.error('❌ Error getting assignment completion summary:', error);
    return {
      totalMiners: 0,
      completed: 0,
      pending: 0,
      completionRate: 0,
    };
  }
}

/**
 * Get miner progress for specific assignment
 */
export async function getMinerProgressForAssignment(
  assignmentId: string,
  minerId: string
): Promise<{
  status: 'pending' | 'completed' | 'in_progress';
  watched: boolean;
  watchedDuration: number;
  totalDuration: number;
  completedAt: Timestamp | null;
} | null> {
  try {
    const assignmentRef = doc(db, 'videoAssignments', assignmentId);
    const assignmentSnap = await getDoc(assignmentRef);

    if (!assignmentSnap.exists()) {
      return null;
    }

    const assignmentData = assignmentSnap.data();
    const progressMap = assignmentData.progress || {};
    const minerProgress = progressMap[minerId];

    if (!minerProgress) {
      return {
        status: 'pending',
        watched: false,
        watchedDuration: 0,
        totalDuration: 0,
        completedAt: null,
      };
    }

    return {
      status: minerProgress.status || 'pending',
      watched: minerProgress.watched || false,
      watchedDuration: minerProgress.watchedDuration || 0,
      totalDuration: minerProgress.totalDuration || 0,
      completedAt: minerProgress.completedAt || null,
    };
  } catch (error) {
    console.error('❌ Error getting miner progress for assignment:', error);
    return null;
  }
}
