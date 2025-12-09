import { useRouter } from 'expo-router';
import React, { useState, useRef, useEffect } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import {
    View,
    Text,
    StyleSheet,
    Dimensions,
    FlatList,
    TouchableOpacity,
    TextInput,
    Modal,
    ActivityIndicator,
    RefreshControl,
    ScrollView,
    Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Video, ResizeMode, AVPlaybackStatus, Audio } from 'expo-av';
import { Heart, MessageCircle, Share2, Send, Bookmark, Volume2, User, UserPlus, UserCheck, Eye } from '../../components/Icons';
import { COLORS } from '../../constants/styles';
import { useRoleStore } from '../../hooks/useRoleStore';
import { MinerFooter } from '../../components/BottomNav';
import { 
    collection, 
    query, 
    orderBy, 
    onSnapshot, 
    doc, 
    updateDoc, 
    arrayUnion, 
    arrayRemove,
    addDoc,
    serverTimestamp,
    getDoc,
    setDoc,
    increment,
    where
} from 'firebase/firestore';
import { db } from '../../config/firebase';
import {
    followUser,
    unfollowUser,
    likePost,
    unlikePost,
    savePost,
    addComment,
    sharePost,
    incrementPostViews,
    getUserProfile,
    initializeSocialProfile,
} from '../../services/socialService';
import * as Sharing from 'expo-sharing';
import { setStringAsync } from 'expo-clipboard';

const { width, height } = Dimensions.get('window');

interface ReelComment {
    id: string;
    userId: string;
    userName: string;
    text: string;
    timestamp: any;
}

interface Reel {
    id: string;
    userId: string;
    userName: string;
    userPhone?: string;
    caption: string;
    videoUrl: string | any;
    videoType: 'photo' | 'video';
    likedBy: string[];
    savedBy: string[];
    comments: ReelComment[];
    shares: number;
    views: number;
    timestamp: any;
    hashtags?: string[];
    isAssetVideo?: boolean; // Flag for videos loaded from local assets
}
export default function Reels() {
    const router = useRouter();
    const { user } = useRoleStore();
    const [reels, setReels] = useState<Reel[]>([]);
    const [currentIndex, setCurrentIndex] = useState(0);
    const videoRefs = useRef<{ [key: string]: Video | null }>({});
    const [showComments, setShowComments] = useState(false);
    const [selectedReelId, setSelectedReelId] = useState<string>('');
    const [commentText, setCommentText] = useState('');
    const [isMuted, setIsMuted] = useState(false);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [audioReady, setAudioReady] = useState(false);
    const flatListRef = useRef<FlatList>(null);
    const [followingUsers, setFollowingUsers] = useState<Set<string>>(new Set());
    const [userProfiles, setUserProfiles] = useState<Map<string, any>>(new Map());
    const viewedReels = useRef<Set<string>>(new Set()); // Track viewed reels to avoid duplicate counts

    const currentUserId = user?.id || user?.phone || '';
    const currentUserName = user?.name || 'User';

    // Initialize social profile on mount
    useEffect(() => {
        if (currentUserId) {
            initializeSocialProfile(currentUserId);
            loadUserFollowingList();
        }
    }, [currentUserId]);

    // Load user's following list
    const loadUserFollowingList = async () => {
        try {
            const userProfile = await getUserProfile(currentUserId);
            if (userProfile) {
                setFollowingUsers(new Set(userProfile.following));
            }
        } catch (error) {
            console.error('Error loading following list:', error);
        }
    };

    // Set up audio mode on component mount
    useEffect(() => {
        const setupAudio = async () => {
            try {
                await Audio.setAudioModeAsync({
                    playsInSilentModeIOS: true,
                    allowsRecordingIOS: false,
                    staysActiveInBackground: false,
                    shouldDuckAndroid: true,
                    playThroughEarpieceAndroid: false,
                });
                console.log('✅ Audio mode configured successfully');
                setAudioReady(true);
            } catch (error) {
                console.error('❌ Error setting audio mode:', error);
                // Set audioReady anyway to prevent blocking
                setAudioReady(true);
            }
        };

        setupAudio();
    }, []);

    // Pause all videos when navigating away from screen
    useFocusEffect(
        React.useCallback(() => {
            // Screen is focused - resume current video
            const resumeVideo = async () => {
                // Wait for audio session to be ready
                if (!audioReady) {
                    console.log('⏳ Waiting for audio session...');
                    return;
                }

                const currentReel = reels[currentIndex];
                if (currentReel && videoRefs.current[currentReel.id]) {
                    try {
                        await videoRefs.current[currentReel.id]?.playAsync();
                    } catch (error) {
                        console.log('Error resuming video:', error);
                    }
                }
            };

            resumeVideo();

            // Cleanup when screen loses focus
            return () => {
                // Stop and mute all videos when leaving the screen
                Object.values(videoRefs.current).forEach(async (video) => {
                    if (video) {
                        try {
                            await video.stopAsync();
                            await video.setIsMutedAsync(true);
                        } catch (error) {
                            console.log('Error stopping video:', error);
                        }
                    }
                });
            };
        }, [reels, currentIndex, audioReady])
    );

    // Load reels from Firebase - filter only videos
    useEffect(() => {
        const loadReels = async () => {
            const reelsRef = collection(db, 'posts');
            const q = query(
                reelsRef, 
                where('videoType', '==', 'video'),
                where('status', '==', 'active')
            );

            console.log('🔄 Loading reels from Firebase...');

            const unsubscribe = onSnapshot(q, async (snapshot) => {
                const loadedReels: Reel[] = [];

                snapshot.forEach((doc) => {
                    const data = doc.data();
                    
                    // Handle asset videos from local files
                    let videoUrl = data.videoUrl;
                    if (data.isAssetVideo && data.videoUrl?.startsWith('asset://')) {
                        const fileName = data.videoUrl.replace('asset://', '');
                        // Map to local asset
                        const assetMap: { [key: string]: any } = {
                            'videos/reels/emergency_exit_procedure_20251207_174801.mp4': require('@/assets/videos/reels/emergency_exit_procedure_20251207_174801.mp4'),
                            'videos/reels/test_video_generation_20251208_093146.mp4': require('@/assets/videos/reels/test_video_generation_20251208_093146.mp4'),
                            'videos/reels/proper_ventilation_systems_20251207_204747.mp4': require('@/assets/videos/reels/proper_ventilation_systems_20251207_204747.mp4'),
                            'videos/reels/the_tipper_content_should_be_unloaded_20251207_220332.mp4': require('@/assets/videos/reels/the_tipper_content_should_be_unloaded_20251207_220332.mp4'),
                            'videos/reels/VID-20251209-WA0001.mp4': require('@/assets/videos/reels/VID-20251209-WA0001.mp4'),
                            'videos/reels/VID-20251209-WA0002.mp4': require('@/assets/videos/reels/VID-20251209-WA0002.mp4'),
                            'videos/reels/VID-20251209-WA0003.mp4': require('@/assets/videos/reels/VID-20251209-WA0003.mp4'),
                            'videos/reels/VID-20251209-WA0004.mp4': require('@/assets/videos/reels/VID-20251209-WA0004.mp4'),
                            'videos/reels/VID-20251209-WA0005.mp4': require('@/assets/videos/reels/VID-20251209-WA0005.mp4'),
                        };
                        videoUrl = assetMap[fileName] || videoUrl;
                    }
                    
                    loadedReels.push({
                        id: doc.id,
                        userId: data.userId || '',
                        userName: data.userName || 'Unknown Miner',
                        userPhone: data.userPhone,
                        caption: data.caption || '',
                        videoUrl,
                        videoType: 'video',
                        likedBy: data.likedBy || [],
                        savedBy: data.savedBy || [],
                        comments: data.comments || [],
                        shares: data.shares || 0,
                        views: data.views || 0,
                        timestamp: data.timestamp,
                        hashtags: data.hashtags || [],
                        isAssetVideo: data.isAssetVideo || false,
                    });
                });
                
                // Add test miner's blasting safety reel if not already present
                const testMinerPhone = '+1234567890';
                const hasBlastingReel = loadedReels.some(r => 
                    r.userId === testMinerPhone && r.caption.includes('Blasting Safety')
                );
                
                if (!hasBlastingReel) {
                    loadedReels.unshift({
                        id: 'test_miner_blasting_reel',
                        userId: testMinerPhone,
                        userName: 'Test Miner',
                        userPhone: testMinerPhone,
                        caption: '🧨 Blasting Safety Procedures - Essential safety protocols for mining blast operations! Minimum safe distance, proper evacuation, and licensed handling only. Stay safe! 💥 #BlastingSafety #Mining #SafetyFirst',
                        videoUrl: require('@/assets/videos/reels/VID-20251209-WA0001.mp4'),
                        videoType: 'video',
                        likedBy: [],
                        savedBy: [],
                        comments: [],
                        shares: 0,
                        views: 0,
                        timestamp: new Date(),
                        hashtags: ['BlastingSafety', 'Mining', 'SafetyFirst'],
                        isAssetVideo: true,
                    });
                }
                
                console.log(`✅ Loaded ${loadedReels.length} reels from Firebase`);
                setReels(loadedReels);
                setLoading(false);
                setRefreshing(false);
            });

            return () => unsubscribe();
        };

        loadReels();
    }, []);

    // Track reel views when scrolling
    useEffect(() => {
        if (reels.length > 0 && currentIndex < reels.length) {
            const currentReel = reels[currentIndex];
            
            if (!viewedReels.current.has(currentReel.id)) {
                // Mark as viewed for this user session
                viewedReels.current.add(currentReel.id);
                
                // Skip Firebase sync for asset videos
                if (!currentReel.isAssetVideo) {
                    incrementPostViews(currentReel.id);
                    console.log(`📊 View counted for reel: ${currentReel.id}`);
                } else {
                    console.log(`📊 Asset video view (local only): ${currentReel.id}`);
                }
            }
        }
    }, [currentIndex, reels, currentUserName]);

    // Cleanup all videos when component unmounts
    useEffect(() => {
        return () => {
            // Stop and unload all videos on component unmount
            Object.values(videoRefs.current).forEach(async (video) => {
                if (video) {
                    try {
                        await video.stopAsync();
                        await video.unloadAsync();
                    } catch (error) {
                        console.log('Error cleaning up video:', error);
                    }
                }
            });
        };
    }, []);

    const handleRefresh = () => {
        setRefreshing(true);
    };

    const handleLike = async (reelId: string) => {
        if (!currentUserId) return;

        const reel = reels.find(r => r.id === reelId);
        if (!reel) return;

        const isLiked = reel.likedBy.includes(currentUserId);

        // Optimistic update - update UI immediately
        setReels(prevReels => prevReels.map(r => {
            if (r.id === reelId) {
                return {
                    ...r,
                    likedBy: isLiked 
                        ? r.likedBy.filter(id => id !== currentUserId)
                        : [...r.likedBy, currentUserId]
                };
            }
            return r;
        }));

        // Only sync to Firebase for non-asset videos
        if (!reel.isAssetVideo) {
            try {
                if (isLiked) {
                    await unlikePost(reelId, currentUserId, reel.userId);
                } else {
                    await likePost(reelId, currentUserId, currentUserName, reel.userId);
                }
            } catch (error) {
                console.error('Error updating like:', error);
                // Revert optimistic update on error
                setReels(prevReels => prevReels.map(r => {
                    if (r.id === reelId) {
                        return {
                            ...r,
                            likedBy: isLiked 
                                ? [...r.likedBy, currentUserId]
                                : r.likedBy.filter(id => id !== currentUserId)
                        };
                    }
                    return r;
                }));
            }
        }
    };

    const handleSave = async (reelId: string) => {
        if (!currentUserId) return;

        const reel = reels.find(r => r.id === reelId);
        if (!reel) return;

        const isSaved = reel.savedBy.includes(currentUserId);

        // Optimistic update
        setReels(prevReels => prevReels.map(r => {
            if (r.id === reelId) {
                return {
                    ...r,
                    savedBy: isSaved
                        ? r.savedBy.filter(id => id !== currentUserId)
                        : [...r.savedBy, currentUserId]
                };
            }
            return r;
        }));

        // Only sync to Firebase for non-asset videos
        if (!reel.isAssetVideo) {
            try {
                const success = await savePost(reelId, currentUserId);
                if (success) {
                    console.log(isSaved ? '✅ Removed from saved' : '💾 Saved to collection');
                }
            } catch (error) {
                console.error('Error updating save:', error);
                // Revert on error
                setReels(prevReels => prevReels.map(r => {
                    if (r.id === reelId) {
                        return {
                            ...r,
                            savedBy: isSaved
                                ? [...r.savedBy, currentUserId]
                                : r.savedBy.filter(id => id !== currentUserId)
                        };
                    }
                    return r;
                }));
            }
        } else {
            Alert.alert(
                isSaved ? '✅ Removed' : '💾 Saved!',
                isSaved 
                    ? 'Content removed from saved'
                    : 'Content saved locally'
            );
        }
    };

    const handleShare = async (reelId: string) => {
        const reel = reels.find(r => r.id === reelId);
        if (!reel) return;

        try {
            // Show share options
            Alert.alert(
                '📤 Share Reel',
                'Choose how to share this content',
                [
                    {
                        text: 'Copy Link',
                        onPress: async () => {
                            // Optimistic update - increment share count
                            setReels(prevReels => prevReels.map(r => {
                                if (r.id === reelId) {
                                    return { ...r, shares: (r.shares || 0) + 1 };
                                }
                                return r;
                            }));

                            await setStringAsync(`minerva://reel/${reelId}`);
                            
                            // Only sync to Firebase for non-asset videos
                            if (!reel.isAssetVideo) {
                                await sharePost(reelId, currentUserId, currentUserName, reel.userId);
                            }
                            
                            console.log('✅ Link copied to clipboard');
                        }
                    },
                    {
                        text: 'Share via...',
                        onPress: async () => {
                            const isAvailable = await Sharing.isAvailableAsync();
                            if (isAvailable) {
                                // Optimistic update - increment share count
                                setReels(prevReels => prevReels.map(r => {
                                    if (r.id === reelId) {
                                        return { ...r, shares: (r.shares || 0) + 1 };
                                    }
                                    return r;
                                }));

                                // Only sync to Firebase for non-asset videos
                                if (!reel.isAssetVideo) {
                                    await sharePost(reelId, currentUserId, currentUserName, reel.userId);
                                }
                                
                                console.log('✅ Share successful');
                            } else {
                                console.log('❌ Sharing not available on this device');
                            }
                        }
                    },
                    { text: 'Cancel', style: 'cancel' }
                ]
            );
        } catch (error) {
            console.error('Error sharing:', error);
            console.log('❌ Failed to share reel');
        }
    };

    const handleComment = async () => {
        if (!commentText.trim() || !currentUserId || !selectedReelId) return;

        const reel = reels.find(r => r.id === selectedReelId);
        if (!reel) return;

        const newComment: ReelComment = {
            id: `temp_${Date.now()}`,
            userId: currentUserId,
            userName: currentUserName,
            text: commentText.trim(),
            timestamp: Date.now()
        };

        // Optimistic update - add comment immediately to UI
        setReels(prevReels => prevReels.map(r => {
            if (r.id === selectedReelId) {
                return {
                    ...r,
                    comments: [...r.comments, newComment]
                };
            }
            return r;
        }));

        setCommentText('');

        // Only sync to Firebase for non-asset videos
        if (!reel.isAssetVideo) {
            try {
                await addComment(
                    selectedReelId,
                    currentUserId,
                    currentUserName,
                    newComment.text,
                    reel.userId
                );
                console.log('✅ Comment added');
            } catch (error) {
                console.error('Error adding comment:', error);
                console.log('❌ Failed to add comment');
            }
        } else {
            console.log('✅ Comment saved for demo reel');
        }
    };

    const handleFollow = async (userId: string) => {
        if (!currentUserId || userId === currentUserId) return;

        const isFollowing = followingUsers.has(userId);

        // Optimistic update - update UI immediately
        if (isFollowing) {
            setFollowingUsers(prev => {
                const newSet = new Set(prev);
                newSet.delete(userId);
                return newSet;
            });
        } else {
            setFollowingUsers(prev => new Set([...prev, userId]));
        }

        try {
            if (isFollowing) {
                const success = await unfollowUser(currentUserId, userId);
                if (success) {
                    console.log('✅ Successfully unfollowed user:', userId);
                } else {
                    // Revert on failure
                    setFollowingUsers(prev => new Set([...prev, userId]));
                    console.log('❌ Failed to unfollow user');
                }
            } else {
                const success = await followUser(currentUserId, userId);
                if (success) {
                    console.log('✅ Successfully followed user:', userId);
                } else {
                    // Revert on failure
                    setFollowingUsers(prev => {
                        const newSet = new Set(prev);
                        newSet.delete(userId);
                        return newSet;
                    });
                    console.log('❌ Failed to follow user');
                }
            }
        } catch (error) {
            console.error('Error following/unfollowing:', error);
            // Revert on error
            if (isFollowing) {
                setFollowingUsers(prev => new Set([...prev, userId]));
            } else {
                setFollowingUsers(prev => {
                    const newSet = new Set(prev);
                    newSet.delete(userId);
                    return newSet;
                });
            }
            Alert.alert('❌ Error', 'Failed to update follow status');
        }
    };

    const handleViewProfile = async (userId: string) => {
        try {
            const profile = await getUserProfile(userId);
            if (profile) {
                Alert.alert(
                    `👤 ${profile.name}`,
                    `Role: ${profile.role}\n` +
                    `Department: ${profile.department || 'N/A'}\n` +
                    `Posts: ${profile.postsCount}\n` +
                    `Followers: ${profile.followersCount}\n` +
                    `Following: ${profile.followingCount}\n` +
                    `Total Likes: ${profile.likesCount}`,
                    [{ text: 'Close' }]
                );
            }
        } catch (error) {
            console.error('Error viewing profile:', error);
        }
    };

    const toggleMute = async () => {
        const newMutedState = !isMuted;
        setIsMuted(newMutedState);
        
        // Update all video refs
        try {
            const promises = Object.values(videoRefs.current).map(video => {
                if (video) {
                    return video.setIsMutedAsync(newMutedState).catch(err => {
                        console.log('Error toggling mute:', err);
                    });
                }
                return Promise.resolve();
            });
            await Promise.all(promises);
            console.log(`🔊 Audio ${newMutedState ? 'muted' : 'unmuted'}`);
        } catch (error) {
            console.error('Error toggling mute:', error);
        }
    };

    if (loading) {
        return (
            <SafeAreaView style={styles.container} edges={['top']}>
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color={COLORS.primary} />
                    <Text style={styles.loadingText}>Loading reels...</Text>
                </View>
                <MinerFooter activeTab="reels" />
            </SafeAreaView>
        );
    }

    const renderReel = ({ item, index }: { item: Reel; index: number }) => {
        const isLiked = item.likedBy.includes(currentUserId);
        const isSaved = item.savedBy.includes(currentUserId);
        const isLocalVideo = typeof item.videoUrl === 'number'; // Check if it's a local require()

        return (
            <View style={styles.reelContainer}>
                {/* Video Player */}
                <Video
                    ref={(ref) => {
                        videoRefs.current[item.id] = ref;
                    }}
                    source={isLocalVideo ? item.videoUrl as any : { uri: item.videoUrl as string }}
                    style={styles.video}
                    resizeMode={ResizeMode.COVER}
                    shouldPlay={index === currentIndex}
                    isLooping
                    isMuted={isMuted}
                    onPlaybackStatusUpdate={(status: AVPlaybackStatus) => {
                        if (status.isLoaded && 'isPlaying' in status) {
                            // Auto-play current video only if audio is ready
                            if (index === currentIndex && !status.isPlaying && audioReady) {
                                videoRefs.current[item.id]?.playAsync().catch((error) => {
                                    console.log('Playback error:', error.message);
                                });
                            }
                            // Pause other videos
                            if (index !== currentIndex && status.isPlaying) {
                                videoRefs.current[item.id]?.pauseAsync().catch(() => {});
                            }
                        }
                    }}
                />

                {/* Top gradient overlay */}
                <LinearGradient
                    colors={['rgba(0,0,0,0.6)', 'transparent']}
                    style={styles.topGradient}
                />

                {/* Mute/Unmute Button */}
                <TouchableOpacity 
                    style={styles.muteButton}
                    onPress={toggleMute}
                    activeOpacity={0.7}
                >
                    {isMuted ? (
                        <View style={{ opacity: 0.5 }}>
                            <Volume2 size={24} color="#FFF" />
                            <View style={{ position: 'absolute', top: 12, left: 12, width: 2, height: 24, backgroundColor: '#FFF', transform: [{ rotate: '45deg' }] }} />
                        </View>
                    ) : (
                        <Volume2 size={24} color="#FFF" />
                    )}
                </TouchableOpacity>

                {/* Bottom gradient overlay */}
                <LinearGradient
                    colors={['transparent', 'rgba(0,0,0,0.8)']}
                    style={styles.bottomGradient}
                />

                {/* Right side actions */}
                <View style={styles.rightActions}>
                    {/* Like */}
                    <TouchableOpacity 
                        style={styles.actionButton}
                        onPress={() => handleLike(item.id)}
                        activeOpacity={0.7}
                    >
                        <Heart 
                            size={32} 
                            color={isLiked ? '#EF4444' : '#FFF'} 
                            fill={isLiked ? '#EF4444' : 'none'}
                        />
                        <Text style={styles.actionText}>{item.likedBy.length}</Text>
                    </TouchableOpacity>

                    {/* Comment */}
                    <TouchableOpacity 
                        style={styles.actionButton}
                        onPress={() => {
                            setSelectedReelId(item.id);
                            setShowComments(true);
                        }}
                        activeOpacity={0.7}
                    >
                        <MessageCircle size={32} color="#FFF" />
                        <Text style={styles.actionText}>{item.comments.length}</Text>
                    </TouchableOpacity>

                    {/* Share */}
                    <TouchableOpacity 
                        style={styles.actionButton}
                        onPress={() => handleShare(item.id)}
                        activeOpacity={0.7}
                    >
                        <Share2 size={30} color="#FFF" />
                        <Text style={styles.actionText}>{item.shares}</Text>
                    </TouchableOpacity>
                </View>

                {/* Bottom info */}
                <View style={styles.bottomInfo}>
                    {/* User info with Follow button */}
                    <View style={styles.userInfoRow}>
                        <TouchableOpacity 
                            style={styles.userInfoLeft}
                            onPress={() => handleViewProfile(item.userId)}
                            activeOpacity={0.7}
                        >
                            <View style={styles.avatar}>
                                <User size={20} color="#FFF" />
                            </View>
                            <Text style={styles.username}>{item.userName}</Text>
                        </TouchableOpacity>
                        
                        {/* Follow/Unfollow Button */}
                        {item.userId !== currentUserId && (
                            <TouchableOpacity
                                style={[
                                    styles.followButton,
                                    followingUsers.has(item.userId) && styles.followingButton
                                ]}
                                onPress={() => handleFollow(item.userId)}
                                activeOpacity={0.7}
                            >
                                {followingUsers.has(item.userId) ? (
                                    <>
                                        <UserCheck size={14} color={COLORS.primary} />
                                        <Text style={styles.followingText}>Following</Text>
                                    </>
                                ) : (
                                    <>
                                        <UserPlus size={14} color="#FFF" />
                                        <Text style={styles.followText}>Follow</Text>
                                    </>
                                )}
                            </TouchableOpacity>
                        )}
                    </View>

                    {/* Caption */}
                    <Text style={styles.caption} numberOfLines={2}>
                        {item.caption}
                    </Text>
                </View>
            </View>
        );
    };

    return (
        <SafeAreaView style={styles.container} edges={['top']}>
            <FlatList
                ref={flatListRef}
                data={reels}
                renderItem={renderReel}
                keyExtractor={(item) => item.id}
                pagingEnabled
                showsVerticalScrollIndicator={false}
                refreshControl={
                    <RefreshControl
                        refreshing={refreshing}
                        onRefresh={handleRefresh}
                        tintColor="#FFF"
                    />
                }
                onMomentumScrollEnd={(e) => {
                    const index = Math.round(e.nativeEvent.contentOffset.y / height);
                    setCurrentIndex(index);
                }}
                snapToInterval={height}
                snapToAlignment="start"
                decelerationRate="fast"
            />

            {/* Comments Modal */}
            <Modal
                visible={showComments}
                animationType="slide"
                transparent={true}
            >
                <View style={styles.modalContainer}>
                    <View style={styles.commentsSheet}>
                        <View style={styles.sheetHandle} />
                        <Text style={styles.commentsTitle}>Comments</Text>
                        
                        <ScrollView style={styles.commentsScroll}>
                            {reels.find(r => r.id === selectedReelId)?.comments.length === 0 ? (
                                <View style={styles.commentsPlaceholder}>
                                    <MessageCircle size={48} color={COLORS.textMuted} />
                                    <Text style={styles.noCommentsText}>No comments yet</Text>
                                    <Text style={styles.noCommentsSubtext}>Be the first to comment!</Text>
                                </View>
                            ) : (
                                reels.find(r => r.id === selectedReelId)?.comments.map((comment) => (
                                    <View key={comment.id} style={styles.commentItem}>
                                        <View style={styles.commentAvatar}>
                                            <User size={16} color={COLORS.text} />
                                        </View>
                                        <View style={styles.commentContent}>
                                            <Text style={styles.commentUserName}>{comment.userName}</Text>
                                            <Text style={styles.commentText}>{comment.text}</Text>
                                        </View>
                                    </View>
                                ))
                            )}
                        </ScrollView>

                        <View style={styles.commentInput}>
                            <View style={styles.inputAvatar}>
                                <Text style={styles.inputAvatarText}>{user?.name?.[0] || 'M'}</Text>
                            </View>
                            <TextInput
                                style={styles.input}
                                placeholder="Add a comment..."
                                placeholderTextColor={COLORS.textMuted}
                                value={commentText}
                                onChangeText={setCommentText}
                                multiline
                            />
                            <TouchableOpacity 
                                style={styles.sendButton}
                                onPress={handleComment}
                                disabled={!commentText.trim()}
                            >
                                <Send 
                                    size={20} 
                                    color={commentText.trim() ? COLORS.primary : COLORS.textMuted} 
                                />
                            </TouchableOpacity>
                        </View>

                        <TouchableOpacity 
                            style={styles.closeButton}
                            onPress={() => {
                                setShowComments(false);
                                setCommentText('');
                            }}
                        >
                            <Text style={styles.closeButtonText}>Close</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>

            <MinerFooter activeTab="reels" />
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: COLORS.background,
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    loadingText: {
        marginTop: 16,
        fontSize: 16,
        color: COLORS.textMuted,
    },
    reelContainer: {
        width: width,
        height: height,
        position: 'relative',
    },
    video: {
        width: width,
        height: height,
    },
    topGradient: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        height: 100,
    },
    muteButton: {
        position: 'absolute',
        top: 60,
        right: 16,
        width: 48,
        height: 48,
        borderRadius: 24,
        backgroundColor: 'rgba(0, 0, 0, 0.6)',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 10,
        borderWidth: 2,
        borderColor: 'rgba(255, 255, 255, 0.3)',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.4,
        shadowRadius: 8,
        elevation: 8,
    },
    bottomGradient: {
        position: 'absolute',
        bottom: 90,
        left: 0,
        right: 0,
        height: 280,
    },
    rightActions: {
        position: 'absolute',
        right: 16,
        bottom: 250,
        gap: 20,
        alignItems: 'center',
    },
    actionButton: {
        alignItems: 'center',
        gap: 6,
        padding: 8,
        borderRadius: 28,
        backgroundColor: 'rgba(0, 0, 0, 0.3)',
        minWidth: 56,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.3,
        shadowRadius: 4,
        elevation: 4,
    },
    actionText: {
        color: '#FFF',
        fontSize: 13,
        fontWeight: '700',
        textShadowColor: 'rgba(0, 0, 0, 0.8)',
        textShadowOffset: { width: 0, height: 1 },
        textShadowRadius: 3,
    },
    bottomInfo: {
        position: 'absolute',
        bottom: 145,
        left: 12,
        right: 80,
    },
    userInfoRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 12,
    },
    userInfoLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        flex: 1,
    },
    userInfo: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 12,
        gap: 8,
    },
    avatar: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: COLORS.primary,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 2.5,
        borderColor: '#FFF',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.3,
        shadowRadius: 4,
        elevation: 4,
    },
    avatarText: {
        color: '#FFF',
        fontSize: 16,
        fontWeight: '700',
    },
    username: {
        color: '#FFF',
        fontSize: 14,
        fontWeight: '700',
        flex: 1,
    },
    followButton: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        paddingHorizontal: 20,
        paddingVertical: 8,
        borderRadius: 24,
        backgroundColor: COLORS.primary,
        borderWidth: 2,
        borderColor: '#FFF',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.4,
        shadowRadius: 6,
        elevation: 6,
        minWidth: 100,
        justifyContent: 'center',
    },
    followingButton: {
        backgroundColor: 'rgba(255, 255, 255, 0.95)',
        borderColor: COLORS.primary,
    },
    followText: {
        color: '#FFF',
        fontSize: 14,
        fontWeight: '800',
        letterSpacing: 0.5,
        textShadowColor: 'rgba(0, 0, 0, 0.3)',
        textShadowOffset: { width: 0, height: 1 },
        textShadowRadius: 2,
    },
    followingText: {
        color: COLORS.primary,
        fontSize: 14,
        fontWeight: '800',
        letterSpacing: 0.5,
    },
    statsRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 16,
        marginTop: 8,
    },
    statItem: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
    },
    statText: {
        color: 'rgba(255,255,255,0.8)',
        fontSize: 11,
        fontWeight: '600',
    },
    caption: {
        color: '#FFF',
        fontSize: 14,
        lineHeight: 20,
        marginBottom: 4,
        marginTop: 8,
    },
    audioInfo: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    audioText: {
        color: '#FFF',
        fontSize: 12,
        flex: 1,
    },
    modalContainer: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'flex-end',
    },
    commentsSheet: {
        backgroundColor: COLORS.card,
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
        paddingBottom: 40,
        maxHeight: '70%',
    },
    sheetHandle: {
        width: 40,
        height: 4,
        backgroundColor: COLORS.border,
        borderRadius: 2,
        alignSelf: 'center',
        marginTop: 12,
        marginBottom: 16,
    },
    commentsTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: COLORS.text,
        textAlign: 'center',
        marginBottom: 20,
    },
    commentsScroll: {
        maxHeight: 400,
        paddingHorizontal: 16,
    },
    commentItem: {
        flexDirection: 'row',
        paddingVertical: 12,
        gap: 12,
    },
    commentAvatar: {
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: COLORS.card,
        borderWidth: 1,
        borderColor: COLORS.border,
        alignItems: 'center',
        justifyContent: 'center',
    },
    commentContent: {
        flex: 1,
    },
    commentUserName: {
        fontSize: 14,
        fontWeight: '600',
        color: COLORS.text,
        marginBottom: 4,
    },
    commentText: {
        fontSize: 14,
        color: COLORS.text,
        lineHeight: 20,
    },
    commentsPlaceholder: {
        alignItems: 'center',
        paddingVertical: 60,
    },
    noCommentsText: {
        fontSize: 16,
        fontWeight: '600',
        color: COLORS.text,
        marginTop: 16,
    },
    noCommentsSubtext: {
        fontSize: 14,
        color: COLORS.textMuted,
        marginTop: 4,
    },
    commentInput: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderTopWidth: 1,
        borderTopColor: COLORS.border,
        gap: 12,
    },
    inputAvatar: {
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: COLORS.primary,
        alignItems: 'center',
        justifyContent: 'center',
    },
    inputAvatarText: {
        color: '#FFF',
        fontSize: 14,
        fontWeight: '700',
    },
    input: {
        flex: 1,
        color: COLORS.text,
        fontSize: 14,
        maxHeight: 100,
    },
    sendButton: {
        padding: 10,
        borderRadius: 20,
        backgroundColor: 'rgba(255, 107, 0, 0.1)',
        width: 40,
        height: 40,
        alignItems: 'center',
        justifyContent: 'center',
    },
    closeButton: {
        marginHorizontal: 16,
        marginTop: 16,
        paddingVertical: 16,
        backgroundColor: COLORS.background,
        borderRadius: 16,
        alignItems: 'center',
        borderWidth: 2,
        borderColor: COLORS.border,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 4,
        elevation: 4,
    },
    closeButtonText: {
        color: COLORS.text,
        fontSize: 17,
        fontWeight: '700',
        letterSpacing: 0.5,
    },
});
