import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, ImageBackground } from 'react-native';
import { POST_BLAST_DATA } from '../../../data/blastingGameData';

interface PostBlastVerificationProps {
  language: 'en' | 'hi';
  onComplete: () => void;
  onXPEarned: (xp: number) => void;
}

const PostBlastVerification: React.FC<PostBlastVerificationProps> = ({ language, onComplete, onXPEarned }) => {
  const [currentTaskIndex, setCurrentTaskIndex] = useState(0);
  const [taskCompleted, setTaskCompleted] = useState(false);
  const [craterData, setCraterData] = useState<any>(null);
  const [flyrockData, setFlyrockData] = useState<any>(null);
  const [zonesVisible, setZonesVisible] = useState(false);

  const currentTask = POST_BLAST_DATA.tasks[currentTaskIndex];

  const handleInspectCrater = () => {
    setCraterData(currentTask.metrics);
    setTaskCompleted(true);
    onXPEarned(25);
  };

  const handleCheckFlyrock = () => {
    setFlyrockData(currentTask.metrics);
    setTaskCompleted(true);
    onXPEarned(25);
  };

  const handleAuthorizeReentry = () => {
    setZonesVisible(true);
    setTaskCompleted(true);
    onXPEarned(25);
  };

  const handleNextTask = () => {
    if (currentTaskIndex < POST_BLAST_DATA.tasks.length - 1) {
      setCurrentTaskIndex(prev => prev + 1);
      setTaskCompleted(false);
    } else {
      onComplete();
    }
  };

  const getTaskHandler = () => {
    switch (currentTask.id) {
      case 'crater_inspection':
        return handleInspectCrater;
      case 'flyrock_check':
        return handleCheckFlyrock;
      case 'reentry_clearance':
        return handleAuthorizeReentry;
      default:
        return () => {};
    }
  };

  return (
    <ImageBackground
      source={require('../../../assets/images/phase4.png')}
      style={styles.container}
      resizeMode="cover"
    >
      <View style={styles.overlay} />
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>
          🔍 {language === 'en' ? 'POST-BLAST VERIFICATION' : 'ब्लास्ट के बाद सत्यापन'}
        </Text>
        <Text style={styles.headerSubtitle}>
          {language === 'en' ? `Task ${currentTaskIndex + 1} of ${POST_BLAST_DATA.tasks.length}` : `कार्य ${currentTaskIndex + 1} का ${POST_BLAST_DATA.tasks.length}`}
        </Text>
      </View>

      <ScrollView style={styles.content} contentContainerStyle={styles.contentContainer}>
        {/* Crater Inspection */}
        {currentTask.id === 'crater_inspection' && (
          <View style={styles.card}>
            <View style={styles.craterVisualization}>
              <Text style={styles.craterIcon}>🕳️</Text>
              <Text style={styles.craterLabel}>
                {language === 'en' ? 'BLAST CRATER' : 'ब्लास्ट गड्ढा'}
              </Text>
            </View>

            {craterData && (
              <View style={styles.metricsGrid}>
                <View style={styles.metricCard}>
                  <Text style={styles.metricLabel}>
                    {language === 'en' ? 'Depth' : 'गहराई'}
                  </Text>
                  <Text style={styles.metricValue}>{craterData.depth}</Text>
                </View>
                <View style={styles.metricCard}>
                  <Text style={styles.metricLabel}>
                    {language === 'en' ? 'Fragment Quality' : 'टुकड़ा गुणवत्ता'}
                  </Text>
                  <Text style={styles.metricValue}>{craterData.fragmentQuality}</Text>
                </View>
                <View style={styles.metricCard}>
                  <Text style={styles.metricLabel}>
                    {language === 'en' ? 'Target Range' : 'लक्ष्य सीमा'}
                  </Text>
                  <Text style={styles.metricValue}>{craterData.targetRange ? '✓' : '✗'}</Text>
                </View>
              </View>
            )}
          </View>
        )}

        {/* Flyrock Check */}
        {currentTask.id === 'flyrock_check' && (
          <View style={styles.card}>
            <Text style={styles.flyrockTitle}>
              {language === 'en' ? '🪨 FLYROCK ANALYSIS' : '🪨 फ्लाईरॉक विश्लेषण'}
            </Text>

            {flyrockData && (
              <View style={styles.flyrockInfo}>
                <Text style={styles.flyrockLabel}>
                  {language === 'en' ? 'Maximum Distance:' : 'अधिकतम दूरी:'}
                </Text>
                <Text style={styles.flyrockValue}>{flyrockData.maxDistance}m</Text>
                <Text style={[styles.flyrockStatus, flyrockData.controlled && styles.flyrockSafe]}>
                  {flyrockData.controlled
                    ? (language === 'en' ? '✅ CONTROLLED' : '✅ नियंत्रित')
                    : (language === 'en' ? '⚠️ HAZARD' : '⚠️ खतरा')
                  }
                </Text>
              </View>
            )}
          </View>
        )}

        {/* Re-entry Clearance */}
        {currentTask.id === 'reentry_clearance' && (
          <View style={styles.card}>
            <Text style={styles.zonesTitle}>
              {language === 'en' ? '🔒 SAFETY ZONES' : '🔒 सुरक्षा क्षेत्र'}
            </Text>

            {zonesVisible && (
              <View style={styles.zonesContainer}>
                {currentTask.zones?.map((zone: any) => (
                  <View key={zone.id} style={[styles.zoneCard, { borderColor: zone.color }]}>
                    <View style={[styles.zoneIndicator, { backgroundColor: zone.color }]} />
                    <Text style={styles.zoneText}>{zone.label[language]}</Text>
                  </View>
                ))}
              </View>
            )}
          </View>
        )}

        {/* Action Button */}
        <TouchableOpacity
          style={[styles.actionButton, taskCompleted && styles.actionButtonComplete]}
          onPress={taskCompleted ? handleNextTask : getTaskHandler()}
          activeOpacity={0.8}
        >
          <Text style={styles.actionButtonText}>
            {taskCompleted
              ? (currentTaskIndex < POST_BLAST_DATA.tasks.length - 1
                  ? (language === 'en' ? 'NEXT TASK →' : 'अगला कार्य →')
                  : (language === 'en' ? 'COMPLETE ✓' : 'पूर्ण ✓'))
              : currentTask.buttonText[language]
            }
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </ImageBackground>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
  },
  header: {
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    paddingVertical: 16,
    paddingHorizontal: 16,
    marginTop: 80,
  },
  headerTitle: { color: '#fff', fontSize: 24, fontWeight: '700', textAlign: 'center' },
  headerSubtitle: { color: '#fde047', fontSize: 14, textAlign: 'center', marginTop: 4 },
  content: { flex: 1 },
  contentContainer: { padding: 20, gap: 20 },
  card: {
    backgroundColor: 'rgba(0, 0, 0, 0.85)',
    borderRadius: 16,
    padding: 24,
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  craterVisualization: { alignItems: 'center', marginBottom: 24 },
  craterIcon: { fontSize: 80, marginBottom: 8 },
  craterLabel: { color: '#fff', fontSize: 20, fontWeight: '700' },
  metricsGrid: { flexDirection: 'row', gap: 12 },
  metricCard: {
    flex: 1,
    backgroundColor: 'rgba(59, 130, 246, 0.5)',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  metricLabel: { color: '#93c5fd', fontSize: 12, marginBottom: 8 },
  metricValue: { color: '#fff', fontSize: 20, fontWeight: '700' },
  flyrockTitle: { color: '#fff', fontSize: 24, fontWeight: '700', textAlign: 'center', marginBottom: 24 },
  flyrockInfo: { alignItems: 'center' },
  flyrockLabel: { color: '#d1d5db', fontSize: 16, marginBottom: 8 },
  flyrockValue: { color: '#fff', fontSize: 32, fontWeight: '700', marginBottom: 16 },
  flyrockStatus: { color: '#f59e0b', fontSize: 18, fontWeight: '700' },
  flyrockSafe: { color: '#10b981' },
  zonesTitle: { color: '#fff', fontSize: 24, fontWeight: '700', textAlign: 'center', marginBottom: 24 },
  zonesContainer: { gap: 16 },
  zoneCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    padding: 16,
    borderRadius: 8,
    borderLeftWidth: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  zoneIndicator: { width: 24, height: 24, borderRadius: 12 },
  zoneText: { flex: 1, color: '#fff', fontSize: 14, fontWeight: '600' },
  actionButton: {
    backgroundColor: '#2563eb',
    paddingVertical: 20,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 20,
  },
  actionButtonComplete: { backgroundColor: '#16a34a' },
  actionButtonText: { color: '#fff', fontSize: 18, fontWeight: '700' },
});

export default PostBlastVerification;
