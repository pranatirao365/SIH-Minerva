import React, { useState } from 'react';
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import useBlastingGameStore, { POST_BLAST_TASKS } from '../../stores/blastingGameStore';

export default function PostBlastVerification() {
  const postBlastTaskIndex = useBlastingGameStore((state: any) => state.postBlastTaskIndex);
  const inspectCrater = useBlastingGameStore((state: any) => state.inspectCrater);
  const verifyFlyrock = useBlastingGameStore((state: any) => state.verifyFlyrock);
  const authorizeReentry = useBlastingGameStore((state: any) => state.authorizeReentry);
  const nextPostTask = useBlastingGameStore((state: any) => state.nextPostTask);
  const flyrockDistance = useBlastingGameStore((state: any) => state.flyrockDistance);
  
  const [taskCompleted, setTaskCompleted] = useState(false);

  const currentTask = POST_BLAST_TASKS[postBlastTaskIndex];

  const handleTaskAction = () => {
    if (currentTask?.id === 'crater_inspection') {
      inspectCrater();
    } else if (currentTask?.id === 'flyrock_check') {
      verifyFlyrock();
    } else if (currentTask?.id === 'reentry_clearance') {
      authorizeReentry();
    }
    
    setTaskCompleted(true);
    setTimeout(() => {
      setTaskCompleted(false);
      nextPostTask();
    }, 2000);
  };

  if (!currentTask) {
    return null;
  }

  return (
    <View style={styles.container}>
      <View style={styles.background} />

      <View style={styles.header}>
        <Text style={styles.headerTitle}>✅ POST-BLAST VERIFICATION</Text>
        <Text style={styles.phaseText}>Safety Assessment Phase</Text>
      </View>

      <ScrollView style={styles.scrollContainer} contentContainerStyle={styles.scrollContent}>
        <View style={styles.taskCard}>
          <Text style={styles.taskTitle}>{currentTask.title}</Text>
          <Text style={styles.taskDescription}>{currentTask.description}</Text>

          {/* Crater Inspection */}
          {currentTask.id === 'crater_inspection' && (
            <View style={styles.metricsSection}>
              <View style={styles.metricRow}>
                <Text style={styles.metricLabel}>Crater Depth:</Text>
                <Text style={styles.metricValue}>{currentTask.metrics?.depth}</Text>
              </View>
              <View style={styles.metricRow}>
                <Text style={styles.metricLabel}>Fragment Quality:</Text>
                <Text style={styles.metricValue}>{currentTask.metrics?.fragmentQuality}</Text>
              </View>
              <View style={styles.metricRow}>
                <Text style={styles.metricLabel}>Within Target:</Text>
                <Text style={[styles.metricValue, styles.metricSuccess]}>
                  {currentTask.metrics?.targetRange ? '✅ Yes' : '❌ No'}
                </Text>
              </View>
            </View>
          )}

          {/* Flyrock Check */}
          {currentTask.id === 'flyrock_check' && (
            <View style={styles.flyrockSection}>
              <View style={styles.flyrockCard}>
                <Text style={styles.flyrockLabel}>Maximum Flyrock Distance</Text>
                <Text style={styles.flyrockValue}>{flyrockDistance.toFixed(0)}m</Text>
                <Text style={styles.flyrockTarget}>Target: ≤ 160m</Text>
                {flyrockDistance <= 160 && (
                  <View style={styles.successBadge}>
                    <Text style={styles.successText}>✅ WITHIN SAFE LIMITS</Text>
                  </View>
                )}
              </View>
            </View>
          )}

          {/* Re-entry Clearance */}
          {currentTask.id === 'reentry_clearance' && (
            <View style={styles.zonesSection}>
              {currentTask.zones?.map((zone: any) => (
                <View
                  key={zone.id}
                  style={[styles.zoneCard, { borderLeftColor: zone.color }]}
                >
                  <View style={[styles.zoneIndicator, { backgroundColor: zone.color }]} />
                  <Text style={styles.zoneLabel}>{zone.label}</Text>
                </View>
              ))}
            </View>
          )}

          {/* Action Button */}
          {!taskCompleted && (
            <TouchableOpacity
              style={styles.actionButton}
              onPress={handleTaskAction}
              activeOpacity={0.8}
            >
              <Text style={styles.actionButtonText}>
                {currentTask.id === 'crater_inspection' && '🔍 INSPECT CRATER'}
                {currentTask.id === 'flyrock_check' && '📏 CHECK FLYROCK ZONE'}
                {currentTask.id === 'reentry_clearance' && '✅ AUTHORIZE RE-ENTRY'}
              </Text>
            </TouchableOpacity>
          )}

          {taskCompleted && (
            <View style={styles.completedBadge}>
              <Text style={styles.completedText}>✅ Task Complete! +25 XP</Text>
            </View>
          )}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  background: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#1F2937',
  },
  header: {
    paddingTop: 60,
    paddingHorizontal: 16,
    paddingBottom: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 8,
  },
  phaseText: {
    fontSize: 16,
    color: '#10B981',
    fontWeight: '600',
  },
  scrollContainer: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
  },
  taskCard: {
    backgroundColor: 'rgba(17, 24, 39, 0.95)',
    borderRadius: 20,
    padding: 24,
    maxWidth: 600,
    alignSelf: 'center',
    width: '100%',
  },
  taskTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 12,
    textAlign: 'center',
  },
  taskDescription: {
    fontSize: 16,
    color: '#D1D5DB',
    marginBottom: 24,
    textAlign: 'center',
  },
  metricsSection: {
    backgroundColor: 'rgba(59, 130, 246, 0.1)',
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: '#3B82F6',
  },
  metricRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(75, 85, 99, 0.3)',
  },
  metricLabel: {
    fontSize: 16,
    color: '#9CA3AF',
    fontWeight: '600',
  },
  metricValue: {
    fontSize: 18,
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
  metricSuccess: {
    color: '#10B981',
  },
  flyrockSection: {
    marginBottom: 24,
  },
  flyrockCard: {
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#10B981',
  },
  flyrockLabel: {
    fontSize: 14,
    color: '#9CA3AF',
    marginBottom: 8,
  },
  flyrockValue: {
    fontSize: 48,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  flyrockTarget: {
    fontSize: 14,
    color: '#6EE7B7',
    marginBottom: 16,
  },
  successBadge: {
    backgroundColor: 'rgba(16, 185, 129, 0.9)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  successText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: 'bold',
  },
  zonesSection: {
    marginBottom: 24,
    gap: 12,
  },
  zoneCard: {
    backgroundColor: 'rgba(31, 41, 55, 0.5)',
    borderRadius: 12,
    padding: 16,
    borderLeftWidth: 6,
    flexDirection: 'row',
    alignItems: 'center',
  },
  zoneIndicator: {
    width: 24,
    height: 24,
    borderRadius: 12,
    marginRight: 12,
  },
  zoneLabel: {
    flex: 1,
    fontSize: 14,
    color: '#FFFFFF',
    fontWeight: '600',
  },
  actionButton: {
    backgroundColor: '#10B981',
    paddingVertical: 18,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 3,
    borderColor: '#FFFFFF',
  },
  actionButtonText: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: 'bold',
  },
  completedBadge: {
    backgroundColor: 'rgba(16, 185, 129, 0.2)',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#10B981',
  },
  completedText: {
    color: '#10B981',
    fontSize: 18,
    fontWeight: 'bold',
  },
});
