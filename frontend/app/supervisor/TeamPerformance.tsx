import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Dimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { ArrowLeft, Award, TrendingUp, Users, CheckCircle, AlertTriangle, Shield, Clock } from '../../components/Icons';
import { COLORS } from '../../constants/styles';
import { useSupervisor } from '@/contexts/SupervisorContext';

const { width } = Dimensions.get('window');

interface TeamMember {
  id: string;
  name: string;
  role: string;
  safetyScore: number;
  tasksCompleted: number;
  totalTasks: number;
  attendance: number;
  incidentCount: number;
  badges: string[];
  status: 'active' | 'on-leave' | 'inactive';
  lastActive: string;
}

interface PerformanceMetric {
  label: string;
  value: string | number;
  change: number;
  icon: any;
  color: string;
}

export default function TeamPerformance() {
  const router = useRouter();
  const { assignedMiners, loading: minersLoading } = useSupervisor();
  const [selectedPeriod, setSelectedPeriod] = useState<'day' | 'week' | 'month'>('week');
  const [selectedMember, setSelectedMember] = useState<string | null>(null);
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);

  useEffect(() => {
    if (assignedMiners.length > 0) {
      generateTeamData();
    }
  }, [assignedMiners]);

  const generateTeamData = () => {
    console.log('📊 Generating team performance data for', assignedMiners.length, 'miners');
    
    const members: TeamMember[] = assignedMiners.map((miner) => {
      const safetyScore = miner.safetyScore || (75 + Math.floor(Math.random() * 25));
      const totalTasks = 45 + Math.floor(Math.random() * 10);
      const tasksCompleted = Math.floor(totalTasks * (0.7 + Math.random() * 0.3));
      const attendance = 85 + Math.floor(Math.random() * 15);
      const incidentCount = Math.floor(Math.random() * 4);
      
      const badges: string[] = [];
      if (safetyScore >= 95) badges.push('Safety Champion');
      if (attendance >= 98) badges.push('Perfect Attendance');
      if (tasksCompleted >= 100) badges.push('100 Tasks');
      if (incidentCount === 0) badges.push('Safety First');
      if (badges.length === 0) badges.push('Team Member');
      
      return {
        id: miner.id,
        name: miner.name,
        role: miner.role || 'Miner',
        safetyScore,
        tasksCompleted,
        totalTasks,
        attendance,
        incidentCount,
        badges,
        status: 'active' as const,
        lastActive: `${Math.floor(Math.random() * 60)} mins ago`,
      };
    });
    
    setTeamMembers(members);
    console.log('✅ Generated team performance data for', members.length, 'members');
  };

  const overallMetrics: PerformanceMetric[] = [
    {
      label: 'Team Safety Score',
      value: '88%',
      change: 5.2,
      icon: Shield,
      color: '#10B981',
    },
    {
      label: 'Task Completion',
      value: '84%',
      change: 3.1,
      icon: CheckCircle,
      color: '#06B6D4',
    },
    {
      label: 'Avg Attendance',
      value: '94%',
      change: 1.8,
      icon: Users,
      color: '#8B5CF6',
    },
    {
      label: 'Incidents',
      value: 6,
      change: -25,
      icon: AlertTriangle,
      color: '#F59E0B',
    },
  ];

  const getScoreColor = (score: number) => {
    if (score >= 90) return '#10B981';
    if (score >= 75) return '#F59E0B';
    return '#EF4444';
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return '#10B981';
      case 'on-leave': return '#F59E0B';
      case 'inactive': return '#EF4444';
      default: return COLORS.textMuted;
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'active': return 'Active';
      case 'on-leave': return 'On Leave';
      case 'inactive': return 'Inactive';
      default: return status;
    }
  };

  const calculateCompletionRate = (completed: number, total: number) => {
    return Math.round((completed / total) * 100);
  };

  const topPerformers = [...teamMembers]
    .filter(m => m.status === 'active')
    .sort((a, b) => b.safetyScore - a.safetyScore)
    .slice(0, 3);

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <ArrowLeft size={24} color={COLORS.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Team Performance</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView style={styles.content}>
        {/* Period Selector */}
        <View style={styles.periodSelector}>
          {(['day', 'week', 'month'] as const).map((period) => (
            <TouchableOpacity
              key={period}
              style={[styles.periodButton, selectedPeriod === period && styles.periodButtonActive]}
              onPress={() => setSelectedPeriod(period)}
            >
              <Text style={[styles.periodText, selectedPeriod === period && styles.periodTextActive]}>
                {period.charAt(0).toUpperCase() + period.slice(1)}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Overall Metrics */}
        <View style={styles.metricsContainer}>
          {overallMetrics.map((metric, index) => {
            const Icon = metric.icon;
            return (
              <View key={index} style={styles.metricCard}>
                <View style={[styles.metricIconContainer, { backgroundColor: metric.color + '20' }]}>
                  <Icon size={24} color={metric.color} />
                </View>
                <Text style={styles.metricValue}>{metric.value}</Text>
                <Text style={styles.metricLabel}>{metric.label}</Text>
                <View style={styles.changeContainer}>
                  <TrendingUp size={14} color={metric.change >= 0 ? '#10B981' : '#EF4444'} />
                  <Text style={[styles.changeText, { color: metric.change >= 0 ? '#10B981' : '#EF4444' }]}>
                    {metric.change > 0 ? '+' : ''}{metric.change}%
                  </Text>
                </View>
              </View>
            );
          })}
        </View>

        {/* Top Performers */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Award size={24} color={COLORS.primary} />
            <Text style={styles.sectionTitle}>Top Performers</Text>
          </View>
          <View style={styles.topPerformersContainer}>
            {topPerformers.map((member, index) => (
              <View key={member.id} style={styles.topPerformerCard}>
                <View style={styles.rankBadge}>
                  <Text style={styles.rankText}>#{index + 1}</Text>
                </View>
                <View style={styles.performerInfo}>
                  <Text style={styles.performerName}>{member.name}</Text>
                  <Text style={styles.performerRole}>{member.role}</Text>
                </View>
                <View style={styles.performerScore}>
                  <Text style={[styles.scoreValue, { color: getScoreColor(member.safetyScore) }]}>
                    {member.safetyScore}
                  </Text>
                  <Text style={styles.scoreLabel}>Score</Text>
                </View>
              </View>
            ))}
          </View>
        </View>

        {/* Team Members List */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Users size={24} color={COLORS.primary} />
            <Text style={styles.sectionTitle}>Team Members ({teamMembers.length})</Text>
          </View>
          
          {teamMembers.map((member) => {
            const completionRate = calculateCompletionRate(member.tasksCompleted, member.totalTasks);
            const isSelected = selectedMember === member.id;
            
            return (
              <TouchableOpacity
                key={member.id}
                style={[styles.memberCard, isSelected && styles.memberCardSelected]}
                onPress={() => setSelectedMember(isSelected ? null : member.id)}
              >
                <View style={styles.memberHeader}>
                  <View style={styles.memberMainInfo}>
                    <Text style={styles.memberName}>{member.name}</Text>
                    <Text style={styles.memberRole}>{member.role}</Text>
                  </View>
                  <View style={[styles.statusBadge, { backgroundColor: getStatusColor(member.status) + '20' }]}>
                    <View style={[styles.statusDot, { backgroundColor: getStatusColor(member.status) }]} />
                    <Text style={[styles.statusText, { color: getStatusColor(member.status) }]}>
                      {getStatusText(member.status)}
                    </Text>
                  </View>
                </View>

                <View style={styles.memberStats}>
                  <View style={styles.statItem}>
                    <View style={styles.statHeader}>
                      <Shield size={16} color={getScoreColor(member.safetyScore)} />
                      <Text style={styles.statLabel}>Safety Score</Text>
                    </View>
                    <Text style={[styles.statValue, { color: getScoreColor(member.safetyScore) }]}>
                      {member.safetyScore}%
                    </Text>
                  </View>
                  
                  <View style={styles.statItem}>
                    <View style={styles.statHeader}>
                      <CheckCircle size={16} color="#06B6D4" />
                      <Text style={styles.statLabel}>Tasks</Text>
                    </View>
                    <Text style={styles.statValue}>
                      {member.tasksCompleted}/{member.totalTasks}
                    </Text>
                    <Text style={styles.statSubtext}>{completionRate}%</Text>
                  </View>
                  
                  <View style={styles.statItem}>
                    <View style={styles.statHeader}>
                      <Clock size={16} color="#8B5CF6" />
                      <Text style={styles.statLabel}>Attendance</Text>
                    </View>
                    <Text style={styles.statValue}>{member.attendance}%</Text>
                  </View>
                  
                  <View style={styles.statItem}>
                    <View style={styles.statHeader}>
                      <AlertTriangle size={16} color={member.incidentCount > 0 ? '#EF4444' : '#10B981'} />
                      <Text style={styles.statLabel}>Incidents</Text>
                    </View>
                    <Text style={[styles.statValue, { color: member.incidentCount > 0 ? '#EF4444' : '#10B981' }]}>
                      {member.incidentCount}
                    </Text>
                  </View>
                </View>

                {isSelected && (
                  <View style={styles.memberDetails}>
                    <View style={styles.detailsDivider} />
                    
                    {member.badges.length > 0 && (
                      <View style={styles.badgesSection}>
                        <Text style={styles.badgesTitle}>Achievements</Text>
                        <View style={styles.badgesList}>
                          {member.badges.map((badge, index) => (
                            <View key={index} style={styles.badge}>
                              <Award size={14} color={COLORS.primary} />
                              <Text style={styles.badgeText}>{badge}</Text>
                            </View>
                          ))}
                        </View>
                      </View>
                    )}
                    
                    <View style={styles.lastActiveContainer}>
                      <Clock size={14} color={COLORS.textMuted} />
                      <Text style={styles.lastActiveText}>Last active: {member.lastActive}</Text>
                    </View>
                  </View>
                )}
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Performance Insights */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <TrendingUp size={24} color={COLORS.primary} />
            <Text style={styles.sectionTitle}>Performance Insights</Text>
          </View>
          
          <View style={styles.insightsContainer}>
            <View style={styles.insightCard}>
              <Text style={styles.insightTitle}>📈 Positive Trend</Text>
              <Text style={styles.insightText}>
                Team safety score improved by 5.2% this week. Keep up the great work!
              </Text>
            </View>
            
            <View style={styles.insightCard}>
              <Text style={styles.insightTitle}>⚠️ Attention Needed</Text>
              <Text style={styles.insightText}>
                2 team members have incident rates above average. Consider additional safety training.
              </Text>
            </View>
            
            <View style={styles.insightCard}>
              <Text style={styles.insightTitle}>🎯 Goal Progress</Text>
              <Text style={styles.insightText}>
                84% task completion rate. On track to meet this month's target of 85%.
              </Text>
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
  periodSelector: {
    flexDirection: 'row',
    padding: 20,
    gap: 12,
  },
  periodButton: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: COLORS.card,
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: 'center',
  },
  periodButtonActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  periodText: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.textMuted,
  },
  periodTextActive: {
    color: '#FFFFFF',
  },
  metricsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 20,
    gap: 12,
    marginBottom: 24,
  },
  metricCard: {
    width: (width - 52) / 2,
    backgroundColor: COLORS.card,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  metricIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  metricValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: 4,
  },
  metricLabel: {
    fontSize: 13,
    color: COLORS.textMuted,
    marginBottom: 8,
  },
  changeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  changeText: {
    fontSize: 13,
    fontWeight: '600',
  },
  section: {
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.text,
  },
  topPerformersContainer: {
    gap: 12,
  },
  topPerformerCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.card,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  rankBadge: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.primary + '20',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  rankText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.primary,
  },
  performerInfo: {
    flex: 1,
  },
  performerName: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 2,
  },
  performerRole: {
    fontSize: 13,
    color: COLORS.textMuted,
  },
  performerScore: {
    alignItems: 'center',
  },
  scoreValue: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  scoreLabel: {
    fontSize: 11,
    color: COLORS.textMuted,
    marginTop: 2,
  },
  memberCard: {
    backgroundColor: COLORS.card,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  memberCardSelected: {
    borderColor: COLORS.primary,
    backgroundColor: COLORS.primary + '05',
  },
  memberHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  memberMainInfo: {
    flex: 1,
  },
  memberName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: 4,
  },
  memberRole: {
    fontSize: 13,
    color: COLORS.textMuted,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    gap: 6,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
  },
  memberStats: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  statItem: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: COLORS.background,
    padding: 12,
    borderRadius: 8,
  },
  statHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 8,
  },
  statLabel: {
    fontSize: 12,
    color: COLORS.textMuted,
  },
  statValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.text,
  },
  statSubtext: {
    fontSize: 11,
    color: COLORS.textMuted,
    marginTop: 2,
  },
  memberDetails: {
    marginTop: 16,
  },
  detailsDivider: {
    height: 1,
    backgroundColor: COLORS.border,
    marginBottom: 16,
  },
  badgesSection: {
    marginBottom: 12,
  },
  badgesTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 8,
  },
  badgesList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: COLORS.primary + '20',
    borderRadius: 8,
  },
  badgeText: {
    fontSize: 12,
    color: COLORS.primary,
    fontWeight: '500',
  },
  lastActiveContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  lastActiveText: {
    fontSize: 12,
    color: COLORS.textMuted,
  },
  insightsContainer: {
    gap: 12,
  },
  insightCard: {
    backgroundColor: COLORS.card,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  insightTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 8,
  },
  insightText: {
    fontSize: 14,
    color: COLORS.textMuted,
    lineHeight: 20,
  },
});
