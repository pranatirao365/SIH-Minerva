import { useRouter } from 'expo-router';
import React, { useEffect, useState, useMemo } from 'react';
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
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  ArrowLeft,
  Send,
  Search,
  Filter,
  Video as VideoIcon,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
} from '@/components/Icons';
import { COLORS } from '@/constants/styles';
import { VideoLibraryService, VideoDocument, VideoRequestDocument } from '@/services/videoLibraryService';
import { useRoleStore } from '@/hooks/useRoleStore';

export default function VideoRequestManager() {
  const router = useRouter();
  const { user } = useRoleStore();
  const [videos, setVideos] = useState<VideoDocument[]>([]);
  const [myRequests, setMyRequests] = useState<VideoRequestDocument[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [showRequestModal, setShowRequestModal] = useState(false);
  
  // Request form
  const [requestTopic, setRequestTopic] = useState('');
  const [requestDescription, setRequestDescription] = useState('');
  const [requestPriority, setRequestPriority] = useState<'low' | 'medium' | 'high' | 'urgent'>('medium');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [videosData, requestsData] = await Promise.all([
        VideoLibraryService.getVideos(),
        VideoLibraryService.getSupervisorRequests(user.id || user.phone || 'supervisor'),
      ]);
      setVideos(videosData);
      setMyRequests(requestsData);
    } catch (error) {
      console.error('Error loading data:', error);
      Alert.alert('Error', 'Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const filteredVideos = useMemo(() => {
    return videos.filter(video => {
      // Search filter
      if (searchQuery && !video.topic.toLowerCase().includes(searchQuery.toLowerCase())) {
        return false;
      }
      
      return true;
    });
  }, [videos, searchQuery]);

  const submitRequest = async () => {
    if (!requestTopic.trim()) {
      Alert.alert('Error', 'Please enter a video topic');
      return;
    }
    
    if (!requestDescription.trim()) {
      Alert.alert('Error', 'Please provide a description of what you need');
      return;
    }

    try {
      // Check if video already exists
      const existingVideo = await VideoLibraryService.checkDuplicateVideo(requestTopic.trim(), 'en');
      
      if (existingVideo) {
        Alert.alert(
          'Video Already Exists',
          `A video titled "${existingVideo.topic}" already exists. No need to request generation.`,
          [{ text: 'OK' }]
        );
        return;
      }

      // Check for existing pending/in-progress request with same topic
      const allRequests = await VideoLibraryService.getAllVideoRequests();
      const duplicateRequest = allRequests.find(
        (req) =>
          req.topic.toLowerCase().trim() === requestTopic.toLowerCase().trim() &&
          req.language === 'en' &&
          (req.status === 'pending' || req.status === 'in-progress')
      );

      if (duplicateRequest) {
        Alert.alert(
          'Request Already Exists',
          `A video request for "${duplicateRequest.topic}" is already ${duplicateRequest.status}. Please wait for it to be completed.`,
          [{ text: 'OK' }]
        );
        return;
      }

      await createRequest();
    } catch (error) {
      console.error('Error submitting request:', error);
      Alert.alert('Error', 'Failed to submit request');
    }
  };

  const createRequest = async () => {
    try {
      const requestId = await VideoLibraryService.createVideoRequest({
        topic: requestTopic.trim(),
        language: 'en',
        description: requestDescription.trim(),
        requestedBy: user.id || user.phone || 'supervisor',
        requestedByName: user.name || 'Supervisor',
        priority: requestPriority,
      });

      Alert.alert('Success', 'Your video request has been submitted to the safety officer');
      
      // Reset form
      setRequestTopic('');
      setRequestDescription('');
      setRequestPriority('medium');
      setShowRequestModal(false);
      
      // Reload requests
      loadData();
    } catch (error) {
      console.error('Error creating request:', error);
      Alert.alert('Error', 'Failed to create request');
    }
  };

  const getLanguageName = (code: string) => {
    const languages: { [key: string]: string } = {
      en: '🇬🇧 English',
      hi: '🇮🇳 Hindi',
      te: '🇮🇳 Telugu',
    };
    return languages[code] || code;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return COLORS.accent;
      case 'in-progress': return COLORS.primary;
      case 'rejected': return COLORS.destructive;
      default: return COLORS.textMuted;
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed': return CheckCircle;
      case 'in-progress': return Clock;
      case 'rejected': return XCircle;
      default: return AlertCircle;
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return '#EF4444';
      case 'high': return '#F59E0B';
      case 'medium': return '#3B82F6';
      default: return '#6B7280';
    }
  };

  const renderVideoItem = ({ item }: { item: VideoDocument }) => (
    <View style={styles.videoCard}>
      <View style={styles.videoHeader}>
        <VideoIcon size={24} color={COLORS.primary} />
        <View style={styles.videoInfo}>
          <Text style={styles.videoTitle}>{item.topic}</Text>
          <Text style={styles.videoMeta}>
            {getLanguageName(item.language)} • {item.createdAt.toDate().toLocaleDateString()}
          </Text>
        </View>
      </View>
      <View style={styles.videoStats}>
        <Text style={styles.videoStat}>👁️ {item.statistics.totalViews} views</Text>
        <Text style={styles.videoStat}>📋 {item.statistics.totalAssignments} assignments</Text>
      </View>
    </View>
  );

  const renderRequestItem = ({ item }: { item: VideoRequestDocument }) => {
    const StatusIcon = getStatusIcon(item.status);
    
    return (
      <View style={styles.requestCard}>
        <View style={styles.requestHeader}>
          <View style={styles.requestInfo}>
            <Text style={styles.requestTopic}>{item.topic}</Text>
            <Text style={styles.requestMeta}>
              {getLanguageName(item.language)} • {item.requestedAt.toDate().toLocaleDateString()}
            </Text>
          </View>
          <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.status) + '20' }]}>
            <StatusIcon size={16} color={getStatusColor(item.status)} />
            <Text style={[styles.statusText, { color: getStatusColor(item.status) }]}>
              {item.status.charAt(0).toUpperCase() + item.status.slice(1)}
            </Text>
          </View>
        </View>
        
        <Text style={styles.requestDescription}>{item.description}</Text>
        
        <View style={styles.requestFooter}>
          <View style={[styles.priorityBadge, { backgroundColor: getPriorityColor(item.priority) + '20' }]}>
            <Text style={[styles.priorityText, { color: getPriorityColor(item.priority) }]}>
              {item.priority.charAt(0).toUpperCase() + item.priority.slice(1)} Priority
            </Text>
          </View>
          
          {item.notes && (
            <Text style={styles.notesText}>📝 {item.notes}</Text>
          )}
        </View>
      </View>
    );
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <ArrowLeft size={24} color={COLORS.text} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Video Requests</Text>
          <View style={{ width: 40 }} />
        </View>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading...</Text>
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
        <Text style={styles.headerTitle}>Video Requests</Text>
        <TouchableOpacity onPress={() => setShowRequestModal(true)} style={styles.requestButton}>
          <Send size={20} color="#FFFFFF" />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* My Requests Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>My Requests ({myRequests.length})</Text>
          
          {myRequests.length === 0 ? (
            <View style={styles.emptyContainer}>
              <VideoIcon size={48} color={COLORS.textMuted} />
              <Text style={styles.emptyTitle}>No requests yet</Text>
              <Text style={styles.emptyText}>Request a video when you can't find what you need</Text>
            </View>
          ) : (
            <FlatList
              data={myRequests}
              renderItem={renderRequestItem}
              keyExtractor={item => item.id}
              scrollEnabled={false}
            />
          )}
        </View>

        {/* Available Videos Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Available Videos ({filteredVideos.length})</Text>
          
          {/* Filters */}
          <View style={styles.filtersContainer}>
            <View style={styles.searchContainer}>
              <Search size={16} color={COLORS.textMuted} />
              <TextInput
                style={styles.searchInput}
                placeholder="Search videos..."
                placeholderTextColor={COLORS.textMuted}
                value={searchQuery}
                onChangeText={setSearchQuery}
              />
            </View>

          </View>

          {filteredVideos.length === 0 ? (
            <View style={styles.emptyContainer}>
              <VideoIcon size={48} color={COLORS.textMuted} />
              <Text style={styles.emptyTitle}>No videos found</Text>
              <Text style={styles.emptyText}>
                {searchQuery
                  ? 'Try adjusting your search'
                  : 'Request a video to get started'}
              </Text>
            </View>
          ) : (
            <FlatList
              data={filteredVideos}
              renderItem={renderVideoItem}
              keyExtractor={item => item.id}
              scrollEnabled={false}
            />
          )}
        </View>
      </ScrollView>

      {/* Request Modal */}
      <Modal
        visible={showRequestModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowRequestModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Request New Video</Text>
              <TouchableOpacity onPress={() => setShowRequestModal(false)}>
                <XCircle size={24} color={COLORS.text} />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalBody}>
              <Text style={styles.inputLabel}>Video Topic *</Text>
              <TextInput
                style={styles.input}
                placeholder="e.g., Emergency Evacuation Procedures"
                placeholderTextColor={COLORS.textMuted}
                value={requestTopic}
                onChangeText={setRequestTopic}
              />

              <Text style={styles.inputLabel}>Description *</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                placeholder="Describe what content you need in the video..."
                placeholderTextColor={COLORS.textMuted}
                value={requestDescription}
                onChangeText={setRequestDescription}
                multiline
                numberOfLines={4}
                textAlignVertical="top"
              />

              <Text style={styles.inputLabel}>Priority</Text>
              <View style={styles.priorityButtons}>
                {[
                  { value: 'low', label: 'Low', color: '#6B7280' },
                  { value: 'medium', label: 'Medium', color: '#3B82F6' },
                  { value: 'high', label: 'High', color: '#F59E0B' },
                  { value: 'urgent', label: 'Urgent', color: '#EF4444' },
                ].map(priority => (
                  <TouchableOpacity
                    key={priority.value}
                    style={[
                      styles.priorityButton,
                      requestPriority === priority.value && {
                        backgroundColor: priority.color + '20',
                        borderColor: priority.color,
                      },
                    ]}
                    onPress={() => setRequestPriority(priority.value as any)}
                  >
                    <Text
                      style={[
                        styles.priorityButtonText,
                        requestPriority === priority.value && { color: priority.color },
                      ]}
                    >
                      {priority.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </ScrollView>

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={() => setShowRequestModal(false)}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.submitButton}
                onPress={submitRequest}
              >
                <Send size={16} color="#FFFFFF" />
                <Text style={styles.submitButtonText}>Submit Request</Text>
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
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.text,
  },
  requestButton: {
    backgroundColor: COLORS.primary,
    padding: 10,
    borderRadius: 8,
  },
  content: {
    flex: 1,
    padding: 20,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 16,
  },
  filtersContainer: {
    marginBottom: 16,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.card,
    borderRadius: 8,
    paddingHorizontal: 12,
    marginBottom: 12,
  },
  searchInput: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 8,
    fontSize: 16,
    color: COLORS.text,
  },
  videoCard: {
    backgroundColor: COLORS.card,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  videoHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  videoInfo: {
    flex: 1,
    marginLeft: 12,
  },
  videoTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 4,
  },
  videoMeta: {
    fontSize: 14,
    color: COLORS.textMuted,
  },
  videoStats: {
    flexDirection: 'row',
    gap: 16,
  },
  videoStat: {
    fontSize: 14,
    color: COLORS.textMuted,
  },
  requestCard: {
    backgroundColor: COLORS.card,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  requestHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  requestInfo: {
    flex: 1,
  },
  requestTopic: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 4,
  },
  requestMeta: {
    fontSize: 14,
    color: COLORS.textMuted,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    gap: 4,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
  },
  requestDescription: {
    fontSize: 14,
    color: COLORS.text,
    marginBottom: 12,
  },
  requestFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  priorityBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  priorityText: {
    fontSize: 12,
    fontWeight: '600',
  },
  notesText: {
    fontSize: 12,
    color: COLORS.textMuted,
    fontStyle: 'italic',
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
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    color: COLORS.textMuted,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: COLORS.background,
    borderRadius: 16,
    width: '90%',
    maxHeight: '85%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.text,
  },
  modalBody: {
    padding: 20,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 8,
    marginTop: 16,
  },
  input: {
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: COLORS.text,
    backgroundColor: COLORS.card,
  },
  textArea: {
    minHeight: 100,
    textAlignVertical: 'top',
  },
  languageButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  languageButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    backgroundColor: COLORS.card,
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: 'center',
  },
  languageButtonActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  languageButtonText: {
    fontSize: 14,
    color: COLORS.text,
  },
  languageButtonTextActive: {
    color: '#FFFFFF',
  },
  priorityButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  priorityButton: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 8,
    backgroundColor: COLORS.card,
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: 'center',
  },
  priorityButtonText: {
    fontSize: 13,
    color: COLORS.text,
    fontWeight: '500',
  },
  modalActions: {
    flexDirection: 'row',
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    gap: 12,
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 8,
    backgroundColor: COLORS.border,
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: 16,
    color: COLORS.text,
    fontWeight: '600',
  },
  submitButton: {
    flex: 2,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 8,
    backgroundColor: COLORS.primary,
    gap: 8,
  },
  submitButtonText: {
    fontSize: 16,
    color: '#FFFFFF',
    fontWeight: '600',
  },
});
