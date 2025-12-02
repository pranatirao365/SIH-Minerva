import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { ArrowLeft, CheckCircle, Clock, User, Calendar, TrendingUp } from '../../components/Icons';
import { COLORS } from '../../constants/styles';
import { getTeamTaskStatus } from '../../services/supervisorEnhancements';

interface MinerTaskStatus {
  minerId: string;
  minerName: string;
  totalTasks: number;
  completedTasks: number;
  pendingTasks: number;
  completionRate: number;
  location: string;
  shift: string;
}

export default function TeamTaskStatus() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState<'all' | 'high' | 'medium' | 'low'>('all');

  // Mock data
  const [teamStatus] = useState<MinerTaskStatus[]>([
    {
      minerId: 'M001',
      minerName: 'Rajesh Kumar',
      totalTasks: 10,
      completedTasks: 9,
      pendingTasks: 1,
      completionRate: 90,
      location: 'Section A',
      shift: 'Morning',
    },
    {
      minerId: 'M002',
      minerName: 'Amit Sharma',
      totalTasks: 8,
      completedTasks: 6,
      pendingTasks: 2,
      completionRate: 75,
      location: 'Section B',
      shift: 'Afternoon',
    },
    {
      minerId: 'M003',
      minerName: 'Vikram Singh',
      totalTasks: 12,
      completedTasks: 12,
      pendingTasks: 0,
      completionRate: 100,
      location: 'Section A',
      shift: 'Morning',
    },
    {
      minerId: 'M004',
      minerName: 'Suresh Patel',
      totalTasks: 10,
      completedTasks: 5,
      pendingTasks: 5,
      completionRate: 50,
      location: 'Section C',
      shift: 'Night',
    },
    {
      minerId: 'M005',
      minerName: 'Karan Mehta',
      totalTasks: 9,
      completedTasks: 7,
      pendingTasks: 2,
      completionRate: 78,
      location: 'Section B',
      shift: 'Afternoon',
    },
  ]);

  useEffect(() => {
    loadTeamStatus();
  }, []);

  const loadTeamStatus = async () => {
    setLoading(true);
    try {
      // Using mock data from state - replace with actual service call when ready
      console.log('Team status loaded:', teamStatus.length, 'miners');
    } catch (error) {
      console.error('Error loading team task status:', error);
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadTeamStatus();
    setRefreshing(false);
  };

  const getCompletionColor = (rate: number) => {
    if (rate >= 90) return '#10B981';
    if (rate >= 75) return '#06B6D4';
    if (rate >= 50) return '#F59E0B';
    return '#EF4444';
  };

  const filteredTeam = teamStatus.filter(member => {
    if (filter === 'all') return true;
    if (filter === 'high') return member.completionRate >= 90;
    if (filter === 'medium') return member.completionRate >= 50 && member.completionRate < 90;
    if (filter === 'low') return member.completionRate < 50;
    return true;
  });

  const avgCompletionRate = Math.round(
    teamStatus.reduce((sum, m) => sum + m.completionRate, 0) / teamStatus.length
  );

  const totalCompleted = teamStatus.reduce((sum, m) => sum + m.completedTasks, 0);
  const totalTasks = teamStatus.reduce((sum, m) => sum + m.totalTasks, 0);

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <ArrowLeft size={24} color={COLORS.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Team Task Status</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView
        style={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={COLORS.primary} />
        }
      >
        {/* Overview Stats */}
        <View style={styles.statsContainer}>
          <View style={styles.statCard}>
            <TrendingUp size={24} color={COLORS.primary} />
            <Text style={styles.statValue}>{avgCompletionRate}%</Text>
            <Text style={styles.statLabel}>Avg Completion</Text>
          </View>
          <View style={styles.statCard}>
            <CheckCircle size={24} color="#10B981" />
            <Text style={styles.statValue}>{totalCompleted}</Text>
            <Text style={styles.statLabel}>Completed</Text>
          </View>
          <View style={styles.statCard}>
            <Clock size={24} color="#F59E0B" />
            <Text style={styles.statValue}>{totalTasks - totalCompleted}</Text>
            <Text style={styles.statLabel}>Pending</Text>
          </View>
        </View>

        {/* Filter Tabs */}
        <View style={styles.filterContainer}>
          {(['all', 'high', 'medium', 'low'] as const).map((f) => (
            <TouchableOpacity
              key={f}
              style={[styles.filterTab, filter === f && styles.filterTabActive]}
              onPress={() => setFilter(f)}
            >
              <Text style={[styles.filterText, filter === f && styles.filterTextActive]}>
                {f === 'all' ? 'All' : f === 'high' ? '90%+' : f === 'medium' ? '50-89%' : '<50%'}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Miners List */}
        <View style={styles.minersList}>
          {teamStatus.length === 0 ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyText}>No miners found</Text>
            </View>
          ) : (
            teamStatus.map((miner) => (
              <TouchableOpacity
                key={miner.minerId}
                style={styles.minerCard}
                onPress={() => {
                  // View miner task details
                  console.log('View tasks for:', miner.minerName);
                } }
              >
                <View style={styles.minerHeader}>
                  <View style={styles.minerHeaderLeft}>
                    <User size={20} color={COLORS.primary} />
                    <View style={styles.minerInfo}>
                      <Text style={styles.minerName}>{miner.minerName}</Text>
                      <Text style={styles.minerId}>{miner.minerId}</Text>
                    </View>
                  </View>
                  <View
                    style={[
                      styles.statusBadge,
                      { backgroundColor: miner.completionRate >= 80 ? '#10B98120' : '#F59E0B20' },
                    ]}
                  >
                    <Text style={[styles.statusText, { color: miner.completionRate >= 80 ? '#10B981' : '#F59E0B' }]}>
                      {miner.completionRate >= 80 ? 'ON TRACK' : 'NEEDS ATTENTION'}
                    </Text>
                  </View>
                </View>

                <View style={styles.progressSection}>
                  <View style={styles.progressBar}>
                    <View
                      style={[
                        styles.progressFill,
                        {
                          width: `${miner.completionRate}%`,
                          backgroundColor: miner.completionRate >= 80 ? '#10B981' : '#F59E0B',
                        },
                      ]} />
                  </View>
                  <Text style={[styles.completionRate, { color: miner.completionRate >= 80 ? '#10B981' : '#F59E0B' }]}>
                    {miner.completionRate}%
                  </Text>
                </View>

                <View style={styles.taskStats}>
                  <View style={styles.taskStatItem}>
                    <CheckCircle size={16} color="#10B981" />
                    <Text style={styles.taskStatLabel}>Completed</Text>
                    <Text style={styles.taskStatValue}>{miner.completedTasks}</Text>
                  </View>
                  <View style={styles.taskStatDivider} />
                  <View style={styles.taskStatItem}>
                    <Clock size={16} color="#F59E0B" />
                    <Text style={styles.taskStatLabel}>Pending</Text>
                    <Text style={styles.taskStatValue}>{miner.pendingTasks}</Text>
                  </View>
                  <View style={styles.taskStatDivider} />
                  <View style={styles.taskStatItem}>
                    <Calendar size={16} color={COLORS.primary} />
                    <Text style={styles.taskStatLabel}>Total</Text>
                    <Text style={styles.taskStatValue}>{miner.totalTasks}</Text>
                  </View>
                </View>
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
  content: {
    flex: 1,
  },
  statsContainer: {
    flexDirection: 'row',
    padding: 20,
    gap: 12,
  },
  statCard: {
    flex: 1,
    backgroundColor: COLORS.card,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: COLORS.text,
    marginTop: 8,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: COLORS.textMuted,
    textAlign: 'center',
  },
  filterContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    marginBottom: 20,
    gap: 8,
  },
  filterTab: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 8,
    backgroundColor: COLORS.card,
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: 'center',
  },
  filterTabActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  filterText: {
    fontSize: 13,
    color: COLORS.textMuted,
    fontWeight: '500',
  },
  filterTextActive: {
    color: '#FFFFFF',
  },
  teamContainer: {
    padding: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: 16,
  },
  memberCard: {
    backgroundColor: COLORS.card,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  memberHeader: {
    marginBottom: 16,
  },
  memberInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  memberDetails: {
    flex: 1,
  },
  memberName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: 4,
  },
  memberMeta: {
    fontSize: 13,
    color: COLORS.textMuted,
  },
  progressSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 16,
  },
  progressBar: {
    flex: 1,
    height: 8,
    backgroundColor: COLORS.background,
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 4,
  },
  completionRate: {
    fontSize: 16,
    fontWeight: 'bold',
    minWidth: 50,
    textAlign: 'right',
  },
  taskStats: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  taskStatItem: {
    flex: 1,
    alignItems: 'center',
    gap: 4,
  },
  taskStatDivider: {
    width: 1,
    height: 40,
    backgroundColor: COLORS.border,
  },
  taskStatLabel: {
    fontSize: 11,
    color: COLORS.textMuted,
  },
  taskStatValue: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.text,
  },
  minersList: {
    padding: 16,
  },
  emptyState: {
    padding: 40,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 16,
    color: COLORS.textMuted,
  },
  minerCard: {
    backgroundColor: COLORS.card,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
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
    flex: 1,
  },
  minerInfo: {
    marginLeft: 12,
  },
  minerName: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text,
  },
  minerId: {
    fontSize: 12,
    color: COLORS.textMuted,
    marginTop: 2,
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  statusText: {
    fontSize: 10,
    fontWeight: '700',
  },
});
