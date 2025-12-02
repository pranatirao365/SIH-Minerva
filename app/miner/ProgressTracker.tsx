import AsyncStorage from '@react-native-async-storage/async-storage';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
    Animated,
    Dimensions,
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
  const [timeRange, setTimeRange] = useState<'week' | 'month' | 'all'>('week');
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
  }, [timeRange]);

  const loadLeaderboardData = async () => {
    try {
      const key = `leaderboard_${timeRange}`;
      const stored = await AsyncStorage.getItem(key);
      
      if (stored) {
        const parsed = JSON.parse(stored);
        setLeaderboard(parsed);
        setCurrentUser(parsed.find((m: MinerProgress) => m.id === user.id));
      } else {
        // Generate sample leaderboard data
        const sampleData: MinerProgress[] = [
          {
            id: 'miner5',
            name: 'Vikram Rao',
            rank: 1,
            totalPoints: 2850,
            videosCompleted: 24,
            quizzesCompleted: 18,
            trainingHours: 48,
            safetyScore: 98,
            badges: ['🏆', '⭐', '🔥', '💎'],
            streak: 15,
            level: 12,
          },
          {
            id: 'miner2',
            name: 'Amit Sharma',
            rank: 2,
            totalPoints: 2640,
            videosCompleted: 22,
            quizzesCompleted: 17,
            trainingHours: 45,
            safetyScore: 96,
            badges: ['🏆', '⭐', '🔥'],
            streak: 12,
            level: 11,
          },
          {
            id: user.id,
            name: user.name || 'Rajesh Kumar',
            rank: 3,
            totalPoints: 2420,
            videosCompleted: 20,
            quizzesCompleted: 15,
            trainingHours: 42,
            safetyScore: 94,
            badges: ['🏆', '⭐'],
            streak: 8,
            level: 10,
            isCurrentUser: true,
          },
          {
            id: 'miner3',
            name: 'Suresh Patel',
            rank: 4,
            totalPoints: 2180,
            videosCompleted: 18,
            quizzesCompleted: 14,
            trainingHours: 38,
            safetyScore: 92,
            badges: ['🏆'],
            streak: 6,
            level: 9,
          },
          {
            id: 'miner4',
            name: 'Karan Mehta',
            rank: 5,
            totalPoints: 1950,
            videosCompleted: 16,
            quizzesCompleted: 12,
            trainingHours: 35,
            safetyScore: 90,
            badges: ['⭐'],
            streak: 5,
            level: 8,
          },
          {
            id: 'miner6',
            name: 'Rahul Singh',
            rank: 6,
            totalPoints: 1780,
            videosCompleted: 14,
            quizzesCompleted: 11,
            trainingHours: 32,
            safetyScore: 88,
            badges: ['⭐'],
            streak: 4,
            level: 7,
          },
          {
            id: 'miner7',
            name: 'Deepak Verma',
            rank: 7,
            totalPoints: 1620,
            videosCompleted: 13,
            quizzesCompleted: 10,
            trainingHours: 28,
            safetyScore: 85,
            badges: [],
            streak: 3,
            level: 6,
          },
          {
            id: 'miner8',
            name: 'Anil Kumar',
            rank: 8,
            totalPoints: 1450,
            videosCompleted: 11,
            quizzesCompleted: 9,
            trainingHours: 25,
            safetyScore: 82,
            badges: [],
            streak: 2,
            level: 5,
          },
        ];
        
        await AsyncStorage.setItem(key, JSON.stringify(sampleData));
        setLeaderboard(sampleData);
        setCurrentUser(sampleData.find(m => m.id === user.id) || null);
      }
    } catch (error) {
      console.error('Error loading leaderboard:', error);
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
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <ArrowLeft size={24} color={COLORS.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Progress & Leaderboard</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={COLORS.primary} />
        }
      >
        {/* Current User Stats Card */}
        {currentUser && (
          <Animated.View
            style={[
              styles.currentUserCard,
              {
                transform: [
                  {
                    scale: animatedValue.interpolate({
                      inputRange: [0, 1],
                      outputRange: [0.9, 1],
                    }),
                  },
                ],
                opacity: animatedValue,
              },
            ]}
          >
            <LinearGradient
              colors={['#6366F1', '#8B5CF6']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.currentUserGradient}
            >
              <View style={styles.currentUserHeader}>
                <View>
                  <Text style={styles.currentUserRank}>Rank #{currentUser.rank}</Text>
                  <Text style={styles.currentUserName}>{currentUser.name}</Text>
                </View>
                <View style={styles.currentUserLevel}>
                  <Trophy size={24} color="#FFD700" />
                  <Text style={styles.currentUserLevelText}>Level {currentUser.level}</Text>
                </View>
              </View>

              <View style={styles.currentUserStats}>
                <View style={styles.statItem}>
                  <Text style={styles.statValue}>{currentUser.totalPoints}</Text>
                  <Text style={styles.statLabel}>Points</Text>
                </View>
                <View style={styles.statDivider} />
                <View style={styles.statItem}>
                  <Text style={styles.statValue}>{currentUser.videosCompleted}</Text>
                  <Text style={styles.statLabel}>Videos</Text>
                </View>
                <View style={styles.statDivider} />
                <View style={styles.statItem}>
                  <Text style={styles.statValue}>{currentUser.quizzesCompleted}</Text>
                  <Text style={styles.statLabel}>Quizzes</Text>
                </View>
                <View style={styles.statDivider} />
                <View style={styles.statItem}>
                  <Text style={styles.statValue}>{currentUser.streak}</Text>
                  <Text style={styles.statLabel}>Streak 🔥</Text>
                </View>
              </View>

              <View style={styles.badgesContainer}>
                {currentUser.badges.map((badge, index) => (
                  <Text key={index} style={styles.badge}>{badge}</Text>
                ))}
              </View>
            </LinearGradient>
          </Animated.View>
        )}

        {/* Time Range Filter */}
        <View style={styles.timeRangeContainer}>
          {(['week', 'month', 'all'] as const).map((range) => (
            <TouchableOpacity
              key={range}
              style={[styles.timeRangeButton, timeRange === range && styles.timeRangeButtonActive]}
              onPress={() => setTimeRange(range)}
            >
              <Text style={[styles.timeRangeText, timeRange === range && styles.timeRangeTextActive]}>
                {range === 'week' ? 'This Week' : range === 'month' ? 'This Month' : 'All Time'}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Leaderboard */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Trophy size={24} color={COLORS.primary} />
            <Text style={styles.sectionTitle}>Leaderboard</Text>
          </View>

          {leaderboard.map((miner, index) => (
            <Animated.View
              key={miner.id}
              style={[
                styles.leaderboardCard,
                miner.isCurrentUser && styles.currentUserHighlight,
                {
                  transform: [
                    {
                      translateX: animatedValue.interpolate({
                        inputRange: [0, 1],
                        outputRange: [50, 0],
                      }),
                    },
                  ],
                  opacity: animatedValue,
                },
              ]}
            >
              {miner.rank <= 3 && (
                <LinearGradient
                  colors={getRankColor(miner.rank)}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.topRankGradient}
                >
                  <View style={styles.leaderboardContent}>
                    <View style={styles.leaderboardLeft}>
                      <View style={styles.rankBadge}>{getRankIcon(miner.rank)}</View>
                      <View>
                        <Text style={[styles.minerName, miner.rank <= 3 && { color: '#FFFFFF' }]}>
                          {miner.name}
                        </Text>
                        <View style={styles.minerStats}>
                          <Text style={[styles.minerStat, miner.rank <= 3 && { color: '#FFFFFF' }]}>
                            Level {miner.level}
                          </Text>
                          <Text style={[styles.minerStat, miner.rank <= 3 && { color: '#FFFFFF' }]}>
                            •
                          </Text>
                          <Text style={[styles.minerStat, miner.rank <= 3 && { color: '#FFFFFF' }]}>
                            {miner.safetyScore}% Safe
                          </Text>
                        </View>
                      </View>
                    </View>
                    <View style={styles.leaderboardRight}>
                      <Text style={[styles.points, miner.rank <= 3 && { color: '#FFFFFF' }]}>
                        {miner.totalPoints}
                      </Text>
                      <Text style={[styles.pointsLabel, miner.rank <= 3 && { color: '#FFFFFF' }]}>
                        points
                      </Text>
                    </View>
                  </View>
                </LinearGradient>
              )}

              {miner.rank > 3 && (
                <View style={styles.leaderboardContent}>
                  <View style={styles.leaderboardLeft}>
                    <View style={styles.rankBadge}>{getRankIcon(miner.rank)}</View>
                    <View>
                      <Text style={styles.minerName}>{miner.name}</Text>
                      <View style={styles.minerStats}>
                        <Text style={styles.minerStat}>Level {miner.level}</Text>
                        <Text style={styles.minerStat}>•</Text>
                        <Text style={styles.minerStat}>{miner.safetyScore}% Safe</Text>
                      </View>
                    </View>
                  </View>
                  <View style={styles.leaderboardRight}>
                    <Text style={styles.points}>{miner.totalPoints}</Text>
                    <Text style={styles.pointsLabel}>points</Text>
                  </View>
                </View>
              )}
            </Animated.View>
          ))}
        </View>

        {/* Achievements */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Award size={24} color={COLORS.primary} />
            <Text style={styles.sectionTitle}>Achievements</Text>
          </View>

          {achievements.map((achievement) => (
            <View
              key={achievement.id}
              style={[
                styles.achievementCard,
                achievement.unlocked && styles.achievementUnlocked,
              ]}
            >
              <View style={styles.achievementIcon}>
                <Text style={styles.achievementEmoji}>{achievement.icon}</Text>
              </View>
              <View style={styles.achievementContent}>
                <Text style={[styles.achievementTitle, achievement.unlocked && styles.achievementTitleUnlocked]}>
                  {achievement.title}
                </Text>
                <Text style={styles.achievementDescription}>{achievement.description}</Text>
                
                {!achievement.unlocked && achievement.progress !== undefined && (
                  <View style={styles.progressContainer}>
                    <View style={styles.progressBar}>
                      <View
                        style={[
                          styles.progressFill,
                          { width: `${(achievement.progress / (achievement.total || 1)) * 100}%` },
                        ]}
                      />
                    </View>
                    <Text style={styles.progressText}>
                      {achievement.progress}/{achievement.total}
                    </Text>
                  </View>
                )}
              </View>
              <View style={styles.achievementPoints}>
                <Star size={16} color={achievement.unlocked ? '#FFD700' : COLORS.textMuted} />
                <Text style={[styles.pointsValue, achievement.unlocked && { color: '#FFD700' }]}>
                  {achievement.points}
                </Text>
              </View>
            </View>
          ))}
        </View>

        <View style={{ height: 40 }} />
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
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  backButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: COLORS.text,
  },
  scrollView: {
    flex: 1,
  },
  currentUserCard: {
    margin: 20,
    borderRadius: 20,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 12,
  },
  currentUserGradient: {
    padding: 20,
  },
  currentUserHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 20,
  },
  currentUserRank: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.9)',
    marginBottom: 4,
  },
  currentUserName: {
    fontSize: 24,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  currentUserLevel: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    gap: 6,
  },
  currentUserLevelText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  currentUserStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 20,
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: 20,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.8)',
  },
  statDivider: {
    width: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
  },
  badgesContainer: {
    flexDirection: 'row',
    gap: 8,
    justifyContent: 'center',
  },
  badge: {
    fontSize: 24,
  },
  timeRangeContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    marginBottom: 20,
    gap: 12,
  },
  timeRangeButton: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 12,
    backgroundColor: COLORS.card,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  timeRangeButtonActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  timeRangeText: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.text,
  },
  timeRangeTextActive: {
    color: '#FFFFFF',
  },
  section: {
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: COLORS.text,
  },
  leaderboardCard: {
    marginBottom: 12,
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: COLORS.card,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  currentUserHighlight: {
    borderColor: COLORS.primary,
    borderWidth: 2,
  },
  topRankGradient: {
    padding: 16,
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
    gap: 16,
    flex: 1,
  },
  rankBadge: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  rankNumber: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.text,
  },
  minerName: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: 4,
  },
  minerStats: {
    flexDirection: 'row',
    gap: 8,
  },
  minerStat: {
    fontSize: 13,
    color: COLORS.textMuted,
  },
  leaderboardRight: {
    alignItems: 'flex-end',
  },
  points: {
    fontSize: 20,
    fontWeight: '700',
    color: COLORS.primary,
  },
  pointsLabel: {
    fontSize: 12,
    color: COLORS.textMuted,
  },
  achievementCard: {
    flexDirection: 'row',
    backgroundColor: COLORS.card,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
    opacity: 0.6,
  },
  achievementUnlocked: {
    opacity: 1,
    borderColor: '#FFD700',
  },
  achievementIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: COLORS.background,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  achievementEmoji: {
    fontSize: 28,
  },
  achievementContent: {
    flex: 1,
  },
  achievementTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.textMuted,
    marginBottom: 4,
  },
  achievementTitleUnlocked: {
    color: COLORS.text,
  },
  achievementDescription: {
    fontSize: 13,
    color: COLORS.textMuted,
    marginBottom: 8,
  },
  progressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  progressBar: {
    flex: 1,
    height: 6,
    backgroundColor: COLORS.background,
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: COLORS.primary,
    borderRadius: 3,
  },
  progressText: {
    fontSize: 12,
    color: COLORS.textMuted,
    fontWeight: '600',
  },
  achievementPoints: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginLeft: 12,
  },
  pointsValue: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.textMuted,
  },
});
