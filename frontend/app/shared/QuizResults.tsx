import { ArrowLeft, CheckCircle, Trophy } from '@/components/Icons';
import { COLORS } from '@/constants/styles';
import { useLocalSearchParams, useRouter } from 'expo-router';
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
import { collection, getDocs, query, where } from 'firebase/firestore';

interface QuizQuestion {
  id: string;
  question: string;
  options: string[];
  correctAnswer: number;
  explanation: string;
}

interface QuizDetail {
  title: string;
  description: string;
  questions: QuizQuestion[];
}

export default function QuizResults() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const { user } = useRoleStore();

  const quizId = params.quizId as string;
  
  const [quiz, setQuiz] = useState<QuizDetail | null>(null);
  const [userAnswers, setUserAnswers] = useState<number[]>([]);
  const [loading, setLoading] = useState(true);
  const [score, setScore] = useState(parseInt(params.score as string) || 0);
  const [total, setTotal] = useState(parseInt(params.total as string) || 0);
  const [percentage, setPercentage] = useState(parseInt(params.percentage as string) || 0);

  useEffect(() => {
    loadResultsData();
  }, [quizId]);

  const loadResultsData = async () => {
    try {
      setLoading(true);

      // Load quiz details
      const { getDoc, doc } = await import('firebase/firestore');
      const quizDoc = await getDoc(doc(db, 'dailyQuizzes', quizId));

      if (quizDoc.exists()) {
        const quizData = quizDoc.data();
        setQuiz({
          title: quizData.title || 'Quiz',
          description: quizData.description || '',
          questions: quizData.questions || [],
        });
      }

      // Load user's responses for this quiz
      const userId = user.phone || user.id || 'anonymous';
      const responsesQuery = query(
        collection(db, 'quizResponses'),
        where('quizId', '==', quizId),
        where('userId', '==', userId)
      );

      const responsesSnapshot = await getDocs(responsesQuery);
      if (!responsesSnapshot.empty) {
        const responseData = responsesSnapshot.docs[0].data();
        setUserAnswers(responseData.answers || []);
        
        // If score data not in params, load from response
        if (!params.score) {
          setScore(responseData.score || 0);
          setTotal(responseData.totalQuestions || 0);
          setPercentage(responseData.percentage || 0);
        }
      }
    } catch (error) {
      console.error('Error loading results:', error);
    } finally {
      setLoading(false);
    }
  };

  const getScoreColor = () => {
    if (percentage >= 80) return '#10B981'; // Green for 80%+
    if (percentage >= 60) return '#F59E0B'; // Amber for 60-79%
    return '#EF4444'; // Red for below 60%
  };

  const getScoreFeedback = () => {
    if (percentage >= 90) return '🌟 Excellent!';
    if (percentage >= 80) return '✅ Great Job!';
    if (percentage >= 70) return '👍 Good!';
    if (percentage >= 60) return '⚠️ Needs Improvement';
    return '❌ Please Review';
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.primary} />
          <Text style={styles.loadingText}>Loading results...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <ArrowLeft size={24} color={COLORS.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Quiz Results</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Score Card */}
        <View style={styles.scoreCard}>
          <View style={styles.scoreIconContainer}>
            <Trophy size={48} color={getScoreColor()} />
          </View>

          <Text style={styles.scoreFeedback}>{getScoreFeedback()}</Text>

          <View style={styles.scoreCircle}>
            <Text style={[styles.scorePercentage, { color: getScoreColor() }]}>
              {percentage}%
            </Text>
          </View>

          <Text style={styles.scoreText}>
            You scored <Text style={{ fontWeight: 'bold' }}>{score}</Text> out of{' '}
            <Text style={{ fontWeight: 'bold' }}>{total}</Text> questions
          </Text>

          {quiz && (
            <>
              <Text style={styles.quizTitle}>{quiz.title}</Text>
              <Text style={styles.quizDescription}>{quiz.description}</Text>
            </>
          )}
        </View>

        {/* Performance Analysis */}
        <View style={styles.analysisCard}>
          <Text style={styles.analysisTitle}>📊 Performance Analysis</Text>

          <View style={styles.statRow}>
            <Text style={styles.statLabel}>Correct Answers</Text>
            <Text style={[styles.statValue, { color: '#10B981' }]}>{score}</Text>
          </View>

          <View style={styles.divider} />

          <View style={styles.statRow}>
            <Text style={styles.statLabel}>Incorrect Answers</Text>
            <Text style={[styles.statValue, { color: '#EF4444' }]}>
              {total - score}
            </Text>
          </View>

          <View style={styles.divider} />

          <View style={styles.statRow}>
            <Text style={styles.statLabel}>Accuracy Rate</Text>
            <Text style={[styles.statValue, { color: getScoreColor() }]}>
              {percentage}%
            </Text>
          </View>
        </View>

        {/* Detailed Review */}
        {quiz && quiz.questions.length > 0 && (
          <View style={styles.reviewCard}>
            <Text style={styles.reviewTitle}>📝 Answer Review</Text>

            {quiz.questions.map((question, index) => {
              const userAnswerIndex = userAnswers[index];
              const isCorrect = userAnswerIndex === question.correctAnswer;

              return (
                <View key={question.id} style={styles.questionReview}>
                  <View
                    style={[
                      styles.questionHeader,
                      {
                        borderLeftColor: isCorrect ? '#10B981' : '#EF4444',
                      },
                    ]}
                  >
                    <View style={styles.questionNumberContainer}>
                      <Text style={styles.questionNumber}>{index + 1}</Text>
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.questionText}>{question.question}</Text>
                    </View>
                    <View
                      style={[
                        styles.resultIcon,
                        { backgroundColor: isCorrect ? '#10B98120' : '#EF444420' },
                      ]}
                    >
                      <Text style={styles.resultIconText}>
                        {isCorrect ? '✅' : '❌'}
                      </Text>
                    </View>
                  </View>

                  <View style={styles.answerContainer}>
                    {question.options.map((option, optionIndex) => {
                      const isUserAnswer = optionIndex === userAnswerIndex;
                      const isCorrectAnswer = optionIndex === question.correctAnswer;

                      return (
                        <View
                          key={optionIndex}
                          style={[
                            styles.optionBox,
                            isCorrectAnswer && styles.correctAnswerBox,
                            isUserAnswer && !isCorrectAnswer && styles.incorrectAnswerBox,
                          ]}
                        >
                          <Text style={styles.optionLetter}>
                            {String.fromCharCode(65 + optionIndex)}.
                          </Text>
                          <Text style={styles.optionText}>{option}</Text>
                          {isCorrectAnswer && (
                            <Text style={styles.correctLabel}>✓ Correct</Text>
                          )}
                          {isUserAnswer && !isCorrectAnswer && (
                            <Text style={styles.incorrectLabel}>✗ Your Answer</Text>
                          )}
                        </View>
                      );
                    })}
                  </View>

                  {!isCorrect && (
                    <View style={styles.explanationBox}>
                      <Text style={styles.explanationTitle}>💡 Explanation</Text>
                      <Text style={styles.explanationText}>{question.explanation}</Text>
                    </View>
                  )}
                </View>
              );
            })}
          </View>
        )}

        {/* Action Buttons */}
        <View style={styles.actionContainer}>
          <TouchableOpacity
            style={styles.homeButton}
            onPress={() => router.replace('/miner/MinerHome')}
          >
            <Text style={styles.homeButtonText}>Back to Home</Text>
          </TouchableOpacity>
        </View>
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
    backgroundColor: COLORS.card,
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.text,
  },
  content: {
    flex: 1,
    paddingHorizontal: 18,
    paddingVertical: 16,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: COLORS.text,
  },
  scoreCard: {
    backgroundColor: COLORS.card,
    borderRadius: 20,
    padding: 24,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  scoreIconContainer: {
    marginBottom: 16,
  },
  scoreFeedback: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: 16,
  },
  scoreCircle: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: COLORS.background,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
    borderWidth: 3,
    borderColor: COLORS.primary,
  },
  scorePercentage: {
    fontSize: 48,
    fontWeight: 'bold',
  },
  scoreText: {
    fontSize: 16,
    color: COLORS.text,
    textAlign: 'center',
    marginBottom: 16,
    lineHeight: 24,
  },
  quizTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 8,
  },
  quizDescription: {
    fontSize: 14,
    color: COLORS.text,
    textAlign: 'center',
    opacity: 0.8,
  },
  analysisCard: {
    backgroundColor: COLORS.card,
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  analysisTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 16,
  },
  statRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  statLabel: {
    fontSize: 14,
    color: COLORS.text,
    fontWeight: '500',
  },
  statValue: {
    fontSize: 16,
    fontWeight: '700',
  },
  divider: {
    height: 1,
    backgroundColor: COLORS.border,
    marginVertical: 8,
  },
  reviewCard: {
    backgroundColor: COLORS.card,
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  reviewTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 16,
  },
  questionReview: {
    marginBottom: 24,
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: COLORS.background,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  questionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    backgroundColor: COLORS.card,
    borderLeftWidth: 4,
    gap: 12,
  },
  questionNumberContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: COLORS.primary + '30',
    alignItems: 'center',
    justifyContent: 'center',
  },
  questionNumber: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.primary,
  },
  questionText: {
    fontSize: 14,
    color: COLORS.text,
    fontWeight: '600',
    flex: 1,
    lineHeight: 20,
  },
  resultIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  resultIconText: {
    fontSize: 18,
  },
  answerContainer: {
    padding: 14,
    gap: 10,
  },
  optionBox: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 10,
    backgroundColor: COLORS.background,
    borderWidth: 1,
    borderColor: COLORS.border,
    gap: 10,
  },
  correctAnswerBox: {
    backgroundColor: '#10B98120',
    borderColor: '#10B981',
    borderWidth: 2,
  },
  incorrectAnswerBox: {
    backgroundColor: '#EF444420',
    borderColor: '#EF4444',
    borderWidth: 2,
  },
  optionLetter: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.primary,
    minWidth: 24,
  },
  optionText: {
    fontSize: 13,
    color: COLORS.text,
    flex: 1,
  },
  correctLabel: {
    fontSize: 12,
    color: '#10B981',
    fontWeight: '600',
    paddingHorizontal: 8,
    paddingVertical: 4,
    backgroundColor: '#10B98120',
    borderRadius: 6,
  },
  incorrectLabel: {
    fontSize: 12,
    color: '#EF4444',
    fontWeight: '600',
    paddingHorizontal: 8,
    paddingVertical: 4,
    backgroundColor: '#EF444420',
    borderRadius: 6,
  },
  explanationBox: {
    backgroundColor: COLORS.primary + '15',
    borderLeftWidth: 4,
    borderLeftColor: COLORS.primary,
    padding: 12,
    marginTop: 8,
    borderRadius: 8,
  },
  explanationTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.primary,
    marginBottom: 6,
  },
  explanationText: {
    fontSize: 13,
    color: COLORS.text,
    lineHeight: 20,
    opacity: 0.85,
  },
  actionContainer: {
    gap: 12,
    marginBottom: 24,
  },
  homeButton: {
    backgroundColor: COLORS.primary,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  homeButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});
