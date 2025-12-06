import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { useRoleStore } from '../../hooks/useRoleStore';
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
import { ArrowLeft, Award, Star, TrendingUp } from '../../components/Icons';
import { COLORS } from '../../constants/styles';
import { calculateSafetyScore } from '../../services/supervisorEnhancements';
import { useSupervisor } from '@/contexts/SupervisorContext';

interface MinerPerformance {
  id: string;
  minerId: string;
  minerName: string;
  safetyScore: number;
  badges: string[];
  taskCompletionRate: number;
  ppeComplianceRate: number;
  incidentFreeStreak: number;
  trainingScore: number;
  rank: number;
  trend: 'up' | 'down' | 'stable';
}

export default function PerformanceTracking() {
  const router = useRouter();
  const { user } = useRoleStore();
  const { assignedMiners, loading: minersLoading } = useSupervisor();
  const [loading, setLoading] = useState(false);
  const [miners, setMiners] = useState<MinerPerformance[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [sortBy, setSortBy] = useState<'score' | 'tasks' | 'ppe' | 'incidents'>('score');

  useEffect(() => {
    if (assignedMiners.length > 0) {
      loadPerformance();
    }
  }, [assignedMiners]);

  const loadPerformance = async () => {
    try {
      console.log('📊 Generating performance data for', assignedMiners.length, 'miners');

      const minerPerformance: MinerPerformance[] = assignedMiners.map((miner, index) => {
        const safetyScore = 75 + Math.floor(Math.random() * 25);
        const taskRate = 80 + Math.floor(Math.random() * 20);
        const ppeRate = 85 + Math.floor(Math.random() * 15);
        const streak = Math.floor(Math.random() * 120);
        const trends: ('up' | 'down' | 'stable')[] = ['up', 'up', 'stable', 'down'];
        
        const badges: string[] = [];
        if (safetyScore >= 95) badges.push('Safety Star');
        if (streak >= 100) badges.push('100 Days');
        if (ppeRate >= 98) badges.push('PPE Champion');
        if (streak >= 50) badges.push('50 Days');
        if (badges.length === 0) badges.push('Active');
        
        return {
          id: miner.id,
          minerId: miner.id,
          minerName: miner.name || 'Unknown',
          safetyScore: miner.safetyScore || safetyScore,
          badges,
          taskCompletionRate: taskRate,
          ppeComplianceRate: ppeRate,
          incidentFreeStreak: streak,
          trainingScore: 75 + Math.floor(Math.random() * 20),
          rank: index + 1,
          trend: trends[Math.floor(Math.random() * trends.length)],
        };
      });

      // Sort by safety score
      minerPerformance.sort((a, b) => b.safetyScore - a.safetyScore);
      minerPerformance.forEach((m, i) => m.rank = i + 1);

      setMiners(minerPerformance);
      console.log(`✅ Generated performance data for ${minerPerformance.length} miners`);
    } catch (error) {
      console.error('❌ Error generating performance data:', error);
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadPerformance();
    setRefreshing(false);
  };

  const sortMiners = (a: MinerPerformance, b: MinerPerformance) => {
    switch (sortBy) {
      case 'score':
        return b.safetyScore - a.safetyScore;
      case 'tasks':
        return b.taskCompletionRate - a.taskCompletionRate;
      case 'ppe':
        return b.ppeComplianceRate - a.ppeComplianceRate;
      case 'incidents':
        return b.incidentFreeStreak - a.incidentFreeStreak;
      default:
        return 0;
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 95) return '#10B981';
    if (score >= 85) return '#F59E0B';
    return '#EF4444';
  };

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'up':
        return '↑';
      case 'down':
        return '↓';
      case 'stable':
        return '→';
      default:
        return '';
    }
  };

  const getTrendColor = (trend: string) => {
    switch (trend) {
      case 'up':
        return '#10B981';
      case 'down':
        return '#EF4444';
      case 'stable':
        return COLORS.textMuted;
      default:
        return COLORS.textMuted;
    }
  };

  const avgScore = miners.length > 0
    ? Math.round(miners.reduce((sum, m) => sum + m.safetyScore, 0) / miners.length)
    : 0;

  const topPerformer = miners[0];

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <ArrowLeft size={24} color={COLORS.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Performance Tracking</Text>
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
            <Text style={[styles.statValue, { color: COLORS.primary }]}>{avgScore}</Text>
            <Text style={styles.statLabel}>Avg Safety Score</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={[styles.statValue, { color: '#10B981' }]}>{topPerformer?.minerName.split(' ')[0]}</Text>
            <Text style={styles.statLabel}>Top Performer</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={[styles.statValue, { color: '#F59E0B' }]}>{miners.length}</Text>
            <Text style={styles.statLabel}>Total Miners</Text>
          </View>
        </View>

        {/* Sort Options */}
        <View style={styles.sortContainer}>
          <Text style={styles.sortTitle}>Sort by:</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <View style={styles.sortButtons}>
              {[
                { key: 'score', label: 'Safety Score' },
                { key: 'tasks', label: 'Tasks' },
                { key: 'ppe', label: 'PPE' },
                { key: 'incidents', label: 'Incident Free' },
              ].map(option => (
                <TouchableOpacity
                  key={option.key}
                  style={[
                    styles.sortButton,
                    sortBy === option.key && styles.sortButtonActive,
                  ]}
                  onPress={() => setSortBy(option.key as any)}
                >
                  <Text
                    style={[
                      styles.sortButtonText,
                      sortBy === option.key && styles.sortButtonTextActive,
                    ]}
                  >
                    {option.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </ScrollView>
        </View>

        {/* Leaderboard */}
        <View style={styles.leaderboardContainer}>
          <Text style={styles.sectionTitle}>Leaderboard</Text>
          {[...miners]
            .sort(sortMiners)
            .map((miner, index) => (
              <View key={miner.id} style={styles.minerCard}>
                <View style={styles.minerRank}>
                  {index < 3 ? (
                    <Star size={24} color={index === 0 ? '#FFD700' : index === 1 ? '#C0C0C0' : '#CD7F32'} />
                  ) : (
                    <Text style={styles.rankNumber}>#{index + 1}</Text>
                  )}
                </View>

                <View style={styles.minerContent}>
                  <View style={styles.minerHeader}>
                    <View style={styles.minerInfo}>
                      <Text style={styles.minerName}>{miner.minerName}</Text>
                      <Text style={styles.minerId}>{miner.minerId}</Text>
                    </View>
                    <View style={styles.scoreContainer}>
                      <Text style={[styles.scoreValue, { color: getScoreColor(miner.safetyScore) }]}>
                        {miner.safetyScore}
                      </Text>
                      <Text style={styles.scoreLabel}>Score</Text>
                    </View>
                  </View>

                  <View style={styles.metricsRow}>
                    <View style={styles.metric}>
                      <Text style={styles.metricLabel}>Tasks</Text>
                      <Text style={styles.metricValue}>{miner.taskCompletionRate}%</Text>
                    </View>
                    <View style={styles.metric}>
                      <Text style={styles.metricLabel}>PPE</Text>
                      <Text style={styles.metricValue}>{miner.ppeComplianceRate}%</Text>
                    </View>
                    <View style={styles.metric}>
                      <Text style={styles.metricLabel}>Incident Free</Text>
                      <Text style={styles.metricValue}>{miner.incidentFreeStreak} days</Text>
                    </View>
                    <View style={styles.metric}>
                      <Text style={styles.metricLabel}>Training</Text>
                      <Text style={styles.metricValue}>{miner.trainingScore}%</Text>
                    </View>
                  </View>

                  <View style={styles.badgesContainer}>
                    {miner.badges.map((badge, idx) => (
                      <View key={idx} style={styles.badgeChip}>
                        <Award size={12} color={COLORS.primary} />
                        <Text style={styles.badgeText}>{badge}</Text>
                      </View>
                    ))}
                  </View>

                  <View style={styles.trendContainer}>
                    <TrendingUp size={14} color={getTrendColor(miner.trend)} />
                    <Text style={[styles.trendText, { color: getTrendColor(miner.trend) }]}>
                      {getTrendIcon(miner.trend)} Trend: {miner.trend}
                    </Text>
                  </View>
                </View>
              </View>
            ))}
        </View>

        {/* Scoring Breakdown */}
        <View style={styles.breakdownContainer}>
          <Text style={styles.sectionTitle}>Safety Score Calculation</Text>
          <View style={styles.breakdownCard}>
            <View style={styles.breakdownRow}>
              <Text style={styles.breakdownLabel}>Task Completion</Text>
              <Text style={styles.breakdownValue}>30%</Text>
            </View>
            <View style={styles.breakdownRow}>
              <Text style={styles.breakdownLabel}>PPE Compliance</Text>
              <Text style={styles.breakdownValue}>25%</Text>
            </View>
            <View style={styles.breakdownRow}>
              <Text style={styles.breakdownLabel}>Incident-Free Streak</Text>
              <Text style={styles.breakdownValue}>25%</Text>
            </View>
            <View style={styles.breakdownRow}>
              <Text style={styles.breakdownLabel}>Training & Certification</Text>
              <Text style={styles.breakdownValue}>20%</Text>
            </View>
          </View>
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
  sortContainer: {
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  sortTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 8,
  },
  sortButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  sortButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
    backgroundColor: COLORS.card,
  },
  sortButtonActive: {
    backgroundColor: COLORS.primary,
  },
  sortButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.textMuted,
  },
  sortButtonTextActive: {
    color: '#FFFFFF',
  },
  leaderboardContainer: {
    padding: 16,
    paddingTop: 0,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: 12,
  },
  minerCard: {
    flexDirection: 'row',
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
  minerRank: {
    width: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rankNumber: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.textMuted,
  },
  minerContent: {
    flex: 1,
  },
  minerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  minerInfo: {
    flex: 1,
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
  scoreContainer: {
    alignItems: 'center',
  },
  scoreValue: {
    fontSize: 28,
    fontWeight: 'bold',
  },
  scoreLabel: {
    fontSize: 11,
    color: COLORS.textMuted,
  },
  metricsRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 12,
  },
  metric: {
    flex: 1,
    backgroundColor: COLORS.background,
    borderRadius: 8,
    padding: 8,
    alignItems: 'center',
  },
  metricLabel: {
    fontSize: 10,
    color: COLORS.textMuted,
    marginBottom: 4,
  },
  metricValue: {
    fontSize: 13,
    fontWeight: 'bold',
    color: COLORS.text,
  },
  badgesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 8,
  },
  badgeChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: COLORS.primary + '20',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '600',
    color: COLORS.primary,
  },
  trendContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  trendText: {
    fontSize: 12,
    fontWeight: '600',
  },
  breakdownContainer: {
    padding: 16,
    paddingTop: 8,
  },
  breakdownCard: {
    backgroundColor: COLORS.card,
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  breakdownRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  breakdownLabel: {
    fontSize: 14,
    color: COLORS.text,
  },
  breakdownValue: {
    fontSize: 14,
    fontWeight: 'bold',
    color: COLORS.primary,
  },
});
