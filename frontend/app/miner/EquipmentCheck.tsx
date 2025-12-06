import AsyncStorage from '@react-native-async-storage/async-storage';
import * as ImagePicker from 'expo-image-picker';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
    Alert,
    Image,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
    AlertTriangle,
    ArrowLeft,
    Camera,
    CheckCircle,
    Shield,
    Upload,
    XCircle,
} from '../../components/Icons';
import { COLORS } from '../../constants/styles';
import { useRoleStore } from '../../hooks/useRoleStore';

interface Equipment {
  id: string;
  name: string;
  category: 'PPE' | 'Tool' | 'Sensor';
  description: string;
  checkpoints: string[];
  status: 'good' | 'warning' | 'damaged' | 'not-checked';
  photo?: string;
  notes?: string;
  lastChecked?: number;
}

interface EquipmentReport {
  id: string;
  minerId: string;
  timestamp: number;
  equipment: Equipment[];
  submitted: boolean;
}

export default function EquipmentCheck() {
  const router = useRouter();
  const { user } = useRoleStore();
  const [equipment, setEquipment] = useState<Equipment[]>([
    {
      id: '1',
      name: 'Hard Hat',
      category: 'PPE',
      description: 'Protective helmet with smart sensors',
      checkpoints: [
        'No cracks or damage',
        'Straps are secure',
        'Sensors are working',
        'Clean and intact',
      ],
      status: 'not-checked',
    },
    {
      id: '2',
      name: 'Safety Boots',
      category: 'PPE',
      description: 'Steel-toed work boots',
      checkpoints: [
        'Steel toe intact',
        'No holes or tears',
        'Good tread',
        'Laces secure',
      ],
      status: 'not-checked',
    },
    {
      id: '3',
      name: 'Reflective Vest',
      category: 'PPE',
      description: 'High-visibility safety vest',
      checkpoints: [
        'Reflective strips visible',
        'No tears or damage',
        'Clean and visible',
      ],
      status: 'not-checked',
    },
    {
      id: '4',
      name: 'Safety Gloves',
      category: 'PPE',
      description: 'Cut-resistant work gloves',
      checkpoints: [
        'No tears or holes',
        'Proper fit',
        'Clean and dry',
      ],
      status: 'not-checked',
    },
    {
      id: '5',
      name: 'Headlamp',
      category: 'Tool',
      description: 'LED headlamp with battery',
      checkpoints: [
        'Bright beam',
        'Battery charged',
        'Strap secure',
        'Spare batteries available',
      ],
      status: 'not-checked',
    },
    {
      id: '6',
      name: 'Gas Detector',
      category: 'Sensor',
      description: 'Multi-gas detection device',
      checkpoints: [
        'Calibrated today',
        'Alarm tested',
        'Battery > 50%',
        'Sensor clean',
      ],
      status: 'not-checked',
    },
    {
      id: '7',
      name: 'Emergency Radio',
      category: 'Tool',
      description: 'Two-way communication radio',
      checkpoints: [
        'Battery charged',
        'Clear reception',
        'Emergency channel tested',
      ],
      status: 'not-checked',
    },
  ]);

  const [selectedEquipment, setSelectedEquipment] = useState<Equipment | null>(null);
  const [showDetail, setShowDetail] = useState(false);

  useEffect(() => {
    loadTodayReport();
  }, []);

  const loadTodayReport = async () => {
    try {
      const today = new Date().toDateString();
      const key = `equipment_report_${user.id}_${today}`;
      const stored = await AsyncStorage.getItem(key);
      
      if (stored) {
        const report: EquipmentReport = JSON.parse(stored);
        setEquipment(report.equipment);
      }
    } catch (error) {
      console.error('Error loading equipment report:', error);
    }
  };

  const saveReport = async (updatedEquipment: Equipment[]) => {
    try {
      const today = new Date().toDateString();
      const key = `equipment_report_${user.id}_${today}`;
      
      const report: EquipmentReport = {
        id: `${user.id}_${Date.now()}`,
        minerId: user.id,
        timestamp: Date.now(),
        equipment: updatedEquipment,
        submitted: false,
      };

      await AsyncStorage.setItem(key, JSON.stringify(report));
    } catch (error) {
      console.error('Error saving report:', error);
    }
  };

  const updateEquipmentStatus = (id: string, status: Equipment['status'], notes?: string) => {
    const updated = equipment.map(item =>
      item.id === id
        ? { ...item, status, notes, lastChecked: Date.now() }
        : item
    );
    setEquipment(updated);
    saveReport(updated);
    setShowDetail(false);
    setSelectedEquipment(null);
  };

  const takePhoto = async (equipmentId: string) => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    
    if (status !== 'granted') {
      Alert.alert('Permission Required', 'Camera permission is needed to take photos');
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.7,
    });

    if (!result.canceled && result.assets[0]) {
      const updated = equipment.map(item =>
        item.id === equipmentId
          ? { ...item, photo: result.assets[0].uri }
          : item
      );
      setEquipment(updated);
      saveReport(updated);
    }
  };

  const submitReport = async () => {
    const allChecked = equipment.every(e => e.status !== 'not-checked');
    
    if (!allChecked) {
      Alert.alert(
        'Incomplete Check',
        'Please check all equipment before submitting',
        [{ text: 'OK' }]
      );
      return;
    }

    const damaged = equipment.filter(e => e.status === 'damaged');
    
    if (damaged.length > 0) {
      Alert.alert(
        '⚠️ Damaged Equipment',
        `${damaged.length} items are damaged. Report to supervisor before starting work.`,
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Report & Submit',
            onPress: async () => {
              // Here you would send to backend
              Alert.alert('Success', 'Equipment report submitted. Supervisor notified of damaged items.');
              router.back();
            },
          },
        ]
      );
    } else {
      Alert.alert(
        '✅ All Equipment OK',
        'Submit equipment check report?',
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Submit',
            onPress: () => {
              Alert.alert('Success', 'Equipment check submitted successfully!');
              router.back();
            },
          },
        ]
      );
    }
  };

  const getStatusColor = (status: Equipment['status']) => {
    switch (status) {
      case 'good': return '#10B981';
      case 'warning': return '#F59E0B';
      case 'damaged': return '#EF4444';
      default: return COLORS.textMuted;
    }
  };

  const getStatusIcon = (status: Equipment['status']) => {
    switch (status) {
      case 'good': return <CheckCircle size={20} color="#10B981" />;
      case 'warning': return <AlertTriangle size={20} color="#F59E0B" />;
      case 'damaged': return <XCircle size={20} color="#EF4444" />;
      default: return null;
    }
  };

  const checkedCount = equipment.filter(e => e.status !== 'not-checked').length;
  const completionRate = Math.round((checkedCount / equipment.length) * 100);

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <ArrowLeft size={24} color={COLORS.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Equipment Check</Text>
        <TouchableOpacity
          onPress={submitReport}
          style={[styles.submitButton, completionRate === 100 && styles.submitButtonActive]}
          disabled={completionRate !== 100}
        >
          <Upload size={20} color={completionRate === 100 ? '#FFFFFF' : COLORS.textMuted} />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Progress Card */}
        <View style={styles.progressCard}>
          <View style={styles.progressHeader}>
            <Shield size={24} color={COLORS.primary} />
            <Text style={styles.progressTitle}>Equipment Status</Text>
          </View>
          
          <View style={styles.progressBar}>
            <View style={[styles.progressFill, { width: `${completionRate}%` }]} />
          </View>
          
          <Text style={styles.progressText}>
            {checkedCount} / {equipment.length} items checked ({completionRate}%)
          </Text>
        </View>

        {/* Equipment List */}
        {['PPE', 'Tool', 'Sensor'].map(category => {
          const categoryItems = equipment.filter(e => e.category === category);
          
          return (
            <View key={category} style={styles.categorySection}>
              <Text style={styles.categoryTitle}>{category}</Text>
              
              {categoryItems.map(item => (
                <TouchableOpacity
                  key={item.id}
                  style={[
                    styles.equipmentCard,
                    item.status !== 'not-checked' && { borderColor: getStatusColor(item.status) },
                  ]}
                  onPress={() => {
                    setSelectedEquipment(item);
                    setShowDetail(true);
                  }}
                  activeOpacity={0.7}
                >
                  <View style={styles.equipmentHeader}>
                    <Text style={styles.equipmentName}>{item.name}</Text>
                    {getStatusIcon(item.status)}
                  </View>
                  
                  <Text style={styles.equipmentDescription}>{item.description}</Text>
                  
                  {item.photo && (
                    <Image source={{ uri: item.photo }} style={styles.equipmentPhoto} />
                  )}
                  
                  {item.status !== 'not-checked' && (
                    <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.status) + '20' }]}>
                      <Text style={[styles.statusText, { color: getStatusColor(item.status) }]}>
                        {item.status.toUpperCase()}
                      </Text>
                    </View>
                  )}
                </TouchableOpacity>
              ))}
            </View>
          );
        })}

        <View style={{ height: 100 }} />
      </ScrollView>

      {/* Detail Modal */}
      {showDetail && selectedEquipment && (
        <View style={styles.modal}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>{selectedEquipment.name}</Text>
            <Text style={styles.modalDescription}>{selectedEquipment.description}</Text>

            <Text style={styles.checkpointsTitle}>Checkpoints:</Text>
            {selectedEquipment.checkpoints.map((checkpoint, index) => (
              <Text key={index} style={styles.checkpoint}>
                • {checkpoint}
              </Text>
            ))}

            <TouchableOpacity
              style={styles.photoButton}
              onPress={() => takePhoto(selectedEquipment.id)}
            >
              <Camera size={20} color={COLORS.primary} />
              <Text style={styles.photoButtonText}>Take Photo</Text>
            </TouchableOpacity>

            <View style={styles.statusButtons}>
              <TouchableOpacity
                style={[styles.statusBtn, styles.goodBtn]}
                onPress={() => updateEquipmentStatus(selectedEquipment.id, 'good')}
              >
                <CheckCircle size={24} color="#FFFFFF" />
                <Text style={styles.statusBtnText}>Good</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.statusBtn, styles.warningBtn]}
                onPress={() => updateEquipmentStatus(selectedEquipment.id, 'warning')}
              >
                <AlertTriangle size={24} color="#FFFFFF" />
                <Text style={styles.statusBtnText}>Warning</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.statusBtn, styles.damagedBtn]}
                onPress={() => updateEquipmentStatus(selectedEquipment.id, 'damaged')}
              >
                <XCircle size={24} color="#FFFFFF" />
                <Text style={styles.statusBtnText}>Damaged</Text>
              </TouchableOpacity>
            </View>

            <TouchableOpacity
              style={styles.cancelButton}
              onPress={() => {
                setShowDetail(false);
                setSelectedEquipment(null);
              }}
            >
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
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
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
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
    fontSize: 20,
    fontWeight: '700',
    color: COLORS.text,
  },
  submitButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 20,
    backgroundColor: COLORS.card,
  },
  submitButtonActive: {
    backgroundColor: COLORS.primary,
  },
  scrollView: {
    flex: 1,
  },
  progressCard: {
    margin: 20,
    padding: 20,
    backgroundColor: COLORS.card,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  progressHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  progressTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.text,
    marginLeft: 12,
  },
  progressBar: {
    height: 12,
    backgroundColor: COLORS.background,
    borderRadius: 6,
    overflow: 'hidden',
    marginBottom: 12,
  },
  progressFill: {
    height: '100%',
    backgroundColor: COLORS.primary,
    borderRadius: 6,
  },
  progressText: {
    fontSize: 14,
    color: COLORS.textMuted,
  },
  categorySection: {
    marginHorizontal: 20,
    marginBottom: 24,
  },
  categoryTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: 12,
  },
  equipmentCard: {
    backgroundColor: COLORS.card,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 2,
    borderColor: COLORS.border,
  },
  equipmentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  equipmentName: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text,
  },
  equipmentDescription: {
    fontSize: 13,
    color: COLORS.textMuted,
    marginBottom: 8,
  },
  equipmentPhoto: {
    width: '100%',
    height: 150,
    borderRadius: 8,
    marginVertical: 8,
  },
  statusBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    marginTop: 8,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '700',
  },
  modal: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: COLORS.card,
    borderRadius: 16,
    padding: 24,
    width: '100%',
    maxHeight: '80%',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: 8,
  },
  modalDescription: {
    fontSize: 14,
    color: COLORS.textMuted,
    marginBottom: 20,
  },
  checkpointsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 8,
  },
  checkpoint: {
    fontSize: 14,
    color: COLORS.textMuted,
    marginBottom: 6,
    paddingLeft: 8,
  },
  photoButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.background,
    padding: 14,
    borderRadius: 12,
    marginVertical: 20,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  photoButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.primary,
    marginLeft: 8,
  },
  statusButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
    gap: 12,
  },
  statusBtn: {
    flex: 1,
    alignItems: 'center',
    padding: 14,
    borderRadius: 12,
  },
  goodBtn: {
    backgroundColor: '#10B981',
  },
  warningBtn: {
    backgroundColor: '#F59E0B',
  },
  damagedBtn: {
    backgroundColor: '#EF4444',
  },
  statusBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FFFFFF',
    marginTop: 4,
  },
  cancelButton: {
    padding: 14,
    alignItems: 'center',
    backgroundColor: COLORS.background,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text,
  },
});
