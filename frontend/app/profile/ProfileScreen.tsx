import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Alert, StyleSheet, ActivityIndicator, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { User, Phone, Globe, Shield, LogOut, ArrowLeft, AlertTriangle, Mail, Calendar, MapPin, Award } from '../../components/Icons';
import { useRoleStore } from '../../hooks/useRoleStore';
import { translator } from '../../services/translator';
import { ROLE_LABELS } from '../../constants/roles';
import { LinearGradient } from 'expo-linear-gradient';
import { MinerFooter } from '../../components/BottomNav';
import { getFirestore, doc, getDoc, onSnapshot } from 'firebase/firestore';
import { getApps } from 'firebase/app';

interface UserProfile {
  name: string;
  phone: string;
  phoneNumber?: string;
  role: string;
  email?: string;
  bio?: string;
  location?: string;
  joinedDate?: any;
  followersCount?: number;
  followingCount?: number;
  postsCount?: number;
  likesCount?: number;
  safetyScore?: number;
  avatar?: string;
}

export default function ProfileScreen() {
  const router = useRouter();
  const { user, language, logout, safetyScore } = useRoleStore();
  const [profileData, setProfileData] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Load user profile from Firebase
  useEffect(() => {
    if (!user?.id && !user?.phone) {
      setLoading(false);
      return;
    }

    const loadProfile = async () => {
      try {
        const db = getFirestore(getApps()[0], 'minerva1');
        const userId = user.id || user.phone || user.phoneNumber;
        
        if (!userId) {
          setLoading(false);
          return;
        }

        const userDocRef = doc(db, 'users', userId);
        
        // Real-time listener for profile updates
        const unsubscribe = onSnapshot(userDocRef, (docSnapshot) => {
          if (docSnapshot.exists()) {
            const data = docSnapshot.data() as UserProfile;
            setProfileData(data);
          } else {
            // Use local user data if no Firebase doc
            setProfileData({
              name: user.name,
              phone: user.phone,
              role: user.role || 'miner',
            });
          }
          setLoading(false);
          setRefreshing(false);
        });

        return unsubscribe;
      } catch (error) {
        console.error('Error loading profile:', error);
        // Fallback to local data
        setProfileData({
          name: user.name,
          phone: user.phone,
          role: user.role || 'miner',
        });
        setLoading(false);
        setRefreshing(false);
      }
    };

    loadProfile();
  }, [user]);

  const handleRefresh = () => {
    setRefreshing(true);
    // Trigger reload by updating dependency
  };

  const formatDate = (timestamp: any) => {
    if (!timestamp) return 'Recently';
    try {
      const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
      return date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
    } catch {
      return 'Recently';
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
            router.replace('/auth/PhoneLogin' as any);
          }
        }
      ]
    );
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#FF6B00" />
          <Text style={styles.loadingText}>Loading profile...</Text>
        </View>
      </SafeAreaView>
    );
  }

  const profile = profileData || { name: user.name, phone: user.phone, role: user.role };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <ArrowLeft size={24} color="#FFFFFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>
          {translator.translate('profile')}
        </Text>
        <TouchableOpacity onPress={handleLogout} style={styles.headerLogoutButton}>
          <LogOut size={22} color="#FFFFFF" />
        </TouchableOpacity>
      </View>

      <ScrollView 
        style={styles.scrollView}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor="#FF6B00"
            colors={['#FF6B00']}
          />
        }
      >
        {/* Profile Header */}
        <View style={styles.profileHeader}>
          <View style={styles.avatarContainer}>
            <LinearGradient
              colors={['#FF6B00', '#FF8533', '#FFA366']}
              style={styles.avatarGradient}
            >
              <User size={56} color="#FFFFFF" />
            </LinearGradient>
          </View>
          <Text style={styles.userName}>{user.role === 'miner' && profile.phone === '+1234567890' ? 'Test Miner' : (profile.name || 'User Name')}</Text>
          <Text style={styles.userRole}>
            {profile.role ? ROLE_LABELS[profile.role as keyof typeof ROLE_LABELS] || profile.role : 'Role'}
          </Text>
          {profile.bio && (
            <Text style={styles.userBio}>{profile.bio}</Text>
          )}
          
          {/* Stats Row */}
          <View style={styles.statsContainer}>
            <View style={styles.statBox}>
              <Text style={styles.statNumber}>
                {(profile.postsCount || 0) + (user.role === 'miner' && profile.phone === '+1234567890' ? 1 : 0)}
              </Text>
              <Text style={styles.statLabel}>Posts</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statBox}>
              <Text style={styles.statNumber}>{profile.followersCount || 0}</Text>
              <Text style={styles.statLabel}>Followers</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statBox}>
              <Text style={styles.statNumber}>{profile.followingCount || 0}</Text>
              <Text style={styles.statLabel}>Following</Text>
            </View>
          </View>
        </View>

        {/* Safety Score */}
        {user.role === 'miner' && (
          <View style={styles.safetyScoreCard}>
            <LinearGradient
              colors={['rgba(16, 185, 129, 0.2)', 'rgba(16, 185, 129, 0.05)']}
              style={styles.safetyScoreGradient}
            >
              <View style={styles.safetyScoreContent}>
                <View style={styles.safetyScoreLeft}>
                  <View style={styles.safetyScoreIconBox}>
                    <Shield size={32} color="#10B981" />
                  </View>
                  <View>
                    <Text style={styles.safetyScoreLabel}>Safety Score</Text>
                    <Text style={styles.safetyScoreValue}>{profile.safetyScore || safetyScore}%</Text>
                  </View>
                </View>
                <Award size={28} color="#10B981" />
              </View>
            </LinearGradient>
          </View>
        )}

        {/* Emergency SOS Button */}
        {user.role === 'miner' && (
          <TouchableOpacity
            onPress={() => router.push('/miner/EmergencySOS' as any)}
            activeOpacity={0.8}
            style={styles.sosButton}
          >
            <LinearGradient
              colors={['#DC2626', '#B91C1C', '#7F1D1D']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.sosGradient}
            >
              <View style={styles.sosContent}>
                <View style={styles.sosIconContainer}>
                  <AlertTriangle size={32} color="#FFFFFF" />
                </View>
                <View style={styles.sosTextContainer}>
                  <Text style={styles.sosTitle}>EMERGENCY SOS</Text>
                  <Text style={styles.sosSubtitle}>Tap for immediate assistance</Text>
                </View>
                <View style={styles.sosPulse} />
              </View>
            </LinearGradient>
          </TouchableOpacity>
        )}

        {/* Emergency SOS Button */}
        {user.role === 'miner' && (
          <TouchableOpacity
            onPress={() => router.push('/miner/EmergencySOS' as any)}
            activeOpacity={0.8}
            style={styles.sosButton}
          >
            <LinearGradient
              colors={['#DC2626', '#B91C1C', '#7F1D1D']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.sosGradient}
            >
              <View style={styles.sosContent}>
                <View style={styles.sosIconContainer}>
                  <AlertTriangle size={32} color="#FFFFFF" />
                </View>
                <View style={styles.sosTextContainer}>
                  <Text style={styles.sosTitle}>EMERGENCY SOS</Text>
                  <Text style={styles.sosSubtitle}>Tap for immediate assistance</Text>
                </View>
                <View style={styles.sosPulse} />
              </View>
            </LinearGradient>
          </TouchableOpacity>
        )}

        {/* Profile Details */}
        <View style={styles.detailsContainer}>
          {/* Phone */}
          <View style={styles.detailCard}>
            <View style={styles.detailIconBox}>
              <Phone size={22} color="#FF6B00" />
            </View>
            <View style={styles.detailContent}>
              <Text style={styles.detailLabel}>Phone Number</Text>
              <Text style={styles.detailValue}>
                {profile.phoneNumber || profile.phone || '+91 9876543210'}
              </Text>
            </View>
          </View>

          {/* Email */}
          {profile.email && (
            <View style={styles.detailCard}>
              <View style={styles.detailIconBox}>
                <Mail size={22} color="#FF6B00" />
              </View>
              <View style={styles.detailContent}>
                <Text style={styles.detailLabel}>Email</Text>
                <Text style={styles.detailValue}>{profile.email}</Text>
              </View>
            </View>
          )}

          {/* Language */}
          <View style={styles.detailCard}>
            <View style={styles.detailIconBox}>
              <Globe size={22} color="#FF6B00" />
            </View>
            <View style={styles.detailContent}>
              <Text style={styles.detailLabel}>Language</Text>
              <Text style={styles.detailValue}>
                {language === 'en' ? 'English' : language === 'hi' ? 'हिंदी' : 'తెలుగు'}
              </Text>
            </View>
          </View>

          {/* Location */}
          {profile.location && (
            <View style={styles.detailCard}>
              <View style={styles.detailIconBox}>
                <MapPin size={22} color="#FF6B00" />
              </View>
              <View style={styles.detailContent}>
                <Text style={styles.detailLabel}>Location</Text>
                <Text style={styles.detailValue}>{profile.location}</Text>
              </View>
            </View>
          )}

          {/* Joined Date */}
          <View style={styles.detailCard}>
            <View style={styles.detailIconBox}>
              <Calendar size={22} color="#FF6B00" />
            </View>
            <View style={styles.detailContent}>
              <Text style={styles.detailLabel}>Joined</Text>
              <Text style={styles.detailValue}>{formatDate(profile.joinedDate)}</Text>
            </View>
          </View>
        </View>

      </ScrollView>
      {user.role === 'miner' && <MinerFooter activeTab="profile" />}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#09090B',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 16,
  },
  loadingText: {
    fontSize: 16,
    color: '#A1A1AA',
    fontWeight: '600',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#27272A',
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerLogoutButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(220, 38, 38, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(220, 38, 38, 0.3)',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: 0.5,
  },
  scrollView: {
    flex: 1,
  },
  profileHeader: {
    alignItems: 'center',
    paddingTop: 32,
    paddingBottom: 24,
    paddingHorizontal: 20,
  },
  avatarContainer: {
    marginBottom: 20,
    shadowColor: '#FF6B00',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 16,
    elevation: 12,
  },
  avatarGradient: {
    width: 120,
    height: 120,
    borderRadius: 60,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 4,
    borderColor: '#FFFFFF',
  },
  userName: {
    fontSize: 28,
    fontWeight: '900',
    color: '#FFFFFF',
    marginBottom: 6,
    letterSpacing: 0.5,
  },
  userRole: {
    fontSize: 16,
    color: '#A1A1AA',
    fontWeight: '600',
    marginBottom: 12,
  },
  userBio: {
    fontSize: 14,
    color: '#D4D4D8',
    textAlign: 'center',
    lineHeight: 20,
    marginTop: 8,
    paddingHorizontal: 20,
  },
  statsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 24,
    backgroundColor: '#18181B',
    borderRadius: 20,
    paddingVertical: 20,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: '#27272A',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  statBox: {
    flex: 1,
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 24,
    fontWeight: '900',
    color: '#FF6B00',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#A1A1AA',
    fontWeight: '600',
  },
  statDivider: {
    width: 1,
    height: 40,
    backgroundColor: '#27272A',
  },
  safetyScoreCard: {
    marginHorizontal: 20,
    marginTop: 16,
    marginBottom: 24,
    borderRadius: 20,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: 'rgba(16, 185, 129, 0.3)',
    shadowColor: '#10B981',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  },
  safetyScoreGradient: {
    padding: 24,
  },
  safetyScoreContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  safetyScoreLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  safetyScoreIconBox: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: 'rgba(16, 185, 129, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: 'rgba(16, 185, 129, 0.4)',
  },
  safetyScoreLabel: {
    fontSize: 14,
    color: '#A1A1AA',
    fontWeight: '600',
    marginBottom: 4,
  },
  safetyScoreValue: {
    fontSize: 36,
    fontWeight: '900',
    color: '#10B981',
    letterSpacing: 1,
  },
  detailsContainer: {
    paddingHorizontal: 20,
    gap: 12,
    marginBottom: 24,
  },
  detailCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#18181B',
    borderRadius: 16,
    padding: 18,
    gap: 16,
    borderWidth: 1,
    borderColor: '#27272A',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  detailIconBox: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(255, 107, 0, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: 'rgba(255, 107, 0, 0.3)',
  },
  detailContent: {
    flex: 1,
  },
  detailLabel: {
    fontSize: 12,
    color: '#A1A1AA',
    fontWeight: '600',
    marginBottom: 4,
  },
  detailValue: {
    fontSize: 16,
    color: '#FFFFFF',
    fontWeight: '700',
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    marginHorizontal: 20,
    marginTop: 8,
    marginBottom: 100,
    backgroundColor: '#DC2626',
    borderRadius: 16,
    paddingVertical: 18,
    borderWidth: 2,
    borderColor: '#EF4444',
    shadowColor: '#DC2626',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 8,
  },
  logoutText: {
    fontSize: 18,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: 0.5,
  },
  sosButton: {
    marginHorizontal: 20,
    marginBottom: 24,
    borderRadius: 20,
    overflow: 'hidden',
    shadowColor: '#DC2626',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.5,
    shadowRadius: 16,
    elevation: 12,
    borderWidth: 3,
    borderColor: '#FECACA',
  },
  sosGradient: {
    padding: 24,
    position: 'relative',
  },
  sosContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  sosIconContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: 'rgba(255, 255, 255, 0.5)',
    shadowColor: '#FFF',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  sosTextContainer: {
    flex: 1,
  },
  sosTitle: {
    fontSize: 22,
    fontWeight: '900',
    color: '#FFFFFF',
    letterSpacing: 2,
    textShadowColor: '#000',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 6,
    marginBottom: 4,
  },
  sosSubtitle: {
    fontSize: 14,
    color: '#FECACA',
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  sosPulse: {
    position: 'absolute',
    right: 24,
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: '#FFFFFF',
    shadowColor: '#FFFFFF',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 1,
    shadowRadius: 12,
  },
});
