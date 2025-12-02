import { Audio } from 'expo-av';
import React, { useCallback, useEffect, useState } from 'react';
import {
    Animated,
    Dimensions,
    ImageBackground,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from 'react-native';
import { SCAN_DATA } from '../../../data/roofInstabilityData';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

interface WarningSign {
  id: string;
  type: string;
  x: number;
  y: number;
  width?: number;
  height?: number;
  radius?: number;
  severity: string;
  label: { en: string; hi: string };
  isCorrect: boolean;
  xpReward: number;
  detected?: boolean;
}

interface Phase2ScanRoofProps {
  language: 'en' | 'hi';
  onComplete: (data: { 
    warningSignsDetected: number; 
    falsePositives: number; 
    xpEarned: number 
  }) => void;
  onXPEarned: (xp: number) => void;
}

const Phase2ScanRoof: React.FC<Phase2ScanRoofProps> = ({ language, onComplete, onXPEarned }) => {
  const [timeRemaining, setTimeRemaining] = useState(SCAN_DATA.duration);
  const [warningSigns, setWarningSigns] = useState<WarningSign[]>(SCAN_DATA.warningSignLocations);
  const [detectedCount, setDetectedCount] = useState(0);
  const [falsePositiveCount, setFalsePositiveCount] = useState(0);
  const [audioEventIndex, setAudioEventIndex] = useState(0);
  const [currentAudioEvent, setCurrentAudioEvent] = useState<string | null>(null);
  const [xpEarned, setXpEarned] = useState(0);
  const [selectedSign, setSelectedSign] = useState<WarningSign | null>(null);
  const [sounds, setSounds] = useState<{ [key: string]: Audio.Sound }>({});
  const [isMuted, setIsMuted] = useState(false);
  const [soundsLoaded, setSoundsLoaded] = useState(false);
  
  // Animation for cracks growing
  const [crackAnimation] = useState(new Animated.Value(0));
  const [pulseAnim] = useState(new Animated.Value(1));

  useEffect(() => {
    let loadedSounds: { [key: string]: Audio.Sound } = {};

    // Setup audio
    const setupAudio = async () => {
      try {
        await Audio.setAudioModeAsync({
          playsInSilentModeIOS: true,
          staysActiveInBackground: false,
        });

        // Load sound effects
        const rockPopSound = new Audio.Sound();
        const rockFallSound = new Audio.Sound();
        const crackSound = new Audio.Sound();
        const alertSound = new Audio.Sound();

        // Using placeholder URIs - replace with actual sound files when available
        await rockPopSound.loadAsync({ uri: 'https://assets.mixkit.co/active_storage/sfx/2563/2563-preview.mp3' });
        await rockFallSound.loadAsync({ uri: 'https://assets.mixkit.co/active_storage/sfx/2566/2566-preview.mp3' });
        await crackSound.loadAsync({ uri: 'https://assets.mixkit.co/active_storage/sfx/2568/2568-preview.mp3' });
        await alertSound.loadAsync({ uri: 'https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3' });

        loadedSounds = {
          rockPop: rockPopSound,
          rockFall: rockFallSound,
          crack: crackSound,
          alert: alertSound,
        };

        setSounds(loadedSounds);
        setSoundsLoaded(true);
      } catch (error) {
        console.log('Audio setup error:', error);
      }
    };

    setupAudio();

    // Cleanup
    return () => {
      Object.values(loadedSounds).forEach(sound => {
        sound.unloadAsync().catch(() => {});
      });
    };
  }, []);

  const handlePhaseComplete = useCallback(() => {
    onComplete({
      warningSignsDetected: detectedCount,
      falsePositives: falsePositiveCount,
      xpEarned,
    });
  }, [detectedCount, falsePositiveCount, xpEarned, onComplete]);

  useEffect(() => {
    // Countdown timer
    const interval = setInterval(() => {
      setTimeRemaining(prev => {
        if (prev <= 1) {
          // Don't call handlePhaseComplete here - will cause setState during render
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  // Separate effect to handle phase completion
  useEffect(() => {
    if (timeRemaining === 0) {
      handlePhaseComplete();
    }
  }, [timeRemaining, handlePhaseComplete]);

  useEffect(() => {
    // Animate cracks growing over time
    Animated.timing(crackAnimation, {
      toValue: 1,
      duration: SCAN_DATA.duration * 1000,
      useNativeDriver: false,
    }).start();

    // Pulse animation for undetected signs
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.2,
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 800,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, []);



  const handleTapZone = useCallback(async (signId: string) => {
    const sign = warningSigns.find(s => s.id === signId);
    if (!sign || sign.detected) return;

    // Play situational sound based on sign type (3-4 seconds)
    if (!isMuted && soundsLoaded) {
      try {
        if (sign.type === 'crack' && sounds.crack) {
          await sounds.crack.replayAsync();
        } else if (sign.type === 'spalling' && sounds.rockFall) {
          await sounds.rockFall.replayAsync();
        } else if (sign.type === 'floor_heave' && sounds.rockPop) {
          await sounds.rockPop.replayAsync();
        } else if (sign.type === 'bolt_failure' && sounds.crack) {
          await sounds.crack.replayAsync();
        }
      } catch (error) {
        console.log('Sound playback error:', error);
      }
    }

    // Show info modal
    setSelectedSign(sign);
  }, [warningSigns, sounds, isMuted, soundsLoaded]);

  const handleConfirmDetection = useCallback(async () => {
    if (!selectedSign) return;

    const updatedSigns = warningSigns.map(s =>
      s.id === selectedSign.id ? { ...s, detected: true } : s
    );
    setWarningSigns(updatedSigns);

    // Play alert sound
    if (!isMuted && soundsLoaded) {
      try {
        if (sounds.alert) {
          await sounds.alert.replayAsync();
        }
      } catch (error) {
        console.log('Sound playback error:', error);
      }
    }

    if (selectedSign.isCorrect) {
      setDetectedCount(prev => prev + 1);
      setXpEarned(prev => prev + selectedSign.xpReward);
      onXPEarned(selectedSign.xpReward);
    } else {
      setFalsePositiveCount(prev => prev + 1);
      setXpEarned(prev => prev + selectedSign.xpReward); // Negative reward
      onXPEarned(selectedSign.xpReward);
    }

    setSelectedSign(null);
  }, [selectedSign, warningSigns, onXPEarned, sounds, isMuted, soundsLoaded]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getDetectionProgress = () => {
    const correctDetected = warningSigns.filter(s => s.isCorrect && s.detected).length;
    return `${correctDetected}/${SCAN_DATA.targetDetections}`;
  };

  return (
    <View style={styles.container}>
      <ImageBackground
        source={require('../../../assets/images/phase2.jpg')}
        style={styles.background}
        resizeMode="cover"
      >
        <View style={styles.overlay} />
      </ImageBackground>

      {/* Timer & Progress HUD */}
      <View style={styles.hudContainer}>
        <View style={styles.leftHud}>
          <View style={[styles.timer, timeRemaining < 10 && styles.timerUrgent]}>
            <Text style={styles.timerText}>⏱ {formatTime(timeRemaining)}</Text>
          </View>
          
          <TouchableOpacity
            style={styles.muteButton}
            onPress={() => setIsMuted(!isMuted)}
            activeOpacity={0.7}
          >
            <Text style={styles.muteIcon}>{isMuted ? '🔇' : '🔊'}</Text>
          </TouchableOpacity>
        </View>
        
        <View style={styles.detectionBadge}>
          <Text style={styles.detectionText}>
            🔍 {getDetectionProgress()}
          </Text>
        </View>
      </View>

      {/* Audio Event Alert */}
      {currentAudioEvent && (
        <View style={styles.audioAlert}>
          <Text style={styles.audioAlertText}>{currentAudioEvent}</Text>
        </View>
      )}

      {/* Interactive Tunnel Visualization */}
      <View style={styles.tunnelContainer}>
        {/* Render warning signs as suspicious markers */}
        {warningSigns.map(sign => (
          <Animated.View
            key={sign.id}
            style={[
              styles.suspiciousMarker,
              {
                left: `${sign.x}%`,
                top: `${sign.y}%`,
                transform: [{ scale: sign.detected ? 1 : pulseAnim }],
              },
              sign.detected && sign.isCorrect && styles.markerCorrect,
              sign.detected && !sign.isCorrect && styles.markerFalse,
            ]}
          >
            <TouchableOpacity
            style={styles.markerButton}
            onPress={() => handleTapZone(sign.id)}
            activeOpacity={0.7}
            disabled={sign.detected}
          >
            {!sign.detected ? (
              <View style={styles.questionMarkContainer}>
                <Text style={styles.questionMark}>?</Text>
              </View>
            ) : (
              <Text style={styles.markerIcon}>
                {sign.isCorrect ? '✅' : '❌'}
              </Text>
            )}
          </TouchableOpacity>
          </Animated.View>
        ))}

      </View>

      {/* Info Modal */}
      {selectedSign && (
        <View style={styles.infoModalOverlay}>
          <View style={styles.infoModal}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                {language === 'en' ? '🔍 Suspicious Sign' : '🔍 संदिग्ध संकेत'}
              </Text>
            </View>
            
            <View style={styles.modalContent}>
              <Text style={styles.signTypeLabel}>
                {language === 'en' ? 'Type:' : 'प्रकार:'}
              </Text>
              <Text style={styles.signTypeValue}>
                {selectedSign.type === 'crack' ? (language === 'en' ? 'Crack' : 'दरार') :
                 selectedSign.type === 'spalling' ? (language === 'en' ? 'Spalling' : 'स्पॉलिंग') :
                 selectedSign.type === 'floor_heave' ? (language === 'en' ? 'Floor Heave' : 'फर्श उभार') :
                 selectedSign.type === 'bolt_failure' ? (language === 'en' ? 'Bolt Failure' : 'बोल्ट विफलता') :
                 (language === 'en' ? 'Unknown' : 'अज्ञात')}
              </Text>

              <Text style={styles.signDescription}>
                {selectedSign.label[language]}
              </Text>

              <View style={[
                styles.severityBadge,
                selectedSign.severity === 'high' && styles.severityHigh,
                selectedSign.severity === 'medium' && styles.severityMedium,
                selectedSign.severity === 'low' && styles.severityLow,
              ]}>
                <Text style={styles.severityText}>
                  {selectedSign.severity === 'high' ? (language === 'en' ? 'HIGH RISK' : 'उच्च जोखिम') :
                   selectedSign.severity === 'medium' ? (language === 'en' ? 'MEDIUM RISK' : 'मध्यम जोखिम') :
                   (language === 'en' ? 'LOW RISK' : 'कम जोखिम')}
                </Text>
              </View>
            </View>

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={() => setSelectedSign(null)}
                activeOpacity={0.8}
              >
                <Text style={styles.cancelButtonText}>
                  {language === 'en' ? 'Cancel' : 'रद्द करें'}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.confirmButton}
                onPress={handleConfirmDetection}
                activeOpacity={0.8}
              >
                <Text style={styles.confirmButtonText}>
                  {language === 'en' ? 'Mark as Detected' : 'पता लगाया गया'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      )}

      {/* Instruction Panel */}
      <View style={styles.instructionPanel}>
        <Text style={styles.instructionTitle}>
          {language === 'en' ? '🔍 Tap to Identify Warning Signs' : '🔍 चेतावनी संकेत पहचानने के लिए टैप करें'}
        </Text>
        <Text style={styles.instructionText}>
          {language === 'en' 
            ? 'Look for cracks, spalling, floor heave, and bolt failures' 
            : 'दरारें, स्पॉलिंग, फर्श उभार, और बोल्ट विफलताओं को देखें'}
        </Text>
      </View>

      {/* Continue Button (appears when time expires or all found) */}
      {(timeRemaining === 0 || detectedCount >= SCAN_DATA.targetDetections) && (
        <TouchableOpacity
          style={styles.continueButton}
          onPress={handlePhaseComplete}
          activeOpacity={0.8}
        >
          <Text style={styles.continueButtonText}>
            ✅ {language === 'en' ? 'CONTINUE' : 'जारी रखें'}
          </Text>
        </TouchableOpacity>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000000' },
  background: { position: 'absolute', width: SCREEN_WIDTH, height: SCREEN_HEIGHT },
  overlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0, 0, 0, 0.3)' },
  hudContainer: {
    position: 'absolute',
    top: 80,
    left: 16,
    right: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    zIndex: 50,
  },
  leftHud: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  timer: {
    backgroundColor: '#1A1A1A',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#27272A',
  },
  muteButton: {
    backgroundColor: '#000000',
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: '#FF6A00',
    alignItems: 'center',
    justifyContent: 'center',
  },
  muteIcon: {
    fontSize: 20,
  },
  timerUrgent: { backgroundColor: '#EF4444', borderColor: '#27272A' },
  timerText: { color: '#FAFAFA', fontSize: 16, fontWeight: '700' },
  detectionBadge: {
    backgroundColor: '#FF6B00',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#27272A',
  },
  detectionText: { color: '#FAFAFA', fontSize: 16, fontWeight: '700' },
  audioAlert: {
    position: 'absolute',
    top: 140,
    left: 16,
    right: 16,
    backgroundColor: '#1A1A1A',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#F59E0B',
    zIndex: 40,
    shadowColor: '#F59E0B',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 10,
  },
  audioAlertText: { color: '#FAFAFA', fontSize: 16, fontWeight: '700', textAlign: 'center' },
  tunnelContainer: {
    marginTop: 200,
    marginHorizontal: 16,
    height: 400,
    position: 'relative',
  },
  suspiciousMarker: {
    position: 'absolute',
    width: 50,
    height: 50,
    marginLeft: -25,
    marginTop: -25,
  },
  markerButton: {
    width: 50,
    height: 50,
    alignItems: 'center',
    justifyContent: 'center',
  },
  questionMarkContainer: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: 'rgba(255, 106, 0, 0.9)',
    borderWidth: 3,
    borderColor: '#FF6A00',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#FF6A00',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.6,
    shadowRadius: 8,
    elevation: 8,
  },
  questionMark: {
    color: '#FFFFFF',
    fontSize: 32,
    fontWeight: '900',
  },
  markerCorrect: {
    opacity: 0.6,
  },
  markerFalse: {
    opacity: 0.6,
  },
  markerIcon: {
    fontSize: 32,
  },
  instructionPanel: {
    position: 'absolute',
    bottom: 100,
    left: 16,
    right: 16,
    backgroundColor: '#000000',
    borderRadius: 12,
    padding: 16,
    borderWidth: 2,
    borderColor: '#FF6A00',
  },
  infoModalOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.9)',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 100,
  },
  infoModal: {
    width: SCREEN_WIDTH - 48,
    backgroundColor: '#000000',
    borderRadius: 16,
    borderWidth: 3,
    borderColor: '#FF6A00',
    overflow: 'hidden',
  },
  modalHeader: {
    backgroundColor: '#FF6A00',
    padding: 20,
    alignItems: 'center',
  },
  modalTitle: {
    color: '#FFFFFF',
    fontSize: 22,
    fontWeight: '900',
  },
  modalContent: {
    padding: 24,
  },
  signTypeLabel: {
    color: '#A1A1AA',
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 4,
  },
  signTypeValue: {
    color: '#FF6A00',
    fontSize: 20,
    fontWeight: '800',
    marginBottom: 16,
  },
  signDescription: {
    color: '#F5F5F5',
    fontSize: 16,
    lineHeight: 24,
    marginBottom: 20,
  },
  severityBadge: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignSelf: 'flex-start',
    borderWidth: 2,
  },
  severityHigh: {
    backgroundColor: 'rgba(239, 68, 68, 0.2)',
    borderColor: '#EF4444',
  },
  severityMedium: {
    backgroundColor: 'rgba(245, 158, 11, 0.2)',
    borderColor: '#F59E0B',
  },
  severityLow: {
    backgroundColor: 'rgba(16, 185, 129, 0.2)',
    borderColor: '#10B981',
  },
  severityText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '800',
  },
  modalActions: {
    flexDirection: 'row',
    borderTopWidth: 2,
    borderTopColor: '#FF6A00',
  },
  cancelButton: {
    flex: 1,
    padding: 18,
    alignItems: 'center',
    backgroundColor: '#000000',
    borderRightWidth: 1,
    borderRightColor: '#FF6A00',
  },
  cancelButtonText: {
    color: '#A1A1AA',
    fontSize: 16,
    fontWeight: '700',
  },
  confirmButton: {
    flex: 1,
    padding: 18,
    alignItems: 'center',
    backgroundColor: '#FF6A00',
  },
  confirmButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '900',
  },
  instructionTitle: {
    color: '#FAFAFA',
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 8,
  },
  instructionText: {
    color: '#A1A1AA',
    fontSize: 14,
  },
  continueButton: {
    position: 'absolute',
    bottom: 24,
    left: 16,
    right: 16,
    backgroundColor: '#10B981',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#27272A',
    shadowColor: '#10B981',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 10,
  },
  continueButtonText: {
    color: '#FAFAFA',
    fontSize: 18,
    fontWeight: '700',
  },
});

export default Phase2ScanRoof;
