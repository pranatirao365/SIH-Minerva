import { collection, doc, setDoc, getDoc, getDocs, updateDoc, deleteDoc, query, where, orderBy, limit, Timestamp, addDoc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { db, storage } from '../config/firebase';

// Video Library Collection Types
export interface VideoDocument {
  id: string;
  topic: string;
  description?: string;
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

// Video Request Collection Types
export interface VideoRequestDocument {
  id: string;
  topic: string;
  language: string;
  description: string;
  requestedBy: string; // supervisor ID
  requestedByName: string; // supervisor name
  requestedAt: Timestamp;
  status: 'pending' | 'in-progress' | 'completed' | 'rejected';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  assignedTo?: string; // safety officer ID
  minerIds?: string[]; // miner IDs to assign the video to when completed
  videoId?: string; // populated when request is fulfilled
  notes?: string; // additional notes from safety officer
  updatedAt: Timestamp;
  completedAt?: Timestamp;
}

/**
 * Video Library Service
 * Handles all video-related Firebase operations
 */
export class VideoLibraryService {

  // ==================== UTILITY FUNCTIONS ====================

  /**
   * Upload video file to Firebase Storage
   * Returns globally accessible download URL
   */
  static async uploadVideoToStorage(videoUrl: string, fileName: string): Promise<string> {
    try {
      console.log('📤 Uploading video to Firebase Storage...');
      console.log('📹 Video URL:', videoUrl);
      
      // Fetch the video file
      const response = await fetch(videoUrl);
      if (!response.ok) {
        throw new Error(`Failed to fetch video: ${response.status}`);
      }
      
      const blob = await response.blob();
      console.log('📦 Video size:', (blob.size / 1024 / 1024).toFixed(2), 'MB');
      
      // Create storage reference
      const timestamp = Date.now();
      const storageRef = ref(storage, `videos/${timestamp}_${fileName}`);
      
      // Upload to Firebase Storage
      console.log('⬆️ Uploading to Firebase Storage...');
      const uploadResult = await uploadBytes(storageRef, blob, {
        contentType: 'video/mp4',
      });
      
      // Get download URL
      const downloadURL = await getDownloadURL(uploadResult.ref);
      console.log('✅ Video uploaded successfully!');
      console.log('🌐 Global URL:', downloadURL);
      
      return downloadURL;
    } catch (error) {
      console.error('❌ Error uploading video to storage:', error);
      throw error;
    }
  }

  /**
   * Delete video file from backend server
   * Call this after successfully uploading to Firebase Storage
   */
  static async deleteVideoFromServer(videoUrl: string): Promise<void> {
    try {
      console.log('🗑️ Deleting video from local server...');
      console.log('📹 Video URL:', videoUrl);
      
      // Extract the video path from URL
      // URL format: http://172.16.58.80:4000/videos/filename.mp4
      const urlParts = videoUrl.split('/videos/');
      if (urlParts.length < 2) {
        console.warn('⚠️ Invalid video URL format, skipping deletion');
        return;
      }
      
      const filename = urlParts[1];
      const deleteUrl = `http://${process.env.EXPO_PUBLIC_IP_ADDRESS || '172.16.58.80'}:4000/api/video/delete/${filename}`;
      
      console.log('🔗 Delete endpoint:', deleteUrl);
      
      const response = await fetch(deleteUrl, {
        method: 'DELETE',
      });
      
      if (!response.ok) {
        throw new Error(`Failed to delete video: ${response.status}`);
      }
      
      console.log('✅ Video deleted from server successfully!');
    } catch (error) {
      console.error('❌ Error deleting video from server:', error);
      // Don't throw - deletion failure shouldn't break the save flow
      console.warn('⚠️ Continuing despite deletion error...');
    }
  }

  /**
   * Remove undefined values from an object (Firestore doesn't support undefined)
   * Recursively cleans nested objects
   */
  private static removeUndefined<T extends Record<string, any>>(obj: T): Partial<T> {
    const cleaned: any = {};
    
    for (const key in obj) {
      const value = obj[key];
      
      if (value === undefined) {
        // Skip undefined values
        continue;
      } else if (value === null) {
        // Keep null values
        cleaned[key] = null;
      } else if (typeof value === 'object' && !Array.isArray(value) && !(value as any instanceof Timestamp)) {
        // Recursively clean nested objects (but not arrays or Timestamps)
        const cleanedNested = this.removeUndefined(value);
        if (Object.keys(cleanedNested).length > 0) {
          cleaned[key] = cleanedNested;
        }
      } else {
        // Keep all other values
        cleaned[key] = value;
      }
    }
    
    return cleaned;
  }

  // ==================== VIDEO LIBRARY OPERATIONS ====================

  /**
   * Check if a video with the same topic and language already exists
   * Returns the existing video document if found, null otherwise
   */
  static async checkDuplicateVideo(topic: string, language: string): Promise<VideoDocument | null> {
    try {
      console.log('🔍 Checking for duplicate video...');
      console.log('📝 Topic:', topic);
      console.log('🌐 Language:', language);

      const videosRef = collection(db, 'videoLibrary');
      const q = query(
        videosRef,
        where('topic', '==', topic.trim()),
        where('language', '==', language),
        where('status', '==', 'active'),
        limit(1)
      );

      const querySnapshot = await getDocs(q);

      if (!querySnapshot.empty) {
        const existingVideo = querySnapshot.docs[0].data() as VideoDocument;
        console.log('⚠️ Duplicate video found:', existingVideo.id);
        return existingVideo;
      }

      console.log('✅ No duplicate found');
      return null;
    } catch (error) {
      console.error('❌ Error checking for duplicate video:', error);
      throw error;
    }
  }

  /**
   * Create a new video document in Firestore
   */
  static async createVideo(videoData: Omit<VideoDocument, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
    try {
      const videoId = `video_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      const videoRef = doc(db, 'videoLibrary', videoId);

      // Remove undefined values to prevent Firestore errors
      const cleanedVideoData = this.removeUndefined(videoData as Record<string, any>);

      const videoDoc: any = {
        ...cleanedVideoData,
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
      console.log('🔍 VideoLibraryService.getVideos called with options:', options);
      
      // Try with ordering first, fallback to simple query if it fails
      let querySnapshot;
      try {
        const q = query(collection(db, 'videoLibrary'), orderBy('createdAt', 'desc'));
        console.log('🔍 Query created for collection: videoLibrary with ordering');
        querySnapshot = await getDocs(q);
      } catch (orderError) {
        console.warn('⚠️ Ordered query failed, trying simple query:', orderError);
        const q = collection(db, 'videoLibrary');
        querySnapshot = await getDocs(q);
      }
      
      console.log('🔍 Query executed, snapshot size:', querySnapshot.size);
      
      let videos: VideoDocument[] = [];

      querySnapshot.forEach((doc) => {
        const data = doc.data() as VideoDocument;
        console.log('📄 Document:', doc.id, 'data keys:', Object.keys(data), 'status:', data.status);
        videos.push(data);
      });

      console.log('📊 Videos before filtering:', videos.length);

      // Filter in memory to avoid composite index requirements
      if (options.status) {
        console.log('🔍 Filtering by status:', options.status);
        videos = videos.filter(v => {
          const videoStatus = v.status || 'active'; // Default to 'active' if status is missing
          return videoStatus === options.status;
        });
        console.log('📊 Videos after status filter:', videos.length);
      }

      if (options.language) {
        videos = videos.filter(v => v.language === options.language);
      }

      if (options.createdBy) {
        videos = videos.filter(v => v.createdBy === options.createdBy);
      }

      if (options.limit) {
        videos = videos.slice(0, options.limit);
      }

      console.log('📊 Videos after filtering:', videos.length);
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

  // ==================== VIDEO REQUEST OPERATIONS ====================

  /**
   * Create a new video request from supervisor
   */
  static async createVideoRequest(requestData: Omit<VideoRequestDocument, 'id' | 'requestedAt' | 'updatedAt' | 'status'>): Promise<string> {
    try {
      const requestId = `request_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      const requestRef = doc(db, 'videoRequests', requestId);

      const requestDoc: VideoRequestDocument = {
        ...requestData,
        id: requestId,
        status: 'pending',
        requestedAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
      };

      await setDoc(requestRef, requestDoc);
      console.log('✅ Video request created successfully:', requestId);

      // Create notifications for all safety officers
      try {
        console.log('🔍 Searching for safety officers...');
        // Try both role formats (with hyphen and underscore)
        const safetyOfficersQuery1 = query(
          collection(db, 'users'),
          where('role', '==', 'safety-officer')
        );
        const safetyOfficersQuery2 = query(
          collection(db, 'users'),
          where('role', '==', 'safety_officer')
        );
        
        const [snapshot1, snapshot2] = await Promise.all([
          getDocs(safetyOfficersQuery1),
          getDocs(safetyOfficersQuery2)
        ]);
        
        // Combine results and remove duplicates
        const safetyOfficerDocs = new Map();
        snapshot1.docs.forEach(doc => safetyOfficerDocs.set(doc.id, doc));
        snapshot2.docs.forEach(doc => safetyOfficerDocs.set(doc.id, doc));
        
        const safetyOfficersSnapshot = Array.from(safetyOfficerDocs.values());
        
        console.log(`📋 Found ${safetyOfficersSnapshot.length} safety officers`);

        const notificationPromises = safetyOfficersSnapshot.map(async (safetyOfficerDoc) => {
          const safetyOfficer = safetyOfficerDoc.data();
          const priorityEmoji = requestData.priority === 'urgent' ? '🚨' : requestData.priority === 'high' ? '⚠️' : requestData.priority === 'medium' ? '📹' : '📝';
          
          console.log(`📧 Creating notification for safety officer: ${safetyOfficerDoc.id} (${safetyOfficer.name})`);
          
          return addDoc(collection(db, 'notifications'), {
            recipientId: safetyOfficerDoc.id,
            recipientName: safetyOfficer.name || 'Safety Officer',
            senderId: requestData.requestedBy,
            senderName: requestData.requestedByName,
            type: 'video_request',
            title: `${priorityEmoji} New Video Request`,
            message: `${requestData.requestedByName} has requested a video on "${requestData.topic}". ${requestData.description}`,
            priority: requestData.priority,
            read: false,
            actionRequired: true,
            createdAt: Timestamp.now(),
            metadata: {
              requestId,
              videoTopic: requestData.topic,
              requestPriority: requestData.priority,
              requestDescription: requestData.description,
              requestLanguage: requestData.language,
            },
          });
        });

        await Promise.all(notificationPromises);
        console.log(`✅ Video request notifications sent to ${safetyOfficersSnapshot.length} safety officers`);
      } catch (notificationError) {
        console.error('❌ Error creating notifications for video request:', notificationError);
        // Don't throw - request was created successfully even if notifications failed
      }

      return requestId;
    } catch (error) {
      console.error('❌ Error creating video request:', error);
      throw error;
    }
  }

  /**
   * Get all video requests (for safety officers)
   */
  static async getAllVideoRequests(statusFilter?: 'pending' | 'in-progress' | 'completed' | 'rejected'): Promise<VideoRequestDocument[]> {
    try {
      const requestsRef = collection(db, 'videoRequests');
      let q = query(requestsRef, orderBy('requestedAt', 'desc'));

      if (statusFilter) {
        q = query(requestsRef, where('status', '==', statusFilter), orderBy('requestedAt', 'desc'));
      }

      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(doc => {
        const data = doc.data();
        return {
          ...data,
          id: doc.id,
          requestedAt: (data.requestedAt && typeof data.requestedAt.toDate === 'function') ? data.requestedAt : Timestamp.now(),
          updatedAt: (data.updatedAt && typeof data.updatedAt.toDate === 'function') ? data.updatedAt : Timestamp.now(),
          completedAt: data.completedAt && typeof data.completedAt.toDate === 'function' ? data.completedAt : undefined,
        } as VideoRequestDocument;
      });
    } catch (error) {
      console.error('❌ Error getting video requests:', error);
      throw error;
    }
  }

  /**
   * Get video requests by supervisor ID
   */
  static async getSupervisorRequests(supervisorId: string): Promise<VideoRequestDocument[]> {
    try {
      const requestsRef = collection(db, 'videoRequests');
      const q = query(requestsRef, where('requestedBy', '==', supervisorId), orderBy('requestedAt', 'desc'));

      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(doc => {
        const data = doc.data();
        return {
          ...data,
          id: doc.id,
          requestedAt: (data.requestedAt && typeof data.requestedAt.toDate === 'function') ? data.requestedAt : Timestamp.now(),
          updatedAt: (data.updatedAt && typeof data.updatedAt.toDate === 'function') ? data.updatedAt : Timestamp.now(),
        } as VideoRequestDocument;
      });
    } catch (error) {
      console.error('❌ Error getting supervisor requests:', error);
      throw error;
    }
  }

  /**
   * Update video request status
   */
  static async updateVideoRequest(requestId: string, updates: Partial<VideoRequestDocument>): Promise<void> {
    try {
      console.log('🔄 Updating video request:', requestId, 'with updates:', updates);
      const requestRef = doc(db, 'videoRequests', requestId);
      
      // Check if document exists first
      const docSnap = await getDoc(requestRef);
      if (!docSnap.exists()) {
        console.error('❌ Video request document does not exist:', requestId);
        throw new Error(`Video request ${requestId} does not exist`);
      }
      
      console.log('📄 Current request data:', docSnap.data());
      
      await updateDoc(requestRef, {
        ...updates,
        updatedAt: Timestamp.now(),
      });
      console.log('✅ Video request updated successfully:', requestId);
    } catch (error) {
      console.error('❌ Error updating video request:', error);
      console.error('❌ Request ID:', requestId);
      console.error('❌ Updates:', updates);
      throw error;
    }
  }

  /**
   * Complete video request with video ID
   */
  static async completeVideoRequest(requestId: string, videoId: string, notes?: string): Promise<void> {
    try {
      const requestRef = doc(db, 'videoRequests', requestId);
      await updateDoc(requestRef, {
        status: 'completed',
        videoId,
        notes,
        completedAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
      });
      console.log('✅ Video request completed successfully:', requestId);
    } catch (error) {
      console.error('❌ Error completing video request:', error);
      throw error;
    }
  }

  /**
   * Get a specific video request by ID
   */
  static async getVideoRequestById(requestId: string): Promise<VideoRequestDocument | null> {
    try {
      const requestRef = doc(db, 'videoRequests', requestId);
      const requestSnap = await getDoc(requestRef);

      if (requestSnap.exists()) {
        const data = requestSnap.data();
        return {
          ...data,
          id: requestSnap.id,
          requestedAt: (data.requestedAt && typeof data.requestedAt.toDate === 'function') ? data.requestedAt : Timestamp.now(),
          updatedAt: (data.updatedAt && typeof data.updatedAt.toDate === 'function') ? data.updatedAt : Timestamp.now(),
        } as VideoRequestDocument;
      } else {
        console.log('❌ Video request not found:', requestId);
        return null;
      }
    } catch (error) {
      console.error('❌ Error getting video request:', error);
      throw error;
    }
  }

  /**
   * Delete video request
   */
  static async deleteVideoRequest(requestId: string): Promise<void> {
    try {
      const requestRef = doc(db, 'videoRequests', requestId);
      await deleteDoc(requestRef);
      console.log('✅ Video request deleted successfully:', requestId);
    } catch (error) {
      console.error('❌ Error deleting video request:', error);
      throw error;
    }
  }

  // ==================== SMART VIDEO SEARCH OPERATIONS ====================

  /**
   * Calculate similarity between two strings using Levenshtein distance
   * Returns similarity percentage (0-100)
   */
  private static calculateSimilarity(str1: string, str2: string): number {
    const s1 = str1.toLowerCase().trim();
    const s2 = str2.toLowerCase().trim();

    // If strings are identical
    if (s1 === s2) return 100;

    // Calculate Levenshtein distance
    const matrix: number[][] = [];
    const len1 = s1.length;
    const len2 = s2.length;

    // Initialize matrix
    for (let i = 0; i <= len1; i++) {
      matrix[i] = [i];
    }
    for (let j = 0; j <= len2; j++) {
      matrix[0][j] = j;
    }

    // Fill matrix
    for (let i = 1; i <= len1; i++) {
      for (let j = 1; j <= len2; j++) {
        if (s1.charAt(i - 1) === s2.charAt(j - 1)) {
          matrix[i][j] = matrix[i - 1][j - 1];
        } else {
          matrix[i][j] = Math.min(
            matrix[i - 1][j - 1] + 1, // substitution
            matrix[i][j - 1] + 1,     // insertion
            matrix[i - 1][j] + 1      // deletion
          );
        }
      }
    }

    const distance = matrix[len1][len2];
    const maxLen = Math.max(len1, len2);
    const similarity = ((maxLen - distance) / maxLen) * 100;

    return Math.round(similarity * 100) / 100; // Round to 2 decimal places
  }

  /**
   * Search videos by description similarity
   * Returns videos matching at least the threshold percentage (default 80%)
   */
  static async searchVideosBySimilarity(
    description: string,
    threshold: number = 80,
    language?: string
  ): Promise<(VideoDocument & { similarityScore: number })[]> {
    try {
      console.log('🔍 Searching videos by similarity...');
      console.log('📝 Description:', description);
      console.log('🎯 Threshold:', threshold + '%');

      const videosRef = collection(db, 'videoLibrary');
      let q = query(videosRef, where('status', '==', 'active'));

      // Filter by language if specified
      if (language) {
        q = query(q, where('language', '==', language));
      }

      const querySnapshot = await getDocs(q);
      const matches: (VideoDocument & { similarityScore: number })[] = [];

      querySnapshot.forEach((docSnap) => {
        const video = docSnap.data() as VideoDocument;
        
        // Calculate similarity with topic
        const topicSimilarity = this.calculateSimilarity(description, video.topic);
        
        // Calculate similarity with description if available
        const descSimilarity = video.description 
          ? this.calculateSimilarity(description, video.description)
          : 0;

        // Calculate similarity with tags
        const tagsSimilarity = video.tags && video.tags.length > 0
          ? Math.max(...video.tags.map(tag => this.calculateSimilarity(description, tag)))
          : 0;

        // Take the highest similarity score
        const maxSimilarity = Math.max(topicSimilarity, descSimilarity, tagsSimilarity);

        console.log(`📊 Video: "${video.topic}" | Similarity: ${maxSimilarity}%`);

        if (maxSimilarity >= threshold) {
          matches.push({
            ...video,
            similarityScore: maxSimilarity
          });
        }
      });

      // Sort by similarity score (highest first)
      matches.sort((a, b) => b.similarityScore - a.similarityScore);

      console.log(`✅ Found ${matches.length} matching videos above ${threshold}% threshold`);
      return matches;
    } catch (error) {
      console.error('❌ Error searching videos by similarity:', error);
      throw error;
    }
  }

  // ==================== NOTIFICATION OPERATIONS ====================

  /**
   * Create a notification
   */
  static async createNotification(notificationData: {
    userId: string;
    title: string;
    message: string;
    type: 'info' | 'success' | 'warning' | 'error';
    relatedId?: string; // video ID, assignment ID, etc.
    actionUrl?: string; // deep link or screen to navigate to
  }): Promise<string> {
    try {
      const notificationId = `notification_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      const notificationRef = doc(db, 'notifications', notificationId);

      const notification = {
        id: notificationId,
        ...notificationData,
        isRead: false,
        createdAt: Timestamp.now(),
      };

      await setDoc(notificationRef, notification);
      console.log('✅ Notification created:', notificationId);
      return notificationId;
    } catch (error) {
      console.error('❌ Error creating notification:', error);
      throw error;
    }
  }

  /**
   * Get notifications for a user
   */
  static async getUserNotifications(userId: string, limitCount: number = 50): Promise<any[]> {
    try {
      const q = query(
        collection(db, 'notifications'),
        where('userId', '==', userId),
        orderBy('createdAt', 'desc'),
        limit(limitCount)
      );

      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(doc => ({
        ...doc.data(),
        id: doc.id,
      }));
    } catch (error) {
      console.error('❌ Error getting notifications:', error);
      throw error;
    }
  }

  /**
   * Mark notification as read
   */
  static async markNotificationAsRead(notificationId: string): Promise<void> {
    try {
      const notificationRef = doc(db, 'notifications', notificationId);
      await updateDoc(notificationRef, {
        isRead: true,
        readAt: Timestamp.now(),
      });
    } catch (error) {
      console.error('❌ Error marking notification as read:', error);
      throw error;
    }
  }
}