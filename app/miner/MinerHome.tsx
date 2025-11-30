import { useRouter } from 'expo-router';
import React, { useEffect, useRef, useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { EmergencyButton } from '../../components/EmergencyButton';
import {
  Activity,
  AlertTriangle,
  Bell,
  Camera,
  CheckCircle,
  ChevronRight,
  Droplets,
  Heart,
  Lock,
  Map,
  Mic,
  Shield,
  Thermometer,
  TrendingUp,
  Trophy,
  Video
} from '../../components/Icons';
import { OfflineBanner } from '../../components/OfflineBanner';
import { getWebSocketURL } from '../../config/smartHelmetConfig';
import { COLORS } from '../../constants/styles';
import { useRoleStore } from '../../hooks/useRoleStore';
import { translator } from '../../services/translator';
import GamingModule from './GamingModule';

interface HelmetData {
  env: {
    temp: number | null;
    hum: number | null;
  };
  helmet: {
    worn: boolean;
  };
  pulse: {
    bpm: number;
    spo2: number;
    signal?: number;  // Optional, not used with MAX30100
  };
  emergency: boolean;
}

export default function MinerHome() {
  const router = useRouter();
  const { user, moduleProgress, safetyScore } = useRoleStore();
  const [showInlineGame, setShowInlineGame] = useState(false);
  
  // Smart Helmet WebSocket State
  const [helmetConnected, setHelmetConnected] = useState(false);
  const [helmetData, setHelmetData] = useState<HelmetData | null>(null);
  const wsRef = useRef<WebSocket | null>(null);

  // Initialize WebSocket for Smart Helmet
  useEffect(() => {
    const connectHelmet = () => {
      try {
        const ws = new WebSocket(getWebSocketURL());
        
        ws.onopen = () => {
          setHelmetConnected(true);
        };

        ws.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data) as HelmetData;
            setHelmetData(data);

            // Alert for emergency - Hardware button pressed
            if (data.emergency) {
              Alert.alert(
                '🚨 SOS ALERT SENT', 
                'Your emergency alert has been sent to Supervisors and Safety Officers. Help is on the way. Stay calm and follow safety protocols.',
                [{ text: 'OK' }]
              );
            }
          } catch (error) {
            console.error('Error parsing helmet data:', error);
          }
        };

        ws.onerror = () => setHelmetConnected(false);
        ws.onclose = () => {
          setHelmetConnected(false);
          // Retry connection after 5 seconds
          setTimeout(connectHelmet, 5000);
        };

        wsRef.current = ws;
      } catch (error) {
        console.error('Failed to connect to helmet:', error);
      }
    };

    connectHelmet();

    return () => {
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, []);

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

          {/* Smart Helmet Status Widget */}
          <View style={styles.helmetCard}>
            <View style={styles.helmetHeader}>
              <View style={styles.helmetTitleRow}>
                <Activity size={24} color="#10B981" />
                <Text style={styles.helmetTitle}>Smart Helmet</Text>
              </View>
              <View style={[styles.connectionStatus, helmetConnected ? styles.connected : styles.disconnected]}>
                <View style={[styles.connectionDot, helmetConnected ? styles.connectedDot : styles.disconnectedDot]} />
                <Text style={styles.connectionText}>
                  {helmetConnected ? 'Connected' : 'Disconnected'}
                </Text>
              </View>
            </View>

            {helmetConnected && helmetData ? (
              <View style={styles.helmetDataContainer}>
                {/* Emergency Status */}
                {helmetData.emergency && (
                  <View style={styles.emergencyBanner}>
                    <AlertTriangle size={20} color="#fff" />
                    <Text style={styles.emergencyText}>EMERGENCY BUTTON PRESSED</Text>
                  </View>
                )}

                {/* Helmet Detection */}
                <View style={[styles.sensorRow, !helmetData.helmet.worn && styles.helmetAlert]}>
                  <Shield size={20} color={helmetData.helmet.worn ? '#10B981' : '#F59E0B'} />
                  <Text style={styles.sensorLabel}>Helmet Status:</Text>
                  <Text style={[styles.sensorValue, !helmetData.helmet.worn && styles.warningValue]}>
                    {helmetData.helmet.worn ? 'Worn ✓' : 'Not Worn ⚠️'}
                  </Text>
                </View>

                {/* Heart Rate */}
                <View style={[styles.sensorRow, (helmetData.pulse.bpm < 60 || helmetData.pulse.bpm > 100) && helmetData.pulse.bpm > 0 && styles.pulseAlert]}>
                  <Heart size={20} color={
                    helmetData.pulse.bpm === 0 ? '#6B7280' : 
                    (helmetData.pulse.bpm < 60 || helmetData.pulse.bpm > 100) ? '#EF4444' : '#10B981'
                  } />
                  <Text style={styles.sensorLabel}>Heart Rate:</Text>
                  <Text style={[
                    styles.sensorValue, 
                    (helmetData.pulse.bpm < 60 || helmetData.pulse.bpm > 100) && helmetData.pulse.bpm > 0 && styles.alertValue
                  ]}>
                    {helmetData.pulse.bpm > 0 ? `${helmetData.pulse.bpm} BPM` : 'No Signal'}
                  </Text>
                </View>

                {/* SpO2 (Blood Oxygen) */}
                <View style={[styles.sensorRow, helmetData.pulse.spo2 < 90 && helmetData.pulse.spo2 > 0 && styles.pulseAlert]}>
                  <Droplets size={20} color={
                    helmetData.pulse.spo2 === 0 ? '#6B7280' : 
                    helmetData.pulse.spo2 < 90 ? '#EF4444' : 
                    helmetData.pulse.spo2 < 95 ? '#F59E0B' : '#10B981'
                  } />
                  <Text style={styles.sensorLabel}>Blood Oxygen (SpO2):</Text>
                  <Text style={[
                    styles.sensorValue,
                    helmetData.pulse.spo2 < 90 && helmetData.pulse.spo2 > 0 && styles.alertValue,
                    helmetData.pulse.spo2 >= 90 && helmetData.pulse.spo2 < 95 && styles.warningValue
                  ]}>
                    {helmetData.pulse.spo2 > 0 ? `${helmetData.pulse.spo2}%` : 'No Signal'}
                  </Text>
                </View>

                {/* Temperature */}
                <View style={styles.sensorRow}>
                  <Thermometer size={20} color={helmetData.env.temp > 35 ? '#F59E0B' : '#6B7280'} />
                  <Text style={styles.sensorLabel}>Temperature:</Text>
                  <Text style={[styles.sensorValue, helmetData.env.temp > 35 && styles.warningValue]}>
                    {helmetData.env.temp.toFixed(1)}°C
                  </Text>
                </View>

                {/* Humidity */}
                <View style={styles.sensorRow}>
                  <Droplets size={20} color="#6B7280" />
                  <Text style={styles.sensorLabel}>Humidity:</Text>
                  <Text style={styles.sensorValue}>
                    {helmetData.env.hum.toFixed(0)}%
                  </Text>
                </View>

                {/* Tap for details */}
                <TouchableOpacity 
                  style={styles.detailsButton}
                  onPress={() => router.push('/miner/SmartHelmetStatus')}
                >
                  <Text style={styles.detailsButtonText}>View Full Details</Text>
                  <ChevronRight size={16} color={COLORS.primary} />
                </TouchableOpacity>
              </View>
            ) : (
              <View style={styles.helmetDisconnected}>
                <Text style={styles.disconnectedMessage}>
                  {helmetConnected ? 'Waiting for data...' : 'Helmet not connected'}
                </Text>
                <Text style={styles.disconnectedSubtext}>
                  Check helmet power and WiFi connection
                </Text>
              </View>
            )}
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
  // Assigned Videos Widget Styles
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
  // Smart Helmet Widget Styles
  helmetCard: {
    marginTop: 16,
    backgroundColor: COLORS.card,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: 16,
  },
  helmetHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  helmetTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  helmetTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.text,
  },
  connectionStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    gap: 6,
  },
  connected: {
    backgroundColor: '#10B98120',
  },
  disconnected: {
    backgroundColor: '#6B728020',
  },
  connectionDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  connectedDot: {
    backgroundColor: '#10B981',
  },
  disconnectedDot: {
    backgroundColor: '#6B7280',
  },
  connectionText: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.text,
  },
  helmetDataContainer: {
    gap: 10,
  },
  emergencyBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EF4444',
    borderRadius: 8,
    padding: 12,
    gap: 8,
  },
  emergencyText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 14,
  },
  sensorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.background,
    borderRadius: 8,
    padding: 12,
    gap: 10,
  },
  gasAlert: {
    backgroundColor: '#FEE2E2',
    borderWidth: 1,
    borderColor: '#EF4444',
  },
  helmetAlert: {
    backgroundColor: '#FEF3C7',
    borderWidth: 1,
    borderColor: '#F59E0B',
  },
  pulseAlert: {
    backgroundColor: '#FEF3C7',
    borderWidth: 1,
    borderColor: '#F59E0B',
  },
  sensorLabel: {
    fontSize: 14,
    color: COLORS.textMuted,
    flex: 1,
  },
  sensorValue: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.text,
  },
  alertValue: {
    color: '#EF4444',
  },
  warningValue: {
    color: '#F59E0B',
  },
  detailsButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
    paddingVertical: 10,
    borderRadius: 8,
    backgroundColor: COLORS.primary + '10',
    gap: 4,
  },
  detailsButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.primary,
  },
  helmetDisconnected: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  disconnectedMessage: {
    fontSize: 14,
    color: COLORS.textMuted,
    textAlign: 'center',
  },
  disconnectedSubtext: {
    fontSize: 12,
    color: COLORS.textMuted,
    marginTop: 4,
    textAlign: 'center',
  },
});
