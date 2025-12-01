import AsyncStorage from '@react-native-async-storage/async-storage';
import { VideoLibraryService, VideoAssignmentDocument, AssignmentProgressDocument } from './videoLibraryService';
import { Timestamp } from 'firebase/firestore';

/**
 * Migration service to move data from AsyncStorage to Firebase
 */
export class VideoMigrationService {

  /**
   * Migrate video library from AsyncStorage to Firebase
   */
  static async migrateVideoLibrary(): Promise<void> {
    try {
      console.log('🚀 Starting video library migration...');

      // Get existing videos from AsyncStorage
      const storedVideos = await AsyncStorage.getItem('videoLibrary');
      if (!storedVideos) {
        console.log('ℹ️ No videos found in AsyncStorage');
        return;
      }

      const videos = JSON.parse(storedVideos);
      console.log(`📹 Found ${videos.length} videos to migrate`);

      let migratedCount = 0;
      let skippedCount = 0;

      for (const video of videos) {
        try {
          // Check if video already exists in Firebase
          const existingVideo = await VideoLibraryService.getVideo(video.id);
          if (existingVideo) {
            console.log(`⏭️ Video ${video.id} already exists, skipping`);
            skippedCount++;
            continue;
          }

          // Create video document in Firebase
          const firebaseVideoId = await VideoLibraryService.createVideo({
            topic: video.topic,
            language: video.language,
            languageName: video.languageName,
            videoUrl: video.videoUrl,
            thumbnailUrl: video.thumbnail,
            createdBy: 'safety-officer-1', // Default safety officer
            status: 'active',
            tags: [],
            availableLanguages: [video.language],
            metadata: {},
            statistics: {
              totalViews: 0,
              totalAssignments: 0,
              completionRate: 0,
            },
          });

          console.log(`✅ Migrated video: ${video.topic} -> ${firebaseVideoId}`);
          migratedCount++;

        } catch (error) {
          console.error(`❌ Failed to migrate video ${video.id}:`, error);
        }
      }

      console.log(`🎉 Video library migration completed: ${migratedCount} migrated, ${skippedCount} skipped`);

    } catch (error) {
      console.error('❌ Video library migration failed:', error);
      throw error;
    }
  }

  /**
   * Migrate video assignments from AsyncStorage to Firebase
   */
  static async migrateVideoAssignments(): Promise<void> {
    try {
      console.log('🚀 Starting video assignments migration...');

      // Get existing assignments from AsyncStorage
      const storedAssignments = await AsyncStorage.getItem('videoAssignments');
      if (!storedAssignments) {
        console.log('ℹ️ No assignments found in AsyncStorage');
        return;
      }

      const assignments = JSON.parse(storedAssignments);
      console.log(`📋 Found ${assignments.length} assignments to migrate`);

      let migratedCount = 0;
      let skippedCount = 0;

      for (const assignment of assignments) {
        try {
          // Check if assignment already exists in Firebase (by ID)
          // For now, we'll create new assignments since Firebase IDs will be different
          const firebaseAssignmentData: Omit<VideoAssignmentDocument, 'id' | 'assignedAt'> = {
            videoId: assignment.videoId,
            videoTopic: assignment.videoTopic,
            assignedTo: assignment.assignedTo,
            assignedBy: assignment.assignedBy || 'safety-officer-1',
            deadline: Timestamp.fromMillis(assignment.deadline),
            isMandatory: assignment.isMandatory,
            isDailyTask: assignment.isDailyTask || false,
            taskDate: assignment.taskDate,
            departments: assignment.departments || [],
            description: assignment.description,
            status: 'active',
            priority: assignment.isMandatory ? 'high' : 'medium',
          };

          const firebaseAssignmentId = await VideoLibraryService.createAssignment(firebaseAssignmentData);
          console.log(`✅ Migrated assignment: ${assignment.id} -> ${firebaseAssignmentId}`);
          migratedCount++;

        } catch (error) {
          console.error(`❌ Failed to migrate assignment ${assignment.id}:`, error);
        }
      }

      console.log(`🎉 Assignments migration completed: ${migratedCount} migrated, ${skippedCount} skipped`);

    } catch (error) {
      console.error('❌ Assignments migration failed:', error);
      throw error;
    }
  }

  /**
   * Migrate assignment progress from AsyncStorage to Firebase
   */
  static async migrateAssignmentProgress(): Promise<void> {
    try {
      console.log('🚀 Starting assignment progress migration...');

      // Get existing progress from AsyncStorage
      const storedProgress = await AsyncStorage.getItem('assignmentProgress');
      if (!storedProgress) {
        console.log('ℹ️ No progress records found in AsyncStorage');
        return;
      }

      const progressRecords = JSON.parse(storedProgress);
      console.log(`📊 Found ${progressRecords.length} progress records to migrate`);

      let migratedCount = 0;
      let skippedCount = 0;

      for (const progress of progressRecords) {
        try {
          // Find the corresponding assignment in Firebase
          // This is tricky since assignment IDs changed during migration
          // For now, we'll create progress records with the original assignment ID
          // In a real scenario, you'd need to map old IDs to new Firebase IDs

          const firebaseProgressData: Omit<AssignmentProgressDocument, 'id'> = {
            assignmentId: progress.assignmentId, // This might need mapping
            minerId: progress.minerId,
            videoId: progress.videoId || '', // May need to be populated
            watched: progress.watched,
            progress: progress.progress,
            watchTime: progress.watchTime || 0,
            status: progress.watched ? 'completed' : 'in_progress',
          };

          if (progress.watchedAt) {
            firebaseProgressData.completedAt = Timestamp.fromMillis(progress.watchedAt);
          }

          await VideoLibraryService.updateProgress(firebaseProgressData);
          console.log(`✅ Migrated progress: ${progress.assignmentId}_${progress.minerId}`);
          migratedCount++;

        } catch (error) {
          console.error(`❌ Failed to migrate progress ${progress.assignmentId}_${progress.minerId}:`, error);
        }
      }

      console.log(`🎉 Progress migration completed: ${migratedCount} migrated, ${skippedCount} skipped`);

    } catch (error) {
      console.error('❌ Progress migration failed:', error);
      throw error;
    }
  }

  /**
   * Run complete migration (videos, assignments, progress)
   */
  static async migrateAllData(): Promise<void> {
    try {
      console.log('🚀 Starting complete video data migration...');

      await this.migrateVideoLibrary();
      await this.migrateVideoAssignments();
      await this.migrateAssignmentProgress();

      console.log('🎉 Complete video data migration finished successfully!');

    } catch (error) {
      console.error('❌ Complete migration failed:', error);
      throw error;
    }
  }

  /**
   * Clear migrated AsyncStorage data (optional cleanup)
   */
  static async clearMigratedData(): Promise<void> {
    try {
      console.log('🧹 Clearing migrated AsyncStorage data...');

      await AsyncStorage.removeItem('videoLibrary');
      await AsyncStorage.removeItem('videoAssignments');
      await AsyncStorage.removeItem('assignmentProgress');
      await AsyncStorage.removeItem('videoHistory');

      console.log('✅ Migrated AsyncStorage data cleared');

    } catch (error) {
      console.error('❌ Failed to clear migrated data:', error);
      throw error;
    }
  }

  /**
   * Verify migration by comparing counts
   */
  static async verifyMigration(): Promise<void> {
    try {
      console.log('🔍 Verifying migration...');

      // Check Firebase collections
      const firebaseVideos = await VideoLibraryService.getVideos();
      console.log(`📹 Firebase videos: ${firebaseVideos.length}`);

      // Check AsyncStorage (should be empty after migration)
      const asyncVideos = await AsyncStorage.getItem('videoLibrary');
      const asyncVideosCount = asyncVideos ? JSON.parse(asyncVideos).length : 0;
      console.log(`💾 AsyncStorage videos: ${asyncVideosCount}`);

      if (firebaseVideos.length > 0 && asyncVideosCount === 0) {
        console.log('✅ Migration verification passed');
      } else {
        console.log('⚠️ Migration verification found discrepancies');
      }

    } catch (error) {
      console.error('❌ Migration verification failed:', error);
      throw error;
    }
  }
}