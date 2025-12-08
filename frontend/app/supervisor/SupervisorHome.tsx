import {
    AlertTriangle,
    BarChart3,
    Bell,
    BookOpen,
    CheckCircle,
    FileText,
    Settings,
    Shield,
    Sparkles,
    Users
} from '@/components/Icons';
import { COLORS } from '@/constants/styles';
import { useSupervisor } from '@/contexts/SupervisorContext';
import { useRouter } from 'expo-router';
import React from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRoleStore } from '../../hooks/useRoleStore';

export default function SupervisorHome() {
  const router = useRouter();
  const { user } = useRoleStore();
  const { assignedMiners, loading, error } = useSupervisor();

  // Debug logging
  React.useEffect(() => {
    console.log('📊 [SupervisorHome] Dashboard state:', {
      user: { id: user?.id, phone: user?.phone, role: user?.role },
      assignedMiners: assignedMiners.length,
      loading,
      error
    });
    if (assignedMiners.length > 0) {
      console.log('👥 [SupervisorHome] Assigned miners:', assignedMiners.map(m => ({
        id: m.id,
        name: m.name,
        phone: m.phone
      })));
    }
  }, [user, assignedMiners, loading, error]);

  // Emergency features - highest priority
  const emergencyModules = [
    {
      icon: Bell,
      title: 'SOS Notifications',
      description: 'View and respond to miner emergencies',
      route: '/supervisor/SOSNotifications',
      color: '#EF4444',
      isEmergency: true,
    },
    {
      icon: AlertTriangle,
      title: 'Alert Miners',
      description: 'Send emergency alerts to miners\' helmets',
      route: '/supervisor/AlertMiners',
      color: '#F59E0B',
      isEmergency: true,
    },
  ];

  const mainModules = [
    {
      icon: Shield,
      title: 'PPE Compliance Monitor',
      description: 'Track PPE scan results and compliance',
      route: '/supervisor/PPEComplianceMonitor',
      color: '#06B6D4',
      gradient: false,
    },
    {
      icon: CheckCircle,
      title: 'Team Task Status',
      description: 'Track daily task completion by team',
      route: '/supervisor/TeamTaskStatus',
      color: '#10B981',
      gradient: false,
    },
    {
      icon: Users,
      title: 'Health Monitoring',
      description: 'Monitor miner vitals and fitness',
      route: '/supervisor/HealthMonitoring',
      color: '#EF4444',
      gradient: false,
    },
    {
      icon: BarChart3,
      title: 'Performance Tracking',
      description: 'Safety scores and achievements',
      route: '/supervisor/PerformanceTracking',
      color: '#8B5CF6',
      gradient: false,
    },
    {
      icon: Sparkles,
      title: 'Smart Work Assignment',
      description: 'AI-powered video matching & assignment',
      route: '/supervisor/SmartWorkAssignment',
      color: COLORS.primary,
      gradient: true,
    },
    {
      icon: BarChart3,
      title: 'Video Progress Dashboard',
      description: 'Track completion & send reminders',
      route: '/supervisor/VideoProgressDashboard',
      color: '#06B6D4',
      gradient: true,
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
    {
      icon: BookOpen,
      title: 'Daily Safety Quizzes',
      description: 'Take daily safety assessments',
      route: '/shared/AvailableQuizzes',
      color: '#06B6D4',
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
            {loading ? (
              <ActivityIndicator size="small" color={COLORS.primary} />
            ) : (
              <Text style={styles.statValue}>{assignedMiners.length}</Text>
            )}
            <Text style={styles.statLabel}>Assigned Miners</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>
              {Math.round(assignedMiners.reduce((sum, m) => sum + (m.safetyScore || 0), 0) / (assignedMiners.length || 1))}%
            </Text>
            <Text style={styles.statLabel}>Avg Safety Score</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>
              {assignedMiners.filter(m => m.shift === 'morning').length}
            </Text>
            <Text style={styles.statLabel}>Morning Shift</Text>
          </View>
        </View>

        {/* Enhanced Stats Row */}
        <View style={styles.statsContainer}>
          <View style={styles.statCard}>
            <Text style={[styles.statValue, { color: '#06B6D4' }]}>92%</Text>
            <Text style={styles.statLabel}>PPE Compliance</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={[styles.statValue, { color: '#EF4444' }]}>2</Text>
            <Text style={styles.statLabel}>Health Alerts</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={[styles.statValue, { color: '#10B981' }]}>45/50</Text>
            <Text style={styles.statLabel}>Tasks Done</Text>
          </View>
        </View>

        {/* Emergency Modules - Priority Section */}
        <View style={styles.modulesContainer}>
          <Text style={styles.sectionTitle}>⚠️ Emergency Controls</Text>
          <View style={styles.emergencyGrid}>
            {emergencyModules.map((module, index) => (
              <TouchableOpacity
                key={index}
                style={[styles.emergencyCard, { borderColor: module.color }]}
                onPress={() => router.push(module.route as any)}
              >
                <View style={[styles.emergencyIcon, { backgroundColor: module.color + '20' }]}>
                  <module.icon size={32} color={module.color} />
                </View>
                <Text style={styles.emergencyTitle}>{module.title}</Text>
                <Text style={styles.moduleDescription}>{module.description}</Text>
              </TouchableOpacity>
            ))}
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
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: 16,
  },
  emergencyGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  emergencyCard: {
    backgroundColor: COLORS.card,
    borderRadius: 12,
    padding: 16,
    width: '48%',
    borderWidth: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.15,
    shadowRadius: 5,
    elevation: 5,
  },
  emergencyIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  emergencyTitle: {
    fontSize: 17,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: 6,
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
