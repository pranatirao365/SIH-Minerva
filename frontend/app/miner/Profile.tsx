import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    Alert,
    ScrollView,
    Image,
    Dimensions,
    ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useRoleStore } from '../../hooks/useRoleStore';
import { COLORS } from '../../constants/styles';
import { 
    AlertTriangle, 
    LogOut, 
    User, 
    Shield, 
    Grid, 
    Video, 
    Award, 
    Settings, 
    MoreVertical,
    Edit
} from '../../components/Icons';
import { MinerFooter } from '../../components/BottomNav';
import { getUserProfile, initializeSocialProfile } from '../../services/socialService';
import { collection, query, where, getDocs, doc, onSnapshot } from 'firebase/firestore';
import { db } from '../../config/firebase';

const { width } = Dimensions.get('window');
const GRID_ITEM_SIZE = (width - 48) / 3; // 3 columns with padding

type TabType = 'posts' | 'reels' | 'safety';

export default function MinerProfileScreen() {
    const router = useRouter();
    const { user, logout, safetyScore } = useRoleStore();
    const [activeTab, setActiveTab] = useState<TabType>('posts');
    const [profileData, setProfileData] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    const currentUserId = user?.id || user?.phone || '';

    // Load profile data
    useEffect(() => {
        loadProfileData();
    }, [currentUserId]);

    // Real-time listener for profile updates (followers, following, etc.)
    useEffect(() => {
        if (!currentUserId) return;

        console.log('👤 Setting up real-time profile listener for:', currentUserId);
        
        const userDocRef = doc(db, 'users', currentUserId);
        const unsubscribe = onSnapshot(userDocRef, async (docSnapshot) => {
            if (docSnapshot.exists()) {
                const userData = docSnapshot.data();
                
                // Count user's posts
                const postsQuery = query(
                    collection(db, 'posts'),
                    where('userId', '==', currentUserId)
                );
                const postsSnapshot = await getDocs(postsQuery);
                const postsCount = postsSnapshot.size;
                
                setProfileData({
                    id: docSnapshot.id,
                    name: userData.name || 'Unknown User',
                    phone: userData.phone || '',
                    role: userData.role || 'miner',
                    avatar: userData.avatar,
                    bio: userData.bio || '',
                    department: userData.department,
                    followers: userData.followers || [],
                    following: userData.following || [],
                    postsCount: postsCount,
                    followersCount: userData.followersCount || 0,
                    followingCount: userData.followingCount || 0,
                    likesCount: userData.likesCount || 0,
                });
                
                console.log('🔄 Profile updated:', {
                    followers: userData.followersCount || 0,
                    following: userData.followingCount || 0,
                    posts: postsCount
                });
            }
        }, (error) => {
            console.error('Error listening to profile updates:', error);
        });

        return () => {
            console.log('🔌 Unsubscribing from profile listener');
            unsubscribe();
        };
    }, [currentUserId]);

    const loadProfileData = async () => {
        if (!currentUserId) return;

        try {
            setLoading(true);
            
            // Initialize social profile if needed
            await initializeSocialProfile(currentUserId);
            
            // Get user profile
            const profile = await getUserProfile(currentUserId);
            
            // Count user's posts
            const postsQuery = query(
                collection(db, 'posts'),
                where('userId', '==', currentUserId)
            );
            const postsSnapshot = await getDocs(postsQuery);
            const postsCount = postsSnapshot.size;
            
            setProfileData({
                ...profile,
                postsCount,
            });
        } catch (error) {
            console.error('Error loading profile:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleLogout = () => {
        Alert.alert(
            'Logout',
            'Are you sure you want to logout?',
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Logout',
                    style: 'destructive',
                    onPress: () => {
                        logout();
                        // Use push with a small delay to ensure state is cleared
                        setTimeout(() => {
                            router.push('/auth/PhoneLogin' as any);
                        }, 100);
                    },
                },
            ]
        );
    };

    return (
        <SafeAreaView style={styles.container} edges={['top']}>
            <ScrollView 
                style={styles.scrollView} 
                contentContainerStyle={{ paddingBottom: 100 }}
                showsVerticalScrollIndicator={false}
            >
                {/* Header */}
                <View style={styles.header}>
                    <Text style={styles.username}>{user.name || 'Miner'}</Text>
                    <TouchableOpacity 
                        style={styles.logoutButton}
                        onPress={handleLogout}
                        activeOpacity={0.8}
                    >
                        <Text style={styles.logoutButtonText}>Logout</Text>
                    </TouchableOpacity>
                </View>

                {/* Profile Info */}
                <View style={styles.profileSection}>
                    {/* Avatar & Stats */}
                    <View style={styles.statsRow}>
                        {/* Avatar */}
                        <View style={styles.avatarContainer}>
                            <View style={styles.avatar}>
                                <User size={48} color="#FFF" />
                            </View>
                            <View style={styles.roleBadge}>
                                <Text style={styles.roleBadgeText}>MINER</Text>
                            </View>
                        </View>

                        {/* Stats */}
                        <View style={styles.stats}>
                            <TouchableOpacity style={styles.statItem}>
                                <Text style={styles.statNumber}>
                                    {loading ? '-' : (profileData?.postsCount || 0)}
                                </Text>
                                <Text style={styles.statLabel}>Posts</Text>
                            </TouchableOpacity>
                            <TouchableOpacity 
                                style={styles.statItem}
                                onPress={() => router.push('/miner/Friends')}
                                activeOpacity={0.7}
                            >
                                <Text style={styles.statNumber}>
                                    {loading ? '-' : (profileData?.followersCount || 0)}
                                </Text>
                                <Text style={styles.statLabel}>Crew</Text>
                            </TouchableOpacity>
                            <TouchableOpacity 
                                style={styles.statItem}
                                onPress={() => router.push('/miner/Friends')}
                                activeOpacity={0.7}
                            >
                                <Text style={styles.statNumber}>
                                    {loading ? '-' : (profileData?.followingCount || 0)}
                                </Text>
                                <Text style={styles.statLabel}>Following</Text>
                            </TouchableOpacity>
                        </View>
                    </View>

                    {/* Bio */}
                    <View style={styles.bio}>
                        <Text style={styles.bioName}>{user.name || 'Miner'}</Text>
                        <View style={styles.bioRow}>
                            <Text style={styles.bioText}>🦺 Mining Professional</Text>
                        </View>
                        <View style={styles.bioRow}>
                            <Text style={styles.bioText}>🎯 Safety: </Text>
                            <Text style={styles.safetyScoreText}>{safetyScore || 85}/100</Text>
                        </View>
                    </View>

                    {/* Action Buttons */}
                    <View style={styles.actionButtons}>
                        <TouchableOpacity style={styles.iconButton}>
                            <User size={18} color={COLORS.text} />
                        </TouchableOpacity>
                    </View>

                    {/* Upload Content Button */}
                    <TouchableOpacity 
                        style={styles.uploadButton}
                        onPress={() => router.push('/miner/UploadContent')}
                        activeOpacity={0.8}
                    >
                        <Edit size={20} color="#FFF" />
                        <Text style={styles.uploadButtonText}>Upload</Text>
                    </TouchableOpacity>
                </View>

                {/* Tabs */}
                <View style={styles.tabs}>
                    <TouchableOpacity
                        style={[styles.tab, activeTab === 'posts' && styles.activeTab]}
                        onPress={() => setActiveTab('posts')}
                    >
                        <Grid 
                            size={24} 
                            color={activeTab === 'posts' ? COLORS.primary : COLORS.textMuted} 
                        />
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={[styles.tab, activeTab === 'reels' && styles.activeTab]}
                        onPress={() => setActiveTab('reels')}
                    >
                        <Video 
                            size={24} 
                            color={activeTab === 'reels' ? COLORS.primary : COLORS.textMuted} 
                        />
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={[styles.tab, activeTab === 'safety' && styles.activeTab]}
                        onPress={() => setActiveTab('safety')}
                    >
                        <Award 
                            size={24} 
                            color={activeTab === 'safety' ? COLORS.primary : COLORS.textMuted} 
                        />
                    </TouchableOpacity>
                </View>

                {/* Content Grid */}
                <View style={styles.contentContainer}>
                    {activeTab === 'posts' && (
                        <View style={styles.emptyState}>
                            <Text style={styles.emptyStateText}>No posts yet</Text>
                            <Text style={styles.emptyStateSubtext}>Your uploaded photos will appear here</Text>
                        </View>
                    )}
                    
                    {activeTab === 'reels' && (
                        <View style={styles.emptyState}>
                            <Text style={styles.emptyStateText}>No videos yet</Text>
                            <Text style={styles.emptyStateSubtext}>Your uploaded videos will appear here</Text>
                        </View>
                    )}
                    
                    {activeTab === 'safety' && (
                        <View style={styles.safetyContent}>
                            <View style={styles.safetyCard}>
                                <Shield size={48} color={COLORS.primary} />
                                <Text style={styles.safetyTitle}>Safety Achievements</Text>
                                <Text style={styles.safetyDescription}>
                                    Your safety records and badges will appear here
                                </Text>
                            </View>
                            <View style={styles.safetyStats}>
                                <View style={styles.safetyStatItem}>
                                    <Text style={styles.safetyStatNumber}>0</Text>
                                    <Text style={styles.safetyStatLabel}>Days Safe</Text>
                                </View>
                                <View style={styles.safetyStatItem}>
                                    <Text style={styles.safetyStatNumber}>0</Text>
                                    <Text style={styles.safetyStatLabel}>Certifications</Text>
                                </View>
                                <View style={styles.safetyStatItem}>
                                    <Text style={styles.safetyStatNumber}>0</Text>
                                    <Text style={styles.safetyStatLabel}>Awards</Text>
                                </View>
                            </View>
                        </View>
                    )}
                </View>

                {/* Logout Button */}
                <TouchableOpacity 
                    style={styles.logoutButton}
                    onPress={handleLogout}
                    activeOpacity={0.8}
                >
                    <LogOut size={20} color={COLORS.destructive} />
                    <Text style={styles.logoutText}>Logout</Text>
                </TouchableOpacity>
            </ScrollView>

            <MinerFooter activeTab="profile" />
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: COLORS.background,
    },
    scrollView: {
        flex: 1,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: COLORS.border,
    },
    username: {
        fontSize: 22,
        fontWeight: '700',
        color: COLORS.text,
    },
    headerActions: {
        flexDirection: 'row',
        gap: 12,
    },
    headerButton: {
        padding: 4,
    },
    profileSection: {
        paddingHorizontal: 16,
        paddingVertical: 12,
    },
    statsRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 12,
    },
    avatarContainer: {
        position: 'relative',
        marginRight: 28,
    },
    avatar: {
        width: 96,
        height: 96,
        borderRadius: 48,
        backgroundColor: '#52525B',
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 2,
        borderColor: '#71717A',
    },
    roleBadge: {
        position: 'absolute',
        bottom: -8,
        left: 0,
        right: 0,
        backgroundColor: '#52525B',
        paddingVertical: 4,
        paddingHorizontal: 8,
        borderRadius: 12,
        alignItems: 'center',
    },
    roleBadgeText: {
        color: '#FFF',
        fontSize: 10,
        fontWeight: '800',
        letterSpacing: 0.5,
    },
    stats: {
        flex: 1,
        flexDirection: 'row',
        justifyContent: 'space-around',
    },
    statItem: {
        alignItems: 'center',
    },
    statNumber: {
        fontSize: 18,
        fontWeight: '700',
        color: COLORS.text,
    },
    statLabel: {
        fontSize: 13,
        color: COLORS.textMuted,
        marginTop: 2,
    },
    bio: {
        marginBottom: 12,
    },
    bioName: {
        fontSize: 15,
        fontWeight: '700',
        color: COLORS.text,
        marginBottom: 6,
    },
    bioRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 3,
    },
    bioText: {
        fontSize: 13,
        color: COLORS.textMuted,
    },
    safetyScoreText: {
        fontSize: 13,
        color: COLORS.accent,
        fontWeight: '700',
    },
    actionButtons: {
        flexDirection: 'row',
        gap: 6,
        marginBottom: 10,
    },
    editButton: {
        flex: 1,
        backgroundColor: COLORS.card,
        paddingVertical: 7,
        borderRadius: 8,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: COLORS.border,
    },
    editButtonText: {
        color: COLORS.text,
        fontSize: 13,
        fontWeight: '700',
    },
    shareButton: {
        flex: 1,
        backgroundColor: COLORS.card,
        paddingVertical: 7,
        borderRadius: 8,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: COLORS.border,
    },
    shareButtonText: {
        color: COLORS.text,
        fontSize: 13,
        fontWeight: '700',
    },
    iconButton: {
        backgroundColor: COLORS.card,
        paddingVertical: 7,
        paddingHorizontal: 10,
        borderRadius: 8,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1,
        borderColor: COLORS.border,
    },
    emergencyButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: COLORS.destructive,
        paddingVertical: 11,
        borderRadius: 12,
        gap: 8,
    },
    emergencyText: {
        color: '#FFF',
        fontSize: 14,
        fontWeight: '800',
        letterSpacing: 0.5,
    },
    uploadButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: COLORS.card,
        paddingVertical: 11,
        borderRadius: 12,
        gap: 8,
        marginTop: 12,
        borderWidth: 1,
        borderColor: COLORS.border,
    },
    uploadButtonText: {
        color: '#FFF',
        fontSize: 14,
        fontWeight: '700',
        letterSpacing: 0.5,
    },
    tabs: {
        flexDirection: 'row',
        borderTopWidth: 1,
        borderTopColor: COLORS.border,
        borderBottomWidth: 1,
        borderBottomColor: COLORS.border,
    },
    tab: {
        flex: 1,
        alignItems: 'center',
        paddingVertical: 12,
        borderBottomWidth: 2,
        borderBottomColor: 'transparent',
    },
    activeTab: {
        borderBottomColor: '#71717A',
    },
    contentContainer: {
        paddingTop: 2,
    },
    grid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 2,
        paddingHorizontal: 2,
    },
    gridItem: {
        width: GRID_ITEM_SIZE,
        height: GRID_ITEM_SIZE,
        position: 'relative',
    },
    gridImageContainer: {
        width: '100%',
        height: '100%',
        backgroundColor: COLORS.card,
    },
    gridPlaceholder: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#1A1A1A',
    },
    gridPlaceholderEmoji: {
        fontSize: 32,
    },
    videoIndicator: {
        position: 'absolute',
        top: 8,
        right: 8,
    },
    safetyContent: {
        padding: 16,
    },
    safetyCard: {
        backgroundColor: COLORS.card,
        borderRadius: 16,
        padding: 32,
        alignItems: 'center',
        marginBottom: 24,
    },
    safetyTitle: {
        fontSize: 20,
        fontWeight: '700',
        color: COLORS.text,
        marginTop: 16,
        marginBottom: 8,
    },
    safetyDescription: {
        fontSize: 14,
        color: COLORS.textMuted,
        textAlign: 'center',
    },
    safetyStats: {
        flexDirection: 'row',
        justifyContent: 'space-around',
    },
    safetyStatItem: {
        alignItems: 'center',
        backgroundColor: COLORS.card,
        paddingVertical: 20,
        paddingHorizontal: 24,
        borderRadius: 16,
    },
    safetyStatNumber: {
        fontSize: 28,
        fontWeight: '700',
        color: COLORS.primary,
    },
    safetyStatLabel: {
        fontSize: 12,
        color: COLORS.textMuted,
        marginTop: 4,
    },
    logoutButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        paddingVertical: 10,
        paddingHorizontal: 20,
        backgroundColor: COLORS.destructive,
        borderRadius: 10,
        borderWidth: 1,
        borderColor: COLORS.destructive,
    },
    logoutButtonText: {
        color: '#FFF',
        fontSize: 14,
        fontWeight: '700',
    },
    logoutText: {
        color: COLORS.destructive,
        fontSize: 15,
        fontWeight: '700',
    },
    emptyState: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 60,
        paddingHorizontal: 24,
    },
    emptyStateEmoji: {
        fontSize: 56,
        marginBottom: 12,
    },
    emptyStateText: {
        fontSize: 18,
        fontWeight: '700',
        color: COLORS.text,
        marginBottom: 6,
    },
    emptyStateSubtext: {
        fontSize: 14,
        color: COLORS.textMuted,
        textAlign: 'center',
    },
});
