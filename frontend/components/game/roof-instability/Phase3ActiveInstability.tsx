import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
    Alert,
    Animated,
    Dimensions,
    ImageBackground,
    PanResponder,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { ACTIVE_INSTABILITY_DATA } from '../../../data/roofInstabilityData';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

interface Phase3ActiveInstabilityProps {
  language: 'en' | 'hi';
  onComplete: (data: {
    boundaryCoveragePercent: number;
    stopWorkChosen: boolean;
    timeToStopWorkMs: number;
    xpEarned: number;
  }) => void;
  onXPEarned: (xp: number) => void;
}

const Phase3ActiveInstability: React.FC<Phase3ActiveInstabilityProps> = ({
  language,
  onComplete,
  onXPEarned,
}) => {
  const [currentTaskIndex, setCurrentTaskIndex] = useState(0);
  const [boundaryPoints, setBoundaryPoints] = useState<{ x: number; y: number }[]>([]);
  const [drawingPath, setDrawingPath] = useState<string>('');
  const [drawnArea, setDrawnArea] = useState<number>(0);
  const [usePhase3Background, setUsePhase3Background] = useState(false);
  const [barricadePlaced, setBarricadePlaced] = useState(false);
  const [stopWorkSelected, setStopWorkSelected] = useState<boolean | null>(null);
  const [startTime] = useState(Date.now());
  const [timeToStopWork, setTimeToStopWork] = useState<number>(0);
  const [xpEarned, setXpEarned] = useState(0);
  const [anomalyIndex, setAnomalyIndex] = useState(0);
  const [currentAnomaly, setCurrentAnomaly] = useState<string | null>(null);
  const [elapsedTime, setElapsedTime] = useState(0);
  
  // Animations
  const [shakeAnimation] = useState(new Animated.Value(0));
  const [fallingRockAnimation] = useState(new Animated.Value(-50));
  
  // Drawing state
  const pathRef = useRef<string>('');
  const pointsRef = useRef<{ x: number; y: number }[]>([]);
  const taskCompleteRef = useRef<(() => void) | null>(null);

  const currentTask = ACTIVE_INSTABILITY_DATA.tasks[currentTaskIndex];

  // Safety check - if no task available, complete phase
  useEffect(() => {
    if (!currentTask) {
      onComplete({
        boundaryCoveragePercent: Math.min(100, (boundaryPoints.length / 4) * 100),
        stopWorkChosen: stopWorkSelected ?? false,
        timeToStopWorkMs: timeToStopWork,
        xpEarned,
      });
    }
  }, [currentTask]);

  useEffect(() => {
    // Elapsed time counter
    const interval = setInterval(() => {
      setElapsedTime(prev => prev + 1);
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    // Trigger anomalies
    if (
      anomalyIndex < ACTIVE_INSTABILITY_DATA.anomalies.length &&
      elapsedTime >= ACTIVE_INSTABILITY_DATA.anomalies[anomalyIndex].triggerTime
    ) {
      const anomaly = ACTIVE_INSTABILITY_DATA.anomalies[anomalyIndex];
      setCurrentAnomaly(anomaly.message[language]);
      setAnomalyIndex(prev => prev + 1);

      // Shake effect for critical events
      if (anomaly.severity === 'critical') {
        Animated.sequence([
          Animated.timing(shakeAnimation, { toValue: 10, duration: 50, useNativeDriver: true }),
          Animated.timing(shakeAnimation, { toValue: -10, duration: 50, useNativeDriver: true }),
          Animated.timing(shakeAnimation, { toValue: 10, duration: 50, useNativeDriver: true }),
          Animated.timing(shakeAnimation, { toValue: 0, duration: 50, useNativeDriver: true }),
        ]).start();

        // Animate falling rock
        fallingRockAnimation.setValue(-50);
        Animated.timing(fallingRockAnimation, {
          toValue: SCREEN_HEIGHT,
          duration: 2000,
          useNativeDriver: true,
        }).start();
      }

      setTimeout(() => {
        setCurrentAnomaly(null);
      }, 4000);
    }
  }, [elapsedTime, anomalyIndex, language]);

  const handleTaskComplete = useCallback(() => {
    if (currentTaskIndex < ACTIVE_INSTABILITY_DATA.tasks.length - 1) {
      setCurrentTaskIndex(prev => prev + 1);
    } else {
      // Phase complete
      const coverage = drawnArea > 0 ? drawnArea : Math.min(100, (boundaryPoints.length / 4) * 100);
      onComplete({
        boundaryCoveragePercent: coverage,
        stopWorkChosen: stopWorkSelected ?? false,
        timeToStopWorkMs: timeToStopWork,
        xpEarned,
      });
    }
  }, [currentTaskIndex, drawnArea, boundaryPoints, stopWorkSelected, timeToStopWork, xpEarned, onComplete]);

  // Update ref whenever handleTaskComplete changes
  useEffect(() => {
    taskCompleteRef.current = handleTaskComplete;
  }, [handleTaskComplete]);

  // PanResponder for free-hand drawing
  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => currentTask?.id === 'mark_unsafe_zone',
      onMoveShouldSetPanResponder: () => currentTask?.id === 'mark_unsafe_zone',
      onPanResponderGrant: (evt) => {
        const { locationX, locationY } = evt.nativeEvent;
        pathRef.current = `M ${locationX} ${locationY}`;
        pointsRef.current = [{ x: locationX, y: locationY }];
        setDrawingPath(pathRef.current);
      },
      onPanResponderMove: (evt) => {
        const { locationX, locationY } = evt.nativeEvent;
        pathRef.current += ` L ${locationX} ${locationY}`;
        pointsRef.current.push({ x: locationX, y: locationY });
        setDrawingPath(pathRef.current);
        
        // Calculate approximate area drawn
        const points = pointsRef.current.length;
        setDrawnArea(Math.min(100, Math.round((points / 150) * 100)));
      },
      onPanResponderRelease: () => {
        // Check if enough area is covered using the ref (immediate value)
        const currentPoints = pointsRef.current.length;
        const coverage = Math.min(100, Math.round((currentPoints / 150) * 100));
        
        if (coverage >= 60) {
          setTimeout(() => {
            setUsePhase3Background(true);
            if (currentTask?.xpReward) {
              const earnedXP = currentTask.xpReward;
              setXpEarned(prev => prev + earnedXP);
              onXPEarned(earnedXP);
            }
            setTimeout(() => {
              taskCompleteRef.current?.();
            }, 800);
          }, 500);
        }
      },
    })
  ).current;

  const handlePlaceBarricade = useCallback(() => {
    setBarricadePlaced(true);
    if (currentTask?.xpReward) {
      const earnedXP = currentTask.xpReward;
      setXpEarned(prev => prev + earnedXP);
      onXPEarned(earnedXP);
    }
    handleTaskComplete();
  }, [currentTask, onXPEarned, handleTaskComplete]);

  const handleStopWorkDecision = useCallback((stopWork: boolean) => {
    setStopWorkSelected(stopWork);
    const task = ACTIVE_INSTABILITY_DATA.tasks[2];
    if (!task?.options) return;
    
    const decision = task.options.find(opt => 
      opt.id === (stopWork ? 'stop_evacuate' : 'continue_work')
    );

    if (decision) {
      const earnedXP = decision.xpReward;
      setXpEarned(prev => prev + earnedXP);
      onXPEarned(earnedXP);
      setTimeToStopWork(Date.now() - startTime);

      Alert.alert(
        stopWork ? (language === 'en' ? '✅ CORRECT!' : '✅ सही!') : (language === 'en' ? '❌ WRONG!' : '❌ गलत!'),
        decision.feedback[language],
        [{ text: 'OK', onPress: handleTaskComplete }]
      );
    }
  }, [language, startTime, onXPEarned, handleTaskComplete]);

  const calculateCoverage = () => {
    return drawnArea;
  };

  return (
    <Animated.View style={[styles.container, { transform: [{ translateX: shakeAnimation }] }]}>
      <ImageBackground
        source={usePhase3Background ? require('../../../assets/images/pahse3.jpg') : require('../../../assets/images/phase2.jpg')}
        style={styles.background}
        resizeMode="cover"
      >
        <View style={styles.overlay} />
      </ImageBackground>

      {/* Anomaly Alert */}
      {currentAnomaly && (
        <View style={styles.anomalyAlert}>
          <Text style={styles.anomalyText}>{currentAnomaly}</Text>
        </View>
      )}

      {/* Falling Rock Animation */}
      <Animated.View
        style={[
          styles.fallingRock,
          { transform: [{ translateY: fallingRockAnimation }] },
        ]}
      >
        <Text style={styles.fallingRockIcon}>🪨</Text>
      </Animated.View>

      {/* Task Title */}
      <View style={styles.taskHeader}>
        <Text style={styles.taskTitle}>{currentTask?.title?.[language] || ''}</Text>
        <Text style={styles.taskPrompt}>{currentTask?.sagePrompt?.[language] || ''}</Text>
      </View>

      {/* Interactive Zone for Marking */}
      {currentTask?.id === 'mark_unsafe_zone' && (
        <View
          style={styles.markingZone}
          {...panResponder.panHandlers}
        >
          {/* SVG Canvas for drawing */}
          <Svg style={StyleSheet.absoluteFillObject}>
            <Path
              d={drawingPath}
              stroke="#EF4444"
              strokeWidth={8}
              fill="none"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </Svg>
          
          {/* Danger zone visualization */}
          <View style={styles.dangerZoneIndicator}>
            <Text style={styles.dangerZoneText}>
              {language === 'en' ? '⚠ DANGER ZONE ⚠' : '⚠ खतरा क्षेत्र ⚠'}
            </Text>
          </View>

          {/* Coverage indicator */}
          <View style={styles.coverageIndicator}>
            <Text style={styles.coverageText}>
              {language === 'en' ? 'Coverage:' : 'कवरेज:'} {calculateCoverage()}%
            </Text>
          </View>

          <Text style={styles.tapHint}>
            {language === 'en' 
              ? drawnArea < 60 ? '✏️ Draw around the danger zone' : '✅ Release to confirm' 
              : drawnArea < 60 ? '✏️ खतरे के क्षेत्र के चारों ओर बनाएं' : '✅ पुष्टि करने के लिए छोड़ें'}
          </Text>
        </View>
      )}

      {/* Barricade Placement */}
      {currentTask?.id === 'place_barricade' && (
        <View style={styles.barricadeZone}>
          {barricadePlaced ? (
            <View style={styles.barricadeIcon}>
              <Text style={styles.barricadeEmoji}>🚧</Text>
              <Text style={styles.barricadeLabel}>
                {language === 'en' ? 'DO NOT ENTER' : 'प्रवेश न करें'}
              </Text>
            </View>
          ) : (
            <TouchableOpacity
              style={styles.placeButton}
              onPress={handlePlaceBarricade}
              activeOpacity={0.8}
            >
              <Text style={styles.placeButtonText}>{currentTask?.buttonText?.[language] || 'PLACE BARRICADE'}</Text>
            </TouchableOpacity>
          )}
        </View>
      )}

      {/* Stop Work Decision */}
      {currentTask?.id === 'stop_work_decision' && (
        <View style={styles.decisionZone}>
          {currentTask?.options?.map(option => (
            <TouchableOpacity
              key={option.id}
              style={[
                styles.decisionButton,
                option.isCorrect ? styles.decisionButtonSafe : styles.decisionButtonDanger,
              ]}
              onPress={() => handleStopWorkDecision(option.id === 'stop_evacuate')}
              activeOpacity={0.8}
            >
              <Text style={styles.decisionButtonText}>{option.label[language]}</Text>
            </TouchableOpacity>
          ))}
        </View>
      )}
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000000' },
  background: { position: 'absolute', width: SCREEN_WIDTH, height: SCREEN_HEIGHT },
  overlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0, 0, 0, 0.4)' },
  anomalyAlert: {
    position: 'absolute',
    top: 80,
    left: 16,
    right: 16,
    backgroundColor: '#EF4444',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#27272A',
    zIndex: 50,
    shadowColor: '#EF4444',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.5,
    shadowRadius: 12,
    elevation: 10,
  },
  anomalyText: { color: '#FAFAFA', fontSize: 16, fontWeight: '700', textAlign: 'center' },
  fallingRock: { position: 'absolute', left: '45%', zIndex: 40 },
  fallingRockIcon: { fontSize: 40 },
  taskHeader: {
    position: 'absolute',
    top: 140,
    left: 16,
    right: 16,
    backgroundColor: '#1A1A1A',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#FF6B00',
    zIndex: 40,
  },
  taskTitle: { color: '#FAFAFA', fontSize: 18, fontWeight: '700', marginBottom: 8 },
  taskPrompt: { color: '#FF6B00', fontSize: 15, fontWeight: '600' },
  markingZone: {
    marginTop: 260,
    marginHorizontal: 16,
    height: 320,
    backgroundColor: 'rgba(239, 68, 68, 0.15)',
    borderRadius: 16,
    borderWidth: 3,
    borderStyle: 'dashed',
    borderColor: '#EF4444',
    position: 'relative',
  },
  boundaryPoint: {
    position: 'absolute',
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#EF4444',
    borderWidth: 2,
    borderColor: '#27272A',
  },
  dangerZoneIndicator: {
    position: 'absolute',
    top: '45%',
    left: '50%',
    transform: [{ translateX: -80 }, { translateY: -20 }],
  },
  dangerZoneText: { color: '#FAFAFA', fontSize: 18, fontWeight: '700', textAlign: 'center' },
  coverageIndicator: {
    position: 'absolute',
    top: 16,
    right: 16,
    backgroundColor: '#1A1A1A',
    padding: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#27272A',
  },
  coverageText: { color: '#FAFAFA', fontSize: 14, fontWeight: '700' },
  tapHint: {
    position: 'absolute',
    bottom: 16,
    left: 16,
    right: 16,
    color: '#A1A1AA',
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
  },
  barricadeZone: {
    marginTop: 260,
    marginHorizontal: 16,
    height: 280,
    alignItems: 'center',
    justifyContent: 'center',
  },
  barricadeIcon: { alignItems: 'center' },
  barricadeEmoji: { fontSize: 80, marginBottom: 16 },
  barricadeLabel: {
    color: '#FAFAFA',
    fontSize: 24,
    fontWeight: '700',
    backgroundColor: '#EF4444',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#27272A',
  },
  placeButton: {
    backgroundColor: '#FF6B00',
    paddingHorizontal: 48,
    paddingVertical: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#27272A',
    shadowColor: '#FF6B00',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 8,
  },
  placeButtonText: { color: '#FAFAFA', fontSize: 18, fontWeight: '700' },
  decisionZone: {
    position: 'absolute',
    bottom: 32,
    left: 16,
    right: 16,
    gap: 16,
  },
  decisionButton: {
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#27272A',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  },
  decisionButtonSafe: { backgroundColor: '#EF4444', shadowColor: '#EF4444' },
  decisionButtonDanger: { backgroundColor: '#1A1A1A' },
  decisionButtonText: { color: '#FAFAFA', fontSize: 18, fontWeight: '700' },
});

export default Phase3ActiveInstability;
