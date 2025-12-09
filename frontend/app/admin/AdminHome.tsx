import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Picker } from '@react-native-picker/picker';
import * as DocumentPicker from 'expo-document-picker';
import { useRouter } from 'expo-router';
import { signOut } from 'firebase/auth';
import { collection, deleteDoc, doc, getDocs, query, setDoc, where } from 'firebase/firestore';
import React, { useCallback, useEffect, useState, useMemo } from 'react';
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
import { auth, db } from '../../config/firebase';
import { COLORS } from '../../constants/styles';

// Create Icon alias for MaterialCommunityIcons
const Icon = MaterialCommunityIcons;

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
  specialization?: string;
}

// Form Components with React.memo to prevent unnecessary re-renders
const MinerForm = React.memo(({ formData, setFormData }: { formData: any, setFormData: any }) => (
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
          {formData.trainingCompleted && <Icon name="check" size={16} color="#000000" style={styles.checkboxMark} />}
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
        <View style={{flexDirection: 'row', alignItems: 'center', gap: 8}}>
          <Icon name={formData.healthCheckup ? "check-circle" : "paperclip"} size={18} color="#ffffffff" />
          <Text style={styles.documentButtonText}>
            {formData.healthCheckup ? 'Health Report Uploaded' : 'Upload Health Checkup Report'}
          </Text>
        </View>
      </TouchableOpacity>
    </View>
  </View>
));

const SupervisorForm = React.memo(({ formData, setFormData, minersList, setShowMinerModal }: { formData: any, setFormData: any, minersList: User[], setShowMinerModal: (show: boolean) => void }) => (
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
));

const SafetyOfficerForm = React.memo(({ formData, setFormData }: { formData: any, setFormData: any }) => (
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
        <View style={{flexDirection: 'row', alignItems: 'center', gap: 8}}>
          <Icon name={formData.certifications ? "check-circle" : "paperclip"} size={18} color="#ffffffff" />
          <Text style={styles.documentButtonText}>
            {formData.certifications ? 'Certification Uploaded' : 'Upload Safety Certifications'}
          </Text>
        </View>
      </TouchableOpacity>
    </View>
  </View>
));

const EngineerForm = React.memo(({ formData, setFormData }: { formData: any, setFormData: any }) => (
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
        <View style={{flexDirection: 'row', alignItems: 'center', gap: 8}}>
          <Icon name={formData.qualifications ? "check-circle" : "paperclip"} size={18} color="#ffffffff" />
          <Text style={styles.documentButtonText}>
            {formData.qualifications ? 'Qualifications Uploaded' : 'Upload Engineering Qualifications'}
          </Text>
        </View>
      </TouchableOpacity>
    </View>
  </View>
));

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

  // Supervisor miners modal state
  const [showSupervisorMinersModal, setShowSupervisorMinersModal] = useState(false);
  const [selectedSupervisor, setSelectedSupervisor] = useState<User | null>(null);

  // Miner's supervisor modal state
  const [showMinerSupervisorModal, setShowMinerSupervisorModal] = useState(false);
  const [selectedMinerForSupervisor, setSelectedMinerForSupervisor] = useState<User | null>(null);

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
      color: '#3A3A3A',
      icon: 'pickaxe',
      description: 'Field workers responsible for mining operations and safety compliance'
    },
    {
      value: 'supervisor',
      label: 'Supervisor',
      color: '#4A3B7A',
      icon: 'account-tie',
      description: 'Oversees mining teams, manages operations, and coordinates with management'
    },
    {
      value: 'safety_officer',
      label: 'Safety Officer',
      color: '#5A3B3B',
      icon: 'shield-check',
      description: 'Ensures workplace safety, conducts inspections, and manages compliance'
    },
    {
      value: 'engineer',
      label: 'Engineer',
      color: '#3B5998',
      icon: 'cog',
      description: 'Technical experts handling equipment, systems, and engineering solutions'
    },
  ];

  // Memoize fetch functions to prevent re-creation on every render
  const fetchUsers = useCallback(async () => {
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
  }, []); // Empty dependency array - function never changes

  const fetchMiners = useCallback(async (filterUnassigned = false) => {
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
      Alert.alert('Error', 'Failed to fetch miners. Please try again.');
    }
  }, []); // Empty dependency array - function never changes

  // Call fetch functions once on mount
  useEffect(() => {
    fetchUsers();
    fetchMiners();
    
    // Cleanup to prevent memory leaks
    return () => {
      setUsers([]);
      setMinersList([]);
    };
  }, [fetchUsers, fetchMiners]); // Stable dependencies due to useCallback

  // Dynamic update: Refresh selected supervisor data when users change
  // Use useCallback to prevent re-creating function on every render
  useEffect(() => {
    if (!selectedSupervisor || users.length === 0) return;
    
    const updatedSupervisor = users.find(u => u.id === selectedSupervisor.id);
    if (updatedSupervisor) {
      // Only update if data has actually changed to prevent infinite loops
      const hasChanged = JSON.stringify(updatedSupervisor) !== JSON.stringify(selectedSupervisor);
      if (hasChanged) {
        setSelectedSupervisor(updatedSupervisor);
      }
    } else {
      // Supervisor was deleted, close the modal
      setShowSupervisorMinersModal(false);
      setShowMinerSupervisorModal(false);
      setSelectedSupervisor(null);
    }
  }, [users]); // Only depend on users array, not the supervisor object

  // Dynamic update: Refresh selected miner data when users change
  useEffect(() => {
    if (!selectedMinerForSupervisor || users.length === 0) return;
    
    const updatedMiner = users.find(u => u.id === selectedMinerForSupervisor.id);
    if (updatedMiner) {
      // Only update if data has actually changed to prevent infinite loops
      const hasChanged = JSON.stringify(updatedMiner) !== JSON.stringify(selectedMinerForSupervisor);
      if (hasChanged) {
        setSelectedMinerForSupervisor(updatedMiner);
      }
    } else {
      // Miner was deleted, close the modal
      setShowMinerSupervisorModal(false);
      setSelectedMinerForSupervisor(null);
    }
  }, [users]); // Only depend on users array, not the miner object

  // Dynamic update: Refresh selected user details when users change
  useEffect(() => {
    if (!selectedUserForDetails || users.length === 0) return;
    
    const updatedUser = users.find(u => u.id === selectedUserForDetails.id);
    if (updatedUser) {
      // Only update if data has actually changed to prevent infinite loops
      const hasChanged = JSON.stringify(updatedUser) !== JSON.stringify(selectedUserForDetails);
      if (hasChanged) {
        setSelectedUserForDetails(updatedUser);
        if (isEditingUser) {
          setEditedUserData(updatedUser);
        }
      }
    } else {
      // User (any role) was deleted, close the modal
      setShowUserDetailsModal(false);
      setSelectedUserForDetails(null);
      setIsEditingUser(false);
    }
  }, [users, isEditingUser]); // Only depend on users array and isEditingUser flag

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

      // Refresh all data to ensure dynamic updates for all roles
      await fetchUsers();
      
      // Refresh miners list if miner or supervisor was added (for assignment purposes)
      if (selectedRole === 'miner' || selectedRole === 'supervisor') {
        await fetchMiners();
      }
      
      Alert.alert('Success', `User ${formData.name} added successfully with role: ${selectedRole}`);
      setFormData({});
      setSelectedRole('');
    } catch (error: any) {
      console.error('Error adding user:', error);
      Alert.alert('Error', error.message || 'Failed to add user');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveUserChanges = async () => {
    if (!selectedUserForDetails) return;

    setLoading(true);
    try {
      // Filter out undefined values to prevent Firebase errors
      const cleanedData = Object.fromEntries(
        Object.entries(editedUserData).filter(([_, value]) => value !== undefined)
      );
      
      await setDoc(doc(db, 'users', selectedUserForDetails.id), cleanedData, { merge: true });
      
      // Fetch fresh data from Firebase to ensure everything is in sync for all roles
      await fetchUsers();
      
      // Refresh miners list if miner or supervisor was updated
      if (selectedUserForDetails.role === 'miner' || selectedUserForDetails.role === 'supervisor') {
        await fetchMiners();
      }
      
      setIsEditingUser(false);
      setShowUserDetailsModal(false);
      Alert.alert('Success', 'User details updated successfully');
    } catch (error: any) {
      console.error('Error updating user:', error);
      Alert.alert('Error', 'Failed to update user details');
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
            setLoading(true);
            try {
              // First, check if this is a miner and remove from supervisors' assignedMiners
              const userToDelete = users.find(u => u.id === userId);
              if (userToDelete?.role === 'miner') {
                // Find all supervisors who have this miner assigned
                const supervisorsWithThisMiner = users.filter(
                  supervisor => supervisor.role === 'supervisor' && 
                  supervisor.assignedMiners?.includes(userId)
                );
                
                // Update each supervisor to remove this miner
                for (const supervisor of supervisorsWithThisMiner) {
                  const updatedMiners = supervisor.assignedMiners?.filter(id => id !== userId) || [];
                  await setDoc(doc(db, 'users', supervisor.id), {
                    ...supervisor,
                    assignedMiners: updatedMiners
                  });
                }
              }
              
              // Now delete the user
              await deleteDoc(doc(db, 'users', userId));
              
              // Refresh all data to ensure dynamic updates for all roles
              await fetchUsers();
              
              // Refresh miners list if miner or supervisor was deleted
              if (userToDelete?.role === 'miner' || userToDelete?.role === 'supervisor') {
                await fetchMiners();
              }
              
              // Close any open modals that might be showing the deleted user
              // This applies to all roles: miner, supervisor, safety_officer, engineer
              setShowUserDetailsModal(false);
              setShowRoleDetailsModal(false);
              setShowSupervisorMinersModal(false);
              setShowMinerSupervisorModal(false);
              
              Alert.alert('Success', `${userToDelete?.role || 'User'} deleted successfully`);
            } catch (error: any) {
              console.error('Error deleting user:', error);
              Alert.alert('Error', 'Failed to delete user');
            } finally {
              setLoading(false);
            }
          },
        },
      ]
    );
  };

  const handleSignOut = async () => {
    setLoading(true);
    try {
      await signOut(auth);
      router.replace('/auth/PhoneLogin');
    } catch (error: any) {
      console.error('Error signing out:', error);
      Alert.alert('Error', 'Failed to sign out');
      setLoading(false);
    }
  };

  const getRoleColor = (role: string) => {
    return roles.find((r) => r.value === role)?.color || '#888888';
  };

  const getRoleLabel = (role: string) => {
    return roles.find((r) => r.value === role)?.label || role;
  };

  // Memoize supervisor lookup map for better performance
  const supervisorMap = useMemo(() => {
    const map = new Map<string, User>();
    users.forEach(user => {
      if (user.role === 'supervisor' && user.assignedMiners) {
        user.assignedMiners.forEach(minerId => {
          map.set(minerId, user);
        });
      }
    });
    return map;
  }, [users]);

  const getSupervisorName = useCallback((minerId: string) => {
    return supervisorMap.get(minerId)?.name || null;
  }, [supervisorMap]);

  const getAssignedMinersCount = useCallback((supervisorId: string) => {
    const supervisor = users.find(user => user.id === supervisorId);
    // Filter out deleted miners - only count miners that actually exist
    const validMinersCount = supervisor?.assignedMiners?.filter(
      minerId => users.find(m => m.id === minerId)
    ).length || 0;
    return validMinersCount;
  }, [users]);

  const getSupervisorDetails = useCallback((minerId: string) => {
    return supervisorMap.get(minerId) || null;
  }, [supervisorMap]);

  // Memoize role user counts to prevent recalculation on every render
  const roleUserCounts = useMemo(() => {
    const counts: { [key: string]: number } = {};
    roles.forEach(role => {
      counts[role.value] = users.filter(user => user.role === role.value).length;
    });
    return counts;
  }, [users]);

  // Memoize filtered users for role details modal
  const filteredRoleUsers = useMemo(() => {
    if (!selectedRoleForDetails) return [];
    return users.filter(user => user.role === selectedRoleForDetails);
  }, [users, selectedRoleForDetails]);

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
            <ActivityIndicator size="large" color="#888888" style={styles.loader} />
          ) : (
            <View style={styles.roleCategories}>
              {roles.map((role) => (
                  <TouchableOpacity
                    key={role.value}
                    style={[styles.roleCategoryCard, { backgroundColor: role.color }]}
                    onPress={() => {
                      try {
                        setSelectedRoleForDetails(role.value);
                        setShowRoleDetailsModal(true);
                      } catch (error) {
                        console.error('Error opening role details:', error);
                      }
                    }}
                  >
                    <View style={[styles.roleCategoryIcon, { backgroundColor: role.color }]}>
                      <Icon name={role.icon as any} size={32} color="#FFFFFF" />
                    </View>
                    <View style={styles.roleCategoryInfo}>
                      <Text style={styles.roleCategoryTitle}>{role.label}</Text>
                      <Text style={styles.roleCategoryCount}>{roleUserCounts[role.value] || 0} users</Text>
                    </View>
                  </TouchableOpacity>
                )
              )}
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
              renderItem={({ item: miner }) => {
                const currentData = isEditingUser ? editedUserData : formData;
                const isSelected = currentData.assignedMiners?.includes(miner.id);
                return (
                  <TouchableOpacity
                    style={[
                      styles.minerListItem,
                      isSelected && styles.minerListItemSelected
                    ]}
                    onPress={() => {
                      const assigned = currentData.assignedMiners || [];
                      const updated = assigned.includes(miner.id)
                        ? assigned.filter((id: string) => id !== miner.id)
                        : [...assigned, miner.id];
                      if (isEditingUser) {
                        setEditedUserData({ ...editedUserData, assignedMiners: updated });
                      } else {
                        setFormData({ ...formData, assignedMiners: updated });
                      }
                    }}
                  >
                    <View style={styles.minerInfo}>
                      <Text style={styles.minerName}>{miner.name}</Text>
                      <Text style={styles.minerPhone}>{miner.phoneNumber}</Text>
                    </View>
                    <View style={[
                      styles.checkbox,
                      isSelected && styles.checkboxChecked
                    ]}>
                      {isSelected && <Icon name="check" size={16} color="#000000" style={styles.checkboxMark} />}
                    </View>
                  </TouchableOpacity>
                );
              }}
              style={styles.minerList}
              showsVerticalScrollIndicator={false}
              maxToRenderPerBatch={10}
              initialNumToRender={10}
              windowSize={5}
              removeClippedSubviews={true}
            />

            <View style={styles.minerModalActions}>
              <TouchableOpacity
                style={styles.minerModalDoneButton}
                onPress={() => setShowMinerModal(false)}
              >
                <Text style={styles.minerModalDoneText}>
                  Done ({(isEditingUser ? editedUserData.assignedMiners?.length : formData.assignedMiners?.length) || 0} selected)
                </Text>
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
                onPress={() => {
                  setShowRoleDetailsModal(false);
                  setSelectedRoleForDetails('');
                }}
              >
                <Icon name="close" size={20} color="#FFFFFF" />
              </TouchableOpacity>
            </View>

            {/* User List */}
            <FlatList
              data={filteredRoleUsers}
              keyExtractor={(item) => item.id}
              style={styles.roleDetailsList}
              showsVerticalScrollIndicator={false}
              contentContainerStyle={styles.listContent}
              initialNumToRender={10}
              maxToRenderPerBatch={10}
              windowSize={5}
              removeClippedSubviews={true}
              renderItem={({ item: user }) => (
                <View style={styles.roleDetailCard}>
                  {selectedRoleForDetails === 'miner' && (
                    <View style={styles.minerCardWrapper}>
                      <View style={styles.minerCardContent}>
                        <View style={styles.minerInfoLeft}>
                          <Text style={styles.roleDetailName}>{user.name || 'Unnamed Miner'}</Text>
                          <Text style={styles.roleDetailPhone}>{user.phoneNumber || 'No phone'}</Text>
                          <Text style={styles.roleDetailSupervisor}>
                            Supervisor: {getSupervisorName(user.id) || 'Unassigned'}
                          </Text>
                        </View>
                        <View style={styles.minerActionButtons}>
                          <TouchableOpacity
                            style={styles.editButtonMiner}
                            onPress={() => {
                              console.log('Edit button clicked for miner:', user.name);
                              setSelectedUserForDetails(user);
                              setEditedUserData({...user});
                              setIsEditingUser(true);
                              setShowRoleDetailsModal(false);
                              setTimeout(() => {
                                setShowUserDetailsModal(true);
                              }, 100);
                            }}
                            activeOpacity={0.7}
                          >
                            <Text style={styles.editButtonTextMiner}>EDIT</Text>
                          </TouchableOpacity>
                          <TouchableOpacity
                            style={styles.deleteButtonMiner}
                            onPress={() => {
                              handleDeleteUser(user.id, user.name || user.phoneNumber || 'Unknown');
                            }}
                            activeOpacity={0.7}
                          >
                            <Text style={styles.deleteButtonTextMiner}>DELETE</Text>
                          </TouchableOpacity>
                        </View>
                      </View>
                    </View>
                  )}

                  {selectedRoleForDetails === 'supervisor' && (
                    <View style={styles.supervisorCardWrapper}>
                      <View style={styles.minerCardContent}>
                        <View style={styles.minerInfoLeft}>
                          <Text style={styles.roleDetailName}>{user.name || 'Unnamed Supervisor'}</Text>
                          <Text style={styles.roleDetailPhone}>{user.phoneNumber || 'No phone'}</Text>
                          <Text style={styles.roleDetailSupervisor}>
                            Assigned Miners: {getAssignedMinersCount(user.id)}
                          </Text>
                        </View>
                        <View style={styles.minerActionButtons}>
                          <TouchableOpacity
                            style={styles.editButtonMiner}
                            onPress={() => {
                              console.log('Edit button clicked for supervisor:', user.name);
                              setSelectedUserForDetails(user);
                              setEditedUserData({...user});
                              setIsEditingUser(true);
                              setShowRoleDetailsModal(false);
                              setTimeout(() => {
                                setShowUserDetailsModal(true);
                              }, 100);
                            }}
                            activeOpacity={0.7}
                          >
                            <Text style={styles.editButtonTextMiner}>EDIT</Text>
                          </TouchableOpacity>
                          <TouchableOpacity
                            style={styles.deleteButtonMiner}
                            onPress={() => {
                              handleDeleteUser(user.id, user.name || user.phoneNumber || 'Unknown');
                            }}
                            activeOpacity={0.7}
                          >
                            <Text style={styles.deleteButtonTextMiner}>DELETE</Text>
                          </TouchableOpacity>
                        </View>
                      </View>
                    </View>
                  )}

                  {(selectedRoleForDetails === 'safety_officer' || selectedRoleForDetails === 'engineer') && (
                    <View style={styles.minerCardWrapper}>
                      <View style={styles.minerCardContent}>
                        <View style={styles.minerInfoLeft}>
                          <Text style={styles.roleDetailName}>{user.name || `Unnamed ${getRoleLabel(selectedRoleForDetails)}`}</Text>
                          <Text style={styles.roleDetailPhone}>{user.phoneNumber || 'No phone'}</Text>
                          <Text style={styles.roleDetailSupervisor}>
                            {user.department || 'No department'}
                          </Text>
                        </View>
                        <View style={styles.minerActionButtons}>
                          <TouchableOpacity
                            style={styles.editButtonMiner}
                            onPress={() => {
                              console.log('Edit button clicked for:', user.role, user.name);
                              setSelectedUserForDetails(user);
                              setEditedUserData({...user});
                              setIsEditingUser(true);
                              setShowRoleDetailsModal(false);
                              setTimeout(() => {
                                setShowUserDetailsModal(true);
                              }, 100);
                            }}
                            activeOpacity={0.7}
                          >
                            <Text style={styles.editButtonTextMiner}>EDIT</Text>
                          </TouchableOpacity>
                          <TouchableOpacity
                            style={styles.deleteButtonMiner}
                            onPress={() => {
                              handleDeleteUser(user.id, user.name || user.phoneNumber || 'Unknown');
                            }}
                            activeOpacity={0.7}
                          >
                            <Text style={styles.deleteButtonTextMiner}>DELETE</Text>
                          </TouchableOpacity>
                        </View>
                      </View>
                    </View>
                  )}
                </View>
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
        animationType="fade"
        onRequestClose={() => {
          setShowUserDetailsModal(false);
          setIsEditingUser(false);
          setSelectedUserForDetails(null);
        }}
        statusBarTranslucent
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
                  setSelectedUserForDetails(null);
                  setEditedUserData({});
                }}
              >
                <Icon name="close" size={24} color="#FFFFFF" />
              </TouchableOpacity>
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
                            {editedUserData.trainingCompleted && <Icon name="check" size={16} color="#000000" style={styles.checkboxMark} />}
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

                    <View style={styles.inputGroup}>
                      <Text style={styles.label}>Health Checkup Report</Text>
                      {isEditingUser ? (
                        <TouchableOpacity
                          style={styles.documentButton}
                          onPress={async () => {
                            try {
                              const result = await DocumentPicker.getDocumentAsync({
                                type: ['application/pdf', 'image/*'],
                                copyToCacheDirectory: true,
                              });
                              if (result.assets && result.assets.length > 0) {
                                setEditedUserData({ ...editedUserData, healthCheckup: result.assets[0] });
                              }
                            } catch (error) {
                              console.error('Document picker error:', error);
                            }
                          }}
                        >
                          <View style={{flexDirection: 'row', alignItems: 'center', gap: 8}}>
                            <Icon name={editedUserData.healthCheckup ? "check-circle" : "paperclip"} size={18} color="rgba(255, 255, 255, 1)" />
                            <Text style={styles.documentButtonText}>
                              {editedUserData.healthCheckup ? 'Health Report Uploaded' : 'Upload Health Checkup Report'}
                            </Text>
                          </View>
                        </TouchableOpacity>
                      ) : (
                        <Text style={styles.readOnlyText}>{selectedUserForDetails?.healthCheckup ? 'Uploaded' : 'Not provided'}</Text>
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

                    <View style={styles.inputGroup}>
                      <Text style={styles.label}>Assigned Miners</Text>
                      {isEditingUser ? (
                        <>
                          <Text style={styles.helperText}>Select miners to assign to this supervisor</Text>
                          <TouchableOpacity
                            style={styles.assignMinersButton}
                            onPress={() => {
                              fetchMiners(true);
                              setShowMinerModal(true);
                            }}
                          >
                            <Text style={styles.assignMinersButtonText}>
                              Select Miners ({editedUserData.assignedMiners?.length || 0} selected)
                            </Text>
                          </TouchableOpacity>
                          {editedUserData.assignedMiners && editedUserData.assignedMiners.length > 0 && (
                            <View style={styles.selectedMinersContainer}>
                              <Text style={styles.selectedMinersLabel}>Selected Miners:</Text>
                              {editedUserData.assignedMiners.map((minerId: string) => {
                                const miner = users.find(m => m.id === minerId);
                                return miner ? (
                                  <Text key={minerId} style={styles.selectedMinerText}>• {miner.name}</Text>
                                ) : null;
                              })}
                            </View>
                          )}
                        </>
                      ) : (
                        <>
                          <Text style={styles.readOnlyText}>
                            {selectedUserForDetails?.assignedMiners?.length || 0} miners assigned
                          </Text>
                          {selectedUserForDetails?.assignedMiners && selectedUserForDetails.assignedMiners.length > 0 && (
                            <View style={styles.selectedMinersContainer}>
                              {selectedUserForDetails.assignedMiners.map((minerId: string) => {
                                const miner = users.find(m => m.id === minerId);
                                return miner ? (
                                  <Text key={minerId} style={styles.selectedMinerText}>• {miner.name}</Text>
                                ) : null;
                              })}
                            </View>
                          )}
                        </>
                      )}
                    </View>
                  </>
                )}

                {selectedUserForDetails?.role === 'safety_officer' && (
                  <>
                    <Text style={styles.formSectionTitle}>Safety Officer Details</Text>

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
                            <Picker.Item label="Safety & Compliance" value="safety_compliance" />
                            <Picker.Item label="Risk Assessment" value="risk_assessment" />
                            <Picker.Item label="Training" value="training" />
                            <Picker.Item label="Audit" value="audit" />
                          </Picker>
                        </View>
                      ) : (
                        <Text style={styles.readOnlyText}>{selectedUserForDetails?.department || 'Not provided'}</Text>
                      )}
                    </View>

                    <View style={styles.inputGroup}>
                      <Text style={styles.label}>Experience (years)</Text>
                      {isEditingUser ? (
                        <TextInput
                          style={styles.input}
                          value={editedUserData.experience?.toString() || ''}
                          onChangeText={(text) => setEditedUserData({ ...editedUserData, experience: parseInt(text) || '' })}
                          placeholder="Years of safety experience"
                          keyboardType="numeric"
                          placeholderTextColor="#CCCCCC"
                        />
                      ) : (
                        <Text style={styles.readOnlyText}>{selectedUserForDetails?.experience || 'Not provided'}</Text>
                      )}
                    </View>

                    <View style={styles.inputGroup}>
                      <Text style={styles.label}>Certifications</Text>
                      {isEditingUser ? (
                        <TouchableOpacity
                          style={styles.documentButton}
                          onPress={async () => {
                            try {
                              const result = await DocumentPicker.getDocumentAsync({
                                type: ['application/pdf', 'image/*'],
                                copyToCacheDirectory: true,
                              });
                              if (result.assets && result.assets.length > 0) {
                                setEditedUserData({ ...editedUserData, certifications: result.assets[0] });
                              }
                            } catch (error) {
                              console.error('Document picker error:', error);
                            }
                          }}
                        >
                          <View style={{flexDirection: 'row', alignItems: 'center', gap: 8}}>
                            <Icon name={editedUserData.certifications ? "check-circle" : "paperclip"} size={18} color="#ffffffff" />
                            <Text style={styles.documentButtonText}>
                              {editedUserData.certifications ? 'Certification Uploaded' : 'Upload Safety Certifications'}
                            </Text>
                          </View>
                        </TouchableOpacity>
                      ) : (
                        <Text style={styles.readOnlyText}>{selectedUserForDetails?.certifications ? 'Uploaded' : 'Not provided'}</Text>
                      )}
                    </View>
                  </>
                )}

                {selectedUserForDetails?.role === 'engineer' && (
                  <>
                    <Text style={styles.formSectionTitle}>Engineer Details</Text>

                    <View style={styles.inputGroup}>
                      <Text style={styles.label}>Specialization</Text>
                      {isEditingUser ? (
                        <View style={styles.pickerContainer}>
                          <Picker
                            selectedValue={editedUserData.specialization || ''}
                            onValueChange={(value) => setEditedUserData({ ...editedUserData, specialization: value })}
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
                      ) : (
                        <Text style={styles.readOnlyText}>{selectedUserForDetails?.specialization || 'Not provided'}</Text>
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
                            <Picker.Item label="Engineering" value="engineering" />
                            <Picker.Item label="R&D" value="research_development" />
                            <Picker.Item label="Operations" value="operations" />
                            <Picker.Item label="Maintenance" value="maintenance" />
                          </Picker>
                        </View>
                      ) : (
                        <Text style={styles.readOnlyText}>{selectedUserForDetails?.department || 'Not provided'}</Text>
                      )}
                    </View>

                    <View style={styles.inputGroup}>
                      <Text style={styles.label}>Experience (years)</Text>
                      {isEditingUser ? (
                        <TextInput
                          style={styles.input}
                          value={editedUserData.experience?.toString() || ''}
                          onChangeText={(text) => setEditedUserData({ ...editedUserData, experience: parseInt(text) || '' })}
                          placeholder="Years of engineering experience"
                          keyboardType="numeric"
                          placeholderTextColor="#CCCCCC"
                        />
                      ) : (
                        <Text style={styles.readOnlyText}>{selectedUserForDetails?.experience || 'Not provided'}</Text>
                      )}
                    </View>

                    <View style={styles.inputGroup}>
                      <Text style={styles.label}>Qualifications</Text>
                      {isEditingUser ? (
                        <TouchableOpacity
                          style={styles.documentButton}
                          onPress={async () => {
                            try {
                              const result = await DocumentPicker.getDocumentAsync({
                                type: ['application/pdf', 'image/*'],
                                copyToCacheDirectory: true,
                              });
                              if (result.assets && result.assets.length > 0) {
                                setEditedUserData({ ...editedUserData, qualifications: result.assets[0] });
                              }
                            } catch (error) {
                              console.error('Document picker error:', error);
                            }
                          }}
                        >
                          <View style={{flexDirection: 'row', alignItems: 'center', gap: 8}}>
                            <Icon name={editedUserData.qualifications ? "check-circle" : "paperclip"} size={18} color="#ffffffff" />
                            <Text style={styles.documentButtonText}>
                              {editedUserData.qualifications ? 'Qualifications Uploaded' : 'Upload Engineering Qualifications'}
                            </Text>
                          </View>
                        </TouchableOpacity>
                      ) : (
                        <Text style={styles.readOnlyText}>{selectedUserForDetails?.qualifications ? 'Uploaded' : 'Not provided'}</Text>
                      )}
                    </View>
                  </>
                )}

                {/* Action Buttons at the End */}
                {isEditingUser && (
                  <View style={styles.bottomActions}>
                    <TouchableOpacity
                      style={styles.saveButton}
                      onPress={handleSaveUserChanges}
                    >
                      <View style={{flexDirection: 'row', alignItems: 'center', gap: 8}}>
                        <Icon name="content-save" size={18} color="#000000" />
                        <Text style={styles.saveButtonText}>Save Changes</Text>
                      </View>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.cancelButton}
                      onPress={() => {
                        setShowUserDetailsModal(false);
                        setIsEditingUser(false);
                        setSelectedUserForDetails(null);
                        setEditedUserData({});
                      }}
                    >
                      <View style={{flexDirection: 'row', alignItems: 'center', gap: 8}}>
                        <Icon name="close" size={18} color="#888888" />
                        <Text style={styles.cancelButtonText}>Cancel</Text>
                      </View>
                    </TouchableOpacity>
                  </View>
                )}
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Supervisor Miners Modal */}
      <Modal
        visible={showSupervisorMinersModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => {
          setShowSupervisorMinersModal(false);
          setSelectedSupervisor(null);
        }}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.supervisorMinersModalContent}>
            {/* Modal Header */}
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                {selectedSupervisor?.name || 'Supervisor'}'s Miners
              </Text>
              <TouchableOpacity
                style={styles.modalCloseButton}
                onPress={() => {
                  setShowSupervisorMinersModal(false);
                  setSelectedSupervisor(null);
                }}
              >
                <Icon name="close" size={24} color="#FFFFFF" />
              </TouchableOpacity>
            </View>

            <View style={styles.supervisorInfoBanner}>
              <View style={styles.supervisorInfoItem}>
                <Text style={styles.supervisorInfoLabel}>Contact</Text>
                <Text style={styles.supervisorInfoValue}>{selectedSupervisor?.phoneNumber || 'N/A'}</Text>
              </View>
              <View style={styles.supervisorInfoItem}>
                <Text style={styles.supervisorInfoLabel}>Total Miners</Text>
                <Text style={styles.supervisorInfoValue}>
                  {(() => {
                    const validCount = selectedSupervisor?.assignedMiners?.filter(
                      minerId => users.find(m => m.id === minerId)
                    ).length || 0;
                    return validCount;
                  })()}
                </Text>
              </View>
            </View>

            {/* Miners List */}
            <ScrollView 
              style={styles.supervisorMinersList} 
              contentContainerStyle={styles.minersListContent}
              showsVerticalScrollIndicator={false}
            >
              {(() => {
                // Filter out deleted miners (miners not found in users list)
                const validMiners = selectedSupervisor?.assignedMiners
                  ?.map(minerId => users.find(m => m.id === minerId))
                  .filter(miner => miner !== undefined) || [];

                if (validMiners.length === 0) {
                  return (
                    <View style={styles.emptyState}>
                      <Text style={styles.emptyRoleText}>No miners assigned</Text>
                      <Text style={styles.emptyRoleSubtext}>This supervisor has no assigned miners yet</Text>
                    </View>
                  );
                }

                return validMiners.map((miner, index) => (
                  <View key={miner.id} style={styles.professionalMinerCard}>
                    {/* Card Header */}
                    <View style={styles.professionalMinerHeader}>
                      <View style={styles.minerNumberBadge}>
                        <Text style={styles.minerNumberText}>{index + 1}</Text>
                      </View>
                      <View style={styles.minerHeaderInfo}>
                        <Text style={styles.professionalMinerName}>{miner.name || 'Unknown Miner'}</Text>
                        <Text style={styles.professionalMinerPhone}>{miner.phoneNumber || 'No contact'}</Text>
                      </View>
                    </View>

                    {/* Card Body - Grid Layout */}
                    <View style={styles.minerInfoGrid}>
                      <View style={styles.minerInfoItem}>
                        <Text style={styles.minerInfoLabel}>Department</Text>
                        <Text style={styles.minerInfoValue}>
                          {miner.department ? 
                            (miner.department === 'mining_ops' ? 'Mining Operations' :
                             miner.department === 'blasting' ? 'Blasting' :
                             miner.department === 'maintenance' ? 'Maintenance' :
                             miner.department === 'safety' ? 'Safety' : miner.department) 
                            : 'Not assigned'}
                        </Text>
                      </View>

                      <View style={styles.minerInfoItem}>
                        <Text style={styles.minerInfoLabel}>Shift</Text>
                        <Text style={styles.minerInfoValue}>
                          {miner.shift ? 
                            (miner.shift === 'day' ? 'Day (6AM-6PM)' : 
                             miner.shift === 'night' ? 'Night (6PM-6AM)' : 
                             miner.shift === 'rotating' ? 'Rotating' : miner.shift)
                            : 'Not assigned'}
                        </Text>
                      </View>

                      <View style={styles.minerInfoItem}>
                        <Text style={styles.minerInfoLabel}>Age</Text>
                        <Text style={styles.minerInfoValue}>{miner.age || 'N/A'}</Text>
                      </View>

                      <View style={styles.minerInfoItem}>
                        <Text style={styles.minerInfoLabel}>Experience</Text>
                        <Text style={styles.minerInfoValue}>
                          {miner.experience !== undefined ? `${miner.experience} yrs` : 'N/A'}
                        </Text>
                      </View>
                    </View>

                    {/* Training Status */}
                    <View style={styles.minerTrainingStatus}>
                      <View style={[
                        styles.trainingBadge,
                        miner.trainingCompleted ? styles.trainingCompleted : styles.trainingPending
                      ]}>
                        <Text style={[
                          styles.trainingBadgeText,
                          miner.trainingCompleted ? styles.trainingCompletedText : styles.trainingPendingText
                        ]}>
                          {miner.trainingCompleted ? 'Training Completed' : 'Training Pending'}
                        </Text>
                      </View>
                    </View>

                    {/* Address if available */}
                    {miner.address && (
                      <View style={styles.minerAddressSection}>
                        <Text style={styles.minerAddressLabel}>Address</Text>
                        <Text style={styles.minerAddressText}>{miner.address}</Text>
                      </View>
                    )}
                  </View>
                ));
              })()}
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Miner's Supervisor Modal */}
      <Modal
        visible={showMinerSupervisorModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => {
          setShowMinerSupervisorModal(false);
          setSelectedSupervisor(null);
          setSelectedMinerForSupervisor(null);
        }}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.supervisorDetailsModalContent}>
            {/* Modal Header */}
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                Supervisor Details
              </Text>
              <TouchableOpacity
                style={styles.modalCloseButton}
                onPress={() => {
                  setShowMinerSupervisorModal(false);
                  setSelectedSupervisor(null);
                  setSelectedMinerForSupervisor(null);
                }}
              >
                <Icon name="close" size={24} color="#FFFFFF" />
              </TouchableOpacity>
            </View>

            {/* Miner Info Banner */}
            <View style={styles.minerInfoBanner}>
              <View style={{flexDirection: 'row', alignItems: 'center', gap: 8}}>
                <Icon name="account-hard-hat" size={16} color="#FFFFFF" />
                <Text style={styles.minerInfoTitle}>Viewing supervisor for:</Text>
              </View>
              <Text style={styles.minerInfoName}>{selectedMinerForSupervisor?.name || 'Unknown Miner'}</Text>
            </View>

            {/* Supervisor Details */}
            <ScrollView 
              style={styles.supervisorDetailsScroll} 
              contentContainerStyle={styles.supervisorDetailsContent}
              showsVerticalScrollIndicator={false}
            >
              {selectedSupervisor ? (
                <View style={styles.supervisorDetailsCard}>
                  {/* Supervisor Header */}
                  <View style={styles.supervisorDetailsHeader}>
                    <View style={styles.supervisorIconContainer}>
                      <Icon name="account-tie" size={32} color="#BBBBBB" />
                    </View>
                    <View style={styles.supervisorHeaderInfo}>
                      <Text style={styles.supervisorDetailsName}>{selectedSupervisor.name || 'Unnamed Supervisor'}</Text>
                      <Text style={styles.supervisorDetailsRole}>Supervisor</Text>
                    </View>
                  </View>

                  {/* Contact Information Section */}
                  <View style={styles.detailsSection}>
                    <View style={{flexDirection: 'row', alignItems: 'center', gap: 8}}>
                      <Icon name="phone" size={16} color="#BBBBBB" />
                      <Text style={styles.detailsSectionTitle}>Contact Information</Text>
                    </View>
                    <View style={styles.detailsRow}>
                      <Text style={styles.detailsLabel}>Phone Number:</Text>
                      <Text style={styles.detailsValue}>{selectedSupervisor.phoneNumber || 'Not provided'}</Text>
                    </View>
                    {selectedSupervisor.email && (
                      <View style={styles.detailsRow}>
                        <Text style={styles.detailsLabel}>Email:</Text>
                        <Text style={styles.detailsValue}>{selectedSupervisor.email}</Text>
                      </View>
                    )}
                  </View>

                  {/* Work Information Section */}
                  <View style={styles.detailsSection}>
                    <View style={{flexDirection: 'row', alignItems: 'center', gap: 8}}>
                      <Icon name="briefcase" size={16} color="#BBBBBB" />
                      <Text style={styles.detailsSectionTitle}>Work Information</Text>
                    </View>
                    {selectedSupervisor.empId && (
                      <View style={styles.detailsRow}>
                        <Text style={styles.detailsLabel}>Employee ID:</Text>
                        <Text style={styles.detailsValue}>{selectedSupervisor.empId}</Text>
                      </View>
                    )}
                    {selectedSupervisor.department && (
                      <View style={styles.detailsRow}>
                        <Text style={styles.detailsLabel}>Department:</Text>
                        <Text style={styles.detailsValue}>
                          {selectedSupervisor.department === 'mining_ops' ? 'Mining Operations' :
                           selectedSupervisor.department === 'blasting' ? 'Blasting' :
                           selectedSupervisor.department === 'maintenance' ? 'Equipment Maintenance' :
                           selectedSupervisor.department === 'safety' ? 'Safety' : selectedSupervisor.department}
                        </Text>
                      </View>
                    )}
                    {selectedSupervisor.shift && (
                      <View style={styles.detailsRow}>
                        <Text style={styles.detailsLabel}>Shift:</Text>
                        <Text style={styles.detailsValue}>
                          {selectedSupervisor.shift === 'day' ? 'Day Shift (6AM-6PM)' :
                           selectedSupervisor.shift === 'night' ? 'Night Shift (6PM-6AM)' :
                           selectedSupervisor.shift === 'rotating' ? 'Rotating Shift' : selectedSupervisor.shift}
                        </Text>
                      </View>
                    )}
                    {selectedSupervisor.experience !== undefined && (
                      <View style={styles.detailsRow}>
                        <Text style={styles.detailsLabel}>Experience:</Text>
                        <Text style={styles.detailsValue}>{selectedSupervisor.experience} years</Text>
                      </View>
                    )}
                  </View>

                  {/* Team Information Section */}
                  <View style={styles.detailsSection}>
                    <View style={{flexDirection: 'row', alignItems: 'center', gap: 8}}>
                      <Icon name="account-group" size={16} color="#BBBBBB" />
                      <Text style={styles.detailsSectionTitle}>Team Information</Text>
                    </View>
                    <View style={styles.detailsRow}>
                      <Text style={styles.detailsLabel}>Total Assigned Miners:</Text>
                      <Text style={[styles.detailsValue, styles.highlightValue]}>
                        {selectedSupervisor.assignedMiners?.length || 0}
                      </Text>
                    </View>
                    {selectedSupervisor.teamSize && (
                      <View style={styles.detailsRow}>
                        <Text style={styles.detailsLabel}>Team Size:</Text>
                        <Text style={styles.detailsValue}>{selectedSupervisor.teamSize}</Text>
                      </View>
                    )}
                  </View>

                  {/* Personal Information Section */}
                  {(selectedSupervisor.age || selectedSupervisor.address) && (
                    <View style={styles.detailsSection}>
                      <View style={{flexDirection: 'row', alignItems: 'center', gap: 8}}>
                        <Icon name="account" size={16} color="#BBBBBB" />
                        <Text style={styles.detailsSectionTitle}>Personal Information</Text>
                      </View>
                      {selectedSupervisor.age && (
                        <View style={styles.detailsRow}>
                          <Text style={styles.detailsLabel}>Age:</Text>
                          <Text style={styles.detailsValue}>{selectedSupervisor.age} years</Text>
                        </View>
                      )}
                      {selectedSupervisor.address && (
                        <View style={styles.detailsRow}>
                          <Text style={styles.detailsLabel}>Address:</Text>
                          <Text style={styles.detailsValue}>{selectedSupervisor.address}</Text>
                        </View>
                      )}
                    </View>
                  )}

                  {/* View All Miners Button */}
                  <TouchableOpacity
                    style={styles.viewAllMinersButton}
                    onPress={() => {
                      setShowMinerSupervisorModal(false);
                      requestAnimationFrame(() => {
                        setShowSupervisorMinersModal(true);
                      });
                    }}
                  >
                    <View style={{flexDirection: 'row', alignItems: 'center', gap: 8}}>
                      <Icon name="account-group" size={16} color="#000000" />
                      <Text style={styles.viewAllMinersButtonText}>
                        View All {selectedSupervisor.assignedMiners?.length || 0} Assigned Miners
                      </Text>
                    </View>
                  </TouchableOpacity>
                </View>
              ) : (
                <View style={styles.emptyState}>
                  <Text style={styles.emptyRoleText}>No supervisor found</Text>
                  <Text style={styles.emptyRoleSubtext}>This miner is not assigned to any supervisor</Text>
                </View>
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Loading Overlay */}
      {loading && (
        <View style={styles.loadingOverlay}>
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#888888" />
            <Text style={styles.loadingText}>Processing...</Text>
          </View>
        </View>
      )}
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
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#000000',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
    shadowColor: '#000000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#FFFFFF',
    letterSpacing: 1,
  },
  signOutButton: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    backgroundColor: '#2A1A1A',
    borderRadius: 8,
    borderWidth: 0,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
  },
  signOutText: {
    color: '#FF6B6B',
    fontWeight: '700',
    fontSize: 13,
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  content: {
    flex: 1,
  },
  section: {
    margin: 16,
    padding: 20,
    backgroundColor: '#0A0A0A',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    shadowColor: '#000000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 16,
    letterSpacing: 0.5,
  },
  refreshButton: {
    padding: 10,
    backgroundColor: 'transparent',
    borderRadius: 10,
    borderWidth: 0,
  },
  refreshIcon: {
    fontSize: 26,
    color: '#888888',
    fontWeight: 'bold',
  },
  inputGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#BBBBBB',
    marginBottom: 8,
    letterSpacing: 0.3,
  },
  input: {
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 12,
    padding: 14,
    fontSize: 16,
    color: '#FFFFFF',
    backgroundColor: '#000000',
    shadowColor: '#000000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 2,
  },
  roleGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  roleButton: {
    paddingHorizontal: 18,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    backgroundColor: '#000000',
  },
  roleButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#BBBBBB',
  },
  roleButtonTextActive: {
    color: '#000000',
  },
  addButton: {
    backgroundColor: '#6B9BD1',
    padding: 16,
    borderRadius: 14,
    alignItems: 'center',
    marginTop: 12,
    shadowColor: '#6B9BD1',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 5,
  },
  addButtonDisabled: {
    opacity: 0.5,
    shadowOpacity: 0.2,
  },
  addButtonText: {
    color: '#000000',
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 0.5,
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
    borderColor: 'rgba(255, 255, 255, 0.15)',
    marginBottom: 8,
    shadowColor: '#000000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.2,
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
    color: '#888888',
    fontSize: 14,
    paddingVertical: 20,
  },
  // Role selector styles
  roleSelectorButton: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#000000',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    marginBottom: 16,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
  },
  roleSelectorText: {
    fontSize: 16,
    color: '#FFFFFF',
    flex: 1,
    fontWeight: '600',
  },
  roleSelectorArrow: {
    fontSize: 18,
    color: '#FF6B00',
    fontWeight: 'bold',
  },
  formContainer: {
    marginTop: 16,
  },
  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 20,
  },
  modalContent: {
    backgroundColor: '#000000',
    borderRadius: 20,
    padding: 24,
    width: '90%',
    maxWidth: 400,
    shadowColor: '#000000',
    shadowOffset: {
      width: 0,
      height: 6,
    },
    shadowOpacity: 0.6,
    shadowRadius: 12,
    elevation: 10,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 20,
    flex: 1,
    letterSpacing: 0.5,
  },
  modalRoleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    marginBottom: 12,
    backgroundColor: '#2A2A2A',
    borderRadius: 12,
    borderWidth: 0,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
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
    color: '#999999',
  },
  modalCancelButton: {
    padding: 16,
    backgroundColor: '#1A1A1A',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
    alignItems: 'center',
  },
  modalCancelText: {
    fontSize: 16,
    color: '#BBBBBB',
    fontWeight: '700',
  },
  // Simple role button styles
  simpleRoleButton: {
    padding: 16,
    backgroundColor: '#2A2A2A',
    borderRadius: 12,
    borderWidth: 0,
    alignItems: 'center',
    marginBottom: 12,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
  },
  simpleRoleText: {
    fontSize: 16,
    color: '#FFFFFF',
    fontWeight: '600',
    letterSpacing: 0.5,
  },
  // Additional Form styles
  pickerContainer: {
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 12,
    backgroundColor: '#000000',
    shadowColor: '#000000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 2,
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
    width: 24,
    height: 24,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
    borderRadius: 8,
    marginRight: 10,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#000000',
  },
  checkboxChecked: {
    backgroundColor: '#6B9BD1',
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
    backgroundColor: '#000000',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
  },
  documentButtonText: {
    fontSize: 14,
    color: '#ffffffff',
    fontWeight: '600',
  },
  assignMinersButton: {
    padding: 14,
    backgroundColor: '#FF6B00',
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 8,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.4,
    shadowRadius: 4,
    elevation: 3,
  },
  assignMinersButtonText: {
    fontSize: 14,
    color: '#000000',
    fontWeight: '700',
  },
  selectedMinersContainer: {
    marginTop: 12,
    padding: 12,
    backgroundColor: '#000000',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
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
    backgroundColor: '#000000',
    borderRadius: 20,
    padding: 20,
    margin: 20,
    maxHeight: '80%',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.6,
    shadowRadius: 12,
    elevation: 10,
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
    backgroundColor: '#0A0A0A',
    borderRadius: 12,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  minerListItemSelected: {
    backgroundColor: '#FF6B00',
    borderColor: '#FF6B00',
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
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.5,
    shadowRadius: 6,
    elevation: 5,
  },
  minerModalDoneText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#000000',
    letterSpacing: 0.3,
  },
  roleCategories: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  roleCategoryCard: {
    width: '48%',
    backgroundColor: '#0A0A0A',
    borderRadius: 20,
    padding: 24,
    marginBottom: 16,
    borderWidth: 0,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 120,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  roleCategoryIcon: {
    width: 60,
    height: 60,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
    backgroundColor: '#FF6B00',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.4,
    shadowRadius: 4,
    elevation: 4,
  },
  roleCategoryIconText: {
    fontSize: 28,
  },
  roleCategoryInfo: {
    alignItems: 'center',
  },
  roleCategoryTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#A0A0A0',
    marginBottom: 8,
    textAlign: 'center',
    letterSpacing: 0.3,
  },
  roleCategoryCount: {
    fontSize: 15,
    color: '#999999',
    textAlign: 'center',
    fontWeight: '500',
  },
  roleDetailsModalContent: {
    backgroundColor: '#000000',
    borderRadius: 20,
    width: '95%',
    maxWidth: 400,
    maxHeight: Dimensions.get('window').height * 0.85,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.5,
    shadowRadius: 12,
    elevation: 10,
  },
  roleDetailsList: {
    maxHeight: Dimensions.get('window').height * 0.6,
  },
  roleDetailCard: {
    backgroundColor: '#2A2A2A',
    borderRadius: 12,
    padding: 18,
    marginBottom: 12,
    borderWidth: 0,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
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
    backgroundColor: '#FF6B00',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  roleDetailDeleteText: {
    fontSize: 14,
    color: '#000000',
    fontWeight: '700',
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
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
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
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#FF6B6B',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#FF6B6B',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.4,
    shadowRadius: 4,
    elevation: 4,
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
  supervisorCardWrapper: {
    position: 'relative',
  },
  supervisorClickableArea: {
    flex: 1,
  },
  clickToViewMiners: {
    fontSize: 12,
    color: '#0891B2',
    fontStyle: 'italic',
    marginTop: 8,
  },
  roleDetailDeleteButtonAbsolute: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: '#FF6B00',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    zIndex: 10,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
    elevation: 3,
  },
  cardActionButtons: {
    position: 'absolute',
    top: 8,
    right: 8,
    flexDirection: 'row',
    gap: 6,
    zIndex: 100,
    elevation: 100,
  },
  roleDetailEditButtonAbsolute: {
    backgroundColor: '#a6e4cfff',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    shadowColor: '#10B981',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
    elevation: 5,
    minWidth: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  roleDetailEditText: {
    fontSize: 16,
    color: '#000000',
    fontWeight: '700',
  },
  roleDetailDeleteButtonAbsoluteSmall: {
    backgroundColor: '#FF6B00',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
    elevation: 5,
    minWidth: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  supervisorMinersModalContent: {
    backgroundColor: '#000000',
    borderRadius: 20,
    width: '90%',
    maxWidth: 500,
    height: Dimensions.get('window').height * 0.80,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.6,
    shadowRadius: 15,
    elevation: 10,
  },
  supervisorInfoBanner: {
    backgroundColor: '#0A0A0A',
    paddingHorizontal: 24,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
    flexDirection: 'row',
    justifyContent: 'space-around',
    gap: 20,
  },
  supervisorInfoItem: {
    alignItems: 'center',
  },
  supervisorInfoLabel: {
    fontSize: 11,
    color: '#CCCCCC',
    marginBottom: 4,
  },
  supervisorInfoValue: {
    fontSize: 14,
    color: '#FF6B00',
    fontWeight: '600',
  },
  supervisorMinersList: {
    flex: 1,
  },
  minersListContent: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 24,
  },
  supervisorMinerCard: {
    backgroundColor: '#0A0A0A',
    borderRadius: 14,
    padding: 14,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.4,
    shadowRadius: 6,
    elevation: 5,
  },
  minerCardHeader: {
    marginBottom: 8,
    paddingBottom: 6,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },
  minerCardName: {
    fontSize: 15,
    fontWeight: '700',
    color: '#FF6B00',
    letterSpacing: 0.3,
  },
  minerCardDetails: {
    gap: 4,
  },
  minerCardDetail: {
    fontSize: 12,
    color: '#FFFFFF',
    lineHeight: 16,
  },
  // Professional Miner Card Styles
  professionalMinerCard: {
    backgroundColor: '#0A0A0A',
    borderRadius: 16,
    padding: 18,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  professionalMinerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.08)',
  },
  minerNumberBadge: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#FF6B00',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.4,
    shadowRadius: 4,
    elevation: 3,
  },
  minerNumberText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#000000',
  },
  minerHeaderInfo: {
    flex: 1,
  },
  professionalMinerName: {
    fontSize: 17,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 4,
    letterSpacing: 0.3,
  },
  professionalMinerPhone: {
    fontSize: 13,
    color: '#CCCCCC',
    fontWeight: '500',
  },
  minerInfoGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 12,
    gap: 12,
  },
  minerInfoItem: {
    width: '47%',
    backgroundColor: '#000000',
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
  },
  minerInfoLabel: {
    fontSize: 11,
    color: '#999999',
    marginBottom: 4,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  minerInfoValue: {
    fontSize: 13,
    color: '#FFFFFF',
    fontWeight: '600',
  },
  minerTrainingStatus: {
    marginBottom: 12,
  },
  trainingBadge: {
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 8,
    alignSelf: 'flex-start',
  },
  trainingCompleted: {
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    borderWidth: 1,
    borderColor: '#10B981',
  },
  trainingPending: {
    backgroundColor: 'rgba(245, 158, 11, 0.15)',
    borderWidth: 1,
    borderColor: '#F59E0B',
  },
  trainingBadgeText: {
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  trainingCompletedText: {
    color: '#10B981',
  },
  trainingPendingText: {
    color: '#F59E0B',
  },
  minerAddressSection: {
    backgroundColor: '#000000',
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
  },
  minerAddressLabel: {
    fontSize: 11,
    color: '#999999',
    marginBottom: 4,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  minerAddressText: {
    fontSize: 12,
    color: '#FFFFFF',
    lineHeight: 18,
    fontWeight: '500',
  },
  userDetailsModalContent: {
    backgroundColor: '#000000',
    borderRadius: 20,
    width: '95%',
    maxWidth: 400,
    height: Dimensions.get('window').height * 0.85,
    borderWidth: 2,
    borderColor: '#FF6B00',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 8,
  },
  userActions: {
    paddingHorizontal: 24,
    paddingBottom: 16,
  },
  bottomActions: {
    marginTop: 24,
    marginBottom: 20,
    gap: 12,
  },
  editButton: {
    backgroundColor: '#FF6B00',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.4,
    shadowRadius: 4,
    elevation: 3,
  },
  editButtonText: {
    color: '#000000',
    fontSize: 16,
    fontWeight: '700',
  },
  editActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  saveButton: {
    flex: 1,
    backgroundColor: '#FF6B00',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.4,
    shadowRadius: 4,
    elevation: 3,
  },
  saveButtonText: {
    color: '#000000',
    fontSize: 16,
    fontWeight: '700',
  },
  cancelButton: {
    flex: 1,
    backgroundColor: 'transparent',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#FF6B00',
  },
  cancelButtonText: {
    color: '#ffffffff',
    fontSize: 16,
    fontWeight: '700',
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
    color: '#FF6B00',
    marginTop: 20,
    marginBottom: 16,
  },
  readOnlyText: {
    fontSize: 16,
    color: '#FFFFFF',
    paddingVertical: 14,
    paddingHorizontal: 16,
    backgroundColor: 'transparent',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 107, 0, 0.3)',
  },
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.95)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 9999,
  },
  loadingContainer: {
    backgroundColor: '#000000',
    padding: 30,
    borderRadius: 20,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.6,
    shadowRadius: 10,
    elevation: 10,
  },
  loadingText: {
    color: '#FF6B00',
    marginTop: 12,
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  // Miner Card Wrapper Styles
  minerCardWrapper: {
    position: 'relative',
  },
  minerCardContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 12,
  },
  minerInfoLeft: {
    flex: 1,
  },
  roleDetailPhone: {
    fontSize: 14,
    color: '#BBBBBB',
    marginTop: 4,
    marginBottom: 8,
  },
  roleDetailSupervisor: {
    fontSize: 12,
    color: '#999999',
  },
  minerActionButtons: {
    flexDirection: 'column',
    gap: 8,
    alignItems: 'flex-end',
  },
  editButtonMiner: {
    backgroundColor: 'transparent',
    paddingHorizontal: 0,
    paddingVertical: 0,
  },
  editButtonTextMiner: {
    color: '#6B9BD1',
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  deleteButtonMiner: {
    backgroundColor: 'transparent',
    paddingHorizontal: 0,
    paddingVertical: 0,
  },
  deleteButtonTextMiner: {
    color: '#FF6B6B',
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  minerClickableArea: {
    flex: 1,
  },
  minerClickableAreaWithButtons: {
    flex: 1,
    paddingRight: 80,
  },
  // Supervisor Details Modal Styles
  supervisorDetailsModalContent: {
    backgroundColor: '#000000',
    borderRadius: 20,
    width: '90%',
    maxWidth: 500,
    height: Dimensions.get('window').height * 0.85,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.6,
    shadowRadius: 15,
    elevation: 10,
  },
  minerInfoBanner: {
    backgroundColor: '#0A0A0A',
    paddingHorizontal: 24,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
    alignItems: 'center',
    gap: 8,
  },
  minerInfoTitle: {
    fontSize: 12,
    color: '#CCCCCC',
    fontWeight: '600',
  },
  minerInfoName: {
    fontSize: 16,
    color: '#FF6B00',
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  supervisorDetailsScroll: {
    flex: 1,
  },
  supervisorDetailsContent: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 24,
  },
  supervisorDetailsCard: {
    backgroundColor: '#0A0A0A',
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 6,
  },
  supervisorDetailsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },
  supervisorIconContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#FF6B00',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.5,
    shadowRadius: 6,
    elevation: 5,
  },
  supervisorIcon: {
    fontSize: 30,
  },
  supervisorHeaderInfo: {
    flex: 1,
  },
  supervisorDetailsName: {
    fontSize: 20,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 4,
    letterSpacing: 0.5,
  },
  supervisorDetailsRole: {
    fontSize: 14,
    color: '#FF6B00',
    fontWeight: '600',
  },
  detailsSection: {
    marginBottom: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.05)',
  },
  detailsSectionTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FF6B00',
    marginBottom: 12,
    letterSpacing: 0.5,
  },
  detailsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
    paddingVertical: 4,
  },
  detailsLabel: {
    fontSize: 13,
    color: '#CCCCCC',
    flex: 1,
    fontWeight: '600',
  },
  detailsValue: {
    fontSize: 13,
    color: '#FFFFFF',
    flex: 1.2,
    textAlign: 'right',
    fontWeight: '500',
  },
  highlightValue: {
    color: '#FF6B00',
    fontWeight: '700',
    fontSize: 14,
  },
  viewAllMinersButton: {
    backgroundColor: '#FF6B00',
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 10,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.5,
    shadowRadius: 6,
    elevation: 5,
  },
  viewAllMinersButtonText: {
    color: '#000000',
    fontSize: 15,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
});
