import React, { useEffect, useState } from 'react';
import {
  Animated,
  Dimensions,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import useGameStore from '../../stores/gameStore';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

export default function EventModal() {
  const currentEvent = useGameStore((state: any) => state.currentEvent);
  const completeEvent = useGameStore((state: any) => state.completeEvent);
  const [timeRemaining, setTimeRemaining] = useState(0);
  const [hasRead, setHasRead] = useState(false);
  
  useEffect(() => {
    if (currentEvent) {
      setTimeRemaining(currentEvent.duration);
      setHasRead(false);
      
      const timer = setInterval(() => {
        setTimeRemaining(prev => {
          if (prev <= 1) {
            clearInterval(timer);
            setHasRead(true);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
      
      return () => clearInterval(timer);
    }
  }, [currentEvent]);
  
  if (!currentEvent) return null;
  
  const handleContinue = () => {
    completeEvent(hasRead);
  };
  
  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return '#DC2626';
      case 'high': return '#EA580C';
      case 'medium': return '#CA8A04';
      default: return '#2563EB';
    }
  };
  
  const eventEmojis: Record<string, string> = {
    smoke: '💨',
    fire: '🔥',
    blockage: '🚧',
    gas: '☠️',
  };
  
  return (
    <Modal
      visible={!!currentEvent}
      transparent
      animationType="fade"
      statusBarTranslucent
    >
      <View style={styles.overlay}>
        {/* Animated background effects */}
        <EventAnimation type={currentEvent.type} />
        
        <View style={styles.modalContainer}>
          {/* Content Card */}
          <View style={styles.contentCard}>
            {/* Header */}
            <View style={[styles.header, { backgroundColor: getSeverityColor(currentEvent.severity) }]}>
              <Text style={styles.headerEmoji}>
                {eventEmojis[currentEvent.type] || '⚠️'}
              </Text>
              
              <Text style={styles.headerTitle}>{currentEvent.title}</Text>
              
              <Text style={styles.headerDescription}>
                {currentEvent.description}
              </Text>
            </View>
            
            {/* Countdown Timer */}
            <View style={styles.timerBar}>
              <View style={styles.timerLeft}>
                <Text style={styles.timerEmoji}>⏰</Text>
                <Text style={styles.timerLabel}>Read Safety Instructions</Text>
              </View>
              
              <Text
                style={[
                  styles.timerValue,
                  timeRemaining <= 3 && styles.timerValueWarning,
                ]}
              >
                {timeRemaining}s
              </Text>
            </View>
            
            {/* Instructions */}
            <ScrollView style={styles.instructionsScroll} showsVerticalScrollIndicator={false}>
              <View style={styles.instructionsContainer}>
                <Text style={styles.instructionsTitle}>⚠️ Safety Protocol:</Text>
                
                {currentEvent.instructions.map((instruction: string, index: number) => (
                  <View key={index} style={styles.instructionItem}>
                    <View style={styles.instructionNumber}>
                      <Text style={styles.instructionNumberText}>{index + 1}</Text>
                    </View>
                    <Text style={styles.instructionText}>{instruction}</Text>
                  </View>
                ))}
              </View>
            </ScrollView>
            
            {/* Footer with Continue Button */}
            <View style={styles.footer}>
              <TouchableOpacity
                onPress={handleContinue}
                disabled={!hasRead}
                style={[
                  styles.continueButton,
                  !hasRead && styles.continueButtonDisabled,
                ]}
                activeOpacity={0.8}
              >
                <Text style={styles.continueButtonText}>
                  {hasRead ? '✓ Continue Walking' : '⏳ Reading Instructions...'}
                </Text>
              </TouchableOpacity>
              
              {!hasRead && (
                <Text style={styles.footerNote}>
                  Please read all safety instructions before continuing
                </Text>
              )}
            </View>
          </View>
        </View>
      </View>
    </Modal>
  );
}

// Event-specific animations
function EventAnimation({ type }: { type: string }) {
  const animations = Array.from({ length: type === 'smoke' || type === 'gas' ? 20 : 30 }, (_, i) => {
    const anim = new Animated.Value(0);
    
    useEffect(() => {
      Animated.loop(
        Animated.timing(anim, {
          toValue: 1,
          duration: type === 'fire' ? 1000 + Math.random() * 1000 : 3000 + Math.random() * 2000,
          useNativeDriver: true,
        })
      ).start();
    }, []);
    
    return { anim, id: i };
  });
  
  const getParticleStyle = (type: string, animation: any) => {
    const baseStyle = {
      position: 'absolute' as const,
      borderRadius: type === 'blockage' ? 0 : 100,
    };
    
    switch (type) {
      case 'smoke':
        return {
          ...baseStyle,
          width: 128,
          height: 128,
          backgroundColor: 'rgba(128, 128, 128, 0.3)',
          left: Math.random() * (SCREEN_WIDTH - 128),
          transform: [
            {
              translateY: animation.anim.interpolate({
                inputRange: [0, 1],
                outputRange: [SCREEN_HEIGHT, -128],
              }),
            },
          ],
          opacity: animation.anim.interpolate({
            inputRange: [0, 0.3, 0.7, 1],
            outputRange: [0, 0.6, 0.3, 0],
          }),
        };
      
      case 'fire':
        return {
          ...baseStyle,
          width: 64,
          height: 64,
          backgroundColor: Math.random() > 0.5 ? '#FF4400' : '#FF8800',
          left: Math.random() * (SCREEN_WIDTH - 64),
          bottom: 0,
          transform: [
            {
              translateY: animation.anim.interpolate({
                inputRange: [0, 1],
                outputRange: [0, -SCREEN_HEIGHT * 0.5],
              }),
            },
          ],
          opacity: animation.anim.interpolate({
            inputRange: [0, 0.5, 1],
            outputRange: [0.8, 1, 0],
          }),
        };
      
      case 'gas':
        return {
          ...baseStyle,
          width: 96,
          height: 96,
          backgroundColor: 'rgba(0, 255, 0, 0.3)',
          left: Math.random() * (SCREEN_WIDTH - 96),
          top: Math.random() * (SCREEN_HEIGHT - 96),
          opacity: animation.anim.interpolate({
            inputRange: [0, 0.5, 1],
            outputRange: [0, 0.4, 0],
          }),
        };
      
      default:
        return baseStyle;
    }
  };
  
  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      {animations.map((animation) => (
        <Animated.View
          key={animation.id}
          style={getParticleStyle(type, animation)}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContainer: {
    width: SCREEN_WIDTH * 0.95,
    maxWidth: 600,
    maxHeight: SCREEN_HEIGHT * 0.85,
    marginHorizontal: 16,
  },
  contentCard: {
    backgroundColor: 'rgba(20, 20, 20, 0.95)',
    borderRadius: 24,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: 'rgba(234, 179, 8, 0.3)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.5,
    shadowRadius: 16,
    elevation: 8,
  },
  header: {
    padding: 24,
  },
  headerEmoji: {
    fontSize: 48,
    marginBottom: 12,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 8,
  },
  headerDescription: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.9)',
    lineHeight: 24,
  },
  timerBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(234, 179, 8, 0.2)',
  },
  timerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  timerEmoji: {
    fontSize: 20,
  },
  timerLabel: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  timerValue: {
    fontSize: 40,
    fontWeight: 'bold',
    color: '#FFFFFF',
    fontFamily: 'monospace',
  },
  timerValueWarning: {
    color: '#FFFF00',
  },
  instructionsScroll: {
    maxHeight: 300,
  },
  instructionsContainer: {
    padding: 24,
  },
  instructionsTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#EAB308',
    marginBottom: 16,
  },
  instructionItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
    gap: 12,
  },
  instructionNumber: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#EAB308',
    alignItems: 'center',
    justifyContent: 'center',
  },
  instructionNumberText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#000000',
  },
  instructionText: {
    flex: 1,
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.9)',
    lineHeight: 24,
    paddingTop: 4,
  },
  footer: {
    padding: 24,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  continueButton: {
    backgroundColor: '#10B981',
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: '#10B981',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.5,
    shadowRadius: 8,
    elevation: 4,
  },
  continueButtonDisabled: {
    backgroundColor: '#525252',
    opacity: 0.5,
  },
  continueButtonText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  footerNote: {
    fontSize: 14,
    color: '#EAB308',
    textAlign: 'center',
    marginTop: 12,
  },
});
