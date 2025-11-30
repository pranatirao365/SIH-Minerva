import { useRouter } from 'expo-router';
import React, { useEffect, useRef, useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { EmergencyButton } from '../../components/EmergencyButton';
import {
  Activity,
  AlertTriangle,
  BarChart3,
  Bell,
  Camera,
  CheckCircle,
  ChevronRight,
  Droplets,
  FileText,
  Heart,
  Lock,
  Map,
  Mic,
  Shield,
  Sparkles,
  Thermometer,
  TrendingUp,
  Trophy,
  Video,
  Wrench,
  Zap
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
    { icon: Shield, label: 'PPE Scan', route: '/miner/PPEScanScreen', color: COLORS.accent },
    { icon: Zap, label: 'Torch', route: '/miner/Torch', color: '#F59E0B' },
    { icon: CheckCircle, label: 'Daily Check-in', route: '/miner/DailyCheckIn', color: '#10B981' },
  ];

  const safetyFeatures = [
    { icon: Map, label: 'Heat Map', route: '/miner/HeatMapView', color: COLORS.primary },
    { icon: Camera, label: 'Hazard Scan', route: '/miner/HazardScan', color: COLORS.destructive },
    { icon: AlertTriangle, label: 'Report', route: '/miner/IncidentReport', color: '#F59E0B' },
    { icon: Trophy, label: 'Fire Safety', route: '/miner/SimulationScreen', color: '#DC2626' },
    { icon: Trophy, label: 'Blasting', route: '/miner/BlastingGame', color: '#F59E0B' },
    { icon: Heart, label: 'Health Monitor', route: '/miner/SmartHelmetStatus', color: '#EC4899' },
    { icon: Sparkles, label: 'AI Assistant', route: '/chat', color: '#8B5CF6' },
    { icon: Wrench, label: 'Equipment Check', route: '/miner/EquipmentCheck', color: '#6366F1' },
    { icon: FileText, label: 'Case Studies', route: '/miner/CaseStudies', color: '#0EA5E9' },
    { icon: BarChart3, label: 'Progress', route: '/miner/Progress', color: '#14B8A6' },
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

          {/* Quick Actions - Overlapping */}
          <View style={styles.quickActionsWrapper}>
            <Text style={styles.quickActionsTitle}>Quick Actions</Text>
            
            <View style={styles.quickActionsContainer}>
              <View style={styles.quickActionsRow}>
                {quickActions.map((action, index) => {
                  const Icon = action.icon;
                  return (
                    <TouchableOpacity
                      key={index}
                      onPress={() => router.push(action.route as any)}
                      style={styles.quickActionItem}
                      activeOpacity={0.7}
                    >
                      <View style={styles.quickActionCard}>
                        <Icon size={30} color={action.color} />
                        <Text style={styles.quickActionLabel}>{action.label}</Text>
                      </View>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>
          </View>
        </View>

        {/* Spacing for overlapping content */}
        <View style={styles.overlapSpacer} />

        {/* Smart Helmet Status Widget */}
        <View style={styles.section}>
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
                  <Thermometer size={20} color={helmetData.env.temp !== null && helmetData.env.temp > 35 ? '#F59E0B' : '#6B7280'} />
                  <Text style={styles.sensorLabel}>Temperature:</Text>
                  <Text style={[styles.sensorValue, helmetData.env.temp !== null && helmetData.env.temp > 35 && styles.warningValue]}>
                    {helmetData.env.temp !== null ? `${helmetData.env.temp.toFixed(1)}°C` : 'N/A'}
                  </Text>
                </View>

                {/* Humidity */}
                <View style={styles.sensorRow}>
                  <Droplets size={20} color="#6B7280" />
                  <Text style={styles.sensorLabel}>Humidity:</Text>
                  <Text style={styles.sensorValue}>
                    {helmetData.env.hum !== null ? `${helmetData.env.hum.toFixed(0)}%` : 'N/A'}
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
                    size={28} 
                    color={module.locked ? '#525252' : module.completed ? COLORS.accent : COLORS.primary} 
                  />
                  <View style={styles.moduleContent}>
                    <Text style={[
                      styles.moduleLabel,
                      module.locked && styles.moduleLabelLocked
                    ]}>
                      {module.label}
                    </Text>
                    {module.completed && (
                      <Text style={styles.completedText}>✓ Completed</Text>
                    )}
                  </View>
                  {module.locked && (
                    <Lock size={20} color="#6B7280" />
                  )}
                </TouchableOpacity>
              );
            })}
          </View>
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

        {/* Safety Features */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Safety Features</Text>
          
          {/* First 9 features in 3x3 grid */}
          <View style={styles.safetyFeaturesGrid}>
            {safetyFeatures.slice(0, 9).map((action, index) => {
              const Icon = action.icon;
              return (
                <TouchableOpacity
                  key={index}
                  onPress={() => router.push(action.route as any)}
                  style={styles.safetyFeatureItem}
                  activeOpacity={0.7}
                >
                  <View style={styles.safetyFeatureCard}>
                    <Icon size={28} color={action.color} />
                    <Text style={styles.safetyFeatureLabel}>{action.label}</Text>
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Progress feature spanning full width */}
          {safetyFeatures[9] && (
            <TouchableOpacity
              onPress={() => router.push(safetyFeatures[9].route as any)}
              style={styles.progressFeatureWrapper}
              activeOpacity={0.7}
            >
              <View style={styles.progressFeatureCard}>
                <BarChart3 size={32} color={safetyFeatures[9].color} />
                <Text style={styles.progressFeatureLabel}>{safetyFeatures[9].label}</Text>
              </View>
            </TouchableOpacity>
          )}
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
    paddingTop: 24,
    paddingBottom: 115,
    backgroundColor: '#1a252f',
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  quickActionsWrapper: {
    position: 'absolute',
    bottom: -45,
    left: 24,
    right: 24,
    zIndex: 10,
    marginTop: 20,
  },
  quickActionsTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: 8,
  },
  overlapSpacer: {
    height: 50,
  },
  welcomeText: {
    fontSize: 14,
    color: '#BDC3C7',
  },
  userName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
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
    flexDirection: 'column',
    gap: 12,
  },
  moduleCard: {
    width: '100%',
    backgroundColor: COLORS.card,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 16,
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    minHeight: 60,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  moduleCardLocked: {
    opacity: 0.5,
    backgroundColor: COLORS.card,
  },
  moduleCardCompleted: {
    backgroundColor: COLORS.accent + '20',
    borderColor: COLORS.accent,
  },
  moduleContent: {
    flex: 1,
    justifyContent: 'center',
  },
  moduleLabel: {
    fontWeight: '600',
    color: COLORS.text,
    fontSize: 15,
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
  quickActionsContainer: {
    backgroundColor: COLORS.card,
    borderRadius: 18,
    padding: 12,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 4,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  quickActionsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 10,
  },
  quickActionItem: {
    flex: 1,
    aspectRatio: 1.1,
  },
  quickActionCard: {
    flex: 1,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 10,
    backgroundColor: COLORS.card,
    borderWidth: 1,
    borderColor: COLORS.border,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  quickActionLabel: {
    marginTop: 6,
    fontWeight: '500',
    color: COLORS.text,
    textAlign: 'center',
    fontSize: 11,
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
  safetyFeaturesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  safetyFeatureItem: {
    width: '31.5%',
    marginBottom: 12,
    aspectRatio: 1,
  },
  safetyFeatureCard: {
    padding: 12,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
    backgroundColor: COLORS.card,
    borderWidth: 1,
    borderColor: COLORS.border,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  safetyFeatureLabel: {
    marginTop: 8,
    fontWeight: '600',
    color: COLORS.text,
    textAlign: 'center',
    fontSize: 11,
  },
  progressFeatureWrapper: {
    width: '100%',
  },
  progressFeatureCard: {
    padding: 16,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 12,
    minHeight: 80,
    backgroundColor: COLORS.card,
    borderWidth: 1,
    borderColor: COLORS.border,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  progressFeatureLabel: {
    fontWeight: '600',
    color: COLORS.text,
    fontSize: 16,
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
