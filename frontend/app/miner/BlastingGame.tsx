import React, { useState } from 'react';
import { View, StyleSheet, TouchableOpacity, Text } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import BlastingBriefing from '../../components/game/blasting/BlastingBriefing';
import PreBlastInspection from '../../components/game/blasting/PreBlastInspection';
import BlastSequenceMonitoring from '../../components/game/blasting/BlastSequenceMonitoring';
import PostBlastVerification from '../../components/game/blasting/PostBlastVerification';
import BlastingDebrief from '../../components/game/blasting/BlastingDebrief';
import { BLASTING_PHASES } from '../../data/blastingGameData';

const BlastingGame = () => {
  const router = useRouter();
  const [currentPhase, setCurrentPhase] = useState<string>(BLASTING_PHASES.BRIEFING);
  const [language, setLanguage] = useState('en');
  const [totalXP, setTotalXP] = useState(0);
  const [performanceData, setPerformanceData] = useState({
    evacuationTime: 0,
    anomalyDetection: 0,
    workerIncidents: 0,
    seismicMagnitude: 0,
    flyrockDistance: 0
  });

  const handleXPEarned = (xp: number) => {
    setTotalXP(prev => prev + xp);
  };

  const handleBriefingComplete = () => {
    setCurrentPhase(BLASTING_PHASES.PRE_BLAST);
  };

  const handlePreBlastComplete = (data: { xpEarned: number; evacuationTime: number }) => {
    setPerformanceData(prev => ({
      ...prev,
      evacuationTime: data.evacuationTime,
      workerIncidents: 0
    }));
    setCurrentPhase(BLASTING_PHASES.BLAST_SEQUENCE);
  };

  const handleBlastSequenceComplete = (data: { xpEarned: number; seismicMagnitude: string; flyrockDistance: number }) => {
    setPerformanceData(prev => ({
      ...prev,
      seismicMagnitude: parseFloat(data.seismicMagnitude),
      flyrockDistance: data.flyrockDistance,
      anomalyDetection: 2 // Detected all anomalies
    }));
    setCurrentPhase(BLASTING_PHASES.POST_BLAST);
  };

  const handlePostBlastComplete = () => {
    setCurrentPhase(BLASTING_PHASES.DEBRIEF);
  };

  const handleDebriefComplete = () => {
    // Game complete - navigate back to home
    router.back();
  };

  const handleExit = () => {
    router.back();
  };

  const toggleLanguage = () => {
    setLanguage(prev => prev === 'en' ? 'hi' : 'en');
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      {/* Back Button - Always visible */}
      <TouchableOpacity
        onPress={handleExit}
        style={styles.backButton}
      >
        <Text style={styles.backButtonText}>← {language === 'en' ? 'Exit' : 'बाहर'}</Text>
      </TouchableOpacity>

      {/* Language Toggle - Always visible */}
      <TouchableOpacity
        onPress={toggleLanguage}
        style={styles.languageButton}
      >
        <Text style={styles.languageButtonText}>
          🌐 {language === 'en' ? 'हिंदी' : 'English'}
        </Text>
      </TouchableOpacity>

      {/* XP Counter - Always visible */}
      <View style={styles.xpCounter}>
        <Text style={styles.xpText}>⭐ {totalXP} XP</Text>
      </View>

      {/* Phase Components */}
      {currentPhase === BLASTING_PHASES.BRIEFING && (
        <BlastingBriefing 
          language={language}
          onComplete={handleBriefingComplete}
        />
      )}

      {currentPhase === BLASTING_PHASES.PRE_BLAST && (
        <PreBlastInspection 
          language={language}
          onComplete={handlePreBlastComplete}
          onXPEarned={handleXPEarned}
        />
      )}

      {currentPhase === BLASTING_PHASES.BLAST_SEQUENCE && (
        <BlastSequenceMonitoring 
          language={language}
          onComplete={handleBlastSequenceComplete}
          onXPEarned={handleXPEarned}
        />
      )}

      {currentPhase === BLASTING_PHASES.POST_BLAST && (
        <PostBlastVerification 
          language={language}
          onComplete={handlePostBlastComplete}
          onXPEarned={handleXPEarned}
        />
      )}

      {currentPhase === BLASTING_PHASES.DEBRIEF && (
        <BlastingDebrief 
          language={language}
          performanceData={performanceData}
          totalXP={totalXP}
          onComplete={handleDebriefComplete}
        />
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  backButton: {
    position: 'absolute',
    top: 16,
    left: 16,
    zIndex: 50,
    backgroundColor: 'rgba(220, 38, 38, 0.9)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 9999,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
    borderWidth: 2,
    borderColor: '#fff',
  },
  backButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 14,
  },
  languageButton: {
    position: 'absolute',
    top: 16,
    right: 16,
    zIndex: 50,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 9999,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
    borderWidth: 2,
    borderColor: '#d1d5db',
  },
  languageButtonText: {
    color: '#1f2937',
    fontWeight: '600',
    fontSize: 14,
  },
  xpCounter: {
    position: 'absolute',
    top: 56,
    left: 16,
    zIndex: 50,
    backgroundColor: '#eab308',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 9999,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
    borderWidth: 4,
    borderColor: '#fff',
  },
  xpText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 18,
  },
});

export default BlastingGame;
