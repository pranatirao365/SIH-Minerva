import { ArrowLeft, Plus, Send, Trash2, Users } from '@/components/Icons';
import { COLORS } from '@/constants/styles';
import { useRouter } from 'expo-router';
import {
    addDoc,
    collection,
    deleteDoc,
    doc,
    getDocs,
    orderBy,
    query,
    serverTimestamp,
    Timestamp
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
import { db } from '../../config/firebase';
import { useRoleStore } from '../../hooks/useRoleStore';
import {
    generateQuiz,
    QUIZ_TOPICS
} from '../../services/quizService';

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
  const [targetAudience, setTargetAudience] = useState<'miner' | 'supervisor' | 'all'>('all');
  const [language, setLanguage] = useState('en');

  useEffect(() => {
    loadQuizzes();
  }, []);

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
      
      setQuizzes(quizzesData);
    } catch (error) {
      console.error('Error loading quizzes:', error);
      Alert.alert('Error', 'Failed to load quizzes');
    } finally {
      setLoading(false);
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
      await addDoc(collection(db, 'dailyQuizzes'), {
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
          <ArrowLeft size={24} color={COLORS.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Daily Quiz Manager</Text>
        <TouchableOpacity
          onPress={() => setShowCreateModal(true)}
          style={styles.createButton}
        >
          <Plus size={24} color={COLORS.background} />
        </TouchableOpacity>
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
            <View style={styles.statCard}>
              <Text style={styles.statValue}>{quizzes.length}</Text>
              <Text style={styles.statLabel}>Total Quizzes</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statValue}>
                {quizzes.filter(q => q.status === 'active').length}
              </Text>
              <Text style={styles.statLabel}>Active</Text>
            </View>
          </View>

          {/* Quizzes List */}
          <Text style={styles.sectionTitle}>Published Quizzes</Text>
          
          {quizzes.length === 0 ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyStateText}>No quizzes yet</Text>
              <Text style={styles.emptyStateSubtext}>
                Create your first daily quiz using AI
              </Text>
            </View>
          ) : (
            quizzes.map((quiz) => (
              <View key={quiz.id} style={styles.quizCard}>
                <View style={styles.quizHeader}>
                  <View style={styles.quizHeaderLeft}>
                    <Text style={styles.quizAudience}>
                      {getAudienceIcon(quiz.targetAudience)}
                    </Text>
                    <View>
                      <Text style={styles.quizTitle}>{quiz.title}</Text>
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

                <Text style={styles.quizDescription}>{quiz.description}</Text>

                <View style={styles.quizMeta}>
                  <Text style={styles.quizMetaText}>
                    📝 {quiz.questionsCount} questions
                  </Text>
                  <Text style={styles.quizMetaText}>
                    🌐 {quiz.language.toUpperCase()}
                  </Text>
                  <Text style={styles.quizMetaText}>
                    {quiz.createdAt
                      ? new Date(quiz.createdAt.toDate()).toLocaleDateString()
                      : 'Just now'}
                  </Text>
                </View>

                <View style={styles.quizActions}>
                  <TouchableOpacity
                    style={styles.viewResponsesButton}
                    onPress={() => handleViewResponses(quiz)}
                  >
                    <Users size={18} color={COLORS.primary} />
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
              <Text style={styles.modalTitle}>Create New Quiz</Text>
              <TouchableOpacity onPress={() => setShowCreateModal(false)}>
                <Text style={styles.modalClose}>✕</Text>
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              {/* Topic Selection */}
              <Text style={styles.inputLabel}>Topic</Text>
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
                placeholderTextColor={COLORS.textSecondary}
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
                placeholderTextColor={COLORS.textSecondary}
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
  },
  backButton: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.text,
    flex: 1,
    marginLeft: 16,
  },
  createButton: {
    backgroundColor: COLORS.primary,
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
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
    gap: 12,
    marginBottom: 24,
  },
  statCard: {
    flex: 1,
    backgroundColor: COLORS.card,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  statValue: {
    fontSize: 28,
    fontWeight: 'bold',
    color: COLORS.primary,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 14,
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
    marginBottom: 8,
  },
  emptyStateSubtext: {
    fontSize: 14,
    color: COLORS.textSecondary,
  },
  quizCard: {
    backgroundColor: COLORS.card,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
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
    fontSize: 24,
  },
  quizTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: 2,
  },
  quizTopic: {
    fontSize: 14,
    color: COLORS.textSecondary,
  },
  difficultyBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  difficultyText: {
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  quizDescription: {
    fontSize: 14,
    color: COLORS.textSecondary,
    marginBottom: 12,
    lineHeight: 20,
  },
  quizMeta: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 12,
  },
  quizMetaText: {
    fontSize: 12,
    color: COLORS.textSecondary,
  },
  quizActions: {
    flexDirection: 'row',
    gap: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  viewResponsesButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: COLORS.primary + '20',
    paddingVertical: 10,
    borderRadius: 8,
  },
  viewResponsesText: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.primary,
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
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: COLORS.card,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    maxHeight: '90%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: COLORS.text,
  },
  modalClose: {
    fontSize: 28,
    color: COLORS.textSecondary,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 8,
    marginTop: 16,
  },
  topicScroll: {
    marginBottom: 12,
  },
  topicChip: {
    backgroundColor: COLORS.background,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 8,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  topicChipSelected: {
    backgroundColor: COLORS.primary + '20',
    borderColor: COLORS.primary,
  },
  topicChipText: {
    fontSize: 13,
    color: COLORS.textSecondary,
  },
  topicChipTextSelected: {
    color: COLORS.primary,
    fontWeight: '600',
  },
  input: {
    backgroundColor: COLORS.background,
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
    color: COLORS.text,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  difficultyButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  difficultyButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 2,
    alignItems: 'center',
    backgroundColor: COLORS.background,
  },
  difficultyButtonSelected: {
    backgroundColor: COLORS.background,
  },
  difficultyButtonText: {
    fontSize: 14,
    color: COLORS.textSecondary,
  },
  audienceButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  audienceButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: 'center',
    backgroundColor: COLORS.background,
  },
  audienceButtonSelected: {
    backgroundColor: COLORS.primary + '20',
    borderColor: COLORS.primary,
  },
  audienceButtonIcon: {
    fontSize: 20,
    marginBottom: 4,
  },
  audienceButtonText: {
    fontSize: 13,
    color: COLORS.textSecondary,
  },
  audienceButtonTextSelected: {
    color: COLORS.primary,
    fontWeight: '600',
  },
  languageButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  languageButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: 'center',
    backgroundColor: COLORS.background,
  },
  languageButtonSelected: {
    backgroundColor: COLORS.primary + '20',
    borderColor: COLORS.primary,
  },
  languageButtonText: {
    fontSize: 14,
    color: COLORS.textSecondary,
  },
  languageButtonTextSelected: {
    color: COLORS.primary,
    fontWeight: '600',
  },
  generateButton: {
    backgroundColor: COLORS.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 16,
    borderRadius: 12,
    marginTop: 24,
    marginBottom: 8,
  },
  generateButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.background,
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
    color: COLORS.textSecondary,
    marginTop: 8,
  },
});
