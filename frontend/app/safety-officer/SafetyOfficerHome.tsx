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
    Phone,
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
      icon: Phone,
      title: 'Miner Call Center',
      description: 'Make toll-free calls to miners',
      route: '/safety-officer/MinerCallCenter',
      color: '#10B981',
      isNew: true,
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
      description: 'Create AI-powered safety quizzes with Gemini',
      route: '/safety-officer/DailyQuizManager',
      color: '#06B6D4',
      gradient: true,
      isNew: true,
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
              const showNew = (module as any).isNew;
              
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
                    {showNew && !showBadge && (
                      <View style={[styles.badge, { backgroundColor: '#10B981' }]}>
                        <Text style={styles.badgeText}>NEW</Text>
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
    gap: 14,
    marginTop: 24,
    marginBottom: 28,
  },
  statCard: {
    flex: 1,
    backgroundColor: COLORS.card,
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: COLORS.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  statValue: {
    fontSize: 28,
    fontWeight: '800',
    color: COLORS.primary,
    marginBottom: 6,
    letterSpacing: -0.5,
  },
  statLabel: {
    fontSize: 13,
    color: COLORS.textMuted,
    fontWeight: '500',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  section: {
    paddingHorizontal: 20,
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: 18,
    letterSpacing: -0.5,
  },
  modulesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 14,
  },
  moduleCard: {
    width: '48%',
    backgroundColor: COLORS.card,
    borderRadius: 18,
    padding: 18,
    borderWidth: 1.5,
    borderColor: COLORS.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 3,
  },
  moduleCardGradient: {
    borderColor: COLORS.primary,
    borderWidth: 2,
    backgroundColor: COLORS.primary + '08',
  },
  moduleIconContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
    position: 'relative',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 2,
  },
  badge: {
    position: 'absolute',
    top: -6,
    right: -6,
    backgroundColor: '#EF4444',
    borderRadius: 14,
    minWidth: 28,
    height: 28,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 8,
    borderWidth: 3,
    borderColor: COLORS.card,
    shadowColor: '#EF4444',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: 0.5,
  },
  moduleTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: 6,
    lineHeight: 20,
    letterSpacing: -0.2,
  },
  moduleDescription: {
    fontSize: 13,
    color: COLORS.textMuted,
    lineHeight: 18,
    fontWeight: '400',
  },
});
