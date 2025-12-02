import AsyncStorage from '@react-native-async-storage/async-storage';
import { AVPlaybackStatus, ResizeMode, Video } from 'expo-av';
import { useRouter } from 'expo-router';
import React, { useEffect, useRef, useState, useMemo } from 'react';
import {
  Alert,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  ScrollView,
  Dimensions,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  ArrowLeft,
  Play,
  CheckCircle,
  Clock,
  AlertTriangle,
  Lock,
  Video as VideoIcon,
} from '@/components/Icons';
import { COLORS } from '@/constants/styles';
import { useRoleStore } from '../../hooks/useRoleStore';
import { getVideoUrl } from '@/config/apiConfig';

interface VideoAssignment {
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

interface VideoItem {
  id: string;
  topic: string;
  language: string;
  languageName: string;
  videoUrl: string;
  timestamp: number;
  thumbnail?: string;
}

interface AssignmentProgress {
  assignmentId: string;
  minerId: string;
  watched: boolean;
  watchedAt?: number;
  progress: number;
}

const { width: screenWidth } = Dimensions.get('window');

export default function AssignedVideos() {
  const router = useRouter();
  const videoRef = useRef<any>(null);
  const [assignments, setAssignments] = useState<VideoAssignment[]>([]);
  const [videos, setVideos] = useState<VideoItem[]>([]);
  const [assignmentProgress, setAssignmentProgress] = useState<AssignmentProgress[]>([]);
  const [loading, setLoading] = useState(true);

  // Get current user from role store
  const { user } = useRoleStore();
  const currentMinerId = user.id || '1'; // Fallback to '1' if no user ID

  // Video player state
  const [selectedVideo, setSelectedVideo] = useState<VideoItem | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentProgress, setCurrentProgress] = useState<AssignmentProgress | null>(null);
  const [watchedVideos, setWatchedVideos] = useState<VideoItem[]>([]);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isVideoLoading, setIsVideoLoading] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  // Handle screen dimension changes for responsive video sizing
  useEffect(() => {
    const subscription = Dimensions.addEventListener('change', ({ window }) => {
      // Force re-render of video component when screen dimensions change
      if (selectedVideo) {
        // This will trigger a re-render with new dimensions
        setSelectedVideo({ ...selectedVideo });
      }
    });

    return () => subscription?.remove();
  }, [selectedVideo]);

  const loadData = async () => {
    try {
      console.log('📥 Loading assignments for miner:', currentMinerId);
      
      // Import Firestore functions
      const { collection, query, where, getDocs } = await import('firebase/firestore');
      const { db } = await import('@/config/firebase');

      // Load videos from Firestore
      console.log('📚 Loading videos from Firestore...');
      const videosRef = collection(db, 'videoLibrary');
      const videosQuery = query(videosRef, where('status', '==', 'active'));
      const videosSnapshot = await getDocs(videosQuery);
      
      const loadedVideos: VideoItem[] = [];
      videosSnapshot.forEach((doc) => {
        const data = doc.data();
        loadedVideos.push({
          id: doc.id,
          topic: data.topic,
          language: data.language,
          languageName: data.languageName || data.language,
          videoUrl: data.videoUrl,
          timestamp: data.createdAt?.toMillis() || Date.now(),
          thumbnail: data.thumbnailUrl,
        });
      });
      console.log('✅ Loaded', loadedVideos.length, 'videos');
      setVideos(loadedVideos);

      // Load assignments from Firestore
      console.log('📋 Loading assignments from Firestore...');
      const assignmentsRef = collection(db, 'videoAssignments');
      const assignmentsQuery = query(
        assignmentsRef,
        where('assignedTo', 'array-contains', currentMinerId),
        where('status', '==', 'active')
      );
      const assignmentsSnapshot = await getDocs(assignmentsQuery);
      
      const loadedAssignments: VideoAssignment[] = [];
      assignmentsSnapshot.forEach((doc) => {
        const data = doc.data();
        loadedAssignments.push({
          id: doc.id,
          videoId: data.videoId,
          videoTopic: data.videoTopic,
          assignedTo: data.assignedTo || [],
          assignedBy: data.assignedBy,
          deadline: data.deadline?.toMillis() || Date.now(),
          isMandatory: data.isMandatory || false,
          assignedAt: data.assignedAt?.toMillis() || Date.now(),
          description: data.description,
        });
      });
      console.log('✅ Loaded', loadedAssignments.length, 'assignments for miner');
      setAssignments(loadedAssignments);

      // Load progress from Firestore
      console.log('📊 Loading progress from Firestore...');
      const progressRef = collection(db, 'assignmentProgress');
      const progressQuery = query(progressRef, where('minerId', '==', currentMinerId));
      const progressSnapshot = await getDocs(progressQuery);
      
      const loadedProgress: AssignmentProgress[] = [];
      progressSnapshot.forEach((doc) => {
        const data = doc.data();
        loadedProgress.push({
          assignmentId: data.assignmentId,
          minerId: data.minerId,
          watched: data.watched || false,
          watchedAt: data.completedAt?.toMillis(),
          progress: data.progress || 0,
        });
      });
      console.log('✅ Loaded', loadedProgress.length, 'progress records');
      setAssignmentProgress(loadedProgress);

      // Also keep AsyncStorage as fallback/cache
      const storedWatchedVideos = await AsyncStorage.getItem(`watchedVideos_${currentMinerId}`);
      if (storedWatchedVideos) {
        setWatchedVideos(JSON.parse(storedWatchedVideos));
      }
    } catch (error) {
      console.error('❌ Error loading data:', error);
      Alert.alert('Error', 'Failed to load your assignments. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const myAssignments = useMemo(() => {
    return assignments.filter(assignment =>
      assignment.assignedTo.includes(currentMinerId)
    );
  }, [assignments, currentMinerId]);

  const getAssignmentProgress = (assignmentId: string) => {
    return assignmentProgress.find(p =>
      p.assignmentId === assignmentId && p.minerId === currentMinerId
    );
  };

  const getVideoForAssignment = (assignment: VideoAssignment) => {
    return videos.find(v => v.id === assignment.videoId);
  };

  // Normalize video URL to ensure it's accessible from mobile app
  const normalizeVideoUrl = (videoUrl: string): string => {
    if (!videoUrl) return '';

    // If it's already a full HTTP URL, return as is
    if (videoUrl.startsWith('http://') || videoUrl.startsWith('https://')) {
      return videoUrl;
    }

    // If it's a relative path starting with /videos/, convert to full URL
    if (videoUrl.startsWith('/videos/')) {
      return getVideoUrl(videoUrl);
    }

    // For local file paths, try to convert to backend URL
    // This assumes the video is in the output directory
    if (videoUrl.includes('output/') || videoUrl.includes('.mp4')) {
      const filename = videoUrl.split('/').pop() || videoUrl.split('\\').pop() || '';
      return getVideoUrl(`videos/${filename}`);
    }

    // Fallback: try to use as-is
    return videoUrl;
  };

  const startWatching = (assignment: VideoAssignment) => {
    const video = getVideoForAssignment(assignment);
    if (!video) {
      Alert.alert('Error', 'Video not found');
      return;
    }

    // Check if video URL is accessible
    if (!video.videoUrl || video.videoUrl.trim() === '') {
      Alert.alert('Error', 'Video URL is not available');
      return;
    }

    const progress = getAssignmentProgress(assignment.id);
    setSelectedVideo(video);
    setCurrentProgress(progress || {
      assignmentId: assignment.id,
      minerId: currentMinerId,
      watched: false,
      progress: 0,
    });
  };

  const markAsWatched = async () => {
    if (!currentProgress) return;

    const updatedProgress = {
      ...currentProgress,
      watched: true,
      watchedAt: Date.now(),
      progress: 100,
    };

    const updatedProgressList = assignmentProgress.filter(p =>
      !(p.assignmentId === currentProgress.assignmentId && p.minerId === currentMinerId)
    );
    updatedProgressList.push(updatedProgress);

    try {
      // Save to Firestore for real-time sync with supervisor dashboard
      const { collection, addDoc, query, where, getDocs, updateDoc, Timestamp } = await import('firebase/firestore');
      const { db } = await import('@/config/firebase');
      
      // Check if progress document exists
      const progressRef = collection(db, 'assignmentProgress');
      const progressQuery = query(
        progressRef,
        where('assignmentId', '==', currentProgress.assignmentId),
        where('minerId', '==', currentMinerId)
      );
      const progressSnapshot = await getDocs(progressQuery);
      
      if (!progressSnapshot.empty) {
        // Update existing document
        const docRef = progressSnapshot.docs[0].ref;
        await updateDoc(docRef, {
          watched: true,
          completedAt: Timestamp.now(),
          progress: 100,
          status: 'completed',
          watchTime: Date.now() - (currentProgress.watchedAt || Date.now()),
        });
        console.log('✅ Updated progress in Firestore');
      } else {
        // Create new document
        const assignment = myAssignments.find(a => a.id === currentProgress.assignmentId);
        await addDoc(progressRef, {
          assignmentId: currentProgress.assignmentId,
          minerId: currentMinerId,
          videoId: assignment?.videoId || '',
          watched: true,
          completedAt: Timestamp.now(),
          progress: 100,
          status: 'completed',
          watchTime: 0,
        });
        console.log('✅ Created progress in Firestore');
      }
      
      // Also save to AsyncStorage for offline access
      await AsyncStorage.setItem(`assignmentProgress_${currentMinerId}`, JSON.stringify(updatedProgressList));
      setAssignmentProgress(updatedProgressList);

      // Save to watched videos
      await saveToWatchedVideos(selectedVideo!, updatedProgress);

      // Check if all mandatory videos are completed
      const allMandatoryCompleted = checkAllMandatoryCompleted(updatedProgressList);

      setSelectedVideo(null);
      setCurrentProgress(null);

      // Show success message
      Alert.alert(
        'Video Completed! 🎉',
        'You have successfully completed this training video.',
        [
          {
            text: 'OK',
            onPress: () => {
              if (allMandatoryCompleted) {
                // Show access granted notification after a short delay
                setTimeout(() => {
                  Alert.alert(
                    'Access Granted! ✅',
                    'Congratulations! You have completed all mandatory safety videos and now have access to work routes.',
                    [{ text: 'Great!' }]
                  );
                }, 500);
              }
            }
          }
        ]
      );
    } catch (error) {
      console.error('Error saving progress:', error);
    }
  };

  const toggleFullscreen = async () => {
    if (videoRef.current) {
      if (isFullscreen) {
        await videoRef.current.dismissFullscreenPlayer();
        setIsVideoLoading(false); // Reset loading state when exiting fullscreen
      } else {
        await videoRef.current.presentFullscreenPlayer();
      }
      setIsFullscreen(!isFullscreen);
    }
  };

  const checkAllMandatoryCompleted = (progressList: AssignmentProgress[]) => {
    const mandatoryAssignments = myAssignments.filter(a => a.isMandatory);
    const unwatchedMandatory = mandatoryAssignments.filter(assignment => {
      const progress = progressList.find(p =>
        p.assignmentId === assignment.id && p.minerId === currentMinerId
      );
      return !progress?.watched;
    });
    return unwatchedMandatory.length === 0;
  };

  const saveToWatchedVideos = async (video: VideoItem, progress: AssignmentProgress) => {
    try {
      const watchedVideos = await AsyncStorage.getItem(`watchedVideos_${currentMinerId}`);
      const watchedList = watchedVideos ? JSON.parse(watchedVideos) : [];

      const watchedVideo = {
        ...video,
        watchedAt: progress.watchedAt,
        assignmentId: progress.assignmentId,
      };

      // Remove if already exists (to avoid duplicates)
      const filteredList = watchedList.filter((v: any) => v.id !== video.id);
      filteredList.unshift(watchedVideo); // Add to beginning

      await AsyncStorage.setItem(`watchedVideos_${currentMinerId}`, JSON.stringify(filteredList));
    } catch (error) {
      console.error('Error saving to watched videos:', error);
    }
  };

  const renderWatchedVideoItem = (video: VideoItem & { watchedAt?: number }) => (
    <View key={video.id} style={styles.watchedVideoCard}>
      <View style={styles.watchedVideoHeader}>
        <VideoIcon size={20} color={COLORS.accent} />
        <View style={styles.watchedVideoInfo}>
          <Text style={styles.watchedVideoTitle} numberOfLines={2}>
            {video.topic}
          </Text>
          <Text style={styles.watchedVideoMeta}>
            {video.languageName} • Watched {video.watchedAt ? new Date(video.watchedAt).toLocaleDateString() : 'Recently'}
          </Text>
        </View>
        <CheckCircle size={20} color={COLORS.accent} />
      </View>

      <TouchableOpacity
        style={styles.rewatchButton}
        onPress={() => {
          setSelectedVideo(video);
          setCurrentProgress(null);
        }}
      >
        <Play size={16} color="#FFFFFF" />
        <Text style={styles.rewatchButtonText}>Watch Again</Text>
      </TouchableOpacity>
    </View>
  );

  const renderAssignmentItem = (assignment: VideoAssignment) => {
    const progress = getAssignmentProgress(assignment.id);
    const video = getVideoForAssignment(assignment);
    const isOverdue = assignment.deadline < Date.now() && !progress?.watched;
    const isCompleted = progress?.watched;

    return (
      <View key={assignment.id} style={styles.assignmentCard}>
        <View style={styles.assignmentHeader}>
          <View style={styles.assignmentInfo}>
            <Text style={styles.assignmentTitle}>{assignment.videoTopic}</Text>
            <Text style={styles.assignmentMeta}>
              {assignment.isMandatory ? '⚠️ Mandatory' : '📌 Optional'} • ⏰ Due: {new Date(assignment.deadline).toLocaleDateString()}
            </Text>
            {assignment.description && (
              <Text style={styles.assignmentDescription}>{assignment.description}</Text>
            )}
          </View>
          <View style={styles.assignmentStatus}>
            {isCompleted ? (
              <View style={styles.completedBadge}>
                <Text style={styles.completedText}>✅ Done</Text>
              </View>
            ) : isOverdue ? (
              <View style={styles.overdueBadge}>
                <Text style={styles.overdueText}>⚠️ Overdue</Text>
              </View>
            ) : (
              <View style={styles.pendingBadge}>
                <Text style={styles.pendingText}>⏳ Pending</Text>
              </View>
            )}
          </View>
        </View>

        {video && (
          <TouchableOpacity
            style={styles.watchButton}
            onPress={() => startWatching(assignment)}
            disabled={isCompleted}
          >
            <Text style={[
              styles.watchButtonText,
              isCompleted && styles.watchButtonTextDisabled
            ]}>
              {isCompleted ? '✓ Already Watched' : '▶️ Watch Video'}
            </Text>
          </TouchableOpacity>
        )}

        {progress && (
          <View style={styles.progressSection}>
            <Text style={styles.progressText}>
              Progress: {progress.progress}%
            </Text>
            <View style={styles.progressBar}>
              <View
                style={[
                  styles.progressFill,
                  { width: `${progress.progress}%` },
                  progress.watched ? styles.progressComplete : null,
                ]}
              />
            </View>
          </View>
        )}
      </View>
    );
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <Text>Loading...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <ArrowLeft size={24} color={COLORS.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>My Assigned Videos</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView style={styles.content}>
        {/* Assignments List */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Video Assignments</Text>
          <Text style={styles.sectionSubtitle}>
            {myAssignments.length} assignment{myAssignments.length !== 1 ? 's' : ''} •
            {myAssignments.filter(a => getAssignmentProgress(a.id)?.watched).length} completed
          </Text>

          {myAssignments.length === 0 ? (
            <View style={styles.emptyContainer}>
              <VideoIcon size={48} color={COLORS.textMuted} />
              <Text style={styles.emptyTitle}>No assignments</Text>
              <Text style={styles.emptyText}>
                You don't have any video assignments at the moment
              </Text>
            </View>
          ) : (
            myAssignments.map(assignment => renderAssignmentItem(assignment))
          )}
        </View>

        {/* Watched Videos Section */}
        {watchedVideos.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Watched Videos</Text>
            <Text style={styles.sectionSubtitle}>
              {watchedVideos.length} video{watchedVideos.length !== 1 ? 's' : ''} completed
            </Text>

            {watchedVideos.map(video => renderWatchedVideoItem(video))}
          </View>
        )}
      </ScrollView>

      {/* Video Player Modal */}
      {selectedVideo && (
        <View style={styles.videoModal}>
          {!isFullscreen && (
            <View style={styles.videoModalHeader}>
              <Text style={styles.videoModalTitle}>{selectedVideo.topic}</Text>
              <TouchableOpacity
                onPress={() => {
                  setSelectedVideo(null);
                  setCurrentProgress(null);
                  setIsPlaying(false);
                  setIsVideoLoading(false);
                  setIsFullscreen(false);
                }}
                style={styles.videoModalClose}
              >
                <ArrowLeft size={24} color={COLORS.text} />
              </TouchableOpacity>
            </View>
          )}

          <View style={isFullscreen ? styles.videoContainerFullscreen : styles.videoContainer}>
            <Video
              ref={videoRef}
              source={{ uri: normalizeVideoUrl(selectedVideo.videoUrl) }}
              style={isFullscreen ? styles.videoPlayerFullscreen : styles.videoPlayer}
              resizeMode={isFullscreen ? ResizeMode.CONTAIN : ResizeMode.CONTAIN}
              shouldPlay={isPlaying}
              useNativeControls={isFullscreen}
              onPlaybackStatusUpdate={(status) => {
                if (status.isLoaded) {
                  const progressPercent = status.durationMillis ? (status.positionMillis / status.durationMillis) * 100 : 0;
                  if (currentProgress && progressPercent > currentProgress.progress) {
                    setCurrentProgress({
                      ...currentProgress,
                      progress: Math.min(progressPercent, 100),
                    });
                  }
                } else if (status.error) {
                  console.error('Video playback error:', status.error);
                  Alert.alert('Video Error', 'Unable to play video. The video file may not be accessible.');
                }
              }}
              onLoadStart={() => {
                console.log('Video loading started for:', normalizeVideoUrl(selectedVideo.videoUrl));
                setIsVideoLoading(true);
              }}
              onLoad={(status) => {
                console.log('Video loaded:', status);
                setIsVideoLoading(false);
              }}
              onError={(error) => {
                console.error('Video load error:', error);
                Alert.alert(
                  'Video Error',
                  'Failed to load video. Please check your internet connection and try again.',
                  [
                    { text: 'Retry', onPress: () => {
                      // Reset video state to allow retry
                      setIsPlaying(false);
                      if (videoRef.current) {
                        videoRef.current.unloadAsync();
                        setTimeout(() => {
                          videoRef.current?.loadAsync({ uri: normalizeVideoUrl(selectedVideo.videoUrl) });
                        }, 1000);
                      }
                    }},
                    { text: 'Close', onPress: () => {
                      setSelectedVideo(null);
                      setCurrentProgress(null);
                    }}
                  ]
                );
              }}
              onFullscreenUpdate={(event) => {
                if (event.fullscreenUpdate === 0) { // Video.EXIT_FULLSCREEN
                  setIsFullscreen(false);
                } else if (event.fullscreenUpdate === 1) { // Video.ENTER_FULLSCREEN
                  setIsFullscreen(true);
                }
              }}
            />

            {/* Loading indicator */}
            {isVideoLoading && (
              <View style={styles.videoLoadingOverlay}>
                <ActivityIndicator size="large" color="#FFFFFF" />
                <Text style={styles.videoLoadingText}>Loading video...</Text>
              </View>
            )}
            {isFullscreen && (
              <TouchableOpacity
                style={styles.fullscreenExitButton}
                onPress={toggleFullscreen}
              >
                <ArrowLeft size={24} color="#FFFFFF" />
              </TouchableOpacity>
            )}
          </View>

          {!isFullscreen && (
            <View style={styles.videoControls}>
              <View style={styles.controlButtonsRow}>
                <TouchableOpacity
                  style={styles.playButton}
                  onPress={() => setIsPlaying(!isPlaying)}
                >
                  <Play size={24} color="#FFFFFF" />
                  <Text style={styles.playButtonText}>
                    {isPlaying ? 'Pause' : 'Play'}
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.fullscreenButton}
                  onPress={toggleFullscreen}
                >
                  {isFullscreen ? (
                    <>
                      <ArrowLeft size={20} color="#FFFFFF" />
                      <Text style={styles.fullscreenButtonText}>Exit Fullscreen</Text>
                    </>
                  ) : (
                    <>
                      <VideoIcon size={20} color="#FFFFFF" />
                      <Text style={styles.fullscreenButtonText}>Fullscreen</Text>
                    </>
                  )}
                </TouchableOpacity>
              </View>

              {currentProgress && currentProgress.progress >= 90 && (
                <TouchableOpacity
                  style={styles.completeButton}
                  onPress={markAsWatched}
                >
                  <CheckCircle size={20} color="#FFFFFF" />
                  <Text style={styles.completeButtonText}>Mark as Watched</Text>
                </TouchableOpacity>
              )}
            </View>
          )}
        </View>
      )}
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
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.text,
  },
  headerActions: {
    padding: 8,
  },
  content: {
    flex: 1,
    padding: 20,
  },
  statusSection: {
    marginBottom: 24,
  },
  statusCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    borderRadius: 12,
    borderWidth: 1,
  },
  statusCardSuccess: {
    backgroundColor: COLORS.accent + '10',
    borderColor: COLORS.accent,
  },
  statusCardWarning: {
    backgroundColor: COLORS.destructive + '10',
    borderColor: COLORS.destructive,
  },
  statusInfo: {
    marginLeft: 16,
    flex: 1,
  },
  statusTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: 4,
  },
  statusText: {
    fontSize: 14,
    color: COLORS.textMuted,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 8,
  },
  sectionSubtitle: {
    fontSize: 14,
    color: COLORS.textMuted,
    marginBottom: 16,
  },
  assignmentCard: {
    backgroundColor: COLORS.card,
    borderRadius: 16,
    padding: 18,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: COLORS.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  assignmentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 14,
    flexWrap: 'wrap',
    gap: 8,
  },
  assignmentInfo: {
    flex: 1,
    minWidth: 200,
  },
  assignmentTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: 6,
    lineHeight: 24,
  },
  assignmentMeta: {
    fontSize: 13,
    color: COLORS.textMuted,
    marginBottom: 6,
    lineHeight: 20,
  },
  assignmentDescription: {
    fontSize: 14,
    color: COLORS.text,
    fontStyle: 'italic',
  },
  assignmentStatus: {
    alignItems: 'flex-end',
  },
  completedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.accent,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    gap: 4,
  },
  completedText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
  },
  overdueBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.destructive,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    gap: 4,
  },
  overdueText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
  },
  pendingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.primary,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    gap: 4,
  },
  pendingText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
  },
  watchButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.primary,
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 12,
    marginTop: 8,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
  },
  watchButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  watchButtonTextDisabled: {
    color: COLORS.textMuted,
  },
  progressSection: {
    marginTop: 12,
  },
  progressText: {
    fontSize: 14,
    color: COLORS.text,
    marginBottom: 8,
  },
  progressBar: {
    height: 4,
    backgroundColor: COLORS.border,
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: COLORS.primary,
    borderRadius: 2,
  },
  progressComplete: {
    backgroundColor: COLORS.accent,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
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
    marginBottom: 16,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  videoModal: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: COLORS.background,
    zIndex: 1000,
  },
  videoModalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  videoModalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.text,
    flex: 1,
  },
  videoModalClose: {
    padding: 8,
  },
  videoContainer: {
    flex: 1,
    backgroundColor: '#000000',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 20,
  },
  videoContainerFullscreen: {
    flex: 1,
    backgroundColor: '#000000',
    justifyContent: 'center',
    alignItems: 'center',
  },
  videoPlayer: {
    width: Dimensions.get('window').width - 40, // Account for padding
    height: (Dimensions.get('window').width - 40) * 9 / 16, // 16:9 aspect ratio
    maxHeight: Dimensions.get('window').height * 0.7, // Leave room for controls
  },
  videoPlayerFullscreen: {
    width: Dimensions.get('window').width,
    height: Dimensions.get('window').height,
    position: 'absolute',
    top: 0,
    left: 0,
  },
  videoControls: {
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    gap: 12,
  },
  controlButtonsRow: {
    flexDirection: 'row',
    gap: 12,
  },
  playButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.primary,
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    gap: 8,
    flex: 1,
  },
  playButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  fullscreenButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.secondary,
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    gap: 8,
    flex: 1,
  },
  fullscreenButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  fullscreenExitButton: {
    position: 'absolute',
    top: 50,
    left: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    borderRadius: 25,
    width: 50,
    height: 50,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1001,
  },
  completeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.accent,
    paddingVertical: 12,
    borderRadius: 8,
    gap: 8,
  },
  completeButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  watchedVideoCard: {
    backgroundColor: COLORS.card,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: COLORS.accent + '30',
  },
  watchedVideoHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  watchedVideoInfo: {
    flex: 1,
    marginLeft: 12,
  },
  watchedVideoTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 4,
  },
  watchedVideoMeta: {
    fontSize: 14,
    color: COLORS.textMuted,
  },
  rewatchButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.accent,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 6,
    gap: 8,
  },
  rewatchButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  videoLoadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  videoLoadingText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    marginTop: 10,
  },
});
