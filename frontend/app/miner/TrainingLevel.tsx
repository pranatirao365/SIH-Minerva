import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useRef, useState } from 'react';
import {
  Dimensions,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Video, ResizeMode, AVPlaybackStatus } from 'expo-av';
import { ArrowLeft, CheckCircle } from '../../components/Icons';
import { COLORS } from '../../constants/styles';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

const TRAINING_WORLDS = [
  { id: 1, name: 'Hazard Spotting', color: '#D97706' },
  { id: 2, name: 'Equipment Handling', color: '#0369A1' },
  { id: 3, name: 'Situational Safety', color: '#047857' },
  { id: 4, name: 'Emergency Response', color: '#DC2626' },
  { id: 5, name: 'Safety Mindset', color: '#7C3AED' },
];

// Video mapping: worldId_levelNumber -> video file
// Videos are currently placeholders - add actual video files to assets/videos/training/
const TRAINING_VIDEOS: { [key: string]: any } = {
  // Videos disabled until files are added
  // Uncomment and add files as: w1l1.mp4, w1l2.mp4, etc.
};

export default function TrainingLevel() {
  const params = useLocalSearchParams();
  const router = useRouter();
  const worldId = parseInt(params.worldId as string);
  const levelNumber = parseInt(params.levelNumber as string);
  
  const world = TRAINING_WORLDS.find(w => w.id === worldId);
  const videoRef = useRef<Video>(null);
  const [videoCompleted, setVideoCompleted] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);

  const videoKey = `${worldId}_${levelNumber}`;
  const videoSource = TRAINING_VIDEOS[videoKey];

  const handlePlaybackStatusUpdate = (status: AVPlaybackStatus) => {
    if (status.isLoaded) {
      setIsPlaying(status.isPlaying);
      
      // Check if video finished
      if (status.didJustFinish && !status.isLooping) {
        setVideoCompleted(true);
        console.log('✅ Training video completed');
      }
    }
  };

  const handleCompleteLevel = () => {
    console.log(`✅ Level ${levelNumber} completed in ${world?.name}`);
    router.back();
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: world?.color + '20' }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <ArrowLeft size={24} color={COLORS.text} />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.worldName}>{world?.name}</Text>
          <Text style={styles.levelTitle}>Level {levelNumber}</Text>
        </View>
        {videoCompleted && (
          <View style={styles.completedBadge}>
            <CheckCircle size={20} color="#10B981" />
          </View>
        )}
      </View>

      {/* Video Player - Full Screen Vertical */}
      <View style={styles.videoContainer}>
        {videoSource ? (
          <Video
            ref={videoRef}
            source={videoSource}
            style={styles.video}
            resizeMode={ResizeMode.CONTAIN}
            shouldPlay={true}
            isLooping={false}
            useNativeControls
            onPlaybackStatusUpdate={handlePlaybackStatusUpdate}
          />
        ) : (
          <View style={styles.noVideoContainer}>
            <Text style={styles.noVideoText}>📹 Training video coming soon</Text>
            <Text style={styles.noVideoSubtext}>
              {world?.name} - Level {levelNumber}
            </Text>
            <Text style={styles.noVideoHint}>
              Place video file: w{worldId}l{levelNumber}.mp4
            </Text>
            {/* Show complete button even without video for testing */}
            <TouchableOpacity
              style={[styles.completeButton, { backgroundColor: world?.color || COLORS.primary, marginTop: 40 }]}
              onPress={handleCompleteLevel}
            >
              <Text style={styles.completeButtonText}>Continue</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>

      {/* Complete Button - Only shows when video is done */}
      {videoCompleted && (
        <View style={styles.completeButtonContainer}>
          <TouchableOpacity
            style={[styles.completeButton, { backgroundColor: world?.color || COLORS.primary }]}
            onPress={handleCompleteLevel}
          >
            <CheckCircle size={24} color="#FFFFFF" />
            <Text style={styles.completeButtonText}>Complete Level & Continue</Text>
          </TouchableOpacity>
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  backButton: {
    padding: 8,
  },
  headerCenter: {
    flex: 1,
    marginLeft: 12,
  },
  worldName: {
    fontSize: 14,
    color: COLORS.textMuted,
    fontWeight: '600',
  },
  levelTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.text,
  },
  completedBadge: {
    padding: 8,
  },
  videoContainer: {
    flex: 1,
    backgroundColor: '#000',
    justifyContent: 'center',
    alignItems: 'center',
  },
  video: {
    width: SCREEN_WIDTH,
    height: SCREEN_HEIGHT - 100,
  },
  noVideoContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  noVideoText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: 8,
    textAlign: 'center',
  },
  noVideoSubtext: {
    fontSize: 16,
    color: COLORS.textMuted,
    textAlign: 'center',
  },
  noVideoHint: {
    fontSize: 14,
    color: COLORS.textMuted,
    textAlign: 'center',
    marginTop: 16,
    fontFamily: 'monospace',
  },
  completeButtonContainer: {
    padding: 20,
    paddingBottom: 32,
  },
  completeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 18,
    borderRadius: 12,
    gap: 12,
  },
  completeButtonText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
});
