import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Alert,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { ArrowLeft, Play, CheckCircle, BookOpen, Video as VideoIcon } from '@/components/Icons';
import { COLORS } from '@/constants/styles';
import { useRoleStore } from '@/hooks/useRoleStore';
import { collection, query, where, getDocs, doc, getDoc } from 'firebase/firestore';
import { db } from '@/config/firebase';



const { width: SCREEN_WIDTH } = Dimensions.get('window');

type TabType = 'training' | 'watched';

interface CompletedVideoItem {
  videoId: string;
  videoTopic: string;
  videoUrl: string;
  completedAt: number;
  assignmentId: string;
  thumbnail?: string;
  duration?: number;
}

export default function WatchVideoModule() {
  const router = useRouter();
  const { user } = useRoleStore();
  const currentMinerId = user?.id || '';

  const [activeTab, setActiveTab] = useState<TabType>('training');
  const [loading, setLoading] = useState(false);
  const [completedVideos, setCompletedVideos] = useState<CompletedVideoItem[]>([]);

  useEffect(() => {
    if (activeTab === 'watched' && currentMinerId) {
      loadCompletedVideos();
    }
  }, [activeTab, currentMinerId]);

  const loadCompletedVideos = async () => {
    if (!currentMinerId) {
      return;
    }

    try {
      setLoading(true);

      // Query videoAssignments where minerId is in assignedTo array
      const assignmentsRef = collection(db, 'videoAssignments');
      const assignmentsQuery = query(
        assignmentsRef,
        where('assignedTo', 'array-contains', currentMinerId)
      );
      
      const assignmentsSnapshot = await getDocs(assignmentsQuery);
      
      const completed: CompletedVideoItem[] = [];

      for (const assignmentDoc of assignmentsSnapshot.docs) {
        const assignmentData = assignmentDoc.data();
        const assignmentId = assignmentDoc.id;

        // Fetch video from videoLibrary
        const videoDoc = await getDoc(doc(db, 'videoLibrary', assignmentData.videoId));
        if (!videoDoc.exists()) {
          continue;
        }

        const videoData = videoDoc.data();
        if (!videoData.videoUrl || !videoData.topic) {
          continue;
        }

        // 5. Check progress in assignmentProgress collection
        const progressId = `${assignmentId}_${currentMinerId}`;
        console.log(`[WATCH_VIDEO]   Checking progress: ${progressId}`);
        const progressDoc = await getDoc(doc(db, 'assignmentProgress', progressId));
        
        if (!progressDoc.exists()) {
          console.log('[WATCH_VIDEO]   ⏭️ Skipping - no progress record found');
          continue;
        }
        
        const progressData = progressDoc.data();
        console.log('[WATCH_VIDEO]   Progress data:', {
          watched: progressData.watched,
          status: progressData.status,
          progress: progressData.progress,
          watchedDuration: progressData.watchedDuration
        });
        
        // 6. Check if completed (multiple conditions with SAFE null checks)
        const isCompleted = 
          progressData.watched === true ||
          progressData.status === 'completed' ||
          (progressData.progress || 0) >= 100 ||
          (progressData.watchedDuration && progressData.totalDuration && 
           progressData.watchedDuration >= progressData.totalDuration * 0.9);

        if (!isCompleted) {
          continue;
        }

        // 7. SAFE timestamp handling - handle Firestore Timestamp and ISO strings
        let completedAtTimestamp = Date.now();
        if (progressData.completedAt) {
          // Try .toDate() method (Firestore Timestamp)
          if (typeof progressData.completedAt.toDate === 'function') {
            completedAtTimestamp = progressData.completedAt.toDate().getTime();
          }
          // Try .toMillis() method (Firestore Timestamp)
          else if (typeof progressData.completedAt.toMillis === 'function') {
            completedAtTimestamp = progressData.completedAt.toMillis();
          }
          // Try direct timestamp number
          else if (typeof progressData.completedAt === 'number') {
            completedAtTimestamp = progressData.completedAt;
          }
          // Try ISO string
          else if (typeof progressData.completedAt === 'string') {
            completedAtTimestamp = new Date(progressData.completedAt).getTime();
          }
        }

        // 8. Add to completed list
        const completedVideo: CompletedVideoItem = {
          videoId: assignmentData.videoId,
          videoTopic: assignmentData.videoTopic || videoData.topic,
          videoUrl: videoData.videoUrl,
          completedAt: completedAtTimestamp,
          assignmentId: assignmentId,
          thumbnail: videoData.thumbnailUrl,
          duration: videoData.duration,
        };

        completed.push(completedVideo);
      }

      // 9. Sort by completion date (most recent first)
      completed.sort((a, b) => b.completedAt - a.completedAt);

      setCompletedVideos(completed);
    } catch (error) {
      console.error('[WVM] ❌ Error loading completed videos:', error);
      Alert.alert('Error', 'Failed to load completed videos. Check console for details.');
      setCompletedVideos([]);
    } finally {
      setLoading(false);
    }
  };

  const renderTabHeader = () => (
    <View style={styles.tabContainer}>
      <TouchableOpacity
        style={[
          styles.tab,
          activeTab === 'training-model' && styles.activeTab,
        ]}
        onPress={() => handleTabChange('training-model')}
      >
        <BookOpen size={20} color={activeTab === 'training-model' ? COLORS.primary : COLORS.textMuted} />
        <Text
          style={[
            styles.tabText,
            activeTab === 'training-model' && styles.activeTabText,
          ]}
        >
          Training Model
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={[
          styles.tab,
          activeTab === 'watched-videos' && styles.activeTab,
        ]}
        onPress={() => handleTabChange('watched-videos')}
      >
        <CheckCircle size={20} color={activeTab === 'watched-videos' ? COLORS.primary : COLORS.textMuted} />
        <Text
          style={[
            styles.tabText,
            activeTab === 'watched-videos' && styles.activeTabText,
          ]}
        >
          Watched Videos
        </Text>
      </TouchableOpacity>
    </View>
  );

  const renderTrainingModel = () => (
    <View style={styles.contentContainer}>
      <Text style={styles.sectionTitle}>📚 Training Model Content</Text>
      <Text style={styles.sectionDescription}>
        Access general safety training materials and educational content.
      </Text>

      <View style={styles.trainingCard}>
        <View style={styles.trainingIconContainer}>
          <BookOpen size={32} color={COLORS.primary} />
        </View>
        <Text style={styles.trainingCardTitle}>Safety Fundamentals</Text>
        <Text style={styles.trainingCardDescription}>
          Learn the basic principles of mine safety, hazard identification, and emergency procedures.
        </Text>
        <TouchableOpacity style={styles.trainingButton}>
          <Text style={styles.trainingButtonText}>Start Learning</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.trainingCard}>
        <View style={styles.trainingIconContainer}>
          <BookOpen size={32} color={COLORS.primary} />
        </View>
        <Text style={styles.trainingCardTitle}>PPE Guidelines</Text>
        <Text style={styles.trainingCardDescription}>
          Understand proper use and maintenance of Personal Protective Equipment.
        </Text>
        <TouchableOpacity style={styles.trainingButton}>
          <Text style={styles.trainingButtonText}>Start Learning</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.trainingCard}>
        <View style={styles.trainingIconContainer}>
          <BookOpen size={32} color={COLORS.primary} />
        </View>
        <Text style={styles.trainingCardTitle}>Emergency Response</Text>
        <Text style={styles.trainingCardDescription}>
          Critical procedures for emergency situations and evacuation protocols.
        </Text>
        <TouchableOpacity style={styles.trainingButton}>
          <Text style={styles.trainingButtonText}>Start Learning</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.infoBox}>
        <Text style={styles.infoText}>
          💡 These training modules are available anytime for reference and continuous learning.
        </Text>
      </View>
    </View>
  );

  const renderCompletedVideos = () => {
    if (loading) {
      return (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.primary} />
          <Text style={styles.loadingText}>Loading completed videos...</Text>
        </View>
      );
    }

    if (completedVideos.length === 0) {
      return (
        <View style={styles.emptyContainer}>
          <CheckCircle size={64} color={COLORS.textMuted} />
          <Text style={styles.emptyTitle}>No Completed Videos</Text>
          <Text style={styles.emptyText}>
            Videos you complete from your assignments will appear here.
          </Text>
          <TouchableOpacity
            style={styles.goToAssignmentsButton}
            onPress={() => router.push('/miner/AssignedVideos')}
          >
            <Text style={styles.goToAssignmentsButtonText}>View Assignments</Text>
          </TouchableOpacity>
        </View>
      );
    }

    return (
      <View style={styles.contentContainer}>
        <Text style={styles.sectionTitle}>
          ✅ Completed Videos ({completedVideos.length})
        </Text>
        <Text style={styles.sectionDescription}>
          Videos you have successfully watched and completed.
        </Text>

        {completedVideos.map((video) => (
          <View key={video.assignmentId} style={styles.completedVideoCard}>
            <View style={styles.completedVideoHeader}>
              <View style={styles.completedVideoIconContainer}>
                <VideoIcon size={24} color={COLORS.success} />
              </View>
              <View style={styles.completedVideoInfo}>
                <Text style={styles.completedVideoTitle}>{video.videoTopic}</Text>
                <Text style={styles.completedVideoDate}>
                  Completed: {new Date(video.completedAt).toLocaleDateString()}
                </Text>
                {video.duration && (
                  <Text style={styles.completedVideoDuration}>
                    Duration: {Math.round(video.duration / 60)} min
                  </Text>
                )}
              </View>
            </View>

            <View style={styles.completedBadge}>
              <CheckCircle size={16} color={COLORS.success} />
              <Text style={styles.completedBadgeText}>Completed</Text>
            </View>

            <TouchableOpacity
              style={styles.rewatchButton}
              onPress={() => {
                Alert.alert(
                  'Rewatch Video',
                  'Would you like to watch this video again?',
                  [
                    { text: 'Cancel', style: 'cancel' },
                    {
                      text: 'Watch Again',
                      onPress: () => {
                        // Navigate to video player
                        router.push({
                          pathname: '/miner/VideoPlayer',
                          params: {
                            videoId: video.videoId,
                            videoTopic: video.videoTopic,
                            videoUrl: video.videoUrl,
                            assignmentId: video.assignmentId,
                            isRewatch: 'true',
                          },
                        });
                      },
                    },
                  ]
                );
              }}
            >
              <Play size={16} color={COLORS.primary} />
              <Text style={styles.rewatchButtonText}>Watch Again</Text>
            </TouchableOpacity>
          </View>
        ))}
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <ArrowLeft size={24} color={COLORS.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Watch Video Module</Text>
        <View style={{ width: 24 }} />
      </View>

      {/* Tab Header */}
      {renderTabHeader()}

      {/* Content */}
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {activeTab === 'training-model' ? renderTrainingModel() : renderCompletedVideos()}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: COLORS.card,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.text,
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: COLORS.card,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    paddingHorizontal: 4,
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    paddingHorizontal: 12,
    gap: 8,
    borderBottomWidth: 3,
    borderBottomColor: 'transparent',
  },
  activeTab: {
    borderBottomColor: COLORS.primary,
  },
  tabText: {
    fontSize: 14,
    fontWeight: '500',
    color: COLORS.textMuted,
  },
  activeTabText: {
    color: COLORS.primary,
    fontWeight: '600',
  },
  scrollView: {
    flex: 1,
  },
  contentContainer: {
    padding: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: 8,
  },
  sectionDescription: {
    fontSize: 14,
    color: COLORS.textMuted,
    marginBottom: 20,
    lineHeight: 20,
  },
  trainingCard: {
    backgroundColor: COLORS.card,
    borderRadius: 12,
    padding: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  trainingIconContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: `${COLORS.primary}15`,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  trainingCardTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 8,
  },
  trainingCardDescription: {
    fontSize: 14,
    color: COLORS.textMuted,
    lineHeight: 20,
    marginBottom: 16,
  },
  trainingButton: {
    backgroundColor: COLORS.primary,
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    alignItems: 'center',
  },
  trainingButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  infoBox: {
    backgroundColor: `${COLORS.secondary}15`,
    borderRadius: 8,
    padding: 16,
    marginTop: 8,
    borderLeftWidth: 4,
    borderLeftColor: COLORS.secondary,
  },
  infoText: {
    fontSize: 13,
    color: COLORS.text,
    lineHeight: 18,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 14,
    color: COLORS.textMuted,
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.text,
    marginTop: 16,
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 14,
    color: COLORS.textMuted,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 24,
  },
  goToAssignmentsButton: {
    backgroundColor: COLORS.primary,
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
  },
  goToAssignmentsButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  completedVideoCard: {
    backgroundColor: COLORS.card,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderLeftWidth: 4,
    borderLeftColor: COLORS.success,
  },
  completedVideoHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  completedVideoIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: `${COLORS.success}15`,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  completedVideoInfo: {
    flex: 1,
  },
  completedVideoTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 4,
  },
  completedVideoDate: {
    fontSize: 13,
    color: COLORS.textMuted,
    marginBottom: 2,
  },
  completedVideoDuration: {
    fontSize: 12,
    color: COLORS.textMuted,
  },
  completedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    backgroundColor: `${COLORS.success}15`,
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 20,
    marginBottom: 12,
    gap: 6,
  },
  completedBadgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.success,
  },
  rewatchButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.background,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: COLORS.border,
    gap: 8,
  },
  rewatchButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.primary,
  },
});
