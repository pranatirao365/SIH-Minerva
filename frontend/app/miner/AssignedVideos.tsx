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
  Video as VideoIcon,
} from '@/components/Icons';
import { COLORS } from '@/constants/styles';
import { useRoleStore } from '../../hooks/useRoleStore';
import { getVideoUrl } from '@/config/apiConfig';
import { collection, query, where, getDocs, doc, getDoc } from 'firebase/firestore';
import { db } from '@/config/firebase';

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

  const { user } = useRoleStore();
  const currentMinerId = user?.id || '';

  const [selectedVideo, setSelectedVideo] = useState<VideoItem | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentProgress, setCurrentProgress] = useState<AssignmentProgress | null>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isVideoLoading, setIsVideoLoading] = useState(false);

  useEffect(() => {
    if (currentMinerId) {
      loadData();
    }
  }, [currentMinerId]);

  useEffect(() => {
    const subscription = Dimensions.addEventListener('change', ({ window }) => {
      if (selectedVideo) {
        setSelectedVideo({ ...selectedVideo });
      }
    });
    return () => subscription?.remove();
  }, [selectedVideo]);

  const loadData = async () => {
    if (!currentMinerId) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      console.log('='.repeat(60));
      console.log('[ASSIGNED_VIDEOS] Loading data for miner');
      console.log('[ASSIGNED_VIDEOS] User ID:', user?.id);
      console.log('[ASSIGNED_VIDEOS] User Phone:', user?.phone);
      console.log('[ASSIGNED_VIDEOS] User Name:', user?.name);
      console.log('[ASSIGNED_VIDEOS] Query minerId:', currentMinerId);
      console.log('='.repeat(60));

      // Query assignments
      const assignmentsRef = collection(db, 'videoAssignments');
      const assignmentsQuery = query(
        assignmentsRef,
        where('assignedTo', 'array-contains', currentMinerId),
        where('status', '==', 'active')
      );
      
      const assignmentsSnapshot = await getDocs(assignmentsQuery);
      console.log(`[ASSIGNED_VIDEOS] Query returned ${assignmentsSnapshot.size} assignments`);
      
      if (assignmentsSnapshot.size > 0) {
        console.log('[ASSIGNED_VIDEOS] Sample assignment data:');
        assignmentsSnapshot.docs.slice(0, 2).forEach((doc, idx) => {
          const data = doc.data();
          console.log(`[ASSIGNED_VIDEOS]   Assignment ${idx + 1}:`, {
            id: doc.id,
            videoId: data.videoId,
            assignedTo: data.assignedTo,
            assignedBy: data.assignedBy,
            status: data.status
          });
        });
      }
      
      const loadedAssignments: VideoAssignment[] = [];
      const loadedVideos: VideoItem[] = [];
      const loadedProgress: AssignmentProgress[] = [];

      for (const assignmentDoc of assignmentsSnapshot.docs) {
        const assignmentData = assignmentDoc.data();
        console.log(`[ASSIGNED_VIDEOS]   Processing assignment: ${assignmentDoc.id}`);
        
        // Fetch video from videoLibrary
        const videoDoc = await getDoc(doc(db, 'videoLibrary', assignmentData.videoId));
        if (!videoDoc.exists()) {
          console.log(`[ASSIGNED_VIDEOS]   ❌ Video ${assignmentData.videoId} not found in videoLibrary`);
          continue;
        }
        console.log(`[ASSIGNED_VIDEOS]   ✓ Video found: ${assignmentData.videoId}`);

        const videoData = videoDoc.data();
        if (!videoData.videoUrl || !videoData.topic) {
          console.warn(`Invalid video data for ${assignmentData.videoId}`);
          continue;
        }

        // Fetch progress
        const progressDoc = await getDoc(doc(db, 'assignmentProgress', `${assignmentDoc.id}_${currentMinerId}`));
        const progressData = progressDoc.exists() ? progressDoc.data() : null;

        // Add to arrays
        loadedAssignments.push({
          id: assignmentDoc.id,
          videoId: assignmentData.videoId,
          videoTopic: assignmentData.videoTopic || videoData.topic,
          assignedTo: assignmentData.assignedTo || [],
          assignedBy: assignmentData.assignedBy || '',
          deadline: assignmentData.deadline?.toMillis?.() || Date.now(),
          isMandatory: assignmentData.isMandatory || false,
          assignedAt: assignmentData.assignedAt?.toMillis?.() || Date.now(),
          description: assignmentData.description,
        });

        loadedVideos.push({
          id: videoDoc.id,
          topic: videoData.topic || 'Untitled',
          language: videoData.language || 'en',
          languageName: videoData.languageName || 'English',
          videoUrl: videoData.videoUrl,
          timestamp: videoData.createdAt?.toMillis?.() || Date.now(),
          thumbnail: videoData.thumbnailUrl,
        });

        if (progressData) {
          // Check if video is truly completed using multiple conditions (same as WatchVideoModule)
          const watchedFlag = progressData.watched === true;
          const statusCompleted = progressData.status === 'completed';
          const progressComplete = (progressData.progress || 0) >= 100;
          const isReallyCompleted = watchedFlag || statusCompleted || progressComplete;
          
          if (isReallyCompleted) {
            console.log(`[ASSIGNED_VIDEOS]   ✓ Assignment ${assignmentDoc.id.substring(0, 12)} marked as completed:`, {
              watched: watchedFlag,
              status: progressData.status,
              progress: progressData.progress
            });
          }
          
          loadedProgress.push({
            assignmentId: assignmentDoc.id,
            minerId: currentMinerId,
            watched: isReallyCompleted, // Set watched to true if ANY completion condition is met
            watchedAt: progressData.completedAt?.toMillis?.(),
            progress: progressData.progress || 0,
          });
        }
      }

      setAssignments(loadedAssignments);
      setVideos(loadedVideos);
      setAssignmentProgress(loadedProgress);

      console.log('='.repeat(60));
      console.log(`[ASSIGNED_VIDEOS] ✅ FINAL RESULT: ${loadedAssignments.length} total assignments loaded`);
      console.log(`[ASSIGNED_VIDEOS] ${loadedVideos.length} videos loaded`);
      console.log(`[ASSIGNED_VIDEOS] ${loadedProgress.length} progress records loaded`);
      
      // Log completion status breakdown
      const completedCount = loadedProgress.filter(p => p.watched).length;
      const incompleteCount = loadedAssignments.length - completedCount;
      console.log(`[ASSIGNED_VIDEOS] Breakdown: ${completedCount} completed, ${incompleteCount} incomplete`);
      console.log(`[ASSIGNED_VIDEOS] Completion checked via: watched=true OR status='completed' OR progress>=100`);
      console.log(`[ASSIGNED_VIDEOS] Note: Only incomplete assignments will be displayed`);
      if (loadedAssignments.length === 0 && assignmentsSnapshot.size > 0) {
        console.log('[ASSIGNED_VIDEOS] ⚠️ WARNING: Assignments were found but all filtered out');
        console.log('[ASSIGNED_VIDEOS] Likely cause: Videos missing from videoLibrary collection');
      }
      console.log('='.repeat(60));
    } catch (error) {
      console.error('❌ Error loading assignments:', error);
      Alert.alert('Error', 'Failed to load assignments. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const myAssignments = useMemo(() => {
    // Filter to show only incomplete/unwatched assignments
    const filtered = assignments.filter(assignment => {
      if (!assignment || !assignment.assignedTo || !assignment.assignedTo.includes(currentMinerId)) {
        return false;
      }
      
      // Check if the video has been completed
      const progress = assignmentProgress.find(p =>
        p.assignmentId === assignment.id && p.minerId === currentMinerId
      );
      
      // Only show if NOT watched (exclude completed videos)
      // Note: progress.watched is now true if ANY completion condition was met
      return !progress?.watched;
    });
    
    console.log(`[ASSIGNED_VIDEOS] Filtered: ${filtered.length} incomplete assignments to display`);
    return filtered;
  }, [assignments, currentMinerId, assignmentProgress]);

  const getAssignmentProgress = (assignmentId: string) => {
    if (!assignmentId || !currentMinerId) return undefined;
    return assignmentProgress.find(p =>
      p.assignmentId === assignmentId && p.minerId === currentMinerId
    );
  };

  const getVideoForAssignment = (assignment: VideoAssignment) => {
    if (!assignment || !assignment.videoId) return undefined;
    return videos.find(v => v && v.id === assignment.videoId);
  };

  // Normalize video URL to ensure it's accessible from mobile app
  const normalizeVideoUrl = (videoUrl: string): string => {
    if (!videoUrl) {
      console.warn('[VIDEO_URL] Empty video URL provided');
      return '';
    }

    console.log('[VIDEO_URL] Original URL:', videoUrl);

    // If it's already a full HTTP URL, check if IP needs updating
    if (videoUrl.startsWith('http://') || videoUrl.startsWith('https://')) {
      // Update old IP addresses to current one from .env
      const currentIP = process.env.EXPO_PUBLIC_IP_ADDRESS || '172.16.58.121';
      const oldIPPatterns = [
        '192.168.137.122',
        '192.168.1.',
        '10.0.0.',
        '172.16.'
      ];
      
      let updatedUrl = videoUrl;
      for (const oldPattern of oldIPPatterns) {
        if (videoUrl.includes(oldPattern)) {
          // Extract the old IP and replace with current
          const urlMatch = videoUrl.match(/http:\/\/([0-9.]+):([0-9]+)/);
          if (urlMatch) {
            const oldIP = urlMatch[1];
            const port = urlMatch[2];
            updatedUrl = videoUrl.replace(`http://${oldIP}:${port}`, `http://${currentIP}:${port}`);
            console.log('[VIDEO_URL] Updated old IP:', oldIP, '->', currentIP);
            break;
          }
        }
      }
      
      console.log('[VIDEO_URL] Final URL:', updatedUrl);
      return updatedUrl;
    }

    // If it's a relative path starting with /videos/, convert to full URL
    if (videoUrl.startsWith('/videos/')) {
      const fullUrl = getVideoUrl(videoUrl);
      console.log('[VIDEO_URL] Converted relative path:', fullUrl);
      return fullUrl;
    }

    // For local file paths, try to convert to backend URL
    if (videoUrl.includes('output/') || videoUrl.includes('.mp4')) {
      const filename = videoUrl.split('/').pop() || videoUrl.split('\\').pop() || '';
      const fullUrl = getVideoUrl(`videos/${filename}`);
      console.log('[VIDEO_URL] Converted local path:', fullUrl);
      return fullUrl;
    }

    // Fallback: try to use as-is
    console.warn('[VIDEO_URL] Using URL as-is (might fail):', videoUrl);
    return videoUrl;
  };

  const startWatching = (assignment: VideoAssignment) => {
    // Safety: Validate assignment
    if (!assignment || !assignment.id) {
      Alert.alert('Error', 'Invalid assignment');
      return;
    }

    const video = getVideoForAssignment(assignment);
    if (!video) {
      Alert.alert(
        'Video Unavailable', 
        'This video has been removed or is no longer available. Please contact your supervisor.'
      );
      return;
    }

    // Validate video URL
    if (!video.videoUrl) {
      Alert.alert('Error', 'Video URL is missing. Please contact your supervisor.');
      return;
    }

    const normalizedUrl = normalizeVideoUrl(video.videoUrl);
    console.log('[START_WATCHING] Assignment:', assignment.id);
    console.log('[START_WATCHING] Video URL:', normalizedUrl);
    console.log('[START_WATCHING] Current .env IP:', process.env.EXPO_PUBLIC_IP_ADDRESS);

    // Check if video URL is accessible
    if (!video.videoUrl || video.videoUrl.trim() === '') {
      Alert.alert(
        'Video Error', 
        'Video URL is missing. Please contact your supervisor to reassign this video.'
      );
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
    if (!currentProgress || !currentProgress.assignmentId) {
      console.warn('Cannot mark as watched: no current progress');
      return;
    }

    const updatedProgress = {
      ...currentProgress,
      watched: true,
      watchedAt: Date.now(),
      progress: 100,
    };

    try {
      console.log('📝 Marking video as watched for miner:', currentMinerId);
      console.log('📋 Assignment ID:', currentProgress.assignmentId);

      // Use the robust service to update progress
      const { updateVideoProgress } = await import('@/services/validatedAssignmentsService');
      await updateVideoProgress(currentProgress.assignmentId, currentMinerId, 100, true);

      // Update local state
      const updatedProgressList = assignmentProgress.filter(p =>
        !(p.assignmentId === currentProgress.assignmentId && p.minerId === currentMinerId)
      );
      updatedProgressList.push(updatedProgress);
      setAssignmentProgress(updatedProgressList);

      // Update local state
      setAssignmentProgress(updatedProgressList);

      // Check if all mandatory videos are completed
      const allMandatoryCompleted = checkAllMandatoryCompleted(updatedProgressList);

      setSelectedVideo(null);
      setCurrentProgress(null);

      // Reload data to refresh progress
      await loadData();

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

  const renderAssignmentItem = (assignment: VideoAssignment) => {
    // Safety: Validate assignment object
    if (!assignment || !assignment.id) {
      console.warn('Invalid assignment object, skipping render');
      return null;
    }

    const progress = getAssignmentProgress(assignment.id);
    const video = getVideoForAssignment(assignment);
    
    // Safety: Check deadline is a valid number
    const deadlineValue = typeof assignment.deadline === 'number' ? assignment.deadline : Date.now();
    const isOverdue = deadlineValue < Date.now() && !progress?.watched;
    const isCompleted = progress?.watched;

    // Safety: Show warning if video not found
    if (!video) {
      console.warn(`Video not found for assignment ${assignment.id}, videoId: ${assignment.videoId}`);
      return (
        <View key={assignment.id} style={[styles.assignmentCard, { opacity: 0.6 }]}>
          <View style={styles.assignmentHeader}>
            <View style={styles.assignmentInfo}>
              <Text style={styles.assignmentTitle}>{assignment.videoTopic || 'Video Assignment'}</Text>
              <Text style={[styles.assignmentMeta, { color: '#FF6B6B' }]}>
                ⚠️ Video unavailable or removed
              </Text>
            </View>
          </View>
        </View>
      );
    }

    return (
      <View key={assignment.id} style={styles.assignmentCard}>
        <View style={styles.assignmentHeader}>
          <View style={styles.assignmentInfo}>
            <Text style={styles.assignmentTitle}>{assignment.videoTopic || 'Video Assignment'}</Text>
            <Text style={styles.assignmentMeta}>
              {assignment.isMandatory ? '⚠️ Mandatory' : '📌 Optional'} • ⏰ Due: {new Date(deadlineValue).toLocaleDateString()}
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

        {progress && progress.progress > 0 && (
          <View style={styles.progressSection}>
            <Text style={styles.progressText}>
              Progress: {Math.round(progress.progress || 0)}%
            </Text>
            <View style={styles.progressBar}>
              <View
                style={[
                  styles.progressFill,
                  { width: `${Math.min(progress.progress || 0, 100)}%` },
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
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <ArrowLeft size={24} color={COLORS.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Assigned Videos</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView style={styles.content}>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Your Assignments</Text>
          <Text style={styles.sectionSubtitle}>
            {myAssignments.length} assignment{myAssignments.length !== 1 ? 's' : ''}
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
                const videoUrl = normalizeVideoUrl(selectedVideo.videoUrl);
                console.error('Video load error:', error);
                console.error('Failed URL:', videoUrl);
                console.error('Current IP from .env:', process.env.EXPO_PUBLIC_IP_ADDRESS);
                
                const errorCode = error?.error || 'Unknown';
                const isDomain = errorCode.includes('NSURLErrorDomain') || errorCode.includes('-1008');
                
                Alert.alert(
                  'Video Error',
                  isDomain 
                    ? `Cannot reach video server.\n\nURL: ${videoUrl}\n\nTroubleshooting:\n1. Ensure video backend is running (port 4000)\n2. Check IP address in .env: ${process.env.EXPO_PUBLIC_IP_ADDRESS}\n3. Device and server must be on same network\n4. Try: ipconfig (Windows) to verify server IP`
                    : `Failed to load video.\n\nError: ${errorCode}\n\nPlease check your connection and try again.`,
                  [
                    { text: 'Retry', onPress: () => {
                      setIsPlaying(false);
                      if (videoRef.current) {
                        videoRef.current.unloadAsync();
                        setTimeout(() => {
                          const retryUrl = normalizeVideoUrl(selectedVideo.videoUrl);
                          console.log('[RETRY] Attempting to load:', retryUrl);
                          videoRef.current?.loadAsync({ uri: retryUrl });
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
