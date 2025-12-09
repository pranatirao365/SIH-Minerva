import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { Animated, ScrollView, Text, TouchableOpacity, View, StyleSheet, Dimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { ArrowLeft, Trophy, Zap, Flame, Shield } from '../../components/Icons';
import { useRoleStore } from '../../hooks/useRoleStore';
import { COLORS } from '../../constants/styles';

const { width } = Dimensions.get('window');

const GAMES = [
  {
    id: 'fire-safety',
    title: 'Fire Safety',
    icon: '🔥',
    description: 'Learn firefighting procedures',
    route: '/miner/SimulationScreen',
    color: '#DC2626',
    gradient: ['#F87171', '#DC2626'],
  },
  {
    id: 'blasting',
    title: 'Blasting Safety',
    icon: '💥',
    description: 'Master explosion protocols',
    route: '/miner/BlastingGame',
    color: '#F59E0B',
    gradient: ['#FBBF24', '#F59E0B'],
  },
  {
    id: 'roof-fall',
    title: 'Roof Stability',
    icon: '🏔️',
    description: 'Prevent roof collapses',
    route: '/miner/RoofInstabilityGame',
    color: '#7C2D12',
    gradient: ['#A16207', '#7C2D12'],
  },
  {
    id: 'silica-survivor',
    title: 'Silica Survivor',
    icon: '💨',
    description: 'Learn about silica dust hazards',
    route: '/miner/SilicaSurvivorGame',
    color: '#6B7280',
    gradient: ['#9CA3AF', '#6B7280'],
  },
  {
    id: 'second-skin',
    title: 'Second Skin',
    icon: '🦺',
    description: 'Test your reaction time',
    route: null, // Built-in game
    color: '#10B981',
    gradient: ['#34D399', '#10B981'],
  },
];

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

  const [selectedGame, setSelectedGame] = useState<string | null>(null);
  const Container: any = inline ? View : SafeAreaView;

  const handleGamePress = (game: typeof GAMES[0]) => {
    if (game.route) {
      router.push(game.route as any);
    } else {
      // Built-in game (Second Skin)
      setSelectedGame(game.id);
      startGame();
    }
  };

  // If Second Skin game is selected and active, show the original game
  if (selectedGame === 'second-skin' && gameActive) {
    return (
      <Container style={styles.container}>
        {/* Game Header */}
        <View style={styles.gameHeader}>
          <TouchableOpacity onPress={() => { setGameActive(false); setSelectedGame(null); }}>
            <ArrowLeft size={24} color="#FFFFFF" />
          </TouchableOpacity>
          <Text style={styles.gameTitle}>Second Skin</Text>
          <View style={{ width: 24 }} />
        </View>

        {/* Game Area - Original reflex game */}
        <View style={styles.gameArea}>
          <View style={styles.gameStats}>
            <View style={styles.statBox}>
              <Text style={styles.statLabel}>Score</Text>
              <Animated.Text style={[styles.statValue, { transform: [{ scale: scaleAnim }] }]}>
                {score}
              </Animated.Text>
            </View>
            <View style={styles.statBox}>
              <Text style={styles.statLabel}>Time</Text>
              <Text style={styles.statValue}>{timeLeft}s</Text>
            </View>
          </View>

          <View style={styles.targetContainer}>
            {targets.map(target => (
              <TouchableOpacity
                key={target.id}
                style={[styles.target, { left: `${target.x}%`, top: `${target.y}%` }]}
                onPress={() => hitTarget(target.id)}
              >
                <Text style={styles.targetEmoji}>⚠️</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </Container>
    );
  }

  return (
    <Container style={styles.container}>
      {/* Header */}
      {!inline && (
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()}>
            <ArrowLeft size={24} color="#FFFFFF" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Safety Games</Text>
          <View style={{ width: 24 }} />
        </View>
      )}

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        {/* Hero Section */}
        <View style={styles.heroSection}>
          <Trophy size={60} color={COLORS.primary} />
          <Text style={styles.heroTitle}>Choose Your Game</Text>
          <Text style={styles.heroSubtitle}>Practice safety procedures through interactive games</Text>
        </View>

        {/* Game Cards */}
        <View style={styles.gamesGrid}>
          {GAMES.map((game) => (
            <TouchableOpacity
              key={game.id}
              style={styles.gameCard}
              onPress={() => handleGamePress(game)}
              activeOpacity={0.9}
            >
              <LinearGradient
                colors={game.gradient}
                style={styles.gameCardGradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
              >
                <View style={styles.gameIconContainer}>
                  <Text style={styles.gameIcon}>{game.icon}</Text>
                </View>
                <Text style={styles.gameTitle}>{game.title}</Text>
                <Text style={styles.gameDescription}>{game.description}</Text>
                <View style={styles.playButton}>
                  <Text style={styles.playButtonText}>PLAY NOW</Text>
                  <Zap size={16} color="#FFF" />
                </View>
              </LinearGradient>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>
    </Container>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0A0A0A',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#27272A',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFF',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 40,
  },
  heroSection: {
    alignItems: 'center',
    paddingVertical: 40,
    paddingHorizontal: 20,
  },
  heroTitle: {
    fontSize: 28,
    fontWeight: '900',
    color: '#FFF',
    marginTop: 16,
    marginBottom: 8,
  },
  heroSubtitle: {
    fontSize: 14,
    color: '#A1A1AA',
    textAlign: 'center',
  },
  gamesGrid: {
    paddingHorizontal: 16,
    gap: 16,
  },
  gameCard: {
    borderRadius: 20,
    overflow: 'hidden',
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    marginBottom: 16,
  },
  gameCardGradient: {
    padding: 24,
    minHeight: 180,
  },
  gameIconContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  gameIcon: {
    fontSize: 32,
  },
  gameTitle: {
    fontSize: 22,
    fontWeight: '900',
    color: '#FFF',
    marginBottom: 8,
  },
  gameDescription: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
    marginBottom: 16,
  },
  playButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 12,
    alignSelf: 'flex-start',
  },
  playButtonText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#FFF',
  },
  // Game screen styles
  gameHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#27272A',
  },
  gameTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFF',
  },
  gameArea: {
    flex: 1,
    padding: 16,
  },
  gameStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 24,
  },
  statBox: {
    backgroundColor: '#18181B',
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 16,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#27272A',
  },
  statLabel: {
    fontSize: 12,
    color: '#A1A1AA',
    marginBottom: 4,
    fontWeight: '600',
  },
  statValue: {
    fontSize: 32,
    fontWeight: '900',
    color: COLORS.primary,
  },
  targetContainer: {
    flex: 1,
    backgroundColor: '#18181B',
    borderRadius: 20,
    position: 'relative',
  },
  target: {
    position: 'absolute',
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: COLORS.destructive,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 4,
  },
  targetEmoji: {
    fontSize: 28,
  },
});
