import React, { useEffect, useRef, useState } from 'react';
import {
  Animated,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import useBlastingGameStore, { BLAST_HOLES, SAFETY_CHECKLIST } from '../../stores/blastingGameStore';

export default function BlastSequenceMonitoring() {
  const currentBlastHole = useBlastingGameStore((state: any) => state.currentBlastHole);
  const seismicMagnitude = useBlastingGameStore((state: any) => state.seismicMagnitude);
  const detonateHole = useBlastingGameStore((state: any) => state.detonateHole);
  
  const [phase, setPhase] = useState<'checklist' | 'countdown' | 'blasting'>('checklist');
  const [countdown, setCountdown] = useState(180);
  const explosionAnim = useRef(new Animated.Value(0)).current;
  const shakeAnim = useRef(new Animated.Value(0)).current;

  // Countdown timer
  useEffect(() => {
    if (phase === 'countdown' && countdown > 0) {
      const timer = setInterval(() => {
        setCountdown(prev => prev - 1);
      }, 1000);
      return () => clearInterval(timer);
    } else if (phase === 'countdown' && countdown === 0) {
      setPhase('blasting');
    }
  }, [phase, countdown]);

  // Auto-detonate holes
  useEffect(() => {
    if (phase === 'blasting' && currentBlastHole < BLAST_HOLES.length) {
      const timer = setTimeout(() => {
        // Explosion animation
        Animated.sequence([
          Animated.timing(explosionAnim, {
            toValue: 1,
            duration: 300,
            useNativeDriver: true,
          }),
          Animated.timing(explosionAnim, {
            toValue: 0,
            duration: 300,
            useNativeDriver: true,
          }),
        ]).start();

        // Shake animation
        Animated.sequence([
          Animated.timing(shakeAnim, {
            toValue: 10,
            duration: 50,
            useNativeDriver: true,
          }),
          Animated.timing(shakeAnim, {
            toValue: -10,
            duration: 50,
            useNativeDriver: true,
          }),
          Animated.timing(shakeAnim, {
            toValue: 0,
            duration: 50,
            useNativeDriver: true,
          }),
        ]).start();

        detonateHole();
      }, 2000);

      return () => clearTimeout(timer);
    }
  }, [phase, currentBlastHole, detonateHole, explosionAnim, shakeAnim]);

  const handleConfirmStart = () => {
    setPhase('countdown');
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <Animated.View style={[styles.container, { transform: [{ translateX: shakeAnim }] }]}>
      <View style={styles.background} />

      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>💥 BLAST SEQUENCE MONITORING</Text>
        <Text style={styles.phaseText}>
          {phase === 'checklist' && 'Safety Checklist'}
          {phase === 'countdown' && 'Countdown Active'}
          {phase === 'blasting' && 'Blast in Progress'}
        </Text>
      </View>

      {/* PHASE: Checklist */}
      {phase === 'checklist' && (
        <View style={styles.contentContainer}>
          <View style={styles.checklistCard}>
            <Text style={styles.checklistTitle}>📋 Final Safety Check</Text>
            <View style={styles.checklistItems}>
              {SAFETY_CHECKLIST.map((item, index) => (
                <View key={item.id} style={styles.checklistItem}>
                  <Text style={styles.checkmark}>✅</Text>
                  <Text style={styles.checklistItemText}>{item.label}</Text>
                </View>
              ))}
            </View>
            <TouchableOpacity
              style={styles.confirmButton}
              onPress={handleConfirmStart}
              activeOpacity={0.8}
            >
              <Text style={styles.confirmButtonText}>🚀 INITIATE BLAST SEQUENCE</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* PHASE: Countdown */}
      {phase === 'countdown' && (
        <View style={styles.contentContainer}>
          <View style={styles.countdownCard}>
            <Text style={styles.countdownTitle}>⏰ COUNTDOWN TO DETONATION</Text>
            <View style={styles.countdownCircle}>
              <Text style={styles.countdownTime}>{formatTime(countdown)}</Text>
            </View>
            <Text style={styles.countdownWarning}>⚠️ All personnel must be in safe zones</Text>
          </View>
        </View>
      )}

      {/* PHASE: Blasting */}
      {phase === 'blasting' && (
        <View style={styles.contentContainer}>
          <Animated.View 
            style={[
              styles.explosionOverlay,
              {
                opacity: explosionAnim,
                transform: [{
                  scale: explosionAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0.5, 2],
                  })
                }]
              }
            ]}
          />

          <View style={styles.blastCard}>
            <Text style={styles.blastTitle}>💥 BLAST IN PROGRESS</Text>
            
            <View style={styles.holesContainer}>
              {BLAST_HOLES.map((hole, index) => (
                <View
                  key={hole.id}
                  style={[
                    styles.holeIndicator,
                    index < currentBlastHole && styles.holeDetonated,
                    index === currentBlastHole && styles.holeActive,
                  ]}
                >
                  <Text style={styles.holeNumber}>{hole.id}</Text>
                  {index < currentBlastHole && <Text style={styles.holeStatus}>✓</Text>}
                  {index === currentBlastHole && <Text style={styles.holeStatus}>💥</Text>}
                </View>
              ))}
            </View>

            <View style={styles.metricsContainer}>
              <View style={styles.metricCard}>
                <Text style={styles.metricLabel}>Holes Detonated</Text>
                <Text style={styles.metricValue}>{currentBlastHole} / {BLAST_HOLES.length}</Text>
              </View>
              <View style={styles.metricCard}>
                <Text style={styles.metricLabel}>Seismic Reading</Text>
                <Text style={styles.metricValue}>{seismicMagnitude.toFixed(1)} M</Text>
              </View>
            </View>

            {currentBlastHole >= BLAST_HOLES.length && (
              <View style={styles.completeBadge}>
                <Text style={styles.completeText}>✅ BLAST SEQUENCE COMPLETE</Text>
              </View>
            )}
          </View>
        </View>
      )}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  background: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#1F2937',
  },
  header: {
    paddingTop: 60,
    paddingHorizontal: 16,
    paddingBottom: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 8,
  },
  phaseText: {
    fontSize: 16,
    color: '#FDE047',
    fontWeight: '600',
  },
  contentContainer: {
    flex: 1,
    padding: 16,
    justifyContent: 'center',
  },
  checklistCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: 20,
    padding: 24,
    maxWidth: 600,
    alignSelf: 'center',
    width: '100%',
  },
  checklistTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 24,
    textAlign: 'center',
  },
  checklistItems: {
    marginBottom: 24,
  },
  checklistItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 2,
    borderColor: '#10B981',
  },
  checkmark: {
    fontSize: 24,
    marginRight: 12,
  },
  checklistItemText: {
    flex: 1,
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
  },
  confirmButton: {
    backgroundColor: '#DC2626',
    paddingVertical: 20,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 3,
    borderColor: '#FFFFFF',
  },
  confirmButtonText: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: 'bold',
  },
  countdownCard: {
    backgroundColor: 'rgba(17, 24, 39, 0.95)',
    borderRadius: 20,
    padding: 32,
    alignItems: 'center',
    maxWidth: 600,
    alignSelf: 'center',
    width: '100%',
    borderWidth: 4,
    borderColor: '#DC2626',
  },
  countdownTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 32,
  },
  countdownCircle: {
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: '#DC2626',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 8,
    borderColor: '#FFFFFF',
    marginBottom: 32,
  },
  countdownTime: {
    fontSize: 56,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  countdownWarning: {
    fontSize: 16,
    color: '#FCA5A5',
    textAlign: 'center',
    fontWeight: '600',
  },
  blastCard: {
    backgroundColor: 'rgba(17, 24, 39, 0.95)',
    borderRadius: 20,
    padding: 24,
    maxWidth: 600,
    alignSelf: 'center',
    width: '100%',
  },
  blastTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 24,
  },
  holesContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 32,
  },
  holeIndicator: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: 'rgba(107, 114, 128, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#6B7280',
  },
  holeDetonated: {
    backgroundColor: 'rgba(16, 185, 129, 0.3)',
    borderColor: '#10B981',
  },
  holeActive: {
    backgroundColor: 'rgba(249, 115, 22, 0.9)',
    borderColor: '#F97316',
  },
  holeNumber: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
  },
  holeStatus: {
    position: 'absolute',
    fontSize: 16,
  },
  metricsContainer: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 24,
  },
  metricCard: {
    flex: 1,
    backgroundColor: 'rgba(59, 130, 246, 0.2)',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#3B82F6',
  },
  metricLabel: {
    color: '#93C5FD',
    fontSize: 14,
    marginBottom: 8,
  },
  metricValue: {
    color: '#FFFFFF',
    fontSize: 24,
    fontWeight: 'bold',
  },
  completeBadge: {
    backgroundColor: 'rgba(16, 185, 129, 0.9)',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  completeText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
  },
  explosionOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#F97316',
    zIndex: 1,
  },
});
