import React, { useEffect, useRef, useState } from 'react';
import {
  Animated,
  ImageBackground,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import useBlastingGameStore, { PRE_BLAST_TASKS } from '../../stores/blastingGameStore';

export default function PreBlastInspection() {
  const currentTaskIndex = useBlastingGameStore((state: any) => state.currentTaskIndex);
  const timeToDetonation = useBlastingGameStore((state: any) => state.timeToDetonation);
  const alarmBlasts = useBlastingGameStore((state: any) => state.alarmBlasts);
  const evacuationStarted = useBlastingGameStore((state: any) => state.evacuationStarted);
  const soundAlarm = useBlastingGameStore((state: any) => state.soundAlarm);
  const completeTask = useBlastingGameStore((state: any) => state.completeTask);
  const nextTask = useBlastingGameStore((state: any) => state.nextTask);
  
  const [taskCompleted, setTaskCompleted] = useState(false);
  const [countdown, setCountdown] = useState(timeToDetonation);
  const alarmAnim = useRef(new Animated.Value(1)).current;
  const evacuationProgress = useRef(new Animated.Value(0)).current;

  const currentTask = PRE_BLAST_TASKS[currentTaskIndex];

  // Countdown timer
  useEffect(() => {
    const timer = setInterval(() => {
      setCountdown((prev: number) => Math.max(0, prev - 1));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Evacuation animation
  useEffect(() => {
    if (evacuationStarted) {
      Animated.timing(evacuationProgress, {
        toValue: 1,
        duration: 15000, // 15 seconds evacuation
        useNativeDriver: false,
      }).start();
    }
  }, [evacuationStarted, evacuationProgress]);

  // Alarm pulse animation
  useEffect(() => {
    if (alarmBlasts < 3 && currentTask?.id === 'evacuation_alarm') {
      Animated.loop(
        Animated.sequence([
          Animated.timing(alarmAnim, {
            toValue: 1.2,
            duration: 500,
            useNativeDriver: true,
          }),
          Animated.timing(alarmAnim, {
            toValue: 1,
            duration: 500,
            useNativeDriver: true,
          }),
        ])
      ).start();
    }
  }, [alarmBlasts, alarmAnim, currentTask?.id]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleTaskAction = () => {
    if (currentTask?.id === 'perimeter_check') {
      setTaskCompleted(true);
      completeTask();
      setTimeout(() => {
        setTaskCompleted(false);
        nextTask();
      }, 2000);
    } else if (currentTask?.id === 'evacuation_alarm') {
      soundAlarm();
      if (alarmBlasts >= 2) {
        setTaskCompleted(true);
        completeTask();
        setTimeout(() => {
          setTaskCompleted(false);
          nextTask();
        }, 2000);
      }
    } else if (currentTask?.id === 'shelter_verification') {
      setTaskCompleted(true);
      completeTask();
      setTimeout(() => {
        nextTask();
      }, 2000);
    }
  };

  if (!currentTask) {
    return null;
  }

  return (
    <View style={styles.container}>
      <ImageBackground
        source={{ uri: 'https://images.unsplash.com/photo-1595257841889-eca2678454e2?w=1920&q=80' }}
        style={styles.background}
        resizeMode="cover"
      >
        <View style={styles.overlay} />

        {/* Header with Countdown */}
        <View style={styles.header}>
          <View style={styles.phaseLabel}>
            <Text style={styles.phaseLabelText}>🔍 PRE-BLAST INSPECTION</Text>
          </View>
          <View style={[styles.countdownBadge, countdown < 60 && styles.countdownCritical]}>
            <Text style={styles.countdownText}>⏰ {formatTime(countdown)}</Text>
            <Text style={styles.countdownLabel}>TO DETONATION</Text>
          </View>
        </View>

        {/* Task Card */}
        <View style={styles.contentContainer}>
          <View style={styles.taskCard}>
            <Text style={styles.taskTitle}>{currentTask.title}</Text>
            <Text style={styles.taskDescription}>{currentTask.description}</Text>

            {/* Task-specific UI */}
            {currentTask.id === 'perimeter_check' && (
              <View style={styles.perimeterCheck}>
                <View style={styles.dangerZone}>
                  <Text style={styles.dangerZoneText}>⚠️ DANGER ZONE</Text>
                  <Text style={styles.dangerZoneRadius}>500m Radius</Text>
                </View>
                <Text style={styles.checkStatus}>
                  {taskCompleted ? '✅ All Clear - Perimeter Secure' : '👥 Checking worker positions...'}
                </Text>
              </View>
            )}

            {currentTask.id === 'evacuation_alarm' && (
              <View style={styles.alarmSection}>
                <Animated.View style={[styles.alarmButton, { transform: [{ scale: alarmAnim }] }]}>
                  <Text style={styles.alarmEmoji}>🔊</Text>
                  <Text style={styles.alarmCount}>{alarmBlasts} / 3 BLASTS</Text>
                </Animated.View>
                {alarmBlasts > 0 && (
                  <Text style={styles.alarmStatus}>
                    {alarmBlasts === 1 && '1st Horn Blast Complete'}
                    {alarmBlasts === 2 && '2nd Horn Blast Complete'}
                    {alarmBlasts >= 3 && '✅ All 3 Blasts Complete - Evacuation Started!'}
                  </Text>
                )}
              </View>
            )}

            {currentTask.id === 'shelter_verification' && (
              <View style={styles.shelterSection}>
                {currentTask.shelters?.map((shelter: any) => (
                  <View key={shelter.id} style={styles.shelterCard}>
                    <View style={styles.shelterHeader}>
                      <Text style={styles.shelterLabel}>Shelter {shelter.id}</Text>
                      <Text style={styles.shelterStatus}>✅ SAFE</Text>
                    </View>
                    <View style={styles.shelterProgress}>
                      <View 
                        style={[
                          styles.shelterProgressBar, 
                          { width: `${(shelter.workers / 15) * 100}%` }
                        ]} 
                      />
                    </View>
                    <Text style={styles.shelterCount}>{shelter.workers} Workers</Text>
                  </View>
                ))}
                {taskCompleted && (
                  <View style={styles.allClearBadge}>
                    <Text style={styles.allClearText}>✅ ALL WORKERS ACCOUNTED FOR</Text>
                  </View>
                )}
              </View>
            )}

            {/* Action Button */}
            {!taskCompleted && (
              <TouchableOpacity
                style={[
                  styles.actionButton,
                  currentTask.id === 'evacuation_alarm' && alarmBlasts < 3 && styles.alarmActionButton
                ]}
                onPress={handleTaskAction}
                activeOpacity={0.8}
              >
                <Text style={styles.actionButtonText}>
                  {currentTask.id === 'perimeter_check' && '🔍 CHECK PERIMETER'}
                  {currentTask.id === 'evacuation_alarm' && `🔊 SOUND HORN ${alarmBlasts + 1}/3`}
                  {currentTask.id === 'shelter_verification' && '✅ VERIFY SHELTERS'}
                </Text>
              </TouchableOpacity>
            )}

            {taskCompleted && (
              <View style={styles.completedBadge}>
                <Text style={styles.completedText}>✅ Task Complete! +{currentTask.xpReward} XP</Text>
              </View>
            )}
          </View>
        </View>
      </ImageBackground>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  background: {
    flex: 1,
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
  },
  header: {
    paddingTop: 60,
    paddingHorizontal: 16,
    alignItems: 'center',
    gap: 16,
  },
  phaseLabel: {
    backgroundColor: 'rgba(234, 179, 8, 0.9)',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 12,
  },
  phaseLabelText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
    letterSpacing: 1,
  },
  countdownBadge: {
    backgroundColor: 'rgba(59, 130, 246, 0.9)',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 16,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  countdownCritical: {
    backgroundColor: 'rgba(220, 38, 38, 0.9)',
  },
  countdownText: {
    color: '#FFFFFF',
    fontSize: 28,
    fontWeight: 'bold',
  },
  countdownLabel: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
    marginTop: 4,
  },
  contentContainer: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 20,
    paddingBottom: 20,
  },
  taskCard: {
    backgroundColor: 'rgba(17, 24, 39, 0.95)',
    borderRadius: 20,
    padding: 24,
    borderWidth: 3,
    borderColor: 'rgba(234, 179, 8, 0.6)',
  },
  taskTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 8,
    textAlign: 'center',
  },
  taskDescription: {
    fontSize: 16,
    color: '#D1D5DB',
    marginBottom: 24,
    textAlign: 'center',
  },
  perimeterCheck: {
    alignItems: 'center',
    marginBottom: 24,
  },
  dangerZone: {
    backgroundColor: 'rgba(220, 38, 38, 0.2)',
    padding: 20,
    borderRadius: 100,
    borderWidth: 4,
    borderColor: '#DC2626',
    alignItems: 'center',
    marginBottom: 20,
    width: 180,
    height: 180,
    justifyContent: 'center',
  },
  dangerZoneText: {
    color: '#FCA5A5',
    fontSize: 18,
    fontWeight: 'bold',
  },
  dangerZoneRadius: {
    color: '#FFFFFF',
    fontSize: 16,
    marginTop: 8,
  },
  checkStatus: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  alarmSection: {
    alignItems: 'center',
    marginBottom: 24,
  },
  alarmButton: {
    backgroundColor: 'rgba(220, 38, 38, 0.9)',
    padding: 24,
    borderRadius: 100,
    alignItems: 'center',
    justifyContent: 'center',
    width: 160,
    height: 160,
    borderWidth: 6,
    borderColor: '#FFFFFF',
    marginBottom: 16,
  },
  alarmEmoji: {
    fontSize: 48,
  },
  alarmCount: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: 'bold',
    marginTop: 8,
  },
  alarmStatus: {
    color: '#FDE047',
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
  shelterSection: {
    gap: 16,
    marginBottom: 24,
  },
  shelterCard: {
    backgroundColor: 'rgba(6, 95, 70, 0.3)',
    padding: 16,
    borderRadius: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#10B981',
  },
  shelterHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  shelterLabel: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
  },
  shelterStatus: {
    color: '#10B981',
    fontSize: 14,
    fontWeight: 'bold',
  },
  shelterProgress: {
    height: 8,
    backgroundColor: 'rgba(31, 41, 55, 0.5)',
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 8,
  },
  shelterProgressBar: {
    height: '100%',
    backgroundColor: '#10B981',
  },
  shelterCount: {
    color: '#D1D5DB',
    fontSize: 14,
  },
  allClearBadge: {
    backgroundColor: 'rgba(16, 185, 129, 0.9)',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  allClearText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  actionButton: {
    backgroundColor: '#F59E0B',
    paddingVertical: 18,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 3,
    borderColor: '#FFFFFF',
  },
  alarmActionButton: {
    backgroundColor: '#DC2626',
  },
  actionButtonText: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: 'bold',
    letterSpacing: 0.5,
  },
  completedBadge: {
    backgroundColor: 'rgba(16, 185, 129, 0.2)',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#10B981',
  },
  completedText: {
    color: '#10B981',
    fontSize: 18,
    fontWeight: 'bold',
  },
});
