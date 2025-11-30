import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

interface SafetyScoreCardProps {
  safetyScore: number;
  totalItems: number;
  presentItems: number;
}

export default function SafetyScoreCard({ 
  safetyScore, 
  totalItems, 
  presentItems 
}: SafetyScoreCardProps) {
  
  const getStatusInfo = () => {
    if (safetyScore >= 80) {
      return {
        status: 'COMPLIANT',
        color: '#28C76F',
        bgColor: 'rgba(40, 199, 111, 0.12)',
        message: 'All safety requirements met'
      };
    } else if (safetyScore >= 50) {
      return {
        status: 'PARTIAL',
        color: '#F2A900',
        bgColor: 'rgba(242, 169, 0, 0.12)',
        message: 'Some equipment missing'
      };
    } else {
      return {
        status: 'NON-COMPLIANT',
        color: '#EA5455',
        bgColor: 'rgba(234, 84, 85, 0.12)',
        message: 'Critical safety violations'
      };
    }
  };

  const statusInfo = getStatusInfo();

  return (
    <View style={styles.card}>
      <View style={styles.mainContent}>
        <View style={styles.scoreSection}>
          <Text style={styles.scoreValue}>{safetyScore.toFixed(0)}</Text>
          <Text style={styles.scoreUnit}>%</Text>
        </View>

        <View style={styles.statusSection}>
          <View style={[styles.statusBadge, { backgroundColor: statusInfo.bgColor, borderColor: statusInfo.color }]}>
            <View style={[styles.statusDot, { backgroundColor: statusInfo.color }]} />
            <Text style={[styles.statusText, { color: statusInfo.color }]}>
              {statusInfo.status}
            </Text>
          </View>
        </View>
      </View>

      <Text style={styles.scoreLabel}>Safety Score</Text>

      <View style={styles.divider} />

      <View style={styles.statsGrid}>
        <View style={styles.statBox}>
          <Text style={[styles.statValue, { color: '#28C76F' }]}>{presentItems}</Text>
          <Text style={styles.statLabel}>Present</Text>
        </View>
        <View style={styles.statSeparator} />
        <View style={styles.statBox}>
          <Text style={[styles.statValue, { color: '#EA5455' }]}>{totalItems - presentItems}</Text>
          <Text style={styles.statLabel}>Missing</Text>
        </View>
        <View style={styles.statSeparator} />
        <View style={styles.statBox}>
          <Text style={styles.statValue}>{totalItems}</Text>
          <Text style={styles.statLabel}>Total</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#141414',
    borderRadius: 16,
    padding: 22,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 5,
  },
  mainContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  scoreSection: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 6,
  },
  scoreValue: {
    fontSize: 56,
    fontWeight: '800',
    color: '#FFFFFF',
    lineHeight: 60,
    letterSpacing: -1.5,
  },
  scoreUnit: {
    fontSize: 22,
    fontWeight: '700',
    color: 'rgba(255, 255, 255, 0.6)',
  },
  scoreLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: 'rgba(255, 255, 255, 0.5)',
    letterSpacing: 0.5,
    marginBottom: 20,
  },
  statusSection: {
    alignItems: 'flex-end',
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 10,
    borderWidth: 1,
    gap: 6,
  },
  statusDot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
  },
  statusText: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
  },
  divider: {
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    marginBottom: 20,
  },
  statsGrid: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statBox: {
    flex: 1,
    alignItems: 'center',
    gap: 6,
  },
  statValue: {
    fontSize: 28,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: -0.5,
  },
  statLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: 'rgba(255, 255, 255, 0.5)',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  statSeparator: {
    width: 1,
    height: 40,
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
  },
});
