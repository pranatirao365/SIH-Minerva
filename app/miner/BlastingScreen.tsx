import { useRouter } from 'expo-router';
import React, { useEffect } from 'react';
import { StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import BlastingBriefing from '../../components/blasting/BlastingBriefing';
import BlastingCompletion from '../../components/blasting/BlastingCompletion';
import BlastSequenceMonitoring from '../../components/blasting/BlastSequenceMonitoring';
import PostBlastVerification from '../../components/blasting/PostBlastVerification';
import PreBlastInspection from '../../components/blasting/PreBlastInspection';
import useBlastingGameStore, { BLASTING_PHASES } from '../../stores/blastingGameStore';

export default function BlastingScreen() {
  const router = useRouter();
  const currentPhase = useBlastingGameStore((state: any) => state.currentPhase);
  const resetGame = useBlastingGameStore((state: any) => state.resetGame);

  // Initialize game on mount
  useEffect(() => {
    resetGame();
    
    return () => {
      // Cleanup when leaving the screen
      resetGame();
    };
  }, [resetGame]);

  const handleExit = () => {
    resetGame();
    router.back();
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      {currentPhase === BLASTING_PHASES.BRIEFING && <BlastingBriefing />}
      
      {currentPhase === BLASTING_PHASES.PRE_BLAST && <PreBlastInspection />}
      
      {currentPhase === BLASTING_PHASES.BLAST_SEQUENCE && <BlastSequenceMonitoring />}
      
      {currentPhase === BLASTING_PHASES.POST_BLAST && <PostBlastVerification />}
      
      {currentPhase === BLASTING_PHASES.COMPLETION && <BlastingCompletion onExit={handleExit} />}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
});
