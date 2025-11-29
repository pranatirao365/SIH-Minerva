import React, { useEffect, useRef } from 'react';
import { StyleSheet, View } from 'react-native';
import useGameStore from '../../stores/gameStore';
import EventModal from './EventModal';
import GameControls from './GameControls';
import GameHUD from './GameHUD';
import MinerCharacter from './MinerCharacter';
import TunnelBackground from './TunnelBackground';
import WarningOverlay from './WarningOverlay';

export default function GameEngine() {
  const gameState = useGameStore(state => state.gameState);
  const isPaused = useGameStore(state => state.isPaused);
  const updateTime = useGameStore(state => state.updateTime);
  
  const lastFrameRef = useRef(Date.now());
  const animationFrameRef = useRef<number | null>(null);
  
  // Time tracking loop
  useEffect(() => {
    if (gameState !== 'playing' || isPaused) {
      return;
    }
    
    const gameLoop = () => {
      const now = Date.now();
      const deltaTime = (now - lastFrameRef.current) / 1000; // Convert to seconds
      lastFrameRef.current = now;
      
      // Only update elapsed time, NOT progress
      updateTime(deltaTime);
      
      animationFrameRef.current = requestAnimationFrame(gameLoop);
    };
    
    animationFrameRef.current = requestAnimationFrame(gameLoop);
    
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [gameState, isPaused, updateTime]);
  
  return (
    <View style={styles.container}>
      {/* Tunnel Background */}
      <TunnelBackground />
      
      {/* Miner Character */}
      <MinerCharacter />
      
      {/* Warning Overlay (10m before events) */}
      <WarningOverlay />
      
      {/* Game HUD (UI Overlay) */}
      {gameState !== 'intro' && <GameHUD />}
      
      {/* Event Modal (Smoke, Fire, etc.) */}
      <EventModal />
      
      {/* Game Controls */}
      <GameControls />
      
      {/* Vignette Effect */}
      <View style={styles.vignette} pointerEvents="none" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  vignette: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'transparent',
    borderWidth: 0,
    // Radial gradient vignette effect would require a library like react-native-linear-gradient
  },
});
