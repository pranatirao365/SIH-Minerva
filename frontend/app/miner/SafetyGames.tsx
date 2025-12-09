import { useRouter } from 'expo-router';
import React from 'react';
import { ScrollView, Text, TouchableOpacity, View, StyleSheet, Dimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { ArrowLeft, Trophy, Zap } from '../../components/Icons';
import { COLORS } from '../../constants/styles';
import { MinerFooter } from '../../components/BottomNav';

const { width } = Dimensions.get('window');

const GAMES = [
  {
    id: 'fire-safety',
    title: 'Fire Safety',
    icon: '🔥',
    description: 'Learn firefighting procedures and emergency response',
    route: '/miner/SimulationScreen',
    color: '#DC2626',
    gradient: ['#F87171', '#DC2626'],
    difficulty: 'Intermediate',
    duration: '10-15 min',
  },
  {
    id: 'blasting',
    title: 'Blasting Safety',
    icon: '💥',
    description: 'Master explosion protocols and blast zone management',
    route: '/miner/BlastingGame',
    color: '#F59E0B',
    gradient: ['#FBBF24', '#F59E0B'],
    difficulty: 'Advanced',
    duration: '8-12 min',
  },
  {
    id: 'roof-fall',
    title: 'Roof Stability',
    icon: '🏔️',
    description: 'Prevent roof collapses and identify structural hazards',
    route: '/miner/RoofInstabilityGame',
    color: '#7C2D12',
    gradient: ['#A16207', '#7C2D12'],
    difficulty: 'Advanced',
    duration: '12-18 min',
  },
  {
    id: 'second-skin',
    title: 'Second Skin',
    icon: '🧪',
    description: 'Test your reaction time and hazard recognition skills',
    route: '/miner/GamingModule',
    color: '#10B981',
    gradient: ['#34D399', '#10B981'],
    difficulty: 'Beginner',
    duration: '5-8 min',
  },
  {
    id: 'silica-survivor',
    title: 'Silica Survivor',
    icon: '😷',
    description: 'Avoid silica dust clouds and protect your health',
    route: '/miner/SilicaSurvivorGame',
    color: '#8B5CF6',
    gradient: ['#A78BFA', '#8B5CF6'],
    difficulty: 'Intermediate',
    duration: '5-10 min',
  },
];

export default function SafetyGames() {
  const router = useRouter();

  const handleGamePress = (game: typeof GAMES[0]) => {
    router.push(game.route as any);
  };

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['#0A0A0A', '#1A1A2E', '#16213E']}
        style={StyleSheet.absoluteFill}
      />

      <SafeAreaView style={styles.safeArea} edges={['top']}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <ArrowLeft size={24} color="#FFFFFF" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Safety Games</Text>
          <View style={{ width: 24 }} />
        </View>

        <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
          {/* Hero Section */}
          <View style={styles.heroSection}>
            <View style={styles.trophyContainer}>
              <Trophy size={64} color={COLORS.primary} />
              <View style={styles.pulseRing} />
            </View>
            <Text style={styles.heroTitle}>Choose Your Challenge</Text>
            <Text style={styles.heroSubtitle}>
              Master safety procedures through interactive gameplay
            </Text>
          </View>

          {/* Stats Bar */}
          <View style={styles.statsBar}>
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>5</Text>
              <Text style={styles.statLabel}>Games</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>150+</Text>
              <Text style={styles.statLabel}>XP Available</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>∞</Text>
              <Text style={styles.statLabel}>Replays</Text>
            </View>
          </View>

          {/* Game Cards */}
          <View style={styles.gamesContainer}>
            {GAMES.map((game, index) => (
              <TouchableOpacity
                key={game.id}
                style={styles.gameCard}
                onPress={() => handleGamePress(game)}
                activeOpacity={0.9}
              >
                <LinearGradient
                  colors={game.gradient as any}
                  style={styles.gameCardGradient}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                >
                  {/* Glow Effect */}
                  <View style={[styles.glowEffect, { backgroundColor: game.color + '40' }]} />
                  
                  {/* Card Content */}
                  <View style={styles.cardContent}>
                    {/* Icon */}
                    <View style={styles.gameIconContainer}>
                      <Text style={styles.gameIcon}>{game.icon}</Text>
                    </View>

                    {/* Game Info */}
                    <View style={styles.gameInfo}>
                      <Text style={styles.gameTitle}>{game.title}</Text>
                      <Text style={styles.gameDescription}>{game.description}</Text>

                      {/* Meta Info */}
                      <View style={styles.metaRow}>
                        <View style={styles.metaBadge}>
                          <Text style={styles.metaText}>⏱️ {game.duration}</Text>
                        </View>
                        <View style={[styles.metaBadge, { 
                          backgroundColor: game.difficulty === 'Beginner' ? '#10B98120' : 
                                          game.difficulty === 'Intermediate' ? '#F59E0B20' : '#DC262620'
                        }]}>
                          <Text style={[styles.metaText, {
                            color: game.difficulty === 'Beginner' ? '#10B981' : 
                                   game.difficulty === 'Intermediate' ? '#F59E0B' : '#DC2626'
                          }]}>
                            🎯 {game.difficulty}
                          </Text>
                        </View>
                      </View>

                      {/* Play Button */}
                      <View style={styles.playButton}>
                        <Text style={styles.playButtonText}>START GAME</Text>
                        <Zap size={18} color="#FFF" />
                      </View>
                    </View>
                  </View>
                </LinearGradient>
              </TouchableOpacity>
            ))}
          </View>

          {/* Motivational Footer */}
          <View style={styles.motivationalSection}>
            <Text style={styles.motivationalEmoji}>💪</Text>
            <Text style={styles.motivationalText}>Practice makes perfect!</Text>
            <Text style={styles.motivationalSubtext}>
              Every game completed improves your safety knowledge
            </Text>
          </View>
        </ScrollView>
      </SafeAreaView>

      <MinerFooter activeTab="training" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0A0A0A',
  },
  safeArea: {
    flex: 1,
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
  backButton: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#FFF',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 120,
  },
  heroSection: {
    alignItems: 'center',
    paddingVertical: 40,
    paddingHorizontal: 20,
  },
  trophyContainer: {
    position: 'relative',
    marginBottom: 20,
  },
  pulseRing: {
    position: 'absolute',
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 3,
    borderColor: COLORS.primary,
    opacity: 0.3,
    top: -18,
    left: -18,
  },
  heroTitle: {
    fontSize: 32,
    fontWeight: '900',
    color: '#FFF',
    marginBottom: 8,
    textAlign: 'center',
  },
  heroSubtitle: {
    fontSize: 15,
    color: '#A1A1AA',
    textAlign: 'center',
    lineHeight: 22,
  },
  statsBar: {
    flexDirection: 'row',
    backgroundColor: '#18181B',
    marginHorizontal: 16,
    marginBottom: 24,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#27272A',
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 24,
    fontWeight: '900',
    color: COLORS.primary,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 11,
    color: '#A1A1AA',
    fontWeight: '600',
  },
  statDivider: {
    width: 1,
    backgroundColor: '#27272A',
    marginHorizontal: 8,
  },
  gamesContainer: {
    paddingHorizontal: 16,
    gap: 20,
  },
  gameCard: {
    borderRadius: 24,
    overflow: 'hidden',
    elevation: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 16,
  },
  gameCardGradient: {
    padding: 24,
    minHeight: 200,
    position: 'relative',
  },
  glowEffect: {
    position: 'absolute',
    top: -50,
    right: -50,
    width: 200,
    height: 200,
    borderRadius: 100,
    opacity: 0.4,
  },
  cardContent: {
    flexDirection: 'row',
    gap: 20,
    zIndex: 1,
  },
  gameIconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  gameIcon: {
    fontSize: 40,
  },
  gameInfo: {
    flex: 1,
  },
  gameTitle: {
    fontSize: 24,
    fontWeight: '900',
    color: '#FFF',
    marginBottom: 8,
  },
  gameDescription: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.9)',
    marginBottom: 12,
    lineHeight: 20,
  },
  metaRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 16,
    flexWrap: 'wrap',
  },
  metaBadge: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  metaText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#FFF',
  },
  playButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 12,
    alignSelf: 'flex-start',
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  playButtonText: {
    fontSize: 13,
    fontWeight: '900',
    color: '#FFF',
    letterSpacing: 0.5,
  },
  motivationalSection: {
    alignItems: 'center',
    marginTop: 40,
    paddingHorizontal: 20,
    paddingVertical: 32,
    marginHorizontal: 16,
    backgroundColor: '#18181B',
    borderRadius: 20,
    borderWidth: 2,
    borderColor: 'rgba(255, 107, 0, 0.3)',
  },
  motivationalEmoji: {
    fontSize: 48,
    marginBottom: 12,
  },
  motivationalText: {
    fontSize: 20,
    fontWeight: '800',
    color: COLORS.primary,
    marginBottom: 8,
  },
  motivationalSubtext: {
    fontSize: 14,
    color: '#A1A1AA',
    textAlign: 'center',
  },
});
