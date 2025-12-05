import { Video } from 'expo-av';
import * as ImagePicker from 'expo-image-picker';
import { useRouter } from 'expo-router';
import React, { useEffect, useRef, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    Dimensions,
    FlatList,
    Modal,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
    AlertCircle,
    ArrowLeft,
    CheckCircle,
    Clock,
    Heart,
    MessageCircle,
    Share2,
    Upload,
    Video as VideoIcon,
    X
} from '../../components/Icons';
import { COLORS } from '../../constants/styles';
import { useRoleStore } from '../../hooks/useRoleStore';
import {
    getApprovedTestimonials,
    getMyTestimonials,
    submitTestimonial,
    Testimonial as TestimonialType,
    toggleLikeTestimonial
} from '../../services/testimonialService';

const { width, height } = Dimensions.get('window');

export default function Testimonials() {
  const router = useRouter();
  const { user } = useRoleStore();
  const [testimonials, setTestimonials] = useState<TestimonialType[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [showMyTestimonials, setShowMyTestimonials] = useState(false);
  const [myTestimonials, setMyTestimonials] = useState<TestimonialType[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMy, setLoadingMy] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  
  // Upload form state
  const [videoUri, setVideoUri] = useState<string | null>(null);
  const [caption, setCaption] = useState('');
  const [uploading, setUploading] = useState(false);

  // Video playback
  const videoRef = useRef<Video>(null);
  const [isPlaying, setIsPlaying] = useState(true);
  const flatListRef = useRef<FlatList>(null);

  useEffect(() => {
    loadTestimonials();
    loadMyTestimonials();
  }, []);

  const loadTestimonials = async () => {
    try {
      setLoading(true);
      const approved = await getApprovedTestimonials();
      setTestimonials(approved);
      console.log(`✅ Loaded ${approved.length} approved testimonials`);
    } catch (error) {
      console.error('❌ Error loading testimonials:', error);
      Alert.alert('Error', 'Failed to load testimonials');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const loadMyTestimonials = async () => {
    try {
      setLoadingMy(true);
      const userIdentifier = user.phone || user.id || 'anonymous';
      const myTestimonialsData = await getMyTestimonials(userIdentifier);
      setMyTestimonials(myTestimonialsData);
      console.log(`✅ Loaded ${myTestimonialsData.length} user testimonials`);
    } catch (error) {
      console.error('❌ Error loading my testimonials:', error);
    } finally {
      setLoadingMy(false);
    }
  };

  const handleRefresh = () => {
    setRefreshing(true);
    loadTestimonials();
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
        videoMaxDuration: 60, // 60 seconds max
      });

      if (!result.canceled && result.assets[0]) {
        setVideoUri(result.assets[0].uri);
      }
    } catch (error) {
      console.error('Error picking video:', error);
      Alert.alert('Error', 'Failed to pick video');
    }
  };

  const recordVideo = async () => {
    try {
      const permissionResult = await ImagePicker.requestCameraPermissionsAsync();
      if (!permissionResult.granted) {
        Alert.alert('Permission Required', 'Camera permission is required!');
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Videos,
        allowsEditing: true,
        quality: 0.8,
        videoMaxDuration: 60,
      });

      if (!result.canceled && result.assets[0]) {
        setVideoUri(result.assets[0].uri);
      }
    } catch (error) {
      console.error('Error recording video:', error);
      Alert.alert('Error', 'Failed to record video');
    }
  };

  const handleUpload = async () => {
    if (!videoUri || !caption.trim()) {
      Alert.alert('Error', 'Please select a video and add a caption');
      return;
    }

    setUploading(true);

    try {
      const userIdentifier = user.phone || user.id || 'anonymous';
      
      const testimonialData: Omit<TestimonialType, 'id' | 'createdAt'> = {
        userId: userIdentifier,
        userName: user.name || 'Miner',
        userRole: user.role || 'miner',
        userPhone: user.phone || '',
        videoUri: videoUri,
        caption: caption.trim(),
        likes: 0,
        comments: 0,
        shares: 0,
        timestamp: Date.now(),
        status: 'pending',
        likedBy: [],
      };

      await submitTestimonial(testimonialData);

      setShowUploadModal(false);
      setVideoUri(null);
      setCaption('');
      
      // Reload user's testimonials
      await loadMyTestimonials();
      
      Alert.alert(
        '✅ Submitted!',
        'Your testimonial has been sent to the Safety Officer for review. You\'ll be notified once it\'s approved.',
        [{ text: 'OK' }]
      );
    } catch (error) {
      console.error('❌ Error uploading testimonial:', error);
      Alert.alert('Error', 'Failed to upload testimonial. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  const handleLike = async (testimonialId: string) => {
    if (!testimonialId) return;

    try {
      const userIdentifier = user.phone || user.id || 'anonymous';
      
      // Optimistic update
      const updated = testimonials.map(t => {
        if (t.id === testimonialId) {
          const alreadyLiked = t.likedBy.includes(userIdentifier);
          return {
            ...t,
            likes: alreadyLiked ? t.likes - 1 : t.likes + 1,
            likedBy: alreadyLiked
              ? t.likedBy.filter(id => id !== userIdentifier)
              : [...t.likedBy, userIdentifier],
          };
        }
        return t;
      });

      setTestimonials(updated);
      
      // Update Firebase
      await toggleLikeTestimonial(testimonialId, userIdentifier);
    } catch (error) {
      console.error('❌ Error toggling like:', error);
      // Revert on error
      await loadTestimonials();
    }
  };

  const handleShare = (testimonial: Testimonial) => {
    Alert.alert('Share', `Share "${testimonial.caption.substring(0, 30)}..." with your team`);
  };

  const formatTimestamp = (timestamp: number) => {
    const diff = Date.now() - timestamp;
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    if (days === 0) return 'Today';
    if (days === 1) return 'Yesterday';
    if (days < 7) return `${days} days ago`;
    return new Date(timestamp).toLocaleDateString();
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'approved':
        return <CheckCircle size={16} color="#10B981" />;
      case 'pending':
        return <Clock size={16} color="#F59E0B" />;
      case 'rejected':
        return <AlertCircle size={16} color="#EF4444" />;
      default:
        return null;
    }
  };

  const renderTestimonial = ({ item, index }: { item: TestimonialType; index: number }) => {
    const userIdentifier = user.phone || user.id || 'anonymous';
    const isLiked = item.likedBy.includes(userIdentifier);

    return (
      <View style={styles.testimonialContainer}>
        {/* Video Background */}
        <View style={styles.videoWrapper}>
          {item.videoUri ? (
            <Video
              ref={index === currentIndex ? videoRef : null}
              source={{ uri: item.videoUri }}
              style={styles.video}
              useNativeControls
              resizeMode="cover"
              isLooping
              shouldPlay={index === currentIndex}
            />
          ) : (
            <View style={styles.videoPlaceholder}>
              <Text style={styles.videoPlaceholderText}>📹</Text>
              <Text style={styles.videoPlaceholderSubtext}>Video Testimonial</Text>
            </View>
          )}
        </View>

        {/* User Info Overlay */}
        <View style={styles.userInfoOverlay}>
          <View style={styles.userAvatar}>
            <Text style={styles.userAvatarText}>{item.userName.charAt(0)}</Text>
          </View>
          <View style={styles.userInfo}>
            <Text style={styles.userName}>{item.userName}</Text>
            <Text style={styles.userRole}>{item.userRole}</Text>
          </View>
        </View>

        {/* Caption */}
        <View style={styles.captionOverlay}>
          <Text style={styles.caption}>{item.caption}</Text>
          <Text style={styles.timestamp}>{formatTimestamp(item.timestamp)}</Text>
        </View>

        {/* Actions */}
        <View style={styles.actionsOverlay}>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => handleLike(item.id)}
          >
            <Heart
              size={32}
              color={isLiked ? '#EF4444' : '#FFFFFF'}
              fill={isLiked ? '#EF4444' : 'none'}
            />
            <Text style={styles.actionText}>{item.likes}</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.actionButton}>
            <MessageCircle size={32} color="#FFFFFF" />
            <Text style={styles.actionText}>{item.comments}</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => handleShare(item)}
          >
            <Share2 size={32} color="#FFFFFF" />
            <Text style={styles.actionText}>{item.shares}</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.headerButton}>
          <ArrowLeft size={24} color="#FFFFFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Miner Testimonials</Text>
        <TouchableOpacity
          onPress={() => setShowMyTestimonials(true)}
          style={styles.headerButton}
        >
          <Text style={styles.headerButtonText}>My Videos</Text>
        </TouchableOpacity>
      </View>

      {/* Testimonials Feed (Instagram Reels Style) */}
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.primary} />
          <Text style={styles.loadingText}>Loading testimonials...</Text>
        </View>
      ) : testimonials.length === 0 ? (
        <View style={styles.emptyState}>
          <VideoIcon size={64} color={COLORS.textMuted} />
          <Text style={styles.emptyStateText}>No Testimonials Yet</Text>
          <Text style={styles.emptyStateSubtext}>
            Be the first to share your safety experience!
          </Text>
          <TouchableOpacity
            style={styles.submitButton}
            onPress={() => setShowUploadModal(true)}
          >
            <Text style={styles.submitButtonText}>Share Your Story</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          ref={flatListRef}
          data={testimonials}
          renderItem={renderTestimonial}
          keyExtractor={item => item.id || ''}
          pagingEnabled
          showsVerticalScrollIndicator={false}
          snapToAlignment="start"
          decelerationRate="fast"
          onScroll={(e) => {
            const index = Math.round(e.nativeEvent.contentOffset.y / height);
            setCurrentIndex(index);
          }}
          refreshing={refreshing}
          onRefresh={handleRefresh}
        />
      )}

      {/* Upload Button */}
      <TouchableOpacity
        style={styles.uploadButton}
        onPress={() => setShowUploadModal(true)}
      >
        <Upload size={24} color="#FFFFFF" />
      </TouchableOpacity>

      {/* Upload Modal */}
      <Modal
        visible={showUploadModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowUploadModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Share Your Experience</Text>
              <TouchableOpacity onPress={() => setShowUploadModal(false)}>
                <X size={24} color={COLORS.text} />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalBody}>
              {!videoUri ? (
                <View style={styles.uploadOptions}>
                  <TouchableOpacity style={styles.uploadOption} onPress={recordVideo}>
                    <VideoIcon size={32} color={COLORS.primary} />
                    <Text style={styles.uploadOptionText}>Record Video</Text>
                    <Text style={styles.uploadOptionSubtext}>Max 60 seconds</Text>
                  </TouchableOpacity>

                  <TouchableOpacity style={styles.uploadOption} onPress={pickVideo}>
                    <Upload size={32} color={COLORS.primary} />
                    <Text style={styles.uploadOptionText}>Choose from Gallery</Text>
                    <Text style={styles.uploadOptionSubtext}>Select existing video</Text>
                  </TouchableOpacity>
                </View>
              ) : (
                <View>
                  <View style={styles.videoPreview}>
                    <Text style={styles.videoSelectedText}>✓ Video Selected</Text>
                    <TouchableOpacity onPress={() => setVideoUri(null)}>
                      <Text style={styles.changeVideoText}>Change Video</Text>
                    </TouchableOpacity>
                  </View>

                  <Text style={styles.label}>Caption *</Text>
                  <TextInput
                    style={styles.captionInput}
                    placeholder="Share your safety story or experience..."
                    placeholderTextColor={COLORS.textMuted}
                    value={caption}
                    onChangeText={setCaption}
                    multiline
                    maxLength={200}
                  />
                  <Text style={styles.charCount}>{caption.length}/200</Text>

                  <View style={styles.uploadInfo}>
                    <Text style={styles.uploadInfoText}>
                      ⓘ Your testimonial will be reviewed by the Safety Officer before being published.
                    </Text>
                  </View>

                  <TouchableOpacity
                    style={[styles.submitButton, uploading && styles.submitButtonDisabled]}
                    onPress={handleUpload}
                    disabled={uploading}
                  >
                    <Text style={styles.submitButtonText}>
                      {uploading ? 'Uploading...' : 'Submit for Review'}
                    </Text>
                  </TouchableOpacity>
                </View>
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* My Testimonials Modal */}
      <Modal
        visible={showMyTestimonials}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowMyTestimonials(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>My Testimonials</Text>
              <TouchableOpacity onPress={() => setShowMyTestimonials(false)}>
                <X size={24} color={COLORS.text} />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalBody}>
              {loadingMy ? (
                <View style={styles.loadingContainer}>
                  <ActivityIndicator size="large" color={COLORS.primary} />
                  <Text style={styles.loadingText}>Loading your testimonials...</Text>
                </View>
              ) : myTestimonials.length === 0 ? (
                <View style={styles.emptyState}>
                  <VideoIcon size={64} color={COLORS.textMuted} />
                  <Text style={styles.emptyStateText}>No Testimonials Yet</Text>
                  <Text style={styles.emptyStateSubtext}>
                    Share your safety experiences with fellow miners
                  </Text>
                </View>
              ) : (
                myTestimonials.map(testimonial => (
                  <View key={testimonial.id} style={styles.myTestimonialCard}>
                    <View style={styles.myTestimonialHeader}>
                      <Text style={styles.myTestimonialCaption}>{testimonial.caption}</Text>
                      <View style={styles.statusBadge}>
                        {getStatusIcon(testimonial.status)}
                        <Text style={[
                          styles.statusText,
                          testimonial.status === 'approved' && { color: '#10B981' },
                          testimonial.status === 'pending' && { color: '#F59E0B' },
                          testimonial.status === 'rejected' && { color: '#EF4444' },
                        ]}>
                          {testimonial.status}
                        </Text>
                      </View>
                    </View>
                    <Text style={styles.myTestimonialDate}>
                      {formatTimestamp(testimonial.timestamp)}
                    </Text>
                    {testimonial.status === 'approved' && (
                      <View style={styles.myTestimonialStats}>
                        <Text style={styles.myTestimonialStat}>❤️ {testimonial.likes}</Text>
                        <Text style={styles.myTestimonialStat}>💬 {testimonial.comments}</Text>
                        <Text style={styles.myTestimonialStat}>📤 {testimonial.shares}</Text>
                      </View>
                    )}
                  </View>
                ))
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 10,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
  },
  headerButton: {
    padding: 8,
  },
  headerButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  testimonialContainer: {
    width: width,
    height: height,
    backgroundColor: '#000000',
  },
  videoWrapper: {
    width: width,
    height: height,
  },
  video: {
    width: width,
    height: height,
  },
  videoPlaceholder: {
    flex: 1,
    backgroundColor: '#1a1a1a',
    alignItems: 'center',
    justifyContent: 'center',
  },
  videoPlaceholderText: {
    fontSize: 80,
    marginBottom: 16,
  },
  videoPlaceholderSubtext: {
    fontSize: 18,
    color: '#FFFFFF',
    fontWeight: '600',
  },
  userInfoOverlay: {
    position: 'absolute',
    top: 80,
    left: 16,
    flexDirection: 'row',
    alignItems: 'center',
  },
  userAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  userAvatarText: {
    fontSize: 20,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 2,
  },
  userRole: {
    fontSize: 13,
    color: 'rgba(255, 255, 255, 0.8)',
  },
  captionOverlay: {
    position: 'absolute',
    bottom: 120,
    left: 16,
    right: 100,
  },
  caption: {
    fontSize: 15,
    color: '#FFFFFF',
    lineHeight: 22,
    marginBottom: 8,
  },
  timestamp: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.7)',
  },
  actionsOverlay: {
    position: 'absolute',
    right: 16,
    bottom: 120,
    gap: 24,
  },
  actionButton: {
    alignItems: 'center',
  },
  actionText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#FFFFFF',
    marginTop: 4,
  },
  uploadButton: {
    position: 'absolute',
    bottom: 40,
    alignSelf: 'center',
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: COLORS.background,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '90%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: COLORS.text,
  },
  modalBody: {
    padding: 20,
  },
  uploadOptions: {
    gap: 16,
  },
  uploadOption: {
    backgroundColor: COLORS.card,
    borderRadius: 16,
    padding: 32,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: COLORS.border,
  },
  uploadOptionText: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.text,
    marginTop: 16,
  },
  uploadOptionSubtext: {
    fontSize: 14,
    color: COLORS.textMuted,
    marginTop: 4,
  },
  videoPreview: {
    backgroundColor: COLORS.card,
    borderRadius: 12,
    padding: 20,
    alignItems: 'center',
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#10B981',
  },
  videoSelectedText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#10B981',
    marginBottom: 8,
  },
  changeVideoText: {
    fontSize: 14,
    color: COLORS.primary,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 8,
  },
  captionInput: {
    backgroundColor: COLORS.card,
    borderRadius: 12,
    padding: 16,
    fontSize: 15,
    color: COLORS.text,
    borderWidth: 1,
    borderColor: COLORS.border,
    height: 120,
    textAlignVertical: 'top',
  },
  charCount: {
    fontSize: 12,
    color: COLORS.textMuted,
    textAlign: 'right',
    marginTop: 4,
    marginBottom: 16,
  },
  uploadInfo: {
    backgroundColor: '#F59E0B20',
    borderRadius: 12,
    padding: 12,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#F59E0B',
  },
  uploadInfoText: {
    fontSize: 13,
    color: COLORS.text,
    lineHeight: 18,
  },
  submitButton: {
    backgroundColor: COLORS.primary,
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
  },
  submitButtonDisabled: {
    opacity: 0.5,
  },
  submitButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyStateText: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.text,
    marginTop: 16,
  },
  emptyStateSubtext: {
    fontSize: 14,
    color: COLORS.textMuted,
    marginTop: 8,
    textAlign: 'center',
  },
  myTestimonialCard: {
    backgroundColor: COLORS.card,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  myTestimonialHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  myTestimonialCaption: {
    fontSize: 14,
    color: COLORS.text,
    flex: 1,
    marginRight: 12,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    backgroundColor: COLORS.background,
    borderRadius: 8,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'capitalize',
  },
  myTestimonialDate: {
    fontSize: 12,
    color: COLORS.textMuted,
    marginBottom: 12,
  },
  myTestimonialStats: {
    flexDirection: 'row',
    gap: 16,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  myTestimonialStat: {
    fontSize: 13,
    color: COLORS.text,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  loadingText: {
    fontSize: 16,
    color: COLORS.text,
    marginTop: 16,
  },
});
