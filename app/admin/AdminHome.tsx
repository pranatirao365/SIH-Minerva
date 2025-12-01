import { useRouter } from 'expo-router';
import { signOut } from 'firebase/auth';
import { collection, deleteDoc, doc, getDocs, setDoc, query, where, getDoc } from 'firebase/firestore';
import React, { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
    Modal,
    FlatList,
    Switch,
    Dimensions
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { auth, db } from '../../config/firebase';
import { COLORS } from '../../constants/styles';
import { Picker } from '@react-native-picker/picker';
import * as DocumentPicker from 'expo-document-picker';

interface User {
  id: string;
  phoneNumber?: string;
  role: string;
  name?: string;
  email?: string;
  empId?: string;
  department?: string;
  shift?: string;
  age?: number;
  address?: string;
  trainingCompleted?: boolean;
  experience?: number;
  teamSize?: number;
  assignedMiners?: string[];
  healthCheckup?: any;
  certifications?: any;
  qualifications?: any;
}

// Form Components
const MinerForm = ({ formData, setFormData }: { formData: any, setFormData: any }) => (
  <View>
    <View style={styles.inputGroup}>
      <Text style={styles.label}>Full Name *</Text>
      <TextInput
        style={styles.input}
        value={formData.name || ''}
        onChangeText={(text) => setFormData({ ...formData, name: text })}
        placeholder="Enter miner's full name"
        placeholderTextColor={COLORS.textMuted}
      />
    </View>

    <View style={styles.inputGroup}>
      <Text style={styles.label}>Phone Number *</Text>
      <TextInput
        style={styles.input}
        value={formData.phoneNumber || ''}
        onChangeText={(text) => {
          if (!text.startsWith('+91')) {
            text = '+91' + text.replace(/[^0-9]/g, '');
          }
          const cleaned = '+91' + text.slice(3).replace(/[^0-9]/g, '');
          setFormData({ ...formData, phoneNumber: cleaned.slice(0, 13) });
        }}
        placeholder="+919876543210"
        keyboardType="phone-pad"
        maxLength={13}
        placeholderTextColor={COLORS.textMuted}
      />
    </View>

    <View style={styles.inputGroup}>
      <Text style={styles.label}>Age *</Text>
      <TextInput
        style={styles.input}
        value={formData.age?.toString() || ''}
        onChangeText={(text) => setFormData({ ...formData, age: parseInt(text) || '' })}
        placeholder="Enter age (18+)"
        keyboardType="numeric"
        placeholderTextColor={COLORS.textMuted}
      />
    </View>

    <View style={styles.inputGroup}>
      <Text style={styles.label}>Department *</Text>
      <View style={styles.pickerContainer}>
        <Picker
          selectedValue={formData.department || ''}
          onValueChange={(value) => setFormData({ ...formData, department: value })}
          style={styles.picker}
        >
          <Picker.Item label="Select Department" value="" />
          <Picker.Item label="Mining Operations" value="mining_ops" />
          <Picker.Item label="Blasting" value="blasting" />
          <Picker.Item label="Equipment Maintenance" value="maintenance" />
          <Picker.Item label="Safety" value="safety" />
        </Picker>
      </View>
    </View>

    <View style={styles.inputGroup}>
      <Text style={styles.label}>Shift *</Text>
      <View style={styles.pickerContainer}>
        <Picker
          selectedValue={formData.shift || ''}
          onValueChange={(value) => setFormData({ ...formData, shift: value })}
          style={styles.picker}
        >
          <Picker.Item label="Select Shift" value="" />
          <Picker.Item label="Day Shift (6AM-6PM)" value="day" />
          <Picker.Item label="Night Shift (6PM-6AM)" value="night" />
          <Picker.Item label="Rotating Shift" value="rotating" />
        </Picker>
      </View>
    </View>

    <View style={styles.inputGroup}>
      <Text style={styles.label}>Address</Text>
      <TextInput
        style={styles.input}
        value={formData.address || ''}
        onChangeText={(text) => setFormData({ ...formData, address: text })}
        placeholder="Enter residential address"
        multiline
        numberOfLines={2}
        placeholderTextColor={COLORS.textMuted}
      />
    </View>

    <View style={styles.inputGroup}>
      <Text style={styles.label}>Experience (Years)</Text>
      <TextInput
        style={styles.input}
        value={formData.experience?.toString() || ''}
        onChangeText={(text) => setFormData({ ...formData, experience: parseInt(text) || '' })}
        placeholder="Years of mining experience"
        keyboardType="numeric"
        placeholderTextColor={COLORS.textMuted}
      />
    </View>

    <View style={[styles.checkboxGroup, { marginBottom: 16 }]}>
      <TouchableOpacity
        style={styles.checkboxContainer}
        onPress={() => setFormData({ ...formData, trainingCompleted: !formData.trainingCompleted })}
      >
        <View style={[styles.checkbox, formData.trainingCompleted && styles.checkboxChecked]}>
          {formData.trainingCompleted && <Text style={styles.checkboxMark}>✓</Text>}
        </View>
        <Text style={styles.checkboxLabel}>Safety Training Completed</Text>
      </TouchableOpacity>
    </View>

    <View style={styles.inputGroup}>
      <Text style={styles.label}>Health Checkup Report</Text>
      <TouchableOpacity
        style={styles.documentButton}
        onPress={async () => {
          try {
            const result = await DocumentPicker.getDocumentAsync({
              type: ['application/pdf', 'image/*'],
              copyToCacheDirectory: true,
            });
            if (result.assets && result.assets.length > 0) {
              setFormData({ ...formData, healthCheckup: result.assets[0] });
            }
          } catch (error) {
            console.error('Document picker error:', error);
          }
        }}
      >
        <Text style={styles.documentButtonText}>
          {formData.healthCheckup ? '✓ Health Report Uploaded' : '📎 Upload Health Checkup Report'}
        </Text>
      </TouchableOpacity>
    </View>
  </View>
);

const SupervisorForm = ({ formData, setFormData, minersList, setShowMinerModal }: { formData: any, setFormData: any, minersList: User[], setShowMinerModal: (show: boolean) => void }) => (
  <View>
    <View style={styles.inputGroup}>
      <Text style={styles.label}>Full Name *</Text>
      <TextInput
        style={styles.input}
        value={formData.name || ''}
        onChangeText={(text) => setFormData({ ...formData, name: text })}
        placeholder="Enter supervisor's full name"
        placeholderTextColor={COLORS.textMuted}
      />
    </View>

    <View style={styles.inputGroup}>
      <Text style={styles.label}>Phone Number *</Text>
      <TextInput
        style={styles.input}
        value={formData.phoneNumber || ''}
        onChangeText={(text) => {
          if (!text.startsWith('+91')) {
            text = '+91' + text.replace(/[^0-9]/g, '');
          }
          const cleaned = '+91' + text.slice(3).replace(/[^0-9]/g, '');
          setFormData({ ...formData, phoneNumber: cleaned.slice(0, 13) });
        }}
        placeholder="+919876543210"
        keyboardType="phone-pad"
        maxLength={13}
        placeholderTextColor={COLORS.textMuted}
      />
    </View>

    <View style={styles.inputGroup}>
      <Text style={styles.label}>Email *</Text>
      <TextInput
        style={styles.input}
        value={formData.email || ''}
        onChangeText={(text) => setFormData({ ...formData, email: text })}
        placeholder="supervisor@company.com"
        keyboardType="email-address"
        autoCapitalize="none"
        placeholderTextColor={COLORS.textMuted}
      />
    </View>

    <View style={styles.inputGroup}>
      <Text style={styles.label}>Department</Text>
      <View style={styles.pickerContainer}>
        <Picker
          selectedValue={formData.department || ''}
          onValueChange={(value) => setFormData({ ...formData, department: value })}
          style={styles.picker}
        >
          <Picker.Item label="Select Department" value="" />
          <Picker.Item label="Mining Operations" value="mining_ops" />
          <Picker.Item label="Blasting" value="blasting" />
          <Picker.Item label="Equipment Maintenance" value="maintenance" />
          <Picker.Item label="Safety" value="safety" />
        </Picker>
      </View>
    </View>

    <View style={styles.inputGroup}>
      <Text style={styles.label}>Team Size</Text>
      <TextInput
        style={styles.input}
        value={formData.teamSize?.toString() || ''}
        onChangeText={(text) => setFormData({ ...formData, teamSize: parseInt(text) || '' })}
        placeholder="Number of miners supervised"
        keyboardType="numeric"
        placeholderTextColor={COLORS.textMuted}
      />
    </View>

    <View style={styles.inputGroup}>
      <Text style={styles.label}>Assign Miners</Text>
      <Text style={styles.helperText}>Select from available unassigned miners to assign to this supervisor</Text>
      <TouchableOpacity
        style={styles.assignMinersButton}
        onPress={() => setShowMinerModal(true)}
      >
        <Text style={styles.assignMinersButtonText}>
          Select Miners ({formData.assignedMiners?.length || 0} selected)
        </Text>
      </TouchableOpacity>
      {formData.assignedMiners && formData.assignedMiners.length > 0 && (
        <View style={styles.selectedMinersContainer}>
          <Text style={styles.selectedMinersLabel}>Selected Miners:</Text>
          {formData.assignedMiners.map((minerId: string) => {
            const miner = minersList.find(m => m.id === minerId);
            return miner ? (
              <Text key={minerId} style={styles.selectedMinerText}>• {miner.name}</Text>
            ) : null;
          })}
        </View>
      )}
    </View>
  </View>
);

const SafetyOfficerForm = ({ formData, setFormData }: { formData: any, setFormData: any }) => (
  <View>
    <View style={styles.inputGroup}>
      <Text style={styles.label}>Full Name *</Text>
      <TextInput
        style={styles.input}
        value={formData.name || ''}
        onChangeText={(text) => setFormData({ ...formData, name: text })}
        placeholder="Enter safety officer's full name"
        placeholderTextColor={COLORS.textMuted}
      />
    </View>

    <View style={styles.inputGroup}>
      <Text style={styles.label}>Phone Number *</Text>
      <TextInput
        style={styles.input}
        value={formData.phoneNumber || ''}
        onChangeText={(text) => {
          if (!text.startsWith('+91')) {
            text = '+91' + text.replace(/[^0-9]/g, '');
          }
          const cleaned = '+91' + text.slice(3).replace(/[^0-9]/g, '');
          setFormData({ ...formData, phoneNumber: cleaned.slice(0, 13) });
        }}
        placeholder="+919876543210"
        keyboardType="phone-pad"
        maxLength={13}
        placeholderTextColor={COLORS.textMuted}
      />
    </View>

    <View style={styles.inputGroup}>
      <Text style={styles.label}>Email *</Text>
      <TextInput
        style={styles.input}
        value={formData.email || ''}
        onChangeText={(text) => setFormData({ ...formData, email: text })}
        placeholder="safety@company.com"
        keyboardType="email-address"
        autoCapitalize="none"
        placeholderTextColor={COLORS.textMuted}
      />
    </View>

    <View style={styles.inputGroup}>
      <Text style={styles.label}>Department</Text>
      <View style={styles.pickerContainer}>
        <Picker
          selectedValue={formData.department || ''}
          onValueChange={(value) => setFormData({ ...formData, department: value })}
          style={styles.picker}
        >
          <Picker.Item label="Select Department" value="" />
          <Picker.Item label="Safety & Compliance" value="safety_compliance" />
          <Picker.Item label="Risk Assessment" value="risk_assessment" />
          <Picker.Item label="Training" value="training" />
          <Picker.Item label="Audit" value="audit" />
        </Picker>
      </View>
    </View>

    <View style={styles.inputGroup}>
      <Text style={styles.label}>Experience (Years)</Text>
      <TextInput
        style={styles.input}
        value={formData.experience?.toString() || ''}
        onChangeText={(text) => setFormData({ ...formData, experience: parseInt(text) || '' })}
        placeholder="Years of safety experience"
        keyboardType="numeric"
        placeholderTextColor={COLORS.textMuted}
      />
    </View>

    <View style={styles.inputGroup}>
      <Text style={styles.label}>Certifications</Text>
      <TouchableOpacity
        style={styles.documentButton}
        onPress={async () => {
          try {
            const result = await DocumentPicker.getDocumentAsync({
              type: ['application/pdf', 'image/*'],
              copyToCacheDirectory: true,
            });
            if (result.assets && result.assets.length > 0) {
              setFormData({ ...formData, certifications: result.assets[0] });
            }
          } catch (error) {
            console.error('Document picker error:', error);
          }
        }}
      >
        <Text style={styles.documentButtonText}>
          {formData.certifications ? '✓ Certification Uploaded' : '📎 Upload Safety Certifications'}
        </Text>
      </TouchableOpacity>
    </View>
  </View>
);

const EngineerForm = ({ formData, setFormData }: { formData: any, setFormData: any }) => (
  <View>
    <View style={styles.inputGroup}>
      <Text style={styles.label}>Full Name *</Text>
      <TextInput
        style={styles.input}
        value={formData.name || ''}
        onChangeText={(text) => setFormData({ ...formData, name: text })}
        placeholder="Enter engineer's full name"
        placeholderTextColor={COLORS.textMuted}
      />
    </View>

    <View style={styles.inputGroup}>
      <Text style={styles.label}>Phone Number *</Text>
      <TextInput
        style={styles.input}
        value={formData.phoneNumber || ''}
        onChangeText={(text) => {
          if (!text.startsWith('+91')) {
            text = '+91' + text.replace(/[^0-9]/g, '');
          }
          const cleaned = '+91' + text.slice(3).replace(/[^0-9]/g, '');
          setFormData({ ...formData, phoneNumber: cleaned.slice(0, 13) });
        }}
        placeholder="+919876543210"
        keyboardType="phone-pad"
        maxLength={13}
        placeholderTextColor={COLORS.textMuted}
      />
    </View>

    <View style={styles.inputGroup}>
      <Text style={styles.label}>Email *</Text>
      <TextInput
        style={styles.input}
        value={formData.email || ''}
        onChangeText={(text) => setFormData({ ...formData, email: text })}
        placeholder="engineer@company.com"
        keyboardType="email-address"
        autoCapitalize="none"
        placeholderTextColor={COLORS.textMuted}
      />
    </View>

    <View style={styles.inputGroup}>
      <Text style={styles.label}>Specialization</Text>
      <View style={styles.pickerContainer}>
        <Picker
          selectedValue={formData.specialization || ''}
          onValueChange={(value) => setFormData({ ...formData, specialization: value })}
          style={styles.picker}
        >
          <Picker.Item label="Select Specialization" value="" />
          <Picker.Item label="Mining Engineering" value="mining_engineering" />
          <Picker.Item label="Geotechnical Engineering" value="geotechnical" />
          <Picker.Item label="Environmental Engineering" value="environmental" />
          <Picker.Item label="Mechanical Engineering" value="mechanical" />
          <Picker.Item label="Electrical Engineering" value="electrical" />
        </Picker>
      </View>
    </View>

    <View style={styles.inputGroup}>
      <Text style={styles.label}>Department</Text>
      <View style={styles.pickerContainer}>
        <Picker
          selectedValue={formData.department || ''}
          onValueChange={(value) => setFormData({ ...formData, department: value })}
          style={styles.picker}
        >
          <Picker.Item label="Select Department" value="" />
          <Picker.Item label="Engineering" value="engineering" />
          <Picker.Item label="R&D" value="research_development" />
          <Picker.Item label="Operations" value="operations" />
          <Picker.Item label="Maintenance" value="maintenance" />
        </Picker>
      </View>
    </View>

    <View style={styles.inputGroup}>
      <Text style={styles.label}>Experience (Years)</Text>
      <TextInput
        style={styles.input}
        value={formData.experience?.toString() || ''}
        onChangeText={(text) => setFormData({ ...formData, experience: parseInt(text) || '' })}
        placeholder="Years of engineering experience"
        keyboardType="numeric"
        placeholderTextColor={COLORS.textMuted}
      />
    </View>

    <View style={styles.inputGroup}>
      <Text style={styles.label}>Qualifications</Text>
      <TouchableOpacity
        style={styles.documentButton}
        onPress={async () => {
          try {
            const result = await DocumentPicker.getDocumentAsync({
              type: ['application/pdf', 'image/*'],
              copyToCacheDirectory: true,
            });
            if (result.assets && result.assets.length > 0) {
              setFormData({ ...formData, qualifications: result.assets[0] });
            }
          } catch (error) {
            console.error('Document picker error:', error);
          }
        }}
      >
        <Text style={styles.documentButtonText}>
          {formData.qualifications ? '✓ Qualifications Uploaded' : '📎 Upload Engineering Qualifications'}
        </Text>
      </TouchableOpacity>
    </View>
  </View>
);

export default function AdminHome() {
  const router = useRouter();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  // Role selector modal state
  const [showRoleModal, setShowRoleModal] = useState(false);
  const [selectedRole, setSelectedRole] = useState<string>('');

  // Miner selection modal state
  const [showMinerModal, setShowMinerModal] = useState(false);

  // Role details modal state
  const [showRoleDetailsModal, setShowRoleDetailsModal] = useState(false);
  const [selectedRoleForDetails, setSelectedRoleForDetails] = useState<string>('');

  // User details modal state
  const [showUserDetailsModal, setShowUserDetailsModal] = useState(false);
  const [selectedUserForDetails, setSelectedUserForDetails] = useState<User | null>(null);
  const [isEditingUser, setIsEditingUser] = useState(false);
  const [editedUserData, setEditedUserData] = useState<any>({});

  // Form data state
  const [formData, setFormData] = useState<any>({});
  const [minersList, setMinersList] = useState<User[]>([]);

  // Color scheme for diverse UI elements
  const colors = {
    primary: '#FF6B00',      // Orange - main brand
    secondary: '#2563EB',    // Blue - secondary actions
    success: '#059669',      // Green - positive actions
    accent: '#7C3AED',       // Purple - special elements
    warning: '#D97706',      // Amber - warnings
    danger: '#DC2626',       // Red - delete/error actions
    info: '#0891B2',         // Cyan - informational
  };

  const roles = [
    {
      value: 'miner',
      label: 'Miner',
      color: '#2563EB', // Blue
      icon: '⛏️',
      description: 'Field workers responsible for mining operations and safety compliance'
    },
    {
      value: 'supervisor',
      label: 'Supervisor',
      color: '#059669', // Green
      icon: '👔',
      description: 'Oversees mining teams, manages operations, and coordinates with management'
    },
    {
      value: 'safety_officer',
      label: 'Safety Officer',
      color: '#FF6B00', // Orange
      icon: '🛡️',
      description: 'Ensures workplace safety, conducts inspections, and manages compliance'
    },
    {
      value: 'engineer',
      label: 'Engineer',
      color: '#7C3AED', // Purple
      icon: '⚙️',
      description: 'Technical experts handling equipment, systems, and engineering solutions'
    },
  ];

  useEffect(() => {
    fetchUsers();
    fetchMiners();
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
          phoneNumber: data.phoneNumber,
          role: data.role,
          name: data.name,
          email: data.email,
          empId: data.empId,
          department: data.department,
          shift: data.shift,
          age: data.age,
          address: data.address,
          trainingCompleted: data.trainingCompleted,
          experience: data.experience,
          teamSize: data.teamSize,
          assignedMiners: data.assignedMiners,
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

  const fetchMiners = async (filterUnassigned = false) => {
    try {
      const q = query(collection(db, 'users'), where('role', '==', 'miner'));
      const minersSnapshot = await getDocs(q);
      let miners: User[] = [];
      minersSnapshot.forEach((doc) => {
        const data = doc.data();
        miners.push({
          id: doc.id,
          name: data.name,
          phoneNumber: data.phoneNumber,
          role: data.role,
        });
      });

      if (filterUnassigned) {
        // Get all supervisors and their assigned miners
        const supervisorsQuery = query(collection(db, 'users'), where('role', '==', 'supervisor'));
        const supervisorsSnapshot = await getDocs(supervisorsQuery);
        const assignedMinerIds = new Set<string>();

        supervisorsSnapshot.forEach((doc) => {
          const data = doc.data();
          if (data.assignedMiners && Array.isArray(data.assignedMiners)) {
            data.assignedMiners.forEach((minerId: string) => assignedMinerIds.add(minerId));
          }
        });

        // Filter out assigned miners
        miners = miners.filter(miner => !assignedMinerIds.has(miner.id));
      }

      setMinersList(miners);
    } catch (error: any) {
      console.error('Error fetching miners:', error);
    }
  };

  const generateEmployeeId = async (role: string): Promise<string> => {
    try {
      const q = query(collection(db, 'users'), where('role', '==', role));
      const snapshot = await getDocs(q);
      const count = snapshot.size + 1;

      const prefixes = {
        'supervisor': 'SUP',
        'safety_officer': 'SOF',
        'engineer': 'ENG',
      };

      const prefix = prefixes[role as keyof typeof prefixes] || 'EMP';
      return `${prefix}-${count.toString().padStart(4, '0')}`;
    } catch (error) {
      console.error('Error generating employee ID:', error);
      return `${role.toUpperCase().slice(0, 3)}-0001`;
    }
  };

  const handleRoleSelect = (role: string) => {
    setSelectedRole(role);
    setFormData({});
    setShowRoleModal(false);
    
    // Fetch unassigned miners when supervisor role is selected
    if (role === 'supervisor') {
      fetchMiners(true);
    } else {
      fetchMiners(false);
    }
  };

  const validateForm = (): boolean => {
    if (!formData.phoneNumber && selectedRole !== 'miner') {
      Alert.alert('Error', 'Phone number is required');
      return false;
    }

    if (!formData.name) {
      Alert.alert('Error', 'Name is required');
      return false;
    }

    if (selectedRole === 'supervisor' || selectedRole === 'safety_officer' || selectedRole === 'engineer') {
      if (!formData.email) {
        Alert.alert('Error', 'Email is required');
        return false;
      }
    }

    if (selectedRole === 'miner') {
      if (!formData.age || formData.age < 18) {
        Alert.alert('Error', 'Valid age (18+) is required for miners');
        return false;
      }
      if (!formData.shift) {
        Alert.alert('Error', 'Shift selection is required');
        return false;
      }
      if (!formData.department) {
        Alert.alert('Error', 'Department selection is required');
        return false;
      }
    }

    return true;
  };

  const handleAddUser = async () => {
    if (!validateForm()) return;

    setLoading(true);
    try {
      let docId: string;
      let userData: any = {
        ...formData,
        role: selectedRole,
        createdAt: new Date().toISOString(),
        createdBy: auth.currentUser?.phoneNumber || 'admin',
      };

      // Generate employee ID for certain roles
      if (['supervisor', 'safety_officer', 'engineer'].includes(selectedRole)) {
        userData.empId = await generateEmployeeId(selectedRole);
      }

      // Set document ID based on role
      if (selectedRole === 'miner') {
        docId = formData.phoneNumber.replace('+', '');
      } else {
        docId = userData.empId || formData.phoneNumber.replace('+', '');
      }

      // Create user document in Firestore
      await setDoc(doc(db, 'users', docId), userData);

      Alert.alert('Success', `User ${formData.name} added successfully with role: ${selectedRole}`);
      setFormData({});
      setSelectedRole('');
      fetchUsers();
      if (selectedRole === 'supervisor') {
        fetchMiners();
      }
    } catch (error: any) {
      console.error('Error adding user:', error);
      Alert.alert('Error', error.message || 'Failed to add user');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveUserChanges = async () => {
    if (!selectedUserForDetails) return;

    try {
      // Filter out undefined values to prevent Firebase errors
      const cleanedData = Object.fromEntries(
        Object.entries(editedUserData).filter(([_, value]) => value !== undefined)
      );
      
      await setDoc(doc(db, 'users', selectedUserForDetails.id), cleanedData, { merge: true });
      setUsers(users.map(user => 
        user.id === selectedUserForDetails.id ? { ...user, ...cleanedData } : user
      ));
      setIsEditingUser(false);
      setShowUserDetailsModal(false);
      Alert.alert('Success', 'User details updated successfully');
    } catch (error: any) {
      console.error('Error updating user:', error);
      Alert.alert('Error', 'Failed to update user details');
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
    return roles.find((r) => r.value === role)?.color || '#FF6B00';
  };

  const getRoleLabel = (role: string) => {
    return roles.find((r) => r.value === role)?.label || role;
  };

  const getSupervisorName = (minerId: string) => {
    const supervisor = users.find(user =>
      user.role === 'supervisor' &&
      user.assignedMiners?.includes(minerId)
    );
    return supervisor?.name || null;
  };

  const getAssignedMinersCount = (supervisorId: string) => {
    const supervisor = users.find(user => user.id === supervisorId);
    return supervisor?.assignedMiners?.length || 0;
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Admin Panel</Text>
        <TouchableOpacity onPress={handleSignOut} style={styles.signOutButton}>
          <Text style={styles.signOutText}>Sign Out</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content}>
        {/* Add User Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Add New User</Text>

          <TouchableOpacity
            style={styles.roleSelectorButton}
            onPress={() => setShowRoleModal(true)}
          >
            <Text style={styles.roleSelectorText}>
              {selectedRole ? `Selected: ${getRoleLabel(selectedRole)}` : 'Select User Role'}
            </Text>
            <Text style={styles.roleSelectorArrow}>▼</Text>
          </TouchableOpacity>

          {selectedRole && (
            <View style={styles.formContainer}>
              {selectedRole === 'miner' && (
                <MinerForm formData={formData} setFormData={setFormData} />
              )}
              {selectedRole === 'supervisor' && (
                <SupervisorForm formData={formData} setFormData={setFormData} minersList={minersList} setShowMinerModal={setShowMinerModal} />
              )}
              {selectedRole === 'safety_officer' && (
                <SafetyOfficerForm formData={formData} setFormData={setFormData} />
              )}
              {selectedRole === 'engineer' && (
                <EngineerForm formData={formData} setFormData={setFormData} />
              )}

              <TouchableOpacity
                style={[styles.addButton, loading && styles.addButtonDisabled]}
                onPress={handleAddUser}
                disabled={loading}
              >
                {loading ? (
                  <ActivityIndicator color="#000000" />
                ) : (
                  <Text style={styles.addButtonText}>Add User</Text>
                )}
              </TouchableOpacity>
            </View>
          )}
        </View>

        {/* Users List Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>All Users</Text>
            <TouchableOpacity onPress={fetchUsers} disabled={refreshing} style={styles.refreshButton}>
              <Text style={styles.refreshIcon}>
                {refreshing ? '⏳' : '↻'}
              </Text>
            </TouchableOpacity>
          </View>

          {refreshing ? (
            <ActivityIndicator size="large" color="#FF6B00" style={styles.loader} />
          ) : (
            <View style={styles.roleCategories}>
              {roles.map((role) => {
                const roleUsers = users.filter(user => user.role === role.value);
                return (
                  <TouchableOpacity
                    key={role.value}
                    style={[styles.roleCategoryCard, { borderColor: role.color }]}
                    onPress={() => {
                      setSelectedRoleForDetails(role.value);
                      setShowRoleDetailsModal(true);
                    }}
                  >
                    <View style={[styles.roleCategoryIcon, { backgroundColor: role.color }]}>
                      <Text style={styles.roleCategoryIconText}>{role.icon}</Text>
                    </View>
                    <View style={styles.roleCategoryInfo}>
                      <Text style={styles.roleCategoryTitle}>{role.label}</Text>
                      <Text style={styles.roleCategoryCount}>{roleUsers.length} users</Text>
                    </View>
                  </TouchableOpacity>
                );
              })}
            </View>
          )}
        </View>
      </ScrollView>

      {/* Role Selection Modal */}
      <Modal
        visible={showRoleModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowRoleModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Select User Role</Text>
            {roles.map((role) => (
              <TouchableOpacity
                key={role.value}
                style={styles.simpleRoleButton}
                onPress={() => handleRoleSelect(role.value)}
              >
                <Text style={styles.simpleRoleText}>{role.label}</Text>
              </TouchableOpacity>
            ))}
            <TouchableOpacity
              style={styles.modalCancelButton}
              onPress={() => setShowRoleModal(false)}
            >
              <Text style={styles.modalCancelText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Miner Selection Modal */}
      <Modal
        visible={showMinerModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowMinerModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.minerModalContent}>
            <Text style={styles.modalTitle}>Select Miners to Assign</Text>
            <Text style={styles.minerModalSubtitle}>Choose unassigned miners from the list below</Text>

            <FlatList
              data={minersList}
              keyExtractor={(item) => item.id}
              renderItem={({ item: miner }) => (
                <TouchableOpacity
                  style={[
                    styles.minerListItem,
                    formData.assignedMiners?.includes(miner.id) && styles.minerListItemSelected
                  ]}
                  onPress={() => {
                    const assigned = formData.assignedMiners || [];
                    const updated = assigned.includes(miner.id)
                      ? assigned.filter((id: string) => id !== miner.id)
                      : [...assigned, miner.id];
                    setFormData({ ...formData, assignedMiners: updated });
                  }}
                >
                  <View style={styles.minerInfo}>
                    <Text style={styles.minerName}>{miner.name}</Text>
                    <Text style={styles.minerPhone}>{miner.phoneNumber}</Text>
                  </View>
                  <View style={[
                    styles.checkbox,
                    formData.assignedMiners?.includes(miner.id) && styles.checkboxChecked
                  ]}>
                    {formData.assignedMiners?.includes(miner.id) && <Text style={styles.checkboxMark}>✓</Text>}
                  </View>
                </TouchableOpacity>
              )}
              style={styles.minerList}
              showsVerticalScrollIndicator={false}
            />

            <View style={styles.minerModalActions}>
              <TouchableOpacity
                style={styles.minerModalDoneButton}
                onPress={() => setShowMinerModal(false)}
              >
                <Text style={styles.minerModalDoneText}>Done ({formData.assignedMiners?.length || 0} selected)</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Role Details Modal */}
      <Modal
        visible={showRoleDetailsModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowRoleDetailsModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.roleDetailsModalContent}>
            {/* Modal Header */}
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                {getRoleLabel(selectedRoleForDetails)}
              </Text>
              <TouchableOpacity
                style={styles.modalCloseButton}
                onPress={() => setShowRoleDetailsModal(false)}
              >
                <Text style={styles.modalCloseText}>✕</Text>
              </TouchableOpacity>
            </View>

            {/* User List */}
            <FlatList
              data={users.filter(user => user.role === selectedRoleForDetails)}
              keyExtractor={(item) => item.id}
              style={styles.roleDetailsList}
              showsVerticalScrollIndicator={false}
              contentContainerStyle={styles.listContent}
              renderItem={({ item: user }) => (
                <TouchableOpacity 
                  style={styles.roleDetailCard}
                  onPress={() => {
                    setSelectedUserForDetails(user);
                    setEditedUserData({...user});
                    setIsEditingUser(false);
                    setShowUserDetailsModal(true);
                  }}
                >
                  {selectedRoleForDetails === 'miner' && (
                    <>
                      <View style={styles.roleDetailHeader}>
                        <View style={styles.userInfoSection}>
                          <Text style={styles.roleDetailName}>{user.name || 'Unnamed Miner'}</Text>
                          <Text style={styles.roleDetailSubInfo}>
                            📱 {user.phoneNumber || 'No phone'}
                          </Text>
                        </View>
                        <TouchableOpacity
                          style={styles.roleDetailDeleteButton}
                          onPress={() => handleDeleteUser(user.id, user.name || user.phoneNumber || 'Unknown')}
                        >
                          <Text style={styles.roleDetailDeleteText}>🗑️</Text>
                        </TouchableOpacity>
                      </View>
                      <Text style={styles.roleDetailInfo}>
                        👔 Supervisor: {getSupervisorName(user.id) || 'Unassigned'}
                      </Text>
                    </>
                  )}

                  {selectedRoleForDetails === 'supervisor' && (
                    <>
                      <View style={styles.roleDetailHeader}>
                        <View style={styles.userInfoSection}>
                          <Text style={styles.roleDetailName}>{user.name || 'Unnamed Supervisor'}</Text>
                          <Text style={styles.roleDetailSubInfo}>
                            📱 {user.phoneNumber || 'No phone'}
                          </Text>
                        </View>
                        <TouchableOpacity
                          style={styles.roleDetailDeleteButton}
                          onPress={() => handleDeleteUser(user.id, user.name || user.phoneNumber || 'Unknown')}
                        >
                          <Text style={styles.roleDetailDeleteText}>🗑️</Text>
                        </TouchableOpacity>
                      </View>
                      <Text style={styles.roleDetailInfo}>
                        👷 Assigned Miners: {getAssignedMinersCount(user.id)}
                      </Text>
                    </>
                  )}

                  {(selectedRoleForDetails === 'safety_officer' || selectedRoleForDetails === 'engineer') && (
                    <>
                      <View style={styles.roleDetailHeader}>
                        <View style={styles.userInfoSection}>
                          <Text style={styles.roleDetailName}>{user.name || `Unnamed ${getRoleLabel(selectedRoleForDetails)}`}</Text>
                          <Text style={styles.roleDetailSubInfo}>
                            📱 {user.phoneNumber || 'No phone'}
                          </Text>
                        </View>
                        <TouchableOpacity
                          style={styles.roleDetailDeleteButton}
                          onPress={() => handleDeleteUser(user.id, user.name || user.phoneNumber || 'Unknown')}
                        >
                          <Text style={styles.roleDetailDeleteText}>🗑️</Text>
                        </TouchableOpacity>
                      </View>
                    </>
                  )}
                </TouchableOpacity>
              )}
              ListEmptyComponent={
                <View style={styles.emptyState}>
                  <Text style={styles.emptyRoleText}>No {getRoleLabel(selectedRoleForDetails).toLowerCase()} found</Text>
                  <Text style={styles.emptyRoleSubtext}>Add some users to see them here</Text>
                </View>
              }
            />
          </View>
        </View>
      </Modal>

      {/* User Details Modal */}
      <Modal
        visible={showUserDetailsModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => {
          setShowUserDetailsModal(false);
          setIsEditingUser(false);
        }}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.userDetailsModalContent}>
            {/* Modal Header */}
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                {selectedUserForDetails?.name || 'User Details'}
              </Text>
              <TouchableOpacity
                style={styles.modalCloseButton}
                onPress={() => {
                  setShowUserDetailsModal(false);
                  setIsEditingUser(false);
                }}
              >
                <Text style={styles.modalCloseText}>✕</Text>
              </TouchableOpacity>
            </View>

            {/* Action Buttons */}
            <View style={styles.userActions}>
              {!isEditingUser ? (
                <TouchableOpacity
                  style={styles.editButton}
                  onPress={() => setIsEditingUser(true)}
                >
                  <Text style={styles.editButtonText}>✏️ Edit</Text>
                </TouchableOpacity>
              ) : (
                <View style={styles.editActions}>
                  <TouchableOpacity
                    style={styles.saveButton}
                    onPress={handleSaveUserChanges}
                  >
                    <Text style={styles.saveButtonText}>💾 Save Changes</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.cancelButton}
                    onPress={() => {
                      setIsEditingUser(false);
                      setEditedUserData({...selectedUserForDetails});
                    }}
                  >
                    <Text style={styles.cancelButtonText}>❌ Cancel</Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>

            {/* User Details Form */}
            <ScrollView style={styles.userDetailsScroll} showsVerticalScrollIndicator={false}>
              <View style={styles.userDetailsForm}>
                {/* Basic Information */}
                <Text style={styles.formSectionTitle}>Basic Information</Text>

                <View style={styles.inputGroup}>
                  <Text style={styles.label}>Full Name</Text>
                  {isEditingUser ? (
                    <TextInput
                      style={styles.input}
                      value={editedUserData.name || ''}
                      onChangeText={(text) => setEditedUserData({ ...editedUserData, name: text })}
                      placeholder="Enter full name"
                      placeholderTextColor="#CCCCCC"
                    />
                  ) : (
                    <Text style={styles.readOnlyText}>{selectedUserForDetails?.name || 'Not provided'}</Text>
                  )}
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.label}>Phone Number</Text>
                  {isEditingUser ? (
                    <TextInput
                      style={styles.input}
                      value={editedUserData.phoneNumber || ''}
                      onChangeText={(text) => setEditedUserData({ ...editedUserData, phoneNumber: text })}
                      placeholder="Enter phone number"
                      keyboardType="phone-pad"
                      placeholderTextColor="#CCCCCC"
                    />
                  ) : (
                    <Text style={styles.readOnlyText}>{selectedUserForDetails?.phoneNumber || 'Not provided'}</Text>
                  )}
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.label}>Email</Text>
                  {isEditingUser ? (
                    <TextInput
                      style={styles.input}
                      value={editedUserData.email || ''}
                      onChangeText={(text) => setEditedUserData({ ...editedUserData, email: text })}
                      placeholder="Enter email"
                      keyboardType="email-address"
                      placeholderTextColor="#CCCCCC"
                    />
                  ) : (
                    <Text style={styles.readOnlyText}>{selectedUserForDetails?.email || 'Not provided'}</Text>
                  )}
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.label}>Employee ID</Text>
                  {isEditingUser ? (
                    <TextInput
                      style={styles.input}
                      value={editedUserData.empId || ''}
                      onChangeText={(text) => setEditedUserData({ ...editedUserData, empId: text })}
                      placeholder="Enter employee ID"
                      placeholderTextColor="#CCCCCC"
                    />
                  ) : (
                    <Text style={styles.readOnlyText}>{selectedUserForDetails?.empId || 'Not provided'}</Text>
                  )}
                </View>

                {/* Role Specific Information */}
                {selectedUserForDetails?.role === 'miner' && (
                  <>
                    <Text style={styles.formSectionTitle}>Miner Details</Text>

                    <View style={styles.inputGroup}>
                      <Text style={styles.label}>Age</Text>
                      {isEditingUser ? (
                        <TextInput
                          style={styles.input}
                          value={editedUserData.age?.toString() || ''}
                          onChangeText={(text) => setEditedUserData({ ...editedUserData, age: parseInt(text) || '' })}
                          placeholder="Enter age"
                          keyboardType="numeric"
                          placeholderTextColor="#CCCCCC"
                        />
                      ) : (
                        <Text style={styles.readOnlyText}>{selectedUserForDetails?.age || 'Not provided'}</Text>
                      )}
                    </View>

                    <View style={styles.inputGroup}>
                      <Text style={styles.label}>Department</Text>
                      {isEditingUser ? (
                        <View style={styles.pickerContainer}>
                          <Picker
                            selectedValue={editedUserData.department || ''}
                            onValueChange={(value) => setEditedUserData({ ...editedUserData, department: value })}
                            style={styles.picker}
                          >
                            <Picker.Item label="Select Department" value="" />
                            <Picker.Item label="Mining Operations" value="mining_ops" />
                            <Picker.Item label="Blasting" value="blasting" />
                            <Picker.Item label="Equipment Maintenance" value="maintenance" />
                          </Picker>
                        </View>
                      ) : (
                        <Text style={styles.readOnlyText}>{selectedUserForDetails?.department || 'Not provided'}</Text>
                      )}
                    </View>

                    <View style={styles.inputGroup}>
                      <Text style={styles.label}>Shift</Text>
                      {isEditingUser ? (
                        <View style={styles.pickerContainer}>
                          <Picker
                            selectedValue={editedUserData.shift || ''}
                            onValueChange={(value) => setEditedUserData({ ...editedUserData, shift: value })}
                            style={styles.picker}
                          >
                            <Picker.Item label="Select Shift" value="" />
                            <Picker.Item label="Day Shift" value="day" />
                            <Picker.Item label="Night Shift" value="night" />
                            <Picker.Item label="Rotating" value="rotating" />
                          </Picker>
                        </View>
                      ) : (
                        <Text style={styles.readOnlyText}>{selectedUserForDetails?.shift || 'Not provided'}</Text>
                      )}
                    </View>

                    <View style={styles.inputGroup}>
                      <Text style={styles.label}>Address</Text>
                      {isEditingUser ? (
                        <TextInput
                          style={styles.input}
                          value={editedUserData.address || ''}
                          onChangeText={(text) => setEditedUserData({ ...editedUserData, address: text })}
                          placeholder="Enter address"
                          multiline
                          numberOfLines={3}
                          placeholderTextColor="#CCCCCC"
                        />
                      ) : (
                        <Text style={styles.readOnlyText}>{selectedUserForDetails?.address || 'Not provided'}</Text>
                      )}
                    </View>

                    <View style={styles.inputGroup}>
                      <Text style={styles.label}>Training Completed</Text>
                      {isEditingUser ? (
                        <TouchableOpacity
                          style={styles.checkboxContainer}
                          onPress={() => setEditedUserData({ ...editedUserData, trainingCompleted: !editedUserData.trainingCompleted })}
                        >
                          <View style={[styles.checkbox, editedUserData.trainingCompleted && styles.checkboxChecked]}>
                            {editedUserData.trainingCompleted && <Text style={styles.checkboxMark}>✓</Text>}
                          </View>
                          <Text style={styles.checkboxLabel}>Safety Training Completed</Text>
                        </TouchableOpacity>
                      ) : (
                        <Text style={styles.readOnlyText}>{selectedUserForDetails?.trainingCompleted ? 'Yes' : 'No'}</Text>
                      )}
                    </View>

                    <View style={styles.inputGroup}>
                      <Text style={styles.label}>Experience (years)</Text>
                      {isEditingUser ? (
                        <TextInput
                          style={styles.input}
                          value={editedUserData.experience?.toString() || ''}
                          onChangeText={(text) => setEditedUserData({ ...editedUserData, experience: parseInt(text) || '' })}
                          placeholder="Enter years of experience"
                          keyboardType="numeric"
                          placeholderTextColor="#CCCCCC"
                        />
                      ) : (
                        <Text style={styles.readOnlyText}>{selectedUserForDetails?.experience || 'Not provided'}</Text>
                      )}
                    </View>
                  </>
                )}

                {selectedUserForDetails?.role === 'supervisor' && (
                  <>
                    <Text style={styles.formSectionTitle}>Supervisor Details</Text>

                    <View style={styles.inputGroup}>
                      <Text style={styles.label}>Team Size</Text>
                      {isEditingUser ? (
                        <TextInput
                          style={styles.input}
                          value={editedUserData.teamSize?.toString() || ''}
                          onChangeText={(text) => setEditedUserData({ ...editedUserData, teamSize: parseInt(text) || '' })}
                          placeholder="Enter team size"
                          keyboardType="numeric"
                          placeholderTextColor="#CCCCCC"
                        />
                      ) : (
                        <Text style={styles.readOnlyText}>{selectedUserForDetails?.teamSize || 'Not provided'}</Text>
                      )}
                    </View>

                    <View style={styles.inputGroup}>
                      <Text style={styles.label}>Experience (years)</Text>
                      {isEditingUser ? (
                        <TextInput
                          style={styles.input}
                          value={editedUserData.experience?.toString() || ''}
                          onChangeText={(text) => setEditedUserData({ ...editedUserData, experience: parseInt(text) || '' })}
                          placeholder="Enter years of experience"
                          keyboardType="numeric"
                          placeholderTextColor="#CCCCCC"
                        />
                      ) : (
                        <Text style={styles.readOnlyText}>{selectedUserForDetails?.experience || 'Not provided'}</Text>
                      )}
                    </View>

                    <View style={styles.inputGroup}>
                      <Text style={styles.label}>Department</Text>
                      {isEditingUser ? (
                        <View style={styles.pickerContainer}>
                          <Picker
                            selectedValue={editedUserData.department || ''}
                            onValueChange={(value) => setEditedUserData({ ...editedUserData, department: value })}
                            style={styles.picker}
                          >
                            <Picker.Item label="Select Department" value="" />
                            <Picker.Item label="Mining Operations" value="mining_ops" />
                            <Picker.Item label="Blasting" value="blasting" />
                            <Picker.Item label="Equipment Maintenance" value="maintenance" />
                          </Picker>
                        </View>
                      ) : (
                        <Text style={styles.readOnlyText}>{selectedUserForDetails?.department || 'Not provided'}</Text>
                      )}
                    </View>
                  </>
                )}

                {(selectedUserForDetails?.role === 'safety_officer' || selectedUserForDetails?.role === 'engineer') && (
                  <>
                    <Text style={styles.formSectionTitle}>{selectedUserForDetails?.role === 'safety_officer' ? 'Safety Officer' : 'Engineer'} Details</Text>

                    <View style={styles.inputGroup}>
                      <Text style={styles.label}>Experience (years)</Text>
                      {isEditingUser ? (
                        <TextInput
                          style={styles.input}
                          value={editedUserData.experience?.toString() || ''}
                          onChangeText={(text) => setEditedUserData({ ...editedUserData, experience: parseInt(text) || '' })}
                          placeholder="Enter years of experience"
                          keyboardType="numeric"
                          placeholderTextColor="#CCCCCC"
                        />
                      ) : (
                        <Text style={styles.readOnlyText}>{selectedUserForDetails?.experience || 'Not provided'}</Text>
                      )}
                    </View>

                    <View style={styles.inputGroup}>
                      <Text style={styles.label}>Department</Text>
                      {isEditingUser ? (
                        <View style={styles.pickerContainer}>
                          <Picker
                            selectedValue={editedUserData.department || ''}
                            onValueChange={(value) => setEditedUserData({ ...editedUserData, department: value })}
                            style={styles.picker}
                          >
                            <Picker.Item label="Select Department" value="" />
                            <Picker.Item label="Mining Operations" value="mining_ops" />
                            <Picker.Item label="Blasting" value="blasting" />
                            <Picker.Item label="Equipment Maintenance" value="maintenance" />
                            <Picker.Item label="Safety" value="safety" />
                            <Picker.Item label="Engineering" value="engineering" />
                          </Picker>
                        </View>
                      ) : (
                        <Text style={styles.readOnlyText}>{selectedUserForDetails?.department || 'Not provided'}</Text>
                      )}
                    </View>
                  </>
                )}
              </View>
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
    backgroundColor: '#0A0A0A',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#0F0F0F',
    borderBottomWidth: 2,
    borderBottomColor: '#0891B2',
    shadowColor: '#0891B2',
    shadowOffset: {
      width: 0,
      height: 3,
    },
    shadowOpacity: 0.4,
    shadowRadius: 6,
    elevation: 6,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FF6B00',
  },
  signOutButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#2563EB',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#3B82F6',
  },
  signOutText: {
    color: '#000000',
    fontWeight: '600',
  },
  content: {
    flex: 1,
  },
  section: {
    margin: 16,
    padding: 20,
    backgroundColor: '#121212',
    borderRadius: 16,
    borderWidth: 2,
    borderColor: '#7C3AED',
    shadowColor: '#7C3AED',
    shadowOffset: {
      width: 0,
      height: 3,
    },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 4,
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
    color: '#FFD700',
    marginBottom: 16,
  },
  refreshButton: {
    padding: 8,
    backgroundColor: '#164E63',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#0891B2',
  },
  refreshIcon: {
    fontSize: 24,
    color: '#0891B2',
    fontWeight: 'bold',
  },
  inputGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: '#FF6B00',
    borderRadius: 10,
    padding: 14,
    fontSize: 16,
    color: '#FFFFFF',
    backgroundColor: '#1A1A1A',
    shadowColor: '#FF6B00',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 1,
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
    backgroundColor: '#059669',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 12,
    shadowColor: '#059669',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
  },
  addButtonDisabled: {
    opacity: 0.6,
    shadowOpacity: 0.1,
  },
  addButtonText: {
    color: '#000000',
    fontSize: 16,
    fontWeight: '600',
  },
  usersList: {
    gap: 12,
  },
  userCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#1A1A1A',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#FF6B00',
    marginBottom: 8,
    shadowColor: '#FF6B00',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  userInfo: {
    flex: 1,
  },
  userPhone: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
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
    paddingHorizontal: 14,
    paddingVertical: 8,
    backgroundColor: '#2A2A2A',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#FF4444',
  },
  deleteButtonText: {
    color: '#FF4444',
    fontSize: 12,
    fontWeight: '600',
  },
  loader: {
    marginVertical: 20,
  },
  emptyText: {
    textAlign: 'center',
    color: '#FF6B00',
    fontSize: 14,
    paddingVertical: 20,
  },
  // Role selector styles
  roleSelectorButton: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#064E3B',
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#059669',
    borderStyle: 'dashed',
    marginBottom: 16,
  },
  roleSelectorText: {
    fontSize: 16,
    color: '#F0F9FF',
    flex: 1,
    fontWeight: '500',
  },
  roleSelectorArrow: {
    fontSize: 18,
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
  formContainer: {
    marginTop: 16,
  },
  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 20,
  },
  modalContent: {
    backgroundColor: '#1A1A1A',
    borderRadius: 16,
    padding: 24,
    width: '90%',
    maxWidth: 400,
    shadowColor: '#FF6B00',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
    borderWidth: 1,
    borderColor: '#FF6B00',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FF6B00',
    textAlign: 'center',
    marginBottom: 20,
    flex: 1,
  },
  modalRoleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    marginBottom: 12,
    backgroundColor: '#2A2A2A',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#FF6B00',
  },
  roleIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  roleIconText: {
    fontSize: 18,
  },
  modalRoleInfo: {
    flex: 1,
  },
  modalRoleTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 2,
  },
  modalRoleDescription: {
    fontSize: 12,
    color: '#FF6B00',
  },
  modalCancelButton: {
    padding: 16,
    backgroundColor: '#2A2A2A',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#FF6B00',
    alignItems: 'center',
  },
  modalCancelText: {
    fontSize: 16,
    color: '#FF6B00',
    fontWeight: '600',
  },
  // Simple role button styles
  simpleRoleButton: {
    padding: 16,
    backgroundColor: '#2A2A2A',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#FF6B00',
    alignItems: 'center',
    marginBottom: 12,
  },
  simpleRoleText: {
    fontSize: 16,
    color: '#FFFFFF',
    fontWeight: '600',
  },
  // Additional Form styles
  pickerContainer: {
    borderWidth: 1,
    borderColor: '#FF6B00',
    borderRadius: 10,
    backgroundColor: '#2A2A2A',
    shadowColor: '#FF6B00',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 1,
  },
  picker: {
    color: '#FFFFFF',
  },
  checkboxGroup: {
    marginTop: 8,
  },
  checkboxContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  checkbox: {
    width: 22,
    height: 22,
    borderWidth: 2,
    borderColor: '#FF6B00',
    borderRadius: 6,
    marginRight: 10,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#2A2A2A',
  },
  checkboxChecked: {
    backgroundColor: '#FF6B00',
    borderColor: '#FF6B00',
  },
  checkboxMark: {
    color: '#000000',
    fontSize: 14,
    fontWeight: 'bold',
  },
  checkboxLabel: {
    fontSize: 14,
    color: '#FFFFFF',
    fontWeight: '500',
  },
  helperText: {
    fontSize: 12,
    color: '#FF6B00',
    marginBottom: 8,
  },
  minersScroll: {
    marginTop: 8,
  },
  minerChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    backgroundColor: '#2A2A2A',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#FF6B00',
    marginRight: 8,
    marginBottom: 4,
  },
  minerChipSelected: {
    backgroundColor: '#FF6B00',
    borderColor: '#FF6B00',
  },
  minerChipText: {
    fontSize: 13,
    color: '#FFFFFF',
    fontWeight: '500',
  },
  minerChipTextSelected: {
    color: '#000000',
  },
  documentButton: {
    padding: 14,
    backgroundColor: '#2A2A2A',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#FF6B00',
    alignItems: 'center',
    borderStyle: 'dashed',
  },
  documentButtonText: {
    fontSize: 14,
    color: '#FF6B00',
    fontWeight: '500',
  },
  assignMinersButton: {
    padding: 14,
    backgroundColor: '#FF6B00',
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 8,
  },
  assignMinersButtonText: {
    fontSize: 14,
    color: '#000000',
    fontWeight: '600',
  },
  selectedMinersContainer: {
    marginTop: 12,
    padding: 12,
    backgroundColor: '#1A1A1A',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#FF6B00',
  },
  selectedMinersLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FF6B00',
    marginBottom: 8,
  },
  selectedMinerText: {
    fontSize: 14,
    color: '#FFFFFF',
    marginBottom: 4,
  },
  minerModalContent: {
    backgroundColor: '#1A1A1A',
    borderRadius: 15,
    padding: 20,
    margin: 20,
    maxHeight: '80%',
    borderWidth: 1,
    borderColor: '#FF6B00',
  },
  minerModalSubtitle: {
    fontSize: 14,
    color: '#FFFFFF',
    marginBottom: 20,
    textAlign: 'center',
  },
  minerList: {
    maxHeight: 300,
  },
  minerListItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 15,
    backgroundColor: '#2A2A2A',
    borderRadius: 10,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#333333',
  },
  minerListItemSelected: {
    backgroundColor: '#FF6B00',
    borderColor: '#FF8533',
  },
  minerInfo: {
    flex: 1,
  },
  minerName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  minerPhone: {
    fontSize: 14,
    color: '#E0E0E0',
  },
  minerModalActions: {
    marginTop: 20,
  },
  minerModalDoneButton: {
    backgroundColor: '#FF6B00',
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
  },
  minerModalDoneText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000000',
  },
  roleCategories: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  roleCategoryCard: {
    width: '48%',
    backgroundColor: '#0F0F0F',
    borderRadius: 16,
    padding: 18,
    marginBottom: 16,
    borderWidth: 2,
    alignItems: 'center',
    shadowColor: '#FF6B00',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 6,
  },
  roleCategoryIcon: {
    width: 50,
    height: 50,
    borderRadius: 25,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  roleCategoryIconText: {
    fontSize: 24,
    color: '#000000',
  },
  roleCategoryInfo: {
    alignItems: 'center',
  },
  roleCategoryTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 4,
    textAlign: 'center',
  },
  roleCategoryCount: {
    fontSize: 14,
    color: '#E0E0E0',
    textAlign: 'center',
  },
  roleDetailsModalContent: {
    backgroundColor: '#0F0F0F',
    borderRadius: 20,
    width: '95%',
    maxWidth: 400,
    maxHeight: Dimensions.get('window').height * 0.85,
    borderWidth: 2,
    borderColor: '#0891B2',
    shadowColor: '#0891B2',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 8,
  },
  roleDetailsList: {
    maxHeight: Dimensions.get('window').height * 0.6,
  },
  roleDetailCard: {
    backgroundColor: '#1A1A1A',
    borderRadius: 12,
    padding: 18,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#FF6B00',
    shadowColor: '#FF6B00',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  roleDetailHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  roleDetailName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
    flex: 1,
  },
  roleDetailDeleteButton: {
    backgroundColor: '#DC2626',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  roleDetailDeleteText: {
    fontSize: 12,
    color: '#FFFFFF',
    fontWeight: '600',
  },
  roleDetailInfo: {
    fontSize: 14,
    color: '#E0E0E0',
  },
  emptyRoleText: {
    textAlign: 'center',
    fontSize: 16,
    color: '#E0E0E0',
    marginTop: 20,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
    paddingHorizontal: 24,
    paddingTop: 24,
    paddingBottom: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#059669',
    position: 'relative',
  },
  modalSubtitle: {
    fontSize: 14,
    color: '#E0E0E0',
    flex: 1,
    textAlign: 'center',
  },
  modalCloseButton: {
    position: 'absolute',
    right: 24,
    top: 24,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#7C3AED',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalCloseText: {
    fontSize: 18,
    color: '#000000',
    fontWeight: 'bold',
  },
  listContent: {
    paddingHorizontal: 24,
    paddingBottom: 20,
  },
  userInfoSection: {
    flex: 1,
  },
  roleDetailSubInfo: {
    fontSize: 12,
    color: '#CCCCCC',
    marginTop: 2,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 40,
    paddingHorizontal: 24,
  },
  emptyRoleSubtext: {
    fontSize: 14,
    color: '#CCCCCC',
    marginTop: 8,
    textAlign: 'center',
  },
  userDetailsModalContent: {
    backgroundColor: '#0F0F0F',
    borderRadius: 20,
    width: '95%',
    maxWidth: 400,
    maxHeight: Dimensions.get('window').height * 0.9,
    borderWidth: 2,
    borderColor: '#0891B2',
    shadowColor: '#0891B2',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 8,
  },
  userActions: {
    paddingHorizontal: 24,
    paddingBottom: 16,
  },
  editButton: {
    backgroundColor: '#059669',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 10,
    alignItems: 'center',
  },
  editButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  editActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  saveButton: {
    flex: 1,
    backgroundColor: '#059669',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 10,
    alignItems: 'center',
  },
  saveButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  cancelButton: {
    flex: 1,
    backgroundColor: '#DC2626',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 10,
    alignItems: 'center',
  },
  cancelButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  userDetailsScroll: {
    flex: 1,
  },
  userDetailsForm: {
    paddingHorizontal: 24,
    paddingBottom: 24,
  },
  formSectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFD700',
    marginTop: 20,
    marginBottom: 16,
  },
  readOnlyText: {
    fontSize: 16,
    color: '#FFFFFF',
    paddingVertical: 14,
    paddingHorizontal: 16,
    backgroundColor: '#1A1A1A',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#333333',
  },
});
