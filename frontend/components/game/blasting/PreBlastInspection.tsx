import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ImageBackground, Dimensions } from 'react-native';
import { PRE_BLAST_DATA, WORKER_NPCS, SHELTERS } from '../../../data/blastingGameData';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

interface Worker {
  id: number;
  initialX: number;
  initialY: number;
  targetShelter: string;
  speed: number;
  evacuated?: boolean;
}

interface PreBlastInspectionProps {
  language: 'en' | 'hi';
  onComplete: (data: { xpEarned: number; evacuationTime: number }) => void;
  onXPEarned: (xp: number) => void;
}

const PreBlastInspection: React.FC<PreBlastInspectionProps> = ({ language, onComplete, onXPEarned }) => {
  const [currentTaskIndex, setCurrentTaskIndex] = useState(0);
  const [timeToDetonation, setTimeToDetonation] = useState(PRE_BLAST_DATA.timeToDetonation);
  const [workers, setWorkers] = useState<Worker[]>(WORKER_NPCS);
  const [evacuationStarted, setEvacuationStarted] = useState(false);
  const [alarmBlasts, setAlarmBlasts] = useState(0);
  const [shelterStatus, setShelterStatus] = useState(SHELTERS.map(s => ({ ...s, currentWorkers: 0 })));
  const [taskCompleted, setTaskCompleted] = useState(false);
  const [xpEarned, setXpEarned] = useState(0);

  const currentTask = PRE_BLAST_DATA.tasks[currentTaskIndex];

  // Countdown timer
  useEffect(() => {
    const interval = setInterval(() => {
      setTimeToDetonation(prev => Math.max(0, prev - 1));
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  // Worker evacuation animation
  useEffect(() => {
    if (evacuationStarted) {
      const evacuationInterval = setInterval(() => {
        setWorkers(prevWorkers => 
          prevWorkers.map(worker => {
            const targetShelter = SHELTERS.find(s => s.id === worker.targetShelter);
            if (!targetShelter) return worker;

            const dx = targetShelter.x - worker.initialX;
            const dy = targetShelter.y - worker.initialY;
            const distance = Math.sqrt(dx * dx + dy * dy);

            if (distance < 2) {
              return { ...worker, evacuated: true };
            }

            const moveX = (dx / distance) * worker.speed;
            const moveY = (dy / distance) * worker.speed;

            return {
              ...worker,
              initialX: worker.initialX + moveX,
              initialY: worker.initialY + moveY
            };
          })
        );
      }, 100);
      return () => clearInterval(evacuationInterval);
    }
  }, [evacuationStarted]);

  // Update shelter status
  useEffect(() => {
    setShelterStatus(SHELTERS.map(shelter => ({
      ...shelter,
      currentWorkers: workers.filter(w => w.evacuated && w.targetShelter === shelter.id).length
    })));
  }, [workers]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handlePerimeterCheck = () => {
    setTimeout(() => {
      setTaskCompleted(true);
      const earnedXP = currentTask.xpReward;
      setXpEarned(prev => prev + earnedXP);
      onXPEarned(earnedXP);
    }, 1000);
  };

  const handleSoundAlarm = () => {
    if (alarmBlasts < 3) {
      setAlarmBlasts(prev => prev + 1);
      
      if (alarmBlasts === 2) {
        setTimeout(() => {
          setEvacuationStarted(true);
          setTaskCompleted(true);
          const earnedXP = currentTask.xpReward;
          setXpEarned(prev => prev + earnedXP);
          onXPEarned(earnedXP);
        }, 1000);
      }
    }
  };

  const handleVerifyShelters = () => {
    setTaskCompleted(true);
    const earnedXP = currentTask.xpReward;
    setXpEarned(prev => prev + earnedXP);
    onXPEarned(earnedXP);
  };

  const handleNextTask = () => {
    if (currentTaskIndex < PRE_BLAST_DATA.tasks.length - 1) {
      setCurrentTaskIndex(prev => prev + 1);
      setTaskCompleted(false);
    } else {
      onComplete({ xpEarned, evacuationTime: PRE_BLAST_DATA.timeToDetonation - timeToDetonation });
    }
  };

  const getTaskHandler = () => {
    switch (currentTask.id) {
      case 'perimeter_check':
        return handlePerimeterCheck;
      case 'evacuation_alarm':
        return handleSoundAlarm;
      case 'shelter_verification':
        return handleVerifyShelters;
      default:
        return () => {};
    }
  };

  return (
    <View style={styles.container}>
      <ImageBackground
        source={require('../../../assets/images/blasting1.png')}
        style={styles.background}
        resizeMode="cover"
      >
        <View style={styles.overlay} />
      </ImageBackground>

      {/* Countdown Timer */}
      <View style={[styles.timer, timeToDetonation < 60 && styles.timerUrgent]}>
        <Text style={styles.timerText}>⏱ {formatTime(timeToDetonation)}</Text>
      </View>

      {/* Visualization Area */}
      <View style={styles.visualizationContainer}>
        <View style={styles.dangerZone} />
        
        {/* Workers */}
        {workers.map(worker => !worker.evacuated && (
          <View
            key={worker.id}
            style={[
              styles.worker,
              { left: worker.initialX * 4, top: worker.initialY * 3 }
            ]}
          >
            <Text style={styles.workerIcon}>👷</Text>
          </View>
        ))}

        {/* Shelters */}
        {shelterStatus.map(shelter => (
          <View
            key={shelter.id}
            style={[styles.shelter, { left: shelter.x * 4, top: shelter.y * 3 }]}
          >
            <Text style={styles.shelterLabel}>
              {language === 'en' ? `Shelter ${shelter.id}` : `आश्रय ${shelter.id}`}
            </Text>
            <Text style={styles.shelterCount}>
              {shelter.currentWorkers}/{shelter.capacity}
            </Text>
          </View>
        ))}

        {/* Blast Zone Marker */}
        <View style={styles.blastMarker}>
          <Text style={styles.blastIcon}>💥</Text>
          <Text style={styles.blastText}>
            {language === 'en' ? 'BLAST ZONE' : 'ब्लास्ट क्षेत्र'}
          </Text>
        </View>
      </View>

      {/* Task Panel */}
      <View style={styles.taskPanel}>
        <Text style={styles.taskTitle}>{currentTask.title[language]}</Text>

        {/* Alarm Blasts Display */}
        {currentTask.id === 'evacuation_alarm' && (
          <View style={styles.alarmContainer}>
            {[1, 2, 3].map(blast => (
              <View
                key={blast}
                style={[
                  styles.alarmIndicator,
                  alarmBlasts >= blast && styles.alarmActive
                ]}
              >
                <Text style={styles.alarmIcon}>🚨</Text>
              </View>
            ))}
          </View>
        )}

        {/* Shelter Status */}
        {currentTask.id === 'shelter_verification' && (
          <View style={styles.shelterGrid}>
            {shelterStatus.map(shelter => (
              <View
                key={shelter.id}
                style={[
                  styles.shelterCard,
                  shelter.currentWorkers > 0 && styles.shelterCardActive
                ]}
              >
                <Text style={styles.shelterCardLabel}>
                  {language === 'en' ? `Shelter ${shelter.id}` : `आश्रय ${shelter.id}`}
                </Text>
                <Text style={styles.shelterCardCount}>{shelter.currentWorkers} ✓</Text>
              </View>
            ))}
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
              ? `✅ ${language === 'en' ? 'CONTINUE' : 'जारी रखें'} (+${currentTask.xpReward} XP)`
              : currentTask.buttonText[language]
            }
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  background: { position: 'absolute', width: SCREEN_WIDTH, height: SCREEN_HEIGHT },
  overlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0, 0, 0, 0.4)' },
  timer: {
    position: 'absolute',
    top: 80,
    right: 16,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 9999,
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.4)',
    zIndex: 50,
  },
  timerUrgent: { backgroundColor: 'rgba(220, 38, 38, 0.9)' },
  timerText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  visualizationContainer: {
    marginTop: 140,
    marginHorizontal: 16,
    height: 300,
    backgroundColor: 'rgba(133, 77, 14, 0.3)',
    borderRadius: 16,
    borderWidth: 4,
    borderColor: 'rgba(202, 138, 4, 0.5)',
    position: 'relative',
    overflow: 'hidden',
  },
  dangerZone: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    width: 120,
    height: 120,
    marginLeft: -60,
    marginTop: -60,
    backgroundColor: 'rgba(220, 38, 38, 0.4)',
    borderRadius: 60,
    borderWidth: 4,
    borderColor: '#ef4444',
  },
  worker: { position: 'absolute', width: 32, height: 32, alignItems: 'center', justifyContent: 'center' },
  workerIcon: { fontSize: 24 },
  shelter: {
    position: 'absolute',
    backgroundColor: '#16a34a',
    borderWidth: 4,
    borderColor: '#fff',
    borderRadius: 8,
    padding: 8,
    alignItems: 'center',
  },
  shelterLabel: { color: '#fff', fontSize: 10, fontWeight: '700' },
  shelterCount: { color: '#fff', fontSize: 16, fontWeight: '700' },
  blastMarker: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    marginLeft: -40,
    marginTop: -40,
    alignItems: 'center',
  },
  blastIcon: { fontSize: 48 },
  blastText: { color: '#fde047', fontSize: 12, fontWeight: '700', marginTop: 4 },
  taskPanel: {
    position: 'absolute',
    bottom: 80,
    left: 16,
    right: 16,
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 10,
  },
  taskTitle: { fontSize: 18, fontWeight: '700', color: '#1f2937', marginBottom: 16 },
  alarmContainer: { flexDirection: 'row', justifyContent: 'center', gap: 8, marginBottom: 16 },
  alarmIndicator: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#d1d5db',
    alignItems: 'center',
    justifyContent: 'center',
  },
  alarmActive: { backgroundColor: '#dc2626' },
  alarmIcon: { fontSize: 24 },
  shelterGrid: { flexDirection: 'row', gap: 12, marginBottom: 16 },
  shelterCard: {
    flex: 1,
    padding: 12,
    borderRadius: 8,
    backgroundColor: '#f3f4f6',
    alignItems: 'center',
  },
  shelterCardActive: { backgroundColor: '#d1fae5', borderWidth: 2, borderColor: '#16a34a' },
  shelterCardLabel: { fontSize: 14, fontWeight: '700', marginBottom: 4 },
  shelterCardCount: { fontSize: 20, fontWeight: '700' },
  actionButton: {
    backgroundColor: '#2563eb',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  actionButtonComplete: { backgroundColor: '#16a34a' },
  actionButtonText: { color: '#fff', fontSize: 18, fontWeight: '700' },
});

export default PreBlastInspection;
