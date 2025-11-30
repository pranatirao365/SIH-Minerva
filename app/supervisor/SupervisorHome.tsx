import { useRouter } from 'expo-router';
import React from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  AlertTriangle,
  CheckCircle,
  FileText,
  Shield,
  Users,
  User
} from '../../components/Icons';
import { COLORS } from '../../constants/styles';
import { useRoleStore } from '../../hooks/useRoleStore';

export default function SupervisorHome() {
  const router = useRouter();
  const { user } = useRoleStore();

  const dashboardCards = [
    {
      icon: FileText,
      label: 'Work Assignment',
      route: '/supervisor/TaskAssignment',
      color: COLORS.primary,
      description: 'Assign and track tasks',
      stats: '12 Active'
    },
    {
      icon: AlertTriangle,
      label: 'Reported Incidents',
      route: '/supervisor/IncidentDashboard',
      color: COLORS.destructive,
      description: 'View incident reports',
      stats: '3 New'
    },
    {
      icon: Shield,
      label: 'Helmet Monitoring',
      route: '/supervisor/WorkerManagement',
      color: COLORS.accent,
      description: 'Live helmet status',
      stats: '45 Online'
    },
    {
      icon: User,
      label: 'Attendance',
      route: '/supervisor/TeamPerformance',
      color: '#10B981',
      description: 'Validate attendance',
      stats: '42/45 Present'
    },
    {
      icon: Users,
      label: 'Team Status',
      route: '/supervisor/TeamPerformance',
      color: '#8B5CF6',
      description: 'Daily task completion',
      stats: '85% Complete'
    },
    {
      icon: CheckCircle,
      label: 'Audit Tracker',
      route: '/supervisor/AuditTracker',
      color: '#F59E0B',
      description: 'Safety compliance',
      stats: '2 Pending'
    },
  ];

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.welcomeText}>Welcome back, {user.role ? user.role.charAt(0).toUpperCase() + user.role.slice(1) : 'User'}</Text>
          <Text style={styles.userName}>{user.role ? (user.role.charAt(0).toUpperCase() + user.role.slice(1)) : user.name || 'Supervisor'}</Text>
          
          {/* Summary Card */}
          <View style={styles.summaryCard}>
            <View style={styles.summaryItem}>
              <Text style={styles.summaryValue}>45</Text>
              <Text style={styles.summaryLabel}>Team Members</Text>
            </View>
            <View style={styles.summaryDivider} />
            <View style={styles.summaryItem}>
              <Text style={styles.summaryValue}>12</Text>
              <Text style={styles.summaryLabel}>Active Tasks</Text>
            </View>
            <View style={styles.summaryDivider} />
            <View style={styles.summaryItem}>
              <Text style={styles.summaryValue}>3</Text>
              <Text style={styles.summaryLabel}>Incidents</Text>
            </View>
          </View>
        </View>

        {/* Dashboard Cards */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Management Tools</Text>
          
          <View style={styles.cardsGrid}>
            {dashboardCards.map((card, index) => {
              const Icon = card.icon;
              return (
                <TouchableOpacity
                  key={index}
                  style={styles.card}
                  onPress={() => router.push(card.route as any)}
                  activeOpacity={0.7}
                >
                  <View style={[styles.iconContainer, { backgroundColor: card.color + '15' }]}>
                    <Icon size={28} color={card.color} />
                  </View>
                  <View style={styles.cardContent}>
                    <Text style={styles.cardLabel}>{card.label}</Text>
                    <Text style={styles.cardDescription}>{card.description}</Text>
                    <View style={styles.statsContainer}>
                      <Text style={[styles.statsText, { color: card.color }]}>
                        {card.stats}
                      </Text>
                    </View>
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* Quick Stats */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Today Overview</Text>
          
          <View style={styles.statsCard}>
            <View style={styles.statItem}>
              <View style={[styles.statIcon, { backgroundColor: COLORS.primary + '15' }]}>
                <CheckCircle size={20} color={COLORS.primary} />
              </View>
              <View style={styles.statInfo}>
                <Text style={styles.statValue}>85%</Text>
                <Text style={styles.statLabel}>Tasks Completed</Text>
              </View>
            </View>

            <View style={styles.statItem}>
              <View style={[styles.statIcon, { backgroundColor: '#10B981' + '15' }]}>
                <User size={20} color="#10B981" />
              </View>
              <View style={styles.statInfo}>
                <Text style={styles.statValue}>93%</Text>
                <Text style={styles.statLabel}>Attendance Rate</Text>
              </View>
            </View>

            <View style={styles.statItem}>
              <View style={[styles.statIcon, { backgroundColor: COLORS.accent + '15' }]}>
                <Shield size={20} color={COLORS.accent} />
              </View>
              <View style={styles.statInfo}>
                <Text style={styles.statValue}>100%</Text>
                <Text style={styles.statLabel}>Safety Compliance</Text>
              </View>
            </View>
          </View>
        </View>

        <View style={styles.bottomPadding} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  scrollView: {
    flex: 1,
  },
  header: {
    padding: 24,
    paddingTop: 16,
  },
  welcomeText: {
    fontSize: 14,
    color: COLORS.textMuted,
    marginBottom: 4,
  },
  userName: {
    fontSize: 28,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: 20,
  },
  summaryCard: {
    flexDirection: 'row',
    backgroundColor: COLORS.card,
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  summaryItem: {
    flex: 1,
    alignItems: 'center',
  },
  summaryValue: {
    fontSize: 32,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: 4,
  },
  summaryLabel: {
    fontSize: 12,
    color: COLORS.textMuted,
    textAlign: 'center',
  },
  summaryDivider: {
    width: 1,
    backgroundColor: COLORS.border,
    marginHorizontal: 12,
  },
  section: {
    paddingHorizontal: 24,
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: 16,
  },
  cardsGrid: {
    gap: 12,
  },
  card: {
    flexDirection: 'row',
    backgroundColor: COLORS.card,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: 'center',
  },
  iconContainer: {
    width: 56,
    height: 56,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  cardContent: {
    flex: 1,
  },
  cardLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 4,
  },
  cardDescription: {
    fontSize: 13,
    color: COLORS.textMuted,
    marginBottom: 8,
  },
  statsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statsText: {
    fontSize: 12,
    fontWeight: '600',
  },
  statsCard: {
    backgroundColor: COLORS.card,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
    gap: 16,
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  statInfo: {
    flex: 1,
  },
  statValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: 2,
  },
  statLabel: {
    fontSize: 13,
    color: COLORS.textMuted,
  },
  bottomPadding: {
    height: 24,
  },
});
