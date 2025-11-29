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
  Video,
  Youtube
} from '../../components/Icons';
import { COLORS } from '../../constants/styles';
import { useRoleStore } from '../../hooks/useRoleStore';

export default function SafetyOfficerHome() {
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
      icon: BarChart3,
      title: 'Analytics Dashboard',
      description: 'View safety metrics and insights',
      route: '/safety-officer/AnalyticsDashboard',
      color: COLORS.secondary,
    },
    {
      icon: AlertTriangle,
      title: 'Emergency Protocols',
      description: 'Manage emergency procedures',
      route: '/safety-officer/EmergencyProtocols',
      color: COLORS.destructive,
    },
    {
      icon: CheckCircle,
      title: 'Compliance Tracker',
      description: 'Monitor compliance status',
      route: '/safety-officer/ComplianceTracker',
      color: COLORS.accent,
    },
    {
      icon: Shield,
      title: 'PPE Config Manager',
      description: 'Configure PPE requirements',
      route: '/safety-officer/PPEConfigManager',
      color: '#8B5CF6',
    },
    {
      icon: Youtube,
      title: 'Video Library',
      description: 'Manage training video library',
      route: '/supervisor/VideoLibrary',
      color: '#EC4899',
    },
    {
      icon: FileText,
      title: 'Testimonial Review',
      description: 'Review miner testimonials',
      route: '/safety-officer/TestimonialReview',
      color: '#F59E0B',
    },
  ];

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.welcomeText}>Welcome back,</Text>
            <Text style={styles.userName}>{user.name || 'Safety Officer'}</Text>
          </View>
          <TouchableOpacity style={styles.settingsButton}>
            <Settings size={24} color={COLORS.text} />
          </TouchableOpacity>
        </View>

        {/* Quick Stats */}
        <View style={styles.statsContainer}>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>156</Text>
            <Text style={styles.statLabel}>Active Miners</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>98%</Text>
            <Text style={styles.statLabel}>Compliance</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>12</Text>
            <Text style={styles.statLabel}>Incidents</Text>
          </View>
        </View>

        {/* Modules Grid */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Safety Management</Text>

          <View style={styles.modulesGrid}>
            {mainModules.map((module, index) => {
              const Icon = module.icon;
              return (
                <TouchableOpacity
                  key={index}
                  style={[
                    styles.moduleCard,
                    module.gradient && styles.moduleCardGradient,
                  ]}
                  onPress={() => router.push(module.route as any)}
                  activeOpacity={0.7}
                >
                  <View
                    style={[
                      styles.moduleIconContainer,
                      { backgroundColor: module.color + '20' },
                    ]}
                  >
                    <Icon size={28} color={module.color} />
                  </View>
                  <Text style={styles.moduleTitle}>{module.title}</Text>
                  <Text style={styles.moduleDescription}>{module.description}</Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        <View style={{ height: 40 }} />
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
    paddingVertical: 20,
  },
  welcomeText: {
    fontSize: 16,
    color: COLORS.textMuted,
  },
  userName: {
    fontSize: 28,
    fontWeight: 'bold',
    color: COLORS.text,
    marginTop: 4,
  },
  settingsButton: {
    padding: 8,
  },
  statsContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    gap: 12,
    marginBottom: 24,
  },
  statCard: {
    flex: 1,
    backgroundColor: COLORS.card,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: COLORS.textMuted,
  },
  section: {
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
    gap: 12,
  },
  moduleCard: {
    width: '48%',
    backgroundColor: COLORS.card,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  moduleCardGradient: {
    borderColor: COLORS.primary,
    borderWidth: 2,
  },
  moduleIconContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
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
