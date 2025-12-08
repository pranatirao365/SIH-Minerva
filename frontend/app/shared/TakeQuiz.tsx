import { ArrowLeft, CheckCircle, Trophy, XCircle } from '@/components/Icons';
import { COLORS } from '@/constants/styles';
import { useLocalSearchParams, useRouter } from 'expo-router';
import {
    addDoc,
    collection,
    doc,
    getDoc,
    serverTimestamp
} from 'firebase/firestore';
import React, { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { db } from '../../config/firebase';
import { useRoleStore } from '../../hooks/useRoleStore';
import { QuizQuestion } from '../../services/quizService';

interface QuizData {
  id: string;
  title: string;
  description: string;
  topic: string;
  difficulty: 'easy' | 'medium' | 'hard';
  targetAudience: 'miner' | 'supervisor' | 'all';
  language: string;
  questions: QuizQuestion[];
  questionsCount: number;
}

export default function TakeQuiz() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const { user, updateSafetyScore, completeModule } = useRoleStore();
  
  const quizId = params.quizId as string;
  
  const [quiz, setQuiz] = useState<QuizData | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [showFeedback, setShowFeedback] = useState(false);
  const [answers, setAnswers] = useState<number[]>([]);
  const [score, setScore] = useState(0);
  const [startTime] = useState(Date.now());
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    loadQuiz();
  }, [quizId]);

  const loadQuiz = async () => {
    try {
      setLoading(true);
      const quizDoc = await getDoc(doc(db, 'dailyQuizzes', quizId));
      
      if (!quizDoc.exists()) {
        Alert.alert('Error', 'Quiz not found');
        router.back();
        return;
      }
      
      const quizData = {
        id: quizDoc.id,
        ...quizDoc.data(),
      } as QuizData;
      
      setQuiz(quizData);
    } catch (error) {
      Alert.alert('Error', 'Failed to load quiz');
      router.back();
    } finally {
      setLoading(false);
    }
  };

  const handleAnswer = (index: number) => {
    if (showFeedback) return;
    
    setSelectedAnswer(index);
    setShowFeedback(true);
    
    const question = quiz!.questions[currentQuestion];
    const newAnswers = [...answers, index];
    setAnswers(newAnswers);

    if (index === question.correctAnswer) {
      setScore(score + 1);
    }
  };

  const handleNext = async () => {
    const isLastQuestion = currentQuestion === quiz!.questions.length - 1;
    
    if (isLastQuestion) {
      await submitQuiz();
    } else {
      setCurrentQuestion(currentQuestion + 1);
      setSelectedAnswer(null);
      setShowFeedback(false);
    }
  };

  const submitQuiz = async () => {
    if (!quiz) return;
    
    try {
      setSubmitting(true);
      
      const timeTaken = Math.round((Date.now() - startTime) / 1000); // seconds
      const totalQuestions = quiz.questions.length;
      const correctAnswers = score;
      const percentage = Math.round((correctAnswers / totalQuestions) * 100);
      
      // Save quiz response to Firestore
      await addDoc(collection(db, 'quizResponses'), {
        quizId: quiz.id,
        userId: user.phone || user.id || 'anonymous',
        userName: user.name || 'User',
        userRole: user.role || 'miner',
        score: correctAnswers,
        totalQuestions,
        percentage,
        timeTaken,
        answers: answers,
        completedAt: serverTimestamp(),
      });
      
      // Update user's safety score if they're a miner
      if (user.role === 'miner') {
        updateSafetyScore(percentage);
        completeModule('quiz');
      }
      
      // Show results
      Alert.alert(
        'Quiz Complete! 🎉',
        `Your Score: ${correctAnswers}/${totalQuestions} (${percentage}%)\n\nTime Taken: ${Math.floor(timeTaken / 60)}:${(timeTaken % 60).toString().padStart(2, '0')}`,
        [
          {
            text: 'View Results',
            onPress: () => {
              router.replace({
                pathname: '/shared/QuizResults',
                params: {
                  quizId: quiz.id,
                  score: correctAnswers,
                  total: totalQuestions,
                  percentage,
                },
              });
            },
          },
        ]
      );
      
    } catch (error) {
      Alert.alert('Error', 'Failed to submit quiz. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.primary} />
          <Text style={styles.loadingText}>Loading quiz...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!quiz) {
    return null;
  }

  const question = quiz.questions[currentQuestion];
  const isLastQuestion = currentQuestion === quiz.questions.length - 1;

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <ArrowLeft size={24} color={COLORS.text} />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>{quiz.title}</Text>
          <Text style={styles.headerSubtitle}>{quiz.topic}</Text>
        </View>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Progress */}
        <View style={styles.progressSection}>
          <View style={styles.progressInfo}>
            <Text style={styles.progressText}>
              Question {currentQuestion + 1} of {quiz.questions.length}
            </Text>
            <Text style={styles.scoreText}>
              Score: {score}/{quiz.questions.length}
            </Text>
          </View>
          
          <View style={styles.progressBarContainer}>
            <View 
              style={[
                styles.progressBar,
                { width: `${((currentQuestion + 1) / quiz.questions.length) * 100}%` }
              ]}
            />
          </View>
        </View>

        {/* Difficulty Badge */}
        <View style={styles.badgeContainer}>
          <View style={[styles.difficultyBadge, { backgroundColor: getDifficultyColor(quiz.difficulty) + '20' }]}>
            <Text style={[styles.difficultyText, { color: getDifficultyColor(quiz.difficulty) }]}>
              {quiz.difficulty.toUpperCase()}
            </Text>
          </View>
          <View style={styles.categoryBadge}>
            <Text style={styles.categoryText}>{question.category}</Text>
          </View>
        </View>

        {/* Question */}
        <View style={styles.questionCard}>
          <Text style={styles.questionText}>{question.question}</Text>
        </View>

        {/* Options */}
        <View style={styles.optionsContainer}>
          {question.options.map((option, index) => {
            const isSelected = selectedAnswer === index;
            const isCorrect = index === question.correctAnswer;
            const showCorrect = showFeedback && isCorrect;
            const showWrong = showFeedback && isSelected && !isCorrect;

            return (
              <TouchableOpacity
                key={index}
                onPress={() => handleAnswer(index)}
                disabled={showFeedback}
                style={[
                  styles.optionButton,
                  showCorrect && styles.optionCorrect,
                  showWrong && styles.optionWrong,
                  isSelected && !showFeedback && styles.optionSelected,
                ]}
              >
                <View style={styles.optionContent}>
                  <View style={[
                    styles.optionNumber,
                    showCorrect && styles.optionNumberCorrect,
                    showWrong && styles.optionNumberWrong,
                  ]}>
                    <Text style={[
                      styles.optionNumberText,
                      (showCorrect || showWrong) && styles.optionNumberTextActive,
                    ]}>
                      {String.fromCharCode(65 + index)}
                    </Text>
                  </View>
                  
                  <Text style={[
                    styles.optionText,
                    (showCorrect || showWrong) && styles.optionTextActive,
                  ]}>
                    {option}
                  </Text>
                </View>
                
                {showCorrect && (
                  <CheckCircle size={24} color="#10B981" />
                )}
                {showWrong && (
                  <XCircle size={24} color="#EF4444" />
                )}
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Feedback */}
        {showFeedback && (
          <View style={[
            styles.feedbackCard,
            selectedAnswer === question.correctAnswer ? styles.feedbackCorrect : styles.feedbackWrong,
          ]}>
            <View style={styles.feedbackHeader}>
              {selectedAnswer === question.correctAnswer ? (
                <CheckCircle size={24} color="#10B981" />
              ) : (
                <XCircle size={24} color="#EF4444" />
              )}
              <Text style={[
                styles.feedbackTitle,
                selectedAnswer === question.correctAnswer ? styles.feedbackTitleCorrect : styles.feedbackTitleWrong,
              ]}>
                {selectedAnswer === question.correctAnswer ? 'Correct!' : 'Incorrect'}
              </Text>
            </View>
            
            <Text style={styles.feedbackText}>
              {question.explanation}
            </Text>
            
            {selectedAnswer !== question.correctAnswer && (
              <Text style={styles.correctAnswerText}>
                Correct answer: {String.fromCharCode(65 + question.correctAnswer)}) {question.options[question.correctAnswer]}
              </Text>
            )}
          </View>
        )}
      </ScrollView>

      {/* Next Button */}
      {showFeedback && (
        <View style={styles.footer}>
          <TouchableOpacity
            style={styles.nextButton}
            onPress={handleNext}
            disabled={submitting}
          >
            {submitting ? (
              <ActivityIndicator color={COLORS.background} />
            ) : (
              <>
                {isLastQuestion ? (
                  <>
                    <Trophy size={20} color={COLORS.background} />
                    <Text style={styles.nextButtonText}>Submit Quiz</Text>
                  </>
                ) : (
                  <Text style={styles.nextButtonText}>Next Question →</Text>
                )}
              </>
            )}
          </TouchableOpacity>
        </View>
      )}
    </SafeAreaView>
  );
}

function getDifficultyColor(difficulty: string): string {
  switch (difficulty) {
    case 'easy': return '#10B981';
    case 'medium': return '#F59E0B';
    case 'hard': return '#EF4444';
    default: return COLORS.primary;
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
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
  content: {
    flex: 1,
    padding: 20,
  },
  progressSection: {
    marginBottom: 20,
  },
  progressInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  progressText: {
    fontSize: 14,
    color: COLORS.textSecondary,
  },
  scoreText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: COLORS.primary,
  },
  progressBarContainer: {
    height: 6,
    backgroundColor: COLORS.card,
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
    backgroundColor: COLORS.primary,
    borderRadius: 3,
  },
  badgeContainer: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 16,
  },
  difficultyBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  difficultyText: {
    fontSize: 11,
    fontWeight: 'bold',
  },
  categoryBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    backgroundColor: COLORS.card,
  },
  categoryText: {
    fontSize: 11,
    fontWeight: '600',
    color: COLORS.text,
  },
  questionCard: {
    backgroundColor: COLORS.card,
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  questionText: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.text,
    lineHeight: 26,
  },
  optionsContainer: {
    gap: 12,
    marginBottom: 16,
  },
  optionButton: {
    backgroundColor: COLORS.card,
    borderRadius: 12,
    padding: 16,
    borderWidth: 2,
    borderColor: COLORS.border,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  optionSelected: {
    borderColor: COLORS.primary,
    backgroundColor: COLORS.primary + '10',
  },
  optionCorrect: {
    borderColor: '#10B981',
    backgroundColor: '#10B98120',
  },
  optionWrong: {
    borderColor: '#EF4444',
    backgroundColor: '#EF444420',
  },
  optionContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 12,
  },
  optionNumber: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: COLORS.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
  optionNumberCorrect: {
    backgroundColor: '#10B981',
  },
  optionNumberWrong: {
    backgroundColor: '#EF4444',
  },
  optionNumberText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: COLORS.text,
  },
  optionNumberTextActive: {
    color: COLORS.background,
  },
  optionText: {
    flex: 1,
    fontSize: 15,
    color: COLORS.text,
    lineHeight: 22,
  },
  optionTextActive: {
    fontWeight: '600',
  },
  feedbackCard: {
    borderRadius: 12,
    padding: 16,
    marginTop: 8,
    borderWidth: 2,
  },
  feedbackCorrect: {
    backgroundColor: '#10B98110',
    borderColor: '#10B981',
  },
  feedbackWrong: {
    backgroundColor: '#EF444410',
    borderColor: '#EF4444',
  },
  feedbackHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  feedbackTitle: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  feedbackTitleCorrect: {
    color: '#10B981',
  },
  feedbackTitleWrong: {
    color: '#EF4444',
  },
  feedbackText: {
    fontSize: 14,
    color: COLORS.text,
    lineHeight: 20,
    marginBottom: 8,
  },
  correctAnswerText: {
    fontSize: 14,
    color: COLORS.text,
    fontWeight: '600',
    marginTop: 8,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  footer: {
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  nextButton: {
    backgroundColor: COLORS.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 16,
    borderRadius: 12,
  },
  nextButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.background,
  },
});
