import { ArrowLeft, Filter, Play, Search, Trash2, Video as VideoIcon } from '@/components/Icons';
import { COLORS } from '@/constants/styles';
import { VideoLibraryService } from '@/services/videoLibraryService';
import { useFocusEffect } from '@react-navigation/native';
import { useRouter } from 'expo-router';
import React, { useEffect, useMemo, useState } from 'react';
import {
  Alert,
  FlatList,
  Linking,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

interface VideoItem {
  id: string;
  topic: string;
  language: string;
  languageName: string;
  videoUrl: string;
  timestamp: number;
  thumbnail?: string;
}

export default function VideoLibrary() {
  const router = useRouter();
  const [videos, setVideos] = useState<VideoItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  
  // Filter states
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedLanguage, setSelectedLanguage] = useState<string>('all');
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    loadVideos();
  }, []);

  // Reload videos when screen comes into focus
  useFocusEffect(
    React.useCallback(() => {
      loadVideos();
    }, [])
  );

  // Filter videos based on current filter states
  const filteredVideos = useMemo(() => {
    return videos.filter(video => {
      // Search filter
      if (searchQuery && !video.topic.toLowerCase().includes(searchQuery.toLowerCase())) {
        return false;
      }
      
      // Language filter
      if (selectedLanguage !== 'all' && video.language !== selectedLanguage) {
        return false;
      }
      
      return true;
    });
  }, [videos, searchQuery, selectedLanguage]);

  const loadVideos = async () => {
    try {
      // Load videos from Firestore
      const fetchedVideos = await VideoLibraryService.getVideos({ status: 'active' });
      
      // Transform to match VideoItem interface
      const transformedVideos: VideoItem[] = fetchedVideos.map(video => ({
        id: video.id,
        topic: video.topic,
        language: video.language,
        languageName: video.languageName,
        videoUrl: video.videoUrl,
        timestamp: video.createdAt.toMillis(),
        thumbnail: video.thumbnailUrl,
      }));
      
      setVideos(transformedVideos);
      console.log(`✅ Loaded ${transformedVideos.length} videos from Firestore`);
    } catch (error) {
      console.error('Error loading videos:', error);
      Alert.alert('Error', 'Failed to load video library from database');
    } finally {
      setLoading(false);
    }
  };

  const deleteVideo = async (videoId: string) => {
    Alert.alert(
      'Delete Video',
      'Are you sure you want to delete this video from the library? This will also remove all related assignments and progress.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              // Delete from Firestore
              await VideoLibraryService.deleteVideo(videoId);
              
              // Update local state
              const updatedVideos = videos.filter(v => v.id !== videoId);
              setVideos(updatedVideos);

              Alert.alert('Success', 'Video deleted successfully from database');
            } catch (error) {
              console.error('Error deleting video:', error);
              Alert.alert('Error', 'Failed to delete video from database');
            }
          },
        },
      ]
    );
  };

  const playVideo = async (videoUrl: string, topic: string) => {
    try {
      const canOpen = await Linking.canOpenURL(videoUrl);
      
      if (canOpen) {
        await Linking.openURL(videoUrl);
      } else {
        Alert.alert(
          'Cannot Play Video',
          `Unable to open the video. URL: ${videoUrl}`,
          [{ text: 'OK' }]
        );
      }
    } catch (error) {
      console.error('Error playing video:', error);
      Alert.alert(
        'Error',
        'Failed to play video. Please check your internet connection.',
        [{ text: 'OK' }]
      );
    }
  };

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const renderVideoItem = ({ item }: { item: VideoItem }) => (
    <View style={styles.videoCard}>
      <View style={styles.videoHeader}>
        <VideoIcon size={24} color={COLORS.primary} />
        <View style={styles.videoInfo}>
          <Text style={styles.videoTitle} numberOfLines={2}>
            {item.topic}
          </Text>
          <Text style={styles.videoMeta}>
            {item.languageName} • {formatDate(item.timestamp)}
          </Text>
        </View>
        <TouchableOpacity
          style={styles.deleteButtonTop}
          onPress={() => deleteVideo(item.id)}
        >
          <Trash2 size={18} color={COLORS.destructive} />
        </TouchableOpacity>
      </View>

      <View style={styles.videoActions}>
        <TouchableOpacity
          style={[styles.actionButton, styles.playButton]}
          onPress={() => playVideo(item.videoUrl, item.topic)}
        >
          <Play size={16} color="#FFFFFF" />
          <Text style={styles.playButtonText}>Play</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <ArrowLeft size={24} color={COLORS.text} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Video Library</Text>
          <View style={{ width: 24 }} />
        </View>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading videos...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <ArrowLeft size={24} color={COLORS.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Video Library</Text>
        <TouchableOpacity onPress={() => setShowFilters(!showFilters)} style={styles.headerFilterButton}>
          <Filter size={24} color={COLORS.text} />
        </TouchableOpacity>
      </View>

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <View style={styles.searchInputContainer}>
          <Search size={20} color={COLORS.textMuted} style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search videos by topic..."
            placeholderTextColor={COLORS.textMuted}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>
      </View>

      {/* Filter Options */}
      {showFilters && (
        <View style={styles.filtersContainer}>
          <Text style={styles.filtersTitle}>Filters</Text>
          
          {/* Language Filter */}
          <View style={styles.filterRow}>
            <Text style={styles.filterLabel}>Language:</Text>
            <View style={styles.filterButtons}>
              {[
                { label: 'All', value: 'all' },
                { label: 'English', value: 'en' },
                { label: 'Hindi', value: 'hi' },
                { label: 'Telugu', value: 'te' },
              ].map((option) => (
                <TouchableOpacity
                  key={option.value}
                  style={[
                    styles.filterOptionButton,
                    selectedLanguage === option.value && styles.filterOptionButtonActive,
                  ]}
                  onPress={() => setSelectedLanguage(option.value)}
                >
                  <Text
                    style={[
                      styles.filterOptionButtonText,
                      selectedLanguage === option.value && styles.filterOptionButtonTextActive,
                    ]}
                  >
                    {option.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </View>
      )}

      {videos.length === 0 && !loading ? (
        <View style={styles.emptyContainer}>
          <VideoIcon size={64} color={COLORS.textMuted} />
          <Text style={styles.emptyTitle}>No Videos in Database</Text>
          <Text style={styles.emptyText}>
            Generate videos using AI Video Generator to populate the library
          </Text>
          <TouchableOpacity
            style={styles.generateButton}
            onPress={() => router.push('/safety-officer/VideoGenerationModule')}
          >
            <Text style={styles.generateButtonText}>Generate Video</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={filteredVideos}
          keyExtractor={(item) => item.id}
          renderItem={renderVideoItem}
          contentContainerStyle={styles.listContainer}
          showsVerticalScrollIndicator={false}
          refreshing={refreshing}
          onRefresh={async () => {
            setRefreshing(true);
            await loadVideos();
            setRefreshing(false);
          }}
          ListEmptyComponent={
            searchQuery || selectedLanguage !== 'all' ? (
              <View style={styles.emptyFilterContainer}>
                <Text style={styles.emptyFilterText}>No videos match your filters</Text>
                <TouchableOpacity
                  style={styles.clearFiltersButton}
                  onPress={() => {
                    setSearchQuery('');
                    setSelectedLanguage('all');
                  }}
                >
                  <Text style={styles.clearFiltersText}>Clear Filters</Text>
                </TouchableOpacity>
              </View>
            ) : null
          }
        />
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
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  backButton: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.text,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    fontSize: 16,
    color: COLORS.textMuted,
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 40,
  },
  emptyTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: COLORS.text,
    marginTop: 16,
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 16,
    color: COLORS.textMuted,
    textAlign: 'center',
    marginBottom: 24,
  },
  generateButton: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  generateButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  listContainer: {
    padding: 20,
  },
  videoCard: {
    backgroundColor: COLORS.card,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  videoHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  videoInfo: {
    flex: 1,
    marginLeft: 12,
  },
  videoTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 4,
  },
  videoMeta: {
    fontSize: 14,
    color: COLORS.textMuted,
  },
  videoActions: {
    flexDirection: 'row',
    gap: 16,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    gap: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  playButton: {
    backgroundColor: COLORS.primary,
  },
  playButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  deleteButtonTop: {
    padding: 8,
    borderRadius: 6,
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
  },
  headerFilterButton: {
    padding: 4,
  },
  searchContainer: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  searchInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.card,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: COLORS.text,
    paddingVertical: 0,
  },
  filtersContainer: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    backgroundColor: COLORS.card,
  },
  filtersTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 12,
  },
  filterRow: {
    marginBottom: 12,
  },
  filterLabel: {
    fontSize: 16,
    fontWeight: '500',
    color: COLORS.text,
    marginBottom: 8,
  },
  filterButtons: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  filterOptionButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.background,
  },
  filterOptionButtonActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  filterOptionButtonText: {
    fontSize: 14,
    color: COLORS.text,
  },
  filterOptionButtonTextActive: {
    color: '#FFFFFF',
  },
  emptyFilterContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
  },
  emptyFilterText: {
    fontSize: 16,
    color: COLORS.textMuted,
    marginBottom: 16,
    textAlign: 'center',
  },
  clearFiltersButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: COLORS.primary,
    borderRadius: 6,
  },
  clearFiltersText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#FFFFFF',
  },
});
