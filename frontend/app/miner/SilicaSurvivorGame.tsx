/**
 * ========================================
 * SILICA SURVIVOR - Educational Mining Safety Game
 * ========================================
 * 
 * A 2D auto-runner game teaching miners about silica dust hazards and PPE importance.
 * 
 * GAME FLOW:
 * 1. Miner auto-walks through mine tunnel
 * 2. Encounters 4 silica hazard zones (waves)
 * 3. At each zone: game pauses → question popup → player choice
 * 4. Choices affect: health, PPE worn, character sprite
 * 5. Final score and character evolution based on decisions
 * 
 * FEATURES:
 * - Auto-walking character with animation
 * - Checkpoint-based hazard zones
 * - Dynamic character sprite evolution (base/specs/mask/both/damaged)
 * - Health system with damage logic
 * - Educational question popups
 * - Silica particle VFX at hazard zones
 * - Scrolling background
 */

import { useRouter } from 'expo-router';
import React, { useEffect, useRef, useState } from 'react';
import { Animated, Dimensions, Image, Modal, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ArrowLeft } from '../../components/Icons';
import { COLORS } from '../../constants/styles';

// Character sprite images for different PPE states (background removed versions)
const SPRITES = {
  base: require('../../assets/images/nothing-removebg-preview.png'),        // No PPE
  withSpecs: require('../../assets/images/spec-removebg-preview.png'),      // Safety specs only
  withMask: require('../../assets/images/mask-removebg-preview.png'),       // Mask only
  withBoth: require('../../assets/images/both-removebg-preview.png'),       // Both mask + specs
  damaged: require('../../assets/images/damaged-removebg-preview.png'),     // Health < 40% (coughing/sick)
};

// ========================================
// INTERFACES & TYPES
// ========================================

interface GameState {
  isRunning: boolean;
  health: number;
  currentWave: number;
  gameOver: boolean;
  gameCompleted: boolean;
  showPopup: boolean;
  minerPosition: number; // 0 to 100 (percentage across screen)
  scrollPosition: number; // Background scroll offset
}

interface PPEState {
  hasSpecs: boolean;
  hasMask: boolean;
}

interface Wave {
  id: number;
  position: number; // % position where wave triggers
  title: string;
  question: string;
  options: string[];
  correctAnswer?: number;
}

interface SilicaParticle {
  id: string;
  x: number;
  y: number;
  opacity: number;
}

// ========================================
// GAME CONSTANTS
// ========================================

const SCREEN_WIDTH = Dimensions.get('window').width;
const SCREEN_HEIGHT = Dimensions.get('window').height;
const GAME_HEIGHT = SCREEN_HEIGHT * 0.45; // 45% of screen height
const MINER_SIZE = 100;
const WALKING_SPEED = 0.3; // % per frame (slower for readability)
const WAVE_POSITIONS = [5, 25, 45, 65]; // % positions for each silica zone
const PARTICLE_COUNT = 25;
const PARTICLE_FALL_SPEED = 2; // pixels per frame
const MAX_POSITION = 85; // Maximum position to keep miner visible

// ========================================
// MAIN GAME COMPONENT
// ========================================

export default function SilicaSurvivorGame() {
  const router = useRouter();

  // ========== STATE MANAGEMENT ==========
  
  const [gameState, setGameState] = useState<GameState>({
    isRunning: true,
    health: 100,
    currentWave: 0,
    gameOver: false,
    gameCompleted: false,
    showPopup: false,
    minerPosition: 0,
    scrollPosition: 0,
  });

  const [ppeState, setPpeState] = useState<PPEState>({
    hasSpecs: false,
    hasMask: false,
  });

  const [particles, setParticles] = useState<SilicaParticle[]>([]);
  const [currentQuestion, setCurrentQuestion] = useState<Wave | null>(null);

  // Animation refs
  const walkAnimation = useRef(new Animated.Value(0)).current;
  const particleAnimation = useRef(new Animated.Value(0)).current;

  // ========================================
  // WAVE DEFINITIONS (4 Checkpoint Questions)
  // ========================================

  const waves: Wave[] = [
    {
      id: 1,
      position: WAVE_POSITIONS[0],
      title: '⚠ Silica Zone 1',
      question: 'You are entering a silica dust zone. Do you want to wear safety specs?',
      options: ['Yes, wear specs', 'No, continue without specs'],
    },
    {
      id: 2,
      position: WAVE_POSITIONS[1],
      title: '⚠ Silica Zone 2',
      question: 'Silica dust is getting thicker. Do you want to wear a protective mask?',
      options: ['Yes, wear mask', 'No, continue without mask'],
    },
    {
      id: 3,
      position: WAVE_POSITIONS[2],
      title: '🧠 Knowledge Check',
      question: 'Which PPE equipment have you NOT worn so far?',
      options: ['Mask only', 'Specs only', 'Both mask and specs', 'I wore all PPE'],
      correctAnswer: 0, // Will be determined dynamically
    },
    {
      id: 4,
      position: WAVE_POSITIONS[3],
      title: '💨 Final Exposure Zone',
      question: 'Heavy silica exposure ahead! Your current PPE will be tested.',
      options: ['Continue with current PPE'],
    },
  ];

  // ========================================
  // CHARACTER SPRITE EVOLUTION LOGIC  
  // ========================================
  // Sprite mapping based on PPE state and health
  // SPRITE EVOLUTION LOGIC:
  // Character sprite changes based on health + PPE state
  const getMinerSprite = () => {
    const isDamaged = gameState.health < 40;

    // Priority: Show damage if health is critical
    if (isDamaged) {
      return SPRITES.damaged;
    }

    // Show PPE combinations
    if (ppeState.hasMask && ppeState.hasSpecs) {
      return SPRITES.withBoth;
    }
    if (ppeState.hasMask) {
      return SPRITES.withMask;
    }
    if (ppeState.hasSpecs) {
      return SPRITES.withSpecs;
    }

    return SPRITES.base;
  };

  // ========================================
  // GAME LOOP - AUTO WALKING
  // ========================================

  useEffect(() => {
    if (!gameState.isRunning || gameState.showPopup || gameState.gameOver || gameState.gameCompleted) {
      return;
    }

    const gameLoop = setInterval(() => {
      setGameState(prev => {
        const newPosition = prev.minerPosition + WALKING_SPEED;
        const newScroll = prev.scrollPosition + 2;

        // Check if miner reached a wave checkpoint
        const nextWave = waves[prev.currentWave];
        if (nextWave && newPosition >= nextWave.position) {
          // Special handling for Wave 4: If no PPE, apply immediate damage and show damaged sprite
          if (nextWave.id === 4 && !ppeState.hasMask && !ppeState.hasSpecs) {
            const criticalHealth = Math.max(0, prev.health - 50);
            spawnParticles(); // Show danger particles
            return {
              ...prev,
              health: criticalHealth,
              currentWave: prev.currentWave + 1,
              gameOver: criticalHealth <= 0,
              isRunning: criticalHealth > 0,
            };
          }
          
          // PAUSE GAME - Show popup for zones with questions
          triggerWave(nextWave);
          return {
            ...prev,
            showPopup: true,
            isRunning: false,
          };
        }

        // Check if game completed (reached MAX_POSITION to keep miner visible)
        if (newPosition >= MAX_POSITION) {
          return {
            ...prev,
            minerPosition: MAX_POSITION,
            gameCompleted: true,
            isRunning: false,
          };
        }

        return {
          ...prev,
          minerPosition: newPosition,
          scrollPosition: newScroll,
        };
      });
    }, 50); // 20 FPS

    return () => clearInterval(gameLoop);
  }, [gameState.isRunning, gameState.showPopup, gameState.gameOver, gameState.gameCompleted, gameState.currentWave]);

  // ========================================
  // WALKING ANIMATION
  // ========================================

  useEffect(() => {
    if (gameState.isRunning && !gameState.showPopup) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(walkAnimation, {
            toValue: 1,
            duration: 400,
            useNativeDriver: true,
          }),
          Animated.timing(walkAnimation, {
            toValue: 0,
            duration: 400,
            useNativeDriver: true,
          }),
        ])
      ).start();
    }
  }, [gameState.isRunning, gameState.showPopup]);

  // ========================================
  // SILICA PARTICLE VFX
  // ========================================

  const spawnParticles = () => {
    const newParticles: SilicaParticle[] = [];
    for (let i = 0; i < PARTICLE_COUNT; i++) {
      newParticles.push({
        id: `particle-${Date.now()}-${i}`,
        x: Math.random() * SCREEN_WIDTH,
        y: -Math.random() * GAME_HEIGHT, // Start above screen
        opacity: Math.random() * 0.6 + 0.4,
      });
    }
    setParticles(newParticles);
  };

  // Show particles after Zone 1
  useEffect(() => {
    if (gameState.currentWave >= 1 && particles.length === 0) {
      spawnParticles();
    }
  }, [gameState.currentWave]);

  // Continuous particle falling animation
  useEffect(() => {
    if (particles.length === 0) return;

    const interval = setInterval(() => {
      setParticles(prevParticles => 
        prevParticles.map(particle => {
          const newY = particle.y + PARTICLE_FALL_SPEED;
          
          // Reset particle to top if it goes below screen
          if (newY > GAME_HEIGHT) {
            return {
              ...particle,
              y: -20,
              x: Math.random() * SCREEN_WIDTH,
              opacity: Math.random() * 0.6 + 0.4,
            };
          }
          
          return { ...particle, y: newY };
        })
      );
    }, 50); // Update every 50ms for smooth animation

    return () => clearInterval(interval);
  }, [particles.length]);

  // ========================================
  // WAVE TRIGGER SYSTEM
  // ========================================

  const triggerWave = (wave: Wave) => {
    setCurrentQuestion(wave);
    spawnParticles(); // Show silica VFX

    // For Wave 3, determine correct answer dynamically
    if (wave.id === 3) {
      let correctOption = 3; // Default: wore all PPE
      if (!ppeState.hasMask && !ppeState.hasSpecs) {
        correctOption = 2; // Both not worn
      } else if (!ppeState.hasMask) {
        correctOption = 0; // Mask not worn
      } else if (!ppeState.hasSpecs) {
        correctOption = 1; // Specs not worn
      }
      wave.correctAnswer = correctOption;
    }
  };

  // ========================================
  // ANSWER HANDLERS
  // ========================================

  const handleAnswer = (answerIndex: number) => {
    if (!currentQuestion) return;

    let healthChange = 0;
    // Preserve existing PPE state and add new items
    const ppeUpdate = { ...ppeState };

    switch (currentQuestion.id) {
      case 1: // Wave 1 - Specs decision
        if (answerIndex === 0) {
          // YES - Wear specs (preserve mask if already worn)
          ppeUpdate.hasSpecs = true;
        } else {
          // NO - Lose health
          healthChange = -10;
        }
        break;

      case 2: // Wave 2 - Mask decision
        if (answerIndex === 0) {
          // YES - Wear mask (preserve specs if already worn)
          ppeUpdate.hasMask = true;
        } else {
          // NO - Lose more health
          healthChange = -20;
        }
        break;

      case 3: // Wave 3 - Knowledge check
        if (answerIndex === currentQuestion.correctAnswer) {
          // Correct answer - health recovery
          healthChange = 5;
        } else {
          // Wrong answer - penalty
          healthChange = -15;
        }
        break;

      case 4: // Wave 4 - Final exposure
        // Calculate damage based on PPE worn
        if (ppeUpdate.hasMask && ppeUpdate.hasSpecs) {
          healthChange = 0; // Full protection - both items worn
        } else {
          // Missing at least one PPE item - apply critical damage to show damaged sprite
          healthChange = -65; // Heavy damage to bring health below 40% and trigger damaged.png
        }
        break;
    }

    // Apply changes
    setPpeState(ppeUpdate);
    console.log('PPE State Updated:', ppeUpdate);

    setGameState(prev => {
      const newHealth = Math.max(0, Math.min(100, prev.health + healthChange));

      // Check if health depleted
      if (newHealth <= 0) {
        return {
          ...prev,
          health: 0,
          gameOver: true,
          showPopup: false,
          isRunning: false,
        };
      }

      return {
        ...prev,
        health: newHealth,
        currentWave: prev.currentWave + 1,
        showPopup: false,
        isRunning: true,
      };
    });

    setParticles([]); // Clear particles after answer
  };

  // ========================================
  // GAME CONTROL HANDLERS
  // ========================================

  const handlePlayAgain = () => {
    setGameState({
      isRunning: true,
      health: 100,
      currentWave: 0,
      gameOver: false,
      gameCompleted: false,
      showPopup: false,
      minerPosition: 0,
      scrollPosition: 0,
    });
    setPpeState({ hasSpecs: false, hasMask: false });
    setParticles([]);
    setCurrentQuestion(null);
  };

  const handleGoBack = () => {
    router.back();
  };

  // ========================================
  // RENDER HELPERS
  // ========================================

  const getHealthColor = () => {
    if (gameState.health > 70) return '#10B981';
    if (gameState.health > 40) return '#F59E0B';
    return '#EF4444';
  };

  const getFinalMessage = () => {
    if (gameState.health === 100) {
      return '🏆 Perfect! You made excellent safety decisions!';
    } else if (gameState.health >= 70) {
      return '✅ Good job! You protected yourself well.';
    } else if (gameState.health >= 40) {
      return '⚠ You survived, but need better PPE awareness.';
    } else {
      return '❌ Critical health! Always wear proper PPE.';
    }
  };

  // ========================================
  // RENDER
  // ========================================

  return (
    <SafeAreaView style={styles.container}>
      {/* HEADER */}
      <View style={styles.header}>
        <TouchableOpacity onPress={handleGoBack} style={styles.backButton}>
          <ArrowLeft size={24} color={COLORS.primary} />
        </TouchableOpacity>
        <Text style={styles.title}>Silica Survivor</Text>
        <View style={styles.spacer} />
      </View>

      {/* HEALTH BAR */}
      <View style={styles.healthContainer}>
        <Text style={styles.healthLabel}>Health</Text>
        <View style={styles.healthBarBg}>
          <View
            style={[
              styles.healthBarFill,
              {
                width: `${gameState.health}%`,
                backgroundColor: getHealthColor(),
              },
            ]}
          />
        </View>
        <Text style={styles.healthText}>{Math.round(gameState.health)}%</Text>
      </View>

      {/* GAME CANVAS */}
      <View style={styles.gameCanvas}>
        {/* SCROLLING BACKGROUND */}
        <View
          style={[
            styles.background,
            {
              transform: [{ translateX: -(gameState.scrollPosition % SCREEN_WIDTH) }],
            },
          ]}
        >
          {/* Mine tunnel pattern */}
          <View style={styles.tunnelPattern} />
        </View>

        {/* SILICA PARTICLES (VFX) */}
        {particles.map(particle => (
          <View
            key={particle.id}
            style={[
              styles.particle,
              {
                left: particle.x,
                top: particle.y,
                opacity: particle.opacity,
              },
            ]}
          />
        ))}

        {/* MINER CHARACTER */}
        <Animated.View
          style={[
            styles.miner,
            {
              left: `${gameState.minerPosition}%`,
              transform: [
                {
                  translateY: walkAnimation.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0, -5],
                  }),
                },
              ],
            },
          ]}
        >
          {/* Background glow effect */}
          <View style={[
            styles.characterGlow,
            {
              backgroundColor: gameState.health < 40 ? 'rgba(239, 68, 68, 0.3)' : 'rgba(255, 215, 0, 0.2)',
            }
          ]} />
          
          <Image 
            source={getMinerSprite()} 
            style={[
              styles.minerSprite,
              gameState.health < 40 && styles.damagedSprite
            ]}
            resizeMode="contain"
          />
        </Animated.View>

        {/* WAVE ZONE MARKERS */}
        {waves.map((wave, index) => (
          <View
            key={wave.id}
            style={[
              styles.waveMarker,
              {
                left: `${wave.position}%`,
                backgroundColor:
                  gameState.currentWave > index ? 'rgba(16, 185, 129, 0.3)' : 'rgba(239, 68, 68, 0.3)',
              },
            ]}
          >
            <Text style={styles.waveMarkerText}>Zone {wave.id}</Text>
          </View>
        ))}

        {/* FINISH LINE */}
        <View style={styles.finishLine}>
          <Text style={styles.finishLineText}>🏁</Text>
        </View>
      </View>

      {/* PROGRESS BAR */}
      <View style={styles.progressContainer}>
        <Text style={styles.progressLabel}>Progress</Text>
        <View style={styles.progressBarBg}>
          <View
            style={[
              styles.progressBarFill,
              {
                width: `${Math.min(100, (gameState.minerPosition / MAX_POSITION) * 100)}%`,
              },
            ]}
          />
        </View>
        <Text style={styles.progressText}>{Math.round(Math.min(100, (gameState.minerPosition / MAX_POSITION) * 100))}%</Text>
      </View>

      {/* QUESTION POPUP MODAL */}
      <Modal
        visible={gameState.showPopup && currentQuestion !== null}
        transparent={true}
        animationType="fade"
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>{currentQuestion?.title}</Text>
            <Text style={styles.modalQuestion}>{currentQuestion?.question}</Text>

            <View style={styles.optionsContainer}>
              {currentQuestion?.options.map((option, index) => (
                <TouchableOpacity
                  key={index}
                  style={styles.optionButton}
                  onPress={() => handleAnswer(index)}
                >
                  <Text style={styles.optionText}>{option}</Text>
                </TouchableOpacity>
              ))}
            </View>

            {currentQuestion?.id === 4 && (
              <Text style={styles.finalWaveNote}>
                ⚠ Your PPE: {ppeState.hasMask ? '✓ Mask' : '✗ Mask'} | {ppeState.hasSpecs ? '✓ Specs' : '✗ Specs'}
              </Text>
            )}
          </View>
        </View>
      </Modal>

      {/* GAME OVER MODAL */}
      <Modal
        visible={gameState.gameOver}
        transparent={true}
        animationType="fade"
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.gameOverTitle}>💀 Game Over</Text>
            <Text style={styles.gameOverMessage}>
              Your health depleted due to silica exposure!{'\n\n'}
              Always wear proper PPE in hazardous environments.
            </Text>
            <TouchableOpacity style={styles.playAgainButton} onPress={handlePlayAgain}>
              <Text style={styles.playAgainText}>Try Again</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.backButton2} onPress={handleGoBack}>
              <Text style={styles.backButtonText}>Back to Home</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* GAME COMPLETED MODAL */}
      <Modal
        visible={gameState.gameCompleted}
        transparent={true}
        animationType="fade"
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.completedTitle}>🎉 Mission Complete!</Text>
            <Text style={styles.completedSubtitle}>
              Final Health: {Math.round(gameState.health)}%
            </Text>
            <Text style={styles.finalMessage}>{getFinalMessage()}</Text>

            <View style={styles.ppeReport}>
              <Text style={styles.ppeReportTitle}>PPE Worn:</Text>
              <Text style={styles.ppeReportItem}>
                {ppeState.hasMask ? '✅' : '❌'} Safety Mask
              </Text>
              <Text style={styles.ppeReportItem}>
                {ppeState.hasSpecs ? '✅' : '❌'} Safety Specs
              </Text>
            </View>

            <TouchableOpacity style={styles.playAgainButton} onPress={handlePlayAgain}>
              <Text style={styles.playAgainText}>Play Again</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.backButton2} onPress={handleGoBack}>
              <Text style={styles.backButtonText}>Back to Home</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

// ========================================
// STYLES
// ========================================

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0a0a0a',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingVertical: 12,
    backgroundColor: '#1a1a1a',
    borderBottomWidth: 2,
    borderBottomColor: '#FFD700',
  },
  backButton: {
    padding: 6,
  },
  title: {
    color: '#FFD700',
    fontSize: 18,
    fontWeight: 'bold',
    flex: 1,
    textAlign: 'center',
  },
  spacer: {
    width: 32,
  },

  // Health Bar
  healthContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: '#1a1a1a',
    borderBottomWidth: 1,
    borderBottomColor: '#333',
  },
  healthLabel: {
    color: '#FFD700',
    fontSize: 13,
    fontWeight: 'bold',
    marginRight: 8,
  },
  healthBarBg: {
    flex: 1,
    height: 18,
    backgroundColor: '#333',
    borderRadius: 9,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: '#555',
  },
  healthBarFill: {
    height: '100%',
    borderRadius: 9,
  },
  healthText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: 'bold',
    marginLeft: 8,
    minWidth: 40,
    textAlign: 'right',
  },

  // Game Canvas
  gameCanvas: {
    height: GAME_HEIGHT,
    backgroundColor: '#2C1810',
    position: 'relative',
    overflow: 'hidden',
    borderTopWidth: 2,
    borderBottomWidth: 2,
    borderColor: '#8B4513',
  },
  background: {
    position: 'absolute',
    width: SCREEN_WIDTH * 3,
    height: '100%',
    backgroundColor: '#3D2817',
  },
  tunnelPattern: {
    width: '100%',
    height: '100%',
    backgroundColor: 'repeating-linear-gradient(90deg, #3D2817 0px, #3D2817 100px, #2C1810 100px, #2C1810 200px)',
  },

  // Miner Character
  miner: {
    position: 'absolute',
    bottom: GAME_HEIGHT * 0.25, // 25% from bottom for better visibility
    width: MINER_SIZE,
    height: MINER_SIZE,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
  },
  characterGlow: {
    position: 'absolute',
    width: MINER_SIZE + 20,
    height: MINER_SIZE + 20,
    borderRadius: (MINER_SIZE + 20) / 2,
    zIndex: -1,
  },
  minerSprite: {
    width: MINER_SIZE,
    height: MINER_SIZE,
  },
  damagedSprite: {
    width: MINER_SIZE + 15, // 15px larger for damaged state
    height: MINER_SIZE + 15,
  },

  // Silica Particles
  particle: {
    position: 'absolute',
    width: 8,
    height: 8,
    backgroundColor: '#D3D3D3',
    borderRadius: 4,
    zIndex: 5,
  },

  // Wave Markers
  waveMarker: {
    position: 'absolute',
    bottom: 0,
    top: 0,
    width: 60,
    justifyContent: 'center',
    alignItems: 'center',
    borderLeftWidth: 3,
    borderRightWidth: 3,
    borderColor: '#EF4444',
  },
  waveMarkerText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: 'bold',
    transform: [{ rotate: '-90deg' }],
  },

  // Finish Line
  finishLine: {
    position: 'absolute',
    right: 0,
    top: 0,
    bottom: 0,
    width: 50,
    backgroundColor: '#10B981',
    justifyContent: 'center',
    alignItems: 'center',
    opacity: 0.8,
  },
  finishLineText: {
    fontSize: 35,
  },

  // Progress Bar
  progressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: '#1a1a1a',
    borderTopWidth: 1,
    borderTopColor: '#333',
  },
  progressLabel: {
    color: '#4CAF50',
    fontSize: 13,
    fontWeight: 'bold',
    marginRight: 8,
  },
  progressBarBg: {
    flex: 1,
    height: 10,
    backgroundColor: '#333',
    borderRadius: 5,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: '#4CAF50',
    borderRadius: 5,
  },
  progressText: {
    color: '#4CAF50',
    fontSize: 13,
    fontWeight: 'bold',
    marginLeft: 8,
    minWidth: 40,
    textAlign: 'right',
  },

  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 12,
  },
  modalContent: {
    backgroundColor: '#1a1a1a',
    borderRadius: 12,
    padding: 18,
    width: '95%',
    maxWidth: 420,
    maxHeight: '80%',
    borderWidth: 2,
    borderColor: '#FFD700',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFD700',
    textAlign: 'center',
    marginBottom: 12,
  },
  modalQuestion: {
    fontSize: 15,
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 20,
    lineHeight: 22,
  },
  optionsContainer: {
    gap: 10,
  },
  optionButton: {
    backgroundColor: '#FFD700',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 10,
    alignItems: 'center',
  },
  optionText: {
    color: '#000000',
    fontSize: 15,
    fontWeight: '600',
  },
  finalWaveNote: {
    marginTop: 16,
    fontSize: 13,
    color: '#FFD700',
    textAlign: 'center',
    fontWeight: 'bold',
  },

  // Game Over
  gameOverTitle: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#EF4444',
    textAlign: 'center',
    marginBottom: 16,
  },
  gameOverMessage: {
    fontSize: 15,
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 22,
  },

  // Game Completed
  completedTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#4CAF50',
    textAlign: 'center',
    marginBottom: 10,
  },
  completedSubtitle: {
    fontSize: 16,
    color: '#FFD700',
    textAlign: 'center',
    marginBottom: 12,
    fontWeight: 'bold',
  },
  finalMessage: {
    fontSize: 14,
    color: '#CCCCCC',
    textAlign: 'center',
    marginBottom: 16,
    lineHeight: 20,
  },
  ppeReport: {
    backgroundColor: '#2a2a2a',
    padding: 12,
    borderRadius: 10,
    marginBottom: 20,
    borderWidth: 2,
    borderColor: '#FFD700',
  },
  ppeReportTitle: {
    fontSize: 14,
    color: '#FFD700',
    fontWeight: 'bold',
    marginBottom: 8,
    textAlign: 'center',
  },
  ppeReportItem: {
    fontSize: 13,
    color: '#FFFFFF',
    marginBottom: 4,
  },

  // Buttons
  playAgainButton: {
    backgroundColor: '#FFD700',
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
    marginBottom: 10,
  },
  playAgainText: {
    color: '#000000',
    fontSize: 16,
    fontWeight: 'bold',
  },
  backButton2: {
    paddingVertical: 12,
    alignItems: 'center',
  },
  backButtonText: {
    color: '#CCCCCC',
    fontSize: 16,
  },
});