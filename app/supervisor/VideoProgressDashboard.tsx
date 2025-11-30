import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import React, { useEffect, useState, useMemo } from 'react';
import {
  Alert,
  FlatList,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  ArrowLeft,
  User,
  Video as VideoIcon,
  CheckCircle,
  Clock,
  AlertTriangle,
  BarChart3,
  Filter,
  Search,
} from '@/components/Icons';
import { COLORS } from '@/constants/styles';

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

interface AssignmentProgress {
  assignmentId: string;
  minerId: string;
  watched: boolean;
  watchedAt?: number;
  progress: number;
}

interface Miner {
  id: string;
  name: string;
  shift: string;
  location: string;
}

const mockMiners: Miner[] = [
  { id: '1', name: 'Rajesh Kumar', shift: 'Morning', location: 'Section A' },
  { id: '2', name: 'Amit Singh', shift: 'Morning', location: 'Section B' },
  { id: '3', name: 'Suresh Patel', shift: 'Afternoon', location: 'Section A' },
  { id: '4', name: 'Vikram Rao', shift: 'Afternoon', location: 'Section C' },
  { id: '5', name: 'Karan Mehta', shift: 'Night', location: 'Section B' },
];

export default function VideoProgressDashboard() {
  const router = useRouter();
  const [assignments, setAssignments] = useState<VideoAssignment[]>([]);
  const [assignmentProgress, setAssignmentProgress] = useState<AssignmentProgress[]>([]);
  const [loading, setLoading] = useState(true);

  // Filter states
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'overdue' | 'completed' | 'in-progress'>('all');
  const [shiftFilter, setShiftFilter] = useState<'all' | 'Morning' | 'Afternoon' | 'Night'>('all');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      // Load assignments
      const storedAssignments = await AsyncStorage.getItem('videoAssignments');
      if (storedAssignments) {
        setAssignments(JSON.parse(storedAssignments));
      }

      // Load progress
      const storedProgress = await AsyncStorage.getItem('assignmentProgress');
      if (storedProgress) {
        setAssignmentProgress(JSON.parse(storedProgress));
      }
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getMinerProgress = (minerId: string) => {
    const minerAssignments = assignments.filter(assignment =>
      assignment.assignedTo.includes(minerId)
    );

    const completedAssignments = minerAssignments.filter(assignment => {
      const progress = assignmentProgress.find(p =>
        p.assignmentId === assignment.id && p.minerId === minerId
      );
      return progress?.watched;
    });

    const overdueAssignments = minerAssignments.filter(assignment => {
      const progress = assignmentProgress.find(p =>
        p.assignmentId === assignment.id && p.minerId === minerId
      );
      return !progress?.watched && assignment.deadline < Date.now();
    });

    return {
      total: minerAssignments.length,
      completed: completedAssignments.length,
      overdue: overdueAssignments.length,
      percentage: minerAssignments.length > 0
        ? Math.round((completedAssignments.length / minerAssignments.length) * 100)
        : 0,
    };
  };

  const getOverallStats = () => {
    const allAssignments = assignments.filter(a => a.isMandatory);
    const totalAssignments = allAssignments.reduce((sum, a) => sum + a.assignedTo.length, 0);

    const completedProgress = assignmentProgress.filter(p => {
      const assignment = assignments.find(a => a.id === p.assignmentId);
      return assignment?.isMandatory && p.watched;
    }).length;

    const overdueAssignments = allAssignments.filter(a => a.deadline < Date.now());
    const overdueCount = overdueAssignments.reduce((sum, a) => {
      const incomplete = a.assignedTo.filter(minerId => {
        const progress = assignmentProgress.find(p =>
          p.assignmentId === a.id && p.minerId === minerId
        );
        return !progress?.watched;
      });
      return sum + incomplete.length;
    }, 0);

    return {
      totalAssignments,
      completedAssignments: completedProgress,
      overdueCount,
      completionRate: totalAssignments > 0 ? Math.round((completedProgress / totalAssignments) * 100) : 0,
    };
  };

  const filteredMiners = useMemo(() => {
    return mockMiners.filter(miner => {
      // Search filter
      if (searchQuery && !miner.name.toLowerCase().includes(searchQuery.toLowerCase())) {
        return false;
      }

      // Shift filter
      if (shiftFilter !== 'all' && miner.shift !== shiftFilter) {
        return false;
      }

      // Status filter
      if (statusFilter !== 'all') {
        const progress = getMinerProgress(miner.id);
        switch (statusFilter) {
          case 'completed':
            return progress.percentage === 100;
          case 'overdue':
            return progress.overdue > 0;
          case 'in-progress':
            return progress.percentage > 0 && progress.percentage < 100;
          default:
            return true;
        }
      }

      return true;
    });
  }, [searchQuery, shiftFilter, statusFilter, assignments, assignmentProgress]);

  const stats = getOverallStats();

  const renderMinerItem = ({ item }: { item: Miner }) => {
    const progress = getMinerProgress(item.id);
    const hasOverdue = progress.overdue > 0;

    return (
      <View style={styles.minerCard}>
        <View style={styles.minerHeader}>
          <View style={styles.minerInfo}>
            <View style={styles.minerNameRow}>
              <User size={20} color={COLORS.primary} />
              <Text style={styles.minerName}>{item.name}</Text>
            </View>
            <Text style={styles.minerDetails}>
              {item.shift} Shift • {item.location}
            </Text>
          </View>
          <View style={styles.minerStats}>
            <Text style={styles.progressText}>
              {progress.completed}/{progress.total} completed
            </Text>
            <Text style={styles.percentageText}>
              {progress.percentage}%
            </Text>
            {hasOverdue && <AlertTriangle size={16} color={COLORS.destructive} />}
          </View>
        </View>

        <View style={styles.progressBar}>
          <View
            style={[
              styles.progressFill,
              { width: `${progress.percentage}%` },
              progress.percentage === 100 ? styles.progressComplete : null,
              hasOverdue ? styles.progressOverdue : null,
            ]}
          />
        </View>

        {hasOverdue && (
          <Text style={styles.overdueText}>
            {progress.overdue} overdue assignment{progress.overdue !== 1 ? 's' : ''}
          </Text>
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
        <Text style={styles.headerTitle}>Video Progress Dashboard</Text>
        <TouchableOpacity style={styles.statsButton}>
          <BarChart3 size={20} color={COLORS.primary} />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content}>
        {/* Overall Stats */}
        <View style={styles.statsSection}>
          <Text style={styles.sectionTitle}>Overall Progress</Text>
          <View style={styles.statsGrid}>
            <View style={styles.statCard}>
              <Text style={styles.statValue}>{stats.totalAssignments}</Text>
              <Text style={styles.statLabel}>Total Assignments</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statValue}>{stats.completedAssignments}</Text>
              <Text style={styles.statLabel}>Completed</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={[styles.statValue, { color: COLORS.destructive }]}>
                {stats.overdueCount}
              </Text>
              <Text style={styles.statLabel}>Overdue</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statValue}>{stats.completionRate}%</Text>
              <Text style={styles.statLabel}>Completion Rate</Text>
            </View>
          </View>
        </View>

        {/* Filters */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Miner Progress</Text>

          <View style={styles.filtersContainer}>
            <View style={styles.searchContainer}>
              <Search size={16} color={COLORS.textMuted} />
              <Text style={styles.searchInput}>
                {searchQuery || 'Search miners...'}
              </Text>
            </View>

            <View style={styles.filterRow}>
              <Text style={styles.filterLabel}>Status:</Text>
              <View style={styles.filterButtons}>
                {[
                  { label: 'All', value: 'all' },
                  { label: 'In Progress', value: 'in-progress' },
                  { label: 'Completed', value: 'completed' },
                  { label: 'Overdue', value: 'overdue' },
                ].map((filter) => (
                  <TouchableOpacity
                    key={filter.value}
                    style={[
                      styles.filterButton,
                      statusFilter === filter.value && styles.filterButtonActive,
                    ]}
                    onPress={() => setStatusFilter(filter.value as any)}
                  >
                    <Text
                      style={[
                        styles.filterButtonText,
                        statusFilter === filter.value && styles.filterButtonTextActive,
                      ]}
                    >
                      {filter.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <View style={styles.filterRow}>
              <Text style={styles.filterLabel}>Shift:</Text>
              <View style={styles.filterButtons}>
                {[
                  { label: 'All', value: 'all' },
                  { label: 'Morning', value: 'Morning' },
                  { label: 'Afternoon', value: 'Afternoon' },
                  { label: 'Night', value: 'Night' },
                ].map((filter) => (
                  <TouchableOpacity
                    key={filter.value}
                    style={[
                      styles.filterButton,
                      shiftFilter === filter.value && styles.filterButtonActive,
                    ]}
                    onPress={() => setShiftFilter(filter.value as any)}
                  >
                    <Text
                      style={[
                        styles.filterButtonText,
                        shiftFilter === filter.value && styles.filterButtonTextActive,
                      ]}
                    >
                      {filter.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          </View>

          {filteredMiners.length === 0 ? (
            <View style={styles.emptyContainer}>
              <User size={48} color={COLORS.textMuted} />
              <Text style={styles.emptyTitle}>No miners found</Text>
              <Text style={styles.emptyText}>
                Try adjusting your filters or search criteria
              </Text>
            </View>
          ) : (
            <FlatList
              data={filteredMiners}
              renderItem={renderMinerItem}
              keyExtractor={(item) => item.id}
              showsVerticalScrollIndicator={false}
              scrollEnabled={false}
            />
          )}
        </View>
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
  statsButton: {
    padding: 8,
  },
  content: {
    flex: 1,
    padding: 20,
  },
  statsSection: {
    marginBottom: 24,
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
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  statCard: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: COLORS.card,
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: COLORS.primary,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: COLORS.textMuted,
    textAlign: 'center',
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
    paddingVertical: 12,
    marginBottom: 12,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: COLORS.text,
  },
  filterRow: {
    marginBottom: 12,
  },
  filterLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 8,
  },
  filterButtons: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  filterButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: COLORS.card,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  filterButtonActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  filterButtonText: {
    fontSize: 14,
    color: COLORS.text,
  },
  filterButtonTextActive: {
    color: '#FFFFFF',
  },
  minerCard: {
    backgroundColor: COLORS.card,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  minerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  minerInfo: {
    flex: 1,
  },
  minerNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  minerName: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text,
    marginLeft: 8,
  },
  minerDetails: {
    fontSize: 14,
    color: COLORS.textMuted,
  },
  minerStats: {
    alignItems: 'flex-end',
  },
  progressText: {
    fontSize: 12,
    color: COLORS.textMuted,
    marginBottom: 2,
  },
  percentageText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.primary,
  },
  progressBar: {
    height: 6,
    backgroundColor: COLORS.border,
    borderRadius: 3,
    overflow: 'hidden',
    marginBottom: 8,
  },
  progressFill: {
    height: '100%',
    backgroundColor: COLORS.primary,
    borderRadius: 3,
  },
  progressComplete: {
    backgroundColor: COLORS.accent,
  },
  progressOverdue: {
    backgroundColor: COLORS.destructive,
  },
  overdueText: {
    fontSize: 12,
    color: COLORS.destructive,
    fontWeight: '500',
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
});
