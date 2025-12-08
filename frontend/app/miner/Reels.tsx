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
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Video, ResizeMode, AVPlaybackStatus, Audio } from 'expo-av';
import { Heart, MessageCircle, Share2, Send, Bookmark, Volume2, User } from '../../components/Icons';
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
    increment
} from 'firebase/firestore';
import { db } from '../../config/firebase';

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
    videoUrl: string;
    videoType: 'photo' | 'video';
    likedBy: string[];
    savedBy: string[];
    comments: ReelComment[];
    shares: number;
    timestamp: any;
    hashtags?: string[];
}

// Reels data with actual video files from assets
const REELS_DATA: Reel[] = [
    {
        id: '1',
        userId: 'safety_officer_1',
        userName: 'Safety Officer Rajesh',
        caption: '🚨 Emergency Exit Procedures - Know your escape routes! Every second counts in an emergency. Stay prepared, stay safe! 🏃‍♂️ #EmergencyPrep #MiningSafety #SafetyFirst',
        videoUrl: require('../../assets/videos/reels/emergency_exit_procedure_20251207_174801.mp4'),
        videoType: 'video',
        likedBy: [],
        savedBy: [],
        comments: [],
        shares: 0,
        timestamp: Date.now() - 3600000,
        hashtags: ['EmergencyPrep', 'MiningSafety', 'SafetyFirst'],
    },
    {
        id: '2',
        userId: 'health_expert_1',
        userName: 'Dr. Priya Sharma',
        caption: '⚕️ Mining Related Diseases - Prevention is better than cure! Learn about occupational health risks and how to protect yourself. Your health matters! 💪 #MiningHealth #OccupationalSafety #HealthAwareness',
        videoUrl: require('../../assets/videos/reels/mining_related_diseases_20251208_163507.mp4'),
        videoType: 'video',
        likedBy: [],
        savedBy: [],
        comments: [],
        shares: 0,
        timestamp: Date.now() - 7200000,
        hashtags: ['MiningHealth', 'OccupationalSafety', 'HealthAwareness'],
    },
    {
        id: '3',
        userId: 'trainer_amit',
        userName: 'Trainer Amit Singh',
        caption: '🦺 PPE & Basic Tools - Your first line of defense! Always wear proper protective equipment. Helmet, boots, gloves, and more. Safety never takes a day off! ✅ #PPE #SafetyGear #ProtectiveEquipment',
        videoUrl: require('../../assets/videos/reels/test_video_generation_20251208_093146.mp4'),
        videoType: 'video',
        likedBy: [],
        savedBy: [],
        comments: [],
        shares: 0,
        timestamp: Date.now() - 10800000,
        hashtags: ['PPE', 'SafetyGear', 'ProtectiveEquipment'],
    },
    {
        id: '4',
        userId: 'engineer_sunita',
        userName: 'Engineer Sunita Devi',
        caption: '💨 Proper Ventilation Systems - Fresh air saves lives! Understanding ventilation is crucial for underground safety. Breathe easy, work safely! 🌬️ #Ventilation #AirQuality #MineSafety',
        videoUrl: require('../../assets/videos/reels/proper_ventilation_systems_20251207_204747.mp4'),
        videoType: 'video',
        likedBy: [],
        savedBy: [],
        comments: [],
        shares: 0,
        timestamp: Date.now() - 14400000,
        hashtags: ['Ventilation', 'AirQuality', 'MineSafety'],
    },
    {
        id: '5',
        userId: 'supervisor_vikram',
        userName: 'Supervisor Vikram Rao',
        caption: '🚛 Tipper Safety Protocol - Safe unloading procedures prevent accidents! Watch how proper technique saves lives. Follow the guidelines always! ⚠️ #TipperSafety #LoadManagement #SafetyProtocol',
        videoUrl: require('../../assets/videos/reels/the_tipper_content_should_be_unloaded_20251207_220332.mp4'),
        videoType: 'video',
        likedBy: [],
        savedBy: [],
        comments: [],
        shares: 0,
        timestamp: Date.now() - 18000000,
        hashtags: ['TipperSafety', 'LoadManagement', 'SafetyProtocol'],
    },
    {
        id: '6',
        userId: 'miner_arjun',
        userName: 'Arjun Kumar',
        caption: '⛏️ Daily safety check complete! Started my shift with proper inspection. Remember: Safety is not by accident, it\'s by choice! 🔒 #DailyCheck #MinerLife #SafetyFirst',
        videoUrl: require('../../assets/videos/reels/VID-20251209-WA0001.mp4'),
        videoType: 'video',
        likedBy: [],
        savedBy: [],
        comments: [],
        shares: 0,
        timestamp: Date.now() - 21600000,
        hashtags: ['DailyCheck', 'MinerLife', 'SafetyFirst'],
    },
    {
        id: '7',
        userId: 'miner_pooja',
        userName: 'Pooja Verma',
        caption: '🎯 Training completed! Level up with new safety certifications. Knowledge is power, safety is priority! 📚 #SafetyTraining #SkillDevelopment #MinerEducation',
        videoUrl: require('../../assets/videos/reels/VID-20251209-WA0002.mp4'),
        videoType: 'video',
        likedBy: [],
        savedBy: [],
        comments: [],
        shares: 0,
        timestamp: Date.now() - 25200000,
        hashtags: ['SafetyTraining', 'SkillDevelopment', 'MinerEducation'],
    },
    {
        id: '8',
        userId: 'miner_ravi',
        userName: 'Ravi Patel',
        caption: '🔦 Underground operations today! Proper lighting and communication are essential. Stay alert, stay connected! 💡 #UndergroundMining #TeamWork #SafeOps',
        videoUrl: require('../../assets/videos/reels/VID-20251209-WA0003.mp4'),
        videoType: 'video',
        likedBy: [],
        savedBy: [],
        comments: [],
        shares: 0,
        timestamp: Date.now() - 28800000,
        hashtags: ['UndergroundMining', 'TeamWork', 'SafeOps'],
    },
    {
        id: '9',
        userId: 'miner_meera',
        userName: 'Meera Reddy',
        caption: '👷‍♀️ Team coordination in action! When we work together, we work safer. Communication is key to zero accidents! 🤝 #TeamCoordination #SafetyCollaboration #WorkTogether',
        videoUrl: require('../../assets/videos/reels/VID-20251209-WA0004.mp4'),
        videoType: 'video',
        likedBy: [],
        savedBy: [],
        comments: [],
        shares: 0,
        timestamp: Date.now() - 32400000,
        hashtags: ['TeamCoordination', 'SafetyCollaboration', 'WorkTogether'],
    },
    {
        id: '10',
        userId: 'miner_deepak',
        userName: 'Deepak Joshi',
        caption: '⚙️ Equipment maintenance check! Well-maintained tools mean safer operations. Take care of your equipment, it takes care of you! 🔧 #Maintenance #ToolSafety #PreventiveCare',
        videoUrl: require('../../assets/videos/reels/VID-20251209-WA0005.mp4'),
        videoType: 'video',
        likedBy: [],
        savedBy: [],
        comments: [],
        shares: 0,
        timestamp: Date.now() - 36000000,
        hashtags: ['Maintenance', 'ToolSafety', 'PreventiveCare'],
    },
];

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

    const currentUserId = user?.id || user?.phone || '';

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

    // Load reels from Firebase
    useEffect(() => {
        const reelsRef = collection(db, 'posts');
        const q = query(reelsRef, orderBy('timestamp', 'desc'));

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const loadedReels: Reel[] = [];
            snapshot.forEach((doc) => {
                const data = doc.data();
                if (data.videoType === 'video') {
                    loadedReels.push({
                        id: doc.id,
                        userId: data.userId || '',
                        userName: data.userName || 'Unknown Miner',
                        userPhone: data.userPhone,
                        caption: data.caption || '',
                        videoUrl: data.videoUrl || '',
                        videoType: data.videoType,
                        likedBy: data.likedBy || [],
                        savedBy: data.savedBy || [],
                        comments: data.comments || [],
                        shares: data.shares || 0,
                        timestamp: data.timestamp,
                        hashtags: data.hashtags || [],
                    });
                }
            });
            
            // If no reels in Firebase, use local assets
            setReels(loadedReels.length > 0 ? loadedReels : REELS_DATA);
            setLoading(false);
            setRefreshing(false);
        });

        return () => unsubscribe();
    }, []);

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
        const reelRef = doc(db, 'posts', reelId);

        try {
            if (isLiked) {
                await updateDoc(reelRef, {
                    likedBy: arrayRemove(currentUserId)
                });
            } else {
                await updateDoc(reelRef, {
                    likedBy: arrayUnion(currentUserId)
                });
            }
        } catch (error) {
            console.error('Error updating like:', error);
        }
    };

    const handleSave = async (reelId: string) => {
        if (!currentUserId) return;

        const reel = reels.find(r => r.id === reelId);
        if (!reel) return;

        const isSaved = reel.savedBy.includes(currentUserId);
        const reelRef = doc(db, 'posts', reelId);

        try {
            if (isSaved) {
                await updateDoc(reelRef, {
                    savedBy: arrayRemove(currentUserId)
                });
            } else {
                await updateDoc(reelRef, {
                    savedBy: arrayUnion(currentUserId)
                });
            }
        } catch (error) {
            console.error('Error updating save:', error);
        }
    };

    const handleShare = async (reelId: string) => {
        const reelRef = doc(db, 'posts', reelId);
        try {
            await updateDoc(reelRef, {
                shares: increment(1)
            });
        } catch (error) {
            console.error('Error updating share:', error);
        }
    };

    const handleComment = async () => {
        if (!commentText.trim() || !currentUserId || !selectedReelId) return;

        const reelRef = doc(db, 'posts', selectedReelId);
        const newComment: ReelComment = {
            id: Date.now().toString(),
            userId: currentUserId,
            userName: user?.name || 'Miner',
            text: commentText.trim(),
            timestamp: serverTimestamp()
        };

        try {
            await updateDoc(reelRef, {
                comments: arrayUnion(newComment)
            });
            setCommentText('');
            setShowComments(false);
        } catch (error) {
            console.error('Error adding comment:', error);
        }
    };

    const toggleMute = () => {
        setIsMuted(!isMuted);
        // Update all video refs
        Object.values(videoRefs.current).forEach(video => {
            if (video) {
                video.setIsMutedAsync(!isMuted);
            }
        });
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

                    {/* Save */}
                    <TouchableOpacity 
                        style={styles.actionButton}
                        onPress={() => handleSave(item.id)}
                        activeOpacity={0.7}
                    >
                        <Bookmark 
                            size={30} 
                            color="#FFF"
                            fill={isSaved ? '#FFF' : 'none'}
                        />
                    </TouchableOpacity>
                </View>

                {/* Bottom info */}
                <View style={styles.bottomInfo}>
                    {/* User info */}
                    <View style={styles.userInfo}>
                        <View style={styles.avatar}>
                            <User size={20} color="#FFF" />
                        </View>
                        <Text style={styles.username}>{item.userName}</Text>
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
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 10,
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
        right: 12,
        bottom: 250,
        gap: 24,
    },
    actionButton: {
        alignItems: 'center',
        gap: 4,
    },
    actionText: {
        color: '#FFF',
        fontSize: 12,
        fontWeight: '600',
    },
    bottomInfo: {
        position: 'absolute',
        bottom: 125,
        left: 12,
        right: 80,
    },
    userInfo: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 12,
        gap: 8,
    },
    avatar: {
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: COLORS.primary,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 2,
        borderColor: '#FFF',
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
        paddingHorizontal: 16,
        paddingVertical: 6,
        borderRadius: 6,
        borderWidth: 1,
        borderColor: '#FFF',
    },
    followText: {
        color: '#FFF',
        fontSize: 13,
        fontWeight: '700',
    },
    caption: {
        color: '#FFF',
        fontSize: 14,
        lineHeight: 20,
        marginBottom: 12,
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
        padding: 8,
    },
    closeButton: {
        marginHorizontal: 16,
        marginTop: 12,
        paddingVertical: 14,
        backgroundColor: COLORS.background,
        borderRadius: 12,
        alignItems: 'center',
    },
    closeButtonText: {
        color: COLORS.text,
        fontSize: 16,
        fontWeight: '600',
    },
});
