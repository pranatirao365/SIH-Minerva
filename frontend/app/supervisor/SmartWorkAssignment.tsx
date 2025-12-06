import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  Alert,
  FlatList,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  ArrowLeft,
  Send,
  CheckCircle,
  XCircle,
  AlertCircle,
  Video as VideoIcon,
  Users,
  Calendar,
  Sparkles,
} from '@/components/Icons';
import { COLORS } from '@/constants/styles';
import { 
  VideoLibraryService, 
  VideoDocument, 
  VideoRequestDocument 
} from '@/services/videoLibraryService';
import { useRoleStore } from '@/hooks/useRoleStore';
import { useSupervisor } from '@/contexts/SupervisorContext';

interface MatchedVideo extends VideoDocument {
  similarityScore: number;
}

interface Miner {
  id: string;
  name: string;
  department: string;
}

export default function SmartWorkAssignment() {
  const router = useRouter();
  const { user } = useRoleStore();
  const { assignedMiners, loading: minersLoading } = useSupervisor();
  
  // Form fields
  const [workTitle, setWorkTitle] = useState('');
  const [workDescription, setWorkDescription] = useState('');
  const [workDate, setWorkDate] = useState(new Date().toISOString().split('T')[0]);
  const [searchingVideos, setSearchingVideos] = useState(false);
  
  // Step 2: Search Results
  const [matchedVideos, setMatchedVideos] = useState<MatchedVideo[]>([]);
  const [selectedVideo, setSelectedVideo] = useState<MatchedVideo | null>(null);
  const [showResults, setShowResults] = useState(false);
  
  // Step 3: Miner Selection
  const [miners, setMiners] = useState<Miner[]>([]);
  const [selectedMiners, setSelectedMiners] = useState<string[]>([]);
  const [showMinerModal, setShowMinerModal] = useState(false);
  
  // Step 4: Assignment/Request
  const [language, setLanguage] = useState('en');
  const [priority, setPriority] = useState<'low' | 'medium' | 'high' | 'urgent'>('medium');
  
  // Prevent double-click submissions
  const [isAssigning, setIsAssigning] = useState(false);
  const [isRequesting, setIsRequesting] = useState(false);

  useEffect(() => {
    // Use miners from SupervisorContext instead of loading separately
    if (assignedMiners.length > 0) {
      const formattedMiners: Miner[] = assignedMiners.map((miner) => ({
        id: miner.id,
        name: miner.name || 'Unknown',
        department: miner.department || 'General',
      }));
      setMiners(formattedMiners);
      console.log(`✅ Loaded ${formattedMiners.length} miners from context`);
    }
  }, [assignedMiners]);

  const loadMiners = async () => {
    // This function is now deprecated - miners come from context
    try {
      if (!user?.id) {
        Alert.alert('Error', 'Supervisor ID not found. Please login again.');
        return;
      }

      // Fallback in case context hasn't loaded yet
      const { getMinersBySupervisor } = await import('@/services/minerService');
      const loadedMiners = await getMinersBySupervisor(user.id);
      
      const formattedMiners: Miner[] = loadedMiners.map((miner) => ({
        id: miner.id,
        name: miner.name || 'Unknown',
        department: miner.department || 'General',
      }));
      
      setMiners(formattedMiners);
      
      if (formattedMiners.length === 0) {
        Alert.alert('Info', 'No miners are assigned to you yet.');
      } else {
        console.log(`✅ Loaded ${formattedMiners.length} miners assigned to supervisor ${user.id}`);
      }
    } catch (error) {
      console.error('Error loading miners:', error);
      Alert.alert('Error', 'Failed to load your assigned miners.');
    }
  };

  const searchForMatchingVideos = async () => {
    if (!workDescription.trim()) {
      Alert.alert('Missing Information', 'Please describe the work to be assigned.');
      return;
    }

    setSearchingVideos(true);
    try {
      // Search for videos with 80% or higher similarity
      const matches = await VideoLibraryService.searchVideosBySimilarity(
        workDescription,
        80,
        language !== 'all' ? language : undefined
      );

      setMatchedVideos(matches);
      setShowResults(true);

      if (matches.length === 0) {
        // No matching videos found - will need to request generation
        Alert.alert(
          '🔍 No Matching Videos',
          'No videos found matching your description (80% threshold). You can request a new video to be generated.',
          [{ text: 'OK' }]
        );
      } else {
        // Show top match
        Alert.alert(
          '✅ Videos Found',
          `Found ${matches.length} matching video(s). Best match: "${matches[0].topic}" (${matches[0].similarityScore}% similarity)`,
          [{ text: 'Review Matches' }]
        );
      }
    } catch (error) {
      console.error('Error searching videos:', error);
      Alert.alert('Error', 'Failed to search for matching videos.');
    } finally {
      setSearchingVideos(false);
    }
  };

  const selectVideo = (video: MatchedVideo) => {
    setSelectedVideo(video);
    setShowMinerModal(true);
  };

  const toggleMiner = (minerId: string) => {
    if (selectedMiners.includes(minerId)) {
      setSelectedMiners(selectedMiners.filter(id => id !== minerId));
    } else {
      setSelectedMiners([...selectedMiners, minerId]);
    }
  };

  const assignVideoToMiners = async () => {
    if (isAssigning) {
      console.log('⚠️ Assignment already in progress, ignoring duplicate click');
      return;
    }

    if (!selectedVideo) {
      Alert.alert('Error', 'No video selected');
      return;
    }

    if (selectedMiners.length === 0) {
      Alert.alert('Missing Selection', 'Please select at least one miner.');
      return;
    }

    setIsAssigning(true);
    try {
      // Import Timestamp and Firestore functions
      const { Timestamp, doc, setDoc, collection, addDoc } = await import('firebase/firestore');
      const { db } = await import('@/config/firebase');
      
      // Validate required fields
      if (!workTitle.trim()) {
        Alert.alert('Missing Information', 'Please enter a work title.');
        setIsAssigning(false);
        return;
      }

      if (!workDescription.trim()) {
        Alert.alert('Missing Information', 'Please enter a work description.');
        setIsAssigning(false);
        return;
      }

      // Initialize progress map for each miner using miner.id as key
      const progressMap: Record<string, any> = {};
      selectedMiners.forEach((minerId) => {
        const miner = miners.find(m => m.id === minerId);
        const minerKey = miner?.id || minerId; // Use miner.id as key
        progressMap[minerKey] = {
          status: 'pending',
          watchedDuration: 0,
          totalDuration: 0,
          completedAt: null,
        };
      });
      
      // Create video assignment with progress map
      const assignmentId = `assignment_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      const assignmentData = {
        id: assignmentId,
        videoId: selectedVideo.id,
        videoTopic: selectedVideo.topic,
        workTitle: workTitle.trim(),
        assignedTo: selectedMiners,
        assignedBy: user?.id || user?.phone || 'unknown',
        assignedAt: Timestamp.now(),
        deadline: Timestamp.fromDate(new Date(new Date(workDate).getTime() + 24 * 60 * 60 * 1000)), // Next day
        isMandatory: true,
        isDailyTask: true,
        taskDate: workDate,
        departments: [...new Set(miners.filter(m => selectedMiners.includes(m.id)).map(m => m.department))],
        description: workDescription,
        status: 'active' as const,
        priority: 'high' as const,
        progress: progressMap, // Add progress map
      };

      // Write directly to Firestore with progress map
      await setDoc(doc(db, 'videoAssignments', assignmentId), assignmentData);
      console.log('✅ Assignment created with progress map:', assignmentId, progressMap);

      // Create notifications for each assigned miner
      console.log('📢 Creating notifications for miners...');
      
      for (const minerId of selectedMiners) {
        const miner = miners.find(m => m.id === minerId);
        try {
          await addDoc(collection(db, 'notifications'), {
            recipientId: minerId,
            recipientName: miner?.name || 'Miner',
            senderId: user?.id || 'supervisor',
            senderName: user?.name || 'Supervisor',
            type: 'video_assignment',
            title: '📹 New Training Video Assigned',
            message: `You have been assigned to watch "${selectedVideo.topic}" for ${workDate}. Please complete before the deadline.`,
            priority: 'high',
            read: false,
            actionRequired: true,
            createdAt: Timestamp.now(),
            metadata: {
              assignmentId: assignmentId,
              videoId: selectedVideo.id,
              videoTopic: selectedVideo.topic,
              deadline: assignmentData.deadline,
              taskDate: workDate,
            },
          });
          console.log('✅ Notification sent to:', miner?.name);
        } catch (notifError) {
          console.error('Failed to send notification to miner:', minerId, notifError);
        }
      }

      Alert.alert(
        '✅ Work Assigned Successfully',
        `Video "${selectedVideo.topic}" has been assigned to ${selectedMiners.length} miner(s) for ${workDate}.\n\n✉️ Notifications sent to all assigned miners.`,
        [
          {
            text: 'OK',
            onPress: () => {
              resetForm();
              router.back();
            },
          },
        ]
      );
    } catch (error) {
      console.error('Error assigning video:', error);
      Alert.alert('Error', 'Failed to assign video to miners.');
    } finally {
      setIsAssigning(false);
    }
  };

  const requestVideoGeneration = async () => {
    if (isRequesting) {
      console.log('⚠️ Request already in progress, ignoring duplicate click');
      return;
    }

    if (!workDescription.trim()) {
      Alert.alert('Missing Information', 'Please describe the work for video generation.');
      return;
    }

    setIsRequesting(true);
    try {
      // Check for existing pending/in-progress request
      const allRequests = await VideoLibraryService.getAllVideoRequests();
      const duplicateRequest = allRequests.find(
        (req) =>
          req.description?.toLowerCase().includes(workDescription.toLowerCase().substring(0, 50)) &&
          req.language === language &&
          (req.status === 'pending' || req.status === 'in-progress')
      );

      if (duplicateRequest) {
        Alert.alert(
          'Similar Request Exists',
          `A similar video request is already ${duplicateRequest.status}. Topic: "${duplicateRequest.topic}". Please wait for it to be completed or modify your description.`,
          [{ text: 'OK' }]
        );
        return;
      }

      const requestData = {
        topic: workDescription.substring(0, 100), // Limit topic length
        description: workDescription,
        language,
        requestedBy: user?.id || 'unknown',
        requestedByName: user?.name || 'Supervisor',
        priority,
        notes: `Auto-requested from Smart Work Assignment for date: ${workDate}`,
      };

      await VideoLibraryService.createVideoRequest(requestData);

      Alert.alert(
        '📨 Video Request Sent',
        'Safety officers have been notified to generate this video. You will be notified when it\'s ready.',
        [
          {
            text: 'OK',
            onPress: () => {
              resetForm();
              router.back();
            },
          },
        ]
      );
    } catch (error) {
      console.error('Error requesting video:', error);
      Alert.alert('Error', 'Failed to send video request.');
    } finally {
      setIsRequesting(false);
    }
  };

  const resetForm = () => {
    setWorkTitle('');
    setWorkDescription('');
    setWorkDate(new Date().toISOString().split('T')[0]);
    setMatchedVideos([]);
    setSelectedVideo(null);
    setShowResults(false);
    setSelectedMiners([]);
    setShowMinerModal(false);
  };

  const renderVideoMatch = ({ item }: { item: MatchedVideo }) => (
    <TouchableOpacity
      style={styles.videoCard}
      onPress={() => selectVideo(item)}
    >
      <View style={styles.videoHeader}>
        <View style={styles.videoIconContainer}>
          <VideoIcon size={24} color={COLORS.primary} />
        </View>
        <View style={styles.videoInfo}>
          <Text style={styles.videoTitle}>{item.topic}</Text>
          <Text style={styles.videoLanguage}>{item.languageName}</Text>
        </View>
        <View style={styles.similarityBadge}>
          <Text style={styles.similarityText}>{item.similarityScore}%</Text>
        </View>
      </View>
      
      {item.description && (
        <Text style={styles.videoDescription} numberOfLines={2}>
          {item.description}
        </Text>
      )}

      <View style={styles.videoStats}>
        <Text style={styles.statText}>
          👁️ {item.statistics.totalViews} views
        </Text>
        <Text style={styles.statText}>
          ✅ {item.statistics.completionRate}% completion
        </Text>
      </View>

      <TouchableOpacity
        style={styles.selectButton}
        onPress={() => selectVideo(item)}
      >
        <Text style={styles.selectButtonText}>Select & Assign</Text>
      </TouchableOpacity>
    </TouchableOpacity>
  );

  const renderMinerItem = ({ item }: { item: Miner }) => {
    const isSelected = selectedMiners.includes(item.id);
    return (
      <TouchableOpacity
        style={[styles.minerCard, isSelected && styles.minerCardSelected]}
        onPress={() => toggleMiner(item.id)}
      >
        <View style={styles.minerInfo}>
          <Text style={[styles.minerName, isSelected && styles.minerNameSelected]}>
            {item.name}
          </Text>
          <Text style={[styles.minerDept, isSelected && styles.minerDeptSelected]}>
            {item.department}
          </Text>
        </View>
        {isSelected && <CheckCircle size={24} color={COLORS.primary} />}
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <ArrowLeft size={24} color={COLORS.text} />
        </TouchableOpacity>
        <View style={styles.headerTitleContainer}>
          <Sparkles size={24} color={COLORS.primary} />
          <Text style={styles.headerTitle}>Smart Work Assignment</Text>
        </View>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView style={styles.content}>
        {/* Step 1: Describe Work */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Calendar size={20} color={COLORS.primary} />
            <Text style={styles.sectionTitle}>1. Describe Work</Text>
          </View>

          <Text style={styles.label}>Work Date</Text>
          <TextInput
            style={styles.input}
            value={workDate}
            onChangeText={setWorkDate}
            placeholder="YYYY-MM-DD"
            placeholderTextColor={COLORS.textMuted}
          />

          <Text style={styles.label}>Work Title *</Text>
          <TextInput
            style={styles.input}
            value={workTitle}
            onChangeText={setWorkTitle}
            placeholder="Enter work title"
            placeholderTextColor={COLORS.textMuted}
          />

          <Text style={styles.label}>Work Description *</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            value={workDescription}
            onChangeText={setWorkDescription}
            placeholder="Enter work description"
            placeholderTextColor={COLORS.textMuted}
            multiline
            numberOfLines={4}
            textAlignVertical="top"
          />

          <Text style={styles.label}>Preferred Language</Text>
          <View style={styles.languageContainer}>
            {[
              { code: 'en', name: 'English' },
              { code: 'hi', name: 'Hindi' },
              { code: 'all', name: 'Any' },
            ].map((lang) => (
              <TouchableOpacity
                key={lang.code}
                style={[
                  styles.languageChip,
                  language === lang.code && styles.languageChipSelected,
                ]}
                onPress={() => setLanguage(lang.code)}
              >
                <Text
                  style={[
                    styles.languageChipText,
                    language === lang.code && styles.languageChipTextSelected,
                  ]}
                >
                  {lang.name}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <TouchableOpacity
            style={styles.searchButton}
            onPress={searchForMatchingVideos}
            disabled={searchingVideos}
          >
            {searchingVideos ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <>
                <Sparkles size={20} color="#fff" />
                <Text style={styles.searchButtonText}>
                  Search Matching Videos (80%+)
                </Text>
              </>
            )}
          </TouchableOpacity>
        </View>

        {/* Step 2: Search Results */}
        {showResults && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <VideoIcon size={20} color={COLORS.primary} />
              <Text style={styles.sectionTitle}>
                2. {matchedVideos.length > 0 ? 'Select Video' : 'No Matches Found'}
              </Text>
            </View>

            {matchedVideos.length > 0 ? (
              <>
                <View style={styles.resultsInfo}>
                  <AlertCircle size={16} color={COLORS.accent} />
                  <Text style={styles.resultsInfoText}>
                    Found {matchedVideos.length} video(s) matching your description above 80% threshold
                  </Text>
                </View>

                <FlatList
                  data={matchedVideos}
                  renderItem={renderVideoMatch}
                  keyExtractor={(item) => item.id}
                  scrollEnabled={false}
                />
              </>
            ) : (
              <View style={styles.noResults}>
                <XCircle size={48} color={COLORS.textMuted} />
                <Text style={styles.noResultsTitle}>No Matching Videos</Text>
                <Text style={styles.noResultsText}>
                  No videos found with 80% or higher similarity.
                  Request a new video to be generated?
                </Text>

                <TouchableOpacity
                  style={styles.requestButton}
                  onPress={requestVideoGeneration}
                >
                  <Send size={20} color="#fff" />
                  <Text style={styles.requestButtonText}>
                    Request Video Generation
                  </Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        )}

        <View style={styles.bottomPadding} />
      </ScrollView>

      {/* Miner Selection Modal */}
      <Modal
        visible={showMinerModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowMinerModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select Miners</Text>
              <TouchableOpacity onPress={() => setShowMinerModal(false)}>
                <XCircle size={24} color={COLORS.text} />
              </TouchableOpacity>
            </View>

            {selectedVideo && (
              <View style={styles.selectedVideoInfo}>
                <Text style={styles.selectedVideoText}>
                  Assigning: <Text style={styles.selectedVideoTopic}>{selectedVideo.topic}</Text>
                </Text>
                <Text style={styles.selectedVideoSimilarity}>
                  {selectedVideo.similarityScore}% match
                </Text>
              </View>
            )}

            <Text style={styles.modalSubtitle}>
              Select miners to assign this video:
            </Text>

            <FlatList
              data={miners}
              renderItem={renderMinerItem}
              keyExtractor={(item) => item.id}
              style={styles.minerList}
            />

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={() => {
                  setShowMinerModal(false);
                  setSelectedMiners([]);
                }}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.assignButton,
                  selectedMiners.length === 0 && styles.assignButtonDisabled,
                ]}
                onPress={assignVideoToMiners}
                disabled={selectedMiners.length === 0}
              >
                <Users size={20} color="#fff" />
                <Text style={styles.assignButtonText}>
                  Assign to {selectedMiners.length} Miner(s)
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
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
    backgroundColor: COLORS.card,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  backButton: {
    padding: 8,
  },
  headerTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.text,
  },
  content: {
    flex: 1,
  },
  section: {
    backgroundColor: COLORS.card,
    margin: 16,
    padding: 20,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.text,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 8,
    marginTop: 12,
  },
  input: {
    backgroundColor: COLORS.background,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 12,
    padding: 12,
    fontSize: 14,
    color: COLORS.text,
  },
  textArea: {
    minHeight: 100,
    textAlignVertical: 'top',
  },
  languageContainer: {
    flexDirection: 'row',
    gap: 8,
    flexWrap: 'wrap',
  },
  languageChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.background,
  },
  languageChipSelected: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  languageChipText: {
    fontSize: 14,
    color: COLORS.text,
    fontWeight: '500',
  },
  languageChipTextSelected: {
    color: '#fff',
  },
  searchButton: {
    backgroundColor: COLORS.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    padding: 16,
    borderRadius: 12,
    marginTop: 20,
  },
  searchButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  resultsInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: COLORS.accent + '20',
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
  },
  resultsInfoText: {
    flex: 1,
    fontSize: 13,
    color: COLORS.accent,
    fontWeight: '500',
  },
  videoCard: {
    backgroundColor: COLORS.background,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  videoHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  videoIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 8,
    backgroundColor: COLORS.primary + '20',
    alignItems: 'center',
    justifyContent: 'center',
  },
  videoInfo: {
    flex: 1,
    marginLeft: 12,
  },
  videoTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 2,
  },
  videoLanguage: {
    fontSize: 12,
    color: COLORS.textMuted,
  },
  similarityBadge: {
    backgroundColor: COLORS.accent,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  similarityText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '700',
  },
  videoDescription: {
    fontSize: 13,
    color: COLORS.textMuted,
    marginBottom: 8,
    lineHeight: 18,
  },
  videoStats: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 12,
  },
  statText: {
    fontSize: 12,
    color: COLORS.textMuted,
  },
  selectButton: {
    backgroundColor: COLORS.primary,
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  selectButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  noResults: {
    alignItems: 'center',
    paddingVertical: 32,
  },
  noResultsTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.text,
    marginTop: 16,
    marginBottom: 8,
  },
  noResultsText: {
    fontSize: 14,
    color: COLORS.textMuted,
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 20,
  },
  requestButton: {
    backgroundColor: "#F59E0B",
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
  },
  requestButtonText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '600',
  },
  bottomPadding: {
    height: 40,
  },
  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: COLORS.card,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: COLORS.text,
  },
  selectedVideoInfo: {
    backgroundColor: COLORS.primary + '20',
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
  },
  selectedVideoText: {
    fontSize: 13,
    color: COLORS.textMuted,
    marginBottom: 4,
  },
  selectedVideoTopic: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.text,
  },
  selectedVideoSimilarity: {
    fontSize: 12,
    color: COLORS.accent,
    fontWeight: '600',
  },
  modalSubtitle: {
    fontSize: 14,
    color: COLORS.textMuted,
    marginBottom: 12,
  },
  minerList: {
    maxHeight: 300,
  },
  minerCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: COLORS.background,
    padding: 16,
    borderRadius: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  minerCardSelected: {
    backgroundColor: COLORS.primary + '20',
    borderColor: COLORS.primary,
  },
  minerInfo: {
    flex: 1,
  },
  minerName: {
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 2,
  },
  minerNameSelected: {
    color: COLORS.primary,
  },
  minerDept: {
    fontSize: 12,
    color: COLORS.textMuted,
  },
  minerDeptSelected: {
    color: COLORS.primary,
  },
  modalActions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 16,
  },
  cancelButton: {
    flex: 1,
    padding: 16,
    borderRadius: 12,
    backgroundColor: COLORS.background,
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.text,
  },
  assignButton: {
    flex: 2,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    padding: 16,
    borderRadius: 12,
    backgroundColor: COLORS.primary,
  },
  assignButtonDisabled: {
    backgroundColor: COLORS.textMuted,
  },
  assignButtonText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '600',
  },
});
