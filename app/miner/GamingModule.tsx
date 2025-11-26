import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { Animated, ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ArrowLeft, Trophy, Zap } from '../../components/Icons';
import { useRoleStore } from '../../hooks/useRoleStore';

type Props = {
  inline?: boolean;
  onClose?: () => void;
};

export default function GamingModule({ inline = false, onClose }: Props) {
  const router = useRouter();
  const { completeModule } = useRoleStore();
  const [score, setScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(30);
  const [gameActive, setGameActive] = useState(false);
  const [targets, setTargets] = useState<{id: number; x: number; y: number}[]>([]);
  const scaleAnim = new Animated.Value(1);

  useEffect(() => {
    if (gameActive && timeLeft > 0) {
      const timer = setTimeout(() => setTimeLeft(timeLeft - 1), 1000);
      return () => clearTimeout(timer);
    } else if (timeLeft === 0) {
      handleGameEnd();
    }
  }, [timeLeft, gameActive]);

  const startGame = () => {
    setScore(0);
    setTimeLeft(30);
    setGameActive(true);
    spawnTarget();
  };

  const spawnTarget = () => {
    const newTarget = {
      id: Date.now(),
      x: Math.random() * 80,
      y: Math.random() * 70,
    };
    setTargets([newTarget]);
    
    setTimeout(() => {
      if (gameActive) spawnTarget();
    }, 1500);
  };

  const hitTarget = (id: number) => {
    setTargets(targets.filter(t => t.id !== id));
    setScore(score + 10);
    
    Animated.sequence([
      Animated.timing(scaleAnim, { toValue: 1.2, duration: 100, useNativeDriver: true }),
      Animated.timing(scaleAnim, { toValue: 1, duration: 100, useNativeDriver: true }),
    ]).start();
  };

  const handleGameEnd = () => {
    setGameActive(false);
    setTargets([]);
    completeModule('game');
  };

  const Container: any = inline ? View : SafeAreaView;

  return (
    <Container className="flex-1 bg-background">
      {/* Header */}
      {!inline && (
        <View className="px-6 py-4 flex-row items-center justify-between border-b border-border">
          <TouchableOpacity onPress={() => router.back()}>
            <ArrowLeft size={24} color="#FFFFFF" />
          </TouchableOpacity>
          <Text className="text-foreground text-lg font-bold">Safety Game</Text>
          <View style={{ width: 24 }} />
        </View>
      )}

      {!gameActive && timeLeft === 30 ? (
        // Start Screen
        <ScrollView className="flex-1 px-6 py-6">
          <View className="items-center py-12">
            <Trophy size={80} color="#FF6B00" />
            <Text className="text-foreground text-3xl font-bold mt-6">Safety Reflex Game</Text>
            <Text className="text-neutral-400 text-center mt-2">
              Test your reaction time by tapping hazard symbols
            </Text>
          </View>

          <View className="bg-neutral-900 rounded-lg border border-border p-6 mb-6">
            <Text className="text-foreground text-lg font-bold mb-4">How to Play:</Text>
            <Text className="text-neutral-300 mb-2">• Tap on hazard symbols as they appear</Text>
            <Text className="text-neutral-300 mb-2">• Each hit earns 10 points</Text>
            <Text className="text-neutral-300 mb-2">• You have 30 seconds</Text>
            <Text className="text-neutral-300">• Try to get the highest score!</Text>
          </View>

                <TouchableOpacity
                  onPress={startGame}
                  className="bg-primary rounded-lg p-4 items-center"
                >
                  <Text className="text-white text-xl font-bold">Start Game</Text>
                </TouchableOpacity>
                {inline && onClose && (
                  <TouchableOpacity onPress={onClose} className="mt-4">
                    <Text className="text-primary">Close</Text>
                  </TouchableOpacity>
                )}
        </ScrollView>
      ) : (
        // Game Screen
        <View className="flex-1">
          {/* Game Stats */}
          <View className="px-6 py-4 bg-neutral-900 flex-row justify-between">
            <View className="flex-row items-center">
              <Zap size={20} color="#FF6B00" />
              <Text className="text-foreground text-xl font-bold ml-2">Score: {score}</Text>
            </View>
            <Text className="text-foreground text-xl font-bold">Time: {timeLeft}s</Text>
          </View>

          {/* Game Area */}
          <View className="flex-1 bg-neutral-900 m-4 rounded-lg relative">
            {targets.map(target => (
              <TouchableOpacity
                key={target.id}
                onPress={() => hitTarget(target.id)}
                style={{
                  position: 'absolute',
                  left: `${target.x}%`,
                  top: `${target.y}%`,
                }}
                className="w-16 h-16 bg-destructive rounded-full items-center justify-center"
              >
                <Text className="text-white text-2xl font-bold">⚠️</Text>
              </TouchableOpacity>
            ))}

                {!gameActive && timeLeft === 0 && (
              <View className="flex-1 items-center justify-center">
                <Trophy size={60} color="#10B981" />
                <Text className="text-foreground text-3xl font-bold mt-4">Game Over!</Text>
                <Text className="text-neutral-400 text-xl mt-2">Final Score: {score}</Text>
                
                <TouchableOpacity
                  onPress={startGame}
                  className="bg-primary rounded-lg px-8 py-3 mt-6"
                >
                  <Text className="text-white text-lg font-bold">Play Again</Text>
                </TouchableOpacity>

                    {!inline ? (
                      <TouchableOpacity
                        onPress={() => router.back()}
                        className="mt-4"
                      >
                        <Text className="text-primary text-lg">Back to Home</Text>
                      </TouchableOpacity>
                    ) : (
                      onClose && (
                        <TouchableOpacity onPress={onClose} className="mt-4">
                          <Text className="text-primary text-lg">Close</Text>
                        </TouchableOpacity>
                      )
                    )}
              </View>
            )}
          </View>
        </View>
      )}
    </Container>
  );
}
