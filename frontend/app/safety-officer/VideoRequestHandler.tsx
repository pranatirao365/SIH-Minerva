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
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
import {
  ArrowLeft,
  CheckCircle,
  XCircle,
  Clock,
  AlertCircle,
  Video as VideoIcon,
  Send,
  Search,
  Filter,
} from '@/components/Icons';
import { COLORS } from '@/constants/styles';
import { VideoLibraryService, VideoRequestDocument, VideoDocument } from '@/services/videoLibraryService';
import { useRoleStore } from '@/hooks/useRoleStore';

export default function VideoRequestHandler() {
  const router = useRouter();
  const { user } = useRoleStore();
  const [requests, setRequests] = useState<VideoRequestDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'in-progress' | 'completed'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRequest, setSelectedRequest] = useState<VideoRequestDocument | null>(null);
  const [showActionModal, setShowActionModal] = useState(false);
  const [notes, setNotes] = useState('');

  useEffect(() => {
    loadRequests();
  }, []);

  const loadRequests = async () => {
    try {
      setLoading(true);
      const allRequests = await VideoLibraryService.getAllVideoRequests();
      setRequests(allRequests);
    } catch (error) {
      console.error('Error loading requests:', error);
      Alert.alert('Error', 'Failed to load video requests');
    } finally {
      setLoading(false);
    }
  };

  const filteredRequests = useMemo(() => {
    return requests.filter(request => {
      // Status filter
      if (statusFilter !== 'all' && request.status !== statusFilter) {
        return false;
      }

      // Search filter
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        return (
          request.topic.toLowerCase().includes(query) ||
          request.description.toLowerCase().includes(query) ||
          request.requestedByName.toLowerCase().includes(query)
        );
      }

      return true;
    });
  }, [requests, statusFilter, searchQuery]);

  const acceptRequest = async (request: VideoRequestDocument) => {
    try {
      await VideoLibraryService.updateVideoRequest(request.id, {
        status: 'in-progress',
        assignedTo: user.id || user.phone || 'safety-officer',
      });
      
      // Store the request data for auto-fill
      await AsyncStorage.setItem('pendingVideoRequest', JSON.stringify({
        topic: request.topic,
        language: request.language,
        description: request.description,
        requestId: request.id,
      }));
      
      Alert.alert(
        '✅ Request Accepted',
        `Ready to generate video!\n\n📝 Topic: ${request.topic}\n🌐 Language: ${getLanguageName(request.language)}\n\nNote: AI will generate a professional title when you create the video.`,
        [
          { 
            text: 'Later', 
            style: 'cancel',
            onPress: () => loadRequests(),
          },
          {
            text: '🎬 Generate Now',
            onPress: () => {
              router.push('/safety-officer/VideoGenerationModule');
            },
          },
        ]
      );
      
      loadRequests();
    } catch (error) {
      console.error('Error accepting request:', error);
      Alert.alert('Error', 'Failed to accept request');
    }
  };

  const markAsCompleted = async () => {
    if (!selectedRequest) return;

    // In a real app, you would search for the video by topic and language
    // For now, we'll simulate this
    try {
      const existingVideo = await VideoLibraryService.checkDuplicateVideo(
        selectedRequest.topic,
        selectedRequest.language
      );

      if (!existingVideo) {
        Alert.alert(
          'Video Not Found',
          'Please generate the video first before marking the request as completed.',
          [
            { text: 'OK' },
            {
              text: 'Generate Video',
              onPress: () => router.push('/safety-officer/VideoGenerationModule'),
            },
          ]
        );
        return;
      }

      await VideoLibraryService.completeVideoRequest(selectedRequest.id, existingVideo.id, notes);
      
      Alert.alert('Success', 'Request marked as completed');
      setShowActionModal(false);
      setSelectedRequest(null);
      setNotes('');
      loadRequests();
    } catch (error) {
      console.error('Error completing request:', error);
      Alert.alert('Error', 'Failed to complete request');
    }
  };

  const rejectRequest = async () => {
    if (!selectedRequest) return;

    Alert.alert(
      'Reject Request',
      'Are you sure you want to reject this video request? Please provide a reason.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Reject',
          style: 'destructive',
          onPress: async () => {
            try {
              await VideoLibraryService.updateVideoRequest(selectedRequest.id, {
                status: 'rejected',
                notes: notes || 'Request rejected',
              });
              
              Alert.alert('Success', 'Request has been rejected');
              setShowActionModal(false);
              setSelectedRequest(null);
              setNotes('');
              loadRequests();
            } catch (error) {
              console.error('Error rejecting request:', error);
              Alert.alert('Error', 'Failed to reject request');
            }
          },
        },
      ]
    );
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

  const renderRequestItem = ({ item }: { item: VideoRequestDocument }) => {
    const StatusIcon = getStatusIcon(item.status);
    const isPending = item.status === 'pending';
    const isInProgress = item.status === 'in-progress';

    return (
      <TouchableOpacity
        style={styles.requestCard}
        onPress={() => {
          setSelectedRequest(item);
          setShowActionModal(true);
        }}
      >
        <View style={styles.requestHeader}>
          <View style={styles.requestInfo}>
            <View style={styles.requestTitleRow}>
              <Text style={styles.requestTopic}>{item.topic}</Text>
              <View style={[styles.priorityBadge, { backgroundColor: getPriorityColor(item.priority) + '20' }]}>
                <Text style={[styles.priorityText, { color: getPriorityColor(item.priority) }]}>
                  {item.priority.toUpperCase()}
                </Text>
              </View>
            </View>
            <Text style={styles.requestMeta}>
              Requested by: {item.requestedByName}
            </Text>
            <Text style={styles.requestMeta}>
              {getLanguageName(item.language)} • {item.requestedAt && typeof item.requestedAt.toDate === 'function' ? item.requestedAt.toDate().toLocaleDateString() : 
               item.requestedAt && typeof item.requestedAt === 'object' && item.requestedAt.seconds ? new Date(item.requestedAt.seconds * 1000).toLocaleDateString() :
               'Date not available'}
            </Text>
          </View>
          <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.status) + '20' }]}>
            <StatusIcon size={16} color={getStatusColor(item.status)} />
            <Text style={[styles.statusText, { color: getStatusColor(item.status) }]}>
              {item.status.charAt(0).toUpperCase() + item.status.slice(1).replace('-', ' ')}
            </Text>
          </View>
        </View>

        <Text style={styles.requestDescription} numberOfLines={2}>
          {item.description}
        </Text>

        {isPending && (
          <View style={styles.quickActions}>
            <TouchableOpacity
              style={styles.acceptButton}
              onPress={() => acceptRequest(item)}
            >
              <CheckCircle size={16} color="#FFFFFF" />
              <Text style={styles.acceptButtonText}>Accept</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.viewButton}
              onPress={() => {
                setSelectedRequest(item);
                setShowActionModal(true);
              }}
            >
              <Text style={styles.viewButtonText}>View Details</Text>
            </TouchableOpacity>
          </View>
        )}

        {isInProgress && item.assignedTo === (user.id || user.phone || 'safety-officer') && (
          <View style={styles.inProgressBanner}>
            <Clock size={16} color={COLORS.primary} />
            <Text style={styles.inProgressText}>You're working on this request</Text>
          </View>
        )}
      </TouchableOpacity>
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
          <Text style={styles.loadingText}>Loading requests...</Text>
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
        <View style={styles.headerTextContainer}>
          <Text style={styles.headerTitle}>Video Requests</Text>
          <Text style={styles.headerSubtitle}>{filteredRequests.length} requests</Text>
        </View>
        <View style={{ width: 40 }} />
      </View>

      <View style={styles.content}>
        {/* Filters */}
        <View style={styles.filtersContainer}>
          <View style={styles.searchContainer}>
            <Search size={16} color={COLORS.textMuted} />
            <TextInput
              style={styles.searchInput}
              placeholder="Search requests..."
              placeholderTextColor={COLORS.textMuted}
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
          </View>

          <View style={styles.statusFilters}>
            {[
              { label: 'All', value: 'all' },
              { label: 'Pending', value: 'pending' },
              { label: 'In Progress', value: 'in-progress' },
              { label: 'Completed', value: 'completed' },
            ].map(filter => (
              <TouchableOpacity
                key={filter.value}
                style={[
                  styles.statusFilter,
                  statusFilter === filter.value && styles.statusFilterActive,
                ]}
                onPress={() => setStatusFilter(filter.value as any)}
              >
                <Text
                  style={[
                    styles.statusFilterText,
                    statusFilter === filter.value && styles.statusFilterTextActive,
                  ]}
                >
                  {filter.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Requests List */}
        {filteredRequests.length === 0 ? (
          <View style={styles.emptyContainer}>
            <VideoIcon size={48} color={COLORS.textMuted} />
            <Text style={styles.emptyTitle}>No requests found</Text>
            <Text style={styles.emptyText}>
              {searchQuery || statusFilter !== 'all'
                ? 'Try adjusting your filters'
                : 'Supervisors can request videos from you'}
            </Text>
          </View>
        ) : (
          <FlatList
            data={filteredRequests}
            renderItem={renderRequestItem}
            keyExtractor={item => item.id}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.listContent}
          />
        )}
      </View>

      {/* Action Modal */}
      <Modal
        visible={showActionModal}
        transparent
        animationType="slide"
        onRequestClose={() => {
          setShowActionModal(false);
          setSelectedRequest(null);
          setNotes('');
        }}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Request Details</Text>
              <TouchableOpacity
                onPress={() => {
                  setShowActionModal(false);
                  setSelectedRequest(null);
                  setNotes('');
                }}
              >
                <XCircle size={24} color={COLORS.text} />
              </TouchableOpacity>
            </View>

            {selectedRequest && (
              <ScrollView style={styles.modalBody}>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Topic:</Text>
                  <Text style={styles.detailValue}>{selectedRequest.topic}</Text>
                </View>

                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Language:</Text>
                  <Text style={styles.detailValue}>{getLanguageName(selectedRequest.language)}</Text>
                </View>

                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Requested by:</Text>
                  <Text style={styles.detailValue}>{selectedRequest.requestedByName}</Text>
                </View>

                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Priority:</Text>
                  <View style={[styles.priorityBadge, { backgroundColor: getPriorityColor(selectedRequest.priority) + '20' }]}>
                    <Text style={[styles.priorityText, { color: getPriorityColor(selectedRequest.priority) }]}>
                      {selectedRequest.priority.toUpperCase()}
                    </Text>
                  </View>
                </View>

                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Requested on:</Text>
                  <Text style={styles.detailValue}>
                    {selectedRequest.requestedAt && typeof selectedRequest.requestedAt.toDate === 'function' ? selectedRequest.requestedAt.toDate().toLocaleDateString() : 'Date not available'} at{' '}
                    {selectedRequest.requestedAt && typeof selectedRequest.requestedAt.toDate === 'function' ? selectedRequest.requestedAt.toDate().toLocaleTimeString() : 'Time not available'}
                  </Text>
                </View>

                <View style={styles.descriptionSection}>
                  <Text style={styles.detailLabel}>Description:</Text>
                  <Text style={styles.descriptionText}>{selectedRequest.description}</Text>
                </View>

                {selectedRequest.status === 'in-progress' && (
                  <View>
                    <Text style={styles.notesLabel}>Notes (optional):</Text>
                    <TextInput
                      style={styles.notesInput}
                      placeholder="Add notes about video completion..."
                      placeholderTextColor={COLORS.textMuted}
                      value={notes}
                      onChangeText={setNotes}
                      multiline
                      numberOfLines={3}
                      textAlignVertical="top"
                    />
                  </View>
                )}

                {selectedRequest.notes && (
                  <View style={styles.existingNotes}>
                    <Text style={styles.existingNotesLabel}>Previous Notes:</Text>
                    <Text style={styles.existingNotesText}>{selectedRequest.notes}</Text>
                  </View>
                )}
              </ScrollView>
            )}

            <View style={styles.modalActions}>
              {selectedRequest?.status === 'pending' && (
                <>
                  <TouchableOpacity
                    style={styles.modalAcceptButton}
                    onPress={() => {
                      acceptRequest(selectedRequest);
                      setShowActionModal(false);
                      setSelectedRequest(null);
                    }}
                  >
                    <CheckCircle size={16} color="#FFFFFF" />
                    <Text style={styles.modalAcceptButtonText}>Accept & Start</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.modalRejectButton}
                    onPress={rejectRequest}
                  >
                    <XCircle size={16} color="#FFFFFF" />
                    <Text style={styles.modalRejectButtonText}>Reject</Text>
                  </TouchableOpacity>
                </>
              )}

              {selectedRequest?.status === 'in-progress' && (
                <>
                  <TouchableOpacity
                    style={styles.modalGenerateButton}
                    onPress={() => {
                      setShowActionModal(false);
                      router.push('/safety-officer/VideoGenerationModule');
                    }}
                  >
                    <VideoIcon size={16} color="#FFFFFF" />
                    <Text style={styles.modalGenerateButtonText}>Generate Video</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.modalCompleteButton}
                    onPress={markAsCompleted}
                  >
                    <CheckCircle size={16} color="#FFFFFF" />
                    <Text style={styles.modalCompleteButtonText}>Mark Completed</Text>
                  </TouchableOpacity>
                </>
              )}

              {(selectedRequest?.status === 'completed' || selectedRequest?.status === 'rejected') && (
                <TouchableOpacity
                  style={styles.modalCloseButton}
                  onPress={() => {
                    setShowActionModal(false);
                    setSelectedRequest(null);
                    setNotes('');
                  }}
                >
                  <Text style={styles.modalCloseButtonText}>Close</Text>
                </TouchableOpacity>
              )}
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
  headerTextContainer: {
    flex: 1,
    marginLeft: 12,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.text,
  },
  headerSubtitle: {
    fontSize: 14,
    color: COLORS.textMuted,
    marginTop: 2,
  },
  content: {
    flex: 1,
    padding: 20,
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
  statusFilters: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  statusFilter: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: COLORS.card,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  statusFilterActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  statusFilterText: {
    fontSize: 14,
    color: COLORS.text,
  },
  statusFilterTextActive: {
    color: '#FFFFFF',
  },
  listContent: {
    paddingBottom: 20,
  },
  requestCard: {
    backgroundColor: COLORS.card,
    borderRadius: 16,
    padding: 18,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: COLORS.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 3,
  },
  requestHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  requestInfo: {
    flex: 1,
    marginRight: 12,
  },
  requestTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    gap: 8,
  },
  requestTopic: {
    fontSize: 17,
    fontWeight: '700',
    color: COLORS.text,
    flex: 1,
    lineHeight: 24,
  },
  requestMeta: {
    fontSize: 13,
    color: COLORS.textMuted,
    marginBottom: 4,
    lineHeight: 20,
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
  priorityBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 10,
    alignSelf: 'flex-start',
  },
  priorityText: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.8,
  },
  requestDescription: {
    fontSize: 14,
    color: COLORS.text,
    marginBottom: 12,
    lineHeight: 20,
    opacity: 0.9,
  },
  quickActions: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 4,
  },
  acceptButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.accent,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 10,
    gap: 6,
    shadowColor: COLORS.accent,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
  },
  acceptButtonText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: 0.3,
  },
  viewButton: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.primary,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 10,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 2,
  },
  viewButtonText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: 0.3,
  },
  inProgressBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.primary + '20',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    gap: 8,
  },
  inProgressText: {
    fontSize: 14,
    color: COLORS.primary,
    fontWeight: '600',
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
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
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  modalContent: {
    backgroundColor: COLORS.background,
    borderRadius: 20,
    width: SCREEN_WIDTH > 768 ? 600 : '100%',
    maxWidth: 600,
    maxHeight: '90%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 10,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 24,
    paddingBottom: 20,
    borderBottomWidth: 2,
    borderBottomColor: COLORS.border,
    backgroundColor: COLORS.card,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: COLORS.text,
    flex: 1,
    marginRight: 12,
  },
  modalBody: {
    padding: 24,
    paddingTop: 20,
  },
  detailRow: {
    marginBottom: 20,
    backgroundColor: COLORS.card,
    padding: 14,
    borderRadius: 12,
    borderLeftWidth: 4,
    borderLeftColor: COLORS.primary,
  },
  detailLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.primary,
    marginBottom: 6,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  detailValue: {
    fontSize: 16,
    color: COLORS.text,
    fontWeight: '500',
    lineHeight: 22,
  },
  descriptionSection: {
    marginBottom: 20,
    backgroundColor: COLORS.card,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  descriptionText: {
    fontSize: 15,
    color: COLORS.text,
    lineHeight: 24,
    fontWeight: '400',
  },
  notesLabel: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: 10,
    marginTop: 8,
  },
  notesInput: {
    borderWidth: 2,
    borderColor: COLORS.border,
    borderRadius: 12,
    padding: 14,
    fontSize: 15,
    color: COLORS.text,
    backgroundColor: COLORS.card,
    minHeight: 100,
    textAlignVertical: 'top',
    marginBottom: 16,
    lineHeight: 22,
  },
  existingNotes: {
    backgroundColor: COLORS.card,
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
    borderLeftWidth: 4,
    borderLeftColor: COLORS.primary,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  existingNotesLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.primary,
    marginBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  existingNotesText: {
    fontSize: 15,
    color: COLORS.text,
    fontStyle: 'italic',
    lineHeight: 22,
  },
  modalActions: {
    padding: 20,
    paddingTop: 16,
    borderTopWidth: 2,
    borderTopColor: COLORS.border,
    backgroundColor: COLORS.card,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
    gap: 12,
  },
  modalAcceptButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.accent,
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderRadius: 12,
    gap: 8,
    shadowColor: COLORS.accent,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 4,
  },
  modalAcceptButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: 0.5,
  },
  modalRejectButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.destructive,
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderRadius: 12,
    gap: 8,
    borderWidth: 1,
    borderColor: COLORS.destructive,
  },
  modalRejectButtonText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: 0.5,
  },
  modalGenerateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.primary,
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderRadius: 12,
    gap: 8,
    marginBottom: 8,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 4,
  },
  modalGenerateButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: 0.5,
  },
  modalCompleteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.accent,
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderRadius: 12,
    gap: 8,
    shadowColor: COLORS.accent,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 4,
  },
  modalCompleteButtonText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: 0.5,
  },
  modalCloseButton: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.card,
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: COLORS.border,
  },
  modalCloseButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.text,
    letterSpacing: 0.5,
  },
});
