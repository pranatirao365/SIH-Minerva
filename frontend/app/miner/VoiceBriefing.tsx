import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Play, Pause, CheckCircle, ArrowLeft, FileText } from '../../components/Icons';
import { translator } from '../../services/translator';
import { useRoleStore } from '../../hooks/useRoleStore';

export default function VoiceBriefing() {
  const router = useRouter();
  const { completeModule } = useRoleStore();
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);

  const transcript = `
Good morning, team. Today's safety briefing covers critical points for your shift.

1. Air Quality Monitoring:
   - Oxygen levels are currently at 20.9% - within safe range
   - Methane detectors show 0.2% - below danger threshold
   - Carbon monoxide levels normal at 4 ppm

2. Equipment Checks:
   - All personnel must inspect PPE before descent
   - Helmet lamps fully charged
   - Emergency breathing apparatus tested

3. Today's Work Areas:
   - Shaft A: Normal operations
   - Tunnel B: Ventilation upgrade in progress - restricted access
   - Level 3: Water seepage monitoring - extra caution required

4. Emergency Procedures:
   - Assembly point: Surface station
   - Emergency contact: Extension 911
   - Evacuation route maps updated

Remember: Safety first, always. Report any concerns immediately.

Stay safe, team.
  `;

  const handleComplete = () => {
    completeModule('briefing');
    router.back();
  };

  const togglePlayPause = () => {
    setIsPlaying(!isPlaying);
    if (!isPlaying) {
      // Simulate audio progress
      const interval = setInterval(() => {
        setProgress(prev => {
          if (prev >= 100) {
            clearInterval(interval);
            setIsPlaying(false);
            return 100;
          }
          return prev + 1;
        });
      }, 180); // 180 seconds / 100 = 1.8s per %
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-background">
      {/* Header */}
      <View className="px-6 py-4 flex-row items-center justify-between border-b border-border">
        <TouchableOpacity onPress={() => router.back()}>
          <ArrowLeft size={24} color="#FFFFFF" />
        </TouchableOpacity>
        <Text className="text-foreground text-lg font-bold">Voice Briefing</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView className="flex-1 px-6 py-6">
        {/* Audio Player */}
        <View className="bg-neutral-900 rounded-lg border border-border p-6 mb-6">
          <Text className="text-foreground text-xl font-bold mb-4">
            Daily Safety Briefing
          </Text>
          
          <Text className="text-neutral-400 mb-4">Duration: 3:00</Text>

          {/* Progress Bar */}
          <View className="h-2 bg-neutral-800 rounded-full mb-4 overflow-hidden">
            <View 
              className="h-full bg-primary rounded-full"
              style={{ width: `${progress}%` }}
            />
          </View>

          {/* Play Button */}
          <TouchableOpacity
            onPress={togglePlayPause}
            className="bg-primary rounded-full p-4 items-center justify-center"
          >
            {isPlaying ? (
              <View className="flex-row items-center">
                <Pause size={24} color="#FFFFFF" />
                <Text className="text-white text-lg font-bold ml-2">Pause</Text>
              </View>
            ) : (
              <View className="flex-row items-center">
                <Play size={24} color="#FFFFFF" />
                <Text className="text-white text-lg font-bold ml-2">Play Audio</Text>
              </View>
            )}
          </TouchableOpacity>
        </View>

        {/* Transcript */}
        <View className="bg-neutral-900 rounded-lg border border-border p-6 mb-6">
          <View className="flex-row items-center mb-4">
            <FileText size={20} color="#FF6B00" />
            <Text className="text-foreground text-lg font-bold ml-2">Transcript</Text>
          </View>
          
          <Text className="text-neutral-300 leading-6">
            {transcript}
          </Text>
        </View>
      </ScrollView>

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
