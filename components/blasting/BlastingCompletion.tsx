import React, { useEffect, useRef } from 'react';
import {
  Animated,
  Dimensions,
  ImageBackground,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import useBlastingGameStore from '../../stores/blastingGameStore';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

export default function BlastingCompletion({ onExit }: { onExit?: () => void }) {
  const totalXP = useBlastingGameStore((state: any) => state.totalXP);
  const evacuationTime = useBlastingGameStore((state: any) => state.evacuationTime);
  const safetyCompliance = useBlastingGameStore((state: any) => state.safetyCompliance);
  const workerIncidents = useBlastingGameStore((state: any) => state.workerIncidents);
  const resetGame = useBlastingGameStore((state: any) => state.resetGame);

  // Confetti animation
  const confettiAnims = useRef(Array.from({ length: 30 }).map(() => new Animated.Value(0))).current;
  const confettiData = useRef(Array.from({ length: 30 }, (_, i) => ({
    id: i,
    left: Math.random() * SCREEN_WIDTH,
    color: ['#FFD700', '#FFA500', '#FF6347', '#4169E1', '#32CD32'][Math.floor(Math.random() * 5)]
  }))).current;

  useEffect(() => {
    confettiAnims.forEach((anim) => {
      Animated.timing(anim, {
        toValue: 1,
        duration: 3000 + Math.random() * 2000,
        useNativeDriver: true,
      }).start();
    });
  }, [confettiAnims]);

  const confettiElements = confettiData.map((data, i) => ({
    ...data,
    anim: confettiAnims[i]
  }));

  const calculateGrade = () => {
    const score = Math.min(100, (totalXP / 350) * 100);
    if (score >= 95) return 'A+';
    if (score >= 85) return 'A';
    if (score >= 75) return 'B';
    if (score >= 65) return 'C';
    return 'D';
  };

  const grade = calculateGrade();

  const handleRestart = () => {
    resetGame();
  };

  const handleExit = () => {
    resetGame();
    onExit?.();
  };

  return (
    <View style={styles.container}>
      <ImageBackground
        source={{ uri: 'https://images.unsplash.com/photo-1611273426858-450d8e3c9fce?w=1920&q=80' }}
        style={styles.background}
        resizeMode="cover"
      >
        <View style={styles.overlay} />

        {/* Confetti */}
        <View style={StyleSheet.absoluteFill} pointerEvents="none">
          {confettiElements.map((confetti) => (
            <Animated.View
              key={confetti.id}
              style={[
                styles.confetti,
                {
                  backgroundColor: confetti.color,
                  left: confetti.left,
                  transform: [
                    {
                      translateY: confetti.anim.interpolate({
                        inputRange: [0, 1],
                        outputRange: [-20, SCREEN_HEIGHT + 20],
                      }),
                    },
                    {
                      rotate: confetti.anim.interpolate({
                        inputRange: [0, 1],
                        outputRange: ['0deg', '720deg'],
                      }),
                    },
                  ],
                  opacity: confetti.anim.interpolate({
                    inputRange: [0, 0.1, 0.9, 1],
                    outputRange: [0, 1, 1, 0],
                  }),
                },
              ]}
            />
          ))}
        </View>

        <ScrollView contentContainerStyle={styles.scrollContent}>
          {/* Success Badge */}
          <View style={styles.successBadge}>
            <Text style={styles.successEmoji}>🎉</Text>
            <Text style={styles.successTitle}>MISSION COMPLETE!</Text>
            <Text style={styles.successSubtitle}>Blast Operation Successful</Text>
          </View>

          {/* Grade Card */}
          <View style={styles.gradeCard}>
            <Text style={styles.gradeLabel}>Your Grade</Text>
            <View style={styles.gradeCircle}>
              <Text style={styles.gradeText}>{grade}</Text>
            </View>
            <Text style={styles.gradeDescription}>
              {grade === 'A+' && 'Excellent Performance!'}
              {grade === 'A' && 'Great Job!'}
              {grade === 'B' && 'Good Work!'}
              {grade === 'C' && 'Satisfactory'}
              {grade === 'D' && 'Needs Improvement'}
            </Text>
          </View>

          {/* Performance Stats */}
          <View style={styles.statsCard}>
            <Text style={styles.statsTitle}>📊 Performance Summary</Text>
            
            <View style={styles.statsGrid}>
              <View style={styles.statItem}>
                <Text style={styles.statEmoji}>⭐</Text>
                <Text style={styles.statValue}>{totalXP}</Text>
                <Text style={styles.statLabel}>Total XP</Text>
              </View>
              
              <View style={styles.statItem}>
                <Text style={styles.statEmoji}>⏱️</Text>
                <Text style={styles.statValue}>{evacuationTime}s</Text>
                <Text style={styles.statLabel}>Evacuation</Text>
              </View>
              
              <View style={styles.statItem}>
                <Text style={styles.statEmoji}>✅</Text>
                <Text style={styles.statValue}>{safetyCompliance}%</Text>
                <Text style={styles.statLabel}>Compliance</Text>
              </View>
              
              <View style={styles.statItem}>
                <Text style={styles.statEmoji}>👷</Text>
                <Text style={styles.statValue}>{workerIncidents}</Text>
                <Text style={styles.statLabel}>Incidents</Text>
              </View>
            </View>
          </View>

          {/* Achievements */}
          <View style={styles.achievementsCard}>
            <Text style={styles.achievementsTitle}>🏆 Achievements</Text>
            
            <View style={styles.achievementItem}>
              <Text style={styles.achievementBadge}>🎖️</Text>
              <View style={styles.achievementContent}>
                <Text style={styles.achievementName}>Blast Master</Text>
                <Text style={styles.achievementDesc}>Completed blasting simulation</Text>
              </View>
            </View>
            
            {workerIncidents === 0 && (
              <View style={styles.achievementItem}>
                <Text style={styles.achievementBadge}>🛡️</Text>
                <View style={styles.achievementContent}>
                  <Text style={styles.achievementName}>Zero Incidents</Text>
                  <Text style={styles.achievementDesc}>Perfect safety record</Text>
                </View>
              </View>
            )}
            
            {evacuationTime < 40 && (
              <View style={styles.achievementItem}>
                <Text style={styles.achievementBadge}>⚡</Text>
                <View style={styles.achievementContent}>
                  <Text style={styles.achievementName}>Swift Evacuator</Text>
                  <Text style={styles.achievementDesc}>Fast evacuation time</Text>
                </View>
              </View>
            )}
          </View>

          {/* Buttons */}
          <View style={styles.buttonsContainer}>
            <TouchableOpacity
              style={styles.restartButton}
              onPress={handleRestart}
              activeOpacity={0.8}
            >
              <Text style={styles.buttonText}>🔄 TRY AGAIN</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.exitButton}
              onPress={handleExit}
              activeOpacity={0.8}
            >
              <Text style={styles.buttonText}>← EXIT</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.bottomSpacer} />
        </ScrollView>
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
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
  },
  scrollContent: {
    paddingTop: 60,
    paddingBottom: 40,
    paddingHorizontal: 16,
    alignItems: 'center',
  },
  confetti: {
    position: 'absolute',
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  successBadge: {
    alignItems: 'center',
    marginBottom: 32,
  },
  successEmoji: {
    fontSize: 80,
    marginBottom: 16,
  },
  successTitle: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 8,
    textShadowColor: 'rgba(0, 0, 0, 0.8)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  successSubtitle: {
    fontSize: 18,
    color: '#FDE047',
    fontWeight: '600',
  },
  gradeCard: {
    backgroundColor: 'rgba(17, 24, 39, 0.95)',
    borderRadius: 20,
    padding: 32,
    width: SCREEN_WIDTH - 32,
    maxWidth: 600,
    alignItems: 'center',
    marginBottom: 20,
    borderWidth: 4,
    borderColor: '#F59E0B',
  },
  gradeLabel: {
    fontSize: 18,
    color: '#D1D5DB',
    marginBottom: 16,
  },
  gradeCircle: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#F59E0B',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 6,
    borderColor: '#FFFFFF',
    marginBottom: 16,
  },
  gradeText: {
    fontSize: 48,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  gradeDescription: {
    fontSize: 20,
    color: '#FDE047',
    fontWeight: 'bold',
  },
  statsCard: {
    backgroundColor: 'rgba(17, 24, 39, 0.95)',
    borderRadius: 20,
    padding: 24,
    width: SCREEN_WIDTH - 32,
    maxWidth: 600,
    marginBottom: 20,
  },
  statsTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 20,
    textAlign: 'center',
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  statItem: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: 'rgba(59, 130, 246, 0.2)',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#3B82F6',
  },
  statEmoji: {
    fontSize: 32,
    marginBottom: 8,
  },
  statValue: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 14,
    color: '#9CA3AF',
  },
  achievementsCard: {
    backgroundColor: 'rgba(17, 24, 39, 0.95)',
    borderRadius: 20,
    padding: 24,
    width: SCREEN_WIDTH - 32,
    maxWidth: 600,
    marginBottom: 32,
  },
  achievementsTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 20,
    textAlign: 'center',
  },
  achievementItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#10B981',
  },
  achievementBadge: {
    fontSize: 40,
    marginRight: 16,
  },
  achievementContent: {
    flex: 1,
  },
  achievementName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  achievementDesc: {
    fontSize: 14,
    color: '#9CA3AF',
  },
  buttonsContainer: {
    width: SCREEN_WIDTH - 32,
    maxWidth: 600,
    gap: 12,
  },
  restartButton: {
    backgroundColor: '#3B82F6',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 3,
    borderColor: '#FFFFFF',
  },
  exitButton: {
    backgroundColor: '#6B7280',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 3,
    borderColor: '#FFFFFF',
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: 'bold',
  },
  bottomSpacer: {
    height: 40,
  },
});
