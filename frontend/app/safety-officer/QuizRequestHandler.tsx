import { useRouter } from 'expo-router';
import { useFocusEffect } from '@react-navigation/native';
import React, { useEffect, useState, useMemo, useCallback } from 'react';
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
  BookOpen,
  Send,
  Search,
  Filter,
} from '@/components/Icons';
import { COLORS } from '@/constants/styles';
import { QuizRequestService, QuizRequestDocument } from '@/services/quizRequestService';
import { useRoleStore } from '@/hooks/useRoleStore';

export default function QuizRequestHandler() {
  const router = useRouter();
  const { user } = useRoleStore();
  const [requests, setRequests] = useState<QuizRequestDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'in-progress' | 'completed'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRequest, setSelectedRequest] = useState<QuizRequestDocument | null>(null);
  const [showActionModal, setShowActionModal] = useState(false);
  const [notes, setNotes] = useState('');

  useEffect(() => {
    loadRequests();
  }, []);

  useFocusEffect(
    useCallback(() => {
      // Refresh data when screen comes into focus
      loadRequests();
    }, [])
  );

  const loadRequests = async () => {
    try {
      setLoading(true);
      const allRequests = await QuizRequestService.getAllQuizRequests();
      setRequests(allRequests);
    } catch (error) {
      console.error('Error loading quiz requests:', error);
      Alert.alert('Error', 'Failed to load quiz requests');
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

  const acceptRequest = async (request: QuizRequestDocument) => {
    try {
      await QuizRequestService.acceptQuizRequest(request.id, user.id || user.phone || 'safety-officer');
      
      // Store the request data for auto-fill in DailyQuizManager
      await AsyncStorage.setItem('pendingQuizRequest', JSON.stringify({
        topic: request.topic,
        language: request.language,
        description: request.description,
        difficulty: request.difficulty,
        questionsCount: request.questionsCount,
        targetAudience: request.targetAudience,
        requestedByName: request.requestedByName,
        requestId: request.id,
      }));
      
      Alert.alert(
        '✅ Quiz Request Accepted',
        `Ready to generate quiz!\n\n📝 Topic: ${request.topic}\n🌐 Language: ${getLanguageName(request.language)}\n📊 Difficulty: ${request.difficulty}\n❓ Questions: ${request.questionsCount}\n\nThe form will be auto-filled when you open Daily Quiz Manager.`,
        [
          { 
            text: 'Later', 
            style: 'cancel',
            onPress: () => loadRequests(),
          },
          {
            text: '📚 Generate Now',
            onPress: () => {
              router.push('/safety-officer/DailyQuizManager');
            },
          },
        ]
      );
      
      loadRequests();
    } catch (error) {
      console.error('Error accepting quiz request:', error);
      Alert.alert('Error', 'Failed to accept quiz request');
    }
  };

  const rejectRequest = async () => {
    if (!selectedRequest) return;

    Alert.alert(
      'Reject Quiz Request',
      'Are you sure you want to reject this quiz request? Please provide a reason.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Reject',
          style: 'destructive',
          onPress: async () => {
            try {
              await QuizRequestService.rejectQuizRequest(selectedRequest.id, notes || 'Request rejected');
              
              Alert.alert('Success', 'Quiz request has been rejected');
              setShowActionModal(false);
              setSelectedRequest(null);
              setNotes('');
              loadRequests();
            } catch (error) {
              console.error('Error rejecting quiz request:', error);
              Alert.alert('Error', 'Failed to reject quiz request');
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

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'easy': return '#10B981';
      case 'medium': return '#F59E0B';
      case 'hard': return '#EF4444';
      default: return COLORS.textMuted;
    }
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

  const renderRequestItem = ({ item }: { item: QuizRequestDocument }) => {
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
            <View style={styles.quizMetaRow}>
              <View style={[styles.difficultyBadge, { backgroundColor: getDifficultyColor(item.difficulty) + '20' }]}>
                <Text style={[styles.difficultyText, { color: getDifficultyColor(item.difficulty) }]}>
                  {item.difficulty.toUpperCase()}
                </Text>
              </View>
              <Text style={styles.questionsCount}>❓ {item.questionsCount} questions</Text>
              <Text style={styles.targetAudience}>👥 {item.targetAudience}</Text>
            </View>
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

        {isInProgress && (
          <View style={styles.inProgressBanner}>
            <Clock size={14} color={COLORS.primary} />
            <Text style={styles.inProgressText}>In Progress - Generate the quiz to complete</Text>
          </View>
        )}
      </TouchableOpacity>
    );
  };

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <BookOpen size={64} color={COLORS.textMuted} />
      <Text style={styles.emptyStateTitle}>No Quiz Requests</Text>
      <Text style={styles.emptyStateText}>
        {statusFilter === 'pending'
          ? 'No pending quiz requests at the moment'
          : 'No quiz requests match your current filters'}
      </Text>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <ArrowLeft size={24} color={COLORS.text} />
        </TouchableOpacity>
        <View style={styles.headerTitleContainer}>
          <BookOpen size={24} color={COLORS.primary} />
          <Text style={styles.headerTitle}>Quiz Requests</Text>
        </View>
        <View style={{ width: 40 }} />
      </View>

      {/* Search and Filters */}
      <View style={styles.filtersContainer}>
        <View style={styles.searchContainer}>
          <Search size={20} color={COLORS.textMuted} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search by topic, description, or requestor..."
            placeholderTextColor={COLORS.textMuted}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.statusFiltersScroll}
          contentContainerStyle={styles.statusFilters}
        >
          {['all', 'pending', 'in-progress', 'completed'].map((status) => (
            <TouchableOpacity
              key={status}
              style={[
                styles.filterChip,
                statusFilter === status && styles.filterChipActive,
              ]}
              onPress={() => setStatusFilter(status as any)}
            >
              <Text
                style={[
                  styles.filterChipText,
                  statusFilter === status && styles.filterChipTextActive,
                ]}
              >
                {status === 'all' ? 'All' : status.charAt(0).toUpperCase() + status.slice(1).replace('-', ' ')}
              </Text>
              {status !== 'all' && (
                <View style={styles.filterCount}>
                  <Text style={styles.filterCountText}>
                    {requests.filter(r => r.status === status).length}
                  </Text>
                </View>
              )}
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Requests List */}
      <FlatList
        data={filteredRequests}
        renderItem={renderRequestItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={renderEmptyState}
        refreshing={loading}
        onRefresh={loadRequests}
      />

      {/* Action Modal */}
      <Modal
        visible={showActionModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowActionModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Quiz Request Details</Text>
              <TouchableOpacity onPress={() => setShowActionModal(false)}>
                <XCircle size={24} color={COLORS.text} />
              </TouchableOpacity>
            </View>

            {selectedRequest && (
              <ScrollView style={styles.modalBody}>
                <View style={styles.detailSection}>
                  <Text style={styles.detailLabel}>Topic</Text>
                  <Text style={styles.detailValue}>{selectedRequest.topic}</Text>
                </View>

                <View style={styles.detailSection}>
                  <Text style={styles.detailLabel}>Description</Text>
                  <Text style={styles.detailValue}>{selectedRequest.description}</Text>
                </View>

                <View style={styles.detailRow}>
                  <View style={styles.detailSection}>
                    <Text style={styles.detailLabel}>Language</Text>
                    <Text style={styles.detailValue}>{getLanguageName(selectedRequest.language)}</Text>
                  </View>

                  <View style={styles.detailSection}>
                    <Text style={styles.detailLabel}>Difficulty</Text>
                    <Text style={[styles.detailValue, { color: getDifficultyColor(selectedRequest.difficulty) }]}>
                      {selectedRequest.difficulty.toUpperCase()}
                    </Text>
                  </View>
                </View>

                <View style={styles.detailRow}>
                  <View style={styles.detailSection}>
                    <Text style={styles.detailLabel}>Questions</Text>
                    <Text style={styles.detailValue}>{selectedRequest.questionsCount}</Text>
                  </View>

                  <View style={styles.detailSection}>
                    <Text style={styles.detailLabel}>Target Audience</Text>
                    <Text style={styles.detailValue}>{selectedRequest.targetAudience}</Text>
                  </View>
                </View>

                <View style={styles.detailSection}>
                  <Text style={styles.detailLabel}>Requested By</Text>
                  <Text style={styles.detailValue}>{selectedRequest.requestedByName}</Text>
                </View>

                <View style={styles.detailSection}>
                  <Text style={styles.detailLabel}>Priority</Text>
                  <View style={[styles.priorityBadge, { backgroundColor: getPriorityColor(selectedRequest.priority) + '20' }]}>
                    <Text style={[styles.priorityText, { color: getPriorityColor(selectedRequest.priority) }]}>
                      {selectedRequest.priority.toUpperCase()}
                    </Text>
                  </View>
                </View>

                <View style={styles.detailSection}>
                  <Text style={styles.detailLabel}>Status</Text>
                  <Text style={[styles.detailValue, { color: getStatusColor(selectedRequest.status) }]}>
                    {selectedRequest.status.toUpperCase()}
                  </Text>
                </View>

                {(selectedRequest.status === 'in-progress' || selectedRequest.status === 'rejected') && (
                  <View style={styles.notesSection}>
                    <Text style={styles.detailLabel}>Notes</Text>
                    <TextInput
                      style={styles.notesInput}
                      placeholder="Add notes (optional)..."
                      placeholderTextColor={COLORS.textMuted}
                      value={notes}
                      onChangeText={setNotes}
                      multiline
                      numberOfLines={3}
                    />
                  </View>
                )}
              </ScrollView>
            )}

            <View style={styles.modalActions}>
              {selectedRequest?.status === 'pending' && (
                <>
                  <TouchableOpacity
                    style={styles.rejectButton}
                    onPress={rejectRequest}
                  >
                    <XCircle size={20} color={COLORS.destructive} />
                    <Text style={styles.rejectButtonText}>Reject</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.acceptButtonLarge}
                    onPress={() => {
                      setShowActionModal(false);
                      if (selectedRequest) acceptRequest(selectedRequest);
                    }}
                  >
                    <CheckCircle size={20} color="#FFFFFF" />
                    <Text style={styles.acceptButtonLargeText}>Accept & Generate</Text>
                  </TouchableOpacity>
                </>
              )}

              {selectedRequest?.status === 'in-progress' && (
                <TouchableOpacity
                  style={styles.generateButton}
                  onPress={() => {
                    setShowActionModal(false);
                    router.push('/safety-officer/DailyQuizManager');
                  }}
                >
                  <BookOpen size={20} color="#FFFFFF" />
                  <Text style={styles.generateButtonText}>Go to Quiz Manager</Text>
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
    gap: 12,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: COLORS.text,
  },
  filtersContainer: {
    backgroundColor: COLORS.card,
    paddingHorizontal: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.background,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginBottom: 12,
  },
  searchInput: {
    flex: 1,
    marginLeft: 12,
    fontSize: 15,
    color: COLORS.text,
  },
  statusFiltersScroll: {
    marginHorizontal: -20,
    paddingHorizontal: 20,
  },
  statusFilters: {
    flexDirection: 'row',
    gap: 8,
  },
  filterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: COLORS.background,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  filterChipActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  filterChipText: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.text,
  },
  filterChipTextActive: {
    color: '#FFFFFF',
  },
  filterCount: {
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 10,
    minWidth: 20,
    alignItems: 'center',
  },
  filterCountText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  listContent: {
    padding: 20,
  },
  requestCard: {
    backgroundColor: COLORS.card,
    borderRadius: 16,
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
    marginRight: 12,
  },
  requestTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 6,
    flexWrap: 'wrap',
  },
  requestTopic: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.text,
    flexShrink: 1,
  },
  priorityBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  priorityText: {
    fontSize: 11,
    fontWeight: '700',
  },
  requestMeta: {
    fontSize: 13,
    color: COLORS.textMuted,
    marginBottom: 4,
  },
  quizMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginTop: 8,
  },
  difficultyBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  difficultyText: {
    fontSize: 11,
    fontWeight: '700',
  },
  questionsCount: {
    fontSize: 12,
    color: COLORS.textMuted,
    fontWeight: '600',
  },
  targetAudience: {
    fontSize: 12,
    color: COLORS.textMuted,
    fontWeight: '600',
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '700',
  },
  requestDescription: {
    fontSize: 14,
    color: COLORS.textMuted,
    lineHeight: 20,
    marginBottom: 12,
  },
  quickActions: {
    flexDirection: 'row',
    gap: 8,
  },
  acceptButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: COLORS.primary,
    paddingVertical: 10,
    borderRadius: 8,
  },
  acceptButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  viewButton: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.background,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  viewButtonText: {
    color: COLORS.text,
    fontSize: 14,
    fontWeight: '600',
  },
  inProgressBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: COLORS.primary + '20',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
  },
  inProgressText: {
    fontSize: 12,
    color: COLORS.primary,
    fontWeight: '600',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyStateTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.text,
    marginTop: 16,
    marginBottom: 8,
  },
  emptyStateText: {
    fontSize: 14,
    color: COLORS.textMuted,
    textAlign: 'center',
    lineHeight: 20,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: COLORS.card,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
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
    fontWeight: '700',
    color: COLORS.text,
  },
  modalBody: {
    padding: 20,
  },
  detailSection: {
    marginBottom: 20,
  },
  detailRow: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 20,
  },
  detailLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.textMuted,
    marginBottom: 6,
  },
  detailValue: {
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.text,
  },
  notesSection: {
    marginTop: 12,
  },
  notesInput: {
    backgroundColor: COLORS.background,
    borderRadius: 12,
    padding: 12,
    fontSize: 14,
    color: COLORS.text,
    borderWidth: 1,
    borderColor: COLORS.border,
    minHeight: 80,
    textAlignVertical: 'top',
  },
  modalActions: {
    flexDirection: 'row',
    gap: 12,
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  rejectButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 16,
    borderRadius: 12,
    backgroundColor: COLORS.background,
    borderWidth: 1,
    borderColor: COLORS.destructive,
  },
  rejectButtonText: {
    color: COLORS.destructive,
    fontSize: 15,
    fontWeight: '600',
  },
  acceptButtonLarge: {
    flex: 2,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 16,
    borderRadius: 12,
    backgroundColor: COLORS.primary,
  },
  acceptButtonLargeText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '600',
  },
  generateButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 16,
    borderRadius: 12,
    backgroundColor: COLORS.primary,
  },
  generateButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '600',
  },
});
