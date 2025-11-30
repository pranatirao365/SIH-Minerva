import React, { useState, useRef, useEffect } from 'react';
import { View, TouchableOpacity, Text, StyleSheet } from 'react-native';
import { Audio } from 'expo-av';
import { Play, Pause, Volume2 } from './Icons';

interface AudioPlayerProps {
  audioUri: string;
  style?: any;
}

export default function AudioPlayer({ audioUri, style }: AudioPlayerProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [duration, setDuration] = useState(0);
  const [position, setPosition] = useState(0);
  const [volume, setVolume] = useState(1.0); // Max volume for loud playback
  const soundRef = useRef<Audio.Sound | null>(null);

  // Callback for playback status updates - must be defined before useEffect
  const onPlaybackStatusUpdate = (status: any) => {
    if (status.isLoaded) {
      if (status.positionMillis !== undefined) {
        setPosition(status.positionMillis);
      }
      if (status.durationMillis !== undefined) {
        setDuration(status.durationMillis);
      }

      // Update playing state
      if (status.didJustFinish) {
        setIsPlaying(false);
      }
    }
  };

  // Initialize audio and load the sound
  useEffect(() => {
    const initializeAudio = async () => {
      try {
        // Set audio mode for playback at max volume
        await Audio.setAudioModeAsync({
          allowsRecordingIOS: false,
          playsInSilentModeIOS: true,
          shouldDuckAndroid: false, // Don't lower volume for notifications
          staysActiveInBackground: true,
        });

        // Load the sound file
        const { sound, status } = await Audio.Sound.createAsync(
          { uri: audioUri },
          { volume: 1.0, shouldPlay: false }, // Start with max volume
          onPlaybackStatusUpdate
        );

        soundRef.current = sound;

        // Set initial duration
        if (status && status.isLoaded && status.durationMillis !== undefined) {
          setDuration(status.durationMillis);
        }
      } catch (error) {
        console.error('❌ Error initializing audio:', error);
      }
    };

    initializeAudio();

    return () => {
      // Cleanup: unload sound when component unmounts
      if (soundRef.current) {
        soundRef.current.unloadAsync().catch(() => {});
      }
    };
  }, [audioUri]);

  const togglePlayPause = async () => {
    try {
      if (!soundRef.current) return;

      if (isPlaying) {
        await soundRef.current.pauseAsync();
        setIsPlaying(false);
      } else {
        // Ensure volume is at max before playing
        await soundRef.current.setVolumeAsync(1.0);
        await soundRef.current.playAsync();
        setIsPlaying(true);
      }
    } catch (error) {
      console.error('❌ Error toggling playback:', error);
    }
  };

  const formatTime = (milliseconds: number) => {
    const totalSeconds = Math.floor(milliseconds / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const progressPercentage = duration > 0 ? (position / duration) * 100 : 0;

  return (
    <View style={[styles.container, style]}>
      {/* Control Button */}
      <TouchableOpacity
        onPress={togglePlayPause}
        style={styles.playButton}
      >
        {isPlaying ? (
          <Pause size={28} color="#FFFFFF" />
        ) : (
          <Play size={28} color="#FFFFFF" />
        )}
      </TouchableOpacity>

      {/* Audio Info and Progress */}
      <View style={styles.infoContainer}>
        <View style={styles.progressBar}>
          <View
            style={[
              styles.progressFill,
              { width: `${progressPercentage}%` }
            ]}
          />
        </View>
        <View style={styles.timeContainer}>
          <Text style={styles.timeText}>{formatTime(position)}</Text>
          <Text style={styles.timeText}>{formatTime(duration)}</Text>
        </View>
      </View>

      {/* Volume Indicator */}
      <View style={styles.volumeIndicator}>
        <Volume2 size={16} color="#FF6B00" />
        <Text style={styles.volumeText}>Max Volume</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#1A1A1A',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#2A2A2A',
  },
  playButton: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#FF6B00',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  infoContainer: {
    marginBottom: 12,
  },
  progressBar: {
    height: 4,
    backgroundColor: '#2A2A2A',
    borderRadius: 2,
    overflow: 'hidden',
    marginBottom: 8,
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#FF6B00',
  },
  timeContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  timeText: {
    color: '#737373',
    fontSize: 12,
    fontWeight: '500',
  },
  volumeIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    backgroundColor: '#0A0A0A',
    borderRadius: 6,
    alignSelf: 'flex-start',
    gap: 4,
  },
  volumeText: {
    color: '#FF6B00',
    fontSize: 11,
    fontWeight: '600',
  },
});
