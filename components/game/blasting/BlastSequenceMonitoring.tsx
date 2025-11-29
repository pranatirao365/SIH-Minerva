import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Animated } from 'react-native';
import { BLAST_SEQUENCE_DATA } from '../../../data/blastingGameData';

interface BlastSequenceMonitoringProps {
  language: 'en' | 'hi';
  onComplete: (data: { xpEarned: number; seismicMagnitude: string; flyrockDistance: number }) => void;
  onXPEarned: (xp: number) => void;
}

const BlastSequenceMonitoring: React.FC<BlastSequenceMonitoringProps> = ({ language, onComplete, onXPEarned }) => {
  const [phase, setPhase] = useState<'checklist' | 'countdown' | 'blasting' | 'complete'>('checklist');
  const [countdown, setCountdown] = useState(BLAST_SEQUENCE_DATA.blastCountdown);
  const [currentHole, setCurrentHole] = useState(0);
  const [seismicReading, setSeismicReading] = useState(0);
  const explosionAnim = useState(new Animated.Value(0))[0];

  // Countdown timer
  useEffect(() => {
    if (phase === 'countdown' && countdown > 0) {
      const interval = setInterval(() => {
        setCountdown(prev => prev - 1);
      }, 1000);
      return () => clearInterval(interval);
    } else if (phase === 'countdown' && countdown === 0) {
      setPhase('blasting');
    }
  }, [phase, countdown]);

  // Blast sequence
  useEffect(() => {
    if (phase === 'blasting' && currentHole < BLAST_SEQUENCE_DATA.blastHoles.length) {
      const holeTimer = setTimeout(() => {
        setCurrentHole(prev => prev + 1);
        setSeismicReading(Math.random() * 3 + 1);
        
        // Explosion animation
        Animated.sequence([
          Animated.timing(explosionAnim, { toValue: 1, duration: 200, useNativeDriver: true }),
          Animated.timing(explosionAnim, { toValue: 0, duration: 500, useNativeDriver: true }),
        ]).start();
      }, 2000);
      return () => clearTimeout(holeTimer);
    } else if (phase === 'blasting' && currentHole >= BLAST_SEQUENCE_DATA.blastHoles.length) {
      setTimeout(() => setPhase('complete'), 2000);
    }
  }, [phase, currentHole, explosionAnim]);

  const handleConfirmBlastStart = () => {
    setPhase('countdown');
    onXPEarned(50);
  };

  const handleComplete = () => {
    onComplete({
      xpEarned: BLAST_SEQUENCE_DATA.xpReward,
      seismicMagnitude: seismicReading.toFixed(1),
      flyrockDistance: 150
    });
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>
          💥 {language === 'en' ? 'BLAST SEQUENCE MONITORING' : 'ब्लास्ट अनुक्रम निगरानी'}
        </Text>
        <Text style={styles.headerSubtitle}>
          {language === 'en' ? `Phase: ${phase.toUpperCase()}` : `चरण: ${phase.toUpperCase()}`}
        </Text>
      </View>

      {/* Checklist Phase */}
      {phase === 'checklist' && (
        <View style={styles.content}>
          <View style={styles.card}>
            <Text style={styles.cardTitle}>
              {language === 'en' ? '📋 Final Safety Check' : '📋 अंतिम सुरक्षा जाँच'}
            </Text>

            <View style={styles.checklist}>
              {BLAST_SEQUENCE_DATA.safetyChecklist.map((item) => (
                <View key={item.id} style={styles.checklistItem}>
                  <Text style={styles.checkIcon}>✅</Text>
                  <Text style={styles.checklistText}>{item.label[language]}</Text>
                </View>
              ))}
            </View>

            <TouchableOpacity
              style={styles.startButton}
              onPress={handleConfirmBlastStart}
              activeOpacity={0.8}
            >
              <Text style={styles.startButtonText}>
                🚀 {language === 'en' ? 'CONFIRM BLAST START' : 'ब्लास्ट शुरू पुष्टि करें'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* Countdown Phase */}
      {phase === 'countdown' && (
        <View style={styles.content}>
          <Text style={[styles.countdownText, countdown < 10 && styles.countdownUrgent]}>
            {formatTime(countdown)}
          </Text>
          <Text style={styles.countdownLabel}>
            {language === 'en' ? 'T-minus to detonation' : 'विस्फोट तक समय'}
          </Text>

          <View style={styles.holesContainer}>
            {BLAST_SEQUENCE_DATA.blastHoles.map((hole) => (
              <View key={hole.id} style={styles.hole}>
                <Text style={styles.holeText}>{hole.id}</Text>
              </View>
            ))}
          </View>
        </View>
      )}

      {/* Blasting Phase */}
      {phase === 'blasting' && (
        <View style={styles.content}>
          <Animated.View style={[styles.explosionOverlay, { opacity: explosionAnim }]} />
          
          <Text style={styles.blastingTitle}>
            {language === 'en' ? '💥 DETONATION IN PROGRESS' : '💥 विस्फोट जारी है'}
          </Text>

          <View style={styles.blastInfo}>
            <Text style={styles.blastInfoText}>
              {language === 'en' ? `Hole ${currentHole} of ${BLAST_SEQUENCE_DATA.blastHoles.length}` : `होल ${currentHole} का ${BLAST_SEQUENCE_DATA.blastHoles.length}`}
            </Text>
            <Text style={styles.seismicText}>
              {language === 'en' ? `Seismic: ${seismicReading.toFixed(1)} Richter` : `भूकंपीय: ${seismicReading.toFixed(1)} रिक्टर`}
            </Text>
          </View>

          <View style={styles.holesContainer}>
            {BLAST_SEQUENCE_DATA.blastHoles.map((hole, idx) => (
              <View
                key={hole.id}
                style={[
                  styles.hole,
                  idx < currentHole && styles.holeDetonated
                ]}
              >
                <Text style={styles.holeText}>{hole.id}</Text>
              </View>
            ))}
          </View>
        </View>
      )}

      {/* Complete Phase */}
      {phase === 'complete' && (
        <View style={styles.content}>
          <Text style={styles.completeTitle}>
            ✅ {language === 'en' ? 'Blast Sequence Complete!' : 'ब्लास्ट अनुक्रम पूर्ण!'}
          </Text>

          <TouchableOpacity
            style={styles.continueButton}
            onPress={handleComplete}
            activeOpacity={0.8}
          >
            <Text style={styles.continueButtonText}>
              {language === 'en' ? 'CONTINUE TO VERIFICATION' : 'सत्यापन जारी रखें'}
            </Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#1f2937' },
  header: {
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    paddingVertical: 16,
    paddingHorizontal: 16,
    marginTop: 80,
  },
  headerTitle: { color: '#fff', fontSize: 24, fontWeight: '700', textAlign: 'center' },
  headerSubtitle: { color: '#fde047', fontSize: 14, textAlign: 'center', marginTop: 4 },
  content: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 },
  card: {
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: 16,
    padding: 32,
    width: '100%',
    maxWidth: 600,
  },
  cardTitle: { fontSize: 24, fontWeight: '700', color: '#1f2937', marginBottom: 24, textAlign: 'center' },
  checklist: { gap: 12, marginBottom: 32 },
  checklistItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 16,
    backgroundColor: '#dcfce7',
    borderWidth: 2,
    borderColor: '#16a34a',
    borderRadius: 8,
  },
  checkIcon: { fontSize: 24 },
  checklistText: { fontSize: 16, fontWeight: '600', color: '#1f2937', flex: 1 },
  startButton: {
    backgroundColor: '#dc2626',
    paddingVertical: 20,
    borderRadius: 12,
    alignItems: 'center',
  },
  startButtonText: { color: '#fff', fontSize: 20, fontWeight: '700' },
  countdownText: { fontSize: 80, fontWeight: '700', color: '#ef4444', marginBottom: 16 },
  countdownUrgent: { color: '#ff0000' },
  countdownLabel: { fontSize: 24, fontWeight: '700', color: '#fff', marginBottom: 40 },
  holesContainer: { flexDirection: 'row', gap: 16, flexWrap: 'wrap', justifyContent: 'center' },
  hole: {
    width: 64,
    height: 64,
    backgroundColor: '#ca8a04',
    borderWidth: 4,
    borderColor: '#fff',
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  holeDetonated: { backgroundColor: '#dc2626' },
  holeText: { color: '#fff', fontSize: 24, fontWeight: '700' },
  explosionOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#fff',
  },
  blastingTitle: { fontSize: 28, fontWeight: '700', color: '#fff', marginBottom: 32, textAlign: 'center' },
  blastInfo: { alignItems: 'center', marginBottom: 40 },
  blastInfoText: { fontSize: 20, color: '#fff', fontWeight: '700', marginBottom: 8 },
  seismicText: { fontSize: 18, color: '#fde047', fontWeight: '600' },
  completeTitle: { fontSize: 32, fontWeight: '700', color: '#fff', marginBottom: 40, textAlign: 'center' },
  continueButton: {
    backgroundColor: '#16a34a',
    paddingHorizontal: 48,
    paddingVertical: 20,
    borderRadius: 12,
  },
  continueButtonText: { color: '#fff', fontSize: 20, fontWeight: '700' },
});

export default BlastSequenceMonitoring;
