import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';

interface FeedbackPopupProps {
  type: 'correct' | 'incorrect';
  visible: boolean;
  message?: string;
}

export default function FeedbackPopup({ type, visible, message }: FeedbackPopupProps) {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.5)).current;
  const shakeAnim = useRef(new Animated.Value(0)).current;
  
  useEffect(() => {
    if (visible) {
      if (type === 'incorrect') {
        // Shake animation
        Animated.sequence([
          Animated.timing(shakeAnim, {
            toValue: -10,
            duration: 50,
            useNativeDriver: true,
          }),
          Animated.timing(shakeAnim, {
            toValue: 10,
            duration: 50,
            useNativeDriver: true,
          }),
          Animated.timing(shakeAnim, {
            toValue: -10,
            duration: 50,
            useNativeDriver: true,
          }),
          Animated.timing(shakeAnim, {
            toValue: 0,
            duration: 50,
            useNativeDriver: true,
          }),
        ]).start();
      }
      
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.spring(scaleAnim, {
          toValue: 1,
          friction: 6,
          tension: 40,
          useNativeDriver: true,
        }),
      ]).start(() => {
        // Auto hide after 2 seconds for educational messages
        setTimeout(() => {
          Animated.parallel([
            Animated.timing(fadeAnim, {
              toValue: 0,
              duration: 200,
              useNativeDriver: true,
            }),
            Animated.timing(scaleAnim, {
              toValue: 0.5,
              duration: 200,
              useNativeDriver: true,
            }),
          ]).start();
        }, 2000); // Increased from 1500 to show educational content
      });
    }
  }, [visible]);
  
  if (!visible) return null;
  
  const isCorrect = type === 'correct';
  
  return (
    <Animated.View
      style={[
        styles.container,
        {
          opacity: fadeAnim,
          transform: [
            { scale: scaleAnim },
            { translateX: shakeAnim },
          ],
        },
      ]}
    >
      <View style={[
        styles.popup,
        isCorrect ? styles.popupCorrect : styles.popupIncorrect
      ]}>
        <Text style={styles.emoji}>
          {isCorrect ? '✅' : '❌'}
        </Text>
        <Text style={styles.title}>
          {isCorrect ? 'Correct!' : 'Wrong Extinguisher!'}
        </Text>
        {message && (
          <Text style={styles.message}>{message}</Text>
        )}
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: '40%',
    left: 0,
    right: 0,
    alignItems: 'center',
    zIndex: 100,
  },
  popup: {
    paddingVertical: 24,
    paddingHorizontal: 32,
    borderRadius: 20,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 16,
    elevation: 10,
    borderWidth: 3,
    minWidth: 250,
    maxWidth: '90%',
  },
  popupCorrect: {
    backgroundColor: '#10B981',
    borderColor: '#34D399',
  },
  popupIncorrect: {
    backgroundColor: '#EF4444',
    borderColor: '#F87171',
  },
  emoji: {
    fontSize: 48,
    marginBottom: 8,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 4,
  },
  message: {
    fontSize: 14,
    color: '#FFFFFF',
    textAlign: 'center',
    opacity: 0.9,
    lineHeight: 20,
    paddingHorizontal: 8,
  },
});
