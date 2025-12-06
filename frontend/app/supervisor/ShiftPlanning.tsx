import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Alert, Modal, TextInput } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { ArrowLeft, Calendar, ChevronLeft, ChevronRight, Plus, User, Clock, MapPin, Edit2, Trash2 } from '../../components/Icons';
import { COLORS } from '../../constants/styles';
import { useSupervisor } from '@/contexts/SupervisorContext';

interface Shift {
  id: string;
  workerId: string;
  workerName: string;
  shift: 'morning' | 'afternoon' | 'night';
  location: string;
  date: string;
  startTime: string;
  endTime: string;
  status: 'scheduled' | 'in-progress' | 'completed' | 'cancelled';
}

interface Worker {
  id: string;
  name: string;
  role: string;
  availability: boolean;
}

export default function ShiftPlanning() {
  const router = useRouter();
  const { assignedMiners, loading: minersLoading } = useSupervisor();
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [selectedWeek, setSelectedWeek] = useState(0);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedShift, setSelectedShift] = useState<Shift | null>(null);
  const [shifts, setShifts] = useState<Shift[]>([]);
  const [workers, setWorkers] = useState<Worker[]>([]);
  
  const [newShift, setNewShift] = useState({
    workerId: '',
    shift: 'morning' as 'morning' | 'afternoon' | 'night',
    location: 'Section A',
    date: new Date().toISOString().split('T')[0],
  });

  useEffect(() => {
    if (assignedMiners.length > 0) {
      generateShiftData();
    }
  }, [assignedMiners]);

  const generateShiftData = () => {
    console.log('📊 Generating shift data for', assignedMiners.length, 'miners');
    
    // Generate workers from assigned miners
    const workersData: Worker[] = assignedMiners.map((miner) => ({
      id: miner.id,
      name: miner.name,
      role: miner.role || 'Miner',
      availability: true,
    }));
    setWorkers(workersData);
    
    // Generate sample shifts
    const shiftsData: Shift[] = assignedMiners.map((miner, index) => {
      const shiftTypes: ('morning' | 'afternoon' | 'night')[] = ['morning', 'afternoon', 'night'];
      const shiftType = shiftTypes[index % 3];
      const today = new Date();
      const shiftDate = new Date(today);
      shiftDate.setDate(today.getDate() + (index % 7));
      
      return {
        id: miner.id + '_shift',
        workerId: miner.id,
        workerName: miner.name,
        shift: shiftType,
        location: miner.location || 'Section A',
        date: shiftDate.toISOString().split('T')[0],
        startTime: shiftType === 'morning' ? '06:00' : shiftType === 'afternoon' ? '14:00' : '22:00',
        endTime: shiftType === 'morning' ? '14:00' : shiftType === 'afternoon' ? '22:00' : '06:00',
        status: 'scheduled',
      };
    });
    
    setShifts(shiftsData);
    console.log('✅ Generated', shiftsData.length, 'shifts for', workersData.length, 'workers');
  };

  const getWeekDates = (weekOffset: number) => {
    const today = new Date();
    const startOfWeek = new Date(today);
    startOfWeek.setDate(today.getDate() - today.getDay() + weekOffset * 7);
    
    const dates = [];
    for (let i = 0; i < 7; i++) {
      const date = new Date(startOfWeek);
      date.setDate(startOfWeek.getDate() + i);
      dates.push(date);
    }
    return dates;
  };

  const weekDates = getWeekDates(selectedWeek);

  const formatDate = (date: Date) => {
    return date.toISOString().split('T')[0];
  };

  const getShiftColor = (shift: string) => {
    switch (shift) {
      case 'morning': return '#06B6D4';
      case 'afternoon': return '#F59E0B';
      case 'night': return '#8B5CF6';
      default: return COLORS.textMuted;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'scheduled': return '#06B6D4';
      case 'in-progress': return '#F59E0B';
      case 'completed': return '#10B981';
      case 'cancelled': return '#EF4444';
      default: return COLORS.textMuted;
    }
  };

  const getShiftsForDate = (date: Date) => {
    const dateStr = formatDate(date);
    return shifts.filter(shift => shift.date === dateStr);
  };

  const handleAddShift = () => {
    if (!newShift.workerId) {
      Alert.alert('Error', 'Please select a worker');
      return;
    }

    const worker = workers.find(w => w.id === newShift.workerId);
    if (!worker) return;

    const shiftTimes = {
      morning: { start: '06:00', end: '14:00' },
      afternoon: { start: '14:00', end: '22:00' },
      night: { start: '22:00', end: '06:00' },
    };

    const shift: Shift = {
      id: Date.now().toString(),
      workerId: newShift.workerId,
      workerName: worker.name,
      shift: newShift.shift,
      location: newShift.location,
      date: newShift.date,
      startTime: shiftTimes[newShift.shift].start,
      endTime: shiftTimes[newShift.shift].end,
      status: 'scheduled',
    };

    setShifts([...shifts, shift]);
    setShowAddModal(false);
    setNewShift({
      workerId: '',
      shift: 'morning',
      location: 'Section A',
      date: new Date().toISOString().split('T')[0],
    });
    Alert.alert('Success', 'Shift scheduled successfully');
  };

  const handleEditShift = (shift: Shift) => {
    setSelectedShift(shift);
    setShowEditModal(true);
  };

  const handleDeleteShift = (shiftId: string) => {
    Alert.alert(
      'Delete Shift',
      'Are you sure you want to delete this shift?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            setShifts(shifts.filter(s => s.id !== shiftId));
            Alert.alert('Success', 'Shift deleted successfully');
          },
        },
      ]
    );
  };

  const stats = {
    totalShifts: shifts.length,
    scheduled: shifts.filter(s => s.status === 'scheduled').length,
    inProgress: shifts.filter(s => s.status === 'in-progress').length,
    completed: shifts.filter(s => s.status === 'completed').length,
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <ArrowLeft size={24} color={COLORS.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Shift Planning</Text>
        <TouchableOpacity onPress={() => setShowAddModal(true)} style={styles.addButton}>
          <Plus size={24} color="#FFFFFF" />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content}>
        {/* Stats */}
        <View style={styles.statsContainer}>
          <View style={styles.statCard}>
            <Text style={[styles.statValue, { color: COLORS.primary }]}>{stats.totalShifts}</Text>
            <Text style={styles.statLabel}>Total Shifts</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={[styles.statValue, { color: '#06B6D4' }]}>{stats.scheduled}</Text>
            <Text style={styles.statLabel}>Scheduled</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={[styles.statValue, { color: '#F59E0B' }]}>{stats.inProgress}</Text>
            <Text style={styles.statLabel}>In Progress</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={[styles.statValue, { color: '#10B981' }]}>{stats.completed}</Text>
            <Text style={styles.statLabel}>Completed</Text>
          </View>
        </View>

        {/* Week Navigation */}
        <View style={styles.weekNavigator}>
          <TouchableOpacity
            style={styles.navButton}
            onPress={() => setSelectedWeek(selectedWeek - 1)}
          >
            <ChevronLeft size={24} color={COLORS.text} />
          </TouchableOpacity>
          
          <Text style={styles.weekLabel}>
            {weekDates[0].toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - {' '}
            {weekDates[6].toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
          </Text>
          
          <TouchableOpacity
            style={styles.navButton}
            onPress={() => setSelectedWeek(selectedWeek + 1)}
          >
            <ChevronRight size={24} color={COLORS.text} />
          </TouchableOpacity>
        </View>

        {/* Week Calendar */}
        <View style={styles.calendarContainer}>
          {weekDates.map((date, index) => {
            const dayShifts = getShiftsForDate(date);
            const isToday = formatDate(date) === formatDate(new Date());
            
            return (
              <View key={index} style={styles.dayColumn}>
                <View style={[styles.dayHeader, isToday && styles.dayHeaderToday]}>
                  <Text style={[styles.dayName, isToday && styles.dayTextToday]}>
                    {date.toLocaleDateString('en-US', { weekday: 'short' })}
                  </Text>
                  <Text style={[styles.dayDate, isToday && styles.dayTextToday]}>
                    {date.getDate()}
                  </Text>
                </View>

                <View style={styles.shiftsColumn}>
                  {dayShifts.length === 0 ? (
                    <View style={styles.emptyDay}>
                      <Text style={styles.emptyDayText}>No shifts</Text>
                    </View>
                  ) : (
                    dayShifts.map((shift) => (
                      <TouchableOpacity
                        key={shift.id}
                        style={[
                          styles.shiftCard,
                          { borderLeftColor: getShiftColor(shift.shift), borderLeftWidth: 4 }
                        ]}
                        onPress={() => handleEditShift(shift)}
                      >
                        <Text style={styles.shiftWorker} numberOfLines={1}>{shift.workerName}</Text>
                        <View style={[styles.shiftBadge, { backgroundColor: getShiftColor(shift.shift) + '20' }]}>
                          <Text style={[styles.shiftBadgeText, { color: getShiftColor(shift.shift) }]}>
                            {shift.shift}
                          </Text>
                        </View>
                        <Text style={styles.shiftTime}>{shift.startTime} - {shift.endTime}</Text>
                        <Text style={styles.shiftLocation}>{shift.location}</Text>
                      </TouchableOpacity>
                    ))
                  )}
                </View>
              </View>
            );
          })}
        </View>

        {/* All Shifts List */}
        <View style={styles.allShiftsSection}>
          <Text style={styles.sectionTitle}>All Upcoming Shifts</Text>
          
          {shifts
            .filter(s => s.status === 'scheduled' || s.status === 'in-progress')
            .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
            .map((shift) => (
              <View key={shift.id} style={styles.listShiftCard}>
                <View style={styles.listShiftMain}>
                  <View style={styles.listShiftInfo}>
                    <Text style={styles.listShiftWorker}>{shift.workerName}</Text>
                    <View style={styles.listShiftDetails}>
                      <Calendar size={14} color={COLORS.textMuted} />
                      <Text style={styles.listShiftDetailText}>{shift.date}</Text>
                      <Clock size={14} color={COLORS.textMuted} />
                      <Text style={styles.listShiftDetailText}>{shift.startTime} - {shift.endTime}</Text>
                    </View>
                    <View style={styles.listShiftDetails}>
                      <MapPin size={14} color={COLORS.textMuted} />
                      <Text style={styles.listShiftDetailText}>{shift.location}</Text>
                    </View>
                  </View>
                  
                  <View style={styles.listShiftBadges}>
                    <View style={[styles.listShiftBadge, { backgroundColor: getShiftColor(shift.shift) + '20' }]}>
                      <Text style={[styles.listShiftBadgeText, { color: getShiftColor(shift.shift) }]}>
                        {shift.shift}
                      </Text>
                    </View>
                    <View style={[styles.listShiftBadge, { backgroundColor: getStatusColor(shift.status) + '20' }]}>
                      <Text style={[styles.listShiftBadgeText, { color: getStatusColor(shift.status) }]}>
                        {shift.status}
                      </Text>
                    </View>
                  </View>
                </View>
                
                <View style={styles.listShiftActions}>
                  <TouchableOpacity
                    style={[styles.actionButton, { backgroundColor: '#06B6D4' + '20' }]}
                    onPress={() => handleEditShift(shift)}
                  >
                    <Edit2 size={16} color="#06B6D4" />
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.actionButton, { backgroundColor: '#EF4444' + '20' }]}
                    onPress={() => handleDeleteShift(shift.id)}
                  >
                    <Trash2 size={16} color="#EF4444" />
                  </TouchableOpacity>
                </View>
              </View>
            ))}
        </View>
      </ScrollView>

      {/* Add Shift Modal */}
      <Modal
        visible={showAddModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowAddModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Schedule New Shift</Text>
              <TouchableOpacity onPress={() => setShowAddModal(false)}>
                <Text style={styles.modalClose}>✕</Text>
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalBody}>
              <Text style={styles.label}>Select Worker *</Text>
              <View style={styles.workersList}>
                {workers.map((worker) => (
                  <TouchableOpacity
                    key={worker.id}
                    style={[
                      styles.workerOption,
                      newShift.workerId === worker.id && styles.workerOptionSelected,
                      !worker.availability && styles.workerOptionDisabled
                    ]}
                    onPress={() => worker.availability && setNewShift({ ...newShift, workerId: worker.id })}
                    disabled={!worker.availability}
                  >
                    <View style={styles.workerInfo}>
                      <User size={20} color={COLORS.text} />
                      <View>
                        <Text style={styles.workerName}>{worker.name}</Text>
                        <Text style={styles.workerRole}>{worker.role}</Text>
                      </View>
                    </View>
                    {!worker.availability && (
                      <Text style={styles.unavailableText}>Unavailable</Text>
                    )}
                  </TouchableOpacity>
                ))}
              </View>

              <Text style={styles.label}>Shift Type *</Text>
              <View style={styles.shiftTypeSelector}>
                {(['morning', 'afternoon', 'night'] as const).map((shift) => (
                  <TouchableOpacity
                    key={shift}
                    style={[
                      styles.shiftTypeOption,
                      newShift.shift === shift && styles.shiftTypeOptionActive,
                      { borderColor: getShiftColor(shift) }
                    ]}
                    onPress={() => setNewShift({ ...newShift, shift })}
                  >
                    <Text style={[
                      styles.shiftTypeText,
                      newShift.shift === shift && { color: getShiftColor(shift) }
                    ]}>
                      {shift}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              <Text style={styles.label}>Location *</Text>
              <View style={styles.locationSelector}>
                {['Section A', 'Section B', 'Section C'].map((location) => (
                  <TouchableOpacity
                    key={location}
                    style={[
                      styles.locationOption,
                      newShift.location === location && styles.locationOptionActive
                    ]}
                    onPress={() => setNewShift({ ...newShift, location })}
                  >
                    <Text style={[
                      styles.locationText,
                      newShift.location === location && styles.locationTextActive
                    ]}>
                      {location}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              <Text style={styles.label}>Date *</Text>
              <TextInput
                style={styles.input}
                placeholder="YYYY-MM-DD"
                placeholderTextColor={COLORS.textMuted}
                value={newShift.date}
                onChangeText={(text) => setNewShift({ ...newShift, date: text })}
              />
            </ScrollView>

            <View style={styles.modalFooter}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => setShowAddModal(false)}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.createButton]}
                onPress={handleAddShift}
              >
                <Text style={styles.createButtonText}>Schedule Shift</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
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
    padding: 8,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.text,
  },
  addButton: {
    backgroundColor: COLORS.primary,
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    flex: 1,
  },
  statsContainer: {
    flexDirection: 'row',
    padding: 20,
    gap: 12,
  },
  statCard: {
    flex: 1,
    backgroundColor: COLORS.card,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 11,
    color: COLORS.textMuted,
    textAlign: 'center',
  },
  weekNavigator: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  navButton: {
    padding: 8,
    backgroundColor: COLORS.card,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  weekLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text,
  },
  calendarContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  dayColumn: {
    flex: 1,
    marginRight: 8,
  },
  dayHeader: {
    backgroundColor: COLORS.card,
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 8,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  dayHeaderToday: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  dayName: {
    fontSize: 12,
    color: COLORS.textMuted,
    fontWeight: '600',
    marginBottom: 4,
  },
  dayDate: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.text,
  },
  dayTextToday: {
    color: '#FFFFFF',
  },
  shiftsColumn: {
    gap: 8,
  },
  emptyDay: {
    backgroundColor: COLORS.card,
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  emptyDayText: {
    fontSize: 12,
    color: COLORS.textMuted,
  },
  shiftCard: {
    backgroundColor: COLORS.card,
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  shiftWorker: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 6,
  },
  shiftBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    marginBottom: 6,
  },
  shiftBadgeText: {
    fontSize: 10,
    fontWeight: '600',
    textTransform: 'capitalize',
  },
  shiftTime: {
    fontSize: 11,
    color: COLORS.textMuted,
    marginBottom: 4,
  },
  shiftLocation: {
    fontSize: 11,
    color: COLORS.textMuted,
  },
  allShiftsSection: {
    padding: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: 16,
  },
  listShiftCard: {
    flexDirection: 'row',
    backgroundColor: COLORS.card,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  listShiftMain: {
    flex: 1,
  },
  listShiftInfo: {
    marginBottom: 12,
  },
  listShiftWorker: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: 8,
  },
  listShiftDetails: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },
  listShiftDetailText: {
    fontSize: 13,
    color: COLORS.textMuted,
    marginRight: 12,
  },
  listShiftBadges: {
    flexDirection: 'row',
    gap: 8,
  },
  listShiftBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
  },
  listShiftBadgeText: {
    fontSize: 11,
    fontWeight: '600',
    textTransform: 'capitalize',
  },
  listShiftActions: {
    gap: 8,
    marginLeft: 12,
  },
  actionButton: {
    width: 36,
    height: 36,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: COLORS.background,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '90%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.text,
  },
  modalClose: {
    fontSize: 24,
    color: COLORS.textMuted,
    fontWeight: '300',
  },
  modalBody: {
    padding: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 12,
    marginTop: 12,
  },
  workersList: {
    gap: 8,
    marginBottom: 16,
  },
  workerOption: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 14,
    backgroundColor: COLORS.card,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  workerOptionSelected: {
    borderColor: COLORS.primary,
    backgroundColor: COLORS.primary + '10',
  },
  workerOptionDisabled: {
    opacity: 0.5,
  },
  workerInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  workerName: {
    fontSize: 15,
    color: COLORS.text,
    fontWeight: '500',
  },
  workerRole: {
    fontSize: 12,
    color: COLORS.textMuted,
  },
  unavailableText: {
    fontSize: 12,
    color: '#EF4444',
    fontWeight: '500',
  },
  shiftTypeSelector: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  shiftTypeOption: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 2,
    alignItems: 'center',
    backgroundColor: COLORS.card,
  },
  shiftTypeOptionActive: {
    backgroundColor: COLORS.background,
  },
  shiftTypeText: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.textMuted,
    textTransform: 'capitalize',
  },
  locationSelector: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  locationOption: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: 'center',
    backgroundColor: COLORS.card,
  },
  locationOptionActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  locationText: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.textMuted,
  },
  locationTextActive: {
    color: '#FFFFFF',
  },
  input: {
    backgroundColor: COLORS.card,
    borderRadius: 12,
    padding: 14,
    fontSize: 16,
    color: COLORS.text,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: 16,
  },
  modalFooter: {
    flexDirection: 'row',
    padding: 20,
    gap: 12,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  modalButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: COLORS.card,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text,
  },
  createButton: {
    backgroundColor: COLORS.primary,
  },
  createButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});
