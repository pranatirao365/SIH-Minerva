import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import {
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
    ArrowLeft,
    BookOpen,
    CheckCircle
} from '../../components/Icons';
import { COLORS } from '../../constants/styles';

interface CaseStudy {
  id: string;
  title: string;
  incident: string;
  location: string;
  date: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  casualties: string;
  cause: string;
  whatWentWrong: string[];
  lessonsLearned: string[];
  preventiveMeasures: string[];
  outcome: string;
}

export default function CaseStudies() {
  const router = useRouter();
  const [selectedCategory, setSelectedCategory] = useState<'all' | 'incident' | 'success'>('all');

  const caseStudies: CaseStudy[] = [
    {
      id: '1',
      title: 'Gas Detection Saves Lives',
      incident: 'High Methane Level Alert',
      location: 'Section B, Level 3',
      date: 'November 15, 2025',
      severity: 'high',
      casualties: '0 - No injuries',
      cause: 'Ventilation system malfunction',
      whatWentWrong: [
        'Main ventilation fan motor overheated',
        'Backup system failed to activate automatically',
        'Gas levels increased rapidly in enclosed section',
      ],
      lessonsLearned: [
        'Smart helmet gas detectors provided early warning',
        'Workers evacuated within 2 minutes of alert',
        'Emergency protocols followed correctly',
        'Real-time monitoring prevented potential disaster',
      ],
      preventiveMeasures: [
        'Daily ventilation system checks implemented',
        'Backup system testing scheduled weekly',
        'Additional gas detectors installed in critical zones',
        'Emergency evacuation drills increased to monthly',
      ],
      outcome: 'Zero casualties. All workers safely evacuated. System repaired within 4 hours.',
    },
    {
      id: '2',
      title: 'PPE Compliance Success',
      incident: 'Falling Object Incident',
      location: 'Shaft A, Main Tunnel',
      date: 'October 28, 2025',
      severity: 'medium',
      casualties: '0 - Minor impact only',
      cause: 'Loose rock dislodged during drilling',
      whatWentWrong: [
        'Rock formation assessment missed weak point',
        'Support structure not installed in time',
        'Rock fell from height of approximately 8 meters',
      ],
      lessonsLearned: [
        'Hard hat absorbed impact completely',
        'Worker reported incident immediately',
        'Regular PPE inspections proved effective',
        'Safety training prepared worker for quick reaction',
      ],
      preventiveMeasures: [
        'Enhanced geological surveys before drilling',
        'Temporary support structures installed proactively',
        'PPE quality checks increased',
        'Helmet replacement cycle reduced to 6 months',
      ],
      outcome: 'Worker uninjured. Hard hat replaced. Area secured before work resumed.',
    },
    {
      id: '3',
      title: 'Heat Stress Emergency Response',
      incident: 'Worker Collapse from Heat Exhaustion',
      location: 'Deep Level Mining, Section C',
      date: 'September 12, 2025',
      severity: 'high',
      casualties: '1 - Heat exhaustion, full recovery',
      cause: 'Prolonged exposure to high temperature environment',
      whatWentWrong: [
        'Worker skipped mandatory hydration breaks',
        'Temperature in section exceeded safe limits',
        'Smart helmet vital signs alert ignored initially',
        'Cooling system maintenance was overdue',
      ],
      lessonsLearned: [
        'Smart helmet detected elevated heart rate and low SpO2',
        'Buddy system enabled quick response',
        'First aid training allowed immediate intervention',
        'Medical team reached location within 5 minutes',
      ],
      preventiveMeasures: [
        'Mandatory break enforcement through app',
        'Temperature monitoring with automatic work stoppage',
        'Cooling stations installed every 200 meters',
        'Enhanced vital signs monitoring thresholds',
      ],
      outcome: 'Worker recovered fully after 2 days rest. Return to work with restrictions.',
    },
    {
      id: '4',
      title: 'Equipment Inspection Prevents Accident',
      incident: 'Faulty Gas Detector Identified',
      location: 'Equipment Bay',
      date: 'August 5, 2025',
      severity: 'critical',
      casualties: '0 - Prevented potential disaster',
      cause: 'Sensor calibration drift not detected',
      whatWentWrong: [
        'Gas detector sensor degraded over time',
        'Calibration schedule was delayed',
        'Backup testing procedures not followed',
      ],
      lessonsLearned: [
        'Daily equipment inspection caught the issue',
        'Worker followed proper reporting protocol',
        'Cross-checking with multiple detectors revealed problem',
        'Training emphasis on equipment reliability worked',
      ],
      preventiveMeasures: [
        'Automated calibration reminders in app',
        'Monthly third-party equipment audits',
        'Redundant gas detection in all areas',
        'Equipment replacement fund increased',
      ],
      outcome: 'All gas detectors recalled for testing. 3 more faulty units found and replaced.',
    },
  ];

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'low':
        return '#10B981';
      case 'medium':
        return '#F59E0B';
      case 'high':
        return '#EF4444';
      case 'critical':
        return '#7C3AED';
      default:
        return COLORS.textMuted;
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <ArrowLeft size={24} color={COLORS.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Safety Case Studies</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Info Banner */}
        <View style={styles.infoBanner}>
          <BookOpen size={24} color={COLORS.primary} />
          <Text style={styles.infoText}>
            Learn from real incidents and success stories. Understanding what went wrong and what went right helps prevent future accidents.
          </Text>
        </View>

        {/* Case Studies */}
        {caseStudies.map((study) => (
          <View key={study.id} style={styles.caseCard}>
            <View style={styles.caseHeader}>
              <View style={styles.caseTitle}>
                <Text style={styles.caseTitleText}>{study.title}</Text>
                <View
                  style={[
                    styles.severityBadge,
                    { backgroundColor: getSeverityColor(study.severity) + '20' },
                  ]}
                >
                  <Text
                    style={[
                      styles.severityText,
                      { color: getSeverityColor(study.severity) },
                    ]}
                  >
                    {study.severity}
                  </Text>
                </View>
              </View>
            </View>

            <View style={styles.caseInfo}>
              <Text style={styles.caseLocation}>📍 {study.location}</Text>
              <Text style={styles.caseDate}>📅 {study.date}</Text>
            </View>

            <View style={styles.caseSection}>
              <Text style={styles.caseSectionTitle}>Incident</Text>
              <Text style={styles.caseSectionText}>{study.incident}</Text>
            </View>

            <View style={styles.caseSection}>
              <Text style={styles.caseSectionTitle}>Casualties</Text>
              <Text style={[styles.caseSectionText, { color: '#10B981' }]}>
                {study.casualties}
              </Text>
            </View>

            <View style={styles.caseSection}>
              <Text style={styles.caseSectionTitle}>What Went Wrong</Text>
              {study.whatWentWrong.map((point, index) => (
                <View key={index} style={styles.bulletPoint}>
                  <Text style={styles.bullet}>❌</Text>
                  <Text style={styles.bulletText}>{point}</Text>
                </View>
              ))}
            </View>

            <View style={styles.caseSection}>
              <Text style={styles.caseSectionTitle}>Lessons Learned</Text>
              {study.lessonsLearned.map((point, index) => (
                <View key={index} style={styles.bulletPoint}>
                  <Text style={styles.bullet}>✓</Text>
                  <Text style={styles.bulletText}>{point}</Text>
                </View>
              ))}
            </View>

            <View style={styles.caseSection}>
              <Text style={styles.caseSectionTitle}>Preventive Measures</Text>
              {study.preventiveMeasures.map((point, index) => (
                <View key={index} style={styles.bulletPoint}>
                  <Text style={styles.bullet}>🛡️</Text>
                  <Text style={styles.bulletText}>{point}</Text>
                </View>
              ))}
            </View>

            <View style={styles.outcomeCard}>
              <CheckCircle size={20} color="#10B981" />
              <Text style={styles.outcomeText}>{study.outcome}</Text>
            </View>
          </View>
        ))}

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
  infoBanner: {
    flexDirection: 'row',
    backgroundColor: COLORS.primary + '20',
    margin: 20,
    padding: 16,
    borderRadius: 12,
    gap: 12,
    borderWidth: 1,
    borderColor: COLORS.primary,
  },
  infoText: {
    flex: 1,
    fontSize: 14,
    color: COLORS.text,
    lineHeight: 20,
  },
  caseCard: {
    backgroundColor: COLORS.card,
    marginHorizontal: 20,
    marginBottom: 20,
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  caseHeader: {
    marginBottom: 16,
  },
  caseTitle: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  caseTitleText: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.text,
    flex: 1,
    marginRight: 12,
  },
  severityBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  severityText: {
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  caseInfo: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 16,
  },
  caseLocation: {
    fontSize: 13,
    color: COLORS.textMuted,
  },
  caseDate: {
    fontSize: 13,
    color: COLORS.textMuted,
  },
  caseSection: {
    marginBottom: 16,
  },
  caseSectionTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: 8,
  },
  caseSectionText: {
    fontSize: 14,
    color: COLORS.textMuted,
    lineHeight: 20,
  },
  bulletPoint: {
    flexDirection: 'row',
    marginBottom: 8,
    gap: 8,
  },
  bullet: {
    fontSize: 14,
  },
  bulletText: {
    flex: 1,
    fontSize: 14,
    color: COLORS.textMuted,
    lineHeight: 20,
  },
  outcomeCard: {
    flexDirection: 'row',
    backgroundColor: '#10B98120',
    padding: 12,
    borderRadius: 8,
    gap: 12,
    borderWidth: 1,
    borderColor: '#10B981',
  },
  outcomeText: {
    flex: 1,
    fontSize: 14,
    color: COLORS.text,
    lineHeight: 20,
    fontWeight: '600',
  },
});
