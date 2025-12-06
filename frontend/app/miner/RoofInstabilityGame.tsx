import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Phase1BriefingRoof from '../../components/game/roof-instability/Phase1BriefingRoof';
import Phase2ScanRoof from '../../components/game/roof-instability/Phase2ScanRoof';
import Phase3ActiveInstability from '../../components/game/roof-instability/Phase3ActiveInstability';
import Phase4SupportCall from '../../components/game/roof-instability/Phase4SupportCall';
import Phase5RoofDebrief from '../../components/game/roof-instability/Phase5RoofDebrief';
import { ROOF_PHASES, SCAN_DATA } from '../../data/roofInstabilityData';

type RoofPhase = 'briefing' | 'scan' | 'active_instability' | 'support' | 'debrief';

interface PerformanceData {
  warningSignsDetected: number;
  totalWarningsSigns: number;
  falsePositives: number;
  boundaryCoveragePercent: number;
  stopWorkChosen: boolean;
  timeToStopWorkMs: number;
  correctSupportCall: boolean;
  correctRiskLevel: boolean;
}

const RoofInstabilityGame = () => {
  const router = useRouter();
  const [currentPhase, setCurrentPhase] = useState<RoofPhase>(ROOF_PHASES.BRIEFING);
  const [language, setLanguage] = useState<'en' | 'hi'>('en');
  const [totalXP, setTotalXP] = useState(0);
  const [performanceData, setPerformanceData] = useState<PerformanceData>({
    warningSignsDetected: 0,
    totalWarningsSigns: SCAN_DATA.targetDetections,
    falsePositives: 0,
    boundaryCoveragePercent: 0,
    stopWorkChosen: false,
    timeToStopWorkMs: 0,
    correctSupportCall: false,
    correctRiskLevel: false,
  });

  const handleXPEarned = (xp: number) => {
    setTotalXP(prev => prev + xp);
  };

  const handleBriefingComplete = () => {
    setCurrentPhase(ROOF_PHASES.SCAN);
  };

  const handleScanComplete = (data: {
    warningSignsDetected: number;
    falsePositives: number;
    xpEarned: number;
  }) => {
    setPerformanceData(prev => ({
      ...prev,
      warningSignsDetected: data.warningSignsDetected,
      falsePositives: data.falsePositives,
    }));
    setCurrentPhase(ROOF_PHASES.ACTIVE_INSTABILITY);
  };

  const handleActiveInstabilityComplete = (data: {
    boundaryCoveragePercent: number;
    stopWorkChosen: boolean;
    timeToStopWorkMs: number;
    xpEarned: number;
  }) => {
    setPerformanceData(prev => ({
      ...prev,
      boundaryCoveragePercent: data.boundaryCoveragePercent,
      stopWorkChosen: data.stopWorkChosen,
      timeToStopWorkMs: data.timeToStopWorkMs,
    }));
    setCurrentPhase(ROOF_PHASES.SUPPORT);
  };

  const handleSupportComplete = (data: {
    correctSupportCall: boolean;
    correctRiskLevel: boolean;
    xpEarned: number;
  }) => {
    setPerformanceData(prev => ({
      ...prev,
      correctSupportCall: data.correctSupportCall,
      correctRiskLevel: data.correctRiskLevel,
    }));
    setCurrentPhase(ROOF_PHASES.DEBRIEF);
  };

  const handleDebriefComplete = () => {
    // Game complete - navigate back to home
    router.back();
  };

  const handleExit = () => {
    router.back();
  };

  const toggleLanguage = () => {
    setLanguage(prev => (prev === 'en' ? 'hi' : 'en'));
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      {/* Back Button - Always visible */}
      <TouchableOpacity onPress={handleExit} style={styles.backButton}>
        <Text style={styles.backButtonText}>
          ← {language === 'en' ? 'Exit' : 'बाहर'}
        </Text>
      </TouchableOpacity>

      {/* Language Toggle - Always visible */}
      <TouchableOpacity onPress={toggleLanguage} style={styles.languageButton}>
        <Text style={styles.languageButtonText}>
          🌐 {language === 'en' ? 'हिंदी' : 'English'}
        </Text>
      </TouchableOpacity>

      {/* XP Counter - Always visible */}
      <View style={styles.xpCounter}>
        <Text style={styles.xpText}>⭐ {totalXP} XP</Text>
      </View>

      {/* Phase Components */}
      {currentPhase === ROOF_PHASES.BRIEFING && (
        <Phase1BriefingRoof language={language} onComplete={handleBriefingComplete} />
      )}

      {currentPhase === ROOF_PHASES.SCAN && (
        <Phase2ScanRoof
          language={language}
          onComplete={handleScanComplete}
          onXPEarned={handleXPEarned}
        />
      )}

      {currentPhase === ROOF_PHASES.ACTIVE_INSTABILITY && (
        <Phase3ActiveInstability
          language={language}
          onComplete={handleActiveInstabilityComplete}
          onXPEarned={handleXPEarned}
        />
      )}

      {currentPhase === ROOF_PHASES.SUPPORT && (
        <Phase4SupportCall
          language={language}
          onComplete={handleSupportComplete}
          onXPEarned={handleXPEarned}
        />
      )}

      {currentPhase === ROOF_PHASES.DEBRIEF && (
        <Phase5RoofDebrief
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
    backgroundColor: '#0A0A0A', // App's background
  },
  backButton: {
    position: 'absolute',
    top: 60,
    left: 16,
    zIndex: 50,
    backgroundColor: '#EF4444', // App's danger color
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    shadowColor: '#EF4444',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 8,
    borderWidth: 1,
    borderColor: '#27272A',
  },
  backButtonText: {
    color: '#FAFAFA',
    fontWeight: '600',
    fontSize: 14,
  },
  languageButton: {
    position: 'absolute',
    top: 60,
    right: 16,
    zIndex: 50,
    backgroundColor: '#1A1A1A', // App's card background
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
    borderWidth: 1,
    borderColor: '#27272A',
  },
  languageButtonText: {
    color: '#FAFAFA',
    fontWeight: '600',
    fontSize: 14,
  },
  xpCounter: {
    position: 'absolute',
    bottom: 20,
    right: 16,
    zIndex: 50,
    backgroundColor: '#FF6A00',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#FF6A00',
  },
  xpText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 12,
  },
});

export default RoofInstabilityGame;
