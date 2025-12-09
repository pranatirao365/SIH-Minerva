import { ArrowLeft, BookOpen, CheckCircle, Clock, FileText, Plus, Send, Trash2, Users } from '@/components/Icons';
import { COLORS } from '@/constants/styles';
import { useFocusEffect, useRouter } from 'expo-router';
import {
    addDoc,
    collection,
    deleteDoc,
    doc,
    getDocs,
    orderBy,
    query,
    serverTimestamp,
    Timestamp,
    where
} from 'firebase/firestore';
import React, { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    Modal,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { db } from '../../config/firebase';
import { useRoleStore } from '../../hooks/useRoleStore';
import {
    generateQuiz,
    QUIZ_TOPICS
} from '../../services/quizService';
import { clearOldQuizzes } from '../../services/clearOldQuizzes';
import { QuizRequestService } from '../../services/quizRequestService';

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
  createdBy: string;
  status: 'active' | 'scheduled' | 'completed';
  responseCount?: number;
}

export default function DailyQuizManager() {
  const router = useRouter();
  const { user } = useRoleStore();
  
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  
  // Form state
  const [selectedTopic, setSelectedTopic] = useState(QUIZ_TOPICS[0]);
  const [customTopic, setCustomTopic] = useState('');
  const [difficulty, setDifficulty] = useState<'easy' | 'medium' | 'hard'>('medium');
  const [numQuestions, setNumQuestions] = useState('5');
  const [targetAudience, setTargetAudience] = useState<'miner' | 'supervisor' | 'all'>('miner');
  const [language, setLanguage] = useState('en');
  
  // Track current request being fulfilled (parallel to VideoGenerationModule)
  const [currentRequestId, setCurrentRequestId] = useState<string | null>(null);

  useEffect(() => {
    loadQuizzes();
    loadPendingRequest(); // Load any pending quiz request
  }, []);

  // Refresh quiz data when screen comes into focus to show updated response counts
  useFocusEffect(
    React.useCallback(() => {
      loadQuizzes();
    }, [])
  );

  const loadQuizzes = async () => {
    try {
      setLoading(true);
      const q = query(
        collection(db, 'dailyQuizzes'),
        orderBy('createdAt', 'desc')
      );
      const snapshot = await getDocs(q);
      
      const quizzesData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      })) as Quiz[];
      
      // Fetch response counts for each quiz
      const quizzesWithCounts = await Promise.all(
        quizzesData.map(async (quiz) => {
          try {
            const responsesQuery = query(
              collection(db, 'quizResponses'),
              where('quizId', '==', quiz.id)
            );
            const responsesSnapshot = await getDocs(responsesQuery);
            return {
              ...quiz,
              responseCount: responsesSnapshot.size,
            };
          } catch (error) {
            console.error(`Error fetching responses for quiz ${quiz.id}:`, error);
            return {
              ...quiz,
              responseCount: 0,
            };
          }
        })
      );
      
      setQuizzes(quizzesWithCounts);
    } catch (error) {
      console.error('Error loading quizzes:', error);
      Alert.alert('Error', 'Failed to load quizzes');
    } finally {
      setLoading(false);
    }
  };

  // Load pending quiz request from AsyncStorage (parallel to VideoGenerationModule)
  const loadPendingRequest = async () => {
    try {
      const pendingRequest = await AsyncStorage.getItem('pendingQuizRequest');
      if (pendingRequest) {
        const requestData = JSON.parse(pendingRequest);
        console.log('📋 Loading pending quiz request:', requestData);
        
        // Auto-fill form with request data
        setCustomTopic(requestData.topic || '');
        setLanguage(requestData.language || 'en');
        setDifficulty(requestData.difficulty || 'medium');
        setNumQuestions(String(requestData.questionsCount || 5));
        setTargetAudience(requestData.targetAudience || 'miner');
        setCurrentRequestId(requestData.requestId || null);
        
        // Clear AsyncStorage after loading
        await AsyncStorage.removeItem('pendingQuizRequest');
        
        Alert.alert(
          'Request Auto-Filled',
          `Quiz request from ${requestData.requestedByName || 'Supervisor'} has been loaded. Generate the quiz to fulfill this request.`,
          [{ text: 'OK' }]
        );
      }
    } catch (error) {
      console.error('Error loading pending quiz request:', error);
    }
  };

  const handleGenerateQuiz = async () => {
    const topic = customTopic.trim() || selectedTopic;
    const questionsNum = parseInt(numQuestions);
    
    if (!topic) {
      Alert.alert('Error', 'Please select or enter a topic');
      return;
    }
    
    if (isNaN(questionsNum) || questionsNum < 3 || questionsNum > 20) {
      Alert.alert('Error', 'Please enter a valid number of questions (3-20)');
      return;
    }

    try {
      setGenerating(true);
      setShowCreateModal(false);

      // Generate quiz using Gemini AI
      const generatedQuiz = await generateQuiz({
        topic,
        difficulty,
        numQuestions: questionsNum,
        language,
        targetAudience,
      });

      // Save to Firestore
      const quizDocRef = await addDoc(collection(db, 'dailyQuizzes'), {
        title: generatedQuiz.title,
        description: generatedQuiz.description,
        topic: generatedQuiz.topic,
        difficulty: generatedQuiz.difficulty,
        targetAudience: generatedQuiz.targetAudience,
        language: generatedQuiz.language,
        questions: generatedQuiz.questions,
        questionsCount: generatedQuiz.questions.length,
        createdAt: serverTimestamp(),
        createdBy: user.phone || user.id || 'safety_officer',
        createdByName: user.name || 'Safety Officer',
        status: 'active',
      });

      // If this quiz was generated from a request, mark request as completed
      if (currentRequestId) {
        try {
          await QuizRequestService.completeQuizRequest(currentRequestId, quizDocRef.id);
          console.log('✅ Quiz request marked as completed:', currentRequestId);
          
          // Check if paired video request is also completed for auto-assignment
          const pairedStatus = await QuizRequestService.checkPairedRequests(currentRequestId);
          if (pairedStatus.videoCompleted && pairedStatus.quizCompleted && pairedStatus.minerIds) {
            // Both video and quiz are complete - auto-assign to miners
            await QuizRequestService.autoAssignQuizToMiners(quizDocRef.id, pairedStatus.minerIds);
            console.log('✅ Quiz auto-assigned to miners (both video and quiz complete)');
          }
          
          setCurrentRequestId(null); // Clear request ID after completion
        } catch (error) {
          console.error('Error completing quiz request:', error);
          // Don't fail the entire operation if request completion fails
        }
      }

      Alert.alert('Success', 'Quiz generated and published successfully!');
      loadQuizzes();
      
      // Reset form
      setCustomTopic('');
      setNumQuestions('5');
      
    } catch (error) {
      console.error('Error generating quiz:', error);
      Alert.alert('Error', 'Failed to generate quiz. Please try again.');
    } finally {
      setGenerating(false);
    }
  };

  const handleDeleteQuiz = async (quizId: string) => {
    Alert.alert(
      'Delete Quiz',
      'Are you sure you want to delete this quiz? This will also remove all submitted responses.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteDoc(doc(db, 'dailyQuizzes', quizId));
              Alert.alert('Success', 'Quiz deleted successfully');
              loadQuizzes();
            } catch (error) {
              console.error('Error deleting quiz:', error);
              Alert.alert('Error', 'Failed to delete quiz');
            }
          },
        },
      ]
    );
  };

  const handleViewResponses = (quiz: Quiz) => {
    router.push({
      pathname: '/safety-officer/QuizResponses',
      params: { quizId: quiz.id, title: quiz.title },
    });
  };

  const handleClearAllQuizzes = () => {
    Alert.alert(
      '🗑️ Clear All Quizzes',
      'This will permanently delete all existing quizzes and their responses. This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear All',
          style: 'destructive',
          onPress: async () => {
            try {
              const success = await clearOldQuizzes();
              if (success) {
                Alert.alert('Success', 'All quizzes have been cleared. You can now create new ones.');
                loadQuizzes();
              } else {
                Alert.alert('Error', 'Failed to clear quizzes');
              }
            } catch (error) {
              console.error('Error clearing quizzes:', error);
              Alert.alert('Error', 'An error occurred while clearing quizzes');
            }
          },
        },
      ]
    );
  };

  const getDifficultyColor = (diff: string) => {
    switch (diff) {
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
          <View style={styles.backButtonInner}>
            <ArrowLeft size={24} color={COLORS.text} />
          </View>
        </TouchableOpacity>
        <View style={styles.headerTitleContainer}>
          <Text style={styles.headerSubtitle}>📚</Text>
          <Text style={styles.headerTitle}>Quiz Manager</Text>
        </View>
        <View style={styles.headerActions}>
          <TouchableOpacity
            onPress={handleClearAllQuizzes}
            style={styles.clearButton}
          >
            <Text style={styles.clearButtonText}>🗑️</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => setShowCreateModal(true)}
            style={styles.createButton}
          >
            <Plus size={24} color="#FFFFFF" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Loading State */}
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.primary} />
          <Text style={styles.loadingText}>Loading quizzes...</Text>
        </View>
      ) : (
        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {/* Stats */}
          <View style={styles.statsContainer}>
            <View style={[styles.statCard, { backgroundColor: '#8B5CF620' }]}>
              <View style={[styles.statIconContainer, { backgroundColor: '#8B5CF6' }]}>
                <BookOpen size={20} color="#FFFFFF" />
              </View>
              <Text style={[styles.statValue, { color: '#8B5CF6' }]}>{quizzes.length}</Text>
              <Text style={styles.statLabel}>Total Quizzes</Text>
            </View>
            <View style={[styles.statCard, { backgroundColor: '#10B98120' }]}>
              <View style={[styles.statIconContainer, { backgroundColor: '#10B981' }]}>
                <CheckCircle size={20} color="#FFFFFF" />
              </View>
              <Text style={[styles.statValue, { color: '#10B981' }]}>
                {quizzes.filter(q => q.status === 'active').length}
              </Text>
              <Text style={styles.statLabel}>Active</Text>
            </View>
            <View style={[styles.statCard, { backgroundColor: '#F59E0B20' }]}>
              <View style={[styles.statIconContainer, { backgroundColor: '#F59E0B' }]}>
                <Users size={20} color="#FFFFFF" />
              </View>
              <Text style={[styles.statValue, { color: '#F59E0B' }]}>
                {quizzes.filter(q => q.targetAudience === 'miner' || q.targetAudience === 'all').length}
              </Text>
              <Text style={styles.statLabel}>For Miners</Text>
            </View>
          </View>

          {/* Quizzes List */}
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Published Quizzes</Text>
            <View style={styles.quizCountBadge}>
              <Text style={styles.quizCountText}>{quizzes.length}</Text>
            </View>
          </View>
          
          {quizzes.length === 0 ? (
            <View style={styles.emptyState}>
              <View style={styles.emptyIconContainer}>
                <BookOpen size={64} color={COLORS.primary} />
              </View>
              <Text style={styles.emptyStateText}>No quizzes created yet</Text>
              <Text style={styles.emptyStateSubtext}>
                Tap the + button above to create your first AI-powered safety quiz
              </Text>
              <TouchableOpacity 
                style={styles.emptyStateButton}
                onPress={() => setShowCreateModal(true)}
              >
                <Plus size={20} color="#FFFFFF" />
                <Text style={styles.emptyStateButtonText}>Create Quiz</Text>
              </TouchableOpacity>
            </View>
          ) : (
            quizzes.map((quiz, index) => (
              <View key={quiz.id} style={[
                styles.quizCard,
                { 
                  borderLeftWidth: 4,
                  borderLeftColor: getDifficultyColor(quiz.difficulty || 'medium'),
                  shadowColor: '#000',
                  shadowOffset: { width: 0, height: 2 },
                  shadowOpacity: 0.1,
                  shadowRadius: 4,
                  elevation: 3,
                }
              ]}>
                {/* Status Badge */}
                {quiz.status === 'active' && (
                  <View style={styles.activeBadge}>
                    <View style={styles.activeDot} />
                    <Text style={styles.activeText}>Active</Text>
                  </View>
                )}

                <View style={[styles.quizHeader, quiz.status === 'active' && { marginTop: 28 }]}>
                  <View style={styles.quizHeaderLeft}>
                    <View style={[
                      styles.audienceIconContainer,
                      { backgroundColor: getDifficultyColor(quiz.difficulty || 'medium') + '20' }
                    ]}>
                      <Text style={styles.quizAudience}>
                        {getAudienceIcon(quiz.targetAudience || 'all')}
                      </Text>
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.quizTitle}>{quiz.title || 'Untitled Quiz'}</Text>
                      <Text style={styles.quizTopic}>📚 {quiz.topic || 'General'}</Text>
                    </View>
                  </View>
                  <View
                    style={[
                      styles.difficultyBadge,
                      { 
                        backgroundColor: getDifficultyColor(quiz.difficulty || 'medium'),
                      },
                    ]}
                  >
                    <Text style={styles.difficultyText}>
                      {(quiz.difficulty || 'medium').toUpperCase()}
                    </Text>
                  </View>
                </View>

                <Text style={styles.quizDescription} numberOfLines={2}>
                  {quiz.description || 'No description'}
                </Text>

                <View style={styles.quizMetaContainer}>
                  <View style={styles.quizMetaItem}>
                    <FileText size={14} color={COLORS.primary} />
                    <Text style={styles.quizMetaText}>
                      {quiz.questionsCount || 0} questions
                    </Text>
                  </View>
                  <View style={styles.quizMetaItem}>
                    <Text style={styles.quizMetaText}>
                      🌐 {(quiz.language || 'en').toUpperCase()}
                    </Text>
                  </View>
                  <View style={styles.quizMetaItem}>
                    <Clock size={14} color={COLORS.textMuted} />
                    <Text style={styles.quizMetaText}>
                      {quiz.createdAt && typeof quiz.createdAt.toDate === 'function'
                        ? new Date(quiz.createdAt.toDate()).toLocaleDateString('en-US', {
                            month: 'short',
                            day: 'numeric'
                          })
                        : 'Today'}
                    </Text>
                  </View>
                  <View style={[styles.quizMetaItem, styles.responseCountBadge]}>
                    <Users size={14} color={COLORS.primary} />
                    <Text style={[styles.quizMetaText, { color: COLORS.primary, fontWeight: '600' }]}>
                      {quiz.responseCount || 0} responses
                    </Text>
                  </View>
                </View>

                <View style={styles.quizActions}>
                  <TouchableOpacity
                    style={styles.viewResponsesButton}
                    onPress={() => handleViewResponses(quiz)}
                  >
                    <Users size={18} color="#FFFFFF" />
                    <Text style={styles.viewResponsesText}>View Responses</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.deleteButton}
                    onPress={() => handleDeleteQuiz(quiz.id)}
                  >
                    <Trash2 size={18} color={COLORS.destructive} />
                  </TouchableOpacity>
                </View>
              </View>
            ))
          )}
        </ScrollView>
      )}

      {/* Create Quiz Modal */}
      <Modal
        visible={showCreateModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowCreateModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <View>
                <Text style={styles.modalSubtitle}>Create New Quiz</Text>
                <Text style={styles.modalTitle}>✨ AI-Powered Quiz Generator</Text>
              </View>
              <TouchableOpacity onPress={() => setShowCreateModal(false)}>
                <View style={styles.modalCloseButton}>
                  <Text style={styles.modalClose}>✕</Text>
                </View>
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} style={styles.modalScrollContent}>
              {/* Quiz Configuration Section */}
              <View style={styles.formSection}>
                <View style={styles.formSectionHeader}>
                  <Text style={styles.formSectionTitle}>📋 Quiz Configuration</Text>
                </View>

              {/* Topic Selection */}
              <Text style={styles.inputLabel}>Select Topic</Text>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                style={styles.topicScroll}
              >
                {QUIZ_TOPICS.map((topic) => (
                  <TouchableOpacity
                    key={topic}
                    style={[
                      styles.topicChip,
                      selectedTopic === topic && styles.topicChipSelected,
                    ]}
                    onPress={() => {
                      setSelectedTopic(topic);
                      setCustomTopic('');
                    }}
                  >
                    <Text
                      style={[
                        styles.topicChipText,
                        selectedTopic === topic && styles.topicChipTextSelected,
                      ]}
                    >
                      {topic}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>

              <TextInput
                style={styles.input}
                placeholder="Or enter custom topic..."
                placeholderTextColor={COLORS.secondary}
                value={customTopic}
                onChangeText={(text) => {
                  setCustomTopic(text);
                  if (text.trim()) setSelectedTopic('');
                }}
              />

              {/* Difficulty */}
              <Text style={styles.inputLabel}>Difficulty Level</Text>
              <View style={styles.difficultyButtons}>
                {(['easy', 'medium', 'hard'] as const).map((level) => (
                  <TouchableOpacity
                    key={level}
                    style={[
                      styles.difficultyButton,
                      difficulty === level && styles.difficultyButtonSelected,
                      { borderColor: getDifficultyColor(level) },
                    ]}
                    onPress={() => setDifficulty(level)}
                  >
                    <Text
                      style={[
                        styles.difficultyButtonText,
                        difficulty === level && {
                          color: getDifficultyColor(level),
                          fontWeight: 'bold',
                        },
                      ]}
                    >
                      {level.charAt(0).toUpperCase() + level.slice(1)}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              {/* Target Audience */}
              <Text style={styles.inputLabel}>Target Audience</Text>
              <View style={styles.audienceButtons}>
                {(['all', 'miner', 'supervisor'] as const).map((audience) => (
                  <TouchableOpacity
                    key={audience}
                    style={[
                      styles.audienceButton,
                      targetAudience === audience && styles.audienceButtonSelected,
                    ]}
                    onPress={() => setTargetAudience(audience)}
                  >
                    <Text style={styles.audienceButtonIcon}>
                      {getAudienceIcon(audience)}
                    </Text>
                    <Text
                      style={[
                        styles.audienceButtonText,
                        targetAudience === audience && styles.audienceButtonTextSelected,
                      ]}
                    >
                      {audience.charAt(0).toUpperCase() + audience.slice(1)}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              {/* Number of Questions */}
              <Text style={styles.inputLabel}>Number of Questions (3-20)</Text>
              <TextInput
                style={styles.input}
                placeholder="5"
                placeholderTextColor={COLORS.textMuted}
                keyboardType="number-pad"
                value={numQuestions}
                onChangeText={setNumQuestions}
              />

              {/* Language */}
              <Text style={styles.inputLabel}>Language</Text>
              <View style={styles.languageButtons}>
                {[
                  { code: 'en', name: 'English' },
                  { code: 'hi', name: 'हिंदी' },
                  { code: 'te', name: 'తెలుగు' },
                ].map((lang) => (
                  <TouchableOpacity
                    key={lang.code}
                    style={[
                      styles.languageButton,
                      language === lang.code && styles.languageButtonSelected,
                    ]}
                    onPress={() => setLanguage(lang.code)}
                  >
                    <Text
                      style={[
                        styles.languageButtonText,
                        language === lang.code && styles.languageButtonTextSelected,
                      ]}
                    >
                      {lang.name}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              <TouchableOpacity
                style={styles.generateButton}
                onPress={handleGenerateQuiz}
                disabled={generating}
              >
                {generating ? (
                  <ActivityIndicator color={COLORS.background} />
                ) : (
                  <>
                    <Send size={20} color={COLORS.background} />
                    <Text style={styles.generateButtonText}>Generate Quiz with AI</Text>
                  </>
                )}
              </TouchableOpacity>
            </View>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Generating Overlay */}
      {generating && (
        <View style={styles.generatingOverlay}>
          <View style={styles.generatingCard}>
            <ActivityIndicator size="large" color={COLORS.primary} />
            <Text style={styles.generatingText}>Generating quiz with AI...</Text>
            <Text style={styles.generatingSubtext}>This may take a few moments</Text>
          </View>
        </View>
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
    backgroundColor: COLORS.card,
  },
  backButton: {
    padding: 8,
  },
  backButtonInner: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitleContainer: {
    flex: 1,
    alignItems: 'center',
  },
  headerSubtitle: {
    fontSize: 24,
    marginBottom: 4,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.text,
  },
  headerActions: {
    flexDirection: 'row',
    gap: 8,
    alignItems: 'center',
  },
  createButton: {
    backgroundColor: COLORS.primary,
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  clearButton: {
    backgroundColor: COLORS.destructive + '30',
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: COLORS.destructive,
  },
  clearButtonText: {
    fontSize: 20,
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
    paddingHorizontal: 18,
    paddingVertical: 16,
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
    color: COLORS.secondary,
    lineHeight: 20,
  },
  statsContainer: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 20,
  },
  statCard: {
    flex: 1,
    backgroundColor: COLORS.card,
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: 'center',
  },
  statIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  statValue: {
    fontSize: 28,
    fontWeight: 'bold',
    color: COLORS.primary,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 11,
    color: COLORS.text,
    textAlign: 'center',
    opacity: 0.8,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  quizCountBadge: {
    backgroundColor: COLORS.primary + '20',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  quizCountText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: COLORS.primary,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
    paddingHorizontal: 20,
  },
  emptyIconContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: COLORS.primary + '15',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  emptyStateText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: 12,
    textAlign: 'center',
  },
  emptyStateSubtext: {
    fontSize: 14,
    color: COLORS.secondary,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 24,
  },
  emptyStateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: COLORS.primary,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
  },
  emptyStateButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  quizCard: {
    backgroundColor: COLORS.card,
    borderRadius: 16,
    padding: 18,
    marginBottom: 16,
    borderWidth: 1.5,
    borderColor: COLORS.border,
    position: 'relative',
    marginHorizontal: 0,
  },
  activeBadge: {
    position: 'absolute',
    top: 12,
    left: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#10B98120',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    zIndex: 1,
  },
  activeDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#10B981',
  },
  activeText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#10B981',
    textTransform: 'uppercase',
  },
  quizHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 14,
  },
  quizHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    flex: 1,
    gap: 12,
  },
  audienceIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  quizAudience: {
    fontSize: 24,
  },
  quizTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 4,
    lineHeight: 22,
  },
  quizTopic: {
    fontSize: 13,
    color: COLORS.text,
    fontWeight: '500',
    opacity: 0.85,
  },
  difficultyBadge: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 16,
  },
  difficultyText: {
    fontSize: 10,
    fontWeight: '700',
    textTransform: 'uppercase',
    color: '#FFFFFF',
    letterSpacing: 0.5,
  },
  quizDescription: {
    fontSize: 13,
    color: COLORS.text,
    marginBottom: 14,
    lineHeight: 20,
    opacity: 0.8,
  },
  quizMetaContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 14,
  },
  quizMetaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  responseCountBadge: {
    backgroundColor: COLORS.primary + '20',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    marginLeft: 'auto',
  },
  quizMetaText: {
    fontSize: 12,
    color: COLORS.text,
    fontWeight: '500',
    opacity: 0.75,
  },
  quizActions: {
    flexDirection: 'row',
    gap: 10,
    paddingTop: 14,
    borderTopWidth: 1,
    borderTopColor: COLORS.border + '40',
  },
  viewResponsesButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: COLORS.primary,
    paddingVertical: 12,
    borderRadius: 10,
  },
  viewResponsesText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  deleteButton: {
    width: 44,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.destructive + '20',
    borderRadius: 8,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: COLORS.card,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    padding: 24,
    maxHeight: '92%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 10,
  },
  modalScrollContent: {
    paddingBottom: 24,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 24,
  },
  modalSubtitle: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.primary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: COLORS.text,
  },
  modalCloseButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalClose: {
    fontSize: 24,
    color: COLORS.text,
    fontWeight: '600',
  },
  formSection: {
    marginBottom: 24,
  },
  formSectionHeader: {
    marginBottom: 16,
  },
  formSectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.text,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 10,
    marginTop: 16,
  },
  topicScroll: {
    marginBottom: 12,
  },
  topicChip: {
    backgroundColor: COLORS.background,
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 24,
    marginRight: 10,
    borderWidth: 1.5,
    borderColor: COLORS.border,
  },
  topicChipSelected: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  topicChipText: {
    fontSize: 13,
    color: COLORS.secondary,
    fontWeight: '500',
  },
  topicChipTextSelected: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  input: {
    backgroundColor: COLORS.background,
    borderRadius: 12,
    padding: 14,
    fontSize: 14,
    color: COLORS.text,
    borderWidth: 1.5,
    borderColor: COLORS.border,
    marginBottom: 4,
  },
  difficultyButtons: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 4,
  },
  difficultyButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 2,
    alignItems: 'center',
    backgroundColor: COLORS.background,
  },
  difficultyButtonSelected: {
    backgroundColor: COLORS.background,
  },
  difficultyButtonText: {
    fontSize: 14,
    color: COLORS.secondary,
    fontWeight: '500',
  },
  audienceButtons: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 4,
  },
  audienceButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: COLORS.border,
    alignItems: 'center',
    backgroundColor: COLORS.background,
  },
  audienceButtonSelected: {
    backgroundColor: COLORS.primary + '15',
    borderColor: COLORS.primary,
  },
  audienceButtonIcon: {
    fontSize: 20,
    marginBottom: 4,
  },
  audienceButtonText: {
    fontSize: 13,
    color: COLORS.secondary,
    fontWeight: '500',
  },
  audienceButtonTextSelected: {
    color: COLORS.primary,
    fontWeight: '600',
  },
  languageButtons: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 4,
  },
  languageButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: COLORS.border,
    alignItems: 'center',
    backgroundColor: COLORS.background,
  },
  languageButtonSelected: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  languageButtonText: {
    fontSize: 14,
    color: COLORS.secondary,
    fontWeight: '500',
  },
  languageButtonTextSelected: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  generateButton: {
    backgroundColor: COLORS.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    paddingVertical: 16,
    borderRadius: 14,
    marginTop: 28,
    marginBottom: 12,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  generateButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  generatingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  generatingCard: {
    backgroundColor: COLORS.card,
    padding: 32,
    borderRadius: 16,
    alignItems: 'center',
    minWidth: 250,
  },
  generatingText: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.text,
    marginTop: 16,
  },
  generatingSubtext: {
    fontSize: 14,
    color: COLORS.secondary,
    marginTop: 8,
  },
});
