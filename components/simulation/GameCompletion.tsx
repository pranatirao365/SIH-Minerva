import React from 'react';
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
import useGameStore, { GAME_EVENTS } from '../../stores/gameStore';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

export default function GameCompletion({ onExit }: { onExit?: () => void }) {
  const safetyScore = useGameStore(state => state.safetyScore);
  const timeElapsed = useGameStore(state => state.timeElapsed);
  const decisionsCorrect = useGameStore(state => state.decisionsCorrect);
  const decisionsTotal = useGameStore(state => state.decisionsTotal);
  const completedEvents = useGameStore(state => state.completedEvents);
  const resetGame = useGameStore(state => state.resetGame);
  
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };
  
  const getGrade = (score: number) => {
    if (score >= 90) return { grade: 'A+', emoji: '🏆' };
    if (score >= 80) return { grade: 'A', emoji: '⭐' };
    if (score >= 70) return { grade: 'B', emoji: '👍' };
    if (score >= 60) return { grade: 'C', emoji: '👌' };
    return { grade: 'D', emoji: '⚠️' };
  };
  
  const gradeInfo = getGrade(safetyScore);
  const successRate = decisionsTotal > 0 
    ? ((decisionsCorrect / decisionsTotal) * 100).toFixed(0) 
    : '100';
  
  // Confetti animation
  const confettiElements = Array.from({ length: 30 }, (_, i) => {
    const anim = new Animated.Value(0);
    const colors = ['#FFD700', '#FF6B6B', '#4ECDC4', '#45B7D1', '#FFA07A'];
    
    Animated.loop(
      Animated.timing(anim, {
        toValue: 1,
        duration: 2000 + Math.random() * 1000,
        useNativeDriver: true,
      })
    ).start();
    
    return {
      anim,
      id: i,
      color: colors[Math.floor(Math.random() * colors.length)],
      left: Math.random() * SCREEN_WIDTH,
    };
  });
  
  return (
    <View style={styles.container}>
      <ImageBackground
        source={require('../../assets/images/mine-location3.jpeg')}
        style={styles.background}
        resizeMode="cover"
      >
        {/* Dark Overlay */}
        <View style={styles.overlay} />
        
        {/* Confetti Animation */}
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
        
        {/* Content */}
        <ScrollView
          contentContainerStyle={styles.contentContainer}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.content}>
            {/* Completion Badge */}
            <View style={styles.badgeContainer}>
              <Text style={styles.badgeEmoji}>{gradeInfo.emoji}</Text>
              <Text style={styles.badgeTitle}>Mission Complete!</Text>
              <Text style={styles.badgeSubtitle}>
                You've successfully navigated the coal mine
              </Text>
            </View>
            
            {/* Grade Display */}
            <View style={styles.gradeCard}>
              <Text style={styles.gradeLabel}>Safety Grade</Text>
              <Text style={styles.gradeValue}>{gradeInfo.grade}</Text>
              <Text style={styles.gradeScore}>{safetyScore}/100</Text>
            </View>
            
            {/* Stats Grid */}
            <View style={styles.statsGrid}>
              <View style={styles.statCard}>
                <Text style={styles.statEmoji}>⏱️</Text>
                <Text style={styles.statValue}>{formatTime(timeElapsed)}</Text>
                <Text style={styles.statLabel}>Time Taken</Text>
              </View>
              
              <View style={styles.statCard}>
                <Text style={styles.statEmoji}>✅</Text>
                <Text style={styles.statValue}>{successRate}%</Text>
                <Text style={styles.statLabel}>Success Rate</Text>
              </View>
              
              <View style={styles.statCard}>
                <Text style={styles.statEmoji}>⚠️</Text>
                <Text style={styles.statValue}>{completedEvents.length}</Text>
                <Text style={styles.statLabel}>Events Handled</Text>
              </View>
              
              <View style={styles.statCard}>
                <Text style={styles.statEmoji}>📏</Text>
                <Text style={styles.statValue}>250m</Text>
                <Text style={styles.statLabel}>Distance</Text>
              </View>
            </View>
            
            {/* Key Learnings */}
            <View style={styles.learningsCard}>
              <View style={styles.learningsHeader}>
                <Text style={styles.learningsEmoji}>📚</Text>
                <Text style={styles.learningsTitle}>Key Safety Learnings</Text>
              </View>
              
              {GAME_EVENTS.filter(event => 
                completedEvents.includes(event.id)
              ).map((event) => {
                const eventEmojis: Record<string, string> = {
                  smoke: '💨',
                  fire: '🔥',
                  blockage: '🚧',
                  gas: '☠️',
                };
                
                return (
                  <View key={event.id} style={styles.learningItem}>
                    <View style={styles.learningHeader}>
                      <Text style={styles.learningEmoji}>
                        {eventEmojis[event.type] || '⚠️'}
                      </Text>
                      <View style={styles.learningHeaderText}>
                        <Text style={styles.learningTitle}>{event.title}</Text>
                        <Text style={styles.learningSeverity}>
                          {event.severity.toUpperCase()}
                        </Text>
                      </View>
                    </View>
                    {event.instructions.slice(0, 2).map((instruction, i) => (
                      <View key={i} style={styles.learningInstruction}>
                        <Text style={styles.learningCheckmark}>✓</Text>
                        <Text style={styles.learningInstructionText} numberOfLines={2}>
                          {instruction}
                        </Text>
                      </View>
                    ))}
                  </View>
                );
              })}
            </View>
            
            {/* Action Buttons */}
            <View style={styles.buttonContainer}>
              <TouchableOpacity
                onPress={resetGame}
                style={[styles.button, styles.playAgainButton]}
                activeOpacity={0.8}
              >
                <Text style={styles.buttonEmoji}>🔄</Text>
                <Text style={styles.buttonText}>Play Again</Text>
              </TouchableOpacity>
              
              {onExit && (
                <TouchableOpacity
                  onPress={onExit}
                  style={[styles.button, styles.homeButton]}
                  activeOpacity={0.8}
                >
                  <Text style={styles.buttonEmoji}>🏠</Text>
                  <Text style={styles.buttonText}>Home</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
        </ScrollView>
      </ImageBackground>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  background: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.85)',
  },
  confetti: {
    position: 'absolute',
    width: 12,
    height: 12,
    borderRadius: 2,
  },
  contentContainer: {
    flexGrow: 1,
    paddingHorizontal: 20,
    paddingVertical: 40,
  },
  content: {
    flex: 1,
    alignItems: 'center',
  },
  badgeContainer: {
    alignItems: 'center',
    marginBottom: 24,
  },
  badgeEmoji: {
    fontSize: 80,
    marginBottom: 16,
  },
  badgeTitle: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 8,
  },
  badgeSubtitle: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.7)',
    textAlign: 'center',
  },
  gradeCard: {
    backgroundColor: '#10B981',
    borderRadius: 20,
    padding: 24,
    alignItems: 'center',
    marginBottom: 24,
    borderWidth: 3,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  gradeLabel: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
    fontWeight: 'bold',
    marginBottom: 8,
  },
  gradeValue: {
    fontSize: 60,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  gradeScore: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginTop: 8,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    width: '100%',
    marginBottom: 24,
  },
  statCard: {
    width: '48%',
    backgroundColor: 'rgba(59, 130, 246, 0.2)',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(59, 130, 246, 0.3)',
    alignItems: 'center',
    marginBottom: 12,
  },
  statEmoji: {
    fontSize: 32,
    marginBottom: 8,
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.7)',
    fontWeight: '600',
  },
  learningsCard: {
    backgroundColor: 'rgba(40, 40, 40, 0.9)',
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: 'rgba(234, 179, 8, 0.3)',
    width: '100%',
    marginBottom: 24,
  },
  learningsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    gap: 8,
  },
  learningsEmoji: {
    fontSize: 24,
  },
  learningsTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#EAB308',
  },
  learningItem: {
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  learningHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    gap: 12,
  },
  learningEmoji: {
    fontSize: 24,
  },
  learningHeaderText: {
    flex: 1,
  },
  learningTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  learningSeverity: {
    fontSize: 10,
    color: 'rgba(255, 255, 255, 0.5)',
    marginTop: 2,
  },
  learningInstruction: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 4,
    gap: 8,
  },
  learningCheckmark: {
    fontSize: 14,
    color: '#10B981',
  },
  learningInstructionText: {
    flex: 1,
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.7)',
    lineHeight: 18,
  },
  buttonContainer: {
    flexDirection: 'row',
    gap: 12,
    width: '100%',
    paddingBottom: 20,
  },
  button: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 12,
    gap: 8,
  },
  playAgainButton: {
    backgroundColor: '#10B981',
  },
  homeButton: {
    backgroundColor: '#3B82F6',
  },
  buttonEmoji: {
    fontSize: 20,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
});
