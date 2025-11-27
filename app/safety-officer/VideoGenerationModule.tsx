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
import { ArrowLeft, CheckCircle, Film, Globe, Sparkles, Video as VideoIcon } from '../../components/Icons';
import { COLORS } from '../../constants/styles';

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
  
  // Load video history from AsyncStorage on mount
  useEffect(() => {
    loadVideoHistory();
  }, []);

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

    setIsGenerating(true);
    setGeneratedVideoUrl('');
    setVideoError('');
    setVideoLoading(false);
    
    // Reset all stages
    setStages(prev => prev.map(stage => ({ ...stage, status: 'pending', message: undefined })));

    try {
      // Call backend API endpoint
      const response = await fetch('http://10.60.7.111:4000/api/video/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          topic: topic.trim(),
          language: selectedLanguage,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to start video generation');
      }

      const data = await response.json();
      
      // Poll for progress updates
      pollGenerationProgress(data.jobId);
      
    } catch (error) {
      console.error('Video generation error:', error);
      Alert.alert('Error', 'Failed to start video generation. Please ensure backend is running.');
      setIsGenerating(false);
    }
  };

  const pollGenerationProgress = async (jobId: string) => {
    const pollInterval = setInterval(async () => {
      try {
        const response = await fetch(`http://10.60.7.111:4000/api/video/status/${jobId}`);
        
        if (!response.ok) {
          clearInterval(pollInterval);
          setIsGenerating(false);
          return;
        }

        const data = await response.json();
        
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
          
          // Convert relative URL to absolute URL
          const videoUrl = data.videoUrl.startsWith('http') 
            ? data.videoUrl 
            : `http://10.60.7.111:4000${data.videoUrl}`;
          
          console.log('Video URL:', videoUrl);
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
            <Text style={[styles.languageSelectorText, !selectedLanguage && styles.placeholder]}>
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
                    onError={(error) => {
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
    fontSize: 16,
    color: COLORS.text,
    fontWeight: '500',
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
