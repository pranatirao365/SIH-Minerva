import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { DEBRIEF_DATA } from '../../../data/blastingGameData';

interface BlastingDebriefProps {
  language: 'en' | 'hi';
  performanceData: {
    evacuationTime: number;
    anomalyDetection: number;
    workerIncidents: number;
    seismicMagnitude: number;
    flyrockDistance: number;
  };
  totalXP: number;
  onComplete: () => void;
}

const BlastingDebrief: React.FC<BlastingDebriefProps> = ({ language, performanceData, totalXP, onComplete }) => {
  const [grade, setGrade] = useState('');

  const calculateScore = (data: typeof performanceData) => {
    let score = 100;
    if (data.evacuationTime > 40) score -= 10;
    if (data.anomalyDetection < 2) score -= 15;
    if (data.workerIncidents > 0) score -= 20;
    return Math.max(0, score);
  };

  const getGrade = (score: number) => {
    if (score >= 95) return 'A+';
    if (score >= 85) return 'A';
    if (score >= 75) return 'B';
    if (score >= 65) return 'C';
    return 'D';
  };

  useEffect(() => {
    const score = calculateScore(performanceData);
    const calculatedGrade = getGrade(score);
    setGrade(calculatedGrade);
  }, [performanceData, calculateScore, getGrade]);

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Trophy */}
        <Text style={styles.trophy}>🏆</Text>

        {/* Title */}
        <View style={styles.titleContainer}>
          <Text style={styles.title}>
            {language === 'en' ? 'Mission Complete!' : 'मिशन पूर्ण!'}
          </Text>
          <Text style={styles.subtitle}>
            {language === 'en' ? 'Excellent Work Today!' : 'आज उत्कृष्ट कार्य!'}
          </Text>
        </View>

        {/* Grade Card */}
        <View style={styles.gradeCard}>
          <Text style={styles.gradeLabel}>
            {language === 'en' ? 'FINAL GRADE' : 'अंतिम ग्रेड'}
          </Text>
          <Text style={styles.gradeValue}>{grade}</Text>
          <Text style={styles.xpValue}>
            {totalXP} XP {language === 'en' ? 'EARNED' : 'अर्जित'}
          </Text>
        </View>

        {/* Achievements */}
        <View style={styles.achievementsCard}>
          <Text style={styles.achievementsTitle}>
            {language === 'en' ? '✅ What You Did Right:' : '✅ आपने क्या सही किया:'}
          </Text>

          <View style={styles.achievementsList}>
            {DEBRIEF_DATA.achievements.map((achievement) => (
              <View key={achievement.id} style={styles.achievementItem}>
                <Text style={styles.achievementIcon}>✅</Text>
                <Text style={styles.achievementText}>{achievement.label[language]}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Performance Metrics */}
        <View style={styles.metricsCard}>
          <Text style={styles.metricsTitle}>
            {language === 'en' ? '📊 Performance Metrics' : '📊 प्रदर्शन मेट्रिक्स'}
          </Text>

          <View style={styles.metricsList}>
            <View style={styles.metricItem}>
              <Text style={styles.metricLabel}>
                {language === 'en' ? 'Evacuation Time' : 'निकासी समय'}
              </Text>
              <Text style={styles.metricValue}>{performanceData.evacuationTime}s</Text>
            </View>

            <View style={styles.metricItem}>
              <Text style={styles.metricLabel}>
                {language === 'en' ? 'Worker Incidents' : 'कर्मचारी घटनाएं'}
              </Text>
              <Text style={styles.metricValue}>{performanceData.workerIncidents}</Text>
            </View>

            <View style={styles.metricItem}>
              <Text style={styles.metricLabel}>
                {language === 'en' ? 'Seismic Magnitude' : 'भूकंपीय परिमाण'}
              </Text>
              <Text style={styles.metricValue}>{performanceData.seismicMagnitude.toFixed(1)}</Text>
            </View>

            <View style={styles.metricItem}>
              <Text style={styles.metricLabel}>
                {language === 'en' ? 'Flyrock Distance' : 'फ्लाईरॉक दूरी'}
              </Text>
              <Text style={styles.metricValue}>{performanceData.flyrockDistance}m</Text>
            </View>
          </View>
        </View>

        {/* Badge */}
        <View style={styles.badgeCard}>
          <Text style={styles.badgeIcon}>🎖</Text>
          <Text style={styles.badgeText}>
            {DEBRIEF_DATA.badges[0].name[language]}
          </Text>
        </View>

        {/* Complete Button */}
        <TouchableOpacity
          style={styles.completeButton}
          onPress={onComplete}
          activeOpacity={0.8}
        >
          <Text style={styles.completeButtonText}>
            {language === 'en' ? 'RETURN TO HOME' : 'होम पर लौटें'}
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#1e1b4b' },
  scrollContent: { paddingTop: 120, paddingBottom: 40, paddingHorizontal: 20, alignItems: 'center' },
  trophy: { fontSize: 100, marginBottom: 24 },
  titleContainer: { alignItems: 'center', marginBottom: 32 },
  title: { fontSize: 36, fontWeight: '700', color: '#fff', marginBottom: 8 },
  subtitle: { fontSize: 20, color: '#fde047' },
  gradeCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 16,
    padding: 32,
    alignItems: 'center',
    marginBottom: 32,
    width: '100%',
    maxWidth: 600,
  },
  gradeLabel: { fontSize: 16, color: '#d1d5db', marginBottom: 12 },
  gradeValue: { fontSize: 80, fontWeight: '700', color: '#fde047', marginBottom: 8 },
  xpValue: { fontSize: 20, fontWeight: '700', color: '#fff' },
  achievementsCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 16,
    padding: 24,
    marginBottom: 24,
    width: '100%',
    maxWidth: 600,
  },
  achievementsTitle: { fontSize: 20, fontWeight: '700', color: '#fff', marginBottom: 16 },
  achievementsList: { gap: 12 },
  achievementItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 16,
    backgroundColor: 'rgba(34, 197, 94, 0.3)',
    borderWidth: 2,
    borderColor: '#22c55e',
    borderRadius: 8,
  },
  achievementIcon: { fontSize: 24 },
  achievementText: { flex: 1, color: '#fff', fontSize: 16, fontWeight: '600' },
  metricsCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 16,
    padding: 24,
    marginBottom: 24,
    width: '100%',
    maxWidth: 600,
  },
  metricsTitle: { fontSize: 20, fontWeight: '700', color: '#fff', marginBottom: 16 },
  metricsList: { gap: 12 },
  metricItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 12,
    backgroundColor: 'rgba(59, 130, 246, 0.2)',
    borderRadius: 8,
  },
  metricLabel: { color: '#d1d5db', fontSize: 14 },
  metricValue: { color: '#fff', fontSize: 18, fontWeight: '700' },
  badgeCard: {
    backgroundColor: 'rgba(234, 179, 8, 0.2)',
    borderWidth: 2,
    borderColor: '#eab308',
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    marginBottom: 32,
    width: '100%',
    maxWidth: 600,
  },
  badgeIcon: { fontSize: 60, marginBottom: 8 },
  badgeText: { color: '#fde047', fontSize: 18, fontWeight: '700', textAlign: 'center' },
  completeButton: {
    backgroundColor: '#3b82f6',
    paddingHorizontal: 48,
    paddingVertical: 20,
    borderRadius: 12,
    width: '100%',
    maxWidth: 400,
  },
  completeButtonText: { color: '#fff', fontSize: 20, fontWeight: '700', textAlign: 'center' },
});

export default BlastingDebrief;
