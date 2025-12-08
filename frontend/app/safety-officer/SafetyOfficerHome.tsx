import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
    AlertTriangle,
    BarChart3,
    BookOpen,
    CheckCircle,
    FileText,
    MapPin,
    Settings,
    Shield,
    Video,
    Youtube
} from '../../components/Icons';
import { COLORS } from '../../constants/styles';
import { useRoleStore } from '../../hooks/useRoleStore';
import { getTestimonialStats } from '../../services/testimonialService';
import AppHeader from '../../components/AppHeader';

export default function SafetyOfficerHome() {
  const router = useRouter();
  const { user } = useRoleStore();
  const [pendingTestimonialsCount, setPendingTestimonialsCount] = useState(0);

  useEffect(() => {
    loadPendingCount();
    // Refresh every 30 seconds
    const interval = setInterval(loadPendingCount, 30000);
    return () => clearInterval(interval);
  }, []);

  const loadPendingCount = async () => {
    try {
      const stats = await getTestimonialStats();
      setPendingTestimonialsCount(stats.pending);
    } catch (error) {
      console.error('Error loading testimonial stats:', error);
    }
  };

  const mainModules = [
    {
      icon: AlertTriangle,
      title: 'Alert Miners',
      description: 'Send emergency alerts to miners\' helmets',
      route: '/safety-officer/AlertMiners',
      color: '#F59E0B',
    },
    {
      icon: Video,
      title: 'AI Video Generator',
      description: 'Create safety training videos with AI',
      route: '/safety-officer/VideoGenerationModule',
      color: COLORS.primary,
      gradient: true,
    },
    {
      icon: Youtube,
      title: 'Video Library',
      description: 'Browse all generated videos',
      route: '/safety-officer/VideoLibrary',
      color: '#EC4899',
    },
    {
      icon: MapPin,
      title: 'Hazard Zone Visualization',
      description: 'Explore 3D mine zone visualizations',
      route: '/safety-officer/HazardZoneHeatMap',
      color: '#06B6D4',
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
      icon: Video,
      title: 'Video Requests',
      description: 'Handle supervisor video requests',
      route: '/safety-officer/VideoRequestHandler',
      color: '#10B981',
    },
    {
      icon: FileText,
      title: 'Testimonial Review',
      description: 'Review miner testimonials',
      route: '/safety-officer/TestimonialReview',
      color: '#F59E0B',
    },
    {
      icon: BookOpen,
      title: 'Daily Quiz Manager',
      description: 'Create AI-generated safety quizzes',
      route: '/safety-officer/DailyQuizManager',
      color: '#06B6D4',
      gradient: true,
    },
  ];

  return (
    <SafeAreaView style={styles.container}>
      <AppHeader 
        userName={user.name || 'Safety Officer'}
        showBack={false}
        showNotifications={true}
        showProfile={true}
      />
      
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
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
              const showBadge = module.title === 'Testimonial Review' && pendingTestimonialsCount > 0;
              
              return (
                <TouchableOpacity
                  key={index}
                  style={[
                    styles.moduleCard,
                    module.gradient && styles.moduleCardGradient,
                  ]}
                  onPress={() => {
                    router.push(module.route as any);
                    if (showBadge) loadPendingCount();
                  }}
                  activeOpacity={0.7}
                >
                  <View
                    style={[
                      styles.moduleIconContainer,
                      { backgroundColor: module.color + '20' },
                    ]}
                  >
                    <Icon size={28} color={module.color} />
                    {showBadge && (
                      <View style={styles.badge}>
                        <Text style={styles.badgeText}>{pendingTestimonialsCount}</Text>
                      </View>
                    )}
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
  statsContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    gap: 12,
    marginTop: 20,
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
    position: 'relative',
  },
  badge: {
    position: 'absolute',
    top: -4,
    right: -4,
    backgroundColor: '#EF4444',
    borderRadius: 12,
    minWidth: 24,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 6,
    borderWidth: 2,
    borderColor: COLORS.card,
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FFFFFF',
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
