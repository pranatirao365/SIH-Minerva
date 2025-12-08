import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useState } from 'react';
import {
  Alert,
  Animated,
  Dimensions,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ArrowLeft, Award, CheckCircle, Play, Star } from '../../components/Icons';
import { COLORS } from '../../constants/styles';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const TRAINING_WORLDS = [
  { id: 1, name: 'Hazard Spotting', color: '#FF6B6B' },
  { id: 2, name: 'Equipment Handling', color: '#4ECDC4' },
  { id: 3, name: 'Situational Safety', color: '#FFD93D' },
  { id: 4, name: 'Emergency Response', color: '#FF5722' },
  { id: 5, name: 'Safety Mindset', color: '#9C27B0' },
];

export default function TrainingLevel() {
  const params = useLocalSearchParams();
  const router = useRouter();
  const worldId = parseInt(params.worldId as string);
  const levelNumber = parseInt(params.levelNumber as string);
  
  const world = TRAINING_WORLDS.find(w => w.id === worldId);
  const [videoWatched, setVideoWatched] = useState(false);
  const [quizCompleted, setQuizCompleted] = useState(false);
  const [earnedXP, setEarnedXP] = useState(0);

  const handleVideoComplete = () => {
    setVideoWatched(true);
    setEarnedXP(prev => prev + 50);
  };

  const handleQuizComplete = () => {
    setQuizCompleted(true);
    setEarnedXP(prev => prev + 100);
    
    // Show completion animation
    Alert.alert(
      '🎉 Level Complete!',
      `You earned ${earnedXP + 100} XP!\n\nKeep up the great work!`,
      [
        {
          text: 'Continue',
          onPress: () => router.back(),
        },
      ]
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: world?.color + '20' }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <ArrowLeft size={24} color={COLORS.text} />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.worldName}>{world?.name}</Text>
          <Text style={styles.levelTitle}>Level {levelNumber}</Text>
        </View>
        <View style={styles.xpBadge}>
          <Star size={16} color="#FFD700" />
          <Text style={styles.xpText}>{earnedXP}</Text>
        </View>
      </View>

      {/* Progress Indicator */}
      <View style={styles.progressContainer}>
        <View style={styles.progressStep}>
          <View style={[styles.stepCircle, videoWatched && styles.stepCompleted]}>
            {videoWatched ? (
              <CheckCircle size={20} color="#FFFFFF" />
            ) : (
              <Text style={styles.stepNumber}>1</Text>
            )}
          </View>
          <Text style={styles.stepLabel}>Watch Video</Text>
        </View>
        
        <View style={[styles.progressLine, videoWatched && styles.lineCompleted]} />
        
        <View style={styles.progressStep}>
          <View style={[styles.stepCircle, quizCompleted && styles.stepCompleted]}>
            {quizCompleted ? (
              <CheckCircle size={20} color="#FFFFFF" />
            ) : (
              <Text style={styles.stepNumber}>2</Text>
            )}
          </View>
          <Text style={styles.stepLabel}>Take Quiz</Text>
        </View>
      </View>

      {/* Content Area */}
      <View style={styles.content}>
        {!videoWatched ? (
          // Video Section
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Training Video</Text>
            <Text style={styles.sectionDescription}>
              Watch this safety demonstration carefully
            </Text>
            
            {/* Video Placeholder */}
            <View style={[styles.videoPlaceholder, { borderColor: world?.color }]}>
              <View style={[styles.playButton, { backgroundColor: world?.color }]}>
                <Play size={32} color="#FFFFFF" />
              </View>
              <Text style={styles.placeholderText}>Training Video</Text>
              <Text style={styles.placeholderSubtext}>
                Video content will be inserted here
              </Text>
            </View>

            <TouchableOpacity
              style={[styles.actionButton, { backgroundColor: world?.color }]}
              onPress={handleVideoComplete}
            >
              <Text style={styles.actionButtonText}>Mark as Watched</Text>
              <Text style={styles.actionButtonSubtext}>+50 XP</Text>
            </TouchableOpacity>
          </View>
        ) : !quizCompleted ? (
          // Quiz Section
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Safety Quiz</Text>
            <Text style={styles.sectionDescription}>
              Test your understanding of the safety concepts
            </Text>

            <View style={styles.quizPlaceholder}>
              <Award size={64} color={world?.color} />
              <Text style={styles.quizTitle}>Quiz Challenge</Text>
              <Text style={styles.quizDescription}>
                Interactive quiz questions will appear here
              </Text>
              <View style={styles.quizStats}>
                <View style={styles.quizStat}>
                  <Text style={styles.quizStatValue}>5</Text>
                  <Text style={styles.quizStatLabel}>Questions</Text>
                </View>
                <View style={styles.quizStat}>
                  <Text style={styles.quizStatValue}>2</Text>
                  <Text style={styles.quizStatLabel}>Minutes</Text>
                </View>
              </View>
            </View>

            <TouchableOpacity
              style={[styles.actionButton, { backgroundColor: world?.color }]}
              onPress={handleQuizComplete}
            >
              <Text style={styles.actionButtonText}>Start Quiz</Text>
              <Text style={styles.actionButtonSubtext}>+100 XP</Text>
            </TouchableOpacity>
          </View>
        ) : (
          // Completion Section
          <View style={styles.completionSection}>
            <View style={[styles.completionIcon, { backgroundColor: world?.color + '20' }]}>
              <Award size={80} color={world?.color} />
            </View>
            <Text style={styles.completionTitle}>Level Complete! 🎉</Text>
            <Text style={styles.completionText}>
              You've mastered this safety concept
            </Text>
            <View style={styles.rewardContainer}>
              <View style={styles.rewardItem}>
                <Star size={32} color="#FFD700" />
                <Text style={styles.rewardValue}>+{earnedXP} XP</Text>
              </View>
            </View>
          </View>
        )}
      </View>
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
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  backButton: {
    padding: 8,
  },
  headerCenter: {
    flex: 1,
    marginLeft: 12,
  },
  worldName: {
    fontSize: 14,
    color: COLORS.textMuted,
    fontWeight: '600',
  },
  levelTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.text,
  },
  xpBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.card,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  xpText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.text,
    marginLeft: 4,
  },
  progressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
    backgroundColor: COLORS.card,
  },
  progressStep: {
    alignItems: 'center',
  },
  stepCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.border,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  stepCompleted: {
    backgroundColor: '#4CAF50',
  },
  stepNumber: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.text,
  },
  stepLabel: {
    fontSize: 12,
    color: COLORS.textMuted,
  },
  progressLine: {
    width: 60,
    height: 3,
    backgroundColor: COLORS.border,
    marginHorizontal: 16,
  },
  lineCompleted: {
    backgroundColor: '#4CAF50',
  },
  content: {
    flex: 1,
    padding: 20,
  },
  section: {
    flex: 1,
  },
  sectionTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: 8,
  },
  sectionDescription: {
    fontSize: 16,
    color: COLORS.textMuted,
    marginBottom: 24,
  },
  videoPlaceholder: {
    aspectRatio: 16 / 9,
    backgroundColor: COLORS.card,
    borderRadius: 16,
    borderWidth: 3,
    borderStyle: 'dashed',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  playButton: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  placeholderText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: 4,
  },
  placeholderSubtext: {
    fontSize: 14,
    color: COLORS.textMuted,
  },
  quizPlaceholder: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.card,
    borderRadius: 16,
    padding: 32,
    marginBottom: 24,
  },
  quizTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: COLORS.text,
    marginTop: 16,
    marginBottom: 8,
  },
  quizDescription: {
    fontSize: 16,
    color: COLORS.textMuted,
    textAlign: 'center',
    marginBottom: 24,
  },
  quizStats: {
    flexDirection: 'row',
    gap: 32,
  },
  quizStat: {
    alignItems: 'center',
  },
  quizStatValue: {
    fontSize: 32,
    fontWeight: 'bold',
    color: COLORS.text,
  },
  quizStatLabel: {
    fontSize: 14,
    color: COLORS.textMuted,
  },
  actionButton: {
    padding: 18,
    borderRadius: 12,
    alignItems: 'center',
  },
  actionButtonText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  actionButtonSubtext: {
    fontSize: 14,
    color: '#FFFFFF',
    opacity: 0.9,
    marginTop: 4,
  },
  completionSection: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  completionIcon: {
    width: 160,
    height: 160,
    borderRadius: 80,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  completionTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: 8,
  },
  completionText: {
    fontSize: 16,
    color: COLORS.textMuted,
    marginBottom: 32,
  },
  rewardContainer: {
    flexDirection: 'row',
    gap: 24,
  },
  rewardItem: {
    alignItems: 'center',
  },
  rewardValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.text,
    marginTop: 8,
  },
});
