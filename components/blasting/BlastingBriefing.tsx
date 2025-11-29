import React, { useEffect, useRef } from 'react';
import {
  Animated,
  Dimensions,
  ImageBackground,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import useBlastingGameStore, { BLASTING_PHASES } from '../../stores/blastingGameStore';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

export default function BlastingBriefing() {
  const setPhase = useBlastingGameStore((state: any) => state.setPhase);
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    // Pulse animation for warning badge
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.1,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, []);

  const handleStartMission = () => {
    setPhase(BLASTING_PHASES.PRE_BLAST);
  };

  return (
    <View style={styles.container}>
      <ImageBackground
        source={{ uri: 'https://images.unsplash.com/photo-1611273426858-450d8e3c9fce?w=1920&q=80' }}
        style={styles.background}
        resizeMode="cover"
      >
        <View style={styles.overlay} />
        
        <ScrollView 
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Title */}
          <View style={styles.titleContainer}>
            <Text style={styles.emoji}>💥</Text>
            <Text style={styles.title}>BLASTING SAFETY</Text>
            <Text style={styles.subtitle}>Mission Briefing</Text>
          </View>

          {/* Warning Badge */}
          <Animated.View style={[styles.warningBadge, { transform: [{ scale: pulseAnim }] }]}>
            <Text style={styles.warningText}>⚠️ CONTROLLED BLAST OPERATION ⚠️</Text>
          </Animated.View>

          {/* Mission Objectives Card */}
          <View style={styles.objectivesCard}>
            <Text style={styles.cardTitle}>📋 Your Mission Today</Text>
            
            <View style={styles.objectivesList}>
              <View style={styles.objectiveItem}>
                <View style={styles.objectiveNumber}>
                  <Text style={styles.objectiveNumberText}>1</Text>
                </View>
                <Text style={styles.objectiveText}>Check blast perimeter</Text>
              </View>

              <View style={styles.objectiveItem}>
                <View style={styles.objectiveNumber}>
                  <Text style={styles.objectiveNumberText}>2</Text>
                </View>
                <Text style={styles.objectiveText}>Evacuate all workers</Text>
              </View>

              <View style={styles.objectiveItem}>
                <View style={styles.objectiveNumber}>
                  <Text style={styles.objectiveNumberText}>3</Text>
                </View>
                <Text style={styles.objectiveText}>Monitor blast safely</Text>
              </View>

              <View style={styles.objectiveItem}>
                <View style={styles.objectiveNumber}>
                  <Text style={styles.objectiveNumberText}>4</Text>
                </View>
                <Text style={styles.objectiveText}>Verify post-blast safety</Text>
              </View>
            </View>

            {/* Warning Box */}
            <View style={styles.warningBox}>
              <Text style={styles.warningBoxEmoji}>⚡</Text>
              <Text style={styles.warningBoxText}>
                You have LIMITED TIME to make decisions!
              </Text>
            </View>
          </View>

          {/* Safety Protocols Card */}
          <View style={styles.protocolsCard}>
            <Text style={styles.cardTitle}>🛡️ Critical Safety Protocols</Text>
            
            <View style={styles.protocolItem}>
              <Text style={styles.protocolEmoji}>✓</Text>
              <Text style={styles.protocolText}>
                Ensure 500m safe perimeter before blast
              </Text>
            </View>

            <View style={styles.protocolItem}>
              <Text style={styles.protocolEmoji}>✓</Text>
              <Text style={styles.protocolText}>
                Sound 3 evacuation horn blasts
              </Text>
            </View>

            <View style={styles.protocolItem}>
              <Text style={styles.protocolEmoji}>✓</Text>
              <Text style={styles.protocolText}>
                Monitor seismic activity during blast
              </Text>
            </View>

            <View style={styles.protocolItem}>
              <Text style={styles.protocolEmoji}>✓</Text>
              <Text style={styles.protocolText}>
                Check flyrock containment zone
              </Text>
            </View>
          </View>

          {/* Start Button */}
          <TouchableOpacity 
            style={styles.startButton}
            onPress={handleStartMission}
            activeOpacity={0.8}
          >
            <Text style={styles.startButtonEmoji}>🎯</Text>
            <Text style={styles.startButtonText}>READY - LET'S GO!</Text>
          </TouchableOpacity>

          <View style={styles.bottomSpacer} />
        </ScrollView>
      </ImageBackground>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  background: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
  },
  scrollContent: {
    paddingTop: 60,
    paddingBottom: 40,
    paddingHorizontal: 16,
    alignItems: 'center',
  },
  titleContainer: {
    alignItems: 'center',
    marginBottom: 24,
  },
  emoji: {
    fontSize: 72,
    marginBottom: 12,
    textShadowColor: 'rgba(0, 0, 0, 0.8)',
    textShadowOffset: { width: 0, height: 4 },
    textShadowRadius: 10,
  },
  title: {
    fontFamily: 'System',
    fontWeight: 'bold',
    fontSize: 42,
    color: '#FFFFFF',
    textAlign: 'center',
    textShadowColor: 'rgba(0, 0, 0, 0.9)',
    textShadowOffset: { width: 0, height: 4 },
    textShadowRadius: 12,
    letterSpacing: 2,
  },
  subtitle: {
    fontSize: 20,
    color: '#FDE047',
    marginTop: 8,
    fontWeight: '600',
    textShadowColor: 'rgba(0, 0, 0, 0.8)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 6,
  },
  warningBadge: {
    backgroundColor: '#DC2626',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 9999,
    marginBottom: 32,
    borderWidth: 3,
    borderColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.5,
    shadowRadius: 12,
    elevation: 12,
  },
  warningText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    fontSize: 14,
    textAlign: 'center',
    letterSpacing: 0.5,
  },
  objectivesCard: {
    backgroundColor: 'rgba(17, 24, 39, 0.95)',
    borderRadius: 20,
    padding: 24,
    width: SCREEN_WIDTH - 32,
    maxWidth: 600,
    borderWidth: 4,
    borderColor: 'rgba(234, 179, 8, 0.8)',
    marginBottom: 20,
    shadowColor: '#EAB308',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 20,
  },
  cardTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 20,
    textAlign: 'center',
  },
  objectivesList: {
    marginBottom: 20,
  },
  objectiveItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(6, 182, 212, 0.15)',
    padding: 14,
    borderRadius: 12,
    marginBottom: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#06B6D4',
  },
  objectiveNumber: {
    width: 36,
    height: 36,
    borderRadius: 8,
    backgroundColor: '#06B6D4',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  objectiveNumberText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    fontSize: 18,
  },
  objectiveText: {
    flex: 1,
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  warningBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(127, 29, 29, 0.5)',
    padding: 16,
    borderRadius: 12,
    borderLeftWidth: 6,
    borderLeftColor: '#EF4444',
  },
  warningBoxEmoji: {
    fontSize: 24,
    marginRight: 12,
  },
  warningBoxText: {
    flex: 1,
    color: '#FCA5A5',
    fontSize: 16,
    fontWeight: 'bold',
  },
  protocolsCard: {
    backgroundColor: 'rgba(17, 24, 39, 0.95)',
    borderRadius: 20,
    padding: 24,
    width: SCREEN_WIDTH - 32,
    maxWidth: 600,
    borderWidth: 2,
    borderColor: 'rgba(59, 130, 246, 0.5)',
    marginBottom: 32,
  },
  protocolItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  protocolEmoji: {
    fontSize: 24,
    marginRight: 12,
    color: '#10B981',
  },
  protocolText: {
    flex: 1,
    color: '#E5E7EB',
    fontSize: 15,
    lineHeight: 22,
  },
  startButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F59E0B',
    paddingVertical: 20,
    paddingHorizontal: 48,
    borderRadius: 16,
    width: SCREEN_WIDTH - 32,
    maxWidth: 600,
    borderWidth: 4,
    borderColor: '#FFFFFF',
    shadowColor: '#F59E0B',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.5,
    shadowRadius: 16,
    elevation: 16,
  },
  startButtonEmoji: {
    fontSize: 28,
    marginRight: 12,
  },
  startButtonText: {
    color: '#FFFFFF',
    fontSize: 24,
    fontWeight: 'bold',
    letterSpacing: 1,
  },
  bottomSpacer: {
    height: 40,
  },
});
