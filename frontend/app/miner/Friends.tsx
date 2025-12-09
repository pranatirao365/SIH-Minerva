import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    FlatList,
    TouchableOpacity,
    Image,
    ActivityIndicator,
    TextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { collection, query, where, getDocs, doc, getDoc } from 'firebase/firestore';
import { db } from '../../config/firebase';
import { useRoleStore } from '../../hooks/useRoleStore';
import { followUser, unfollowUser, getFollowers, getFollowing } from '../../services/socialService';
import { COLORS } from '../../constants/styles';
import { Search, UserPlus, UserCheck, ArrowLeft } from '../../components/Icons';
import { MinerFooter } from '../../components/BottomNav';

interface MinerUser {
    id: string;
    name: string;
    phoneNumber: string;
    department?: string;
    shift?: string;
    safetyScore?: number;
    isFollowing?: boolean;
}

export default function FriendsScreen() {
    const router = useRouter();
    const { user } = useRoleStore();
    const [miners, setMiners] = useState<MinerUser[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [following, setFollowing] = useState<Set<string>>(new Set());
    const [followersCount, setFollowersCount] = useState(0);
    const [followingCount, setFollowingCount] = useState(0);

    useEffect(() => {
        fetchMiners();
        loadFollowersAndFollowing();
    }, []);

    const loadFollowersAndFollowing = async () => {
        try {
            const userId = user.id || user.phone;
            if (!userId) return;

            // Load who the current user is following
            const followingList = await getFollowing(userId);
            const followingIds = new Set(followingList.map(u => u.id));
            setFollowing(followingIds);
            setFollowingCount(followingList.length);

            // Load who follows the current user
            const followersList = await getFollowers(userId);
            setFollowersCount(followersList.length);

            console.log('✅ Loaded followers and following:', {
                followers: followersList.length,
                following: followingList.length
            });
        } catch (error) {
            console.error('Error loading followers/following:', error);
        }
    };

    const fetchMiners = async () => {
        try {
            setLoading(true);
            const usersRef = collection(db, 'users');
            const q = query(usersRef, where('role', '==', 'miner'));
            const querySnapshot = await getDocs(q);

            const minersList: MinerUser[] = [];
            querySnapshot.forEach((doc) => {
                const data = doc.data();
                // Don't show current user in list
                if (doc.id !== user.id && doc.id !== user.phone) {
                    minersList.push({
                        id: doc.id,
                        name: data.name || 'Unknown Miner',
                        phoneNumber: data.phoneNumber || doc.id,
                        department: data.department,
                        shift: data.shift,
                        safetyScore: data.safetyScore || Math.floor(Math.random() * 30) + 70, // Mock score
                    });
                }
            });

            // Sort by name
            minersList.sort((a, b) => a.name.localeCompare(b.name));
            setMiners(minersList);
        } catch (error) {
            console.error('Error fetching miners:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleFollow = async (minerId: string) => {
        const userId = user.id || user.phone;
        if (!userId) return;

        const isFollowing = following.has(minerId);

        // Optimistic UI update
        setFollowing((prev) => {
            const newSet = new Set(prev);
            if (isFollowing) {
                newSet.delete(minerId);
            } else {
                newSet.add(minerId);
            }
            return newSet;
        });

        setFollowingCount(prev => isFollowing ? prev - 1 : prev + 1);

        try {
            if (isFollowing) {
                const success = await unfollowUser(userId, minerId);
                if (!success) {
                    // Revert on failure
                    setFollowing(prev => new Set([...prev, minerId]));
                    setFollowingCount(prev => prev + 1);
                    console.error('Failed to unfollow user');
                }
            } else {
                const success = await followUser(userId, minerId);
                if (!success) {
                    // Revert on failure
                    setFollowing(prev => {
                        const newSet = new Set(prev);
                        newSet.delete(minerId);
                        return newSet;
                    });
                    setFollowingCount(prev => prev - 1);
                    console.error('Failed to follow user');
                }
            }
        } catch (error) {
            console.error('Error in handleFollow:', error);
            // Revert UI on error
            if (isFollowing) {
                setFollowing(prev => new Set([...prev, minerId]));
                setFollowingCount(prev => prev + 1);
            } else {
                setFollowing(prev => {
                    const newSet = new Set(prev);
                    newSet.delete(minerId);
                    return newSet;
                });
                setFollowingCount(prev => prev - 1);
            }
        }
    };

    const filteredMiners = miners.filter((miner) =>
        miner.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        miner.department?.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const renderMiner = ({ item }: { item: MinerUser }) => {
        const isFollowing = following.has(item.id);
        
        return (
            <View style={styles.minerCard}>
                <View style={styles.minerInfo}>
                    {/* Avatar */}
                    <View style={styles.avatar}>
                        <Text style={styles.avatarText}>{item.name[0].toUpperCase()}</Text>
                    </View>

                    {/* Details */}
                    <View style={styles.minerDetails}>
                        <Text style={styles.minerName}>{item.name}</Text>
                        {item.department && (
                            <Text style={styles.minerMeta}>📍 {item.department}</Text>
                        )}
                        {item.shift && (
                            <Text style={styles.minerMeta}>⏰ {item.shift} Shift</Text>
                        )}
                        <View style={styles.safetyRow}>
                            <View style={[styles.safetyBadge, { 
                                backgroundColor: item.safetyScore! >= 85 ? '#10B981' : 
                                               item.safetyScore! >= 70 ? '#F59E0B' : '#EF4444' 
                            }]}>
                                <Text style={styles.safetyText}>🛡️ {item.safetyScore}</Text>
                            </View>
                        </View>
                    </View>
                </View>

                {/* Follow Button */}
                <TouchableOpacity
                    style={[styles.followButton, isFollowing && styles.followingButton]}
                    onPress={() => handleFollow(item.id)}
                    activeOpacity={0.7}
                >
                    {isFollowing ? (
                        <>
                            <UserCheck size={18} color="#FFF" />
                            <Text style={styles.followingText}>Following</Text>
                        </>
                    ) : (
                        <>
                            <UserPlus size={18} color={COLORS.primary} />
                            <Text style={styles.followText}>Follow</Text>
                        </>
                    )}
                </TouchableOpacity>
            </View>
        );
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
                    <Text style={styles.headerTitle}>Find Crew Members</Text>
                    <View style={{ width: 40 }} />
                </View>

                {/* Search Bar */}
                <View style={styles.searchContainer}>
                    <Search size={20} color={COLORS.textMuted} />
                    <TextInput
                        style={styles.searchInput}
                        placeholder="Search by name or department..."
                        placeholderTextColor={COLORS.textMuted}
                        value={searchQuery}
                        onChangeText={setSearchQuery}
                    />
                </View>

                {/* Stats */}
                <View style={styles.statsBar}>
                    <View style={styles.statBox}>
                        <Text style={styles.statValue}>{filteredMiners.length}</Text>
                        <Text style={styles.statLabel}>Miners</Text>
                    </View>
                    <View style={styles.statBox}>
                        <Text style={styles.statValue}>{followingCount}</Text>
                        <Text style={styles.statLabel}>Following</Text>
                    </View>
                    <View style={styles.statBox}>
                        <Text style={styles.statValue}>{followersCount}</Text>
                        <Text style={styles.statLabel}>Followers</Text>
                    </View>
                </View>

                {/* Miners List */}
                {loading ? (
                    <View style={styles.loadingContainer}>
                        <ActivityIndicator size="large" color={COLORS.primary} />
                        <Text style={styles.loadingText}>Loading miners...</Text>
                    </View>
                ) : (
                    <FlatList
                        data={filteredMiners}
                        renderItem={renderMiner}
                        keyExtractor={(item) => item.id}
                        contentContainerStyle={styles.listContent}
                        showsVerticalScrollIndicator={false}
                        ListEmptyComponent={
                            <View style={styles.emptyContainer}>
                                <Text style={styles.emptyText}>No miners found</Text>
                                <Text style={styles.emptySubtext}>Try adjusting your search</Text>
                            </View>
                        }
                    />
                )}
            </SafeAreaView>
            <MinerFooter activeTab="profile" />
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
    searchContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: COLORS.card,
        marginHorizontal: 16,
        marginTop: 16,
        paddingHorizontal: 12,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: COLORS.border,
    },
    searchInput: {
        flex: 1,
        paddingVertical: 12,
        paddingHorizontal: 8,
        fontSize: 15,
        color: COLORS.text,
    },
    statsBar: {
        flexDirection: 'row',
        marginHorizontal: 16,
        marginTop: 16,
        marginBottom: 8,
        gap: 12,
    },
    statBox: {
        flex: 1,
        backgroundColor: COLORS.card,
        padding: 12,
        borderRadius: 12,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: COLORS.border,
    },
    statValue: {
        fontSize: 24,
        fontWeight: '700',
        color: COLORS.primary,
        marginBottom: 4,
    },
    statLabel: {
        fontSize: 12,
        color: COLORS.textMuted,
        fontWeight: '600',
    },
    listContent: {
        padding: 16,
        paddingBottom: 100,
    },
    minerCard: {
        backgroundColor: COLORS.card,
        borderRadius: 16,
        padding: 16,
        marginBottom: 12,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        borderWidth: 1,
        borderColor: COLORS.border,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    minerInfo: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
    },
    avatar: {
        width: 56,
        height: 56,
        borderRadius: 28,
        backgroundColor: COLORS.primary,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 12,
    },
    avatarText: {
        fontSize: 24,
        fontWeight: '700',
        color: '#FFF',
    },
    minerDetails: {
        flex: 1,
    },
    minerName: {
        fontSize: 16,
        fontWeight: '700',
        color: COLORS.text,
        marginBottom: 4,
    },
    minerMeta: {
        fontSize: 13,
        color: COLORS.textMuted,
        marginBottom: 2,
    },
    safetyRow: {
        flexDirection: 'row',
        marginTop: 4,
    },
    safetyBadge: {
        paddingHorizontal: 8,
        paddingVertical: 3,
        borderRadius: 8,
    },
    safetyText: {
        fontSize: 11,
        fontWeight: '700',
        color: '#FFF',
    },
    followButton: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        paddingHorizontal: 16,
        paddingVertical: 10,
        borderRadius: 10,
        borderWidth: 2,
        borderColor: COLORS.primary,
        backgroundColor: 'transparent',
    },
    followingButton: {
        backgroundColor: COLORS.primary,
        borderColor: COLORS.primary,
    },
    followText: {
        fontSize: 14,
        fontWeight: '700',
        color: COLORS.primary,
    },
    followingText: {
        fontSize: 14,
        fontWeight: '700',
        color: '#FFF',
    },
    loadingContainer: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 60,
    },
    loadingText: {
        marginTop: 12,
        fontSize: 14,
        color: COLORS.textMuted,
    },
    emptyContainer: {
        alignItems: 'center',
        paddingVertical: 60,
    },
    emptyText: {
        fontSize: 16,
        fontWeight: '600',
        color: COLORS.textMuted,
        marginBottom: 8,
    },
    emptySubtext: {
        fontSize: 14,
        color: COLORS.textMuted,
    },
});
