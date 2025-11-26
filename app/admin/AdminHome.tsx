import { useRouter } from 'expo-router';
import { signOut } from 'firebase/auth';
import { collection, deleteDoc, doc, getDocs, setDoc } from 'firebase/firestore';
import React, { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { auth, db } from '../../config/firebase';
import { COLORS } from '../../constants/styles';

interface User {
  id: string;
  phoneNumber: string;
  role: string;
}

export default function AdminHome() {
  const router = useRouter();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [phoneNumber, setPhoneNumber] = useState('+91');
  const [selectedRole, setSelectedRole] = useState('miner');
  const [refreshing, setRefreshing] = useState(false);

  const roles = [
    { value: 'miner', label: 'Miner', color: '#6B7280' },
    { value: 'engineer', label: 'Engineer', color: '#3B82F6' },
    { value: 'supervisor', label: 'Supervisor', color: '#8B5CF6' },
    { value: 'safety_officer', label: 'Safety Officer', color: '#EF4444' },
    { value: 'admin', label: 'Admin', color: '#10B981' },
  ];

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    setRefreshing(true);
    try {
      const usersSnapshot = await getDocs(collection(db, 'users'));
      const usersList: User[] = [];
      usersSnapshot.forEach((doc) => {
        const data = doc.data();
        usersList.push({
          id: doc.id,
          phoneNumber: `+${doc.id}`,
          role: data.role,
        });
      });
      setUsers(usersList);
    } catch (error: any) {
      console.error('Error fetching users:', error);
      Alert.alert('Error', 'Failed to fetch users');
    } finally {
      setRefreshing(false);
    }
  };

  const validatePhone = (phone: string) => {
    const phoneRegex = /^\+91[0-9]{10}$/;
    return phoneRegex.test(phone);
  };

  const handleAddUser = async () => {
    if (!validatePhone(phoneNumber)) {
      Alert.alert('Invalid Phone', 'Please enter a valid phone number in format +91XXXXXXXXXX');
      return;
    }

    setLoading(true);
    try {
      // Remove + from phone number for document ID (917416013923)
      const docId = phoneNumber.replace('+', '');

      // Create user document in Firestore
      await setDoc(doc(db, 'users', docId), {
        phoneNumber: phoneNumber,
        role: selectedRole,
        createdAt: new Date().toISOString(),
        createdBy: auth.currentUser?.phoneNumber || 'admin',
      });

      Alert.alert('Success', `User ${phoneNumber} added with role: ${selectedRole}`);
      setPhoneNumber('+91');
      setSelectedRole('miner');
      fetchUsers();
    } catch (error: any) {
      console.error('Error adding user:', error);
      Alert.alert('Error', error.message || 'Failed to add user');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteUser = async (userId: string, phone: string) => {
    Alert.alert(
      'Delete User',
      `Are you sure you want to delete user ${phone}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteDoc(doc(db, 'users', userId));
              Alert.alert('Success', 'User deleted successfully');
              fetchUsers();
            } catch (error: any) {
              console.error('Error deleting user:', error);
              Alert.alert('Error', 'Failed to delete user');
            }
          },
        },
      ]
    );
  };

  const handleSignOut = async () => {
    try {
      await signOut(auth);
      router.replace('/auth/PhoneLogin');
    } catch (error: any) {
      console.error('Error signing out:', error);
      Alert.alert('Error', 'Failed to sign out');
    }
  };

  const getRoleColor = (role: string) => {
    return roles.find((r) => r.value === role)?.color || '#6B7280';
  };

  const getRoleLabel = (role: string) => {
    return roles.find((r) => r.value === role)?.label || role;
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>👑 Admin Panel</Text>
        <TouchableOpacity onPress={handleSignOut} style={styles.signOutButton}>
          <Text style={styles.signOutText}>Sign Out</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content}>
        {/* Add User Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>➕ Add New User</Text>
          
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Phone Number</Text>
            <TextInput
              style={styles.input}
              value={phoneNumber}
              onChangeText={(text) => {
                if (!text.startsWith('+91')) {
                  text = '+91' + text.replace(/[^0-9]/g, '');
                }
                const cleaned = '+91' + text.slice(3).replace(/[^0-9]/g, '');
                setPhoneNumber(cleaned.slice(0, 13));
              }}
              placeholder="+919876543210"
              keyboardType="phone-pad"
              maxLength={13}
              placeholderTextColor={COLORS.textMuted}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Select Role</Text>
            <View style={styles.roleGrid}>
              {roles.map((role) => (
                <TouchableOpacity
                  key={role.value}
                  style={[
                    styles.roleButton,
                    selectedRole === role.value && { 
                      backgroundColor: role.color,
                      borderColor: role.color,
                    }
                  ]}
                  onPress={() => setSelectedRole(role.value)}
                >
                  <Text style={[
                    styles.roleButtonText,
                    selectedRole === role.value && styles.roleButtonTextActive
                  ]}>
                    {role.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <TouchableOpacity
            style={[styles.addButton, loading && styles.addButtonDisabled]}
            onPress={handleAddUser}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <Text style={styles.addButtonText}>Add User</Text>
            )}
          </TouchableOpacity>
        </View>

        {/* Users List Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>👥 All Users ({users.length})</Text>
            <TouchableOpacity onPress={fetchUsers} disabled={refreshing}>
              <Text style={styles.refreshButton}>
                {refreshing ? '⟳' : '🔄'} Refresh
              </Text>
            </TouchableOpacity>
          </View>

          {refreshing ? (
            <ActivityIndicator size="large" color={COLORS.primary} style={styles.loader} />
          ) : (
            <View style={styles.usersList}>
              {users.map((user) => (
                <View key={user.id} style={styles.userCard}>
                  <View style={styles.userInfo}>
                    <Text style={styles.userPhone}>📱 {user.phoneNumber}</Text>
                    <View style={[styles.roleBadge, { backgroundColor: getRoleColor(user.role) }]}>
                      <Text style={styles.roleBadgeText}>{getRoleLabel(user.role)}</Text>
                    </View>
                  </View>
                  <TouchableOpacity
                    style={styles.deleteButton}
                    onPress={() => handleDeleteUser(user.id, user.phoneNumber)}
                  >
                    <Text style={styles.deleteButtonText}>🗑️ Delete</Text>
                  </TouchableOpacity>
                </View>
              ))}
              {users.length === 0 && (
                <Text style={styles.emptyText}>No users found</Text>
              )}
            </View>
          )}
        </View>
      </ScrollView>
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
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    backgroundColor: COLORS.card,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: COLORS.text,
  },
  signOutButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: COLORS.destructive,
    borderRadius: 8,
  },
  signOutText: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  content: {
    flex: 1,
  },
  section: {
    margin: 16,
    padding: 16,
    backgroundColor: COLORS.card,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: 16,
  },
  refreshButton: {
    fontSize: 14,
    color: COLORS.primary,
    fontWeight: '600',
  },
  inputGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 8,
  },
  input: {
    backgroundColor: COLORS.background,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: COLORS.text,
  },
  roleGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  roleButton: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: COLORS.border,
    backgroundColor: COLORS.background,
  },
  roleButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.text,
  },
  roleButtonTextActive: {
    color: '#FFFFFF',
  },
  addButton: {
    backgroundColor: COLORS.primary,
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 8,
  },
  addButtonDisabled: {
    opacity: 0.6,
  },
  addButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  usersList: {
    gap: 12,
  },
  userCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 12,
    backgroundColor: COLORS.background,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  userInfo: {
    flex: 1,
  },
  userPhone: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 4,
  },
  roleBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    alignSelf: 'flex-start',
    marginTop: 4,
  },
  roleBadgeText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
  },
  deleteButton: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: COLORS.destructive,
    borderRadius: 6,
  },
  deleteButtonText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
  },
  loader: {
    marginVertical: 20,
  },
  emptyText: {
    textAlign: 'center',
    color: COLORS.textMuted,
    fontSize: 14,
    paddingVertical: 20,
  },
});
