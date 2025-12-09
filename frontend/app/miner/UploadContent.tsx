import React, { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    Image,
    ScrollView,
    TextInput,
    Alert,
    ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import * as DocumentPicker from 'expo-document-picker';
import { Video } from 'expo-av';
import { useRoleStore } from '../../hooks/useRoleStore';
import { COLORS } from '../../constants/styles';
import { ArrowLeft, Camera, Video as VideoIcon, Upload, X, ImageIcon } from '../../components/Icons';
import { MinerFooter } from '../../components/BottomNav';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../../config/firebase';
import { getStorage, ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';
import { moderateVideo, showModerationResult, getVideoMetadata } from '../../services/videoModerationService';

type MediaType = 'photo' | 'video' | null;

export default function UploadContent() {
    const router = useRouter();
    const { user } = useRoleStore();
    const [mediaType, setMediaType] = useState<MediaType>(null);
    const [mediaUri, setMediaUri] = useState<string | null>(null);
    const [caption, setCaption] = useState('');
    const [hashtags, setHashtags] = useState('');
    const [uploading, setUploading] = useState(false);
    const [uploadProgress, setUploadProgress] = useState(0);

    const requestPermissions = async () => {
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (status !== 'granted') {
            Alert.alert('Permission Required', 'Please grant camera roll permissions to upload media.');
            return false;
        }
        return true;
    };

    const pickImage = async () => {
        const hasPermission = await requestPermissions();
        if (!hasPermission) return;

        try {
            const result = await ImagePicker.launchImageLibraryAsync({
                mediaTypes: ImagePicker.MediaTypeOptions.Images,
                allowsEditing: true,
                aspect: [9, 16],
                quality: 0.8,
            });

            if (!result.canceled && result.assets[0]) {
                setMediaType('photo');
                setMediaUri(result.assets[0].uri);
            }
        } catch (error) {
            console.error('Error picking image:', error);
            Alert.alert('Error', 'Failed to pick image');
        }
    };

    const pickVideo = async () => {
        const hasPermission = await requestPermissions();
        if (!hasPermission) return;

        try {
            const result = await ImagePicker.launchImageLibraryAsync({
                mediaTypes: ImagePicker.MediaTypeOptions.Videos,
                allowsEditing: true,
                quality: 0.8,
            });

            if (!result.canceled && result.assets[0]) {
                setMediaType('video');
                setMediaUri(result.assets[0].uri);
            }
        } catch (error) {
            console.error('Error picking video:', error);
            Alert.alert('Error', 'Failed to pick video');
        }
    };

    const takePhoto = async () => {
        const { status } = await ImagePicker.requestCameraPermissionsAsync();
        if (status !== 'granted') {
            Alert.alert('Permission Required', 'Please grant camera permissions to take photos.');
            return;
        }

        try {
            const result = await ImagePicker.launchCameraAsync({
                allowsEditing: true,
                aspect: [9, 16],
                quality: 0.8,
            });

            if (!result.canceled && result.assets[0]) {
                setMediaType('photo');
                setMediaUri(result.assets[0].uri);
            }
        } catch (error) {
            console.error('Error taking photo:', error);
            Alert.alert('Error', 'Failed to take photo');
        }
    };

    const clearMedia = () => {
        setMediaType(null);
        setMediaUri(null);
    };

    const handleUpload = async () => {
        if (!mediaUri) {
            Alert.alert('No Media', 'Please select a photo or video to upload');
            return;
        }

        if (!caption.trim()) {
            Alert.alert('Caption Required', 'Please add a caption to your post');
            return;
        }

        // Step 1: AI Moderation for videos
        if (mediaType === 'video') {
            try {
                console.log('🤖 Starting AI moderation...');
                
                // Get video metadata
                const metadata = await getVideoMetadata(mediaUri);
                
                // Extract hashtags
                const allHashtags = [...new Set([
                    ...caption.match(/#[\w]+/g) || [],
                    ...hashtags.split(/[\s,]+/).filter(tag => tag.startsWith('#'))
                ])].map(tag => tag.replace('#', ''));
                
                // Run AI moderation
                const moderationResult = await moderateVideo(
                    mediaUri,
                    caption,
                    allHashtags,
                    metadata.duration,
                    metadata.size
                );
                
                // Show result and get user confirmation
                const shouldProceed = await showModerationResult(moderationResult);
                
                if (!shouldProceed) {
                    return; // User cancelled or video rejected
                }
                
            } catch (error) {
                console.error('Moderation error:', error);
                Alert.alert('Error', 'Failed to moderate video. Please try again.');
                return;
            }
        }

        setUploading(true);
        setUploadProgress(0);

        try {
            console.log('📤 Starting upload to Firebase Storage...');
            
            let downloadURL = mediaUri;
            
            // Try Firebase Storage upload
            try {
                // Get file info
                const response = await fetch(mediaUri);
                const blob = await response.blob();
                
                // Create unique filename
                const timestamp = Date.now();
                const userId = user.id || user.phone || 'unknown';
                const fileExtension = mediaType === 'video' ? 'mp4' : 'jpg';
                const fileName = `${mediaType}s/${userId}_${timestamp}.${fileExtension}`;
                
                // Upload to Firebase Storage
                const storage = getStorage();
                const storageRef = ref(storage, fileName);
                const uploadTask = uploadBytesResumable(storageRef, blob);
                
                // Monitor upload progress
                downloadURL = await new Promise<string>((resolve, reject) => {
                    uploadTask.on(
                        'state_changed',
                        (snapshot) => {
                            const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
                            setUploadProgress(progress);
                            console.log(`Upload is ${progress.toFixed(0)}% done`);
                        },
                        (error) => {
                            console.error('Upload error:', error);
                            reject(error);
                        },
                        async () => {
                            // Upload complete, get download URL
                            const url = await getDownloadURL(uploadTask.snapshot.ref);
                            console.log('✅ File uploaded successfully:', url);
                            resolve(url);
                        }
                    );
                });
            } catch (storageError: any) {
                console.error('❌ Firebase Storage error:', storageError);
                
                // Check if it's the service account error
                if (storageError.code === 'storage/unauthorized' || 
                    storageError.message?.includes('service account')) {
                    console.warn('⚠️ Firebase Storage not configured, using local URL');
                    Alert.alert(
                        'Storage Setup Required',
                        'Firebase Storage needs configuration. Post will be saved with local reference. Please configure Firebase Storage in Console.',
                        [{ text: 'OK' }]
                    );
                    // Continue with local URI
                    downloadURL = mediaUri;
                } else {
                    throw storageError;
                }
            }
            
            // Create post document in Firestore (works even if Storage fails)
            (async () => {
            // Create post document in Firestore (works even if Storage fails)
            (async () => {
                // Extract hashtags from caption and hashtags field
                const allHashtags = [...new Set([
                    ...caption.match(/#[\w]+/g) || [],
                    ...hashtags.split(/[\s,]+/).filter(tag => tag.startsWith('#'))
                ])].map(tag => tag.replace('#', ''));

                // Create post document in Firestore
                const postData = {
                    userId: user.id || user.phone,
                    userName: user.name || 'Unknown Miner',
                    userRole: user.role,
                    userPhone: user.phone,
                    videoType: mediaType === 'video' ? 'video' : 'photo',
                    videoUrl: downloadURL, // Public URL from Firebase Storage or local URI
                    mediaUrl: downloadURL, // Backward compatibility
                    caption: caption.trim(),
                    hashtags: allHashtags,
                    likedBy: [],
                    savedBy: [],
                    comments: [],
                    shares: 0,
                    views: 0,
                    timestamp: serverTimestamp(),
                    createdAt: serverTimestamp(),
                    status: 'active',
                };

                await addDoc(collection(db, 'posts'), postData);
                console.log('✅ Post created in Firestore');

                Alert.alert(
                    'Success! 🎉',
                    'Your post has been uploaded and is now visible to all miners.',
                    [
                        {
                            text: 'View Feed',
                            onPress: () => router.push('/miner/Reels'),
                        },
                        {
                            text: 'Upload Another',
                            onPress: () => {
                                setMediaUri(null);
                                setMediaType(null);
                                setCaption('');
                                setHashtags('');
                                setUploadProgress(0);
                            },
                        },
                    ]
                );
            })();
            });
        } catch (error) {
            console.error('Error uploading post:', error);
            Alert.alert(
                'Upload Failed',
                'Could not upload your post. Please check your internet connection and try again.'
            );
        } finally {
            setUploading(false);
        }
    };

    return (
        <View style={styles.container}>
            <SafeAreaView style={styles.safeArea} edges={['top']}>
                {/* Header */}
                <View style={styles.header}>
                    <TouchableOpacity
                        style={styles.backButton}
                        onPress={() => router.back()}
                        activeOpacity={0.7}
                    >
                        <ArrowLeft size={24} color={COLORS.text} />
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>Share Content</Text>
                    <View style={{ width: 40 }} />
                </View>

                <ScrollView 
                    style={styles.scrollView}
                    contentContainerStyle={styles.scrollContent}
                    showsVerticalScrollIndicator={false}
                >
                    {/* Media Preview */}
                    {mediaUri ? (
                        <View style={styles.mediaPreviewContainer}>
                            {mediaType === 'photo' ? (
                                <Image source={{ uri: mediaUri }} style={styles.imagePreview} />
                            ) : (
                                <Video
                                    source={{ uri: mediaUri }}
                                    style={styles.videoPreview}
                                    useNativeControls
                                    resizeMode={'contain' as any}
                                    isLooping
                                />
                            )}
                            <TouchableOpacity
                                style={styles.clearButton}
                                onPress={clearMedia}
                                activeOpacity={0.8}
                            >
                                <X size={20} color="#FFF" />
                            </TouchableOpacity>
                        </View>
                    ) : (
                        <View style={styles.uploadOptions}>
                            <Text style={styles.uploadTitle}>📸 Choose Media Type</Text>
                            <Text style={styles.uploadSubtitle}>Share your mining experiences with the community</Text>

                            <View style={styles.optionsGrid}>
                                {/* Take Photo */}
                                <TouchableOpacity
                                    style={styles.optionCard}
                                    onPress={takePhoto}
                                    activeOpacity={0.8}
                                >
                                    <View style={[styles.optionIcon, { backgroundColor: '#3B82F6' + '20' }]}>
                                        <Camera size={32} color="#3B82F6" />
                                    </View>
                                    <Text style={styles.optionTitle}>Take Photo</Text>
                                    <Text style={styles.optionSubtitle}>Use camera</Text>
                                </TouchableOpacity>

                                {/* Pick Photo */}
                                <TouchableOpacity
                                    style={styles.optionCard}
                                    onPress={pickImage}
                                    activeOpacity={0.8}
                                >
                                    <View style={[styles.optionIcon, { backgroundColor: '#10B981' + '20' }]}>
                                        <ImageIcon size={32} color="#10B981" />
                                    </View>
                                    <Text style={styles.optionTitle}>Choose Photo</Text>
                                    <Text style={styles.optionSubtitle}>From gallery</Text>
                                </TouchableOpacity>

                                {/* Pick Video */}
                                <TouchableOpacity
                                    style={styles.optionCard}
                                    onPress={pickVideo}
                                    activeOpacity={0.8}
                                >
                                    <View style={[styles.optionIcon, { backgroundColor: '#F59E0B' + '20' }]}>
                                        <VideoIcon size={32} color="#F59E0B" />
                                    </View>
                                    <Text style={styles.optionTitle}>Choose Video</Text>
                                    <Text style={styles.optionSubtitle}>From gallery</Text>
                                </TouchableOpacity>
                            </View>
                        </View>
                    )}

                    {/* Caption Input */}
                    {mediaUri && (
                        <View style={styles.inputSection}>
                            <Text style={styles.inputLabel}>Caption *</Text>
                            <TextInput
                                style={styles.captionInput}
                                placeholder="Write a caption about your post..."
                                placeholderTextColor={COLORS.textMuted}
                                value={caption}
                                onChangeText={setCaption}
                                multiline
                                maxLength={500}
                            />
                            <Text style={styles.charCount}>{caption.length}/500</Text>
                        </View>
                    )}

                    {/* Hashtags Input */}
                    {mediaUri && (
                        <View style={styles.inputSection}>
                            <Text style={styles.inputLabel}>Hashtags (Optional)</Text>
                            <TextInput
                                style={styles.hashtagInput}
                                placeholder="#MiningSafety #Training #PPE"
                                placeholderTextColor={COLORS.textMuted}
                                value={hashtags}
                                onChangeText={setHashtags}
                            />
                            <Text style={styles.hashtagHint}>Separate with spaces. Max 5 tags.</Text>
                        </View>
                    )}

                    {/* Upload Button */}
                    {mediaUri && (
                        <>
                            <TouchableOpacity
                                style={[styles.uploadButton, uploading && styles.uploadButtonDisabled]}
                                onPress={handleUpload}
                                disabled={uploading}
                                activeOpacity={0.8}
                            >
                                {uploading ? (
                                    <>
                                        <ActivityIndicator color="#FFF" />
                                        <Text style={styles.uploadButtonText}>
                                            Uploading {uploadProgress.toFixed(0)}%
                                        </Text>
                                    </>
                                ) : (
                                    <>
                                        <Upload size={20} color="#FFF" />
                                        <Text style={styles.uploadButtonText}>Share with Community</Text>
                                    </>
                                )}
                            </TouchableOpacity>
                            
                            {/* Progress Bar */}
                            {uploading && (
                                <View style={styles.progressBarContainer}>
                                    <View 
                                        style={[
                                            styles.progressBarFill, 
                                            { width: `${uploadProgress}%` }
                                        ]} 
                                    />
                                </View>
                            )}
                        </>
                    )}

                    {/* Guidelines */}
                    <View style={styles.guidelinesCard}>
                        <Text style={styles.guidelinesTitle}>📋 Posting Guidelines</Text>
                        <View style={styles.guidelineItem}>
                            <Text style={styles.guidelineBullet}>✓</Text>
                            <Text style={styles.guidelineText}>Share safety-related content</Text>
                        </View>
                        <View style={styles.guidelineItem}>
                            <Text style={styles.guidelineBullet}>✓</Text>
                            <Text style={styles.guidelineText}>Training videos & best practices</Text>
                        </View>
                        <View style={styles.guidelineItem}>
                            <Text style={styles.guidelineBullet}>✓</Text>
                            <Text style={styles.guidelineText}>PPE demonstrations</Text>
                        </View>
                        <View style={styles.guidelineItem}>
                            <Text style={styles.guidelineBullet}>✓</Text>
                            <Text style={styles.guidelineText}>Equipment handling tips</Text>
                        </View>
                        <View style={styles.guidelineItem}>
                            <Text style={styles.guidelineBullet}>✗</Text>
                            <Text style={[styles.guidelineText, { color: '#EF4444' }]}>No inappropriate content</Text>
                        </View>
                    </View>
                </ScrollView>
            </SafeAreaView>
            <MinerFooter activeTab="home" />
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: COLORS.background,
    },
    safeArea: {
        flex: 1,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: COLORS.border,
    },
    backButton: {
        width: 40,
        height: 40,
        alignItems: 'center',
        justifyContent: 'center',
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: COLORS.text,
    },
    scrollView: {
        flex: 1,
    },
    scrollContent: {
        padding: 16,
        paddingBottom: 120,
    },
    uploadOptions: {
        marginBottom: 24,
    },
    uploadTitle: {
        fontSize: 24,
        fontWeight: '800',
        color: COLORS.text,
        marginBottom: 8,
        textAlign: 'center',
    },
    uploadSubtitle: {
        fontSize: 14,
        color: COLORS.textMuted,
        textAlign: 'center',
        marginBottom: 24,
    },
    optionsGrid: {
        gap: 16,
    },
    optionCard: {
        backgroundColor: COLORS.card,
        borderRadius: 16,
        padding: 20,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: COLORS.border,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    optionIcon: {
        width: 80,
        height: 80,
        borderRadius: 40,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 12,
    },
    optionTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: COLORS.text,
        marginBottom: 4,
    },
    optionSubtitle: {
        fontSize: 13,
        color: COLORS.textMuted,
    },
    mediaPreviewContainer: {
        position: 'relative',
        marginBottom: 20,
        borderRadius: 20,
        overflow: 'hidden',
        backgroundColor: COLORS.card,
        borderWidth: 1,
        borderColor: COLORS.border,
    },
    imagePreview: {
        width: '100%',
        aspectRatio: 9 / 16,
        borderRadius: 20,
    },
    videoPreview: {
        width: '100%',
        aspectRatio: 9 / 16,
    },
    clearButton: {
        position: 'absolute',
        top: 12,
        right: 12,
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: 'rgba(0, 0, 0, 0.7)',
        alignItems: 'center',
        justifyContent: 'center',
    },
    inputSection: {
        marginBottom: 20,
    },
    inputLabel: {
        fontSize: 14,
        fontWeight: '700',
        color: COLORS.text,
        marginBottom: 8,
    },
    captionInput: {
        backgroundColor: COLORS.card,
        borderRadius: 12,
        padding: 16,
        fontSize: 15,
        color: COLORS.text,
        minHeight: 120,
        textAlignVertical: 'top',
        borderWidth: 1,
        borderColor: COLORS.border,
    },
    charCount: {
        fontSize: 12,
        color: COLORS.textMuted,
        textAlign: 'right',
        marginTop: 4,
    },
    hashtagInput: {
        backgroundColor: COLORS.card,
        borderRadius: 12,
        padding: 16,
        fontSize: 15,
        color: COLORS.text,
        borderWidth: 1,
        borderColor: COLORS.border,
    },
    hashtagHint: {
        fontSize: 12,
        color: COLORS.textMuted,
        marginTop: 4,
    },
    uploadButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 12,
        backgroundColor: COLORS.primary,
        borderRadius: 16,
        padding: 18,
        marginBottom: 24,
        shadowColor: COLORS.primary,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 6,
    },
    uploadButtonDisabled: {
        opacity: 0.6,
    },
    uploadButtonText: {
        fontSize: 16,
        fontWeight: '700',
        color: '#FFF',
    },
    progressBarContainer: {
        height: 4,
        backgroundColor: COLORS.border,
        borderRadius: 2,
        marginTop: -16,
        marginBottom: 24,
        overflow: 'hidden',
    },
    progressBarFill: {
        height: '100%',
        backgroundColor: COLORS.primary,
        borderRadius: 2,
    },
    guidelinesCard: {
        backgroundColor: COLORS.card,
        borderRadius: 16,
        padding: 20,
        borderWidth: 1,
        borderColor: COLORS.border,
    },
    guidelinesTitle: {
        fontSize: 16,
        fontWeight: '700',
        color: COLORS.text,
        marginBottom: 16,
    },
    guidelineItem: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 12,
    },
    guidelineBullet: {
        fontSize: 16,
        fontWeight: '700',
        color: COLORS.primary,
        marginRight: 12,
        width: 24,
    },
    guidelineText: {
        fontSize: 14,
        color: COLORS.textMuted,
        flex: 1,
    },
});
