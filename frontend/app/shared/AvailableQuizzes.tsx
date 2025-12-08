import { ArrowLeft, BookOpen, Clock, Trophy } from '@/components/Icons';
import { COLORS } from '@/constants/styles';
import { useRouter } from 'expo-router';
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
import { useRoleStore } from '../../hooks/useRoleStore';

interface Quiz {
  id: string;
  title: string;
  description: string;
  topic: string;
  difficulty: 'easy' | 'medium' | 'hard';
  targetAudience: 'miner' | 'supervisor' | 'all';
  language: string;
  questionsCount: number;
  createdAt: Timestamp;
  status: 'active' | 'scheduled' | 'completed';
}

interface QuizResponse {
  quizId: string;
  score: number;
  percentage: number;
  completedAt: Timestamp;
}

export default function AvailableQuizzes() {
  const router = useRouter();
  const { user } = useRoleStore();
  
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [completedQuizzes, setCompletedQuizzes] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadQuizzes();
  }, []);

  const loadQuizzes = async () => {
    try {
      setLoading(true);
      setCompletedQuizzes(new Set()); // Reset completed quizzes
      
      // Load available quizzes
      const quizzesQuery = query(
        collection(db, 'dailyQuizzes'),
        orderBy('createdAt', 'desc')
      );
      
      const quizzesSnapshot = await getDocs(quizzesQuery);
      const quizzesData = quizzesSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      })) as Quiz[];
      
      // Filter quizzes based on status and target audience (client-side filtering)
      // Miners see: 'miner' or 'all' quizzes
      // Supervisors see: 'supervisor' or 'all' quizzes
      const filteredQuizzes = quizzesData.filter(quiz => {
        const isActive = quiz.status === 'active';
        const isForCurrentUser = 
          quiz.targetAudience === 'all' || 
          quiz.targetAudience === user.role;
        return isActive && isForCurrentUser;
      });
      
      console.log(`📚 [AvailableQuizzes] Loaded ${filteredQuizzes.length} quizzes for ${user.role}`);
      
      // Load user's completed quizzes
      const userIdentifier = user.phone || user.id || 'anonymous';
      const responsesQuery = query(
        collection(db, 'quizResponses'),
        where('userId', '==', userIdentifier)
      );
      
      const responsesSnapshot = await getDocs(responsesQuery);
      const completed = new Set<string>();
      responsesSnapshot.docs.forEach(doc => {
        const data = doc.data() as QuizResponse;
        // Only add to completed if the quiz is in the filtered list
        if (filteredQuizzes.some(q => q.id === data.quizId)) {
          completed.add(data.quizId);
        }
      });
      
      console.log(`✅ [AvailableQuizzes] Completed ${completed.size} quizzes`);
      
      setQuizzes(filteredQuizzes);
      setCompletedQuizzes(completed);
      
    } catch (error) {
      console.error('Error loading quizzes:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleStartQuiz = (quizId: string, isCompleted: boolean = false) => {
    if (isCompleted) {
      router.push({
        pathname: '/shared/QuizResults',
        params: { quizId },
      });
    } else {
      router.push({
        pathname: '/shared/TakeQuiz',
        params: { quizId },
      });
    }
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'easy': return '#10B981';
      case 'medium': return '#F59E0B';
      case 'hard': return '#EF4444';
      default: return COLORS.primary;
    }
  };

  const getAudienceIcon = (audience: string) => {
    return audience === 'all' ? '👥' : audience === 'miner' ? '⛏️' : '👔';
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <ArrowLeft size={24} color={COLORS.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Daily Safety Quizzes</Text>
        <TouchableOpacity onPress={loadQuizzes} style={styles.refreshButton}>
          <Text style={styles.refreshButtonText}>🔄</Text>
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.primary} />
          <Text style={styles.loadingText}>Loading quizzes...</Text>
        </View>
      ) : (
        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {/* Info Banner for Miners */}
          {user.role === 'miner' && (
            <View style={styles.infoBanner}>
              <Text style={styles.infoBannerTitle}>📋 Daily Safety Quizzes</Text>
              <Text style={styles.infoBannerText}>
                Complete quizzes assigned by Safety Officers to test your mining safety knowledge. Your results will be reviewed by the Safety Officer.
              </Text>
            </View>
          )}

          {/* Stats */}
          <View style={styles.statsContainer}>
            <View style={styles.statCard}>
              <BookOpen size={24} color={COLORS.primary} />
              <Text style={styles.statValue}>{quizzes.length}</Text>
              <Text style={styles.statLabel}>Available</Text>
            </View>
            <View style={styles.statCard}>
              <Trophy size={24} color="#10B981" />
              <Text style={styles.statValue}>{completedQuizzes.size}</Text>
              <Text style={styles.statLabel}>Completed</Text>
            </View>
            <View style={styles.statCard}>
              <Clock size={24} color="#F59E0B" />
              <Text style={styles.statValue}>
                {Math.max(0, quizzes.length - completedQuizzes.size)}
              </Text>
              <Text style={styles.statLabel}>Pending</Text>
            </View>
          </View>

          {/* Quizzes List */}
          {quizzes.length === 0 ? (
            <View style={styles.emptyState}>
              <BookOpen size={64} color={COLORS.textMuted} />
              <Text style={styles.emptyStateText}>No quizzes available</Text>
              <Text style={styles.emptyStateSubtext}>
                Check back later for new safety quizzes
              </Text>
            </View>
          ) : (
            <>
              <Text style={styles.sectionTitle}>Available Quizzes</Text>
              
              {quizzes.map((quiz) => {
                const isCompleted = completedQuizzes.has(quiz.id);
                
                return (
                  <TouchableOpacity
                    key={quiz.id}
                    style={[
                      styles.quizCard,
                      isCompleted && styles.quizCardCompleted,
                    ]}
                    onPress={() => handleStartQuiz(quiz.id, isCompleted)}
                  >
                    <View style={styles.quizHeader}>
                      <View style={styles.quizHeaderLeft}>
                        <Text style={styles.quizAudience}>
                          {getAudienceIcon(quiz.targetAudience)}
                        </Text>
                        <View style={{ flex: 1 }}>
                          <Text style={[
                            styles.quizTitle,
                            isCompleted && styles.quizTitleCompleted,
                          ]}>
                            {quiz.title}
                          </Text>
                          <Text style={styles.quizTopic}>{quiz.topic}</Text>
                        </View>
                      </View>
                      
                      <View
                        style={[
                          styles.difficultyBadge,
                          { backgroundColor: getDifficultyColor(quiz.difficulty) + '20' },
                        ]}
                      >
                        <Text
                          style={[
                            styles.difficultyText,
                            { color: getDifficultyColor(quiz.difficulty) },
                          ]}
                        >
                          {quiz.difficulty}
                        </Text>
                      </View>
                    </View>

                    <Text style={[
                      styles.quizDescription,
                      isCompleted && styles.quizDescriptionCompleted,
                    ]}>
                      {quiz.description}
                    </Text>

                    <View style={styles.quizFooter}>
                      <View style={styles.quizMeta}>
                        <Text style={styles.quizMetaText}>
                          📝 {quiz.questionsCount} questions
                        </Text>
                        <Text style={styles.quizMetaText}>
                          🌐 {quiz.language.toUpperCase()}
                        </Text>
                      </View>

                      {isCompleted ? (
                        <View style={styles.viewResultsButton}>
                          <Trophy size={16} color="#10B981" />
                          <Text style={styles.viewResultsButtonText}>View Results</Text>
                        </View>
                      ) : (
                        <View style={styles.startButton}>
                          <Text style={styles.startButtonText}>Start Quiz →</Text>
                        </View>
                      )}
                    </View>
                  </TouchableOpacity>
                );
              })}
            </>
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
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 24,
    gap: 12,
  },
  statCard: {
    flex: 1,
    alignItems: 'center',
    backgroundColor: COLORS.card,
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 8,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginHorizontal: 2,
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
  refreshButton: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: COLORS.primary + '20',
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  refreshButtonText: {
    fontSize: 20,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.text,
    flex: 1,
    textAlign: 'center',
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: COLORS.secondary,
  },
  content: {
    flex: 1,
    padding: 20,
  },
  infoBanner: {
    backgroundColor: COLORS.primary + '15',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
    borderLeftWidth: 4,
    borderLeftColor: COLORS.primary,
  },
  infoBannerTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: 8,
  },
  infoBannerText: {
    fontSize: 14,
    color: COLORS.textMuted,
    lineHeight: 20,
    marginVertical: 4,
  },
  statLabel: {
    fontSize: 12,
    color: COLORS.secondary,
  },
  statValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.text,
    marginTop: 4,
    marginBottom: 2,
    textAlign: 'center',
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
    color: COLORS.textMuted,
    textAlign: 'center',
  },
  quizCard: {
    backgroundColor: COLORS.card,
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  quizCardCompleted: {
    opacity: 0.6,
  },
  quizHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  quizHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 12,
  },
  quizAudience: {
    fontSize: 28,
  },
  quizTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: 4,
  },
  quizTitleCompleted: {
    textDecorationLine: 'line-through',
  },
  quizTopic: {
    fontSize: 13,
    color: COLORS.textMuted,
  },
  difficultyBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  difficultyText: {
    fontSize: 11,
    fontWeight: 'bold',
    textTransform: 'uppercase',
  },
  quizDescription: {
    fontSize: 14,
    color: COLORS.textMuted,
    marginBottom: 12,
    lineHeight: 20,
  },
  quizDescriptionCompleted: {
    opacity: 0.7,
  },
  quizFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  quizMeta: {
    flexDirection: 'row',
    gap: 12,
  },
  quizMetaText: {
    fontSize: 12,
    color: COLORS.textMuted,
  },
  startButton: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  startButtonText: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.background,
  },
  completedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#10B98120',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  completedText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#10B981',
  },
  viewResultsButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#10B981',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 8,
    shadowColor: '#10B981',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
  },
  viewResultsButtonText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});
