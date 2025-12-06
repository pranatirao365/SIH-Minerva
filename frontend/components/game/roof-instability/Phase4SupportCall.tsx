import React, { useCallback } from 'react';
import {
  Dimensions,
  ImageBackground,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SUPPORT_DATA } from '../../../data/roofInstabilityData';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

interface Phase4SupportCallProps {
  language: 'en' | 'hi';
  onComplete: (data: {
    correctSupportCall: boolean;
    correctRiskLevel: boolean;
    xpEarned: number;
  }) => void;
  onXPEarned: (xp: number) => void;
}

const Phase4SupportCall: React.FC<Phase4SupportCallProps> = ({
  language,
  onComplete,
  onXPEarned,
}) => {
  const handleContinue = useCallback(() => {
    onComplete({
      correctSupportCall: true,
      correctRiskLevel: true,
      xpEarned: 0,
    });
  }, [onComplete]);

  return (
    <View style={styles.container}>
      <ImageBackground
        source={require('../../../assets/images/phase4.png')}
        style={styles.background}
        resizeMode="cover"
      >
        <View style={styles.overlay} />
      </ImageBackground>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.stepContainer}>
          <View style={styles.stepHeader}>
            <Text style={styles.stepTitle}>
              {language === 'en' ? '📞 Call Support Teams' : '📞 समर्थन टीमों को बुलाएं'}
            </Text>
            
          </View>

          <View style={styles.optionsGrid}>
            {SUPPORT_DATA.supportOptions.map(option => (
              <View
                key={option.id}
                style={[
                  styles.optionCard,
                  option.isRequired && styles.optionCardHighlighted,
                ]}
              >
                <Text style={styles.optionIcon}>{option.icon}</Text>
                <Text style={styles.optionLabel}>{option.label[language]}</Text>
                {option.isRequired && (
                  <View style={styles.requiredBadge}>
                    <Text style={styles.requiredText}>
                      {language === 'en' ? 'REQUIRED' : 'आवश्यक'}
                    </Text>
                  </View>
                )}
              </View>
            ))}
          </View>

          <TouchableOpacity
            style={styles.continueButton}
            onPress={handleContinue}
            activeOpacity={0.8}
          >
            <Text style={styles.continueButtonText}>
              {language === 'en' ? 'CONTINUE →' : 'जारी रखें →'}
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000000' },
  background: { position: 'absolute', width: SCREEN_WIDTH, height: SCREEN_HEIGHT },
  overlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0, 0, 0, 0.6)' },
  scrollView: { flex: 1 },
  scrollContent: { paddingTop: 80, paddingBottom: 40, paddingHorizontal: 16 },
  stepContainer: { marginBottom: 24 },
  stepHeader: {
    backgroundColor: '#000000',
    padding: 20,
    borderRadius: 16,
    marginBottom: 20,
    borderWidth: 2,
    borderColor: '#FF6A00',
  },
  stepTitle: { color: '#FFFFFF', fontSize: 24, fontWeight: '900', marginBottom: 8 },
  stepDescription: { color: '#D1D5DB', fontSize: 16, fontWeight: '500' },
  optionsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginBottom: 20 },
  optionCard: {
    width: '48%',
    backgroundColor: '#1C1C1E',
    padding: 20,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: '#3A3A3C',
    alignItems: 'center',
    position: 'relative',
    minHeight: 140,
    justifyContent: 'center',
  },
  optionCardHighlighted: { borderColor: '#FF6A00', borderWidth: 3 },
  optionIcon: { fontSize: 48, marginBottom: 12 },
  optionLabel: { color: '#FFFFFF', fontSize: 15, fontWeight: '700', textAlign: 'center' },
  requiredBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: '#FF6A00',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
  },
  requiredText: { color: '#FFFFFF', fontSize: 10, fontWeight: '900' },

  continueButton: {
    backgroundColor: '#3A3A3C',
    paddingVertical: 18,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 20,
  },
  continueButtonText: { color: '#FFFFFF', fontSize: 18, fontWeight: '700' },
});

export default Phase4SupportCall;
