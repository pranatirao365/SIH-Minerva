import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import React, { useEffect, useState, useMemo } from 'react';
import {
  Alert,
  FlatList,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  Modal,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  ArrowLeft,
  Play,
  User,
  Users,
  Calendar,
  Clock,
  CheckCircle,
  XCircle,
  Send,
  Filter,
  Search,
  Video as VideoIcon,
  AlertTriangle,
} from '@/components/Icons';
import { COLORS } from '@/constants/styles';
import { getRegisteredMiners } from '@/services/minerService';

interface VideoItem {
  id: string;
  topic: string;
  language: string;
  languageName: string;
  videoUrl: string;
  timestamp: number;
  thumbnail?: string;
}

interface Miner {
  id: string;
  name: string;
  role: string;
  status: string;
  safetyScore: number;
  shift: 'morning' | 'afternoon' | 'night';
}

interface VideoAssignment {
  id: string;
  videoId: string;
  videoTopic: string;
  assignedTo: string[]; // miner IDs
  assignedBy: string;
  deadline: number;
  isMandatory: boolean;
  assignedAt: number;
  description?: string;
  isDailyTask?: boolean;
  taskDate?: string; // YYYY-MM-DD format
}

interface AssignmentProgress {
  assignmentId: string;
  minerId: string;
  watched: boolean;
  watchedAt?: number;
  progress: number; // 0-100
}

const mockMiners: Miner[] = [
  { id: '1', name: 'Ramesh Kumar', role: 'Miner', status: 'active', safetyScore: 92, shift: 'morning' },
  { id: '2', name: 'Suresh Reddy', role: 'Miner', status: 'active', safetyScore: 88, shift: 'afternoon' },
  { id: '3', name: 'Vijay Singh', role: 'Miner', status: 'break', safetyScore: 95, shift: 'night' },
  { id: '4', name: 'Anil Sharma', role: 'Miner', status: 'active', safetyScore: 85, shift: 'morning' },
];

export default function MandatoryVideoManager() {
  const router = useRouter();
  const [videos, setVideos] = useState<VideoItem[]>([]);
  const [assignments, setAssignments] = useState<VideoAssignment[]>([]);
  const [assignmentProgress, setAssignmentProgress] = useState<AssignmentProgress[]>([]);
  const [loading, setLoading] = useState(true);

  // Modal states
  const [showAssignmentModal, setShowAssignmentModal] = useState(false);
  const [selectedVideo, setSelectedVideo] = useState<VideoItem | null>(null);
  const [selectedMiners, setSelectedMiners] = useState<string[]>([]);
  const [deadline, setDeadline] = useState('');
  const [isMandatory, setIsMandatory] = useState(true);
  const [assignmentDescription, setAssignmentDescription] = useState('');

  // Filter states
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'completed'>('all');
  const [selectedAssignmentForStatus, setSelectedAssignmentForStatus] = useState<VideoAssignment | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      // Load videos from AsyncStorage (same as VideoLibrary)
      const storedVideos = await AsyncStorage.getItem('generatedVideos');
      if (storedVideos) {
        setVideos(JSON.parse(storedVideos));
      }

      // Load assignments
      const storedAssignments = await AsyncStorage.getItem('videoAssignments');
      if (storedAssignments) {
        setAssignments(JSON.parse(storedAssignments));
      }

      // Load progress from all user-specific keys
      const allProgress: AssignmentProgress[] = [];
      for (const miner of mockMiners) {
        const storedProgress = await AsyncStorage.getItem(`assignmentProgress_${miner.id}`);
        if (storedProgress) {
          const userProgress = JSON.parse(storedProgress);
          allProgress.push(...userProgress);
        }
      }
      setAssignmentProgress(allProgress);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const saveAssignments = async (newAssignments: VideoAssignment[]) => {
    try {
      await AsyncStorage.setItem('videoAssignments', JSON.stringify(newAssignments));
      setAssignments(newAssignments);
    } catch (error) {
      console.error('Error saving assignments:', error);
    }
  };

  const saveProgress = async (newProgress: AssignmentProgress[]) => {
    try {
      await AsyncStorage.setItem('assignmentProgress', JSON.stringify(newProgress));
      setAssignmentProgress(newProgress);
    } catch (error) {
      console.error('Error saving progress:', error);
    }
  };

  const createAssignment = () => {
    if (!selectedVideo || selectedMiners.length === 0) {
      Alert.alert('Error', 'Please select a video and at least one miner');
      return;
    }

    const newAssignment: VideoAssignment = {
      id: Date.now().toString(),
      videoId: selectedVideo.id,
      videoTopic: selectedVideo.topic,
      assignedTo: selectedMiners,
      assignedBy: 'Safety Officer', // In real app, get from user context
      deadline: deadline ? new Date(deadline).getTime() : Date.now() + 7 * 24 * 60 * 60 * 1000, // 7 days default
      isMandatory,
      assignedAt: Date.now(),
      description: assignmentDescription,
    };

    const updatedAssignments = [...assignments, newAssignment];
    saveAssignments(updatedAssignments);

    // Create progress entries for each assigned miner
    const newProgress: AssignmentProgress[] = selectedMiners.map(minerId => ({
      assignmentId: newAssignment.id,
      minerId,
      watched: false,
      progress: 0,
    }));

    const updatedProgress = [...assignmentProgress, ...newProgress];
    saveProgress(updatedProgress);

    // Reset modal
    setShowAssignmentModal(false);
    setSelectedVideo(null);
    setSelectedMiners([]);
    setDeadline('');
    setIsMandatory(true);
    setAssignmentDescription('');

    Alert.alert('Success', `Video assigned to ${selectedMiners.length} miner(s)`);
  };

  const getAssignmentStats = (assignment: VideoAssignment) => {
    const progress = assignmentProgress.filter(p => p.assignmentId === assignment.id);
    const completed = progress.filter(p => p.watched).length;
    const total = assignment.assignedTo.length;
    return { completed, total, percentage: total > 0 ? Math.round((completed / total) * 100) : 0 };
  };

  const getDateAnalytics = () => {
    const analytics: { [date: string]: { total: number; completed: number; videos: string[] } } = {};

    assignments.forEach(assignment => {
      const date = new Date(assignment.assignedAt).toISOString().split('T')[0];
      const stats = getAssignmentStats(assignment);

      if (!analytics[date]) {
        analytics[date] = { total: 0, completed: 0, videos: [] };
      }

      analytics[date].total += stats.total;
      analytics[date].completed += stats.completed;
      if (!analytics[date].videos.includes(assignment.videoTopic)) {
        analytics[date].videos.push(assignment.videoTopic);
      }
    });

    return analytics;
  };

  const getMinerStatusData = () => {
    const minerStatusData = mockMiners.map(miner => {
      const minerAssignments = assignments.filter(assignment =>
        assignment.assignedTo.includes(miner.id)
      );

      const completedAssignments = minerAssignments.filter(assignment => {
        const progress = assignmentProgress.find(p =>
          p.assignmentId === assignment.id && p.minerId === miner.id
        );
        return progress?.watched;
      });

      const overdueAssignments = minerAssignments.filter(assignment => {
        const progress = assignmentProgress.find(p =>
          p.assignmentId === assignment.id && p.minerId === miner.id
        );
        return !progress?.watched && assignment.deadline < Date.now();
      });

      const status = overdueAssignments.length > 0 ? 'overdue' :
                    completedAssignments.length === minerAssignments.length && minerAssignments.length > 0 ? 'completed' :
                    minerAssignments.length > 0 ? 'pending' : 'no-assignments';

      return {
        miner,
        totalAssignments: minerAssignments.length,
        completedAssignments: completedAssignments.length,
        overdueAssignments: overdueAssignments.length,
        status,
      };
    });

    return minerStatusData;
  };

  const sendNotification = (minerId: string, message: string) => {
    // In a real app, this would send a push notification
    Alert.alert('Notification Sent', `Notification sent to miner: ${message}`);
  };

  const sendNotificationToAssignment = (assignment: VideoAssignment) => {
    const message = `Reminder: Please complete the video assignment "${assignment.videoTopic}" before the deadline: ${new Date(assignment.deadline).toLocaleDateString()}.`;
    
    assignment.assignedTo.forEach(minerId => {
      sendNotification(minerId, message);
    });
    
    Alert.alert('Notifications Sent', `Notifications sent to ${assignment.assignedTo.length} miner(s) for assignment: ${assignment.videoTopic}`);
  };

  const filteredAssignments = useMemo(() => {
    return assignments.filter(assignment => {
      // Search filter
      if (searchQuery && !assignment.videoTopic.toLowerCase().includes(searchQuery.toLowerCase())) {
        return false;
      }

      // Status filter
      if (statusFilter !== 'all') {
        const stats = getAssignmentStats(assignment);
        const isCompleted = stats.completed === stats.total;
        if (statusFilter === 'completed' && !isCompleted) return false;
        if (statusFilter === 'pending' && isCompleted) return false;
      }

      return true;
    });
  }, [assignments, searchQuery, statusFilter, assignmentProgress]);

  const toggleMinerSelection = (minerId: string) => {
    setSelectedMiners(prev =>
      prev.includes(minerId)
        ? prev.filter(id => id !== minerId)
        : [...prev, minerId]
    );
  };

  const renderAssignmentItem = ({ item }: { item: VideoAssignment }) => {
    const stats = getAssignmentStats(item);
    const isOverdue = item.deadline < Date.now() && stats.completed < stats.total;

    return (
      <View style={styles.assignmentCard}>
        <View style={styles.assignmentHeader}>
          <View style={styles.assignmentInfo}>
            <Text style={styles.assignmentTitle}>{item.videoTopic}</Text>
            <Text style={styles.assignmentMeta}>
              Assigned to {item.assignedTo.length} miner(s) • {item.isMandatory ? 'Mandatory' : 'Optional'}
            </Text>
            <Text style={styles.assignmentDeadline}>
              Deadline: {new Date(item.deadline).toLocaleDateString()}
            </Text>
          </View>
          <View style={styles.assignmentStats}>
            <Text style={styles.statsText}>{stats.completed}/{stats.total} completed</Text>
            <Text style={styles.percentageText}>{stats.percentage}%</Text>
            {isOverdue && <AlertTriangle size={16} color={COLORS.destructive} />}
          </View>
        </View>

        {item.description && (
          <Text style={styles.assignmentDescription}>{item.description}</Text>
        )}

        <View style={styles.progressBar}>
          <View
            style={[
              styles.progressFill,
              { width: `${stats.percentage}%` },
              stats.percentage === 100 ? styles.progressComplete : null
            ]}
          />
        </View>

        <View style={styles.cardActions}>
          <TouchableOpacity
            style={styles.sendNotificationButton}
            onPress={() => sendNotificationToAssignment(item)}
          >
            <Text style={styles.sendNotificationButtonText}>Send Notification</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.viewStatusButton}
            onPress={() => setSelectedAssignmentForStatus(item)}
          >
            <Text style={styles.viewStatusButtonText}>View Status</Text>
          </TouchableOpacity>
        </View>
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
        <Text style={styles.headerTitle}>Mandatory Video Manager</Text>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Text style={styles.backButtonText}>Go Back</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content}>
        {/* Current Assignments */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Active Assignments</Text>
            <Text style={styles.sectionCount}>{filteredAssignments.length} assignments</Text>
          </View>

          {/* Filters */}
          <View style={styles.filtersContainer}>
            <View style={styles.searchContainer}>
              <Search size={16} color={COLORS.textMuted} />
              <TextInput
                style={styles.searchInput}
                placeholder="Search assignments..."
                placeholderTextColor={COLORS.textMuted}
                value={searchQuery}
                onChangeText={setSearchQuery}
              />
            </View>

            <View style={styles.statusFilters}>
              {[
                { label: 'All', value: 'all' },
                { label: 'Pending', value: 'pending' },
                { label: 'Completed', value: 'completed' },
              ].map((filter) => (
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

          {filteredAssignments.length === 0 ? (
            <View style={styles.emptyContainer}>
              <VideoIcon size={48} color={COLORS.textMuted} />
              <Text style={styles.emptyTitle}>No assignments found</Text>
              <Text style={styles.emptyText}>
                {searchQuery || statusFilter !== 'all'
                  ? 'Try adjusting your filters'
                  : 'Create your first video assignment'
                }
              </Text>
            </View>
          ) : (
            <FlatList
              data={filteredAssignments}
              renderItem={renderAssignmentItem}
              keyExtractor={(item) => item.id}
              showsVerticalScrollIndicator={false}
              scrollEnabled={false}
            />
          )}
        </View>
      </ScrollView>

      {/* Assignment Modal */}
      <Modal
        visible={showAssignmentModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowAssignmentModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                {selectedVideo ? 'Assign Video' : 'Select Video to Assign'}
              </Text>
              <TouchableOpacity
                onPress={() => setShowAssignmentModal(false)}
                style={styles.modalCloseButton}
              >
                <XCircle size={24} color={COLORS.text} />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalBody}>
              {!selectedVideo ? (
                // Video selection
                <View>
                  <Text style={styles.modalSubtitle}>Available Videos</Text>
                  {videos.map((video) => (
                    <TouchableOpacity
                      key={video.id}
                      style={styles.modalVideoItem}
                      onPress={() => setSelectedVideo(video)}
                    >
                      <VideoIcon size={20} color={COLORS.primary} />
                      <View style={styles.modalVideoInfo}>
                        <Text style={styles.modalVideoTitle}>{video.topic}</Text>
                        <Text style={styles.modalVideoMeta}>
                          {video.languageName} • {new Date(video.timestamp).toLocaleDateString()}
                        </Text>
                      </View>
                    </TouchableOpacity>
                  ))}
                </View>
              ) : (
                // Assignment details
                <View>
                  <View style={styles.selectedVideo}>
                    <VideoIcon size={24} color={COLORS.primary} />
                    <View style={styles.selectedVideoInfo}>
                      <Text style={styles.selectedVideoTitle}>{selectedVideo.topic}</Text>
                      <Text style={styles.selectedVideoMeta}>
                        {selectedVideo.languageName} • {new Date(selectedVideo.timestamp).toLocaleDateString()}
                      </Text>
                    </View>
                  </View>

                  <Text style={styles.modalSubtitle}>Assign to Miners</Text>
                  {mockMiners.map((miner) => (
                    <TouchableOpacity
                      key={miner.id}
                      style={[
                        styles.minerSelectItem,
                        selectedMiners.includes(miner.id) && styles.minerSelectItemSelected,
                      ]}
                      onPress={() => toggleMinerSelection(miner.id)}
                    >
                      <View style={styles.minerInfo}>
                        <User size={20} color={selectedMiners.includes(miner.id) ? COLORS.primary : COLORS.text} />
                        <View>
                          <Text style={[
                            styles.minerName,
                            selectedMiners.includes(miner.id) && styles.minerNameSelected
                          ]}>
                            {miner.name}
                          </Text>
                          <Text style={styles.minerMeta}>
                            {miner.role} • {miner.status} • Safety: {miner.safetyScore}%
                          </Text>
                        </View>
                      </View>
                      {selectedMiners.includes(miner.id) && (
                        <CheckCircle size={20} color={COLORS.primary} />
                      )}
                    </TouchableOpacity>
                  ))}

                  <Text style={styles.modalSubtitle}>Assignment Settings</Text>

                  <View style={styles.settingItem}>
                    <Text style={styles.settingLabel}>Mandatory</Text>
                    <TouchableOpacity
                      style={[styles.toggle, isMandatory && styles.toggleActive]}
                      onPress={() => setIsMandatory(!isMandatory)}
                    >
                      <View style={[styles.toggleKnob, isMandatory && styles.toggleKnobActive]} />
                    </TouchableOpacity>
                  </View>

                  <TextInput
                    style={styles.descriptionInput}
                    placeholder="Assignment description (optional)"
                    placeholderTextColor={COLORS.textMuted}
                    value={assignmentDescription}
                    onChangeText={setAssignmentDescription}
                    multiline
                    numberOfLines={3}
                  />

                  <TextInput
                    style={styles.deadlineInput}
                    placeholder="Deadline (YYYY-MM-DD)"
                    placeholderTextColor={COLORS.textMuted}
                    value={deadline}
                    onChangeText={setDeadline}
                  />
                </View>
              )}
            </ScrollView>

            {selectedVideo && (
              <View style={styles.modalActions}>
                <TouchableOpacity
                  style={styles.cancelButton}
                  onPress={() => setShowAssignmentModal(false)}
                >
                  <Text style={styles.cancelButtonText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.assignButtonLarge, selectedMiners.length === 0 && styles.assignButtonDisabled]}
                  onPress={createAssignment}
                  disabled={selectedMiners.length === 0}
                >
                  <Send size={16} color="#FFFFFF" />
                  <Text style={styles.assignButtonText}>
                    Assign to {selectedMiners.length} Miner{selectedMiners.length !== 1 ? 's' : ''}
                  </Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        </View>
      </Modal>

      {/* Miner Status Modal */}
      <Modal
        visible={selectedAssignmentForStatus !== null}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setSelectedAssignmentForStatus(null)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.minerStatusModal}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Miner Status</Text>
              <TouchableOpacity
                onPress={() => setSelectedAssignmentForStatus(null)}
                style={styles.modalCloseButton}
              >
                <XCircle size={24} color={COLORS.text} />
              </TouchableOpacity>
            </View>

            {selectedAssignmentForStatus && (
              <ScrollView style={styles.minerModalContent}>
                <Text style={styles.modalAssignmentInfo}>
                  Video: {selectedAssignmentForStatus.videoTopic}
                </Text>
                <Text style={styles.modalAssignmentInfo}>
                  Deadline: {new Date(selectedAssignmentForStatus.deadline).toLocaleDateString()}
                </Text>

                <View style={styles.minerStatusList}>
                  {selectedAssignmentForStatus.assignedTo.map((minerId) => {
                    const miner = mockMiners.find(m => m.id === minerId);
                    const progress = assignmentProgress.find(
                      p => p.assignmentId === selectedAssignmentForStatus.id && p.minerId === minerId
                    );
                    
                    let status = 'pending';
                    if (progress) {
                      status = progress.watched ? 'completed' : 'in-progress';
                    }
                    if (selectedAssignmentForStatus.deadline < Date.now() && status !== 'completed') {
                      status = 'overdue';
                    }

                    return (
                      <View key={minerId} style={styles.minerStatusItem}>
                        <View style={styles.modalMinerInfo}>
                          <User size={20} color={COLORS.primary} />
                          <View style={styles.minerDetails}>
                            <Text style={styles.modalMinerName}>{miner?.name || 'Unknown Miner'}</Text>
                            <Text style={styles.minerRole}>{miner?.role || 'Unknown Role'}</Text>
                          </View>
                        </View>
                        <View style={[
                          styles.statusBadge,
                          status === 'completed' && styles.statusCompleted,
                          status === 'in-progress' && styles.statusInProgress,
                          status === 'overdue' && styles.statusOverdue,
                          status === 'pending' && styles.statusPending,
                        ]}>
                          <Text style={[
                            styles.statusText,
                            status === 'completed' && styles.statusTextCompleted,
                            status === 'in-progress' && styles.statusTextInProgress,
                            status === 'overdue' && styles.statusTextOverdue,
                            status === 'pending' && styles.statusTextPending,
                          ]}>
                            {status === 'in-progress' ? 'In Progress' : status.charAt(0).toUpperCase() + status.slice(1)}
                          </Text>
                        </View>
                      </View>
                    );
                  })}
                </View>
              </ScrollView>
            )}
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
  backButtonText: {
    fontSize: 16,
    color: COLORS.primary,
    fontWeight: '600',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.text,
  },
  addButton: {
    padding: 8,
  },
  content: {
    flex: 1,
    padding: 20,
  },
  section: {
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.text,
  },
  sectionCount: {
    fontSize: 14,
    color: COLORS.textMuted,
  },
  sectionSubtitle: {
    fontSize: 14,
    color: COLORS.textMuted,
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
  statusFilters: {
    flexDirection: 'row',
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
  assignmentCard: {
    backgroundColor: COLORS.card,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  assignmentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  assignmentInfo: {
    flex: 1,
  },
  assignmentTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 4,
  },
  assignmentMeta: {
    fontSize: 14,
    color: COLORS.textMuted,
    marginBottom: 2,
  },
  assignmentDeadline: {
    fontSize: 12,
    color: COLORS.textMuted,
  },
  assignmentStats: {
    alignItems: 'flex-end',
  },
  statsText: {
    fontSize: 12,
    color: COLORS.textMuted,
    marginBottom: 2,
  },
  percentageText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.primary,
  },
  assignmentDescription: {
    fontSize: 14,
    color: COLORS.text,
    marginBottom: 12,
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
  videoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.card,
    borderRadius: 12,
    padding: 16,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  videoIcon: {
    marginRight: 12,
  },
  videoInfo: {
    flex: 1,
  },
  videoTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: COLORS.text,
    marginBottom: 2,
  },
  videoMeta: {
    fontSize: 12,
    color: COLORS.textMuted,
  },
  assignButton: {
    padding: 8,
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
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: COLORS.background,
    borderRadius: 12,
    margin: 20,
    width: '90%',
    maxHeight: '80%',
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
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.text,
  },
  modalCloseButton: {
    padding: 4,
  },
  modalBody: {
    padding: 20,
    maxHeight: 400,
  },
  modalSubtitle: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 12,
    marginTop: 16,
  },
  modalVideoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 8,
    backgroundColor: COLORS.card,
    marginBottom: 8,
  },
  modalVideoInfo: {
    marginLeft: 12,
    flex: 1,
  },
  modalVideoTitle: {
    fontSize: 16,
    color: COLORS.text,
    marginBottom: 2,
  },
  modalVideoMeta: {
    fontSize: 12,
    color: COLORS.textMuted,
  },
  selectedVideo: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: COLORS.card,
    borderRadius: 8,
    marginBottom: 16,
  },
  selectedVideoInfo: {
    marginLeft: 12,
    flex: 1,
  },
  selectedVideoTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 2,
  },
  selectedVideoMeta: {
    fontSize: 12,
    color: COLORS.textMuted,
  },
  minerSelectItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 12,
    borderRadius: 8,
    backgroundColor: COLORS.card,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  minerSelectItemSelected: {
    borderColor: COLORS.primary,
    backgroundColor: COLORS.primary + '10',
  },
  minerInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  minerName: {
    fontSize: 16,
    color: COLORS.text,
    marginBottom: 2,
  },
  minerNameSelected: {
    color: COLORS.primary,
    fontWeight: '600',
  },
  minerMeta: {
    fontSize: 12,
    color: COLORS.textMuted,
  },
  settingItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
  },
  settingLabel: {
    fontSize: 16,
    color: COLORS.text,
  },
  toggle: {
    width: 50,
    height: 28,
    borderRadius: 14,
    backgroundColor: COLORS.border,
    padding: 2,
  },
  toggleActive: {
    backgroundColor: COLORS.primary,
  },
  toggleKnob: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
    transform: [{ translateX: 0 }],
  },
  toggleKnobActive: {
    transform: [{ translateX: 22 }],
  },
  descriptionInput: {
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: COLORS.text,
    minHeight: 80,
    textAlignVertical: 'top',
    marginBottom: 16,
  },
  deadlineInput: {
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: COLORS.text,
    marginBottom: 20,
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
    paddingVertical: 12,
    borderRadius: 8,
    backgroundColor: COLORS.border,
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: 16,
    color: COLORS.text,
    fontWeight: '600',
  },
  assignButtonLarge: {
    flex: 2,
    paddingVertical: 12,
    borderRadius: 8,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 8,
  },
  assignButtonDisabled: {
    backgroundColor: COLORS.textMuted,
  },
  assignButtonText: {
    fontSize: 16,
    color: '#FFFFFF',
    fontWeight: '600',
  },
  dateFilters: {
    marginTop: 16,
  },
  filterLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 8,
  },
  dateFilterButtons: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  dateFilter: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.card,
  },
  dateFilterActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  dateFilterText: {
    fontSize: 12,
    color: COLORS.text,
    fontWeight: '500',
  },
  dateFilterTextActive: {
    color: '#FFFFFF',
  },
  analyticsToggle: {
    marginTop: 16,
    paddingVertical: 8,
    paddingHorizontal: 16,
    backgroundColor: COLORS.accent + '20',
    borderRadius: 8,
    alignSelf: 'flex-start',
  },
  analyticsToggleText: {
    fontSize: 14,
    color: COLORS.accent,
    fontWeight: '600',
  },
  analyticsSection: {
    marginTop: 20,
  },
  analyticsCard: {
    backgroundColor: COLORS.card,
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  analyticsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 12,
  },
  analyticsStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  analyticsStat: {
    alignItems: 'center',
  },
  analyticsStatValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.primary,
  },
  analyticsStatLabel: {
    fontSize: 12,
    color: COLORS.textMuted,
    marginTop: 4,
  },
  dateAnalyticsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  dateText: {
    fontSize: 14,
    fontWeight: '500',
    color: COLORS.text,
  },
  dateStats: {
    alignItems: 'flex-end',
  },
  dateStatText: {
    fontSize: 14,
    color: COLORS.primary,
    fontWeight: '500',
  },
  dateVideosText: {
    fontSize: 12,
    color: COLORS.textMuted,
    marginTop: 2,
  },
  noAnalyticsText: {
    fontSize: 14,
    color: COLORS.textMuted,
    textAlign: 'center',
    paddingVertical: 20,
  },
  tableHeader: {
    flexDirection: 'row',
    paddingVertical: 12,
    borderBottomWidth: 2,
    borderBottomColor: COLORS.primary,
    marginBottom: 8,
  },
  tableHeaderText: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.text,
    textAlign: 'center',
  },
  tableRow: {
    flexDirection: 'row',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    alignItems: 'center',
  },
  tableCell: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  tableCellText: {
    fontSize: 14,
    color: COLORS.text,
    textAlign: 'center',
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    alignSelf: 'center',
  },
  statusCompleted: {
    backgroundColor: COLORS.accent + '20',
  },
  statusOverdue: {
    backgroundColor: COLORS.destructive + '20',
  },
  statusPending: {
    backgroundColor: COLORS.primary + '20',
  },
  statusNoAssignments: {
    backgroundColor: COLORS.textMuted + '20',
  },
  statusText: {
    fontSize: 12,
    fontWeight: '500',
    textAlign: 'center',
  },
  statusTextCompleted: {
    color: COLORS.accent,
  },
  statusTextOverdue: {
    color: COLORS.destructive,
  },
  statusTextPending: {
    color: COLORS.primary,
  },
  statusTextNoAssignments: {
    color: COLORS.textMuted,
  },
  notifyButton: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: 8,
    paddingVertical: 6,
    borderRadius: 6,
    alignSelf: 'center',
  },
  viewStatusButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.primary,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 8,
  },
  viewStatusButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  cardActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 12,
    gap: 12,
  },
  sendNotificationButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.primary,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 8,
  },
  sendNotificationButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  minerStatusModal: {
    backgroundColor: COLORS.card,
    marginHorizontal: 16,
    marginVertical: 32,
    borderRadius: 12,
    maxHeight: '85%',
    width: '90%',
    maxWidth: 400,
    alignSelf: 'center',
  },
  minerModalContent: {
    padding: 16,
  },
  modalAssignmentInfo: {
    fontSize: 14,
    color: COLORS.textMuted,
    marginBottom: 8,
  },
  minerStatusList: {
    marginTop: 16,
  },
  minerStatusItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  modalMinerInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  minerDetails: {
    marginLeft: 12,
    flex: 1,
  },
  modalMinerName: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text,
  },
  minerRole: {
    fontSize: 14,
    color: COLORS.textMuted,
  },
  statusInProgress: {
    backgroundColor: '#FFA500',
  },
  statusTextInProgress: {
    color: '#FFFFFF',
  },
});
