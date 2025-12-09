import AsyncStorage from '@react-native-async-storage/async-storage';
import { AVPlaybackStatus, ResizeMode, Video } from 'expo-av';
import { File, Paths } from 'expo-file-system';
import * as MediaLibrary from 'expo-media-library';
import { useRouter } from 'expo-router';
import * as Sharing from 'expo-sharing';
import React, { useEffect, useRef, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    Modal,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ArrowLeft, CheckCircle, Film, Globe, Sparkles, Video as VideoIcon } from '@/components/Icons';
import { COLORS } from '@/constants/styles';
import { Timestamp } from 'firebase/firestore';
import { useRoleStore } from '../../hooks/useRoleStore';
import { generateVideoDescription } from '../../services/geminiService';
import { VideoLibraryService, VideoDocument } from '../../services/videoLibraryService';
import { getVideoApiUrl, getVideoGenerateUrl, getVideoStatusUrl } from '@/config/apiConfig';

interface GenerationStage {
  name: string;
  status: 'pending' | 'in-progress' | 'completed' | 'error';
  message?: string;
}

interface VideoHistory {
  id: string;
  topic: string;
  language: string;
  videoUrl: string;
  timestamp: number;
}

export default function VideoGenerationModule() {
  const router = useRouter();
  const videoRef = useRef<any>(null);
  const [selectedLanguage, setSelectedLanguage] = useState<string>('');
  const [topic, setTopic] = useState<string>('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedVideoUrl, setGeneratedVideoUrl] = useState<string>('');
  const [showLanguageModal, setShowLanguageModal] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [videoHistory, setVideoHistory] = useState<VideoHistory[]>([]);
  const [showVideoLibrary, setShowVideoLibrary] = useState(false);
  const [videoError, setVideoError] = useState<string>('');
  const [videoLoading, setVideoLoading] = useState(false);
  const [currentRequestId, setCurrentRequestId] = useState<string | null>(null);
  
  // Load video history and check for pending request data on mount
  useEffect(() => {
    loadVideoHistory();
    loadPendingRequest();
  }, []);

  // Authentication check removed - using role-based access from useRoleStore
  // Users access this module through their dashboard which already validates roles

  const loadVideoHistory = async () => {
    try {
      const history = await AsyncStorage.getItem('videoHistory');
      if (history) {
        setVideoHistory(JSON.parse(history));
      }
    } catch (error) {
      console.error('Error loading video history:', error);
    }
  };

  const loadPendingRequest = async () => {
    try {
      const pendingRequestData = await AsyncStorage.getItem('pendingVideoRequest');
      if (pendingRequestData) {
        const requestData = JSON.parse(pendingRequestData);
        
        // Auto-fill the form
        setTopic(requestData.topic || '');
        setSelectedLanguage(requestData.language || '');
        setCurrentRequestId(requestData.requestId || null);
        
        console.log('📋 Loaded pending request:', requestData);
        console.log('📋 Set currentRequestId to:', requestData.requestId);
        
        // DON'T clear the pending request data here - keep it until video is completed
        // await AsyncStorage.removeItem('pendingVideoRequest');
        
        // Show notification to user
        Alert.alert(
          '📋 Request Auto-Filled',
          `Topic and language have been filled from the accepted request.\\n\\nTopic: ${requestData.topic}\\nLanguage: ${getLanguageName(requestData.language)}`,
          [{ text: 'Got it!' }]
        );
      }
    } catch (error) {
      console.error('Error loading pending request:', error);
    }
  };

  const getLanguageName = (code: string) => {
    const languages: { [key: string]: string } = {
      'en': 'English',
      'hi': 'Hindi',
      'te': 'Telugu',
      'ta': 'Tamil',
      'mr': 'Marathi',
      'bn': 'Bengali',
      'gu': 'Gujarati',
      'kn': 'Kannada',
      'ml': 'Malayalam',
      'pa': 'Punjabi',
      'or': 'Odia',
    };
    return languages[code] || code;
  };

  const saveVideoToHistory = async (videoUrl: string) => {
    try {
      const newVideo: VideoHistory = {
        id: Date.now().toString(),
        topic,
        language: selectedLanguage,
        videoUrl,
        timestamp: Date.now(),
      };
      const updatedHistory = [newVideo, ...videoHistory].slice(0, 20); // Keep last 20 videos
      setVideoHistory(updatedHistory);
      await AsyncStorage.setItem('videoHistory', JSON.stringify(updatedHistory));
    } catch (error) {
      console.error('Error saving video to history:', error);
    }
  };

  const downloadVideo = async () => {
    try {
      // Request permissions
      const { status } = await MediaLibrary.requestPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Required', 'Please grant media library permissions to download videos.');
        return;
      }

      Alert.alert('Downloading', 'Video download started...');

      // Download video to cache directory using new API
      const fileName = `mining_safety_${Date.now()}.mp4`;
      const file = new File(Paths.cache, fileName);
      
      // Download the video file
      const response = await fetch(generatedVideoUrl);
      
      // React Native blob doesn't have arrayBuffer(), use FileReader approach
      const blob = await response.blob();
      
      // Convert blob to array buffer using FileReader
      const arrayBuffer = await new Promise<ArrayBuffer>((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => {
          const result = reader.result;
          if (result instanceof ArrayBuffer) {
            resolve(result);
          } else {
            reject(new Error('Failed to read blob as ArrayBuffer'));
          }
        };
        reader.onerror = reject;
        reader.readAsArrayBuffer(blob);
      });
      
      const uint8Array = new Uint8Array(arrayBuffer);
      
      // Write to file
      await file.write(uint8Array);

      // Save to media library
      const asset = await MediaLibrary.createAssetAsync(file.uri);
      await MediaLibrary.createAlbumAsync('Mining Safety Videos', asset, false);
      
      // Clean up cache
      await file.delete();
      
      Alert.alert('Success', 'Video downloaded successfully to your gallery!');
    } catch (error) {
      console.error('Download error:', error);
      // Fallback to sharing if download fails
      try {
        const isAvailable = await Sharing.isAvailableAsync();
        if (isAvailable) {
          const fileName = `mining_safety_${Date.now()}.mp4`;
          const file = new File(Paths.cache, fileName);
          
          const response = await fetch(generatedVideoUrl);
          const blob = await response.blob();
          
          // Convert blob to array buffer using FileReader
          const arrayBuffer = await new Promise<ArrayBuffer>((resolve, reject) => {
            const reader = new FileReader();
            reader.onloadend = () => {
              const result = reader.result;
              if (result instanceof ArrayBuffer) {
                resolve(result);
              } else {
                reject(new Error('Failed to read blob as ArrayBuffer'));
              }
            };
            reader.onerror = reject;
            reader.readAsArrayBuffer(blob);
          });
          
          const uint8Array = new Uint8Array(arrayBuffer);
          
          await file.write(uint8Array);
          await Sharing.shareAsync(file.uri);
          await file.delete();
        } else {
          Alert.alert('Error', 'Unable to download video. Please try again.');
        }
      } catch (shareError) {
        Alert.alert('Error', 'Unable to download or share video.');
      }
    }
  };

  const saveToLibrary = async () => {
    console.log('📚 saveToLibrary called');
    console.log('📚 currentRequestId:', currentRequestId);
    
    try {
      // Show loading alert
      Alert.alert('Processing', 'Generating AI description for your video...');

      // Get current user from role store
      const { user } = useRoleStore.getState();
      const currentUserId = user.id || user.phone || 'safety-officer';

      // Generate AI description using Gemini
      console.log('🤖 Generating AI description with Gemini...');
      const aiDescription = await generateVideoDescription({
        topic,
        language: selectedLanguage,
        videoUrl: generatedVideoUrl,
      });

      console.log('✅ AI Description generated:', aiDescription);

      // Upload video to Firebase Storage for global access
      Alert.alert('Uploading', 'Uploading video to cloud storage...');
      console.log('📤 Uploading video to Firebase Storage...');
      
      const fileName = `${topic.trim().replace(/\s+/g, '_')}_${Date.now()}.mp4`;
      const globalVideoUrl = await VideoLibraryService.uploadVideoToStorage(generatedVideoUrl, fileName);
      
      console.log('✅ Video uploaded! Global URL:', globalVideoUrl);

      // Delete the local video file from server after successful upload
      console.log('🗑️ Cleaning up local video file...');
      await VideoLibraryService.deleteVideoFromServer(generatedVideoUrl);

      // Generate AI title using Gemini
      console.log('🤖 Generating AI title with Gemini...');
      Alert.alert('AI Processing', 'Generating professional title...');
      
      let aiTitle = topic.trim();
      try {
        const titlePrompt = `Create a professional, clear title (40-60 characters) for a mining safety training video about: "${topic}". 

Requirements:
- Must be specific and descriptive
- Use proper capitalization
- Focus on safety and training
- Make it engaging for miners
- Return ONLY the title text, no quotes or extra formatting

Example format: "Proper PPE Usage in Underground Mining Operations"`;
        
        const response = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=AIzaSyD3FRdf4bg8s7W5h3hkZXEbXNI4GTQO1vI`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              contents: [{ parts: [{ text: titlePrompt }] }],
              generationConfig: {
                maxOutputTokens: 60,
                temperature: 0.8,
              },
            }),
          }
        );

        const data = await response.json();
        const generatedTitle = data.candidates?.[0]?.content?.parts?.[0]?.text?.trim();
        if (generatedTitle) {
          aiTitle = generatedTitle.replace(/["'`]/g, '').trim().substring(0, 80);
          console.log('✅ AI Title generated:', aiTitle);
          
          // Update the topic field to show the AI-generated title
          setTopic(aiTitle);
        }
      } catch (error) {
        console.warn('⚠️ Failed to generate AI title, using original:', error);
      }

      // Create comprehensive video document
      // Note: Don't include fields with undefined values - Firestore doesn't support them
      const videoData: Omit<VideoDocument, 'id' | 'createdAt' | 'updatedAt'> = {
        topic: aiTitle, // Use AI-generated title
        description: aiDescription.description, // Add AI description
        language: selectedLanguage,
        languageName: getSelectedLanguageName(),
        videoUrl: globalVideoUrl, // Use Firebase Storage URL instead of local URL
        // thumbnailUrl: omitted (optional field)
        transcript: aiDescription.transcript || `Training video on ${topic}`,
        // duration: omitted (optional field)
        // fileSize: omitted (optional field)
        createdBy: currentUserId,
        status: 'active' as const,
        tags: aiDescription.tags,
        availableLanguages: [selectedLanguage],
        metadata: {
          resolution: '1080p',
          format: 'mp4',
          encoding: 'H.264',
        },
        statistics: {
          totalViews: 0,
          totalAssignments: 0,
          completionRate: 0,
          averageRating: 0,
        },
      };

      // Save to Firestore
      Alert.alert('Saving', 'Saving video metadata...');
      console.log('💾 Saving video to Firestore...');
      const videoId = await VideoLibraryService.createVideo(videoData);
      console.log('✅ Video saved to Firestore with ID:', videoId);

      // Update video request status if this was generated from a request
      if (currentRequestId) {
        console.log('📝 Updating video request status for ID:', currentRequestId);
        console.log('📝 Request ID type:', typeof currentRequestId);
        console.log('📝 Request ID length:', currentRequestId?.length);
        console.log('📝 Request ID value:', JSON.stringify(currentRequestId));
        
        // Validate requestId format (should be a Firestore document ID)
        if (!currentRequestId || typeof currentRequestId !== 'string' || currentRequestId.length === 0) {
          console.error('❌ Invalid currentRequestId:', currentRequestId);
          console.warn('⚠️ Skipping request status update due to invalid ID');
          // Don't return - continue with video save
        } else {
          try {
            console.log('📝 Marking video request as completed...');
            await VideoLibraryService.completeVideoRequest(currentRequestId, videoId);
            console.log('✅ Video request marked as completed successfully');

            // Create assignments for miners if specified in the request
            const requestDetails = await VideoLibraryService.getVideoRequestById(currentRequestId);
            if (requestDetails?.minerIds && requestDetails.minerIds.length > 0) {
              console.log('👥 Creating assignments for miners:', requestDetails.minerIds);
              for (const minerId of requestDetails.minerIds) {
                try {
                  const assignmentData = {
                    videoId: videoId,
                    videoTopic: aiTitle,
                    assignedTo: [minerId],
                    assignedBy: currentUserId,
                    deadline: Timestamp.fromDate(new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)), // 7 days from now
                    isMandatory: true,
                    isDailyTask: false,
                    departments: [], // Will be populated based on miner data
                    description: `Auto-assigned video for work: ${requestDetails.description}`,
                    status: 'active' as const,
                    priority: 'high' as const,
                  };

                  await VideoLibraryService.createAssignment(assignmentData);
                  console.log('✅ Assignment created for miner:', minerId);
                } catch (assignmentError) {
                  console.error('❌ Failed to create assignment for miner:', minerId, assignmentError);
                }
              }
              console.log('✅ All assignments created successfully');

              // Notify the supervisor that video is ready and assignments created
              try {
                await VideoLibraryService.createNotification({
                  userId: requestDetails.requestedBy,
                  title: 'Video Generated & Assigned',
                  message: `Video "${aiTitle}" has been generated and assigned to ${requestDetails.minerIds.length} miner(s) for the requested work.`,
                  type: 'success',
                  relatedId: videoId,
                  actionUrl: '/supervisor/SmartWorkAssignment',
                });
                console.log('✅ Notification sent to supervisor');
              } catch (notificationError) {
                console.error('❌ Failed to send notification:', notificationError);
              }
            }

            setCurrentRequestId(null); // Clear the request ID
            
            // Clear the pending request data only after successful completion
            await AsyncStorage.removeItem('pendingVideoRequest');
          } catch (requestError) {
            console.error('❌ Failed to update video request:', requestError);
            // Don't fail the whole process for this
          }
        }
      }

      // Also save to local AsyncStorage for backward compatibility
      const videoEntry = {
        id: videoId,
        topic: topic,
        language: selectedLanguage,
        languageName: getSelectedLanguageName(),
        videoUrl: generatedVideoUrl,
        timestamp: Date.now(),
        description: aiDescription.description,
        tags: aiDescription.tags,
        keyPoints: aiDescription.keyPoints,
      };

      const existingLibrary = await AsyncStorage.getItem('videoLibrary');
      const libraryVideos = existingLibrary ? JSON.parse(existingLibrary) : [];
      libraryVideos.unshift(videoEntry);
      await AsyncStorage.setItem('videoLibrary', JSON.stringify(libraryVideos));

      Alert.alert(
        '✅ Video Created Successfully',
        `Your training video is ready!\n\n🤖 AI-Generated Title:\n"${aiTitle}"\n\n🌐 Language: ${videoData.languageName}\n📚 Tags: ${aiDescription.tags.slice(0, 3).join(', ')}\n\nThe video is now available in the library and can be assigned to miners.`,
        [
          {
            text: 'View Library',
            onPress: () => router.push('/safety-officer/VideoLibrary'),
          },
          { 
            text: 'Generate Another', 
            onPress: () => {
              setGeneratedVideoUrl('');
              setTopic('');
              setSelectedLanguage('');
            }
          },
        ]
      );
    } catch (error) {
      console.error('Save to library error:', error);
      Alert.alert('Error', 'Failed to save video to library. Please try again.');
    }
  };

  const discardVideo = () => {
    Alert.alert(
      'Discard Video',
      'Are you sure you want to discard this video? It will not be saved to the library.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Discard',
          style: 'destructive',
          onPress: () => {
            setGeneratedVideoUrl('');
            setTopic('');
            setSelectedLanguage('');
            setIsPlaying(false);
            setStages(prev => prev.map(stage => ({ ...stage, status: 'pending', message: undefined })));
          },
        },
      ]
    );
  };

  const [stages, setStages] = useState<GenerationStage[]>([
    { name: 'Scene Breakdown', status: 'pending' },
    { name: 'Image Generation', status: 'pending' },
    { name: 'Animation Creation', status: 'pending' },
    { name: 'Voiceover Generation', status: 'pending' },
    { name: 'Video Assembly', status: 'pending' },
  ]);

  const languages = [
    { code: 'en', name: 'English', flag: '🇬🇧', native: 'English' },
    { code: 'hi', name: 'Hindi', flag: '🇮🇳', native: 'हिंदी' },
    { code: 'te', name: 'Telugu', flag: '🇮🇳', native: 'తెలుగు' },
  ];

  const exampleTopics = [
    'PPE Safety in Mines',
    'Gas Leak Protocol',
    'Hazard Detection Underground',
    'Emergency Exit Procedure',
    'Proper Ventilation Systems',
    'Rock Fall Prevention',
  ];

  const handleLanguageSelect = (code: string) => {
    setSelectedLanguage(code);
    setShowLanguageModal(false);
  };

  const updateStageStatus = (stageIndex: number, status: GenerationStage['status'], message?: string) => {
    setStages(prev => prev.map((stage, idx) => 
      idx === stageIndex ? { ...stage, status, message } : stage
    ));
  };

  const startVideoGeneration = async () => {
    if (!selectedLanguage) {
      Alert.alert('Language Required', 'Please select a language before generating video');
      return;
    }
    
    if (!topic.trim()) {
      Alert.alert('Topic Required', 'Please enter a mining safety topic');
      return;
    }

    // Check for duplicate video BEFORE starting generation
    try {
      console.log('🔍 Checking for duplicate video before generation...');
      const existingVideo = await VideoLibraryService.checkDuplicateVideo(topic.trim(), selectedLanguage);
      
      if (existingVideo) {
        Alert.alert(
          '📹 Video Already Exists',
          `A training video with this exact topic already exists in your library:\n\n` +
          `📝 Topic: "${topic}"\n` +
          `🌐 Language: ${getSelectedLanguageName()}\n` +
          `📅 Created: ${existingVideo.createdAt.toDate().toLocaleDateString()}\n\n` +
          `Generating a duplicate video will consume resources. Consider using the existing video or modifying your topic.\n\n` +
          `Would you like to proceed anyway?`,
          [
            { 
              text: 'Cancel',
              style: 'cancel'
            },
            {
              text: 'Generate New Version',
              style: 'default',
              onPress: () => proceedWithGeneration(),
            },
          ]
        );
        return;
      }

      // No duplicate, proceed with generation
      await proceedWithGeneration();
    } catch (error) {
      console.error('Error checking for duplicate:', error);
      Alert.alert('Error', 'Failed to check for duplicates. Please try again.');
    }
  };

  const proceedWithGeneration = async () => {
    setIsGenerating(true);
    setGeneratedVideoUrl('');
    setVideoError('');
    setVideoLoading(false);
    
    // Reset all stages
    setStages(prev => prev.map(stage => ({ ...stage, status: 'pending', message: undefined })));

    try {
      const apiUrl = getVideoGenerateUrl();
      console.log('🚀 Starting video generation...');
      console.log('📝 Topic:', topic.trim());
      console.log('🌐 Language:', selectedLanguage);
      console.log('🌐 API URL:', apiUrl);
      console.log('🌐 Environment IP:', process.env.EXPO_PUBLIC_IP_ADDRESS);
      
      // Create AbortController for timeout (5 minutes for initial request)
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 300000); // 5 min timeout
      
      try {
        // Call backend API endpoint (no authentication required)
        const response = await fetch(apiUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            topic: topic.trim(),
            language: selectedLanguage,
          }),
          signal: controller.signal,
        });
        
        clearTimeout(timeoutId);

        console.log('📡 API Response Status:', response.status);
        
        if (!response.ok) {
          const errorText = await response.text();
          console.error('❌ API Error Response:', errorText);
          throw new Error(`Failed to start video generation: ${response.status} ${response.statusText}`);
        }

        const data = await response.json();
        console.log('✅ API Response Data:', data);
        
        // Poll for progress updates
        pollGenerationProgress(data.jobId);
        
      } catch (fetchError) {
        clearTimeout(timeoutId);
        if (fetchError instanceof Error && fetchError.name === 'AbortError') {
          throw new Error('Request timed out after 5 minutes. Server may be too slow or offline.');
        }
        throw fetchError;
      }
      
    } catch (error) {
      console.error('❌ Video generation error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      const currentApiUrl = getVideoApiUrl();
      
      Alert.alert(
        'Connection Error', 
        `Failed to start video generation:\n${errorMessage}\n\nTroubleshooting:\n• Backend server: ${currentApiUrl}\n• Check server is running (port 4000)\n• Ensure same Wi-Fi network\n• Check firewall settings\n• Current IP: ${process.env.EXPO_PUBLIC_IP_ADDRESS || '172.16.58.121'}`,
        [
          { text: 'OK' },
          { 
            text: 'Retry', 
            onPress: () => proceedWithGeneration()
          }
        ]
      );
      setIsGenerating(false);
    }
  };

  const pollGenerationProgress = async (jobId: string) => {
    const pollInterval = setInterval(async () => {
      try {
        console.log('🔄 Polling progress for job:', jobId);
        
        const statusUrl = getVideoStatusUrl(jobId);
        console.log('📡 Status URL:', statusUrl);
        
        const response = await fetch(statusUrl, {
          headers: {
            'Content-Type': 'application/json',
          },
        });

        console.log('📡 Status Response Status:', response.status);
        
        if (!response.ok) {
          const errorText = await response.text();
          console.error('❌ Status API Error:', errorText);
          throw new Error(`Failed to get status: ${response.status} ${response.statusText}`);
        }

        const data = await response.json();
        console.log('📊 Status Data:', data);
        
        // Update stages based on progress
        if (data.currentStage !== undefined) {
          // Update previous stages as completed
          for (let i = 0; i < data.currentStage; i++) {
            updateStageStatus(i, 'completed');
          }
          
          // Update current stage
          if (data.currentStage < stages.length) {
            updateStageStatus(data.currentStage, 'in-progress', data.message);
          }
        }

        // Check if completed
        if (data.status === 'completed') {
          clearInterval(pollInterval);
          
          // Mark all stages as completed
          setStages(prev => prev.map(stage => ({ ...stage, status: 'completed' })));
          
          // Update video request status immediately after successful generation
          if (currentRequestId) {
            try {
              console.log('📝 Updating video request status after generation completion for ID:', currentRequestId);
              await VideoLibraryService.updateVideoRequest(currentRequestId, {
                status: 'completed',
                completedAt: Timestamp.now(),
              });
              console.log('✅ Video request updated to completed after generation');
              
              // Clear the pending request from AsyncStorage since it's now completed
              await AsyncStorage.removeItem('pendingVideoRequest');
              console.log('🧹 Cleared pending video request from AsyncStorage');
            } catch (requestUpdateError) {
              console.error('❌ Failed to update video request after generation:', requestUpdateError);
              // Continue with video display even if request update fails
            }
          }
          
          // Convert URL to absolute URL with correct LAN IP
          let videoUrl = data.videoUrl;
          if (!videoUrl) {
            throw new Error('No video URL returned from backend');
          }
          
          // Replace localhost with correct API URL or convert relative path to absolute
          const baseUrl = getVideoApiUrl();
          if (videoUrl.includes('localhost')) {
            videoUrl = videoUrl.replace('http://localhost:4000', baseUrl).replace('localhost:4000', baseUrl.replace('http://', ''));
          } else if (!videoUrl.startsWith('http')) {
            videoUrl = `${baseUrl}${videoUrl.startsWith('/') ? videoUrl : '/' + videoUrl}`;
          }
          
          console.log('✅ Video generation completed!');
          console.log('📹 Video URL:', videoUrl);
          setGeneratedVideoUrl(videoUrl);
          setVideoLoading(true);
          await saveVideoToHistory(videoUrl);
          setIsGenerating(false);
          
          Alert.alert(
            'Success!',
            'Your mining safety training video has been generated successfully!',
            [{ text: 'OK' }]
          );
        } else if (data.status === 'error') {
          clearInterval(pollInterval);
          setIsGenerating(false);
          
          if (data.currentStage !== undefined && data.currentStage < stages.length) {
            updateStageStatus(data.currentStage, 'error', data.error);
          }
          
          Alert.alert('Generation Failed', data.error || 'An error occurred during video generation');
        }
        
      } catch (error) {
        console.error('Polling error:', error);
      }
    }, 2000); // Poll every 2 seconds

    // Timeout after 10 minutes
    setTimeout(() => {
      clearInterval(pollInterval);
      if (isGenerating) {
        setIsGenerating(false);
        Alert.alert('Timeout', 'Video generation took too long. Please try again.');
      }
    }, 600000);
  };

  const getSelectedLanguageName = () => {
    const lang = languages.find(l => l.code === selectedLanguage);
    return lang ? `${lang.flag} ${lang.native}` : 'Select Language';
  };

  const getStageIcon = (status: GenerationStage['status']) => {
    switch (status) {
      case 'completed':
        return '✓';
      case 'in-progress':
        return '⏳';
      case 'error':
        return '✗';
      default:
        return '○';
    }
  };

  const getStageColor = (status: GenerationStage['status']) => {
    switch (status) {
      case 'completed':
        return COLORS.accent;
      case 'in-progress':
        return COLORS.primary;
      case 'error':
        return COLORS.destructive;
      default:
        return COLORS.textMuted;
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity 
          onPress={() => router.back()} 
          style={styles.backButton}
          disabled={isGenerating}
        >
          <ArrowLeft size={24} color={COLORS.text} />
        </TouchableOpacity>
        <View style={styles.headerTextContainer}>
          <Text style={styles.headerTitle}>AI Video Generation</Text>
          <Text style={styles.headerSubtitle}>Create Safety Training Videos</Text>
        </View>
        <Film size={28} color={COLORS.primary} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Language Selection */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Globe size={20} color={COLORS.primary} />
            <Text style={styles.sectionTitle}>Language Selection</Text>
          </View>
          
          <TouchableOpacity
            style={styles.languageSelector}
            onPress={() => setShowLanguageModal(true)}
            disabled={isGenerating}
          >
            <Text style={[styles.languageSelectorText, !selectedLanguage && styles.placeholder]} numberOfLines={1}>
              {getSelectedLanguageName()}
            </Text>
            <Text style={styles.chevron}>›</Text>
          </TouchableOpacity>
        </View>

        {/* Topic Input */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Sparkles size={20} color={COLORS.primary} />
            <Text style={styles.sectionTitle}>Mining Safety Topic</Text>
          </View>
          
          <TextInput
            style={styles.topicInput}
            placeholder="Enter your topic (e.g., PPE Safety in Mines)"
            placeholderTextColor={COLORS.textMuted}
            value={topic}
            onChangeText={setTopic}
            multiline
            numberOfLines={3}
            editable={!isGenerating}
          />

          {/* Example Topics */}
          <View style={styles.examplesContainer}>
            <Text style={styles.examplesLabel}>Quick Examples:</Text>
            <View style={styles.exampleChips}>
              {exampleTopics.map((example, index) => (
                <TouchableOpacity
                  key={index}
                  style={styles.exampleChip}
                  onPress={() => !isGenerating && setTopic(example)}
                  disabled={isGenerating}
                >
                  <Text style={styles.exampleChipText}>{example}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </View>

        {/* Generate Button */}
        {!isGenerating && !generatedVideoUrl && (
          <TouchableOpacity
            style={[
              styles.generateButton,
              (!selectedLanguage || !topic.trim()) && styles.generateButtonDisabled
            ]}
            onPress={startVideoGeneration}
            disabled={!selectedLanguage || !topic.trim()}
          >
            <VideoIcon size={24} color="#FFFFFF" />
            <Text style={styles.generateButtonText}>Generate Video</Text>
          </TouchableOpacity>
        )}

        {/* Progress Section */}
        {isGenerating && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <ActivityIndicator size="small" color={COLORS.primary} />
              <Text style={styles.sectionTitle}>Generation Progress</Text>
            </View>

            <View style={styles.progressContainer}>
              {stages.map((stage, index) => (
                <View key={index} style={styles.stageItem}>
                  <View style={styles.stageIndicator}>
                    <View 
                      style={[
                        styles.stageCircle,
                        { borderColor: getStageColor(stage.status) }
                      ]}
                    >
                      <Text style={[styles.stageIcon, { color: getStageColor(stage.status) }]}>
                        {getStageIcon(stage.status)}
                      </Text>
                    </View>
                    {index < stages.length - 1 && (
                      <View style={[
                        styles.stageLine,
                        stage.status === 'completed' && styles.stageLineCompleted
                      ]} />
                    )}
                  </View>
                  <View style={styles.stageContent}>
                    <Text style={[
                      styles.stageName,
                      { color: getStageColor(stage.status) }
                    ]}>
                      {stage.name}
                    </Text>
                    {stage.message && (
                      <Text style={styles.stageMessage}>{stage.message}</Text>
                    )}
                  </View>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Generated Video Preview */}
        {generatedVideoUrl && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <CheckCircle size={20} color={COLORS.accent} />
              <Text style={styles.sectionTitle}>Video Ready!</Text>
            </View>

            <View style={styles.videoPreviewCard}>
              {videoError ? (
                <View style={styles.videoError}>
                  <Text style={styles.videoErrorText}>Error loading video</Text>
                  <Text style={styles.videoErrorDetail}>{videoError}</Text>
                  <TouchableOpacity 
                    style={styles.retryButton}
                    onPress={() => {
                      setVideoError('');
                      setVideoLoading(true);
                    }}
                  >
                    <Text style={styles.retryButtonText}>Retry</Text>
                  </TouchableOpacity>
                </View>
              ) : (
                <View>
                  <Video
                    key={generatedVideoUrl}
                    ref={videoRef}
                    source={{ uri: generatedVideoUrl }}
                    style={styles.videoPlayer}
                    useNativeControls
                    resizeMode={ResizeMode.CONTAIN}
                    shouldPlay={false}
                    isLooping
                    onLoad={() => {
                      console.log('Video loaded successfully:', generatedVideoUrl);
                      setVideoLoading(false);
                      setVideoError('');
                    }}
                    onError={(error: any) => {
                      console.error('Video error details:', error);
                      console.error('Video URL:', generatedVideoUrl);
                      const errorMsg = typeof error === 'string' ? error : 'Failed to load video. Server may not be configured correctly.';
                      setVideoError(errorMsg);
                      setVideoLoading(false);
                    }}
                    onPlaybackStatusUpdate={(status: AVPlaybackStatus) => {
                      if (status.isLoaded) {
                        setIsPlaying(status.isPlaying);
                      }
                    }}
                  />
                  {videoLoading && (
                    <View style={styles.videoLoadingOverlay}>
                      <ActivityIndicator size="large" color={COLORS.primary} />
                      <Text style={styles.videoLoadingText}>Loading video...</Text>
                    </View>
                  )}
                </View>
              )}

              <View style={styles.videoInfo}>
                <Text style={styles.videoInfoLabel}>Topic:</Text>
                <Text style={styles.videoInfoValue}>{topic}</Text>
              </View>

              <View style={styles.videoInfo}>
                <Text style={styles.videoInfoLabel}>Language:</Text>
                <Text style={styles.videoInfoValue}>{getSelectedLanguageName()}</Text>
              </View>

              <TouchableOpacity 
                style={styles.downloadButton}
                onPress={downloadVideo}
              >
                <Text style={styles.downloadButtonText}>Download Video</Text>
              </TouchableOpacity>

              <View style={styles.libraryActionContainer}>
                <TouchableOpacity 
                  style={[styles.libraryButton, styles.saveButton]}
                  onPress={saveToLibrary}
                >
                  <Text style={styles.saveButtonText}>Save to Library</Text>
                </TouchableOpacity>

                <TouchableOpacity 
                  style={[styles.libraryButton, styles.discardButton]}
                  onPress={discardVideo}
                >
                  <Text style={styles.discardButtonText}>Discard</Text>
                </TouchableOpacity>
              </View>

              <TouchableOpacity 
                style={styles.newVideoButton}
                onPress={async () => {
                  try {
                    if (videoRef.current) {
                      await videoRef.current.stopAsync();
                      await videoRef.current.unloadAsync();
                    }
                  } catch (e) {
                    console.log('Video cleanup error:', e);
                  }
                  setGeneratedVideoUrl('');
                  setTopic('');
                  setIsPlaying(false);
                  setStages(prev => prev.map(stage => ({ ...stage, status: 'pending', message: undefined })));
                }}
              >
                <Text style={styles.newVideoButtonText}>Generate Another Video</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        <View style={{ height: 40 }} />
      </ScrollView>

      {/* Language Selection Modal */}
      <Modal
        visible={showLanguageModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowLanguageModal(false)}
      >
        <TouchableOpacity 
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowLanguageModal(false)}
        >
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Select Language</Text>
            
            {languages.map((lang) => (
              <TouchableOpacity
                key={lang.code}
                style={[
                  styles.languageOption,
                  selectedLanguage === lang.code && styles.languageOptionSelected
                ]}
                onPress={() => handleLanguageSelect(lang.code)}
              >
                <Text style={styles.languageFlag}>{lang.flag}</Text>
                <View style={styles.languageTextContainer}>
                  <Text style={styles.languageName}>{lang.name}</Text>
                  <Text style={styles.languageNative}>{lang.native}</Text>
                </View>
                {selectedLanguage === lang.code && (
                  <CheckCircle size={24} color={COLORS.accent} />
                )}
              </TouchableOpacity>
            ))}
          </View>
        </TouchableOpacity>
      </Modal>
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
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  backButton: {
    marginRight: 12,
  },
  headerTextContainer: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.text,
  },
  headerSubtitle: {
    fontSize: 14,
    color: COLORS.textMuted,
    marginTop: 2,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  section: {
    marginTop: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text,
    marginLeft: 8,
  },
  languageSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: COLORS.card,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  languageSelectorText: {
    flex: 1,
    fontSize: 16,
    color: COLORS.text,
    fontWeight: '500',
    lineHeight: 20,
  },
  placeholder: {
    color: COLORS.textMuted,
  },
  chevron: {
    fontSize: 24,
    color: COLORS.textMuted,
  },
  topicInput: {
    backgroundColor: COLORS.card,
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: COLORS.text,
    borderWidth: 1,
    borderColor: COLORS.border,
    minHeight: 100,
    textAlignVertical: 'top',
  },
  examplesContainer: {
    marginTop: 12,
  },
  examplesLabel: {
    fontSize: 14,
    color: COLORS.textMuted,
    marginBottom: 8,
  },
  exampleChips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  exampleChip: {
    backgroundColor: COLORS.card,
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  exampleChipText: {
    fontSize: 12,
    color: COLORS.text,
  },
  generateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.primary,
    borderRadius: 12,
    padding: 18,
    marginTop: 24,
    gap: 10,
  },
  generateButtonDisabled: {
    opacity: 0.5,
  },
  generateButtonText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  progressContainer: {
    backgroundColor: COLORS.card,
    borderRadius: 12,
    padding: 20,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  stageItem: {
    flexDirection: 'row',
    marginBottom: 20,
  },
  stageIndicator: {
    alignItems: 'center',
    marginRight: 16,
  },
  stageCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.card,
  },
  stageIcon: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  stageLine: {
    width: 2,
    flex: 1,
    backgroundColor: COLORS.border,
    marginTop: 4,
  },
  stageLineCompleted: {
    backgroundColor: COLORS.accent,
  },
  stageContent: {
    flex: 1,
    paddingTop: 4,
  },
  stageName: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  stageMessage: {
    fontSize: 14,
    color: COLORS.textMuted,
  },
  videoPreviewCard: {
    backgroundColor: COLORS.card,
    borderRadius: 12,
    padding: 20,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  videoPlayer: {
    width: '100%',
    height: 240,
    backgroundColor: COLORS.background,
    borderRadius: 8,
    marginBottom: 20,
  },
  videoLoadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 8,
  },
  videoLoadingText: {
    color: COLORS.text,
    marginTop: 12,
    fontSize: 14,
  },
  videoError: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.background,
    borderRadius: 8,
    padding: 40,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: COLORS.destructive,
  },
  videoErrorText: {
    fontSize: 16,
    color: COLORS.destructive,
    fontWeight: '600',
    marginBottom: 8,
  },
  videoErrorDetail: {
    fontSize: 14,
    color: COLORS.textMuted,
    textAlign: 'center',
    marginBottom: 16,
  },
  retryButton: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#FFFFFF',
    fontWeight: '600',
    fontSize: 14,
  },
  videoPlaceholder: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.background,
    borderRadius: 8,
    padding: 40,
    marginBottom: 20,
  },
  videoPlaceholderText: {
    fontSize: 16,
    color: COLORS.textMuted,
    marginTop: 12,
  },
  videoInfo: {
    marginBottom: 12,
  },
  videoInfoLabel: {
    fontSize: 14,
    color: COLORS.textMuted,
    marginBottom: 4,
  },
  videoInfoValue: {
    fontSize: 16,
    color: COLORS.text,
    fontWeight: '500',
  },
  downloadButton: {
    backgroundColor: COLORS.accent,
    borderRadius: 8,
    padding: 14,
    alignItems: 'center',
    marginTop: 12,
  },
  downloadButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  libraryActionContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 16,
    gap: 12,
  },
  libraryButton: {
    flex: 1,
    borderRadius: 8,
    padding: 14,
    alignItems: 'center',
  },
  saveButton: {
    backgroundColor: COLORS.primary,
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  discardButton: {
    backgroundColor: COLORS.destructive,
  },
  discardButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  newVideoButton: {
    backgroundColor: COLORS.background,
    borderRadius: 8,
    padding: 14,
    alignItems: 'center',
    marginTop: 8,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  newVideoButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: COLORS.card,
    borderRadius: 16,
    padding: 20,
    width: '100%',
    maxWidth: 400,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: 20,
    textAlign: 'center',
  },
  languageOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    marginBottom: 8,
    backgroundColor: COLORS.background,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  languageOptionSelected: {
    borderColor: COLORS.accent,
    backgroundColor: COLORS.accent + '15',
  },
  languageFlag: {
    fontSize: 32,
    marginRight: 16,
  },
  languageTextContainer: {
    flex: 1,
  },
  languageName: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text,
  },
  languageNative: {
    fontSize: 14,
    color: COLORS.textMuted,
    marginTop: 2,
  },
});
