import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { ArrowLeft, Play, CheckCircle, BookOpen, Video as VideoIcon, Award } from '@/components/Icons';
import { COLORS } from '@/constants/styles';
import { useRoleStore } from '@/hooks/useRoleStore';
import { collection, query, where, getDocs, doc, getDoc } from 'firebase/firestore';
import { db } from '@/config/firebase';

type TabType = 'training' | 'watched';

interface CompletedVideoItem {
  videoId: string;
  videoTopic: string;
  videoUrl: string;
  completedAt: number;
  assignmentId: string;
  thumbnail?: string;
  duration?: number;
  progress: number;
}

export default function WatchVideoScreen() {
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab, currentMinerId]);

  const loadCompletedVideos = async () => {
    if (!currentMinerId) return;

    try {
      setLoading(true);

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

        const progressId = `${assignmentId}_${currentMinerId}`;
        const progressDoc = await getDoc(doc(db, 'assignmentProgress', progressId));
        
        if (!progressDoc.exists()) continue;
        
        const progressData = progressDoc.data();
        
        const isCompleted = 
          progressData.watched === true ||
          progressData.status === 'completed' ||
          (progressData.progress || 0) >= 100 ||
          (progressData.watchedDuration && progressData.totalDuration && 
           progressData.watchedDuration >= progressData.totalDuration);

        if (!isCompleted) continue;

        const videoDoc = await getDoc(doc(db, 'videoLibrary', assignmentData.videoId));
        if (!videoDoc.exists()) continue;

        const videoData = videoDoc.data();
        if (!videoData.videoUrl || !videoData.topic) continue;

        // 6. Safe timestamp handling
        const completedAtDate = progressData.completedAt 
          ? (progressData.completedAt.toDate?.() ?? new Date(progressData.completedAt))
          : null;
        
        const completedAtTimestamp = completedAtDate ? completedAtDate.getTime() : Date.now();

        // 7. Add to completed list
        const completedVideo: CompletedVideoItem = {
          videoId: assignmentData.videoId,
          videoTopic: assignmentData.videoTopic || videoData.topic,
          videoUrl: videoData.videoUrl,
          completedAt: completedAtTimestamp,
          assignmentId: assignmentId,
          thumbnail: videoData.thumbnailUrl,
          duration: videoData.duration,
          progress: progressData.progress || 100,
        };

        completed.push(completedVideo);
      }

      // 8. Sort by completion date (most recent first)
      completed.sort((a, b) => b.completedAt - a.completedAt);

      console.log('='.repeat(60));
      console.log(`[WVM] ✅ FINAL RESULT: ${completed.length} completed videos found`);
      if (completed.length === 0 && assignmentsSnapshot.size > 0) {
        console.log('[WVM] ⚠️ WARNING: Assignments exist but no completed videos');
        console.log('[WVM] Check: progress.watched, progress.status, or progress >= 100');
      }
      console.log('='.repeat(60));

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
          activeTab === 'training' && styles.activeTab,
        ]}
        onPress={() => setActiveTab('training')}
      >
        <BookOpen size={20} color={activeTab === 'training' ? COLORS.primary : COLORS.textMuted} />
        <Text
          style={[
            styles.tabText,
            activeTab === 'training' && styles.activeTabText,
          ]}
        >
          Training Model
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={[
          styles.tab,
          activeTab === 'watched' && styles.activeTab,
        ]}
        onPress={() => setActiveTab('watched')}
      >
        <CheckCircle size={20} color={activeTab === 'watched' ? COLORS.primary : COLORS.textMuted} />
        <Text
          style={[
            styles.tabText,
            activeTab === 'watched' && styles.activeTabText,
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
        Access general safety training materials and educational resources.
      </Text>

      {/* Blasting Safety Video Card - TEST MINER */}
      <View style={styles.trainingCard}>
        <View style={[styles.trainingIconContainer, { backgroundColor: COLORS.destructive + '20' }]}>
          <VideoIcon size={32} color={COLORS.destructive} />
        </View>
        <Text style={styles.trainingCardTitle}>🎥 Blasting Safety Procedures</Text>
        <Text style={styles.trainingCardDescription}>
          Essential safety protocols for blasting operations including pre-blast checks, evacuation procedures, and post-blast inspection.
        </Text>
        <View style={styles.topicsList}>
          <Text style={styles.topicItem}>• Safe Distance Requirements</Text>
          <Text style={styles.topicItem}>• Explosive Handling</Text>
          <Text style={styles.topicItem}>• Evacuation Protocols</Text>
          <Text style={styles.topicItem}>• Post-Blast Inspection</Text>
        </View>
        <TouchableOpacity 
          style={[styles.trainingButton, { backgroundColor: COLORS.destructive }]}
          onPress={() => router.push('/miner/VideoPlayer?videoId=blasting-safety&topic=Blasting Safety Procedures')}
        >
          <Play size={20} color="#FFF" />
          <Text style={styles.trainingButtonText}>Watch Video</Text>
        </TouchableOpacity>
      </View>

      {/* Safety Fundamentals Card */}
      <View style={styles.trainingCard}>
        <View style={styles.trainingIconContainer}>
          <BookOpen size={32} color={COLORS.primary} />
        </View>
        <Text style={styles.trainingCardTitle}>Safety Fundamentals</Text>
        <Text style={styles.trainingCardDescription}>
          Learn the basic principles of mine safety, hazard identification, emergency procedures, and risk assessment techniques.
        </Text>
        <View style={styles.topicsList}>
          <Text style={styles.topicItem}>• Hazard Recognition</Text>
          <Text style={styles.topicItem}>• Safety Protocols</Text>
          <Text style={styles.topicItem}>• Emergency Response</Text>
          <Text style={styles.topicItem}>• Risk Management</Text>
        </View>
        <TouchableOpacity style={styles.trainingButton}>
          <Text style={styles.trainingButtonText}>Start Learning</Text>
        </TouchableOpacity>
      </View>

      {/* PPE Guidelines Card */}
      <View style={styles.trainingCard}>
        <View style={styles.trainingIconContainer}>
          <Award size={32} color={COLORS.primary} />
        </View>
        <Text style={styles.trainingCardTitle}>PPE Guidelines</Text>
        <Text style={styles.trainingCardDescription}>
          Understand proper use, maintenance, and inspection of Personal Protective Equipment including helmets, gloves, boots, and respiratory protection.
        </Text>
        <View style={styles.topicsList}>
          <Text style={styles.topicItem}>• Helmet Safety</Text>
          <Text style={styles.topicItem}>• Protective Clothing</Text>
          <Text style={styles.topicItem}>• Respiratory Protection</Text>
          <Text style={styles.topicItem}>• Equipment Maintenance</Text>
        </View>
        <TouchableOpacity style={styles.trainingButton}>
          <Text style={styles.trainingButtonText}>Start Learning</Text>
        </TouchableOpacity>
      </View>

      {/* Emergency Response Card */}
      <View style={styles.trainingCard}>
        <View style={styles.trainingIconContainer}>
          <BookOpen size={32} color={COLORS.destructive} />
        </View>
        <Text style={styles.trainingCardTitle}>Emergency Response</Text>
        <Text style={styles.trainingCardDescription}>
          Critical procedures for emergency situations, evacuation protocols, first aid basics, and communication during emergencies.
        </Text>
        <View style={styles.topicsList}>
          <Text style={styles.topicItem}>• Evacuation Routes</Text>
          <Text style={styles.topicItem}>• First Aid Basics</Text>
          <Text style={styles.topicItem}>• Emergency Communication</Text>
          <Text style={styles.topicItem}>• Incident Reporting</Text>
        </View>
        <TouchableOpacity style={styles.trainingButton}>
          <Text style={styles.trainingButtonText}>Start Learning</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.infoBox}>
        <Text style={styles.infoText}>
          💡 These training modules are available anytime for reference and continuous learning. Regular review helps maintain safety awareness.
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
            Videos you complete from your assignments will appear here. Complete assigned videos to build your training history.
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
          Videos you have successfully watched and completed. You can rewatch any video at any time.
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
                  Completed: {new Date(video.completedAt).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'short',
                    day: 'numeric'
                  })}
                </Text>
                {video.duration && (
                  <Text style={styles.completedVideoDuration}>
                    Duration: {Math.round(video.duration / 60)} min
                  </Text>
                )}
                <View style={styles.progressBarContainer}>
                  <View style={[styles.progressBar, { width: `${video.progress}%` }]} />
                </View>
                <Text style={styles.progressText}>{video.progress}% watched</Text>
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
                        router.push({
                          pathname: '/miner/AssignedVideos',
                          params: {
                            highlightAssignment: video.assignmentId,
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
        <Text style={styles.headerTitle}>Watch Video</Text>
        <View style={{ width: 24 }} />
      </View>

      {/* Tab Header */}
      {renderTabHeader()}

      {/* Content */}
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {activeTab === 'training' ? renderTrainingModel() : renderCompletedVideos()}
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
    marginBottom: 12,
  },
  topicsList: {
    marginBottom: 16,
    paddingLeft: 8,
  },
  topicItem: {
    fontSize: 13,
    color: COLORS.text,
    marginBottom: 6,
  },
  trainingButton: {
    backgroundColor: COLORS.primary,
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
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
    minHeight: 300,
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
    minHeight: 300,
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
    marginBottom: 8,
  },
  progressBarContainer: {
    height: 4,
    backgroundColor: COLORS.border,
    borderRadius: 2,
    overflow: 'hidden',
    marginBottom: 4,
  },
  progressBar: {
    height: '100%',
    backgroundColor: COLORS.success,
  },
  progressText: {
    fontSize: 11,
    color: COLORS.success,
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
