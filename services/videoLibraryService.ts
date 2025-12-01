import { collection, doc, setDoc, getDoc, getDocs, updateDoc, deleteDoc, query, where, orderBy, limit, Timestamp } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { db, storage } from '../config/firebase';

// Video Library Collection Types
export interface VideoDocument {
  id: string;
  topic: string;
  language: string;
  languageName: string;
  videoUrl: string;
  thumbnailUrl?: string;
  transcript?: string;
  duration?: number; // in seconds
  fileSize?: number; // in bytes
  createdBy: string; // safety officer ID
  createdAt: Timestamp;
  updatedAt: Timestamp;
  status: 'active' | 'archived' | 'draft';
  tags: string[];
  availableLanguages: string[];
  metadata: {
    resolution?: string;
    bitrate?: number;
    format?: string;
    encoding?: string;
  };
  statistics: {
    totalViews: number;
    totalAssignments: number;
    completionRate: number;
    averageRating?: number;
  };
}

// Video Assignments Collection Types
export interface VideoAssignmentDocument {
  id: string;
  videoId: string;
  videoTopic: string;
  assignedTo: string[]; // miner IDs
  assignedBy: string; // safety officer ID
  assignedAt: Timestamp;
  deadline: Timestamp;
  isMandatory: boolean;
  isDailyTask: boolean;
  taskDate?: string; // YYYY-MM-DD format for daily tasks
  departments: string[]; // departments this assignment applies to
  description?: string;
  status: 'active' | 'completed' | 'expired' | 'cancelled';
  priority: 'low' | 'medium' | 'high' | 'critical';
}

// Assignment Progress Collection Types
export interface AssignmentProgressDocument {
  id: string;
  assignmentId: string;
  minerId: string;
  videoId: string;
  startedAt?: Timestamp;
  completedAt?: Timestamp;
  watched: boolean;
  progress: number; // 0-100 percentage
  watchTime: number; // total seconds watched
  lastWatchedAt?: Timestamp;
  rating?: number; // 1-5 stars
  feedback?: string;
  status: 'not_started' | 'in_progress' | 'completed' | 'overdue';
}

// Video Analytics Collection Types
export interface VideoAnalyticsDocument {
  id: string;
  videoId: string;
  minerId: string;
  assignmentId?: string;
  action: 'view' | 'complete' | 'pause' | 'seek' | 'rate' | 'feedback';
  timestamp: Timestamp;
  metadata: {
    currentTime?: number;
    totalTime?: number;
    rating?: number;
    feedback?: string;
    deviceInfo?: string;
    networkType?: string;
  };
}

/**
 * Video Library Service
 * Handles all video-related Firebase operations
 */
export class VideoLibraryService {

  // ==================== VIDEO LIBRARY OPERATIONS ====================

  /**
   * Create a new video document in Firestore
   */
  static async createVideo(videoData: Omit<VideoDocument, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
    try {
      const videoId = `video_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      const videoRef = doc(db, 'videoLibrary', videoId);

      const videoDoc: VideoDocument = {
        ...videoData,
        id: videoId,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
      };

      await setDoc(videoRef, videoDoc);
      console.log('✅ Video created successfully:', videoId);
      return videoId;
    } catch (error) {
      console.error('❌ Error creating video:', error);
      throw error;
    }
  }

  /**
   * Get video by ID
   */
  static async getVideo(videoId: string): Promise<VideoDocument | null> {
    try {
      const videoRef = doc(db, 'videoLibrary', videoId);
      const videoSnap = await getDoc(videoRef);

      if (videoSnap.exists()) {
        return videoSnap.data() as VideoDocument;
      }
      return null;
    } catch (error) {
      console.error('❌ Error getting video:', error);
      throw error;
    }
  }

  /**
   * Get all videos with optional filtering
   */
  static async getVideos(options: {
    status?: 'active' | 'archived' | 'draft';
    language?: string;
    createdBy?: string;
    tags?: string[];
    limit?: number;
  } = {}): Promise<VideoDocument[]> {
    try {
      let q = query(collection(db, 'videoLibrary'), orderBy('createdAt', 'desc'));

      if (options.status) {
        q = query(q, where('status', '==', options.status));
      }

      if (options.language) {
        q = query(q, where('language', '==', options.language));
      }

      if (options.createdBy) {
        q = query(q, where('createdBy', '==', options.createdBy));
      }

      if (options.limit) {
        q = query(q, limit(options.limit));
      }

      const querySnapshot = await getDocs(q);
      const videos: VideoDocument[] = [];

      querySnapshot.forEach((doc) => {
        videos.push(doc.data() as VideoDocument);
      });

      return videos;
    } catch (error) {
      console.error('❌ Error getting videos:', error);
      throw error;
    }
  }

  /**
   * Update video document
   */
  static async updateVideo(videoId: string, updates: Partial<VideoDocument>): Promise<void> {
    try {
      const videoRef = doc(db, 'videoLibrary', videoId);
      await updateDoc(videoRef, {
        ...updates,
        updatedAt: Timestamp.now(),
      });
      console.log('✅ Video updated successfully:', videoId);
    } catch (error) {
      console.error('❌ Error updating video:', error);
      throw error;
    }
  }

  /**
   * Delete video document and related data
   */
  static async deleteVideo(videoId: string): Promise<void> {
    try {
      // Delete video document
      await deleteDoc(doc(db, 'videoLibrary', videoId));

      // Delete related assignments
      await this.deleteVideoAssignments(videoId);

      // Delete related progress records
      await this.deleteVideoProgress(videoId);

      // Delete video file from storage if it exists
      try {
        const video = await this.getVideo(videoId);
        if (video?.videoUrl && video.videoUrl.includes('firebasestorage')) {
          const videoRef = ref(storage, video.videoUrl);
          await deleteObject(videoRef);
        }
      } catch (storageError) {
        console.warn('⚠️ Could not delete video file from storage:', storageError);
      }

      console.log('✅ Video and related data deleted successfully:', videoId);
    } catch (error) {
      console.error('❌ Error deleting video:', error);
      throw error;
    }
  }

  // ==================== VIDEO ASSIGNMENTS OPERATIONS ====================

  /**
   * Create a new video assignment
   */
  static async createAssignment(assignmentData: Omit<VideoAssignmentDocument, 'id' | 'assignedAt'>): Promise<string> {
    try {
      const assignmentId = `assignment_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      const assignmentRef = doc(db, 'videoAssignments', assignmentId);

      const assignmentDoc: VideoAssignmentDocument = {
        ...assignmentData,
        id: assignmentId,
        assignedAt: Timestamp.now(),
      };

      await setDoc(assignmentRef, assignmentDoc);

      // Update video statistics
      await this.updateVideoStats(assignmentData.videoId, { totalAssignments: 1 });

      console.log('✅ Assignment created successfully:', assignmentId);
      return assignmentId;
    } catch (error) {
      console.error('❌ Error creating assignment:', error);
      throw error;
    }
  }

  /**
   * Get assignments for a specific miner
   */
  static async getMinerAssignments(minerId: string): Promise<VideoAssignmentDocument[]> {
    try {
      const q = query(
        collection(db, 'videoAssignments'),
        where('assignedTo', 'array-contains', minerId),
        where('status', '==', 'active'),
        orderBy('assignedAt', 'desc')
      );

      const querySnapshot = await getDocs(q);
      const assignments: VideoAssignmentDocument[] = [];

      querySnapshot.forEach((doc) => {
        assignments.push(doc.data() as VideoAssignmentDocument);
      });

      return assignments;
    } catch (error) {
      console.error('❌ Error getting miner assignments:', error);
      throw error;
    }
  }

  /**
   * Get assignments by video ID
   */
  static async getVideoAssignments(videoId: string): Promise<VideoAssignmentDocument[]> {
    try {
      const q = query(
        collection(db, 'videoAssignments'),
        where('videoId', '==', videoId),
        orderBy('assignedAt', 'desc')
      );

      const querySnapshot = await getDocs(q);
      const assignments: VideoAssignmentDocument[] = [];

      querySnapshot.forEach((doc) => {
        assignments.push(doc.data() as VideoAssignmentDocument);
      });

      return assignments;
    } catch (error) {
      console.error('❌ Error getting video assignments:', error);
      throw error;
    }
  }

  /**
   * Update assignment status
   */
  static async updateAssignment(assignmentId: string, updates: Partial<VideoAssignmentDocument>): Promise<void> {
    try {
      const assignmentRef = doc(db, 'videoAssignments', assignmentId);
      await updateDoc(assignmentRef, updates);
      console.log('✅ Assignment updated successfully:', assignmentId);
    } catch (error) {
      console.error('❌ Error updating assignment:', error);
      throw error;
    }
  }

  /**
   * Delete assignment and related progress
   */
  static async deleteAssignment(assignmentId: string): Promise<void> {
    try {
      // Get assignment details first
      const assignmentRef = doc(db, 'videoAssignments', assignmentId);
      const assignmentSnap = await getDoc(assignmentRef);

      if (assignmentSnap.exists()) {
        const assignment = assignmentSnap.data() as VideoAssignmentDocument;

        // Delete assignment document
        await deleteDoc(assignmentRef);

        // Delete related progress records
        await this.deleteAssignmentProgress(assignmentId);

        // Update video statistics
        await this.updateVideoStats(assignment.videoId, { totalAssignments: -1 });
      }

      console.log('✅ Assignment deleted successfully:', assignmentId);
    } catch (error) {
      console.error('❌ Error deleting assignment:', error);
      throw error;
    }
  }

  // ==================== ASSIGNMENT PROGRESS OPERATIONS ====================

  /**
   * Create or update assignment progress
   */
  static async updateProgress(progressData: Omit<AssignmentProgressDocument, 'id'>): Promise<void> {
    try {
      const progressId = `${progressData.assignmentId}_${progressData.minerId}`;
      const progressRef = doc(db, 'assignmentProgress', progressId);

      const progressDoc: AssignmentProgressDocument = {
        ...progressData,
        id: progressId,
        lastWatchedAt: Timestamp.now(),
      };

      await setDoc(progressRef, progressDoc, { merge: true });

      // Update video statistics if completed
      if (progressData.watched && progressData.status === 'completed') {
        await this.updateVideoStats(progressData.videoId, { totalViews: 1 });
      }

      console.log('✅ Progress updated successfully:', progressId);
    } catch (error) {
      console.error('❌ Error updating progress:', error);
      throw error;
    }
  }

  /**
   * Get progress for a specific assignment and miner
   */
  static async getAssignmentProgress(assignmentId: string, minerId: string): Promise<AssignmentProgressDocument | null> {
    try {
      const progressId = `${assignmentId}_${minerId}`;
      const progressRef = doc(db, 'assignmentProgress', progressId);
      const progressSnap = await getDoc(progressRef);

      if (progressSnap.exists()) {
        return progressSnap.data() as AssignmentProgressDocument;
      }
      return null;
    } catch (error) {
      console.error('❌ Error getting assignment progress:', error);
      throw error;
    }
  }

  /**
   * Get all progress for a miner
   */
  static async getMinerProgress(minerId: string): Promise<AssignmentProgressDocument[]> {
    try {
      const q = query(
        collection(db, 'assignmentProgress'),
        where('minerId', '==', minerId),
        orderBy('lastWatchedAt', 'desc')
      );

      const querySnapshot = await getDocs(q);
      const progress: AssignmentProgressDocument[] = [];

      querySnapshot.forEach((doc) => {
        progress.push(doc.data() as AssignmentProgressDocument);
      });

      return progress;
    } catch (error) {
      console.error('❌ Error getting miner progress:', error);
      throw error;
    }
  }

  // ==================== ANALYTICS OPERATIONS ====================

  /**
   * Log video analytics event
   */
  static async logAnalytics(analyticsData: Omit<VideoAnalyticsDocument, 'id' | 'timestamp'>): Promise<void> {
    try {
      const analyticsId = `analytics_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      const analyticsRef = doc(db, 'videoAnalytics', analyticsId);

      const analyticsDoc: VideoAnalyticsDocument = {
        ...analyticsData,
        id: analyticsId,
        timestamp: Timestamp.now(),
      };

      await setDoc(analyticsRef, analyticsDoc);
    } catch (error) {
      console.error('❌ Error logging analytics:', error);
      // Don't throw error for analytics failures
    }
  }

  // ==================== UTILITY METHODS ====================

  /**
   * Update video statistics
   */
  private static async updateVideoStats(videoId: string, updates: { totalViews?: number; totalAssignments?: number }): Promise<void> {
    try {
      const videoRef = doc(db, 'videoLibrary', videoId);
      const videoSnap = await getDoc(videoRef);

      if (videoSnap.exists()) {
        const video = videoSnap.data() as VideoDocument;
        const currentStats = video.statistics;

        const newStats = {
          ...currentStats,
          totalViews: (currentStats.totalViews || 0) + (updates.totalViews || 0),
          totalAssignments: (currentStats.totalAssignments || 0) + (updates.totalAssignments || 0),
        };

        await updateDoc(videoRef, {
          statistics: newStats,
          updatedAt: Timestamp.now(),
        });
      }
    } catch (error) {
      console.error('❌ Error updating video stats:', error);
    }
  }

  /**
   * Delete all assignments for a video
   */
  private static async deleteVideoAssignments(videoId: string): Promise<void> {
    try {
      const q = query(collection(db, 'videoAssignments'), where('videoId', '==', videoId));
      const querySnapshot = await getDocs(q);

      const deletePromises = querySnapshot.docs.map(doc => deleteDoc(doc.ref));
      await Promise.all(deletePromises);

      console.log(`✅ Deleted ${querySnapshot.docs.length} assignments for video:`, videoId);
    } catch (error) {
      console.error('❌ Error deleting video assignments:', error);
    }
  }

  /**
   * Delete all progress records for a video
   */
  private static async deleteVideoProgress(videoId: string): Promise<void> {
    try {
      const q = query(collection(db, 'assignmentProgress'), where('videoId', '==', videoId));
      const querySnapshot = await getDocs(q);

      const deletePromises = querySnapshot.docs.map(doc => deleteDoc(doc.ref));
      await Promise.all(deletePromises);

      console.log(`✅ Deleted ${querySnapshot.docs.length} progress records for video:`, videoId);
    } catch (error) {
      console.error('❌ Error deleting video progress:', error);
    }
  }

  /**
   * Delete all progress records for an assignment
   */
  private static async deleteAssignmentProgress(assignmentId: string): Promise<void> {
    try {
      const q = query(collection(db, 'assignmentProgress'), where('assignmentId', '==', assignmentId));
      const querySnapshot = await getDocs(q);

      const deletePromises = querySnapshot.docs.map(doc => deleteDoc(doc.ref));
      await Promise.all(deletePromises);

      console.log(`✅ Deleted ${querySnapshot.docs.length} progress records for assignment:`, assignmentId);
    } catch (error) {
      console.error('❌ Error deleting assignment progress:', error);
    }
  }

  /**
   * Upload video file to Firebase Storage
   */
  static async uploadVideo(fileUri: string, fileName: string): Promise<string> {
    try {
      const response = await fetch(fileUri);
      const blob = await response.blob();

      const storageRef = ref(storage, `videos/${fileName}`);
      await uploadBytes(storageRef, blob);

      const downloadURL = await getDownloadURL(storageRef);
      console.log('✅ Video uploaded successfully:', downloadURL);
      return downloadURL;
    } catch (error) {
      console.error('❌ Error uploading video:', error);
      throw error;
    }
  }

  /**
   * Upload thumbnail to Firebase Storage
   */
  static async uploadThumbnail(fileUri: string, fileName: string): Promise<string> {
    try {
      const response = await fetch(fileUri);
      const blob = await response.blob();

      const storageRef = ref(storage, `thumbnails/${fileName}`);
      await uploadBytes(storageRef, blob);

      const downloadURL = await getDownloadURL(storageRef);
      console.log('✅ Thumbnail uploaded successfully:', downloadURL);
      return downloadURL;
    } catch (error) {
      console.error('❌ Error uploading thumbnail:', error);
      throw error;
    }
  }
}