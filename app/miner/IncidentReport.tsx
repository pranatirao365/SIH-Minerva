import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, TextInput, Alert, Image, ActivityIndicator, Modal } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import { Audio } from 'expo-av';
import { ArrowLeft, Upload, Camera, Video, Mic, X, Pause } from '../../components/Icons';
import { submitIncident } from '../../services/incidentService';
import { useRoleStore } from '../../hooks/useRoleStore';

export default function IncidentReport() {
  const router = useRouter();
  const { user } = useRoleStore();
  
  // Form state
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [severity, setSeverity] = useState<'Low' | 'Medium' | 'High' | 'Critical'>('Medium');
  const [language, setLanguage] = useState<'en' | 'hi' | 'te'>('en');
  
  // Media state
  const [mediaUri, setMediaUri] = useState<string | null>(null);
  const [mediaType, setMediaType] = useState<'photo' | 'video' | 'audio' | null>(null);
  
  // Audio recording state
  const [recording, setRecording] = useState<Audio.Recording | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [audioUri, setAudioUri] = useState<string | null>(null);
  const [showLanguageModal, setShowLanguageModal] = useState(false);
  
  // Transcript confirmation state
  const [transcript, setTranscript] = useState('');
  const [showTranscriptModal, setShowTranscriptModal] = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [editableTranscript, setEditableTranscript] = useState('');
  
  // Language detection state
  const [detectedLanguage, setDetectedLanguage] = useState<'en' | 'hi' | 'te' | null>(null);
  const [languageConfidence, setLanguageConfidence] = useState<number | null>(null);
  const [showLanguageConfirmation, setShowLanguageConfirmation] = useState(false);
  const [suggestedLanguage, setSuggestedLanguage] = useState<'en' | 'hi' | 'te' | null>(null);
  
  // Audio metadata for logging
  const [audioMetadata, setAudioMetadata] = useState<{
    duration?: number;
    sampleRate?: number;
    channels?: number;
    fileSize?: number;
  }>({});
  
  // Loading state
  const [loading, setLoading] = useState(false);

  const severityOptions = [
    { level: 'Low' as const, label: 'Low', color: '#10B981' },
    { level: 'Medium' as const, label: 'Medium', color: '#F59E0B' },
    { level: 'High' as const, label: 'High', color: '#EF4444' },
    { level: 'Critical' as const, label: 'Critical', color: '#DC2626' },
  ];

  const languageOptions = [
    { code: 'en' as const, label: 'English', nativeLabel: 'English', flag: '🇬🇧', region: 'en-IN', description: 'Speak in English' },
    { code: 'hi' as const, label: 'हिंदी (Hindi)', nativeLabel: 'हिंदी', flag: '🇮🇳', region: 'hi-IN', description: 'हिंदी में बोलें' },
    { code: 'te' as const, label: 'తెలుగు (Telugu)', nativeLabel: 'తెలుగు', flag: '🇮🇳', region: 'te-IN', description: 'తెలుగులో మాట్లాడండి' },
  ];

  const pickImage = async () => {
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
        setMediaUri(result.assets[0].uri);
        setMediaType('photo');
      }
    } catch (error) {
      console.error('Error picking image:', error);
      Alert.alert('Error', 'Failed to pick image');
    }
  };

  const pickVideo = async () => {
    try {
      const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();

      if (!permissionResult.granted) {
        Alert.alert('Permission Required', 'Permission to access gallery is required!');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Videos,
        allowsEditing: true,
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        setMediaUri(result.assets[0].uri);
        setMediaType('video');
      }
    } catch (error) {
      console.error('Error picking video:', error);
      Alert.alert('Error', 'Failed to pick video');
    }
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
      
      // Configure audio mode for recording with optimal settings
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
        shouldDuckAndroid: false, // ← Prevent ducking during playback
        staysActiveInBackground: true, // ← Keep audio active
      });

      // Use HIGH_QUALITY preset for better audio capture
      const { recording } = await Audio.Recording.createAsync(
        Audio.RecordingOptionsPresets.HIGH_QUALITY
      );

      setRecording(recording);
      setIsRecording(true);
      console.log('🎤 Recording started with HIGH_QUALITY preset');
      console.log('🔊 Audio mode configured for maximum volume playback');
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
      await recording.stopAndUnloadAsync();
      
      const uri = recording.getURI();
      console.log('✅ Recording saved to:', uri);
      
      if (!uri) {
        throw new Error('Failed to get recording URI');
      }
      
      setAudioUri(uri);
      setMediaUri(null);
      setMediaType('audio');
      setRecording(null);
      
      // Immediately run STT on client-side
      console.log('🎤 Starting client-side speech-to-text...');
      await runClientSideSTT(uri);
    } catch (error) {
      console.error('Failed to stop recording', error);
      Alert.alert('Error', 'Failed to stop recording');
    }
  };

  const logTranscriptionFailure = (
    failureType: string,
    selectedLanguage: string | null,
    confidence: number | null,
    audioUri: string,
    errorMsg?: string
  ) => {
    const timestamp = new Date().toISOString();
    const deviceLocale = 'en-IN'; // Can be enhanced with device locale detection
    
    // Get the language label for better debugging
    const languageLabel = languageOptions.find(l => l.code === selectedLanguage)?.label || 'Unknown';
    
    const logEntry = {
      timestamp,
      failureType,
      selectedLanguageCode: selectedLanguage || 'unknown',
      selectedLanguageLabel: languageLabel,
      detectedLanguage: detectedLanguage || 'unknown',
      confidence: confidence ? `${(confidence * 100).toFixed(1)}%` : 'N/A',
      audioFileRef: audioUri.substring(0, 100) + '...', // Truncate for readability
      deviceLocale,
      audioMetadataSize: audioMetadata.fileSize,
      errorMessage: errorMsg || 'N/A',
      userId: user?.phone || 'unknown',
      userRole: user?.role || 'unknown',
      apiKeyConfigured: !!process.env.EXPO_PUBLIC_ASSEMBLYAI_API_KEY,
      // Telugu-specific debugging
      teluguLanguageCheck: selectedLanguage === 'te' ? 'Yes - Telugu selected' : 'No'
    };
    
    console.log('\n📋 ===== TRANSCRIPTION FAILURE LOG =====' );
    console.log(JSON.stringify(logEntry, null, 2));
    console.log('===================================\n');
    
    // In production, send this to a logging service
    // Example: sendToLoggingService(logEntry);
  };

  const confirmLanguageAndProceed = () => {
    setShowLanguageConfirmation(false);
    setShowTranscriptModal(true);
  };

  const changeLanguageAndRetry = async () => {
    setShowLanguageConfirmation(false);
    setShowTranscriptModal(false);
    setEditableTranscript('');
    setTranscript('');
    setShowLanguageModal(true);
  };

  const retryRecording = () => {
    setEditableTranscript('');
    setTranscript('');
    setAudioUri(null);
    setShowTranscriptModal(false);
    setShowLanguageModal(true);
  };

  const runClientSideSTT = async (audioUri: string) => {
    setIsTranscribing(true);
    try {
      console.log('\n🎤 ===== AUDIO TRANSCRIPTION START =====' );
      console.log('🌐 User-selected language:', language);
      console.log('📁 Audio URI:', audioUri);
      
      // ⏭️ TELUGU STT SKIP - Disable transcription completely for Telugu
      if (language === 'te') {
        console.log('⏭️ Telugu transcription disabled - uploading audio only, no STT');
        console.log('📝 Setting empty transcript for Telugu - no API call');
        setEditableTranscript('');
        setTranscript('');
        setShowTranscriptModal(true);
        setIsTranscribing(false);
        console.log('✅ Telugu mode: Audio upload mode, STT skipped, modal shown');
        return; // ← Exit completely - do NOT call AssemblyAI API
      }
      
      const ASSEMBLYAI_API_KEY = process.env.EXPO_PUBLIC_ASSEMBLYAI_API_KEY || '';

      if (!ASSEMBLYAI_API_KEY) {
        console.warn('⚠️ AssemblyAI API key not configured');
        logTranscriptionFailure('apikey_missing', null, null, audioUri);
        Alert.alert(
          'API Key Missing',
          'Speech-to-text API key not configured. Please edit the transcript manually.',
          [{ text: 'OK' }]
        );
        setEditableTranscript('');
        setShowTranscriptModal(true);
        setIsTranscribing(false);
        return;
      }

      // Fetch audio file as blob
      const response = await fetch(audioUri);
      const blob = await response.blob();
      
      // Log audio metadata
      const fileSize = blob.size;
      const audioMeta = { fileSize, duration: 0 };
      setAudioMetadata(audioMeta);
      console.log('📊 Audio file size:', fileSize, 'bytes');

      // Upload to AssemblyAI for transcription
      console.log('📤 Uploading audio to AssemblyAI...');
      const uploadResponse = await fetch('https://api.assemblyai.com/v2/upload', {
        method: 'POST',
        headers: { 'authorization': ASSEMBLYAI_API_KEY },
        body: blob
      });

      const uploadData = await uploadResponse.json();
      const upload_url = uploadData.upload_url;

      if (!upload_url) {
        throw new Error('Failed to upload audio');
      }

      console.log('✅ Audio uploaded successfully');
      console.log('📝 Requesting transcription with user-selected language...');
      
      // Map language selection to language_code
      // AssemblyAI language codes: en, hi, te (short codes, not region-based)
      const languageCodeMap: Record<string, string> = {
        'en': 'en',
        'hi': 'hi', 
        'te': 'te'  // Telugu - must use 'te' not 'te-IN'
      };
      
      const selectedLanguageCode = languageCodeMap[language] || 'en';
      
      console.log('🌐 Language Selection Details:');
      console.log('   User UI Selection: ' + language);
      console.log('   API Language Code: ' + selectedLanguageCode);
      console.log('   Language Label: ' + (languageOptions.find(l => l.code === language)?.label || 'Unknown'));

      // Request transcription with ONLY language_code (no language_detection)
      // AssemblyAI does not allow both language_code and language_detection together
      const transcriptResponse = await fetch('https://api.assemblyai.com/v2/transcript', {
        method: 'POST',
        headers: {
          'authorization': ASSEMBLYAI_API_KEY,
          'content-type': 'application/json'
        },
        body: JSON.stringify({
          audio_url: upload_url,
          language_code: selectedLanguageCode
          // NOTE: Do NOT include language_detection when language_code is specified
          // AssemblyAI API will return 400 error if both are present
          // Verified language codes: 'en', 'hi', 'te' (short form only)
        })
      });

      if (!transcriptResponse.ok) {
        const errorText = await transcriptResponse.text();
        console.error('❌ API Error Response Status:', transcriptResponse.status);
        console.error('❌ API Error Response Body:', errorText);
        throw new Error(`AssemblyAI API Error (${transcriptResponse.status}): ${errorText}`);
      }

      const transcriptData = await transcriptResponse.json();
      console.log('📋 API Response Data:', JSON.stringify(transcriptData).substring(0, 200));
      
      const transcriptId = transcriptData.id;
      
      if (!transcriptId) {
        console.error('❌ No ID in response. Full response:', transcriptData);
        throw new Error(`Failed to initiate transcription - no ID returned. Response: ${JSON.stringify(transcriptData)}`);
      }

      console.log('⏳ Transcript ID:', transcriptId);
      console.log('⏳ Polling for transcription completion...');

      // Poll for completion with extended timeout
      let finalTranscript = '';
      let attempts = 0;
      const maxAttempts = 60; // 60 attempts * 1 second = 60 seconds max
      let detectedLang = language; // Default to user selection
      let confidence = null;

      while (attempts < maxAttempts) {
        const pollingResponse = await fetch(
          `https://api.assemblyai.com/v2/transcript/${transcriptId}`,
          { headers: { 'authorization': ASSEMBLYAI_API_KEY } }
        );

        const pollingData = await pollingResponse.json();
        console.log(`📊 Attempt ${attempts + 1}/${maxAttempts} - Status: ${pollingData.status}`);

        if (pollingData.status === 'completed') {
          finalTranscript = pollingData.text || '';
          
          // Since we're using explicit language_code, the API will use that language model
          // Log the full response to verify language handling
          console.log('✅ Transcription complete');
          console.log('📄 Full API Response:', {
            text: finalTranscript.substring(0, 100),
            language_detected: pollingData.language_detected || 'N/A',
            language_code: selectedLanguageCode,
            text_length: finalTranscript.length,
            confidence: pollingData.confidence || 'N/A'
          });
          console.log('🔤 Transcript length:', finalTranscript.length, 'characters');
          console.log('🌐 Language used (requested):', selectedLanguageCode, '(' + language + ')');
          break;
        } else if (pollingData.status === 'error') {
          const errorMsg = pollingData.error || 'Unknown error';
          console.error('❌ Transcription error:', errorMsg);
          logTranscriptionFailure('transcription_error', language, confidence, audioUri, errorMsg);
          throw new Error(`Transcription failed: ${errorMsg}`);
        }

        // Wait 1 second before next poll
        await new Promise(resolve => setTimeout(resolve, 1000));
        attempts++;
      }

      if (attempts >= maxAttempts) {
        const timeoutMsg = 'Transcription timeout after 60 seconds';
        console.error('❌', timeoutMsg);
        logTranscriptionFailure('timeout', language, null, audioUri);
        throw new Error(timeoutMsg);
      }

      // Store that transcription is complete
      setDetectedLanguage(language); // Set to user-selected language
      setLanguageConfidence(1.0); // 100% confidence since user explicitly selected it

      // Show transcript confirmation modal directly (no language confirmation needed)
      setEditableTranscript(finalTranscript);
      setTranscript(finalTranscript);
      setShowTranscriptModal(true);
      
      // Log successful transcription with detailed language info
      console.log('\n✅ ===== TRANSCRIPTION SUCCESS =====');
      console.log('🌐 Language Code (API): ', selectedLanguageCode);
      console.log('🌐 Language Selection (UI): ', language);
      console.log('📝 Language Label: ', languageOptions.find(l => l.code === language)?.label);
      console.log('🔤 Output length:', finalTranscript.length, 'chars');
      
      // Special logging for Telugu
      if (language === 'te') {
        console.log('\n🇮🇳 TELUGU TRANSCRIPTION DETAILS:');
        console.log('✓ Telugu model was used');
        console.log('✓ First 100 chars: ', finalTranscript.substring(0, 100));
        console.log('✓ Contains Telugu script: ', /[\u0C00-\u0C7F]/.test(finalTranscript) ? 'YES ✓' : 'NO ⚠️');
      }
      console.log('=====================================\n');
      
    } catch (error: any) {
      console.error('\n❌ ===== TRANSCRIPTION FAILED =====');
      console.error('Error Type:', error.constructor.name);
      console.error('Error Message:', error.message);
      console.error('Error Stack:', error.stack?.substring(0, 300));
      
      // Log more details about the failure
      const failureReason = error.message.includes('API Error') ? 'api_error' : 
                           error.message.includes('timeout') ? 'timeout' :
                           error.message.includes('no ID') ? 'missing_response_id' : 'exception';
      
      logTranscriptionFailure(failureReason, language, languageConfidence, audioUri, error.message);
      
      // Show user-friendly error message with action options
      const isAPIError = error.message.includes('API Error');
      const isNetworkError = error.message.includes('Network') || error.message.includes('fetch');
      
      Alert.alert(
        'Transcription Failed',
        isAPIError ? 'API error occurred. Please check your API key configuration and try again.' :
        isNetworkError ? 'Network error. Please check your connection and try again.' :
        'Speech-to-text failed. Please try a different approach.',
        [
          { text: 'Edit Manually', onPress: () => { setEditableTranscript(''); setShowTranscriptModal(true); } },
          { text: 'Try Different Language', onPress: () => { retryRecording(); } },
          { text: 'Skip', onPress: () => { setTranscript(''); } }
        ]
      );
    } finally {
      setIsTranscribing(false);
    }
  };

  const confirmTranscript = () => {
    setTranscript(editableTranscript);
    setShowTranscriptModal(false);
    console.log('✅ Transcript confirmed by miner:', editableTranscript);
  };

  const skipTranscript = () => {
    setTranscript('');
    setShowTranscriptModal(false);
    console.log('⏭️ Transcript skipped by miner');
  };

  const recordAudio = async () => {
    setShowLanguageModal(true);
  };

  const startRecordingWithLanguage = async (lang: 'en' | 'hi' | 'te') => {
    setLanguage(lang);
    setShowLanguageModal(false);
    await startRecording();
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
        setMediaUri(result.assets[0].uri);
        setMediaType('photo');
      }
    } catch (error) {
      console.error('Error taking photo:', error);
      Alert.alert('Error', 'Failed to take photo');
    }
  };

  const recordVideo = async () => {
    try {
      const permissionResult = await ImagePicker.requestCameraPermissionsAsync();

      if (!permissionResult.granted) {
        Alert.alert('Permission Required', 'Permission to access camera is required!');
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Videos,
        allowsEditing: true,
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        setMediaUri(result.assets[0].uri);
        setMediaType('video');
      }
    } catch (error) {
      console.error('Error recording video:', error);
      Alert.alert('Error', 'Failed to record video');
    }
  };

  const handleSubmit = async () => {
    // MANDATORY: Title must be filled
    if (!title.trim()) {
      Alert.alert('Required Field', 'Incident Title is mandatory. Please provide a brief title.');
      return;
    }

    // Description is optional
    const finalTitle = title.trim();

    setLoading(true);

    try {
      const minerId = user.phoneNumber || user.id || user.phone?.replace(/[^0-9]/g, '');
      const minerName = user.name || 'Unknown Miner';

      console.log('\n📋 ===== PREPARING INCIDENT SUBMISSION =====');
      console.log('👤 User Object:', JSON.stringify(user, null, 2));
      console.log('📱 Miner ID (final):', minerId);
      console.log('⚠️ Severity:', severity);

      if (!minerId || minerId === 'unknown') {
        Alert.alert('Login Required', 'Your session is invalid. Please log out and log in again.');
        setLoading(false);
        return;
      }

      let finalMediaUri = mediaUri;
      let finalType: 'photo' | 'video' | 'audio' | 'text' = 'text';
      let finalTranscript = '';

      // Handle audio recording with client-confirmed transcript
      if (audioUri && mediaType === 'audio') {
        console.log('🎤 Processing audio report...');
        finalType = 'audio';
        finalMediaUri = audioUri;
        finalTranscript = transcript; // Use already-confirmed transcript from modal
        console.log('✅ Using confirmed transcript:', finalTranscript);
      } else if (mediaUri) {
        finalType = mediaType || 'photo';
      }

      console.log('📤 Submitting incident...');
      await submitIncident(
        minerId,
        minerName,
        finalType,
        finalTitle,
        description,
        severity,
        finalMediaUri || undefined,
        finalTranscript,
        language
      );

      Alert.alert(
        'Report Submitted',
        'Your incident report has been submitted successfully. Supervisor will review it shortly.',
        [{ text: 'OK', onPress: () => router.back() }]
      );
    } catch (error: any) {
      console.error('❌ Error submitting report:', error);
      Alert.alert('Error', error.message || 'Failed to submit report. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#0A0A0A' }}>
      {/* Header */}
      <View style={{ paddingHorizontal: 24, paddingVertical: 16, flexDirection: 'row', alignItems: 'center', borderBottomWidth: 1, borderBottomColor: '#1F1F1F' }}>
        <TouchableOpacity onPress={() => router.back()}>
          <ArrowLeft size={24} color="#FFFFFF" />
        </TouchableOpacity>
        <Text style={{ color: '#FFFFFF', fontSize: 18, fontWeight: 'bold', marginLeft: 16 }}>
          Report Incident
        </Text>
      </View>

      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 20 }}>
        {/* Info Banner */}
        <View style={{ backgroundColor: '#EF4444' + '15', borderRadius: 12, borderLeftWidth: 4, borderLeftColor: '#EF4444', padding: 16, marginBottom: 24 }}>
          <Text style={{ color: '#EF4444', fontSize: 15, fontWeight: '700', marginBottom: 6 }}>
            Safety First - Report Immediately
          </Text>
          <Text style={{ color: '#E5E5E5', fontSize: 13, lineHeight: 20 }}>
            Incident Title is mandatory. Description and evidence (photo/video/audio) are optional but recommended.
          </Text>
        </View>

        {/* Title Input (MANDATORY) */}
        <View style={{ marginBottom: 20 }}>
          <Text style={{ color: '#E5E5E5', fontSize: 14, fontWeight: '700', marginBottom: 10, letterSpacing: 0.3 }}>
            Incident Title <Text style={{ color: '#EF4444' }}>*</Text>
          </Text>
          <TextInput
            value={title}
            onChangeText={setTitle}
            placeholder="Brief summary (e.g., Gas leak in Shaft A) (required)"
            placeholderTextColor="#525252"
            style={{
              backgroundColor: '#1A1A1A',
              borderWidth: 2,
              borderColor: title.trim() ? '#2A2A2A' : '#EF4444',
              borderRadius: 10,
              padding: 14,
              color: '#FFFFFF',
              fontSize: 15
            }}
          />
          {!title.trim() && (
            <Text style={{ color: '#EF4444', fontSize: 12, marginTop: 6 }}>
              This field is required
            </Text>
          )}
        </View>

        {/* Description Input (Optional) */}
        <View style={{ marginBottom: 20 }}>
          <Text style={{ color: '#E5E5E5', fontSize: 14, fontWeight: '700', marginBottom: 10, letterSpacing: 0.3 }}>
            Description <Text style={{ color: '#737373', fontWeight: '400' }}>(Optional)</Text>
          </Text>
          <TextInput
            value={description}
            onChangeText={setDescription}
            placeholder="Describe what happened in detail"
            placeholderTextColor="#525252"
            multiline
            numberOfLines={5}
            style={{
              backgroundColor: '#1A1A1A',
              borderWidth: 1,
              borderColor: '#2A2A2A',
              borderRadius: 10,
              padding: 14,
              color: '#FFFFFF',
              fontSize: 15,
              height: 130,
              textAlignVertical: 'top'
            }}
          />
        </View>

        {/* Severity Selection (MANDATORY) */}
        <View style={{ marginBottom: 20 }}>
          <Text style={{ color: '#E5E5E5', fontSize: 14, fontWeight: '700', marginBottom: 12, letterSpacing: 0.3 }}>
            Severity Level <Text style={{ color: '#EF4444' }}>*</Text>
          </Text>
          <View style={{ flexDirection: 'row', gap: 10 }}>
            {severityOptions.map((item) => (
              <TouchableOpacity
                key={item.level}
                onPress={() => setSeverity(item.level)}
                style={{
                  flex: 1,
                  backgroundColor: severity === item.level ? item.color + '20' : '#1A1A1A',
                  borderWidth: 2,
                  borderColor: severity === item.level ? item.color : '#2A2A2A',
                  borderRadius: 10,
                  paddingVertical: 14,
                  alignItems: 'center'
                }}
              >
                <Text style={{ 
                  color: severity === item.level ? item.color : '#737373',
                  fontSize: 12,
                  fontWeight: '700',
                  textTransform: 'uppercase'
                }}>
                  {item.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Media Attachment Section (OPTIONAL) */}
        <View style={{ marginBottom: 24 }}>
          <Text style={{ color: '#E5E5E5', fontSize: 14, fontWeight: '700', marginBottom: 14, letterSpacing: 0.3 }}>
            Attach Evidence <Text style={{ color: '#737373', fontWeight: '400' }}>(Optional)</Text>
          </Text>

          {/* Media Preview */}
          {(mediaUri || audioUri) ? (
            <View>
              {mediaUri && mediaType !== 'audio' && (
                <View style={{ marginBottom: 16, position: 'relative', borderRadius: 10, overflow: 'hidden' }}>
                  {mediaType === 'photo' ? (
                    <Image 
                      source={{ uri: mediaUri }} 
                      style={{ width: '100%', height: 220, borderRadius: 10 }}
                      resizeMode="cover"
                    />
                  ) : (
                    <View style={{ 
                      width: '100%', 
                      height: 220, 
                      backgroundColor: '#1A1A1A', 
                      borderRadius: 10, 
                      justifyContent: 'center', 
                      alignItems: 'center',
                      borderWidth: 1,
                      borderColor: '#2A2A2A'
                    }}>
                      <Video size={56} color="#FF6B00" />
                      <Text style={{ color: '#E5E5E5', marginTop: 16, fontSize: 15, fontWeight: '600' }}>
                        Video Selected
                      </Text>
                    </View>
                  )}
                  <TouchableOpacity 
                    onPress={() => { setMediaUri(null); setMediaType(null); }}
                    style={{
                      position: 'absolute',
                      top: 12,
                      right: 12,
                      backgroundColor: '#EF4444',
                      borderRadius: 24,
                      width: 36,
                      height: 36,
                      justifyContent: 'center',
                      alignItems: 'center',
                      shadowColor: '#000',
                      shadowOffset: { width: 0, height: 2 },
                      shadowOpacity: 0.3,
                      shadowRadius: 4,
                      elevation: 5
                    }}
                  >
                    <X size={18} color="#FFFFFF" />
                  </TouchableOpacity>
                </View>
              )}

              {/* Audio Preview */}
              {audioUri && mediaType === 'audio' && (
                <View style={{ marginBottom: 16, backgroundColor: '#1A1A1A', borderRadius: 10, padding: 16, borderWidth: 1, borderColor: '#2A2A2A' }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
                      <Mic size={24} color="#FF6B00" />
                      <Text style={{ color: '#E5E5E5', marginLeft: 12, fontSize: 14, flex: 1 }}>
                        Audio Recorded{'\n'}
                        <Text style={{ color: '#737373', fontSize: 12 }}>
                          {languageOptions.find(l => l.code === language)?.label}
                        </Text>
                      </Text>
                    </View>
                    <TouchableOpacity 
                      onPress={() => { setAudioUri(null); setMediaType(null); }}
                      style={{ padding: 8 }}
                    >
                      <X size={20} color="#EF4444" />
                    </TouchableOpacity>
                  </View>
                </View>
              )}
            </View>
          ) : (
            <View style={{ marginBottom: 16, padding: 16, backgroundColor: '#1A1A1A', borderRadius: 10, borderWidth: 1, borderColor: '#2A2A2A', justifyContent: 'center', alignItems: 'center', height: 100 }}>
              <Text style={{ color: '#737373', fontSize: 15, fontWeight: '500' }}>
                No media attached
              </Text>
            </View>
          )}
        </View>

        {/* Media Options */}
        <View style={{ gap: 10, marginBottom: 28 }}>
          {/* Row 1: Take Photo, Select Image */}
          <View style={{ flexDirection: 'row', gap: 10 }}>
            <TouchableOpacity 
              onPress={takePhoto}
              disabled={loading}
              style={{
                flex: 1,
                backgroundColor: '#1A1A1A',
                borderWidth: 1,
                borderColor: '#2A2A2A',
                borderRadius: 12,
                paddingVertical: 16,
                paddingHorizontal: 12,
                alignItems: 'center',
                opacity: loading ? 0.5 : 1
              }}
            >
              <Camera size={24} color="#FF6B00" />
              <Text style={{ color: '#E5E5E5', fontSize: 12, fontWeight: '600', marginTop: 8, textAlign: 'center' }}>
                Take Photo
              </Text>
            </TouchableOpacity>

            <TouchableOpacity 
              onPress={pickImage}
              disabled={loading}
              style={{
                flex: 1,
                backgroundColor: '#1A1A1A',
                borderWidth: 1,
                borderColor: '#2A2A2A',
                borderRadius: 12,
                paddingVertical: 16,
                paddingHorizontal: 12,
                alignItems: 'center',
                opacity: loading ? 0.5 : 1
              }}
            >
              <Upload size={24} color="#FF6B00" />
              <Text style={{ color: '#E5E5E5', fontSize: 12, fontWeight: '600', marginTop: 8, textAlign: 'center' }}>
                Select Image
              </Text>
            </TouchableOpacity>
          </View>

          {/* Row 2: Record Video, Select Video */}
          <View style={{ flexDirection: 'row', gap: 10 }}>
            <TouchableOpacity 
              onPress={recordVideo}
              disabled={loading}
              style={{
                flex: 1,
                backgroundColor: '#1A1A1A',
                borderWidth: 1,
                borderColor: '#2A2A2A',
                borderRadius: 12,
                paddingVertical: 16,
                paddingHorizontal: 12,
                alignItems: 'center',
                opacity: loading ? 0.5 : 1
              }}
            >
              <Video size={24} color="#FF6B00" />
              <Text style={{ color: '#E5E5E5', fontSize: 12, fontWeight: '600', marginTop: 8, textAlign: 'center' }}>
                Record Video
              </Text>
            </TouchableOpacity>

            <TouchableOpacity 
              onPress={pickVideo}
              disabled={loading}
              style={{
                flex: 1,
                backgroundColor: '#1A1A1A',
                borderWidth: 1,
                borderColor: '#2A2A2A',
                borderRadius: 12,
                paddingVertical: 16,
                paddingHorizontal: 12,
                alignItems: 'center',
                opacity: loading ? 0.5 : 1
              }}
            >
              <Upload size={24} color="#FF6B00" />
              <Text style={{ color: '#E5E5E5', fontSize: 12, fontWeight: '600', marginTop: 8, textAlign: 'center' }}>
                Select Video
              </Text>
            </TouchableOpacity>
          </View>

          {/* Row 3: Record/Stop Audio */}
          <View style={{ flexDirection: 'row', gap: 10 }}>
            {isRecording ? (
              <TouchableOpacity 
                onPress={stopRecording}
                style={{
                  flex: 1,
                  backgroundColor: '#EF4444',
                  borderWidth: 1,
                  borderColor: '#DC2626',
                  borderRadius: 12,
                  paddingVertical: 16,
                  paddingHorizontal: 12,
                  alignItems: 'center'
                }}
              >
                <Pause size={24} color="#FFFFFF" />
                <Text style={{ color: '#FFFFFF', fontSize: 12, fontWeight: '600', marginTop: 8, textAlign: 'center' }}>
                  Stop Recording
                </Text>
              </TouchableOpacity>
            ) : (
              <TouchableOpacity 
                onPress={recordAudio}
                disabled={loading}
                style={{
                  flex: 1,
                  backgroundColor: '#1A1A1A',
                  borderWidth: 1,
                  borderColor: '#2A2A2A',
                  borderRadius: 12,
                  paddingVertical: 16,
                  paddingHorizontal: 12,
                  alignItems: 'center',
                  opacity: loading ? 0.5 : 1
                }}
              >
                <Mic size={24} color="#FF6B00" />
                <Text style={{ color: '#E5E5E5', fontSize: 12, fontWeight: '600', marginTop: 8, textAlign: 'center' }}>
                  Record Audio
                </Text>
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* Submit Button */}
        <TouchableOpacity
          onPress={handleSubmit}
          disabled={loading || !description.trim()}
          style={{
            backgroundColor: description.trim() && !loading ? '#FF6B00' : '#3A3A3A',
            borderRadius: 12,
            padding: 18,
            alignItems: 'center',
            marginBottom: 24,
            shadowColor: '#FF6B00',
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: description.trim() ? 0.3 : 0,
            shadowRadius: 8,
            elevation: description.trim() ? 4 : 0
          }}
        >
          {loading ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <Text style={{ color: '#FFFFFF', fontSize: 16, fontWeight: '700' }}>
              Submit Report
            </Text>
          )}
        </TouchableOpacity>
      </ScrollView>

      {/* Language Selection Modal */}
      <Modal
        visible={showLanguageModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowLanguageModal(false)}
      >
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.8)', justifyContent: 'flex-end' }}>
          <View style={{ backgroundColor: '#1F1F1F', borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24 }}>
            <Text style={{ color: '#FFFFFF', fontSize: 20, fontWeight: 'bold', marginBottom: 8 }}>
              Select Language for Recording
            </Text>
            <Text style={{ color: '#737373', fontSize: 14, marginBottom: 20 }}>
              Choose the language you&apos;ll be speaking in
            </Text>
            {languageOptions.map((lang) => (
              <TouchableOpacity
                key={lang.code}
                onPress={() => startRecordingWithLanguage(lang.code)}
                style={{
                  backgroundColor: '#141414',
                  borderRadius: 12,
                  padding: 16,
                  marginBottom: 12,
                  flexDirection: 'row',
                  alignItems: 'center',
                  borderWidth: 1,
                  borderColor: '#2A2A2A'
                }}
              >
                <Text style={{ fontSize: 32, marginRight: 12 }}>{lang.flag}</Text>
                <View style={{ flex: 1 }}>
                  <Text style={{ color: '#FFFFFF', fontSize: 16, fontWeight: '600' }}>
                    {lang.label}
                  </Text>
                  <Text style={{ color: '#737373', fontSize: 12, marginTop: 4 }}>
                    {lang.description}
                  </Text>
                </View>
              </TouchableOpacity>
            ))}
            <TouchableOpacity
              onPress={() => setShowLanguageModal(false)}
              style={{
                backgroundColor: '#2A2A2A',
                borderRadius: 12,
                padding: 16,
                alignItems: 'center',
                marginTop: 8,
                borderWidth: 1,
                borderColor: '#3A3A3A'
              }}
            >
              <Text style={{ color: '#FFFFFF', fontSize: 16, fontWeight: '600' }}>
                Cancel
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Language Confidence Confirmation Modal */}
      <Modal
        visible={showLanguageConfirmation}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowLanguageConfirmation(false)}
      >
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.9)', justifyContent: 'flex-end' }}>
          <View style={{ backgroundColor: '#1F1F1F', borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24 }}>
            <Text style={{ color: '#FFFFFF', fontSize: 20, fontWeight: 'bold', marginBottom: 12 }}>
              Confirm Language
            </Text>
            <Text style={{ color: '#737373', fontSize: 14, marginBottom: 20 }}>
              We detected your speech language. Please confirm:
            </Text>
            
            {/* User Selected Language */}
            <View style={{ backgroundColor: '#0A0A0A', borderRadius: 12, padding: 16, marginBottom: 16, borderWidth: 1, borderColor: '#2A2A2A' }}>
              <Text style={{ color: '#737373', fontSize: 12, marginBottom: 4 }}>You selected:</Text>
              <Text style={{ color: '#FF6B00', fontSize: 18, fontWeight: 'bold' }}>
                {languageOptions.find(l => l.code === language)?.label}
              </Text>
            </View>

            {/* Detected Language */}
            <View style={{ backgroundColor: '#0A0A0A', borderRadius: 12, padding: 16, marginBottom: 20, borderWidth: 1, borderColor: '#3B82F6' }}>
              <Text style={{ color: '#737373', fontSize: 12, marginBottom: 4 }}>We detected:</Text>
              <Text style={{ color: '#3B82F6', fontSize: 18, fontWeight: 'bold' }}>
                {languageOptions.find(l => l.code === suggestedLanguage)?.label}
              </Text>
              {languageConfidence && (
                <Text style={{ color: '#10B981', fontSize: 12, marginTop: 8 }}>
                  Confidence: {(languageConfidence * 100).toFixed(1)}%
                </Text>
              )}
            </View>

            <View style={{ gap: 12 }}>
              <TouchableOpacity
                onPress={confirmLanguageAndProceed}
                style={{
                  backgroundColor: '#10B981',
                  borderRadius: 12,
                  padding: 16,
                  alignItems: 'center'
                }}
              >
                <Text style={{ color: '#FFFFFF', fontSize: 16, fontWeight: '600' }}>
                  ✓ Confirm & Continue
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={changeLanguageAndRetry}
                style={{
                  backgroundColor: '#F59E0B',
                  borderRadius: 12,
                  padding: 16,
                  alignItems: 'center'
                }}
              >
                <Text style={{ color: '#FFFFFF', fontSize: 16, fontWeight: '600' }}>
                  🔄 Try Different Language
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => setShowLanguageConfirmation(false)}
                style={{
                  backgroundColor: '#2A2A2A',
                  borderRadius: 12,
                  padding: 16,
                  alignItems: 'center',
                  borderWidth: 1,
                  borderColor: '#3A3A3A'
                }}
              >
                <Text style={{ color: '#FFFFFF', fontSize: 16, fontWeight: '600' }}>
                  Cancel
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Transcript Confirmation Modal */}
      <Modal
        visible={showTranscriptModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => skipTranscript()}
      >
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.9)', justifyContent: 'flex-end' }}>
          <View style={{ backgroundColor: '#1F1F1F', borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, maxHeight: '90%' }}>
            <Text style={{ color: '#FFFFFF', fontSize: 20, fontWeight: 'bold', marginBottom: 8 }}>
              Review Transcript
            </Text>
            
            {/* Language Info Bar */}
            {!isTranscribing && (
              <View style={{ backgroundColor: '#0A0A0A', borderRadius: 8, padding: 12, marginBottom: 16, flexDirection: 'row', alignItems: 'center', gap: 12, borderLeftWidth: 3, borderLeftColor: '#FF6B00' }}>
                <View style={{ flex: 1 }}>
                  <Text style={{ color: '#737373', fontSize: 12 }}>Detected language:</Text>
                  <Text style={{ color: '#FFFFFF', fontSize: 14, fontWeight: '600', marginTop: 2 }}>
                    {languageOptions.find(l => l.code === language)?.nativeLabel}
                  </Text>
                </View>
                {languageConfidence && (
                  <View style={{ alignItems: 'flex-end' }}>
                    <Text style={{ color: '#10B981', fontSize: 12, fontWeight: '600' }}>
                      {(languageConfidence * 100).toFixed(1)}%
                    </Text>
                    <Text style={{ color: '#737373', fontSize: 10 }}>Confidence</Text>
                  </View>
                )}
              </View>
            )}

            {isTranscribing ? (
              <View style={{ alignItems: 'center', justifyContent: 'center', paddingVertical: 40 }}>
                <ActivityIndicator size="large" color="#FF6B00" />
                <Text style={{ color: '#E5E5E5', marginTop: 16, fontSize: 15, fontWeight: '600' }}>
                  Transcribing audio...
                </Text>
              </View>
            ) : language === 'te' ? (
              // ⏭️ Telugu transcription disabled - show message instead of TextInput
              <View style={{ backgroundColor: '#0A0A0A', borderRadius: 12, padding: 20, marginBottom: 20, borderWidth: 2, borderColor: '#FF6B00' }}>
                <View style={{ alignItems: 'center', marginBottom: 16 }}>
                  <Mic size={32} color="#FF6B00" />
                  <Text style={{ color: '#FFFFFF', fontSize: 18, fontWeight: 'bold', marginTop: 12, textAlign: 'center' }}>
                    తెలుగు Transcription Not Supported
                  </Text>
                </View>
                <Text style={{ color: '#E5E5E5', fontSize: 14, lineHeight: 20, textAlign: 'center', marginBottom: 16 }}>
                  Telugu transcription is not currently supported. Your audio has been recorded and uploaded successfully.
                </Text>
                <View style={{ backgroundColor: '#1A1A1A', borderRadius: 8, padding: 12, borderWidth: 1, borderColor: '#2A2A2A' }}>
                  <Text style={{ color: '#10B981', fontSize: 13, fontWeight: '600', textAlign: 'center' }}>
                    ✓ Audio file uploaded and saved
                  </Text>
                </View>
              </View>
            ) : (
              // ✅ Hindi and English - show transcript TextInput (normal flow)
              <>
                <TextInput
                  value={editableTranscript}
                  onChangeText={setEditableTranscript}
                  placeholder="Transcript will appear here..."
                  placeholderTextColor="#525252"
                  multiline
                  numberOfLines={6}
                  style={{
                    backgroundColor: '#0A0A0A',
                    borderWidth: 1,
                    borderColor: '#2A2A2A',
                    borderRadius: 12,
                    padding: 14,
                    color: '#FFFFFF',
                    fontSize: 15,
                    height: 160,
                    textAlignVertical: 'top',
                    marginBottom: 20
                  }}
                />

                <View style={{ gap: 12 }}>
                  <TouchableOpacity
                    onPress={confirmTranscript}
                    style={{
                      backgroundColor: '#10B981',
                      borderRadius: 12,
                      padding: 16,
                      alignItems: 'center'
                    }}
                  >
                    <Text style={{ color: '#FFFFFF', fontSize: 16, fontWeight: '700' }}>
                      ✓ Confirm Transcript
                    </Text>
                  </TouchableOpacity>

                  <View style={{ flexDirection: 'row', gap: 12 }}>
                    <TouchableOpacity
                      onPress={retryRecording}
                      style={{
                        flex: 1,
                        backgroundColor: '#F59E0B',
                        borderRadius: 12,
                        padding: 16,
                        alignItems: 'center'
                      }}
                    >
                      <Text style={{ color: '#FFFFFF', fontSize: 14, fontWeight: '600' }}>
                        🔄 Try Again
                      </Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      onPress={skipTranscript}
                      style={{
                        flex: 1,
                        backgroundColor: '#2A2A2A',
                        borderRadius: 12,
                        padding: 16,
                        alignItems: 'center',
                        borderWidth: 1,
                        borderColor: '#3A3A3A'
                      }}
                    >
                      <Text style={{ color: '#FFFFFF', fontSize: 14, fontWeight: '600' }}>
                        ⏭️ Skip
                      </Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </>
            )}
            
            {/* ⏭️ Telugu-specific buttons - shown when language is Telugu */}
            {language === 'te' && !isTranscribing && (
              <View style={{ gap: 12 }}>
                <TouchableOpacity
                  onPress={() => {
                    setShowTranscriptModal(false);
                    setTranscript('');
                    console.log('✓ Telugu audio uploaded without transcription');
                  }}
                  style={{
                    backgroundColor: '#10B981',
                    borderRadius: 12,
                    padding: 16,
                    alignItems: 'center'
                  }}
                >
                  <Text style={{ color: '#FFFFFF', fontSize: 16, fontWeight: '700' }}>
                    ✓ Continue
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={() => {
                    setShowTranscriptModal(false);
                    retryRecording();
                  }}
                  style={{
                    backgroundColor: '#3B82F6',
                    borderRadius: 12,
                    padding: 16,
                    alignItems: 'center'
                  }}
                >
                  <Text style={{ color: '#FFFFFF', fontSize: 14, fontWeight: '600' }}>
                    🔄 Record in Different Language
                  </Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}
