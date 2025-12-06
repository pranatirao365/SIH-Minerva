import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, ImageBackground, Dimensions } from 'react-native';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

interface BlastingBriefingProps {
  language: string;
  onComplete: () => void;
}

const BlastingBriefing: React.FC<BlastingBriefingProps> = ({ language, onComplete }) => {
  const [countdown, setCountdown] = useState(5);
  const [showSkip, setShowSkip] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setShowSkip(true);
    }, 3000);

    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (showSkip && countdown > 0) {
      const interval = setInterval(() => {
        setCountdown(prev => prev - 1);
      }, 1000);

      return () => clearInterval(interval);
    }
  }, [showSkip, countdown]);

  const handleReady = () => {
    onComplete();
  };

  const handleSkip = () => {
    onComplete();
  };

  return (
    <View style={styles.container}>
      {/* Realistic Mine Site Background */}
      <ImageBackground
        source={{ uri: 'https://images.unsplash.com/photo-1611273426858-450d8e3c9fce?w=3840&q=80&fit=crop' }}
        style={styles.background}
        resizeMode="cover"
      >
        {/* Overlay for readability */}
        <View style={styles.overlay} />
      </ImageBackground>

      {/* Main Content */}
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Phase Title */}
        <View style={styles.titleContainer}>
          <Text style={styles.title}>
            💥 {language === 'en' ? 'BLASTING SAFETY' : 'ब्लास्टिंग सुरक्षा'}
          </Text>
          <Text style={styles.subtitle}>
            {language === 'en' ? 'Mission Briefing' : 'मिशन ब्रीफिंग'}
          </Text>
        </View>

        {/* Warning Badge */}
        <View style={styles.warningBadge}>
          <Text style={styles.warningText}>
            ⚠️ {language === 'en' ? 'CONTROLLED BLAST OPERATION' : 'नियंत्रित ब्लास्ट ऑपरेशन'} ⚠️
          </Text>
        </View>

        {/* Mission Objectives Card */}
        <View style={styles.objectivesCard}>
          <Text style={styles.objectivesTitle}>
            {language === 'en' ? '📋 Your Mission Today' : '📋 आज आपका मिशन'}
          </Text>

          <View style={styles.objectivesList}>
            <View style={styles.objectiveItem}>
              <View style={styles.objectiveNumber}>
                <Text style={styles.objectiveNumberText}>1</Text>
              </View>
              <Text style={styles.objectiveText}>
                {language === 'en' ? 'Check blast perimeter' : 'ब्लास्ट परिधि जांचें'}
              </Text>
            </View>

            <View style={styles.objectiveItem}>
              <View style={styles.objectiveNumber}>
                <Text style={styles.objectiveNumberText}>2</Text>
              </View>
              <Text style={styles.objectiveText}>
                {language === 'en' ? 'Evacuate all workers' : 'सभी कर्मचारियों को निकालें'}
              </Text>
            </View>

            <View style={styles.objectiveItem}>
              <View style={styles.objectiveNumber}>
                <Text style={styles.objectiveNumberText}>3</Text>
              </View>
              <Text style={styles.objectiveText}>
                {language === 'en' ? 'Monitor blast safely' : 'विस्फोट की सुरक्षित निगरानी करें'}
              </Text>
            </View>
          </View>

          {/* Time Warning */}
          <View style={styles.timeWarning}>
            <Text style={styles.timeWarningIcon}>⚡</Text>
            <Text style={styles.timeWarningText}>
              {language === 'en' 
                ? 'You have LIMITED TIME to make decisions!' 
                : 'निर्णय लेने के लिए आपके पास सीमित समय है!'}
            </Text>
          </View>
        </View>

        {/* Start Button */}
        <TouchableOpacity
          style={styles.startButton}
          onPress={handleReady}
          activeOpacity={0.8}
        >
          <Text style={styles.startButtonText}>
            🎯 {language === 'en' ? "READY - LET'S GO!" : 'तैयार - चलें!'}
          </Text>
        </TouchableOpacity>

        {/* Skip Button */}
        {showSkip && (
          <TouchableOpacity
            style={styles.skipButton}
            onPress={handleSkip}
            activeOpacity={0.7}
          >
            <Text style={styles.skipButtonText}>
              {language === 'en' ? `Skip briefing (${countdown}s)` : `ब्रीफिंग छोड़ें (${countdown}s)`}
            </Text>
          </TouchableOpacity>
        )}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  background: {
    position: 'absolute',
    width: SCREEN_WIDTH,
    height: SCREEN_HEIGHT,
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingTop: 80,
    paddingBottom: 40,
    paddingHorizontal: 16,
    alignItems: 'center',
  },
  titleContainer: {
    alignItems: 'center',
    marginBottom: 24,
  },
  title: {
    fontSize: 32,
    fontWeight: '700',
    color: '#fff',
    textAlign: 'center',
    textShadowColor: 'rgba(0, 0, 0, 0.9)',
    textShadowOffset: { width: 0, height: 4 },
    textShadowRadius: 20,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 20,
    color: '#fde047',
    textAlign: 'center',
    textShadowColor: 'rgba(0, 0, 0, 0.8)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 10,
  },
  warningBadge: {
    backgroundColor: '#dc2626',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 9999,
    borderWidth: 3,
    borderColor: '#fff',
    marginBottom: 32,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.5,
    shadowRadius: 10,
    elevation: 8,
  },
  warningText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '700',
    textAlign: 'center',
  },
  objectivesCard: {
    backgroundColor: 'rgba(17, 24, 39, 0.98)',
    borderRadius: 16,
    padding: 32,
    marginBottom: 32,
    borderWidth: 4,
    borderColor: 'rgba(234, 179, 8, 0.8)',
    shadowColor: '#eab308',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.3,
    shadowRadius: 40,
    elevation: 10,
    maxWidth: 600,
    width: '100%',
  },
  objectivesTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: '#fff',
    textAlign: 'center',
    marginBottom: 24,
  },
  objectivesList: {
    gap: 14,
  },
  objectiveItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    backgroundColor: 'rgba(6, 182, 212, 0.2)',
    padding: 14,
    borderRadius: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#06b6d4',
  },
  objectiveNumber: {
    backgroundColor: '#06b6d4',
    width: 40,
    height: 40,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  objectiveNumberText: {
    color: '#fff',
    fontSize: 20,
    fontWeight: '700',
  },
  objectiveText: {
    flex: 1,
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  timeWarning: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: 'rgba(127, 29, 29, 0.4)',
    padding: 16,
    borderRadius: 8,
    borderLeftWidth: 6,
    borderLeftColor: '#ef4444',
    marginTop: 24,
  },
  timeWarningIcon: {
    fontSize: 24,
  },
  timeWarningText: {
    flex: 1,
    color: '#fecaca',
    fontSize: 16,
    fontWeight: '700',
  },
  startButton: {
    backgroundColor: '#3b82f6',
    paddingHorizontal: 48,
    paddingVertical: 20,
    borderRadius: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 8,
    borderWidth: 2,
    borderColor: '#fff',
  },
  startButtonText: {
    color: '#fff',
    fontSize: 20,
    fontWeight: '700',
    textAlign: 'center',
  },
  skipButton: {
    padding: 12,
  },
  skipButtonText: {
    color: 'rgba(255, 255, 255, 0.8)',
    fontSize: 14,
    textAlign: 'center',
    textDecorationLine: 'underline',
  },
});

export default BlastingBriefing;
