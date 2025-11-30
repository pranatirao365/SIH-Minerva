import AsyncStorage from '@react-native-async-storage/async-storage';

export interface VideoAssignment {
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

export interface AssignmentProgress {
  assignmentId: string;
  minerId: string;
  watched: boolean;
  watchedAt?: number;
  progress: number;
}

/**
 * Check if a miner can access work routes by verifying completion of mandatory videos
 * @param minerId - The ID of the miner to check
 * @returns Promise<boolean> - true if access is granted, false if restricted
 */
export async function canAccessWorkRoutes(minerId: string): Promise<boolean> {
  try {
    // Load assignments
    const storedAssignments = await AsyncStorage.getItem('videoAssignments');
    if (!storedAssignments) return true; // No assignments means access granted

    const assignments: VideoAssignment[] = JSON.parse(storedAssignments);

    // Load progress
    const storedProgress = await AsyncStorage.getItem('assignmentProgress');
    const progress: AssignmentProgress[] = storedProgress ? JSON.parse(storedProgress) : [];

    // Get mandatory assignments for this miner
    const mandatoryAssignments = assignments.filter(assignment =>
      assignment.isMandatory && assignment.assignedTo.includes(minerId)
    );

    // Check if all mandatory assignments are completed
    const completedMandatory = mandatoryAssignments.filter(assignment => {
      const assignmentProgress = progress.find(p =>
        p.assignmentId === assignment.id && p.minerId === minerId
      );
      return assignmentProgress?.watched === true;
    });

    return completedMandatory.length === mandatoryAssignments.length;
  } catch (error) {
    console.error('Error checking work route access:', error);
    // In case of error, allow access to prevent blocking users
    return true;
  }
}

/**
 * Get the count of pending mandatory videos for a miner
 * @param minerId - The ID of the miner to check
 * @returns Promise<number> - number of unwatched mandatory videos
 */
export async function getPendingMandatoryVideos(minerId: string): Promise<number> {
  try {
    // Load assignments
    const storedAssignments = await AsyncStorage.getItem('videoAssignments');
    if (!storedAssignments) return 0;

    const assignments: VideoAssignment[] = JSON.parse(storedAssignments);

    // Load progress
    const storedProgress = await AsyncStorage.getItem('assignmentProgress');
    const progress: AssignmentProgress[] = storedProgress ? JSON.parse(storedProgress) : [];

    // Get mandatory assignments for this miner that are not completed
    const pendingMandatory = assignments.filter(assignment => {
      if (!assignment.isMandatory || !assignment.assignedTo.includes(minerId)) return false;

      const assignmentProgress = progress.find(p =>
        p.assignmentId === assignment.id && p.minerId === minerId
      );
      return !assignmentProgress?.watched;
    });

    return pendingMandatory.length;
  } catch (error) {
    console.error('Error getting pending videos:', error);
    return 0;
  }
}

/**
 * Get assignment details for a miner
 * @param minerId - The ID of the miner
 * @returns Promise<{assignments: VideoAssignment[], progress: AssignmentProgress[]}>
 */
export async function getMinerAssignments(minerId: string): Promise<{
  assignments: VideoAssignment[],
  progress: AssignmentProgress[]
}> {
  try {
    // Load assignments
    const storedAssignments = await AsyncStorage.getItem('videoAssignments');
    const assignments: VideoAssignment[] = storedAssignments ? JSON.parse(storedAssignments) : [];

    // Load progress
    const storedProgress = await AsyncStorage.getItem('assignmentProgress');
    const progress: AssignmentProgress[] = storedProgress ? JSON.parse(storedProgress) : [];

    // Filter assignments for this miner
    const minerAssignments = assignments.filter(assignment =>
      assignment.assignedTo.includes(minerId)
    );

    // Filter progress for this miner
    const minerProgress = progress.filter(p => p.minerId === minerId);

    return { assignments: minerAssignments, progress: minerProgress };
  } catch (error) {
    console.error('Error getting miner assignments:', error);
    return { assignments: [], progress: [] };
  }
}