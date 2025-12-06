import React, { useEffect, useRef, useState } from 'react';
import { Animated, Dimensions, Image, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { BRIEFING_DATA } from '../../../data/roofInstabilityData';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

interface Phase1BriefingRoofProps {
  language: 'en' | 'hi';
  onComplete: () => void;
}

const Phase1BriefingRoof: React.FC<Phase1BriefingRoofProps> = ({ language, onComplete }) => {
  const [countdown, setCountdown] = useState(5);
  const [showSkip, setShowSkip] = useState(false);
  const [showStoryIntro, setShowStoryIntro] = useState(false);
  const [storyStep, setStoryStep] = useState(0);
  
  // Animation values
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;
  const sageScaleAnim = useRef(new Animated.Value(0.5)).current;

  // Story text content
  const storyTexts = [
    {
      en: "Welcome to the underground mine. I'm Sage, your safety guide.",
      hi: "भूमिगत खदान में आपका स्वागत है। मैं सेज हूं, आपका सुरक्षा मार्गदर्शक।"
    },
    {
      en: "Today, we're inspecting for roof fall hazards. Your safety depends on quick decisions.",
      hi: "आज, हम छत गिरने के खतरों का निरीक्षण कर रहे हैं। आपकी सुरक्षा त्वरित निर्णयों पर निर्भर करती है।"
    },
    {
      en: "Look for cracks, loose rocks, and ground instability. Stay alert!",
      hi: "दरारें, ढीली चट्टानें और जमीन की अस्थिरता देखें। सतर्क रहें!"
    }
  ];

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

  // Animated story intro sequence
  useEffect(() => {
    if (showStoryIntro) {
      // Reset animations
      fadeAnim.setValue(0);
      slideAnim.setValue(50);
      sageScaleAnim.setValue(0.5);

      // Animate sage entrance
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.spring(sageScaleAnim, {
          toValue: 1,
          tension: 50,
          friction: 7,
          useNativeDriver: true,
        }),
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 600,
          useNativeDriver: true,
        }),
      ]).start();

      // Story progression
      const progressStory = () => {
        if (storyStep < storyTexts.length - 1) {
          // Fade out
          Animated.timing(fadeAnim, {
            toValue: 0,
            duration: 300,
            useNativeDriver: true,
          }).start(() => {
            setStoryStep(prev => prev + 1);
            // Fade back in
            Animated.timing(fadeAnim, {
              toValue: 1,
              duration: 500,
              useNativeDriver: true,
            }).start();
          });
        } else {
          // Complete story, move to next phase
          setTimeout(() => {
            Animated.timing(fadeAnim, {
              toValue: 0,
              duration: 500,
              useNativeDriver: true,
            }).start(() => {
              onComplete();
            });
          }, 2000);
        }
      };

      const timer = setTimeout(progressStory, 3500);
      return () => clearTimeout(timer);
    }
  }, [showStoryIntro, storyStep]);

  const handleStartInspection = () => {
    setShowStoryIntro(true);
  };

  // Show animated story intro overlay
  if (showStoryIntro) {
    return (
      <View style={styles.container}>

        <Animated.View
          style={[
            styles.storyContainer,
            {
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }],
            },
          ]}
        >
          {/* Sage Character with Image */}
          <Animated.View
            style={[
              styles.storySageContainer,
              {
                transform: [{ scale: sageScaleAnim }],
              },
            ]}
          >
            <Image
              source={require('../../../assets/images/sage.png')}
              style={styles.sageImage}
              resizeMode="contain"
            />
          </Animated.View>

          {/* Story Text Bubble */}
          <Animated.View style={[styles.storyBubble, { opacity: fadeAnim }]}>
            <View style={styles.storyBubbleArrow} />
            <Text style={styles.storyText}>
              {storyTexts[storyStep][language]}
            </Text>
            <View style={styles.storyProgress}>
              {storyTexts.map((_, index) => (
                <View
                  key={index}
                  style={[
                    styles.progressDot,
                    index === storyStep && styles.progressDotActive,
                  ]}
                />
              ))}
            </View>
          </Animated.View>
        </Animated.View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Phase Title */}
        <View style={styles.titleContainer}>
          <Text style={styles.title}>
            🧱 {language === 'en' ? 'ROOF FALL SAFETY' : 'छत गिरने की सुरक्षा'}
          </Text>
          <Text style={styles.subtitle}>
            {language === 'en' ? 'Ground Instability Inspection' : 'जमीन अस्थिरता निरीक्षण'}
          </Text>
        </View>

        {/* Warning Badge */}
        <View style={styles.warningBadge}>
          <Text style={styles.warningText}>
            ⚠️ {language === 'en' ? 'GROUND INSPECTION REQUIRED' : 'जमीन निरीक्षण आवश्यक'} ⚠️
          </Text>
        </View>

        {/* Briefing Image Card */}
        <View style={styles.briefingImageCard}>
          <Image
            source={require('../../../assets/images/briefing.png')}
            style={styles.briefingImage}
            resizeMode="cover"
          />
        </View>

        {/* Sage Character Card */}
        <View style={styles.sageCard}>
          
          <View style={styles.sageSpeechBubble}>
            <Text style={styles.sageText}>
              {BRIEFING_DATA.sageIntro[language]}
            </Text>
          </View>
        </View>

        {/* Critical Signs to Watch Card */}
        <View style={styles.signsCard}>
          <Text style={styles.signsTitle}>
            {language === 'en' ? '🔍 Watch For These Signs:' : '🔍 इन संकेतों के लिए देखें:'}
          </Text>

          <View style={styles.signsList}>
            <View style={styles.signItem}>
              <Text style={styles.signText}>
                {language === 'en' ? 'Hairline cracks in roof & walls' : 'छत और दीवारों में बाल रेखा दरारें'}
              </Text>
            </View>

            <View style={styles.signItem}>
              <Text style={styles.signText}>
                {language === 'en' ? 'Spalling & loose rocks' : 'स्पॉलिंग और ढीली चट्टानें'}
              </Text>
            </View>

            <View style={styles.signItem}>
              <Text style={styles.signText}>
                {language === 'en' ? 'Floor heave / bulging' : 'फर्श उभार / फूलना'}
              </Text>
            </View>

            <View style={styles.signItem}>
              <Text style={styles.signText}>
                {language === 'en' ? 'Rock noise (popping, cracking)' : 'चट्टान शोर (फटना, टूटना)'}
              </Text>
            </View>

            <View style={styles.signItem}>
              <Text style={styles.signText}>
                {language === 'en' ? 'Bent/failed roof bolts' : 'झुके/टूटे छत बोल्ट'}
              </Text>
            </View>
          </View>
        </View>

        {/* Time Warning */}
        <View style={styles.timeWarning}>
          <Text style={styles.timeWarningIcon}>⚡</Text>
          <Text style={styles.timeWarningText}>
            {language === 'en'
              ? 'Ground failure can happen FAST. Every second counts!'
              : 'जमीन की विफलता तेजी से हो सकती है। हर सेकंड मायने रखता है!'}
          </Text>
        </View>

        {/* Start Button */}
        <TouchableOpacity
          style={styles.startButton}
          onPress={handleStartInspection}
          activeOpacity={0.8}
        >
          <Text style={styles.startButtonText}>
            🧱 {language === 'en' ? 'START INSPECTION' : 'निरीक्षण शुरू करें'}
          </Text>
        </TouchableOpacity>

        {/* Skip Button */}
        {showSkip && (
          <TouchableOpacity
            style={styles.skipButton}
            onPress={handleStartInspection}
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
    backgroundColor: '#000000', // Pure black
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
    marginBottom: 20,
  },
  title: {
    fontSize: 36,
    fontWeight: '700',
    color: '#FFFFFF',
    textAlign: 'center',
    letterSpacing: 1,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#FF6A00',
    textAlign: 'center',
    letterSpacing: 0.5,
    fontWeight: '500',
  },
  warningBadge: {
    backgroundColor: '#FF6A00',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 50,
    marginBottom: 24,
    shadowColor: '#FF6A00',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.6,
    shadowRadius: 12,
    elevation: 8,
  },
  warningText: {
    color: '#000000',
    fontSize: 12,
    fontWeight: '700',
    textAlign: 'center',
    letterSpacing: 0.5,
  },
  sageCard: {
    backgroundColor: '#000000',
    borderRadius: 12,
    padding: 20,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#FF6A00',
    maxWidth: 600,
    width: '100%',
  },
  briefingImageCard: {
    width: '100%',
    maxWidth: 600,
    height: 220,
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#FF6A00',
    opacity: 0.9,
  },
  briefingImage: {
    width: '100%',
    height: '100%',
  },
  sageAvatar: {
    alignItems: 'center',
    marginBottom: 12,
  },
  sageAvatarImage: {
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 2,
    borderColor: '#FF6A00',
  },
  sageSpeechBubble: {
    backgroundColor: 'rgba(255, 106, 0, 0.05)',
    padding: 16,
    borderRadius: 8,
    borderLeftWidth: 3,
    borderLeftColor: '#FF6A00',
  },
  sageText: {
    color: '#F5F5F5',
    fontSize: 15,
    lineHeight: 22,
    fontWeight: '400',
  },
  signsCard: {
    backgroundColor: '#000000',
    borderRadius: 12,
    padding: 24,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: '#FF6A00',
    maxWidth: 600,
    width: '100%',
  },
  signsTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 16,
  },
  signsList: {
    gap: 12,
  },
  signItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: 'rgba(255, 106, 0, 0.03)',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(255, 106, 0, 0.2)',
  },
  signIcon: {
    fontSize: 20,
  },
  signText: {
    flex: 1,
    color: '#F5F5F5',
    fontSize: 14,
    fontWeight: '400',
  },
  timeWarning: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: 'rgba(239, 68, 68, 0.15)', // Danger color with transparency
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#EF4444',
    marginBottom: 24,
    maxWidth: 600,
    width: '100%',
  },
  timeWarningIcon: {
    fontSize: 28,
  },
  timeWarningText: {
    flex: 1,
    color: '#FAFAFA',
    fontSize: 16,
    fontWeight: '700',
  },
  startButton: {
    backgroundColor: '#FF6A00',
    paddingHorizontal: 48,
    paddingVertical: 18,
    borderRadius: 12,
    marginBottom: 16,
    shadowColor: '#FF6A00',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.5,
    shadowRadius: 12,
    elevation: 8,
  },
  startButtonText: {
    color: '#000000',
    fontSize: 18,
    fontWeight: '700',
    letterSpacing: 0.5,
    textAlign: 'center',
  },
  skipButton: {
    padding: 12,
  },
  skipButtonText: {
    color: '#666666',
    fontSize: 13,
    textAlign: 'center',
    textDecorationLine: 'underline',
  },
  // Story Intro Styles
  storyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  storySageContainer: {
    alignItems: 'center',
    marginBottom: 50,
  },
  sageImage: {
    width: 280,
    height: 280,
    borderRadius: 140,
    borderWidth: 3,
    borderColor: '#FF6A00',
    backgroundColor: '#000000',
    shadowColor: '#FF6A00',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 40,
    elevation: 16,
  },
  storyBubble: {
    backgroundColor: '#000000',
    borderRadius: 12,
    padding: 28,
    maxWidth: 500,
    width: '100%',
    borderWidth: 1,
    borderColor: '#FF6A00',
    position: 'relative',
  },
  storyBubbleArrow: {
    position: 'absolute',
    top: -8,
    left: '50%',
    marginLeft: -8,
    width: 0,
    height: 0,
    borderLeftWidth: 8,
    borderRightWidth: 8,
    borderBottomWidth: 8,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    borderBottomColor: '#FF6A00',
  },
  storyText: {
    color: '#F5F5F5',
    fontSize: 16,
    fontWeight: '400',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 20,
  },
  storyProgress: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 12,
  },
  progressDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#333333',
    borderWidth: 1,
    borderColor: '#FF6A00',
  },
  progressDotActive: {
    backgroundColor: '#FF6A00',
    shadowColor: '#FF6A00',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 8,
    elevation: 4,
  },
});

export default Phase1BriefingRoof;
