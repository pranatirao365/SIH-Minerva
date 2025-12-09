import { useRouter } from 'expo-router';
import React from 'react';
import { ScrollView, Text, TouchableOpacity, View, StyleSheet, Dimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { ArrowLeft, Trophy, Zap } from '../../components/Icons';
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
    description: 'PPE equipment matching challenge',
    route: '/miner/TheSecondSkinGame',
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
  const Container: any = inline ? View : SafeAreaView;

  const handleGamePress = (game: typeof GAMES[0]) => {
    if (game.route) {
      router.push(game.route as any);
    }
  };

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
});
