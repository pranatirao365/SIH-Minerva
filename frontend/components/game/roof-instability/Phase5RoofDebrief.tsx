import React, { useMemo } from 'react';
import {
    Dimensions,
    ImageBackground,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { DEBRIEF_DATA, IMAGE_URLS } from '../../../data/roofInstabilityData';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

interface PerformanceData {
  warningSignsDetected: number;
  totalWarningsSigns: number;
  boundaryCoveragePercent: number;
  stopWorkChosen: boolean;
  timeToStopWorkMs: number;
  correctSupportCall: boolean;
  correctRiskLevel: boolean;
}

interface Phase5RoofDebriefProps {
  language: 'en' | 'hi';
  performanceData: PerformanceData;
  totalXP: number;
  onComplete: () => void;
}

const Phase5RoofDebrief: React.FC<Phase5RoofDebriefProps> = ({
  language,
  performanceData,
  totalXP,
  onComplete,
}) => {
  const gradeData = useMemo(() => {
    let score = 0;

    // Warning detection (0-25 points)
    const detectionRate = (performanceData.warningSignsDetected / performanceData.totalWarningsSigns) * 100;
    score += (detectionRate / 100) * 25;

    // Boundary coverage (0-20 points)
    score += (performanceData.boundaryCoveragePercent / 100) * 20;

    // Stop work decision (0-25 points)
    if (performanceData.stopWorkChosen) {
      score += 25;
      // Bonus for quick decision (under 15 seconds)
      if (performanceData.timeToStopWorkMs < 15000) {
        score += 10;
      }
    }

    // Support call accuracy (0-15 points)
    if (performanceData.correctSupportCall) {
      score += 15;
    }

    // Risk classification (0-15 points)
    if (performanceData.correctRiskLevel) {
      score += 15;
    }

    // Determine grade
    let grade: 'A+' | 'A' | 'B' | 'C' | 'D' = 'D';
    if (score >= 95) grade = 'A+';
    else if (score >= 85) grade = 'A';
    else if (score >= 75) grade = 'B';
    else if (score >= 65) grade = 'C';

    const gradeInfo = DEBRIEF_DATA.grades[grade];
    const bonusXP = gradeInfo.xpBonus;

    return { grade, score: Math.round(score), bonusXP, gradeInfo };
  }, [performanceData]);

  const badges = useMemo(() => {
    const earned: typeof DEBRIEF_DATA.badges = [];

    // Early Spotter badge
    if (performanceData.warningSignsDetected >= performanceData.totalWarningsSigns) {
      earned.push(DEBRIEF_DATA.badges[0]);
    }

    // Ground Guardian badge
    if (performanceData.boundaryCoveragePercent >= 90) {
      earned.push(DEBRIEF_DATA.badges[1]);
    }

    // Zero Exposure badge
    if (performanceData.stopWorkChosen && performanceData.timeToStopWorkMs < 10000) {
      earned.push(DEBRIEF_DATA.badges[2]);
    }

    // Roof Master badge
    if (gradeData.grade === 'A+') {
      earned.push(DEBRIEF_DATA.badges[3]);
    }

    return earned;
  }, [performanceData, gradeData]);

  const getMetricColor = (metricId: string, value: number | boolean) => {
    switch (metricId) {
      case 'warning_detection':
        return value >= 5 ? '#10b981' : value >= 3 ? '#f59e0b' : '#ef4444';
      case 'boundary_coverage':
        return (value as number) >= 80 ? '#10b981' : (value as number) >= 60 ? '#f59e0b' : '#ef4444';
      case 'decision_time':
        return (value as number) <= 15 ? '#10b981' : (value as number) <= 30 ? '#f59e0b' : '#ef4444';
      case 'support_accuracy':
      case 'risk_classification':
        return value ? '#10b981' : '#ef4444';
      default:
        return '#6b7280';
    }
  };

  const getMetricValue = (metricId: string) => {
    switch (metricId) {
      case 'warning_detection':
        return `${performanceData.warningSignsDetected}/${performanceData.totalWarningsSigns}`;
      case 'boundary_coverage':
        return `${Math.round(performanceData.boundaryCoveragePercent)}%`;
      case 'decision_time':
        return `${Math.round(performanceData.timeToStopWorkMs / 1000)}s`;
      case 'support_accuracy':
        return performanceData.correctSupportCall
          ? (language === 'en' ? 'Correct' : 'सही')
          : (language === 'en' ? 'Incorrect' : 'गलत');
      case 'risk_classification':
        return performanceData.correctRiskLevel
          ? (language === 'en' ? 'Correct' : 'सही')
          : (language === 'en' ? 'Incorrect' : 'गलत');
      default:
        return '-';
    }
  };

  return (
    <View style={styles.container}>
      <ImageBackground
        source={{ uri: IMAGE_URLS.office }}
        style={styles.background}
        resizeMode="cover"
      >
        <View style={styles.overlay} />
      </ImageBackground>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>
            {language === 'en' ? '🎯 INSPECTION COMPLETE' : '🎯 निरीक्षण पूर्ण'}
          </Text>
          <Text style={styles.headerSubtitle}>
            {DEBRIEF_DATA.sageDebrief[language]}
          </Text>
        </View>

        {/* Grade Card */}
        <View style={styles.gradeCard}>
          <View style={styles.gradeCircle}>
            <Text style={styles.gradeText}>{gradeData.grade}</Text>
          </View>
          <Text style={styles.gradeLabel}>{gradeData.gradeInfo.label[language]}</Text>
          <Text style={styles.scoreText}>
            {language === 'en' ? 'Score:' : 'स्कोर:'} {gradeData.score}/100
          </Text>
        </View>

        {/* Performance Metrics */}
        <View style={styles.metricsCard}>
          <Text style={styles.metricsTitle}>
            {language === 'en' ? '📊 Performance Breakdown' : '📊 प्रदर्शन विवरण'}
          </Text>
          
          {DEBRIEF_DATA.performanceMetrics.map(metric => {
            const value = getMetricValue(metric.id);
            const numValue = metric.id === 'warning_detection' 
              ? performanceData.warningSignsDetected
              : metric.id === 'boundary_coverage'
              ? performanceData.boundaryCoveragePercent
              : metric.id === 'decision_time'
              ? performanceData.timeToStopWorkMs / 1000
              : performanceData.correctSupportCall || performanceData.correctRiskLevel;
            
            const color = getMetricColor(metric.id, numValue);

            return (
              <View key={metric.id} style={styles.metricRow}>
                <View style={styles.metricInfo}>
                  <Text style={styles.metricLabel}>{metric.label[language]}</Text>
                  <Text style={styles.metricTarget}>
                    {language === 'en' ? 'Target:' : 'लक्ष्य:'} {metric.target}{metric.unit}
                  </Text>
                </View>
                <View style={[styles.metricValue, { backgroundColor: color }]}>
                  <Text style={styles.metricValueText}>{value}</Text>
                </View>
              </View>
            );
          })}
        </View>

        {/* Badges Earned */}
        {badges.length > 0 && (
          <View style={styles.badgesCard}>
            <Text style={styles.badgesTitle}>
              {language === 'en' ? '🏆 Badges Earned' : '🏆 बैज अर्जित'}
            </Text>
            <View style={styles.badgesList}>
              {badges.map(badge => (
                <View key={badge.id} style={styles.badgeItem}>
                  <Text style={styles.badgeName}>{badge.name[language]}</Text>
                  <Text style={styles.badgeRequirement}>{badge.requirement}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* XP Summary */}
        <View style={styles.xpCard}>
          <Text style={styles.xpTitle}>
            {language === 'en' ? '⭐ Total XP Earned' : '⭐ कुल XP अर्जित'}
          </Text>
          <View style={styles.xpBreakdown}>
            <View style={styles.xpRow}>
              <Text style={styles.xpLabel}>
                {language === 'en' ? 'Phase Completion:' : 'चरण पूर्णता:'}
              </Text>
              <Text style={styles.xpValue}>{totalXP} XP</Text>
            </View>
            <View style={styles.xpRow}>
              <Text style={styles.xpLabel}>
                {language === 'en' ? 'Grade Bonus:' : 'ग्रेड बोनस:'}
              </Text>
              <Text style={styles.xpValue}>+{gradeData.bonusXP} XP</Text>
            </View>
            <View style={[styles.xpRow, styles.xpTotal]}>
              <Text style={styles.xpTotalLabel}>
                {language === 'en' ? 'TOTAL:' : 'कुल:'}
              </Text>
              <Text style={styles.xpTotalValue}>{totalXP + gradeData.bonusXP} XP</Text>
            </View>
          </View>
        </View>

        {/* Certification Message */}
        <View style={styles.certificationCard}>
          <Text style={styles.certificationText}>
            {DEBRIEF_DATA.certificationMessage[language]}
          </Text>
        </View>

        {/* Complete Button */}
        <TouchableOpacity
          style={styles.completeButton}
          onPress={onComplete}
          activeOpacity={0.8}
        >
          <Text style={styles.completeButtonText}>
            ✅ {language === 'en' ? 'FINISH' : 'समाप्त करें'}
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000000' },
  background: { position: 'absolute', width: SCREEN_WIDTH, height: SCREEN_HEIGHT },
  overlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0, 0, 0, 0.95)' },
  scrollView: { flex: 1 },
  scrollContent: { paddingTop: 80, paddingBottom: 40, paddingHorizontal: 16 },
  header: {
    alignItems: 'center',
    marginBottom: 24,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: '#FAFAFA',
    textAlign: 'center',
    marginBottom: 8,
  },
  headerSubtitle: {
    fontSize: 16,
    color: '#A1A1AA',
    textAlign: 'center',
  },
  gradeCard: {
    backgroundColor: '#000000',
    borderRadius: 16,
    padding: 32,
    alignItems: 'center',
    marginBottom: 20,
    borderWidth: 2,
    borderColor: '#FF6A00',
  },
  gradeCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#1C1C1E',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
    borderWidth: 2,
    borderColor: '#FF6A00',
  },
  gradeText: {
    fontSize: 42,
    fontWeight: '900',
    color: '#FF6A00',
  },
  gradeLabel: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 8,
  },
  scoreText: {
    fontSize: 16,
    color: '#9CA3AF',
    fontWeight: '600',
  },
  metricsCard: {
    backgroundColor: '#000000',
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    borderWidth: 2,
    borderColor: '#3A3A3C',
  },
  metricsTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 16,
  },
  metricRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#3A3A3C',
  },
  metricInfo: {
    flex: 1,
  },
  metricLabel: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 4,
  },
  metricTarget: {
    color: '#6B7280',
    fontSize: 11,
  },
  metricValue: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#3A3A3C',
    backgroundColor: '#1C1C1E',
  },
  metricValueText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
  badgesCard: {
    backgroundColor: '#000000',
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    borderWidth: 2,
    borderColor: '#FF6A00',
  },
  badgesTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 16,
  },
  badgesList: {
    gap: 12,
  },
  badgeItem: {
    backgroundColor: '#1C1C1E',
    padding: 14,
    borderRadius: 10,
    borderLeftWidth: 3,
    borderLeftColor: '#FF6A00',
  },
  badgeName: {
    color: '#FF6A00',
    fontSize: 15,
    fontWeight: '700',
    marginBottom: 4,
  },
  badgeRequirement: {
    color: '#9CA3AF',
    fontSize: 12,
  },
  xpCard: {
    backgroundColor: '#000000',
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    borderWidth: 2,
    borderColor: '#3A3A3C',
  },
  xpTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 16,
    textAlign: 'center',
  },
  xpBreakdown: {
    gap: 8,
  },
  xpRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
  },
  xpLabel: {
    color: '#9CA3AF',
    fontSize: 14,
    fontWeight: '600',
  },
  xpValue: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
  xpTotal: {
    borderTopWidth: 1,
    borderTopColor: '#3A3A3C',
    marginTop: 8,
    paddingTop: 12,
  },
  xpTotalLabel: {
    color: '#FF6A00',
    fontSize: 16,
    fontWeight: '700',
  },
  xpTotalValue: {
    color: '#FF6A00',
    fontSize: 18,
    fontWeight: '900',
  },
  certificationCard: {
    backgroundColor: '#1C1C1E',
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: '#3A3A3C',
  },
  certificationText: {
    color: '#9CA3AF',
    fontSize: 14,
    textAlign: 'center',
    fontWeight: '600',
  },
  completeButton: {
    backgroundColor: '#3A3A3C',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  completeButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '700',
  },
});

export default Phase5RoofDebrief;
