import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Alert, Image, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import { Audio } from 'expo-av';
import { ArrowLeft, Camera, Mic, X, Upload } from '../../components/Icons';
import { submitIncident } from '../../services/incidentService';
import { useRoleStore } from '../../hooks/useRoleStore';

export default function ReportIncident() {
  const router = useRouter();
  const { user } = useRoleStore();
  
  // Audio recording state
  const [recording, setRecording] = useState<Audio.Recording | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [audioUri, setAudioUri] = useState<string | null>(null);
  const [recordingDuration, setRecordingDuration] = useState(0);
  const [durationInterval, setDurationInterval] = useState<ReturnType<typeof setTimeout> | null>(null);
  
  // Language selection
  const [language, setLanguage] = useState<'en' | 'hi'>('en');
  
  // Image state
  const [imageUri, setImageUri] = useState<string | null>(null);
  
  // Loading state
  const [loading, setLoading] = useState(false);

  const languageOptions = [
    { code: 'en' as const, label: 'English', flag: '🇬🇧' },
    { code: 'hi' as const, label: 'हिंदी (Hindi)', flag: '🇮🇳' },
  ];

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const startRecording = async () => {
    try {
      console.log('🎤 Requesting audio recording permissions...');
      const permission = await Audio.requestPermissionsAsync();
      
      if (!permission.granted) {
        Alert.alert('Permission Required', 'Permission to record audio is required!');
        return;
      }

      console.log('✅ Permission granted, starting recording...');
      
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
        shouldDuckAndroid: false,
        staysActiveInBackground: true,
      });

      const { recording } = await Audio.Recording.createAsync(
        Audio.RecordingOptionsPresets.HIGH_QUALITY
      );

      setRecording(recording);
      setIsRecording(true);
      setRecordingDuration(0);
      
      // Start duration timer
      const interval = setInterval(() => {
        setRecordingDuration(prev => prev + 1);
      }, 1000);
      setDurationInterval(interval);
      
      console.log('🎤 Recording started');
    } catch (error) {
      console.error('Failed to start recording', error);
      Alert.alert('Error', 'Failed to start recording');
    }
  };

  const stopRecording = async () => {
    try {
      if (!recording) return;

      console.log('⏹️ Stopping recording...');
      setIsRecording(false);
      
      if (durationInterval) {
        clearInterval(durationInterval);
        setDurationInterval(null);
      }
      
      await recording.stopAndUnloadAsync();
      
      const uri = recording.getURI();
      console.log('✅ Recording saved to:', uri);
      
      if (!uri) {
        throw new Error('Failed to get recording URI');
      }
      
      setAudioUri(uri);
      setRecording(null);
    } catch (error) {
      console.error('Failed to stop recording', error);
      Alert.alert('Error', 'Failed to stop recording');
    }
  };

  const reRecordAudio = () => {
    setAudioUri(null);
    setRecordingDuration(0);
  };

  const takePhoto = async () => {
    try {
      const permissionResult = await ImagePicker.requestCameraPermissionsAsync();

      if (!permissionResult.granted) {
        Alert.alert('Permission Required', 'Permission to access camera is required!');
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        allowsEditing: true,
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        setImageUri(result.assets[0].uri);
      }
    } catch (error) {
      console.error('Error taking photo:', error);
      Alert.alert('Error', 'Failed to take photo');
    }
  };

  const selectPhoto = async () => {
    try {
      const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();

      if (!permissionResult.granted) {
        Alert.alert('Permission Required', 'Permission to access gallery is required!');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        setImageUri(result.assets[0].uri);
      }
    } catch (error) {
      console.error('Error selecting photo:', error);
      Alert.alert('Error', 'Failed to select photo');
    }
  };

  const handleSubmit = async () => {
    if (!audioUri) {
      Alert.alert('Error', 'Please record audio before submitting');
      return;
    }

    if (!user?.phone) {
      Alert.alert('Error', 'User not logged in');
      return;
    }

    setLoading(true);

    try {
      console.log('📤 Submitting incident...');
      
      const minerId = user.id || user.phone?.replace(/[^0-9]/g, '') || 'unknown';
      const minerName = user.name || 'User';
      
      await submitIncident(
        minerId,
        minerName,
        audioUri ? 'audio' : (imageUri ? 'photo' : 'text'),
        'Voice/Photo Report',
        '',
        'Medium',
        audioUri || imageUri || undefined,
        '',
        language
      );

      Alert.alert(
        'Success',
        'Incident reported successfully. Audio will be transcribed automatically.',
        [
          {
            text: 'OK',
            onPress: () => router.back(),
          },
        ]
      );
    } catch (error: any) {
      console.error('❌ Error submitting incident:', error);
      Alert.alert('Error', error.message || 'Failed to submit incident');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#000000' }}>
      {/* Header */}
      <View style={{ 
        flexDirection: 'row', 
        alignItems: 'center', 
        padding: 16, 
        borderBottomWidth: 1, 
        borderBottomColor: '#1A1A1A' 
      }}>
        <TouchableOpacity onPress={() => router.back()} style={{ marginRight: 12 }}>
          <ArrowLeft size={24} color="#FFFFFF" />
        </TouchableOpacity>
        <Text style={{ color: '#FFFFFF', fontSize: 20, fontWeight: 'bold' }}>
          Report Incident
        </Text>
      </View>

      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 16 }}>
        {/* TOP HALF - AUDIO RECORDING MODULE */}
        <View style={{ 
          backgroundColor: '#0A0A0A', 
          borderRadius: 16, 
          padding: 20, 
          marginBottom: 24,
          borderWidth: 2,
          borderColor: '#FF6B00'
        }}>
          <Text style={{ 
            color: '#FFFFFF', 
            fontSize: 18, 
            fontWeight: 'bold', 
            marginBottom: 16,
            textAlign: 'center'
          }}>
            🎤 Audio Recording
          </Text>

          {/* Language Selection */}
          <View style={{ marginBottom: 20 }}>
            <Text style={{ color: '#E5E5E5', fontSize: 14, marginBottom: 8 }}>
              Select Language:
            </Text>
            <View style={{ flexDirection: 'row', gap: 12 }}>
              {languageOptions.map((lang) => (
                <TouchableOpacity
                  key={lang.code}
                  onPress={() => setLanguage(lang.code)}
                  disabled={isRecording || audioUri !== null}
                  style={{
                    flex: 1,
                    backgroundColor: language === lang.code ? '#FF6B00' : '#1A1A1A',
                    borderRadius: 12,
                    padding: 12,
                    alignItems: 'center',
                    borderWidth: 1,
                    borderColor: language === lang.code ? '#FF8533' : '#2A2A2A',
                    opacity: (isRecording || audioUri !== null) ? 0.5 : 1
                  }}
                >
                  <Text style={{ fontSize: 20, marginBottom: 4 }}>{lang.flag}</Text>
                  <Text style={{ 
                    color: '#FFFFFF', 
                    fontSize: 13, 
                    fontWeight: language === lang.code ? '700' : '500' 
                  }}>
                    {lang.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Recording Controls */}
          {!audioUri ? (
            <View>
              {isRecording && (
                <View style={{ 
                  backgroundColor: '#1A1A1A', 
                  borderRadius: 12, 
                  padding: 16, 
                  marginBottom: 16,
                  alignItems: 'center'
                }}>
                  <View style={{ 
                    width: 16, 
                    height: 16, 
                    borderRadius: 8, 
                    backgroundColor: '#EF4444',
                    marginBottom: 8
                  }} />
                  <Text style={{ 
                    color: '#FFFFFF', 
                    fontSize: 24, 
                    fontWeight: 'bold',
                    fontVariant: ['tabular-nums']
                  }}>
                    {formatDuration(recordingDuration)}
                  </Text>
                  <Text style={{ color: '#737373', fontSize: 12, marginTop: 4 }}>
                    Recording in progress...
                  </Text>
                </View>
              )}

              <TouchableOpacity
                onPress={isRecording ? stopRecording : startRecording}
                style={{
                  backgroundColor: isRecording ? '#EF4444' : '#10B981',
                  borderRadius: 12,
                  padding: 16,
                  alignItems: 'center',
                  flexDirection: 'row',
                  justifyContent: 'center',
                  gap: 8
                }}
              >
                <Mic size={20} color="#FFFFFF" />
                <Text style={{ color: '#FFFFFF', fontSize: 16, fontWeight: '700' }}>
                  {isRecording ? 'Stop Recording' : 'Start Recording'}
                </Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View>
              {/* Audio Preview */}
              <View style={{ 
                backgroundColor: '#1A1A1A', 
                borderRadius: 12, 
                padding: 16, 
                marginBottom: 16,
                alignItems: 'center',
                borderWidth: 1,
                borderColor: '#10B981'
              }}>
                <View style={{ 
                  width: 48, 
                  height: 48, 
                  borderRadius: 24, 
                  backgroundColor: '#10B981',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginBottom: 12
                }}>
                  <Mic size={24} color="#FFFFFF" />
                </View>
                <Text style={{ color: '#10B981', fontSize: 16, fontWeight: 'bold' }}>
                  ✓ Audio Recorded
                </Text>
                <Text style={{ color: '#737373', fontSize: 14, marginTop: 4 }}>
                  Duration: {formatDuration(recordingDuration)}
                </Text>
                <Text style={{ color: '#737373', fontSize: 12, marginTop: 4 }}>
                  Language: {languageOptions.find(l => l.code === language)?.label}
                </Text>
              </View>

              <TouchableOpacity
                onPress={reRecordAudio}
                style={{
                  backgroundColor: '#F59E0B',
                  borderRadius: 12,
                  padding: 16,
                  alignItems: 'center',
                  flexDirection: 'row',
                  justifyContent: 'center',
                  gap: 8
                }}
              >
                <Text style={{ color: '#FFFFFF', fontSize: 16, fontWeight: '700' }}>
                  🔄 Re-record
                </Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

        {/* BOTTOM HALF - IMAGE UPLOAD */}
        <View style={{ 
          backgroundColor: '#0A0A0A', 
          borderRadius: 16, 
          padding: 20, 
          marginBottom: 24 
        }}>
          <Text style={{ 
            color: '#FFFFFF', 
            fontSize: 18, 
            fontWeight: 'bold', 
            marginBottom: 16,
            textAlign: 'center'
          }}>
            📷 Photo (Optional)
          </Text>

          {imageUri ? (
            <View>
              <Image 
                source={{ uri: imageUri }} 
                style={{ 
                  width: '100%', 
                  height: 200, 
                  borderRadius: 12,
                  marginBottom: 16 
                }}
                resizeMode="cover"
              />
              <TouchableOpacity
                onPress={() => setImageUri(null)}
                style={{
                  backgroundColor: '#EF4444',
                  borderRadius: 12,
                  padding: 12,
                  alignItems: 'center',
                  flexDirection: 'row',
                  justifyContent: 'center',
                  gap: 8
                }}
              >
                <X size={16} color="#FFFFFF" />
                <Text style={{ color: '#FFFFFF', fontSize: 14, fontWeight: '600' }}>
                  Remove Photo
                </Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View style={{ gap: 12 }}>
              <TouchableOpacity
                onPress={takePhoto}
                style={{
                  backgroundColor: '#3B82F6',
                  borderRadius: 12,
                  padding: 16,
                  alignItems: 'center',
                  flexDirection: 'row',
                  justifyContent: 'center',
                  gap: 8
                }}
              >
                <Camera size={20} color="#FFFFFF" />
                <Text style={{ color: '#FFFFFF', fontSize: 16, fontWeight: '700' }}>
                  Take Photo
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={selectPhoto}
                style={{
                  backgroundColor: '#1A1A1A',
                  borderRadius: 12,
                  padding: 16,
                  alignItems: 'center',
                  flexDirection: 'row',
                  justifyContent: 'center',
                  gap: 8,
                  borderWidth: 1,
                  borderColor: '#2A2A2A'
                }}
              >
                <Upload size={20} color="#FFFFFF" />
                <Text style={{ color: '#FFFFFF', fontSize: 16, fontWeight: '700' }}>
                  Select Photo
                </Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

        {/* SUBMIT BUTTON */}
        <TouchableOpacity
          onPress={handleSubmit}
          disabled={loading || !audioUri}
          style={{
            backgroundColor: audioUri ? '#FF6B00' : '#2A2A2A',
            borderRadius: 12,
            padding: 18,
            alignItems: 'center',
            marginBottom: 24,
            opacity: loading ? 0.7 : 1
          }}
        >
          {loading ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <Text style={{ 
              color: '#FFFFFF', 
              fontSize: 18, 
              fontWeight: 'bold' 
            }}>
              Submit Report
            </Text>
          )}
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}
