import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    RefreshControl,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ArrowLeft, CheckCircle, Clock, XCircle } from '../../components/Icons';
import { COLORS } from '../../constants/styles';
import { useRoleStore } from '../../hooks/useRoleStore';
import { getTeamTaskStatus } from '../../services/supervisorEnhancements';

interface MinerTask {
  id: string;
  minerId: string;
  minerName: string;
  status: 'completed' | 'in_progress' | 'not_started' | 'absent';
  tasksAssigned: number;
  tasksCompleted: number;
  lastUpdate: string;
}

export default function TeamTaskStatus() {
  const router = useRouter();
  const { user } = useRoleStore();
  const [miners, setMiners] = useState<MinerTask[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState<'all' | 'completed' | 'in_progress' | 'not_started' | 'absent'>('all');

  // Mock data
  const mockMiners: MinerTask[] = [
    {
      id: '1',
      minerId: 'M001',
      minerName: 'Rajesh Kumar',
      status: 'completed',
      tasksAssigned: 5,
      tasksCompleted: 5,
      lastUpdate: '10 mins ago',
    },
    {
      id: '2',
      minerId: 'M002',
      minerName: 'Amit Sharma',
      status: 'in_progress',
      tasksAssigned: 4,
      tasksCompleted: 2,
      lastUpdate: '30 mins ago',
    },
    {
      id: '3',
      minerId: 'M003',
      minerName: 'Vikram Singh',
      status: 'completed',
      tasksAssigned: 6,
      tasksCompleted: 6,
      lastUpdate: '1 hour ago',
    },
    {
      id: '4',
      minerId: 'M004',
      minerName: 'Suresh Patel',
      status: 'not_started',
      tasksAssigned: 3,
      tasksCompleted: 0,
      lastUpdate: '2 hours ago',
    },
    {
      id: '5',
      minerId: 'M005',
      minerName: 'Dinesh Kumar',
      status: 'absent',
      tasksAssigned: 4,
      tasksCompleted: 0,
      lastUpdate: 'Today',
    },
  ];

  useEffect(() => {
    loadMiners();
  }, []);

  const loadMiners = async () => {
    setLoading(true);
    try {
      if (!user?.id) {
        console.error('Supervisor ID not found');
        setMiners([]);
        return;
      }

      // Load miners assigned to this supervisor from Firestore
      const { getMinersBySupervisor } = await import('@/services/minerService');
      const assignedMiners = await getMinersBySupervisor(user.id);

      // Transform to MinerTask format
      const minerTasks: MinerTask[] = assignedMiners.map((miner, index) => ({
        id: miner.id,
        minerId: miner.id,
        minerName: miner.name || 'Unknown',
        status: (miner.status as any) || 'not_started',
        tasksAssigned: 0, // Would need to fetch from assignments
        tasksCompleted: 0, // Would need to fetch from progress
        lastUpdate: 'Today',
      }));

      setMiners(minerTasks);
      console.log(`✅ Loaded ${minerTasks.length} miners for supervisor ${user.id}`);
    } catch (error) {
      console.error('Error loading team task status:', error);
      setMiners([]);
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadMiners();
    setRefreshing(false);
  };

  const filteredMiners = miners.filter(miner =>
    filter === 'all' ? true : miner.status === filter
  );

  const totalAssigned = miners.reduce((sum, m) => sum + m.tasksAssigned, 0);
  const totalCompleted = miners.reduce((sum, m) => sum + m.tasksCompleted, 0);
  const inProgress = miners.filter(m => m.status === 'in_progress').length;
  const notStarted = miners.filter(m => m.status === 'not_started').length;

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return '#10B981';
      case 'in_progress':
        return '#F59E0B';
      case 'not_started':
        return '#EF4444';
      case 'absent':
        return '#6B7280';
      default:
        return COLORS.textMuted;
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle size={24} color="#10B981" />;
      case 'in_progress':
        return <Clock size={24} color="#F59E0B" />;
      case 'not_started':
        return <XCircle size={24} color="#EF4444" />;
      case 'absent':
        return <XCircle size={24} color="#6B7280" />;
      default:
        return null;
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'completed':
        return 'Completed';
      case 'in_progress':
        return 'In Progress';
      case 'not_started':
        return 'Not Started';
      case 'absent':
        return 'Absent';
      default:
        return status;
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.primary} />
          <Text style={styles.loadingText}>Loading team task status...</Text>
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
        <Text style={styles.headerTitle}>Team Task Status</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView
        style={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* Overview Stats */}
        <View style={styles.statsContainer}>
          <View style={styles.statCard}>
            <Text style={[styles.statValue, { color: COLORS.primary }]}>
              {totalCompleted}/{totalAssigned}
            </Text>
            <Text style={styles.statLabel}>Total Completed</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={[styles.statValue, { color: '#F59E0B' }]}>{inProgress}</Text>
            <Text style={styles.statLabel}>In Progress</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={[styles.statValue, { color: '#EF4444' }]}>{notStarted}</Text>
            <Text style={styles.statLabel}>Not Started</Text>
          </View>
        </View>

        {/* Filter Tabs */}
        <View style={styles.filterContainer}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {(['all', 'completed', 'in_progress', 'not_started', 'absent'] as const).map((filterOption) => (
              <TouchableOpacity
                key={filterOption}
                style={[
                  styles.filterTab,
                  filter === filterOption && styles.filterTabActive,
                ]}
                onPress={() => setFilter(filterOption)}
              >
                <Text
                  style={[
                    styles.filterText,
                    filter === filterOption && styles.filterTextActive,
                  ]}
                >
                  {filterOption === 'all' ? 'All' : getStatusText(filterOption)}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* Miners List */}
        <View style={styles.minersList}>
          {filteredMiners.length === 0 ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyText}>No miners found</Text>
            </View>
          ) : (
            filteredMiners.map((miner) => (
              <TouchableOpacity
                key={miner.id}
                style={styles.minerCard}
                onPress={() => {
                  // View miner task details (removed TaskAssignment as it was deleted)
                  console.log('View tasks for:', miner.minerName);
                }}
              >
                <View style={styles.minerHeader}>
                  <View style={styles.minerHeaderLeft}>
                    {getStatusIcon(miner.status)}
                    <View style={styles.minerInfo}>
                      <Text style={styles.minerName}>{miner.minerName}</Text>
                      <Text style={styles.minerId}>{miner.minerId}</Text>
                    </View>
                  </View>
                  <View
                    style={[
                      styles.statusBadge,
                      { backgroundColor: getStatusColor(miner.status) + '20' },
                    ]}
                  >
                    <Text style={[styles.statusText, { color: getStatusColor(miner.status) }]}>
                      {getStatusText(miner.status).toUpperCase()}
                    </Text>
                  </View>
                </View>

                <View style={styles.progressContainer}>
                  <View style={styles.progressBar}>
                    <View
                      style={[
                        styles.progressFill,
                        {
                          width: `${miner.tasksAssigned > 0 ? (miner.tasksCompleted / miner.tasksAssigned) * 100 : 0}%`,
                          backgroundColor: getStatusColor(miner.status),
                        },
                      ]}
                    />
                  </View>
                  <Text style={styles.progressText}>
                    {miner.tasksCompleted}/{miner.tasksAssigned} Tasks
                  </Text>
                </View>

                <Text style={styles.lastUpdate}>Last updated: {miner.lastUpdate}</Text>
              </TouchableOpacity>
            ))
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
    padding: 16,
    backgroundColor: COLORS.card,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  backButton: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.text,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: COLORS.textMuted,
  },
  content: {
    flex: 1,
  },
  statsContainer: {
    flexDirection: 'row',
    padding: 16,
    gap: 12,
  },
  statCard: {
    flex: 1,
    backgroundColor: COLORS.card,
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: COLORS.textMuted,
    textAlign: 'center',
  },
  filterContainer: {
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  filterTab: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    backgroundColor: COLORS.card,
    marginRight: 8,
  },
  filterTabActive: {
    backgroundColor: COLORS.primary,
  },
  filterText: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.textMuted,
  },
  filterTextActive: {
    color: '#FFFFFF',
  },
  minersList: {
    padding: 16,
    paddingTop: 0,
  },
  minerCard: {
    backgroundColor: COLORS.card,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  minerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  minerHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  minerInfo: {
    gap: 4,
  },
  minerName: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text,
  },
  minerId: {
    fontSize: 12,
    color: COLORS.textMuted,
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 11,
    fontWeight: 'bold',
  },
  progressContainer: {
    marginBottom: 8,
  },
  progressBar: {
    height: 8,
    backgroundColor: COLORS.border,
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 8,
  },
  progressFill: {
    height: '100%',
    borderRadius: 4,
  },
  progressText: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.text,
  },
  lastUpdate: {
    fontSize: 12,
    color: COLORS.textMuted,
  },
  emptyState: {
    padding: 32,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 16,
    color: COLORS.textMuted,
  },
});
