import { ArrowLeft, Trophy, User } from '@/components/Icons';
import { COLORS } from '@/constants/styles';
import { useLocalSearchParams, useRouter } from 'expo-router';
import {
    collection,
    getDocs,
    orderBy,
    query,
    Timestamp,
    where
} from 'firebase/firestore';
import React, { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { db } from '../../config/firebase';

interface QuizResponse {
  id: string;
  userId: string;
  userName: string;
  userRole: 'miner' | 'supervisor';
  score: number;
  totalQuestions: number;
  percentage: number;
  timeTaken: number; // seconds
  completedAt: Timestamp;
}

export default function QuizResponses() {
  const router = useRouter();
  const params = useLocalSearchParams();
  
  const quizId = params.quizId as string;
  const quizTitle = params.title as string;
  
  const [responses, setResponses] = useState<QuizResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalResponses: 0,
    averageScore: 0,
    averageTime: 0,
    passRate: 0,
  });

  useEffect(() => {
    loadResponses();
  }, [quizId]);

  const loadResponses = async () => {
    try {
      setLoading(true);
      
      const q = query(
        collection(db, 'quizResponses'),
        where('quizId', '==', quizId),
        orderBy('completedAt', 'desc')
      );
      
      const snapshot = await getDocs(q);
      const responsesData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      })) as QuizResponse[];
      
      setResponses(responsesData);
      
      // Calculate stats
      if (responsesData.length > 0) {
        const totalScore = responsesData.reduce((sum, r) => sum + r.percentage, 0);
        const totalTime = responsesData.reduce((sum, r) => sum + r.timeTaken, 0);
        const passed = responsesData.filter(r => r.percentage >= 70).length;
        
        setStats({
          totalResponses: responsesData.length,
          averageScore: Math.round(totalScore / responsesData.length),
          averageTime: Math.round(totalTime / responsesData.length),
          passRate: Math.round((passed / responsesData.length) * 100),
        });
      }
      
    } catch (error) {
      // Silently fail to load responses
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getScoreColor = (percentage: number): string => {
    if (percentage >= 80) return '#10B981';
    if (percentage >= 60) return '#F59E0B';
    return '#EF4444';
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <ArrowLeft size={24} color={COLORS.text} />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>Quiz Responses</Text>
          <Text style={styles.headerSubtitle}>{quizTitle}</Text>
        </View>
        <View style={{ width: 40 }} />
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.primary} />
          <Text style={styles.loadingText}>Loading responses...</Text>
        </View>
      ) : (
        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {/* Stats Cards */}
          <View style={styles.statsContainer}>
            <View style={styles.statCard}>
              <Text style={styles.statValue}>{stats.totalResponses}</Text>
              <Text style={styles.statLabel}>Responses</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={[styles.statValue, { color: getScoreColor(stats.averageScore) }]}>
                {stats.averageScore}%
              </Text>
              <Text style={styles.statLabel}>Avg Score</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statValue}>{stats.passRate}%</Text>
              <Text style={styles.statLabel}>Pass Rate</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statValue}>{formatTime(stats.averageTime)}</Text>
              <Text style={styles.statLabel}>Avg Time</Text>
            </View>
          </View>

          {/* Responses List */}
          <Text style={styles.sectionTitle}>Individual Responses</Text>
          
          {responses.length === 0 ? (
            <View style={styles.emptyState}>
              <Trophy size={48} color={COLORS.textSecondary} />
              <Text style={styles.emptyStateText}>No responses yet</Text>
              <Text style={styles.emptyStateSubtext}>
                Responses will appear here once users complete the quiz
              </Text>
            </View>
          ) : (
            responses.map((response) => (
              <View key={response.id} style={styles.responseCard}>
                <View style={styles.responseHeader}>
                  <View style={styles.userInfo}>
                    <View style={styles.userAvatar}>
                      <User size={20} color={COLORS.text} />
                    </View>
                    <View>
                      <Text style={styles.userName}>{response.userName}</Text>
                      <Text style={styles.userRole}>
                        {response.userRole === 'miner' ? '⛏️ Miner' : '👔 Supervisor'}
                      </Text>
                    </View>
                  </View>
                  
                  <View
                    style={[
                      styles.scoreBadge,
                      { backgroundColor: getScoreColor(response.percentage) + '20' },
                    ]}
                  >
                    <Trophy
                      size={16}
                      color={getScoreColor(response.percentage)}
                    />
                    <Text
                      style={[
                        styles.scoreText,
                        { color: getScoreColor(response.percentage) },
                      ]}
                    >
                      {response.percentage}%
                    </Text>
                  </View>
                </View>

                <View style={styles.responseDetails}>
                  <View style={styles.detailItem}>
                    <Text style={styles.detailLabel}>Score:</Text>
                    <Text style={styles.detailValue}>
                      {response.score}/{response.totalQuestions}
                    </Text>
                  </View>
                  
                  <View style={styles.detailItem}>
                    <Text style={styles.detailLabel}>Time:</Text>
                    <Text style={styles.detailValue}>
                      {formatTime(response.timeTaken)}
                    </Text>
                  </View>
                  
                  <View style={styles.detailItem}>
                    <Text style={styles.detailLabel}>Completed:</Text>
                    <Text style={styles.detailValue}>
                      {response.completedAt
                        ? new Date(response.completedAt.toDate()).toLocaleString()
                        : 'Just now'}
                    </Text>
                  </View>
                </View>
              </View>
            ))
          )}
        </ScrollView>
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
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  backButton: {
    padding: 4,
  },
  headerCenter: {
    flex: 1,
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.text,
  },
  headerSubtitle: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: COLORS.textSecondary,
  },
  content: {
    flex: 1,
    padding: 20,
  },
  statsContainer: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 24,
  },
  statCard: {
    flex: 1,
    backgroundColor: COLORS.card,
    padding: 12,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  statValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 11,
    color: COLORS.textSecondary,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: 16,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyStateText: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.text,
    marginTop: 16,
    marginBottom: 8,
  },
  emptyStateSubtext: {
    fontSize: 14,
    color: COLORS.textSecondary,
    textAlign: 'center',
  },
  responseCard: {
    backgroundColor: COLORS.card,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  responseHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  userAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.primary + '20',
    alignItems: 'center',
    justifyContent: 'center',
  },
  userName: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text,
  },
  userRole: {
    fontSize: 13,
    color: COLORS.textSecondary,
  },
  scoreBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  scoreText: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  responseDetails: {
    gap: 8,
  },
  detailItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  detailLabel: {
    fontSize: 14,
    color: COLORS.textSecondary,
  },
  detailValue: {
    fontSize: 14,
    fontWeight: '500',
    color: COLORS.text,
  },
});
