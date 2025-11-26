import React, { useState, useRef } from 'react';
import { View, Text, TouchableOpacity, Dimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Video, ResizeMode } from 'expo-av';
import { Play, Pause, SkipForward, CheckCircle, ArrowLeft } from '../../components/Icons';
import { translator } from '../../services/translator';
import { useRoleStore } from '../../hooks/useRoleStore';
import { Button } from '../../components/ui/collapsible';

const { width } = Dimensions.get('window');

export default function SafetyVideoPlayer() {
  const router = useRouter();
  const { completeModule } = useRoleStore();
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const videoRef = useRef<Video>(null);

  const handleComplete = () => {
    completeModule('video');
    router.back();
  };

  const togglePlayPause = () => {
    if (isPlaying) {
      videoRef.current?.pauseAsync();
    } else {
      videoRef.current?.playAsync();
    }
    setIsPlaying(!isPlaying);
  };

  return (
    <SafeAreaView className="flex-1 bg-background">
      {/* Header */}
      <View className="px-6 py-4 flex-row items-center justify-between border-b border-border">
        <TouchableOpacity onPress={() => router.back()}>
          <ArrowLeft size={24} color="#FFFFFF" />
        </TouchableOpacity>
        <Text className="text-foreground text-lg font-bold">Safety Video</Text>
        <View style={{ width: 24 }} />
      </View>

      <View className="flex-1 justify-center items-center bg-black">
        {/* Video Placeholder */}
        <View 
          style={{ width, height: width * 9 / 16 }}
          className="bg-neutral-800 items-center justify-center"
        >
          <Text className="text-neutral-400 text-center px-4">
            Safety Training Video{'\n'}
            (Demo Mode - Video player would appear here)
          </Text>
          
          {/* Progress Bar */}
          <View className="absolute bottom-0 left-0 right-0 h-1 bg-neutral-700">
            <View 
              className="h-full bg-primary"
              style={{ width: `${progress}%` }}
            />
          </View>
        </View>

        {/* Controls */}
        <View className="mt-8 flex-row items-center space-x-6">
          <TouchableOpacity onPress={togglePlayPause} className="p-4">
            {isPlaying ? (
              <Pause size={32} color="#FF6B00" />
            ) : (
              <Play size={32} color="#FF6B00" />
            )}
          </TouchableOpacity>
          
          <TouchableOpacity onPress={() => setProgress(Math.min(100, progress + 10))}>
            <SkipForward size={28} color="#FFFFFF" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Complete Button */}
      <View className="px-6 py-6">
        <TouchableOpacity
          onPress={handleComplete}
          className="bg-accent rounded-lg p-4 flex-row items-center justify-center"
        >
          <CheckCircle size={20} color="#FFFFFF" />
          <Text className="text-white text-lg font-bold ml-2">Mark as Complete</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}
