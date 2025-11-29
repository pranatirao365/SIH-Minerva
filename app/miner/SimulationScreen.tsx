import { useRouter } from 'expo-router';
import React, { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import GameCompletion from '../../components/simulation/GameCompletion';
import GameEngine from '../../components/simulation/GameEngine';
import GameIntro from '../../components/simulation/GameIntro';
import useGameStore from '../../stores/gameStore';

export default function SimulationScreen() {
  const router = useRouter();
  const gameState = useGameStore(state => state.gameState);
  const resetGame = useGameStore(state => state.resetGame);
  
  // Initialize game on mount
  useEffect(() => {
    resetGame();
    
    return () => {
      // Cleanup when leaving the screen
      resetGame();
    };
  }, []);
  
  const handleExit = () => {
    resetGame();
    router.back();
  };
  
  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      {gameState === 'intro' && <GameIntro />}
      
      {(gameState === 'playing' || gameState === 'paused' || gameState === 'event') && (
        <GameEngine />
      )}
      
      {gameState === 'completed' && <GameCompletion onExit={handleExit} />}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
});
