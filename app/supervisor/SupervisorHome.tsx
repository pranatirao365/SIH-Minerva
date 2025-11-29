import { useRouter } from 'expo-router';
import React from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  AlertTriangle,
  BarChart3,
  CheckCircle,
  FileText,
  Settings,
  Shield,
  Users,
  Video,
  Youtube
} from '@/components/Icons';
import { COLORS } from '@/constants/styles';
import { useRoleStore } from '../../hooks/useRoleStore';

export default function SupervisorHome() {
  const router = useRouter();
  const { user } = useRoleStore();

  const mainModules = [
    {
      icon: Video,
      title: 'AI Video Generator',
      description: 'Create safety training videos with AI',
      route: '/supervisor/VideoGenerationModule',
      color: COLORS.primary,
      gradient: true,
    },
    {
      icon: Youtube,
      title: 'Video Library',
      description: 'Manage training video library',
      route: '/supervisor/VideoLibrary',
      color: '#EC4899',
    },
    {
      icon: Users,
      title: 'Team Management',
      description: 'Manage team members and assignments',
      route: '/supervisor/TeamPerformance',
      color: COLORS.secondary,
    },
    {
      icon: BarChart3,
      title: 'Performance Analytics',
      description: 'View team performance metrics',
      route: '/supervisor/WorkerManagement',
      color: COLORS.accent,
    },
    {
      icon: AlertTriangle,
      title: 'Incident Reports',
      description: 'Review and manage incidents',
      route: '/supervisor/IncidentDashboard',
      color: COLORS.destructive,
    },
    {
      icon: CheckCircle,
      title: 'Task Assignments',
      description: 'Assign and track tasks',
      route: '/supervisor/TaskAssignment',
      color: '#8B5CF6',
    },
    {
      icon: Shield,
      title: 'Safety Audits',
      description: 'Conduct safety audits',
      route: '/supervisor/AuditTracker',
      color: '#F59E0B',
    },
    {
      icon: FileText,
      title: 'Shift Planning',
      description: 'Plan and manage shifts',
      route: '/supervisor/ShiftPlanning',
      color: '#10B981',
    },
  ];

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.welcomeText}>Welcome back,</Text>
            <Text style={styles.userName}>{user.name || 'Supervisor'}</Text>
          </View>
          <TouchableOpacity style={styles.settingsButton}>
            <Settings size={24} color={COLORS.text} />
          </TouchableOpacity>
        </View>

        {/* Quick Stats */}
        <View style={styles.statsContainer}>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>24</Text>
            <Text style={styles.statLabel}>Active Shifts</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>98%</Text>
            <Text style={styles.statLabel}>Safety Score</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>156</Text>
            <Text style={styles.statLabel}>Team Members</Text>
          </View>
        </View>

        {/* Main Modules */}
        <View style={styles.modulesContainer}>
          <Text style={styles.sectionTitle}>Supervisor Tools</Text>
          <View style={styles.modulesGrid}>
            {mainModules.map((module, index) => (
              <TouchableOpacity
                key={index}
                style={[styles.moduleCard, module.gradient && styles.gradientCard]}
                onPress={() => router.push(module.route as any)}
              >
                <View style={[styles.moduleIcon, { backgroundColor: module.color + '20' }]}>
                  <module.icon size={28} color={module.color} />
                </View>
                <Text style={styles.moduleTitle}>{module.title}</Text>
                <Text style={styles.moduleDescription}>{module.description}</Text>
              </TouchableOpacity>
            ))}
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
  scrollView: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 10,
  },
  welcomeText: {
    fontSize: 16,
    color: COLORS.textMuted,
    fontWeight: '500',
  },
  userName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: COLORS.text,
    marginTop: 4,
  },
  settingsButton: {
    padding: 8,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingHorizontal: 20,
    marginBottom: 30,
  },
  statCard: {
    backgroundColor: COLORS.card,
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    minWidth: 80,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: COLORS.primary,
  },
  statLabel: {
    fontSize: 12,
    color: COLORS.textMuted,
    marginTop: 4,
    textAlign: 'center',
  },
  modulesContainer: {
    paddingHorizontal: 20,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: 16,
  },
  modulesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  moduleCard: {
    backgroundColor: COLORS.card,
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    width: '48%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  gradientCard: {
    backgroundColor: COLORS.primary + '10',
    borderWidth: 1,
    borderColor: COLORS.primary + '30',
  },
  moduleIcon: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  moduleTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 4,
  },
  moduleDescription: {
    fontSize: 12,
    color: COLORS.textMuted,
    lineHeight: 16,
  },
});
