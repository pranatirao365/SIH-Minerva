import {
    Activity,
    AlertTriangle,
    BarChart3,
    Bell,
    BookOpen,
    CheckCircle,
    ChevronDown,
    ChevronRight,
    ChevronUp,
    FileText,
    Settings,
    Shield,
    Sparkles,
    TrendingUp,
    UserCheck,
    Users
} from '@/components/Icons';
import { COLORS } from '@/constants/styles';
import { useSupervisor } from '@/contexts/SupervisorContext';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRoleStore } from '../../hooks/useRoleStore';
import AppHeader from '../../components/AppHeader';

export default function SupervisorHome() {
  const router = useRouter();
  const { user } = useRoleStore();
  const { assignedMiners, loading, error } = useSupervisor();
  const [isTeamToolsExpanded, setIsTeamToolsExpanded] = useState(false);
  const [isWorkerToolsExpanded, setIsWorkerToolsExpanded] = useState(false);
  const [isSupervisorToolsExpanded, setIsSupervisorToolsExpanded] = useState(false);

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

  // Team Tools - for dropdown
  const teamTools = [
    {
      icon: CheckCircle,
      title: 'Team Task Status',
      description: 'Track daily task completion by team',
      route: '/supervisor/TeamTaskStatus',
      color: '#10B981',
    },
    {
      icon: UserCheck,
      title: 'Worker Management',
      description: 'Manage team members and assignments',
      route: '/supervisor/WorkerManagement',
      color: COLORS.accent,
    },
    {
      icon: TrendingUp,
      title: 'Team Performance',
      description: 'View team metrics and achievements',
      route: '/supervisor/TeamPerformance',
      color: COLORS.secondary,
    },
  ];

  // Worker Tools - for dropdown
  const workerTools = [
    {
      icon: Shield,
      title: 'PPE Compliance Monitor',
      description: 'Track PPE scan results and compliance',
      route: '/supervisor/PPEComplianceMonitor',
      color: '#06B6D4',
    },
    {
      icon: Users,
      title: 'Health Monitoring',
      description: 'Monitor miner vitals and fitness',
      route: '/supervisor/HealthMonitoring',
      color: '#EF4444',
    },
    {
      icon: BarChart3,
      title: 'Performance Tracking',
      description: 'Safety scores and achievements',
      route: '/supervisor/PerformanceTracking',
      color: '#8B5CF6',
    },
  ];

  // Emergency features - highest priority
  const emergencyModules = [
    {
      icon: Bell,
      title: 'SOS Alerts',
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
    {
      icon: AlertTriangle,
      title: 'Incident Reports',
      description: 'Review and manage incidents',
      route: '/supervisor/IncidentDashboard',
      color: '#DC2626',
      isEmergency: true,
    },
  ];

  // Supervisor Tools - for dropdown
  const supervisorTools = [
    {
      icon: Sparkles,
      title: 'Smart Work Assignment',
      description: 'AI-powered video matching & assignment',
      route: '/supervisor/SmartWorkAssignment',
      color: COLORS.primary,
    },
    {
      icon: BarChart3,
      title: 'Video Progress Dashboard',
      description: 'Track completion & send reminders',
      route: '/supervisor/VideoProgressDashboard',
      color: '#06B6D4',
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
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header Background Section */}
      <View style={styles.headerBackground}>
        <AppHeader 
          userName={user.name || 'Supervisor'}
          showBack={false}
          showNotifications={true}
          showProfile={true}
        />
        
        {/* Analytics Dashboard - All 6 Stats in One Card */}
        <View style={styles.analyticsWrapper}>
          {/* First Row */}
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

          {/* Second Row */}
          <View style={[styles.statsContainer, styles.statsContainerSecondRow]}>
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
        </View>
      </View>
      
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Emergency Modules - Priority Section - Overlapping Header */}
        <View style={styles.emergencyModulesContainer}>
          <Text style={styles.sectionTitle}>Emergency Controls</Text>
          <View style={styles.emergencyWrapper}>
            <View style={styles.emergencyGrid}>
              {emergencyModules.map((module, index) => (
                <TouchableOpacity
                  key={index}
                  style={styles.emergencyCard}
                  onPress={() => router.push(module.route as any)}
                  activeOpacity={0.8}
                >
                  <View style={styles.emergencyCardContent}>
                    <module.icon size={30} color={module.color} />
                    <Text style={styles.emergencyTitle}>{module.title}</Text>
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </View>

        {/* Team Tools Dropdown Bar */}
        <View style={styles.modulesContainer}>
          <TouchableOpacity 
            style={styles.teamToolsBar}
            onPress={() => setIsTeamToolsExpanded(!isTeamToolsExpanded)}
            activeOpacity={0.7}
          >
            <View style={styles.teamToolsHeader}>
              <Users size={24} color={COLORS.primary} />
              <Text style={styles.teamToolsTitle}>Team Tools</Text>
              {isTeamToolsExpanded ? (
                <ChevronUp size={24} color={COLORS.primary} />
              ) : (
                <ChevronDown size={24} color={COLORS.primary} />
              )}
            </View>
          </TouchableOpacity>

          {/* Dropdown Content */}
          {isTeamToolsExpanded && (
            <View style={styles.teamToolsDropdown}>
              {teamTools.map((tool, index) => (
                <TouchableOpacity
                  key={index}
                  style={styles.teamToolItem}
                  onPress={() => router.push(tool.route as any)}
                  activeOpacity={0.7}
                >
                  <View style={[styles.teamToolIcon, { backgroundColor: tool.color + '20' }]}>
                    <tool.icon size={24} color={tool.color} />
                  </View>
                  <View style={styles.teamToolInfo}>
                    <Text style={styles.teamToolTitle}>{tool.title}</Text>
                    <Text style={styles.teamToolDescription}>{tool.description}</Text>
                  </View>
                  <ChevronRight size={20} color={COLORS.textMuted} />
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>

        {/* Worker Tools Dropdown Bar */}
        <View style={styles.modulesContainer}>
          <TouchableOpacity 
            style={styles.teamToolsBar}
            onPress={() => setIsWorkerToolsExpanded(!isWorkerToolsExpanded)}
            activeOpacity={0.7}
          >
            <View style={styles.teamToolsHeader}>
              <Shield size={24} color="#06B6D4" />
              <Text style={styles.teamToolsTitle}>Worker Tools</Text>
              {isWorkerToolsExpanded ? (
                <ChevronUp size={24} color="#06B6D4" />
              ) : (
                <ChevronDown size={24} color="#06B6D4" />
              )}
            </View>
          </TouchableOpacity>

          {/* Dropdown Content */}
          {isWorkerToolsExpanded && (
            <View style={styles.teamToolsDropdown}>
              {workerTools.map((tool, index) => (
                <TouchableOpacity
                  key={index}
                  style={styles.teamToolItem}
                  onPress={() => router.push(tool.route as any)}
                  activeOpacity={0.7}
                >
                  <View style={[styles.teamToolIcon, { backgroundColor: tool.color + '20' }]}>
                    <tool.icon size={24} color={tool.color} />
                  </View>
                  <View style={styles.teamToolInfo}>
                    <Text style={styles.teamToolTitle}>{tool.title}</Text>
                    <Text style={styles.teamToolDescription}>{tool.description}</Text>
                  </View>
                  <ChevronRight size={20} color={COLORS.textMuted} />
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>

        {/* Supervisor Tools Dropdown Bar */}
        <View style={styles.modulesContainer}>
          <TouchableOpacity 
            style={styles.teamToolsBar}
            onPress={() => setIsSupervisorToolsExpanded(!isSupervisorToolsExpanded)}
            activeOpacity={0.7}
          >
            <View style={styles.teamToolsHeader}>
              <Settings size={24} color="#8B5CF6" />
              <Text style={styles.teamToolsTitle}>Supervisor Tools</Text>
              {isSupervisorToolsExpanded ? (
                <ChevronUp size={24} color="#8B5CF6" />
              ) : (
                <ChevronDown size={24} color="#8B5CF6" />
              )}
            </View>
          </TouchableOpacity>

          {/* Dropdown Content */}
          {isSupervisorToolsExpanded && (
            <View style={styles.teamToolsDropdown}>
              {supervisorTools.map((tool, index) => (
                <TouchableOpacity
                  key={index}
                  style={styles.teamToolItem}
                  onPress={() => router.push(tool.route as any)}
                  activeOpacity={0.7}
                >
                  <View style={[styles.teamToolIcon, { backgroundColor: tool.color + '20' }]}>
                    <tool.icon size={24} color={tool.color} />
                  </View>
                  <View style={styles.teamToolInfo}>
                    <Text style={styles.teamToolTitle}>{tool.title}</Text>
                    <Text style={styles.teamToolDescription}>{tool.description}</Text>
                  </View>
                  <ChevronRight size={20} color={COLORS.textMuted} />
                </TouchableOpacity>
              ))}
            </View>
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
  headerBackground: {
    backgroundColor: '#2C3E50',
    paddingBottom: 130,
    minHeight: 380,
  },
  scrollView: {
    flex: 1,
    marginTop: -110,
  },
  analyticsWrapper: {
    backgroundColor: COLORS.card,
    borderRadius: 16,
    marginHorizontal: 20,
    marginTop: 10,
    marginBottom: 0,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 6,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  statsContainerSecondRow: {
    marginTop: 0,
    marginBottom: 0,
  },
  statCard: {
    flex: 1,
    backgroundColor: COLORS.card,
    borderRadius: 12,
    padding: 14,
    alignItems: 'center',
    marginHorizontal: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 2,
    elevation: 2,
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: COLORS.primary,
  },
  statLabel: {
    fontSize: 10,
    color: COLORS.textMuted,
    marginTop: 4,
    textAlign: 'center',
  },
  modulesContainer: {
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  emergencyModulesContainer: {
    paddingHorizontal: 20,
    marginBottom: 20,
    marginTop: 0,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: 16,
  },
  emergencyWrapper: {
    backgroundColor: COLORS.card,
    borderRadius: 12,
    padding: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  emergencyGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 6,
  },
  emergencyCard: {
    flex: 1,
    backgroundColor: '#2A2D3A',
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 6,
    borderWidth: 0,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
    elevation: 5,
    minHeight: 85,
  },
  emergencyCardContent: {
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
  },
  emergencyIcon: {
    marginBottom: 8,
  },
  emergencyTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: '#FFFFFF',
    textAlign: 'center',
    lineHeight: 14,
    marginTop: 6,
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
  teamToolsBar: {
    backgroundColor: COLORS.card,
    borderRadius: 12,
    marginBottom: 12,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  teamToolsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    backgroundColor: COLORS.card,
  },
  teamToolsTitle: {
    flex: 1,
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.text,
    marginLeft: 12,
  },
  teamToolsDropdown: {
    backgroundColor: COLORS.background,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  teamToolItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  teamToolIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  teamToolInfo: {
    flex: 1,
  },
  teamToolTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 4,
  },
  teamToolDescription: {
    fontSize: 12,
    color: COLORS.textMuted,
    lineHeight: 16,
  },
});
