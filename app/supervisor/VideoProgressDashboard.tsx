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
import { ArrowLeft, AlertTriangle } from '@/components/Icons';
import { COLORS } from '@/constants/styles';
import { collection, query, where, getDocs, addDoc, Timestamp } from 'firebase/firestore';
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
  }, []);

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

      // Load ALL active assignments (we'll filter by miner IDs)
      const assignmentsRef = collection(db, 'videoAssignments');
      const assignmentsQuery = query(
        assignmentsRef,
        where('status', '==', 'active')
      );
      const assignmentsSnapshot = await getDocs(assignmentsQuery);
      
      const allAssignments: VideoAssignment[] = [];
      assignmentsSnapshot.forEach((doc) => {
        allAssignments.push({
          id: doc.id,
          ...doc.data(),
        } as VideoAssignment);
      });

      // Filter assignments to only those that include our miners
      const relevantAssignments = allAssignments.filter(assignment => 
        assignment.assignedTo && assignment.assignedTo.some(minerId => minerIds.includes(minerId))
      );
      
      setAssignments(relevantAssignments);

      // Load progress data for all miners
      const progressRef = collection(db, 'assignmentProgress');
      const progressSnapshot = await getDocs(progressRef);
      
      const allProgress: AssignmentProgress[] = [];
      progressSnapshot.forEach((doc) => {
        allProgress.push({
          id: doc.id,
          ...doc.data(),
        } as AssignmentProgress);
      });

      // Filter progress to only our miners
      const relevantProgress = allProgress.filter(progress => minerIds.includes(progress.minerId));
      setProgressData(relevantProgress);

      console.log(`✅ Loaded ${loadedMiners.length} miners, ${relevantAssignments.length} assignments, ${relevantProgress.length} progress records`);
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
        const progress = progressData.find(
          (p) => p.assignmentId === assignment.id && p.minerId === miner.id
        );

        const isOverdue = assignment.deadline.toDate() < new Date();

        if (progress && progress.watched) {
          completedCount++;
        } else if (isOverdue) {
          overdueCount++;
        } else {
          pendingCount++;
        }

        assignmentDetails.push({
          assignment,
          progress: progress || null,
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
      console.error('❌ Error sending notification:', error);
      Alert.alert(
        '❌ Error',
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
      Alert.alert('ℹ️ No Pending Assignments', 'All miners have completed their assignments!', [{ text: 'OK' }]);
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
                '✅ Reminders Sent',
                `Successfully sent reminders to ${successCount} out of ${minersWithPending.length} miners.`,
                [{ text: 'OK' }]
              );
            } catch (error) {
              Alert.alert('❌ Error', 'Failed to send bulk reminders', [{ text: 'OK' }]);
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
                '✅ Daily Reminders Sent',
                `Sent reminders to ${count} miner${count !== 1 ? 's' : ''}.`,
                [{ text: 'OK' }]
              );
            } catch (error) {
              Alert.alert('❌ Error', 'Failed to send daily reminders', [{ text: 'OK' }]);
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
              <Text style={styles.overdueText}>⚠ {item.overdueCount} OVERDUE</Text>
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
                <Text style={styles.notifyButtonText}>📨 SEND REMINDER</Text>
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
    const isOverdue = !isCompleted && item.assignment.deadline.toDate() < new Date();
    const progressValue = item.progress?.progress || 0;
    
    // Determine status badge with emoji and colors
    let statusBadge = { text: '⏳ Pending', color: COLORS.textMuted, bgColor: '#e5e7eb' };
    if (isCompleted) {
      statusBadge = { text: '✅ Completed', color: '#10b981', bgColor: '#d1fae5' };
    } else if (isOverdue) {
      statusBadge = { text: '⚠️ Overdue', color: COLORS.destructive, bgColor: '#fee2e2' };
    } else if (progressValue > 0 && progressValue < 100) {
      statusBadge = { text: '▶️ Watching', color: '#3b82f6', bgColor: '#dbeafe' };
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
            📅 Deadline: {item.assignment.deadline.toDate().toLocaleDateString()}
          </Text>
          {isCompleted && item.progress?.completedAt && (
            <Text style={[styles.assignmentMetaText, styles.completedText]}>
              ✓ Completed on {item.progress.completedAt.toDate().toLocaleDateString()}
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
        <TouchableOpacity onPress={() => setShowFilters(!showFilters)} style={styles.filterButton}>
          <Text style={styles.filterButtonText}>{showFilters ? '✕' : '⚙️'}</Text>
        </TouchableOpacity>
      </View>

      {/* Auto-Notification Status Banner */}
      {autoNotificationsEnabled && (
        <View style={styles.autoNotifBanner}>
          <Text style={styles.autoNotifIcon}>🔔</Text>
          <View style={styles.autoNotifContent}>
            <Text style={styles.autoNotifTitle}>Auto-Reminders Active</Text>
            <Text style={styles.autoNotifText}>Notifications sent 8hrs before shift daily</Text>
          </View>
          <TouchableOpacity onPress={triggerDailyReminders} style={styles.triggerButton}>
            <Text style={styles.triggerButtonText}>Send Now</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Overall Stats */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.statsScrollContainer}
        style={styles.statsContainer}
      >
        <View style={styles.statCard}>
          <Text style={styles.statCardIcon}>👥</Text>
          <Text style={styles.statCardValue}>{miners.length}</Text>
          <Text style={styles.statCardLabel}>Miners</Text>
        </View>
        <View style={[styles.statCard, styles.statCardSuccess]}>
          <Text style={styles.statCardIcon}>✅</Text>
          <Text style={styles.statCardValue}>
            {minerProgressSummaries.reduce((sum, s) => sum + s.completedCount, 0)}
          </Text>
          <Text style={styles.statCardLabel}>Completed</Text>
        </View>
        <View style={[styles.statCard, styles.statCardWarning]}>
          <Text style={styles.statCardIcon}>⏳</Text>
          <Text style={styles.statCardValue}>
            {minerProgressSummaries.reduce((sum, s) => sum + s.pendingCount, 0)}
          </Text>
          <Text style={styles.statCardLabel}>Pending</Text>
        </View>
        <View style={[styles.statCard, styles.statCardDanger]}>
          <Text style={styles.statCardIcon}>⚠️</Text>
          <Text style={styles.statCardValue}>
            {minerProgressSummaries.reduce((sum, s) => sum + s.overdueCount, 0)}
          </Text>
          <Text style={styles.statCardLabel}>Overdue</Text>
        </View>
      </ScrollView>

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <TextInput
          style={styles.searchInput}
          placeholder="Search miners..."
          placeholderTextColor={COLORS.textMuted}
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
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
            <Text style={styles.bulkNotifyIcon}>📢</Text>
            <View style={styles.bulkNotifyContent}>
              <Text style={styles.bulkNotifyButtonText}>Send Bulk Reminders</Text>
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
            <Text style={styles.emptyIcon}>👥</Text>
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
    paddingHorizontal: 16,
    paddingBottom: 12,
  },
  searchInput: {
    backgroundColor: COLORS.card,
    borderRadius: 12,
    padding: 14,
    fontSize: 15,
    color: COLORS.text,
    borderWidth: 1,
    borderColor: COLORS.border,
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
    fontSize: 28,
    marginRight: 14,
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
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  overdueText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '700',
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
    padding: 10,
    borderRadius: 10,
    alignItems: 'center',
  },
  statBoxSuccess: {
    backgroundColor: '#E6F7ED',
  },
  statBoxWarning: {
    backgroundColor: '#FFF4E6',
  },
  statBoxDanger: {
    backgroundColor: '#FFE6E6',
  },
  statValue: {
    fontSize: 20,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: 2,
  },
  statLabel: {
    fontSize: 11,
    color: COLORS.textMuted,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  notifyButton: {
    backgroundColor: COLORS.destructive,
    padding: isSmallScreen ? 12 : 14,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 8,
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
    ...Platform.select({
      ios: {
        shadowColor: COLORS.destructive,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.3,
        shadowRadius: 4,
      },
      android: {
        elevation: 3,
      },
    }),
  },
  notifyButtonSecondary: {
    backgroundColor: COLORS.primary,
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
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 10,
    minWidth: 90,
    alignItems: 'center',
  },
  statusBadgeTextSmall: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.3,
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
