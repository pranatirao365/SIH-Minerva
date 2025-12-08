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
  ScrollView,
  RefreshControl,
  ActivityIndicator,
  Dimensions,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ArrowLeft, AlertTriangle, Bell } from '@/components/Icons';
import { COLORS } from '@/constants/styles';
import { collection, query, where, getDocs, addDoc, Timestamp, onSnapshot } from 'firebase/firestore';
import { db } from '@/config/firebase';
import { useRoleStore } from '@/hooks/useRoleStore';
import {
  initializeAutoNotifications,
  checkAndSendDailyReminders,
  sendImmediateReminder,
} from '@/services/autoNotificationService';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const isSmallScreen = SCREEN_WIDTH < 380;
const isMediumScreen = SCREEN_WIDTH >= 380 && SCREEN_WIDTH < 768;

interface VideoAssignment {
  id: string;
  videoId: string;
  videoTopic: string;
  assignedTo: string[];
  assignedBy: string;
  deadline: Timestamp;
  isMandatory: boolean;
  isDailyTask: boolean;
  taskDate?: string;
  assignedAt: Timestamp;
  description?: string;
  status: 'active' | 'completed' | 'expired' | 'cancelled';
  progress?: Record<string, {
    status: 'pending' | 'completed';
    watchedDuration: number;
    totalDuration: number;
    completedAt: Timestamp | null;
  }>;
}

interface AssignmentProgress {
  id: string;
  assignmentId: string;
  minerId: string;
  videoId: string;
  watched: boolean;
  completedAt?: Timestamp;
  progress: number;
  watchTime: number;
  status: 'not_started' | 'in_progress' | 'completed' | 'overdue';
}

interface Miner {
  id: string;
  name: string;
  email?: string;
  department?: string;
  shift?: string;
}

interface MinerProgressSummary {
  miner: Miner;
  totalAssignments: number;
  completedCount: number;
  pendingCount: number;
  overdueCount: number;
  completionRate: number;
  assignments: Array<{
    assignment: VideoAssignment;
    progress: AssignmentProgress | null;
  }>;
}

export default function VideoProgressDashboard() {
  const router = useRouter();
  const { user } = useRoleStore();
  const [miners, setMiners] = useState<Miner[]>([]);
  const [assignments, setAssignments] = useState<VideoAssignment[]>([]);
  const [progressData, setProgressData] = useState<AssignmentProgress[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [sendingNotification, setSendingNotification] = useState<string | null>(null);
  const [autoNotificationsEnabled, setAutoNotificationsEnabled] = useState(false);

  // Filter states
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'completed' | 'pending' | 'overdue'>('all');
  const [showFilters, setShowFilters] = useState(false);
  const [selectedMiner, setSelectedMiner] = useState<MinerProgressSummary | null>(null);

  useEffect(() => {
    loadData();
    initializeAutoNotificationSystem();
    
    // Set up real-time listener for assignment updates (including progress map)
    if (!user?.phone) return;
    
    const assignmentsRef = collection(db, 'videoAssignments');
    const assignmentsQuery = query(
      assignmentsRef,
      where('assignedBy', '==', user.phone),
      where('status', '==', 'active')
    );
    
    const unsubscribe = onSnapshot(assignmentsQuery, (snapshot) => {
      const updatedAssignments: VideoAssignment[] = [];
      snapshot.forEach((doc) => {
        updatedAssignments.push({
          id: doc.id,
          ...doc.data(),
        } as VideoAssignment);
      });
      
      setAssignments(updatedAssignments);
      console.log('🔄 Real-time update: Assignment progress maps refreshed');
      console.log('📊 Total assignments:', updatedAssignments.length);
      
      // Log progress for debugging
      updatedAssignments.forEach((assignment) => {
        console.log(`Assignment ${assignment.id} progress:`, assignment.progress);
      });
    });
    
    return () => unsubscribe();
  }, [user?.phone]);

  const initializeAutoNotificationSystem = async () => {
    if (!user?.id) return;
    
    try {
      console.log('🚀 Initializing auto-notification system...');
      await initializeAutoNotifications(user.id);
      setAutoNotificationsEnabled(true);
      console.log('✅ Auto-notifications enabled: Reminders will be sent 8 hours before shift');
    } catch (error) {
      console.error('❌ Failed to initialize auto-notifications:', error);
    }
  };

  const loadData = async () => {
    try {
      if (!user?.id) {
        console.error('Supervisor ID not found');
        setMiners([]);
        setLoading(false);
        return;
      }

      // Load miners assigned to this supervisor using the service
      const { getMinersBySupervisor } = await import('@/services/minerService');
      const loadedMiners = await getMinersBySupervisor(user.id);
      setMiners(loadedMiners);

      // Get list of miner IDs for filtering assignments
      const minerIds = loadedMiners.map(m => m.id);

      // Load assignments created by this supervisor with real-time listener
      const assignmentsRef = collection(db, 'videoAssignments');
      const assignmentsQuery = query(
        assignmentsRef,
        where('assignedBy', '==', user.id || user.phone),
        where('status', '==', 'active')
      );
      
      // Use onSnapshot for real-time updates
      const unsubscribe = onSnapshot(assignmentsQuery, (snapshot) => {
        const loadedAssignments: VideoAssignment[] = [];
        snapshot.forEach((doc) => {
          const data = doc.data();
          loadedAssignments.push({
            id: doc.id,
            videoId: data.videoId,
            videoTopic: data.videoTopic,
            assignedTo: data.assignedTo || [],
            assignedBy: data.assignedBy,
            deadline: data.deadline,
            isMandatory: data.isMandatory || false,
            isDailyTask: data.isDailyTask || false,
            taskDate: data.taskDate,
            assignedAt: data.assignedAt,
            description: data.description,
            status: data.status,
            progress: data.progress || {}, // Include progress map from Firestore
          } as any);
        });
        
        setAssignments(loadedAssignments);
        console.log(`✅ Loaded ${loadedMiners.length} miners, ${loadedAssignments.length} assignments`);
        
        // Log progress maps for debugging
        loadedAssignments.forEach((assignment) => {
          console.log(`📋 Assignment ${assignment.id}:`, {
            videoTopic: assignment.videoTopic,
            assignedTo: assignment.assignedTo,
            progress: (assignment as any).progress,
          });
        });
      });
      
      // Return cleanup function
      return unsubscribe;
    } catch (error) {
      console.error('Error loading data:', error);
      Alert.alert('Error', 'Failed to load progress data from database');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
  };

  // Calculate progress summary for each miner
  const minerProgressSummaries = useMemo(() => {
    const summaries: MinerProgressSummary[] = [];

    miners.forEach((miner) => {
      // Find all assignments for this miner
      const minerAssignments = assignments.filter((assignment) =>
        assignment.assignedTo.includes(miner.id)
      );

      let completedCount = 0;
      let pendingCount = 0;
      let overdueCount = 0;
      const assignmentDetails: Array<{
        assignment: VideoAssignment;
        progress: AssignmentProgress | null;
      }> = [];

      minerAssignments.forEach((assignment) => {
        // Read progress from the progress map in the assignment document
        const progressMap = (assignment as any).progress || {};
        const minerKey = miner.id; // Always use miner.id as key
        const minerProgress = progressMap[minerKey];
        
        console.log(`📊 Checking progress for ${miner.name} (${minerKey}):`, {
          assignmentId: assignment.id,
          videoTopic: assignment.videoTopic,
          progressMap: progressMap,
          minerProgress: minerProgress,
        });
        
        const isCompleted = minerProgress && minerProgress.status === 'completed';
        
        // Safe deadline handling - check if deadline exists and has toDate method
        let deadlineDate: Date | null = null;
        if (assignment.deadline) {
          if (typeof assignment.deadline.toDate === 'function') {
            deadlineDate = assignment.deadline.toDate();
          } else if (typeof assignment.deadline === 'string') {
            deadlineDate = new Date(assignment.deadline);
          } else if (assignment.deadline instanceof Date) {
            deadlineDate = assignment.deadline;
          }
        }
        
        const isOverdue = !isCompleted && deadlineDate && deadlineDate < new Date();

        if (isCompleted) {
          completedCount++;
          console.log(`✅ ${miner.name} completed ${assignment.videoTopic}`);
        } else if (isOverdue) {
          overdueCount++;
          console.log(`⏰ ${miner.name} overdue on ${assignment.videoTopic}`);
        } else {
          pendingCount++;
          console.log(`⏳ ${miner.name} pending on ${assignment.videoTopic}`);
        }

        // Convert progress map entry to AssignmentProgress format for compatibility
        const progressObj: AssignmentProgress | null = minerProgress ? {
          id: `${assignment.id}_${miner.id}`,
          assignmentId: assignment.id,
          minerId: miner.id,
          videoId: assignment.videoId,
          watched: minerProgress.status === 'completed',
          completedAt: minerProgress.completedAt || undefined,
          progress: minerProgress.watchedDuration || 0,
          watchTime: minerProgress.totalDuration || 0,
          status: minerProgress.status === 'completed' ? 'completed' : 
                  isOverdue ? 'overdue' : 'in_progress',
        } : null;

        assignmentDetails.push({
          assignment,
          progress: progressObj,
        });
      });

      const totalAssignments = minerAssignments.length;
      const completionRate =
        totalAssignments > 0
          ? Math.round((completedCount / totalAssignments) * 100)
          : 0;

      summaries.push({
        miner,
        totalAssignments,
        completedCount,
        pendingCount,
        overdueCount,
        completionRate,
        assignments: assignmentDetails,
      });
    });

    return summaries;
  }, [miners, assignments, progressData]);

  // Filter summaries
  const filteredSummaries = useMemo(() => {
    return minerProgressSummaries.filter((summary) => {
      // Search filter
      if (
        searchQuery &&
        !summary.miner.name.toLowerCase().includes(searchQuery.toLowerCase())
      ) {
        return false;
      }

      // Status filter
      if (statusFilter === 'completed' && summary.completedCount === 0) {
        return false;
      }
      if (statusFilter === 'pending' && summary.pendingCount === 0) {
        return false;
      }
      if (statusFilter === 'overdue' && summary.overdueCount === 0) {
        return false;
      }

      return true;
    });
  }, [minerProgressSummaries, searchQuery, statusFilter]);

  const sendNotificationToMiner = async (minerId: string, minerName: string, pendingCount: number, overdueCount: number) => {
    setSendingNotification(minerId);
    
    try {
      if (!user?.id || !user?.name) {
        throw new Error('Supervisor information not found');
      }

      const message = overdueCount > 0
        ? `⚠️ Urgent: You have ${overdueCount} overdue and ${pendingCount - overdueCount} pending video training assignments. Please complete them immediately.`
        : `📚 You have ${pendingCount} pending video training assignments. Please complete them before your shift ends.`;

      await sendImmediateReminder(
        minerId,
        minerName,
        user.id,
        user.name,
        pendingCount,
        message
      );

      Alert.alert(
        '✅ Notification Sent',
        `Immediate reminder sent to ${minerName} about ${pendingCount} assignment${pendingCount > 1 ? 's' : ''}.`,
        [{ text: 'OK' }]
      );
    } catch (error) {
      console.error(' Error sending notification:', error);
      Alert.alert(
        ' Error',
        'Failed to send notification. Please try again.',
        [{ text: 'OK' }]
      );
    } finally {
      setSendingNotification(null);
    }
  };

  const sendBulkNotifications = async () => {
    const minersWithPending = filteredSummaries.filter((s) => s.pendingCount > 0);
    
    if (minersWithPending.length === 0) {
      Alert.alert('No Pending Assignments', 'All miners have completed their assignments!', [{ text: 'OK' }]);
      return;
    }

    Alert.alert(
      '📢 Send Bulk Reminders',
      `Send reminders to ${minersWithPending.length} miner${minersWithPending.length > 1 ? 's' : ''} with pending assignments?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: `Send to ${minersWithPending.length}`,
          onPress: async () => {
            try {
              let successCount = 0;
              for (const summary of minersWithPending) {
                try {
                  await sendNotificationToMiner(
                    summary.miner.id,
                    summary.miner.name,
                    summary.pendingCount,
                    summary.overdueCount
                  );
                  successCount++;
                  // Small delay to avoid overwhelming the system
                  await new Promise(resolve => setTimeout(resolve, 300));
                } catch (error) {
                  console.error(`Failed to send to ${summary.miner.name}:`, error);
                }
              }

              Alert.alert(
                ' Reminders Sent',
                `Successfully sent reminders to ${successCount} out of ${minersWithPending.length} miners.`,
                [{ text: 'OK' }]
              );
            } catch (error) {
              Alert.alert(' Error', 'Failed to send bulk reminders', [{ text: 'OK' }]);
            }
          },
        },
      ]
    );
  };

  const triggerDailyReminders = async () => {
    if (!user?.id) return;

    Alert.alert(
      '⏰ Trigger Daily Reminders',
      'Send daily reminders to all miners with pending assignments now? (Normally sent automatically 8 hours before shift)',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Send Now',
          onPress: async () => {
            try {
              const count = await checkAndSendDailyReminders(user.id);
              Alert.alert(
                ' Daily Reminders Sent',
                `Sent reminders to ${count} miner${count !== 1 ? 's' : ''}.`,
                [{ text: 'OK' }]
              );
            } catch (error) {
              Alert.alert(' Error', 'Failed to send daily reminders', [{ text: 'OK' }]);
            }
          },
        },
      ]
    );
  };

  const renderMinerCard = ({ item }: { item: MinerProgressSummary }) => {
    const hasOverdue = item.overdueCount > 0;

    return (
      <TouchableOpacity
        style={[styles.minerCard, hasOverdue && styles.minerCardOverdue]}
        onPress={() => setSelectedMiner(item)}
      >
        <View style={styles.minerHeader}>
          <View style={styles.minerInfo}>
            <Text style={styles.minerName}>{item.miner.name}</Text>
            <Text style={styles.minerMeta}>
              {item.miner.department || 'General'} • {item.miner.shift || 'Day Shift'}
            </Text>
          </View>
          {hasOverdue && (
            <View style={styles.overdueBadge}>
              <Text style={styles.overdueText}>{item.overdueCount} OVERDUE</Text>
            </View>
          )}
        </View>

        <View style={styles.progressSection}>
          <View style={styles.progressBarWrapper}>
            <View style={styles.progressBarBackground}>
              <View
                style={[
                  styles.progressBarFill,
                  {
                    width: `${item.completionRate}%`,
                    backgroundColor: hasOverdue ? COLORS.destructive : COLORS.accent,
                  },
                ]}
              />
            </View>
            <Text style={styles.progressText}>{item.completionRate}%</Text>
          </View>

          <View style={styles.statsRow}>
            <View style={[styles.statBox, styles.statBoxSuccess]}>
              <Text style={styles.statValue}>{item.completedCount}</Text>
              <Text style={styles.statLabel}>Completed</Text>
            </View>
            <View style={[styles.statBox, styles.statBoxWarning]}>
              <Text style={styles.statValue}>{item.pendingCount}</Text>
              <Text style={styles.statLabel}>Pending</Text>
            </View>
            <View style={[styles.statBox, styles.statBoxDanger]}>
              <Text style={styles.statValue}>{item.overdueCount}</Text>
              <Text style={styles.statLabel}>Overdue</Text>
            </View>
          </View>
        </View>

        {(hasOverdue || item.pendingCount > 0) && (
          <TouchableOpacity
            style={[
              styles.notifyButton,
              !hasOverdue && styles.notifyButtonSecondary
            ]}
            onPress={() => sendNotificationToMiner(item.miner.id, item.miner.name, item.pendingCount, item.overdueCount)}
            disabled={sendingNotification === item.miner.id}
          >
            {sendingNotification === item.miner.id ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <>
                <Text style={styles.notifyButtonText}>SEND REMINDER</Text>
                {hasOverdue && (
                  <Text style={styles.notifyButtonSubtext}>Urgent</Text>
                )}
              </>
            )}
          </TouchableOpacity>
        )}
      </TouchableOpacity>
    );
  };

  const renderAssignmentDetail = (item: { assignment: VideoAssignment; progress: AssignmentProgress | null }) => {
    const isCompleted = item.progress?.watched || false;
    
    // Safe deadline handling
    let deadlineDate: Date | null = null;
    if (item.assignment.deadline) {
      if (typeof item.assignment.deadline.toDate === 'function') {
        deadlineDate = item.assignment.deadline.toDate();
      } else if (typeof item.assignment.deadline === 'string') {
        deadlineDate = new Date(item.assignment.deadline);
      } else if (item.assignment.deadline instanceof Date) {
        deadlineDate = item.assignment.deadline;
      }
    }
    
    const isOverdue = !isCompleted && deadlineDate && deadlineDate < new Date();
    const progressValue = item.progress?.progress || 0;
    
    // Determine status badge with colors
    let statusBadge = { text: 'Pending', color: '#FFFFFF', bgColor: '#FFA726' };
    if (isCompleted) {
      statusBadge = { text: 'Completed', color: '#FFFFFF', bgColor: '#4CAF50' };
    } else if (isOverdue) {
      statusBadge = { text: 'Overdue', color: '#FFFFFF', bgColor: '#EF5350' };
    } else if (progressValue > 0 && progressValue < 100) {
      statusBadge = { text: 'Watching', color: '#FFFFFF', bgColor: '#42A5F5' };
    }

    return (
      <View style={[
        styles.assignmentDetailCard,
        isCompleted && styles.assignmentCompleted,
        isOverdue && styles.assignmentOverdue
      ]}>
        <View style={styles.assignmentHeaderRow}>
          <Text style={styles.assignmentTitle} numberOfLines={2}>{item.assignment.videoTopic}</Text>
          <View style={[styles.statusBadgeSmall, { backgroundColor: statusBadge.bgColor }]}>
            <Text style={[styles.statusBadgeTextSmall, { color: statusBadge.color }]}>
              {statusBadge.text}
            </Text>
          </View>
        </View>

        <View style={styles.assignmentMeta}>
          <Text style={styles.assignmentMetaText}>
            Deadline: {deadlineDate ? deadlineDate.toLocaleDateString() : 'No deadline set'}
          </Text>
          {isCompleted && item.progress?.completedAt && (
            <Text style={[styles.assignmentMetaText, styles.completedText]}>
              ✓ Completed on {typeof item.progress.completedAt.toDate === 'function' 
                ? item.progress.completedAt.toDate().toLocaleDateString() 
                : new Date(item.progress.completedAt).toLocaleDateString()}
            </Text>
          )}
          {isOverdue && (
            <Text style={[styles.assignmentMetaText, styles.overdueStatusText]}>
              ⚠ OVERDUE - Action Required
            </Text>
          )}
        </View>

        <View style={styles.progressBarWrapper}>
          <View style={styles.progressBarBackground}>
            <View
              style={[
                styles.progressBarFill,
                {
                  width: `${progressValue}%`,
                  backgroundColor: isCompleted ? COLORS.accent : isOverdue ? COLORS.destructive : COLORS.primary,
                },
              ]}
            />
          </View>
          <Text style={styles.progressText}>{progressValue}%</Text>
        </View>
      </View>
    );
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.primary} />
          <Text style={styles.loadingText}>Loading progress data...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <ArrowLeft size={isSmallScreen ? 20 : 24} color={COLORS.text} />
        </TouchableOpacity>
        <View style={styles.headerTitleContainer}>
          <Text style={styles.headerTitle}>Progress Tracker</Text>
          <Text style={styles.headerSubtitle}>Monitor Training Status</Text>
        </View>
      </View>

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <View style={styles.searchInputContainer}>
          <Text style={styles.searchIcon}>🔍</Text>
          <TextInput
            style={styles.searchInput}
            placeholder="Search miners by name..."
            placeholderTextColor={COLORS.textMuted}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>
        <TouchableOpacity style={styles.filterButton} onPress={() => setShowFilters(!showFilters)}>
          <Text style={styles.filterButtonText}>{showFilters ? '✕' : '≡'}</Text>
        </TouchableOpacity>
      </View>

      {/* Filters */}
      {showFilters && (
        <View style={styles.filtersContainer}>
          <Text style={styles.filtersTitle}>Filter by Status</Text>
          <View style={styles.filterButtons}>
            {[
              { label: 'All', value: 'all' },
              { label: 'Completed', value: 'completed' },
              { label: 'Pending', value: 'pending' },
              { label: 'Overdue', value: 'overdue' },
            ].map((option) => (
              <TouchableOpacity
                key={option.value}
                style={[
                  styles.filterChip,
                  statusFilter === option.value && styles.filterChipActive,
                ]}
                onPress={() => setStatusFilter(option.value as any)}
              >
                <Text
                  style={[
                    styles.filterChipText,
                    statusFilter === option.value && styles.filterChipTextActive,
                  ]}
                >
                  {option.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      )}

      {/* Bulk Actions */}
      {minerProgressSummaries.some((s) => s.pendingCount > 0) && (
        <View style={styles.bulkActionsContainer}>
          <TouchableOpacity style={styles.bulkNotifyButton} onPress={sendBulkNotifications}>
            <Bell size={24} color="#fff" style={styles.bulkNotifyIcon} />
            <View style={styles.bulkNotifyContent}>
              <Text style={styles.bulkNotifyButtonText}>SEND BULK REMINDERS</Text>
              <Text style={styles.bulkNotifySubtext}>
                {minerProgressSummaries.filter(s => s.pendingCount > 0).length} miners with pending tasks
              </Text>
            </View>
          </TouchableOpacity>
        </View>
      )}

      {/* Miner List */}
      <FlatList
        data={filteredSummaries}
        keyExtractor={(item) => item.miner.id}
        renderItem={renderMinerCard}
        contentContainerStyle={styles.listContainer}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyTitle}>No Miners Found</Text>
            <Text style={styles.emptySubtitle}>
              {searchQuery || statusFilter !== 'all' 
                ? 'Try adjusting your filters' 
                : 'No miners are assigned to you yet'}
            </Text>
          </View>
        }
      />

      {/* Miner Detail Modal */}
      {selectedMiner && (
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{selectedMiner.miner.name}</Text>
              <TouchableOpacity onPress={() => setSelectedMiner(null)} style={styles.closeButton}>
                <Text style={styles.closeButtonText}>✕</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.modalStats}>
              <Text style={styles.modalStatsText}>
                Completion Rate: {selectedMiner.completionRate}%
              </Text>
              <Text style={styles.modalStatsText}>
                {selectedMiner.completedCount} of {selectedMiner.totalAssignments} completed
              </Text>
            </View>

            <ScrollView style={styles.modalScroll}>
              {selectedMiner.assignments.map((item, index) => (
                <View key={index}>
                  {renderAssignmentDetail(item)}
                </View>
              ))}
            </ScrollView>

            <TouchableOpacity
              style={styles.modalCloseButton}
              onPress={() => setSelectedMiner(null)}
            >
              <Text style={styles.modalCloseButtonText}>Close</Text>
            </TouchableOpacity>
          </View>
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: COLORS.textMuted,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: isSmallScreen ? 12 : 16,
    paddingVertical: isSmallScreen ? 12 : 16,
    backgroundColor: COLORS.card,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 3,
      },
      android: {
        elevation: 3,
      },
    }),
  },
  backButton: {
    padding: 8,
    borderRadius: 8,
  },
  headerTitleContainer: {
    flex: 1,
    marginHorizontal: 12,
  },
  headerTitle: {
    fontSize: isSmallScreen ? 16 : 20,
    fontWeight: '700',
    color: COLORS.text,
  },
  headerSubtitle: {
    fontSize: isSmallScreen ? 11 : 12,
    color: COLORS.textMuted,
    marginTop: 2,
  },
  filterButton: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: isSmallScreen ? 12 : 16,
    paddingVertical: isSmallScreen ? 8 : 10,
    borderRadius: 10,
    minWidth: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  filterButtonText: {
    color: '#fff',
    fontSize: isSmallScreen ? 16 : 18,
    fontWeight: '600',
  },
  // Auto-Notification Banner
  autoNotifBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E8F5E9',
    marginHorizontal: 16,
    marginTop: 12,
    padding: 12,
    borderRadius: 12,
    borderLeftWidth: 4,
    borderLeftColor: COLORS.accent,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
      },
      android: {
        elevation: 1,
      },
    }),
  },
  autoNotifIcon: {
    fontSize: 24,
    marginRight: 12,
  },
  autoNotifContent: {
    flex: 1,
  },
  autoNotifTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#2E7D32',
    marginBottom: 2,
  },
  autoNotifText: {
    fontSize: 11,
    color: '#4CAF50',
  },
  triggerButton: {
    backgroundColor: COLORS.accent,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    marginLeft: 8,
  },
  triggerButtonText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '700',
  },
  // Stats Container
  statsContainer: {
    paddingHorizontal: 16,
    marginTop: 12,
    marginBottom: 8,
  },
  statsScrollContainer: {
    gap: 12,
    paddingRight: 16,
  },
  statCard: {
    minWidth: isSmallScreen ? 90 : 110,
    backgroundColor: COLORS.card,
    padding: isSmallScreen ? 12 : 16,
    borderRadius: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  statCardSuccess: {
    backgroundColor: '#E8F5E9',
    borderColor: '#4CAF50',
  },
  statCardWarning: {
    backgroundColor: '#FFF8E1',
    borderColor: '#FFC107',
  },
  statCardDanger: {
    backgroundColor: '#FFEBEE',
    borderColor: '#F44336',
  },
  statCardIcon: {
    fontSize: 24,
    marginBottom: 6,
  },
  statCardValue: {
    fontSize: isSmallScreen ? 22 : 26,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: 4,
  },
  statCardLabel: {
    fontSize: isSmallScreen ? 10 : 11,
    color: COLORS.textMuted,
    textAlign: 'center',
    fontWeight: '600',
  },
  searchContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 12,
    gap: 10,
  },
  searchInputContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.card,
    borderRadius: 12,
    paddingHorizontal: 14,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  searchIcon: {
    fontSize: 16,
    marginRight: 8,
    color: COLORS.textMuted,
  },
  searchInput: {
    flex: 1,
    padding: 14,
    fontSize: 15,
    color: COLORS.text,
  },
  filtersContainer: {
    paddingHorizontal: 16,
    paddingBottom: 12,
  },
  filtersTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 10,
  },
  filterButtons: {
    flexDirection: 'row',
    gap: 8,
    flexWrap: 'wrap',
  },
  filterChip: {
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.background,
  },
  filterChipActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  filterChipText: {
    fontSize: 14,
    color: COLORS.text,
    fontWeight: '600',
  },
  filterChipTextActive: {
    color: '#fff',
  },
  bulkActionsContainer: {
    paddingHorizontal: 16,
    paddingBottom: 12,
  },
  bulkNotifyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.primary,
    padding: 16,
    borderRadius: 14,
    ...Platform.select({
      ios: {
        shadowColor: COLORS.primary,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 6,
      },
      android: {
        elevation: 4,
      },
    }),
  },
  bulkNotifyIcon: {
    marginRight: 12,
  },
  bulkNotifyContent: {
    flex: 1,
  },
  bulkNotifyButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 2,
  },
  bulkNotifySubtext: {
    color: 'rgba(255,255,255,0.85)',
    fontSize: 12,
    fontWeight: '500',
  },
  listContainer: {
    padding: isSmallScreen ? 12 : 16,
  },
  minerCard: {
    backgroundColor: COLORS.card,
    borderRadius: 18,
    padding: isSmallScreen ? 14 : 18,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: COLORS.border,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.08,
        shadowRadius: 6,
      },
      android: {
        elevation: 3,
      },
    }),
  },
  minerCardOverdue: {
    borderColor: COLORS.destructive,
    borderWidth: 2,
    borderLeftWidth: 6,
    backgroundColor: '#FFF5F5',
  },
  minerHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 14,
    justifyContent: 'space-between',
  },
  minerInfo: {
    flex: 1,
  },
  minerName: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: 4,
  },
  minerMeta: {
    fontSize: 13,
    color: COLORS.textMuted,
  },
  overdueBadge: {
    backgroundColor: COLORS.destructive,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 10,
  },
  overdueText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  progressSection: {
    marginBottom: 14,
  },
  progressBarWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 14,
    gap: 10,
  },
  progressBarBackground: {
    flex: 1,
    height: 10,
    backgroundColor: COLORS.border,
    borderRadius: 5,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 5,
  },
  progressText: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.text,
    minWidth: 45,
    textAlign: 'right',
  },
  statsRow: {
    flexDirection: 'row',
    gap: 10,
  },
  statBox: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 6,
    borderRadius: 10,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  statBoxSuccess: {
    backgroundColor: '#4CAF50',
    borderColor: '#2E7D32',
  },
  statBoxWarning: {
    backgroundColor: '#FFA726',
    borderColor: '#F57C00',
  },
  statBoxDanger: {
    backgroundColor: '#EF5350',
    borderColor: '#C62828',
  },
  statValue: {
    fontSize: 18,
    fontWeight: '800',
    color: '#FFFFFF',
    marginBottom: 2,
  },
  statLabel: {
    fontSize: 10,
    color: '#FFFFFF',
    fontWeight: '700',
    textTransform: 'uppercase',
    textAlign: 'center',
  },
  notifyButton: {
    backgroundColor: '#FF6B35',
    padding: isSmallScreen ? 12 : 14,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 8,
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
    ...Platform.select({
      ios: {
        shadowColor: '#FF6B35',
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.4,
        shadowRadius: 5,
      },
      android: {
        elevation: 4,
      },
    }),
  },
  notifyButtonSecondary: {
    backgroundColor: '#4A90E2',
  },
  notifyButtonText: {
    color: '#fff',
    fontSize: isSmallScreen ? 13 : 15,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  notifyButtonSubtext: {
    color: 'rgba(255,255,255,0.9)',
    fontSize: 10,
    fontWeight: '600',
    textTransform: 'uppercase',
    position: 'absolute',
    right: 12,
    top: 4,
    backgroundColor: 'rgba(0,0,0,0.2)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
    paddingHorizontal: 20,
  },
  emptyIcon: {
    fontSize: 64,
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 15,
    color: COLORS.textMuted,
    textAlign: 'center',
  },
  emptyText: {
    fontSize: 16,
    color: COLORS.textMuted,
    marginTop: 16,
  },
  // Modal Styles
  modalOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  modalContent: {
    backgroundColor: COLORS.card,
    borderRadius: 20,
    padding: 20,
    width: '100%',
    maxWidth: 500,
    maxHeight: '85%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 18,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: COLORS.text,
    flex: 1,
  },
  closeButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: COLORS.background,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 12,
  },
  closeButtonText: {
    fontSize: 20,
    color: COLORS.textMuted,
    fontWeight: '600',
  },
  modalStats: {
    backgroundColor: COLORS.background,
    padding: 16,
    borderRadius: 12,
    marginBottom: 18,
  },
  modalStatsText: {
    fontSize: 15,
    color: COLORS.text,
    marginBottom: 6,
    fontWeight: '500',
  },
  modalScroll: {
    maxHeight: 400,
  },
  assignmentDetailCard: {
    backgroundColor: COLORS.background,
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  assignmentCompleted: {
    borderLeftWidth: 4,
    borderLeftColor: COLORS.accent,
  },
  assignmentOverdue: {
    borderLeftWidth: 4,
    borderLeftColor: COLORS.destructive,
  },
  assignmentHeaderRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: 10,
    gap: 8,
  },
  assignmentTitle: {
    flex: 1,
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.text,
  },
  statusBadgeSmall: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 10,
    minWidth: 90,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.1)',
  },
  statusBadgeTextSmall: {
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 0.4,
  },
  assignmentMeta: {
    marginBottom: 10,
  },
  assignmentMetaText: {
    fontSize: 13,
    color: COLORS.textMuted,
    marginBottom: 4,
  },
  completedText: {
    color: COLORS.accent,
    fontWeight: '600',
  },
  overdueStatusText: {
    color: COLORS.destructive,
    fontWeight: '700',
  },
  modalCloseButton: {
    backgroundColor: COLORS.primary,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 18,
  },
  modalCloseButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
});
