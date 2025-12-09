import { useRouter } from 'expo-router';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { SafeAreaView, StyleSheet, Text, TouchableOpacity, View, Dimensions } from 'react-native';
import { ArrowLeft } from '../../components/Icons';
import { COLORS } from '../../constants/styles';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

interface GameState {
  isRunning: boolean;
  health: number;
  timeLeft: number;
  gameOver: boolean;
  gameWon: boolean;
}

interface GasCloud {
  id: string;
  x: number;
  y: number;
  type: 'eye' | 'lung';
}

// Responsive game dimensions
const GAME_WIDTH = Math.min(SCREEN_WIDTH - 32, 400);
const GAME_HEIGHT = Math.min(SCREEN_HEIGHT * 0.65, 600);
const PLAYER_WIDTH = 40;
const PLAYER_HEIGHT = 40;
const GAS_SIZE = 40;

export default function SilicaSurvivorGame() {
  const router = useRouter();
  const [gameState, setGameState] = useState<GameState>({
    isRunning: true,
    health: 3,
    timeLeft: 30,
    gameOver: false,
    gameWon: false,
  });

  const [touchX, setTouchX] = useState<number | null>(null);
  const [playerX, setPlayerX] = useState(GAME_WIDTH / 2 - PLAYER_WIDTH / 2);
  const [gases, setGases] = useState<GasCloud[]>([]);
  const [moveLeft, setMoveLeft] = useState(false);
  const [moveRight, setMoveRight] = useState(false);
  const [collisionCount, setCollisionCount] = useState(0);
  const [showWarning, setShowWarning] = useState(false);
  const [warningType, setWarningType] = useState<'eyes' | 'lungs' | 'death' | null>(null);
  const [waitingForOK, setWaitingForOK] = useState(false);

  // Game loop
  useEffect(() => {
    if (!gameState.isRunning || gameState.gameOver || gameState.gameWon || waitingForOK) return;

    const gameInterval = setInterval(() => {
      // Handle player movement with buttons
      setPlayerX(prevX => {
        let newX = prevX;
        if (moveLeft) {
          newX = Math.max(0, prevX - 8);
        }
        if (moveRight) {
          newX = Math.min(GAME_WIDTH - PLAYER_WIDTH, prevX + 8);
        }
        return newX;
      });

      // Update and spawn gases
      setGases(prevGases => {
        let newGases = prevGases
          .map(gas => ({
            ...gas,
            y: gas.y + (gas.type === 'eye' ? 3 : 2),
          }))
          .filter(gas => gas.y < GAME_HEIGHT);

        // Spawn new gas
        if (Math.random() < 0.02) {
          newGases.push({
            id: Math.random().toString(),
            x: Math.random() * (GAME_WIDTH - GAS_SIZE),
            y: -GAS_SIZE,
            type: Math.random() > 0.4 ? 'eye' : 'lung',
          });
        }

        // Check collisions
        // Check collisions
        const collidedGasIds: string[] = [];
        newGases.forEach(gas => {
          // Check if gas collides with player
          // Player is at bottom: GAME_HEIGHT - PLAYER_HEIGHT to GAME_HEIGHT
          // Player X position: playerX to playerX + PLAYER_WIDTH
          if (
            gas.x < playerX + PLAYER_WIDTH &&
            gas.x + GAS_SIZE > playerX &&
            gas.y < GAME_HEIGHT &&
            gas.y + GAS_SIZE > GAME_HEIGHT - PLAYER_HEIGHT - 10
          ) {
            if (!collidedGasIds.includes(gas.id)) {
              collidedGasIds.push(gas.id);
              
              setCollisionCount(prev => {
                const newCount = prev + 1;
                // Show warning based on collision count
                if (newCount === 1) {
                  setWarningType('eyes');
                  setShowWarning(true);
                  setWaitingForOK(true);
                } else if (newCount === 2) {
                  setWarningType('lungs');
                  setShowWarning(true);
                  setWaitingForOK(true);
                } else if (newCount >= 3) {
                  setWarningType('death');
                  setShowWarning(true);
                }
                return newCount;
              });
            }
          }
        });
        
        // Remove collided gases
        if (collidedGasIds.length > 0) {
          return newGases.filter(g => !collidedGasIds.includes(g.id));
        }

        return newGases;
      });
    }, 50);

    return () => clearInterval(gameInterval);
  }, [gameState.isRunning, gameState.gameOver, gameState.gameWon, moveLeft, moveRight, playerX, waitingForOK]);

  // Timer
  useEffect(() => {
    if (!gameState.isRunning || gameState.gameOver || gameState.gameWon || waitingForOK) return;

    const timerInterval = setInterval(() => {
      setGameState(prev => {
        if (prev.timeLeft <= 1) {
          return { ...prev, timeLeft: 0, gameWon: true, isRunning: false };
        }
        return { ...prev, timeLeft: prev.timeLeft - 1 };
      });
    }, 1000);

    return () => clearInterval(timerInterval);
  }, [gameState.isRunning, gameState.gameOver, gameState.gameWon, waitingForOK]);

  // Check for 3rd collision (game over)
  useEffect(() => {
    if (collisionCount >= 3 && gameState.isRunning) {
      setGameState(prev => ({ ...prev, gameOver: true, isRunning: false }));
    }
  }, [collisionCount, gameState.isRunning]);

  // Keyboard events - Not available in React Native
  // Players will use touch controls or mobile input

  const handleGoBack = () => {
    router.back();
  };

  const handlePlayAgain = () => {
    setGameState({
      isRunning: true,
      health: 3,
      timeLeft: 30,
      gameOver: false,
      gameWon: false,
    });
    setPlayerX(GAME_WIDTH / 2 - PLAYER_WIDTH / 2);
    setGases([]);
    setCollisionCount(0);
    setShowWarning(false);
    setWarningType(null);
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={handleGoBack} style={styles.backButton}>
          <ArrowLeft size={24} color={COLORS.primary} />
          <Text style={styles.backText}>Back</Text>
        </TouchableOpacity>

        <Text style={styles.title}>Silica Survivor</Text>

        <View style={styles.spacer} />
      </View>

      {/* Game Canvas */}
      <View style={styles.gameWrapper}>
        {/* Game Stats */}
        <View style={styles.stats}>
          <View style={styles.healthSection}>
            <Text style={styles.healthLabel}>Health:</Text>
            <View style={styles.healthBar}>
              <View style={[styles.healthFill, { width: `${(gameState.health / 3) * 100}%` }]} />
            </View>
            <Text style={styles.healthText}>{gameState.health}/3</Text>
          </View>
          <Text style={styles.timer}>{gameState.timeLeft}s</Text>
        </View>

        {/* Game Board */}
        <View style={styles.gameBoard}>
          {/* Gas Clouds */}
          {gases.map(gas => (
            <View
              key={gas.id}
              style={[
                styles.gas,
                {
                  left: gas.x,
                  top: gas.y,
                  backgroundColor: gas.type === 'eye' ? 'rgba(255, 100, 100, 0.6)' : 'rgba(50, 50, 50, 0.7)',
                },
              ]}
            />
          ))}

          {/* Player */}
          <View
            style={[
              styles.player,
              {
                left: playerX,
              },
            ]}
            pointerEvents="none"
          >
            <View style={styles.playerHead} />
          </View>
        </View>

        {/* Controls */}
        <View style={styles.controls}>
          <TouchableOpacity 
            style={styles.controlButton}
            onPressIn={() => setMoveLeft(true)}
            onPressOut={() => setMoveLeft(false)}
          >
            <Text style={styles.controlButtonText}>← LEFT</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.controlButton}
            onPressIn={() => setMoveRight(true)}
            onPressOut={() => setMoveRight(false)}
          >
            <Text style={styles.controlButtonText}>RIGHT →</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Warning Modal */}
      {showWarning && (
        <View style={styles.modalOverlay}>
          <View style={styles.warningContent}>
            {warningType === 'eyes' && (
              <>
                <Text style={styles.warningEmoji}>👀</Text>
                <Text style={styles.warningTitle}>Eye Irritation!</Text>
                <Text style={styles.warningMessage}>
                  Silica dust irritates your eyes.{'\n'}
                  WEAR SAFETY GLASSES! 🥽
                </Text>
              </>
            )}
            {warningType === 'lungs' && (
              <>
                <Text style={styles.warningEmoji}>🫁</Text>
                <Text style={styles.warningTitle}>Lung Damage!</Text>
                <Text style={styles.warningMessage}>
                  Breathing silica dust damages your lungs.{'\n'}
                  WEAR A RESPIRATOR MASK! 😷
                </Text>
              </>
            )}
            {warningType === 'death' && (
              <>
                <Text style={styles.warningEmoji}>☠️</Text>
                <Text style={styles.warningTitle}>Critical Danger!</Text>
                <Text style={styles.warningMessage}>
                  You are exposed to severe silica hazard!{'\n'}
                  May lead to DEATH! 💀{'\n'}
                  PROTECT YOURSELF NOW!
                </Text>
              </>
            )}
            {(warningType === 'eyes' || warningType === 'lungs') && (
              <TouchableOpacity 
                style={styles.okButton}
                onPress={() => {
                  setShowWarning(false);
                  setWaitingForOK(false);
                }}
              >
                <Text style={styles.okButtonText}>OK</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      )}

      {/* Game Over Modal */}
      {(gameState.gameOver || gameState.gameWon) && (
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={[styles.modalTitle, { color: gameState.gameWon ? '#00ff00' : '#e94560' }]}>
              {gameState.gameWon ? '🎉 You Survived!' : '💀 Game Over'}
            </Text>
            <Text style={styles.modalMessage}>
              {gameState.gameWon
                ? 'Great job! Protect yourself from silica with goggles and masks.'
                : 'Critical exposure to silica! You suffered 3 contacts with hazardous gas. Proper PPE is essential for survival!'}
            </Text>
            <View style={styles.buttonContainer}>
              <TouchableOpacity style={styles.button} onPress={handlePlayAgain}>
                <Text style={styles.buttonText}>Play Again</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.button, styles.buttonSecondary]} onPress={handleGoBack}>
                <Text style={styles.buttonTextSecondary}>Back to Home</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: COLORS.card,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  backText: {
    color: COLORS.primary,
    fontSize: 16,
    fontWeight: 'bold',
  },
  title: {
    color: COLORS.text,
    fontSize: 18,
    fontWeight: 'bold',
    flex: 1,
    textAlign: 'center',
  },
  spacer: {
    width: 32,
  },
  gameWrapper: {
    flex: 1,
    width: '100%',
    backgroundColor: '#000',
    padding: 16,
    justifyContent: 'space-between',
  },
  stats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
    gap: 16,
  },
  healthSection: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  healthLabel: {
    color: '#ffd700',
    fontSize: 12,
    fontWeight: 'bold',
  },
  healthBar: {
    flex: 1,
    height: 20,
    backgroundColor: '#333',
    borderWidth: 2,
    borderColor: '#ffd700',
    borderRadius: 4,
    overflow: 'hidden',
  },
  healthFill: {
    height: '100%',
    backgroundColor: '#ff4444',
  },
  healthText: {
    color: '#ffd700',
    fontSize: 12,
    fontWeight: 'bold',
    minWidth: 30,
    textAlign: 'right',
  },
  timer: {
    color: '#ffd700',
    fontSize: 28,
    fontWeight: 'bold',
    minWidth: 50,
    textAlign: 'right',
  },
  gameBoard: {
    flex: 1,
    backgroundColor: '#0f3460',
    borderWidth: 2,
    borderColor: '#e94560',
    borderRadius: 8,
    overflow: 'hidden',
    position: 'relative',
  },
  gas: {
    position: 'absolute',
    width: GAS_SIZE,
    height: GAS_SIZE,
    borderRadius: GAS_SIZE / 2,
  },
  player: {
    position: 'absolute',
    bottom: 10,
    width: PLAYER_WIDTH,
    height: PLAYER_HEIGHT,
    backgroundColor: '#00ff00',
    borderRadius: 4,
    justifyContent: 'flex-start',
    alignItems: 'center',
    paddingTop: 6,
  },
  playerHead: {
    width: 10,
    height: 10,
    backgroundColor: '#ffdbac',
    borderRadius: 5,
  },
  instructions: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: '#1a1a2e',
    borderRadius: 4,
    marginTop: 12,
  },
  instructionsText: {
    color: '#ffd700',
    fontSize: 11,
    textAlign: 'center',
    fontWeight: '500',
  },
  controls: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 16,
    paddingHorizontal: 16,
    justifyContent: 'center',
  },
  controlButton: {
    flex: 1,
    backgroundColor: COLORS.primary,
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 100,
  },
  controlButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  modalOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  modalContent: {
    backgroundColor: COLORS.card,
    padding: 24,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: COLORS.primary,
    maxWidth: '90%',
  },
  warningContent: {
    backgroundColor: '#1a1a2e',
    padding: 24,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 3,
    borderColor: '#e94560',
    maxWidth: '85%',
  },
  warningEmoji: {
    fontSize: 60,
    marginBottom: 12,
  },
  warningTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#e94560',
    marginBottom: 12,
    textAlign: 'center',
  },
  warningMessage: {
    fontSize: 14,
    color: '#fff',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 16,
  },
  okButton: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: 32,
    paddingVertical: 12,
    borderRadius: 8,
    minWidth: 100,
  },
  okButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  modalTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 16,
    textAlign: 'center',
  },
  modalMessage: {
    fontSize: 14,
    color: COLORS.textMuted,
    textAlign: 'center',
    marginBottom: 20,
    lineHeight: 20,
  },
  buttonContainer: {
    gap: 12,
    width: '100%',
  },
  button: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  buttonSecondary: {
    backgroundColor: COLORS.border,
  },
  buttonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
  },
  buttonTextSecondary: {
    color: COLORS.text,
    fontSize: 14,
    fontWeight: 'bold',
  },
});
