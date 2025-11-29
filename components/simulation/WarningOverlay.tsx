import React, { useEffect, useRef } from 'react';
import { Animated, StyleSheet, Text, View } from 'react-native';
import useGameStore from '../../stores/gameStore';

export default function WarningOverlay() {
  const warningEvent = useGameStore((state: any) => state.warningEvent);
  const isWarningActive = useGameStore((state: any) => state.isWarningActive);
  
  const pulseAnim = useRef(new Animated.Value(0)).current;
  const flashAnim = useRef(new Animated.Value(0)).current;
  
  useEffect(() => {
    if (isWarningActive && warningEvent) {
      // Pulse animation
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 800,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 0,
            duration: 800,
            useNativeDriver: true,
          }),
        ])
      ).start();
      
      // Flash animation
      Animated.loop(
        Animated.sequence([
          Animated.timing(flashAnim, {
            toValue: 1,
            duration: 500,
            useNativeDriver: true,
          }),
          Animated.timing(flashAnim, {
            toValue: 0,
            duration: 500,
            useNativeDriver: true,
          }),
        ])
      ).start();
    } else {
      pulseAnim.setValue(0);
      flashAnim.setValue(0);
    }
  }, [isWarningActive, warningEvent]);
  
  if (!isWarningActive || !warningEvent) {
    return null;
  }
  
  const eventEmojis: Record<string, string> = {
    smoke: '💨',
    fire: '🔥',
    blockage: '🚧',
    gas: '☠️',
  };
  
  return (
    <>
      {/* Red flashing overlay */}
      <Animated.View
        style={[
          styles.flashOverlay,
          {
            opacity: flashAnim.interpolate({
              inputRange: [0, 1],
              outputRange: [0, 0.3],
            }),
          },
        ]}
        pointerEvents="none"
      />
      
      {/* Warning banner */}
      <Animated.View
        style={[
          styles.warningBanner,
          {
            transform: [
              {
                scale: pulseAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [1, 1.05],
                }),
              },
            ],
          },
        ]}
      >
        <View style={styles.warningContent}>
          <Animated.Text
            style={[
              styles.warningEmoji,
              {
                transform: [
                  {
                    rotate: pulseAnim.interpolate({
                      inputRange: [0, 0.5, 1],
                      outputRange: ['0deg', '-15deg', '15deg'],
                    }),
                  },
                ],
              },
            ]}
          >
            {eventEmojis[warningEvent.type] || '⚠️'}
          </Animated.Text>
          
          <View style={styles.warningTextContainer}>
            <Text style={styles.warningTitle}>⚠️ WARNING AHEAD</Text>
            <Text style={styles.warningMessage}>
              {warningEvent.title} approaching!
            </Text>
          </View>
          
          <Animated.View
            style={[
              styles.warningPulse,
              {
                opacity: pulseAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [1, 0],
                }),
                transform: [
                  {
                    scale: pulseAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: [1, 2],
                    }),
                  },
                ],
              },
            ]}
          />
        </View>
      </Animated.View>
      
      {/* Corner alerts */}
      <View style={styles.cornerAlerts}>
        <Animated.View
          style={[
            styles.cornerAlert,
            styles.cornerAlertTopLeft,
            {
              opacity: flashAnim,
            },
          ]}
        />
        <Animated.View
          style={[
            styles.cornerAlert,
            styles.cornerAlertTopRight,
            {
              opacity: flashAnim,
            },
          ]}
        />
        <Animated.View
          style={[
            styles.cornerAlert,
            styles.cornerAlertBottomLeft,
            {
              opacity: flashAnim,
            },
          ]}
        />
        <Animated.View
          style={[
            styles.cornerAlert,
            styles.cornerAlertBottomRight,
            {
              opacity: flashAnim,
            },
          ]}
        />
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  flashOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#EF4444',
    zIndex: 25,
  },
  warningBanner: {
    position: 'absolute',
    top: 80,
    left: 16,
    right: 16,
    zIndex: 26,
    backgroundColor: 'rgba(220, 38, 38, 0.95)',
    borderRadius: 16,
    borderWidth: 3,
    borderColor: '#FFFF00',
    shadowColor: '#EF4444',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.8,
    shadowRadius: 16,
    elevation: 8,
  },
  warningContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    gap: 16,
  },
  warningEmoji: {
    fontSize: 48,
  },
  warningTextContainer: {
    flex: 1,
  },
  warningTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 4,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  warningMessage: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.9)',
    fontWeight: '600',
  },
  warningPulse: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(255, 255, 0, 0.3)',
    borderRadius: 16,
  },
  cornerAlerts: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 25,
    pointerEvents: 'none',
  },
  cornerAlert: {
    position: 'absolute',
    width: 0,
    height: 0,
    borderStyle: 'solid',
  },
  cornerAlertTopLeft: {
    top: 0,
    left: 0,
    borderTopWidth: 50,
    borderRightWidth: 50,
    borderTopColor: '#FFFF00',
    borderRightColor: 'transparent',
  },
  cornerAlertTopRight: {
    top: 0,
    right: 0,
    borderTopWidth: 50,
    borderLeftWidth: 50,
    borderTopColor: '#FFFF00',
    borderLeftColor: 'transparent',
  },
  cornerAlertBottomLeft: {
    bottom: 0,
    left: 0,
    borderBottomWidth: 50,
    borderRightWidth: 50,
    borderBottomColor: '#FFFF00',
    borderRightColor: 'transparent',
  },
  cornerAlertBottomRight: {
    bottom: 0,
    right: 0,
    borderBottomWidth: 50,
    borderLeftWidth: 50,
    borderBottomColor: '#FFFF00',
    borderLeftColor: 'transparent',
  },
});
