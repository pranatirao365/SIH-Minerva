import AsyncStorage from '@react-native-async-storage/async-storage';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
    Animated,
    Dimensions,
    Image,
    RefreshControl,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
    ArrowLeft,
    Award,
    Crown,
    Medal,
    Star,
    Trophy
} from '../../components/Icons';
import { COLORS } from '../../constants/styles';
import { useRoleStore } from '../../hooks/useRoleStore';
import { db } from '../../config/firebase';
import { collection, getDocs, query, where, orderBy, limit } from 'firebase/firestore';

const { width } = Dimensions.get('window');

interface MinerProgress {
  id: string;
  name: string;
  rank: number;
  totalPoints: number;
  videosCompleted: number;
  quizzesCompleted: number;
  trainingHours: number;
  safetyScore: number;
  badges: string[];
  streak: number;
  level: number;
  avatar?: string;
  isCurrentUser?: boolean;
}

interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: string;
  points: number;
  unlocked: boolean;
  progress?: number;
  total?: number;
}

export default function ProgressTracker() {
  const router = useRouter();
  const { user } = useRoleStore();
  const [leaderboard, setLeaderboard] = useState<MinerProgress[]>([]);
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [currentUser, setCurrentUser] = useState<MinerProgress | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [animatedValue] = useState(new Animated.Value(0));

  useEffect(() => {
    loadLeaderboardData();
    loadAchievements();
    
    // Animate on mount
    Animated.spring(animatedValue, {
      toValue: 1,
      friction: 8,
      tension: 40,
      useNativeDriver: true,
    }).start();
  }, []);

  const loadLeaderboardData = async () => {
    try {
      // Fetch real users from Firebase
      const usersRef = collection(db, 'users');
      const usersQuery = query(
        usersRef,
        where('role', '==', 'miner'),
        limit(50)
      );
      
      const snapshot = await getDocs(usersQuery);
      
      if (snapshot.empty) {
        console.log('⚠️ No miners found in Firebase users collection');
        setLeaderboard([]);
        return;
      }

      // Transform Firebase users to leaderboard format
      const miners: MinerProgress[] = snapshot.docs.map((doc, index) => {
        const data = doc.data();
        const phoneId = doc.id;
        
        return {
          id: phoneId,
          name: data.name || data.displayName || `Miner ${phoneId.slice(-4)}`,
          rank: 0, // Will be calculated below
          totalPoints: data.totalPoints || Math.floor(Math.random() * 2000) + 1000,
          videosCompleted: data.videosCompleted || Math.floor(Math.random() * 20) + 5,
          quizzesCompleted: data.quizzesCompleted || Math.floor(Math.random() * 15) + 3,
          trainingHours: data.trainingHours || Math.floor(Math.random() * 40) + 10,
          safetyScore: data.safetyScore || Math.floor(Math.random() * 20) + 80,
          badges: data.badges || [],
          streak: data.streak || Math.floor(Math.random() * 10),
          level: data.level || Math.floor(Math.random() * 8) + 1,
          avatar: data.avatar || data.photoURL,
          isCurrentUser: phoneId === user.id,
        };
      });

      // Sort by total points and assign ranks
      miners.sort((a, b) => b.totalPoints - a.totalPoints);
      miners.forEach((miner, index) => {
        miner.rank = index + 1;
        
        // Assign badges based on rank
        if (index === 0) {
          miner.badges = ['🏆', '⭐', '🔥', '💎'];
        } else if (index === 1) {
          miner.badges = ['🏆', '⭐', '🔥'];
        } else if (index === 2) {
          miner.badges = ['🏆', '⭐'];
        } else if (index < 5) {
          miner.badges = ['🏆'];
        } else if (index < 10) {
          miner.badges = ['⭐'];
        } else {
          miner.badges = [];
        }
      });

      setLeaderboard(miners);
      setCurrentUser(miners.find(m => m.id === user.id) || null);
      
      console.log(`✅ Loaded ${miners.length} miners for leaderboard`);
    } catch (error) {
      console.error('❌ Error loading leaderboard from Firebase:', error);
      // Set empty leaderboard on error
      setLeaderboard([]);
    }
  };

  const loadAchievements = async () => {
    try {
      const stored = await AsyncStorage.getItem('achievements');
      
      if (stored) {
        setAchievements(JSON.parse(stored));
      } else {
        const sampleAchievements: Achievement[] = [
          {
            id: '1',
            title: 'Video Master',
            description: 'Complete 20 training videos',
            icon: '🎬',
            points: 500,
            unlocked: true,
            progress: 20,
            total: 20,
          },
          {
            id: '2',
            title: 'Quiz Champion',
            description: 'Score 100% on 10 quizzes',
            icon: '🧠',
            points: 400,
            unlocked: false,
            progress: 7,
            total: 10,
          },
          {
            id: '3',
            title: 'Safety Streak',
            description: 'Maintain 30-day safety streak',
            icon: '🔥',
            points: 600,
            unlocked: false,
            progress: 8,
            total: 30,
          },
          {
            id: '4',
            title: 'Perfect Record',
            description: 'Complete month with zero incidents',
            icon: '💎',
            points: 1000,
            unlocked: false,
            progress: 15,
            total: 30,
          },
        ];
        
        await AsyncStorage.setItem('achievements', JSON.stringify(sampleAchievements));
        setAchievements(sampleAchievements);
      }
    } catch (error) {
      console.error('Error loading achievements:', error);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadLeaderboardData();
    await loadAchievements();
    setRefreshing(false);
  };

  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1:
        return <Crown size={32} color="#FFD700" />;
      case 2:
        return <Medal size={32} color="#C0C0C0" />;
      case 3:
        return <Medal size={32} color="#CD7F32" />;
      default:
        return <Text style={styles.rankNumber}>#{rank}</Text>;
    }
  };

  const getRankColor = (rank: number) => {
    switch (rank) {
      case 1:
        return ['#FFD700', '#FFA500'];
      case 2:
        return ['#C0C0C0', '#A8A8A8'];
      case 3:
        return ['#CD7F32', '#B8860B'];
      default:
        return [COLORS.card, COLORS.card];
    }
  };

  const getLevelProgress = (level: number) => {
    const pointsForNextLevel = level * 250;
    return (currentUser?.totalPoints || 0) % pointsForNextLevel;
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <ArrowLeft size={24} color={COLORS.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Leaderboard</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={COLORS.primary} />
        }
      >
        {/* Top 3 Podium Display */}
        {leaderboard.length >= 3 && (
          <View style={styles.podiumContainer}>
            {/* 2nd Place - Left */}
            <View style={styles.podiumItem}>
              <View style={[styles.minerAvatar, styles.avatar2nd]}>
                <Image 
                  source={require('@/assets/images/2.jpg')} 
                  style={styles.trophyImage}
                  resizeMode="contain"
                />
              </View>
              <View style={[styles.podium, styles.podium2nd]}>
                <Text style={styles.podiumRank}>2</Text>
                <Text style={styles.podiumLabel}>nd</Text>
              </View>
              <Text style={styles.podiumName} numberOfLines={1}>{leaderboard[1]?.name}</Text>
              <View style={styles.podiumPointsBadge}>
                <Text style={styles.podiumPoints}>{leaderboard[1]?.totalPoints}</Text>
              </View>
            </View>

            {/* 1st Place - Center */}
            <View style={[styles.podiumItem, styles.podium1stContainer]}>
              <View style={[styles.minerAvatar, styles.avatar1st]}>
                <Image 
                  source={require('@/assets/images/1.jpg')} 
                  style={styles.trophyImage}
                  resizeMode="contain"
                />
              </View>
              <View style={[styles.podium, styles.podium1st]}>
                <Text style={[styles.podiumRank, styles.podium1stRank]}>1</Text>
                <Text style={[styles.podiumLabel, styles.podium1stLabel]}>st</Text>
              </View>
              <Text style={[styles.podiumName, styles.podium1stName]}>{leaderboard[0]?.name}</Text>
              <View style={[styles.podiumPointsBadge, styles.podium1stBadge]}>
                <Text style={[styles.podiumPoints, styles.podium1stPoints]}>{leaderboard[0]?.totalPoints}</Text>
              </View>
            </View>

            {/* 3rd Place - Right */}
            <View style={styles.podiumItem}>
              <View style={[styles.minerAvatar, styles.avatar3rd]}>
                <Image 
                  source={require('@/assets/images/3.jpg')} 
                  style={styles.trophyImage}
                  resizeMode="contain"
                />
              </View>
              <View style={[styles.podium, styles.podium3rd]}>
                <Text style={styles.podiumRank}>3</Text>
                <Text style={styles.podiumLabel}>rd</Text>
              </View>
              <Text style={styles.podiumName} numberOfLines={1}>{leaderboard[2]?.name}</Text>
              <View style={styles.podiumPointsBadge}>
                <Text style={styles.podiumPoints}>{leaderboard[2]?.totalPoints}</Text>
              </View>
            </View>
          </View>
        )}

        {/* Current User Card - if not in top 3 */}
        {currentUser && currentUser.rank > 3 && (
          <View style={styles.currentUserContainer}>
            <View style={styles.currentUserCard}>
              <View style={styles.currentUserRankBadge}>
                <Text style={styles.currentUserRankText}>{currentUser.rank}</Text>
              </View>
              <View style={styles.currentUserInfo}>
                <Text style={styles.currentUserName}>{currentUser.name}</Text>
                <Text style={styles.currentUserSubtitle}>{currentUser.totalPoints} Points</Text>
              </View>
              <View style={styles.currentUserBadge}>
                <Text style={styles.currentUserBadgeText}>You</Text>
              </View>
            </View>
          </View>
        )}

        {/* Rest of Leaderboard - Starting from rank 4 */}
        <View style={styles.section}>
          {leaderboard.slice(3).map((miner, index) => (
            <View
              key={miner.id}
              style={[
                styles.leaderboardCard,
                miner.isCurrentUser && styles.currentUserHighlight,
              ]}
            >
              <View style={styles.leaderboardContent}>
                <View style={styles.leaderboardLeft}>
                  <View style={styles.rankCircle}>
                    <Text style={styles.rankNumber}>{miner.rank}</Text>
                  </View>
                  <View style={styles.minerInfo}>
                    <Text style={styles.minerName}>{miner.name}</Text>
                    <Text style={styles.minerSubtitle}>{miner.totalPoints} Points</Text>
                  </View>
                </View>
                <View style={styles.leaderboardRight}>
                  {miner.isCurrentUser ? (
                    <View style={styles.youBadge}>
                      <Text style={styles.youBadgeText}>You</Text>
                    </View>
                  ) : (
                    <View style={styles.trendBadge}>
                      <Text style={styles.trendIcon}>📈</Text>
                    </View>
                  )}
                </View>
              </View>
            </View>
          ))}
        </View>

        <View style={{ height: 100 }} />
      </ScrollView>
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
    paddingHorizontal: 20,
    paddingVertical: 18,
    backgroundColor: COLORS.card,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
  },
  backButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.background,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: COLORS.text,
  },
  scrollView: {
    flex: 1,
  },
  timeRangeContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingVertical: 20,
    gap: 12,
    backgroundColor: '#FFFFFF',
    marginBottom: 4,
  },
  timeRangeButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 25,
    backgroundColor: '#F5F5F7',
    alignItems: 'center',
  },
  timeRangeButtonActive: {
    backgroundColor: '#8E8FFA',
  },
  timeRangeText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#8E8E93',
  },
  timeRangeTextActive: {
    color: '#FFFFFF',
  },
  podiumContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'center',
    paddingHorizontal: 16,
    paddingTop: 48,
    paddingBottom: 32,
    backgroundColor: COLORS.card,
    gap: 8,
    marginBottom: 2,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  podiumItem: {
    alignItems: 'center',
    flex: 1,
  },
  podium1stContainer: {
    marginBottom: 20,
  },
  crownIcon: {
    marginBottom: 8,
  },
  minerAvatar: {
    width: 109,
    height: 109,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  trophyImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'contain',
  },
  avatar1st: {
    width: 140,
    height: 140,
  },
  avatar2nd: {},
  avatar3rd: {},
  avatarText: {
    fontSize: 24,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  avatar1stText: {
    fontSize: 32,
  },
  podium: {
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
    alignItems: 'center',
    width: '100%',
    minHeight: 80,
  },
  podium1st: {
    backgroundColor: COLORS.primary,
    minHeight: 110,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.6,
    shadowRadius: 12,
    elevation: 8,
  },
  podium2nd: {
    backgroundColor: '#3F3F46',
    minHeight: 80,
    borderWidth: 1,
    borderColor: '#52525B',
  },
  podium3rd: {
    backgroundColor: '#27272A',
    minHeight: 70,
    borderWidth: 1,
    borderColor: '#3F3F46',
  },
  podiumRank: {
    fontSize: 32,
    fontWeight: '800',
    color: '#FFFFFF',
    lineHeight: 38,
  },
  podium1stRank: {
    fontSize: 40,
  },
  podiumLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  podium1stLabel: {
    fontSize: 18,
  },
  podiumName: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.text,
    marginTop: -8,
    marginBottom: 10,
    textAlign: 'center',
    letterSpacing: 0.3,
  },
  podium1stName: {
    fontSize: 17,
    fontWeight: '800',
    color: COLORS.text,
    letterSpacing: 0.5,
  },
  podiumPointsBadge: {
    backgroundColor: COLORS.card,
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 18,
    borderWidth: 1.5,
    borderColor: COLORS.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 2,
  },
  podium1stBadge: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
    borderWidth: 2,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.5,
    shadowRadius: 6,
    elevation: 4,
  },
  podiumPoints: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.text,
  },
  podium1stPoints: {
    fontSize: 15,
    color: '#FFFFFF',
  },
  currentUserContainer: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: COLORS.background,
  },
  currentUserCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.card,
    borderRadius: 18,
    padding: 18,
    borderWidth: 2,
    borderColor: COLORS.primary,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.5,
    shadowRadius: 8,
    elevation: 6,
  },
  currentUserRankBadge: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  currentUserRankText: {
    fontSize: 20,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  currentUserInfo: {
    flex: 1,
  },
  currentUserName: {
    fontSize: 17,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: 4,
  },
  currentUserSubtitle: {
    fontSize: 14,
    color: COLORS.textMuted,
  },
  currentUserBadge: {
    backgroundColor: '#10B981',
    paddingVertical: 8,
    paddingHorizontal: 18,
    borderRadius: 18,
    shadowColor: '#10B981',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.4,
    shadowRadius: 4,
    elevation: 3,
  },
  currentUserBadgeText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  section: {
    paddingHorizontal: 20,
    paddingTop: 16,
    backgroundColor: COLORS.background,
  },
  leaderboardCard: {
    backgroundColor: COLORS.card,
    borderRadius: 16,
    marginBottom: 12,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: COLORS.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 2,
  },
  currentUserHighlight: {
    borderWidth: 2,
    borderColor: COLORS.primary,
    backgroundColor: COLORS.card,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 4,
  },
  leaderboardContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
  },
  leaderboardLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 16,
  },
  rankCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: COLORS.background,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: COLORS.border,
  },
  rankNumber: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.text,
  },
  minerInfo: {
    flex: 1,
  },
  minerName: {
    fontSize: 17,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: 4,
    letterSpacing: 0.2,
  },
  minerSubtitle: {
    fontSize: 14,
    color: COLORS.textMuted,
  },
  leaderboardRight: {
    marginLeft: 12,
  },
  youBadge: {
    backgroundColor: '#10B981',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 18,
    shadowColor: '#10B981',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.4,
    shadowRadius: 4,
    elevation: 3,
  },
  youBadgeText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  trendBadge: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: COLORS.background,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  trendIcon: {
    fontSize: 16,
  },
});
