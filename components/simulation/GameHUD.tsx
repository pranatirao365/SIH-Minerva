import React from 'react';
import { Animated, Dimensions, StyleSheet, Text, View } from 'react-native';
import useGameStore, { GAME_EVENTS } from '../../stores/gameStore';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

export default function GameHUD() {
  const progress = useGameStore(state => state.progress);
  const totalDistance = useGameStore(state => state.totalDistance);
  const safetyScore = useGameStore(state => state.safetyScore);
  const timeElapsed = useGameStore(state => state.timeElapsed);
  const completedEvents = useGameStore(state => state.completedEvents);
  
  const progressPercent = (progress / totalDistance) * 100;
  
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };
  
  const getScoreColor = (score: number) => {
    if (score >= 80) return '#10B981';
    if (score >= 60) return '#EAB308';
    if (score >= 40) return '#F97316';
    return '#EF4444';
  };
  
  return (
    <View style={styles.container} pointerEvents="box-none">
      {/* Top Bar */}
      <View style={styles.topBar}>
        {/* Left: Distance Progress */}
        <View style={styles.distanceCard}>
          <View style={styles.distanceHeader}>
            <Text style={styles.distanceEmoji}>🚶‍♂️</Text>
            <View>
              <Text style={styles.distanceLabel}>Distance</Text>
              <Text style={styles.distanceValue}>
                {progress.toFixed(1)}m
                <Text style={styles.distanceTotal}> / {totalDistance}m</Text>
              </Text>
            </View>
          </View>
          
          {/* Progress Bar */}
          <View style={styles.progressBarContainer}>
            <Animated.View
              style={[
                styles.progressBar,
                { width: `${progressPercent}%` },
              ]}
            />
          </View>
        </View>
        
        {/* Right: Stats */}
        <View style={styles.statsRow}>
          {/* Safety Score */}
          <View style={styles.statCard}>
            <Text style={styles.statLabel}>Safety</Text>
            <Text style={[styles.statValue, { color: getScoreColor(safetyScore) }]}>
              {safetyScore}
            </Text>
            <View style={styles.scoreStars}>
              {[...Array(5)].map((_, i) => (
                <View
                  key={i}
                  style={[
                    styles.scoreStar,
                    i < Math.ceil(safetyScore / 20) && styles.scoreStarActive,
                  ]}
                />
              ))}
            </View>
          </View>
          
          {/* Time Elapsed */}
          <View style={styles.statCard}>
            <Text style={styles.statLabel}>Time</Text>
            <Text style={styles.statValue}>{formatTime(timeElapsed)}</Text>
            <Text style={styles.statSubLabel}>⏱️</Text>
          </View>
          
          {/* Events */}
          <View style={styles.statCard}>
            <Text style={styles.statLabel}>Events</Text>
            <Text style={styles.statValue}>{completedEvents.length}</Text>
            <Text style={styles.statSubLabel}>⚠️</Text>
          </View>
        </View>
      </View>
      
      {/* Mini Map */}
      <View style={styles.miniMapCard}>
        <View style={styles.miniMapHeader}>
          <Text style={styles.miniMapEmoji}>🗺️</Text>
          <Text style={styles.miniMapTitle}>Mine Tunnel Map</Text>
          <Text style={styles.miniMapProgress}>
            {progress.toFixed(0)}m / {totalDistance}m
          </Text>
        </View>
        
        <View style={styles.miniMap}>
          {/* Background grid */}
          <View style={styles.miniMapGrid} />
          
          {/* Tunnel path */}
          <View style={styles.tunnelPath} />
          <View style={[styles.tunnelPath, styles.tunnelPathProgress, { width: `${progressPercent}%` }]} />
          
          {/* Event markers */}
          {GAME_EVENTS.map((event) => {
            const eventPosition = (event.position / totalDistance) * 100;
            const isCompleted = completedEvents.includes(event.id);
            const isPassed = progress > event.position;
            const distanceToEvent = event.position - progress;
            const isNear = distanceToEvent <= 15 && distanceToEvent > 0;
            
            const eventEmojis: Record<string, string> = {
              smoke: '💨',
              fire: '🔥',
              blockage: '🚧',
              gas: '☠️',
            };
            
            return (
              <View
                key={event.id}
                style={[
                  styles.eventMarker,
                  {
                    left: `${eventPosition}%`,
                    backgroundColor: isCompleted
                      ? '#10B981'
                      : isPassed
                      ? '#525252'
                      : isNear
                      ? '#EF4444'
                      : '#EAB308',
                  },
                ]}
              >
                <Text style={styles.eventMarkerEmoji}>
                  {isCompleted ? '✅' : eventEmojis[event.type] || '⚠️'}
                </Text>
                {isNear && !isCompleted && !isPassed && (
                  <View style={styles.distanceTag}>
                    <Text style={styles.distanceTagText}>
                      {distanceToEvent.toFixed(0)}m
                    </Text>
                  </View>
                )}
              </View>
            );
          })}
          
          {/* Current position */}
          <View style={[styles.currentPosition, { left: `${progressPercent}%` }]}>
            <Text style={styles.currentPositionEmoji}>⛏️</Text>
          </View>
          
          {/* Distance markers */}
          <View style={styles.distanceMarkers}>
            {[0, 50, 100, 150, 200, 250].map((dist) => (
              <View key={dist} style={styles.distanceMarker}>
                <View style={styles.distanceMarkerLine} />
                <Text style={styles.distanceMarkerText}>{dist}m</Text>
              </View>
            ))}
          </View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    padding: 8,
    zIndex: 30,
  },
  topBar: {
    marginBottom: 8,
  },
  distanceCard: {
    backgroundColor: 'rgba(20, 20, 20, 0.9)',
    borderRadius: 16,
    padding: 12,
    borderWidth: 1,
    borderColor: 'rgba(234, 179, 8, 0.3)',
    marginBottom: 8,
  },
  distanceHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    gap: 12,
  },
  distanceEmoji: {
    fontSize: 24,
  },
  distanceLabel: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.7)',
    fontWeight: '600',
  },
  distanceValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginTop: 2,
  },
  distanceTotal: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.5)',
  },
  progressBarContainer: {
    height: 12,
    backgroundColor: 'rgba(60, 60, 60, 1)',
    borderRadius: 6,
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
    backgroundColor: '#3B82F6',
  },
  statsRow: {
    flexDirection: 'row',
    gap: 8,
  },
  statCard: {
    flex: 1,
    backgroundColor: 'rgba(20, 20, 20, 0.9)',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: 'rgba(234, 179, 8, 0.3)',
    alignItems: 'center',
  },
  statLabel: {
    fontSize: 10,
    color: 'rgba(255, 255, 255, 0.7)',
    fontWeight: '600',
    marginBottom: 4,
  },
  statValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  statSubLabel: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.5)',
  },
  scoreStars: {
    flexDirection: 'row',
    gap: 4,
  },
  scoreStar: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#525252',
  },
  scoreStarActive: {
    backgroundColor: '#EAB308',
  },
  miniMapCard: {
    backgroundColor: 'rgba(139, 92, 46, 0.95)',
    borderRadius: 16,
    padding: 16,
    borderWidth: 2,
    borderColor: 'rgba(234, 179, 8, 0.4)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.5,
    shadowRadius: 8,
    elevation: 4,
  },
  miniMapHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 8,
  },
  miniMapEmoji: {
    fontSize: 20,
  },
  miniMapTitle: {
    flex: 1,
    fontSize: 14,
    fontWeight: 'bold',
    color: 'rgba(234, 179, 8, 0.9)',
    textTransform: 'uppercase',
  },
  miniMapProgress: {
    fontSize: 12,
    fontWeight: 'bold',
    color: 'rgba(234, 179, 8, 0.6)',
    fontFamily: 'monospace',
  },
  miniMap: {
    height: 128,
    backgroundColor: 'rgba(139, 92, 46, 0.3)',
    borderRadius: 12,
    borderWidth: 2,
    borderColor: 'rgba(139, 92, 46, 0.3)',
    position: 'relative',
    overflow: 'hidden',
  },
  miniMapGrid: {
    ...StyleSheet.absoluteFillObject,
    opacity: 0.2,
  },
  tunnelPath: {
    position: 'absolute',
    top: '50%',
    left: 0,
    right: 0,
    height: 40,
    backgroundColor: 'rgba(101, 67, 33, 0.6)',
    marginTop: -20,
  },
  tunnelPathProgress: {
    backgroundColor: 'rgba(34, 197, 94, 0.4)',
  },
  eventMarker: {
    position: 'absolute',
    top: '50%',
    width: 28,
    height: 28,
    borderRadius: 14,
    marginTop: -14,
    marginLeft: -14,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#FFFFFF',
    zIndex: 10,
  },
  eventMarkerEmoji: {
    fontSize: 14,
  },
  distanceTag: {
    position: 'absolute',
    top: -28,
    backgroundColor: '#EF4444',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  distanceTagText: {
    fontSize: 9,
    fontWeight: 'bold',
    color: '#FFFFFF',
    fontFamily: 'monospace',
  },
  currentPosition: {
    position: 'absolute',
    top: '50%',
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#FFD700',
    marginTop: -20,
    marginLeft: -20,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: '#FFFFFF',
    shadowColor: '#FFD700',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 10,
    elevation: 8,
    zIndex: 20,
  },
  currentPositionEmoji: {
    fontSize: 18,
  },
  distanceMarkers: {
    position: 'absolute',
    bottom: 4,
    left: 12,
    right: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  distanceMarker: {
    alignItems: 'center',
  },
  distanceMarkerLine: {
    width: 1,
    height: 8,
    backgroundColor: 'rgba(139, 92, 46, 0.5)',
  },
  distanceMarkerText: {
    fontSize: 9,
    color: 'rgba(234, 179, 8, 0.7)',
    fontWeight: 'bold',
    fontFamily: 'monospace',
  },
});
