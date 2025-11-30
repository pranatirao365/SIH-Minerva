import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { EmergencyButton } from '../../components/EmergencyButton';
import {
  AlertTriangle,
  Bell,
  Camera,
  CheckCircle,
  Lock,
  Map,
  Mic,
  Shield,
  TrendingUp,
  Trophy,
  Video
} from '../../components/Icons';
import { OfflineBanner } from '../../components/OfflineBanner';
import { COLORS } from '../../constants/styles';
import { useRoleStore } from '../../hooks/useRoleStore';
import { translator } from '../../services/translator';
import GamingModule from './GamingModule';

export default function MinerHome() {
  const router = useRouter();
  const { user, moduleProgress, safetyScore } = useRoleStore();
  const [showInlineGame, setShowInlineGame] = useState(false);

  const quickActions = [
    { icon: Map, label: 'Heat Map', route: '/miner/HeatMapView', color: COLORS.primary },
    { icon: Camera, label: 'Hazard Scan', route: '/miner/HazardScan', color: COLORS.destructive },
    { icon: Shield, label: 'PPE Scan', route: '/miner/PPEScanScreen', color: COLORS.accent },
    { icon: AlertTriangle, label: 'Report', route: '/miner/IncidentReport', color: '#F59E0B' },
    { icon: Trophy, label: 'Fire Safety', route: '/miner/SimulationScreen', color: '#DC2626' },
    { icon: Trophy, label: 'Blasting', route: '/miner/BlastingGame', color: '#F59E0B' },
  ];

  const trainingModules = [
    { 
      icon: Video, 
      label: 'Watch Video', 
      route: '/miner/SafetyVideoPlayer', 
      completed: moduleProgress.video,
      locked: false
    },
    { 
      icon: Mic, 
      label: 'Voice Briefing', 
      route: '/miner/VoiceBriefing', 
      completed: moduleProgress.briefing,
      locked: !moduleProgress.video
    },
    { 
      icon: CheckCircle, 
      label: 'Take Quiz', 
      route: '/miner/SafetyQuiz', 
      completed: moduleProgress.quiz,
      locked: !moduleProgress.briefing
    },
    { 
      icon: Trophy, 
      label: 'Play Game', 
      route: '/miner/GamingModule', 
      completed: moduleProgress.game,
      locked: true
    },
  ];

  return (
    <SafeAreaView style={styles.container}>
      <OfflineBanner />
      
      <ScrollView style={styles.scrollView}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.welcomeText}>Welcome back,</Text>
          <Text style={styles.userName}>{user.name || 'Miner'}</Text>
          
          {/* Safety Score */}
          <View style={styles.scoreCard}>
            <View style={styles.scoreContent}>
              <View>
                <Text style={styles.scoreLabel}>
                  {translator.translate('safetyScore')}
                </Text>
                <Text style={styles.scoreValue}>{safetyScore}%</Text>
              </View>
              <TrendingUp size={40} color={COLORS.primary} />
            </View>
          </View>
        </View>

        {/* Training Progress */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            {translator.translate('safetyTraining')}
          </Text>
          
          <View style={styles.moduleGrid}>
            {trainingModules.map((module, index) => {
              const Icon = module.icon;
              return (
                <TouchableOpacity
                  key={index}
                  onPress={() => !module.locked && (module.route === '/miner/GamingModule' ? setShowInlineGame(true) : router.push(module.route as any))}
                  disabled={module.locked}
                  style={[
                    styles.moduleCard,
                    module.locked && styles.moduleCardLocked,
                    module.completed && styles.moduleCardCompleted,
                  ]}
                  activeOpacity={0.7}
                >
                  <Icon 
                    size={32} 
                    color={module.locked ? '#525252' : module.completed ? COLORS.accent : COLORS.primary} 
                  />
                  <Text style={[
                    styles.moduleLabel,
                    module.locked && styles.moduleLabelLocked
                  ]}>
                    {module.label}
                  </Text>
                  {module.completed && (
                    <Text style={styles.completedText}>✓ Completed</Text>
                  )}
                  {module.locked && (
                    <Text style={styles.lockedText}>🔒 Locked</Text>
                  )}
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* Assigned Videos Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Mandatory Videos</Text>
          <TouchableOpacity
            onPress={() => router.push('/miner/AssignedVideos' as any)}
            style={styles.assignedVideosCard}
            activeOpacity={0.7}
          >
            <View style={styles.assignedVideosContent}>
              <Video size={32} color={COLORS.primary} />
              <View style={styles.assignedVideosInfo}>
                <Text style={styles.assignedVideosTitle}>View Assigned Videos</Text>
                <Text style={styles.assignedVideosSubtitle}>
                  Watch mandatory training videos before entering work routes
                </Text>
              </View>
              <Lock size={20} color={COLORS.textMuted} />
            </View>
          </TouchableOpacity>
        </View>

        {/* Inline Game Container (expanded on demand) */}
        {showInlineGame && (
          <View style={[styles.section, { paddingTop: 0 }]}>
            <Text style={styles.sectionTitle}>Play: Safety Reflex Game</Text>
            <View style={{ height: 420 }}>
              <GamingModule inline onClose={() => setShowInlineGame(false)} />
            </View>
          </View>
        )}

        {/* Quick Actions */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Quick Actions</Text>
          
          <View style={styles.actionGrid}>
            {quickActions.map((action, index) => {
              const Icon = action.icon;
              return (
                <TouchableOpacity
                  key={index}
                  onPress={() => router.push(action.route as any)}
                  style={styles.actionCardWrapper}
                  activeOpacity={0.7}
                >
                  <View style={[styles.actionCard, { backgroundColor: action.color + '20' }]}>
                    <Icon size={32} color={action.color} />
                    <Text style={styles.actionLabel}>{action.label}</Text>
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* Recent Notifications */}
        <View style={[styles.section, styles.lastSection]}>
          <TouchableOpacity 
            onPress={() => router.push('/miner/NotificationsScreen' as any)}
            style={styles.notificationHeader}
          >
            <Text style={styles.sectionTitle}>Recent Updates</Text>
            <Bell size={20} color={COLORS.primary} />
          </TouchableOpacity>
          
          <View style={styles.notificationCard}>
            <Text style={styles.notificationTitle}>Safety Alert</Text>
            <Text style={styles.notificationText}>
              Complete your weekly training module
            </Text>
            <Text style={styles.notificationTime}>2 hours ago</Text>
          </View>
        </View>
      </ScrollView>

      <EmergencyButton />
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
    paddingHorizontal: 24,
    paddingVertical: 24,
    backgroundColor: COLORS.card,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  welcomeText: {
    fontSize: 14,
    color: COLORS.textMuted,
  },
  userName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: COLORS.text,
    marginTop: 4,
  },
  scoreCard: {
    marginTop: 16,
    backgroundColor: COLORS.primary + '20',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: COLORS.primary,
  },
  scoreContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  scoreLabel: {
    fontSize: 14,
    color: COLORS.textMuted,
  },
  scoreValue: {
    fontSize: 32,
    fontWeight: 'bold',
    color: COLORS.text,
    marginTop: 4,
  },
  section: {
    paddingHorizontal: 24,
    paddingVertical: 24,
  },
  lastSection: {
    paddingBottom: 100,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: 16,
  },
  moduleGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  moduleCard: {
    width: '48%',
    backgroundColor: COLORS.card,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  moduleCardLocked: {
    opacity: 0.5,
    backgroundColor: COLORS.card,
  },
  moduleCardCompleted: {
    backgroundColor: COLORS.accent + '20',
    borderColor: COLORS.accent,
  },
  moduleLabel: {
    marginTop: 8,
    fontWeight: '600',
    color: COLORS.text,
  },
  moduleLabelLocked: {
    color: COLORS.textMuted,
  },
  completedText: {
    fontSize: 12,
    color: COLORS.accent,
    marginTop: 4,
  },
  lockedText: {
    fontSize: 12,
    color: COLORS.textMuted,
    marginTop: 4,
  },
  actionGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  actionCardWrapper: {
    width: '48%',
    marginBottom: 16,
  },
  actionCard: {
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  actionLabel: {
    marginTop: 8,
    fontWeight: '600',
    color: COLORS.text,
    textAlign: 'center',
  },
  notificationHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  notificationCard: {
    backgroundColor: COLORS.card,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: 16,
  },
  notificationTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text,
  },
  notificationText: {
    fontSize: 14,
    color: COLORS.textMuted,
    marginTop: 4,
  },
  notificationTime: {
    fontSize: 12,
    color: COLORS.textMuted,
    marginTop: 8,
  },
  assignedVideosCard: {
    backgroundColor: COLORS.card,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: 16,
  },
  assignedVideosContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  assignedVideosInfo: {
    flex: 1,
    marginLeft: 16,
  },
  assignedVideosTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text,
  },
  assignedVideosSubtitle: {
    fontSize: 14,
    color: COLORS.textMuted,
    marginTop: 4,
  },
});
