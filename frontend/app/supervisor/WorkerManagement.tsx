import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, TextInput, StyleSheet, Alert, Modal } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { ArrowLeft, Search, Filter, User, Phone, Mail, MapPin, Calendar, Clock, CheckCircle, XCircle, AlertTriangle, Shield } from '../../components/Icons';
import { COLORS } from '../../constants/styles';
import { useSupervisor } from '@/contexts/SupervisorContext';

interface Worker {
  id: string;
  name: string;
  employeeId: string;
  role: string;
  phone: string;
  email: string;
  location: string;
  shift: 'morning' | 'afternoon' | 'night';
  status: 'active' | 'on-leave' | 'inactive';
  joinDate: string;
  safetyScore: number;
  attendance: {
    present: number;
    absent: number;
    leave: number;
    total: number;
  };
  certifications: string[];
  emergencyContact: {
    name: string;
    phone: string;
    relation: string;
  };
}

export default function WorkerManagement() {
  const router = useRouter();
  const { assignedMiners, loading: minersLoading } = useSupervisor();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFilter, setSelectedFilter] = useState<'all' | 'active' | 'on-leave' | 'inactive'>('all');
  const [selectedWorker, setSelectedWorker] = useState<Worker | null>(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [workers, setWorkers] = useState<Worker[]>([]);

  useEffect(() => {
    if (assignedMiners.length > 0) {
      generateWorkerData();
    }
  }, [assignedMiners]);

  const generateWorkerData = () => {
    console.log('📊 Generating worker data for', assignedMiners.length, 'miners');
    
    const workerData: Worker[] = assignedMiners.map((miner, index) => ({
      id: miner.id,
      name: miner.name,
      employeeId: miner.id.substring(0, 10).toUpperCase(),
      role: miner.role || 'Miner',
      phone: miner.phone,
      email: `${miner.name.toLowerCase().replace(/ /g, '.')}@mine.com`,
      location: miner.location || 'Section A',
      shift: (miner.shift || 'morning') as 'morning' | 'afternoon' | 'night',
      status: 'active' as const,
      joinDate: '2020-01-01',
      safetyScore: miner.safetyScore || 85,
      attendance: {
        present: 200 + Math.floor(Math.random() * 60),
        absent: Math.floor(Math.random() * 10),
        leave: Math.floor(Math.random() * 15),
        total: 265,
      },
      certifications: ['Mine Safety', 'First Aid'],
      emergencyContact: {
        name: 'Emergency Contact',
        phone: '+91 98765 00000',
        relation: 'Family',
      },
    }));
    
    setWorkers(workerData);
    console.log('✅ Generated worker data for', workerData.length, 'miners');
  };

  const filteredWorkers = workers.filter(worker => {
    const matchesFilter = selectedFilter === 'all' || worker.status === selectedFilter;
    const matchesSearch = 
      worker.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      worker.employeeId.toLowerCase().includes(searchQuery.toLowerCase()) ||
      worker.role.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return '#10B981';
      case 'on-leave': return '#F59E0B';
      case 'inactive': return '#EF4444';
      default: return COLORS.textMuted;
    }
  };

  const getShiftColor = (shift: string) => {
    switch (shift) {
      case 'morning': return '#06B6D4';
      case 'afternoon': return '#F59E0B';
      case 'night': return '#8B5CF6';
      default: return COLORS.textMuted;
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 90) return '#10B981';
    if (score >= 75) return '#F59E0B';
    return '#EF4444';
  };

  const calculateAttendanceRate = (attendance: Worker['attendance']) => {
    return Math.round((attendance.present / attendance.total) * 100);
  };

  const handleViewDetails = (worker: Worker) => {
    setSelectedWorker(worker);
    setShowDetailsModal(true);
  };

  const stats = {
    total: workers.length,
    active: workers.filter(w => w.status === 'active').length,
    onLeave: workers.filter(w => w.status === 'on-leave').length,
    inactive: workers.filter(w => w.status === 'inactive').length,
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <ArrowLeft size={24} color={COLORS.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Worker Management</Text>
        <TouchableOpacity style={styles.filterButton}>
          <Filter size={24} color={COLORS.text} />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content}>
        {/* Stats Cards */}
        <View style={styles.statsContainer}>
          <View style={styles.statCard}>
            <Text style={[styles.statValue, { color: COLORS.primary }]}>{stats.total}</Text>
            <Text style={styles.statLabel}>Total Workers</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={[styles.statValue, { color: '#10B981' }]}>{stats.active}</Text>
            <Text style={styles.statLabel}>Active</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={[styles.statValue, { color: '#F59E0B' }]}>{stats.onLeave}</Text>
            <Text style={styles.statLabel}>On Leave</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={[styles.statValue, { color: '#EF4444' }]}>{stats.inactive}</Text>
            <Text style={styles.statLabel}>Inactive</Text>
          </View>
        </View>

        {/* Search Bar */}
        <View style={styles.searchContainer}>
          <Search size={20} color={COLORS.textMuted} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search by name, ID, or role..."
            placeholderTextColor={COLORS.textMuted}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>

        {/* Filter Tabs */}
        <View style={styles.filterContainer}>
          {(['all', 'active', 'on-leave', 'inactive'] as const).map((filter) => (
            <TouchableOpacity
              key={filter}
              style={[styles.filterTab, selectedFilter === filter && styles.filterTabActive]}
              onPress={() => setSelectedFilter(filter)}
            >
              <Text style={[styles.filterText, selectedFilter === filter && styles.filterTextActive]}>
                {filter === 'all' ? 'All' : filter === 'on-leave' ? 'On Leave' : filter.charAt(0).toUpperCase() + filter.slice(1)}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Workers List */}
        <View style={styles.workersContainer}>
          {filteredWorkers.length === 0 ? (
            <View style={styles.emptyState}>
              <User size={48} color={COLORS.textMuted} />
              <Text style={styles.emptyText}>No workers found</Text>
            </View>
          ) : (
            filteredWorkers.map((worker) => {
              const attendanceRate = calculateAttendanceRate(worker.attendance);
              return (
                <TouchableOpacity
                  key={worker.id}
                  style={styles.workerCard}
                  onPress={() => handleViewDetails(worker)}
                >
                  <View style={styles.workerHeader}>
                    <View style={styles.workerMainInfo}>
                      <View style={styles.nameRow}>
                        <Text style={styles.workerName}>{worker.name}</Text>
                        <View style={[styles.statusDot, { backgroundColor: getStatusColor(worker.status) }]} />
                      </View>
                      <Text style={styles.workerRole}>{worker.role} • {worker.employeeId}</Text>
                    </View>
                    <View style={[styles.shiftBadge, { backgroundColor: getShiftColor(worker.shift) + '20' }]}>
                      <Text style={[styles.shiftText, { color: getShiftColor(worker.shift) }]}>
                        {worker.shift}
                      </Text>
                    </View>
                  </View>

                  <View style={styles.workerDetails}>
                    <View style={styles.detailRow}>
                      <MapPin size={16} color={COLORS.textMuted} />
                      <Text style={styles.detailText}>{worker.location}</Text>
                    </View>
                    <View style={styles.detailRow}>
                      <Phone size={16} color={COLORS.textMuted} />
                      <Text style={styles.detailText}>{worker.phone}</Text>
                    </View>
                  </View>

                  <View style={styles.workerMetrics}>
                    <View style={styles.metricItem}>
                      <Shield size={18} color={getScoreColor(worker.safetyScore)} />
                      <View style={styles.metricInfo}>
                        <Text style={styles.metricLabel}>Safety Score</Text>
                        <Text style={[styles.metricValue, { color: getScoreColor(worker.safetyScore) }]}>
                          {worker.safetyScore}%
                        </Text>
                      </View>
                    </View>
                    <View style={styles.metricDivider} />
                    <View style={styles.metricItem}>
                      <CheckCircle size={18} color={attendanceRate >= 90 ? '#10B981' : '#F59E0B'} />
                      <View style={styles.metricInfo}>
                        <Text style={styles.metricLabel}>Attendance</Text>
                        <Text style={[styles.metricValue, { color: attendanceRate >= 90 ? '#10B981' : '#F59E0B' }]}>
                          {attendanceRate}%
                        </Text>
                      </View>
                    </View>
                  </View>
                </TouchableOpacity>
              );
            })
          )}
        </View>
      </ScrollView>

      {/* Worker Details Modal */}
      <Modal
        visible={showDetailsModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowDetailsModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            {selectedWorker && (
              <>
                <View style={styles.modalHeader}>
                  <Text style={styles.modalTitle}>Worker Details</Text>
                  <TouchableOpacity onPress={() => setShowDetailsModal(false)}>
                    <Text style={styles.modalClose}>✕</Text>
                  </TouchableOpacity>
                </View>

                <ScrollView style={styles.modalBody}>
                  {/* Basic Info */}
                  <View style={styles.infoSection}>
                    <View style={styles.profileHeader}>
                      <View style={styles.profileIcon}>
                        <User size={32} color={COLORS.primary} />
                      </View>
                      <View style={styles.profileInfo}>
                        <Text style={styles.profileName}>{selectedWorker.name}</Text>
                        <Text style={styles.profileRole}>{selectedWorker.role}</Text>
                        <View style={[styles.profileStatus, { backgroundColor: getStatusColor(selectedWorker.status) + '20' }]}>
                          <Text style={[styles.profileStatusText, { color: getStatusColor(selectedWorker.status) }]}>
                            {selectedWorker.status === 'on-leave' ? 'On Leave' : selectedWorker.status.charAt(0).toUpperCase() + selectedWorker.status.slice(1)}
                          </Text>
                        </View>
                      </View>
                    </View>
                  </View>

                  {/* Contact Information */}
                  <View style={styles.infoSection}>
                    <Text style={styles.sectionTitle}>Contact Information</Text>
                    <View style={styles.infoRow}>
                      <Phone size={18} color={COLORS.textMuted} />
                      <Text style={styles.infoLabel}>Phone:</Text>
                      <Text style={styles.infoValue}>{selectedWorker.phone}</Text>
                    </View>
                    <View style={styles.infoRow}>
                      <Mail size={18} color={COLORS.textMuted} />
                      <Text style={styles.infoLabel}>Email:</Text>
                      <Text style={styles.infoValue}>{selectedWorker.email}</Text>
                    </View>
                    <View style={styles.infoRow}>
                      <MapPin size={18} color={COLORS.textMuted} />
                      <Text style={styles.infoLabel}>Location:</Text>
                      <Text style={styles.infoValue}>{selectedWorker.location}</Text>
                    </View>
                  </View>

                  {/* Work Details */}
                  <View style={styles.infoSection}>
                    <Text style={styles.sectionTitle}>Work Details</Text>
                    <View style={styles.infoRow}>
                      <User size={18} color={COLORS.textMuted} />
                      <Text style={styles.infoLabel}>Employee ID:</Text>
                      <Text style={styles.infoValue}>{selectedWorker.employeeId}</Text>
                    </View>
                    <View style={styles.infoRow}>
                      <Clock size={18} color={COLORS.textMuted} />
                      <Text style={styles.infoLabel}>Shift:</Text>
                      <Text style={[styles.infoValue, { color: getShiftColor(selectedWorker.shift) }]}>
                        {selectedWorker.shift.charAt(0).toUpperCase() + selectedWorker.shift.slice(1)}
                      </Text>
                    </View>
                    <View style={styles.infoRow}>
                      <Calendar size={18} color={COLORS.textMuted} />
                      <Text style={styles.infoLabel}>Join Date:</Text>
                      <Text style={styles.infoValue}>{selectedWorker.joinDate}</Text>
                    </View>
                  </View>

                  {/* Performance Metrics */}
                  <View style={styles.infoSection}>
                    <Text style={styles.sectionTitle}>Performance Metrics</Text>
                    <View style={styles.metricsGrid}>
                      <View style={styles.metricCard}>
                        <Text style={[styles.metricCardValue, { color: getScoreColor(selectedWorker.safetyScore) }]}>
                          {selectedWorker.safetyScore}%
                        </Text>
                        <Text style={styles.metricCardLabel}>Safety Score</Text>
                      </View>
                      <View style={styles.metricCard}>
                        <Text style={[styles.metricCardValue, { color: '#10B981' }]}>
                          {selectedWorker.attendance.present}
                        </Text>
                        <Text style={styles.metricCardLabel}>Days Present</Text>
                      </View>
                      <View style={styles.metricCard}>
                        <Text style={[styles.metricCardValue, { color: '#F59E0B' }]}>
                          {selectedWorker.attendance.leave}
                        </Text>
                        <Text style={styles.metricCardLabel}>Days Leave</Text>
                      </View>
                      <View style={styles.metricCard}>
                        <Text style={[styles.metricCardValue, { color: '#EF4444' }]}>
                          {selectedWorker.attendance.absent}
                        </Text>
                        <Text style={styles.metricCardLabel}>Days Absent</Text>
                      </View>
                    </View>
                  </View>

                  {/* Certifications */}
                  <View style={styles.infoSection}>
                    <Text style={styles.sectionTitle}>Certifications</Text>
                    <View style={styles.certificationsContainer}>
                      {selectedWorker.certifications.map((cert, index) => (
                        <View key={index} style={styles.certBadge}>
                          <CheckCircle size={16} color={COLORS.primary} />
                          <Text style={styles.certText}>{cert}</Text>
                        </View>
                      ))}
                    </View>
                  </View>

                  {/* Emergency Contact */}
                  <View style={styles.infoSection}>
                    <Text style={styles.sectionTitle}>Emergency Contact</Text>
                    <View style={styles.emergencyCard}>
                      <View style={styles.infoRow}>
                        <User size={18} color={COLORS.textMuted} />
                        <Text style={styles.infoLabel}>Name:</Text>
                        <Text style={styles.infoValue}>{selectedWorker.emergencyContact.name}</Text>
                      </View>
                      <View style={styles.infoRow}>
                        <Phone size={18} color={COLORS.textMuted} />
                        <Text style={styles.infoLabel}>Phone:</Text>
                        <Text style={styles.infoValue}>{selectedWorker.emergencyContact.phone}</Text>
                      </View>
                      <View style={styles.infoRow}>
                        <User size={18} color={COLORS.textMuted} />
                        <Text style={styles.infoLabel}>Relation:</Text>
                        <Text style={styles.infoValue}>{selectedWorker.emergencyContact.relation}</Text>
                      </View>
                    </View>
                  </View>
                </ScrollView>
              </>
            )}
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
  filterButton: {
    padding: 8,
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
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.card,
    borderRadius: 12,
    paddingHorizontal: 16,
    marginHorizontal: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  searchInput: {
    flex: 1,
    paddingVertical: 14,
    paddingLeft: 12,
    fontSize: 16,
    color: COLORS.text,
  },
  filterContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    marginBottom: 20,
    gap: 8,
  },
  filterTab: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 8,
    backgroundColor: COLORS.card,
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: 'center',
  },
  filterTabActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  filterText: {
    fontSize: 13,
    color: COLORS.textMuted,
    fontWeight: '500',
  },
  filterTextActive: {
    color: '#FFFFFF',
  },
  workersContainer: {
    padding: 20,
  },
  workerCard: {
    backgroundColor: COLORS.card,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  workerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  workerMainInfo: {
    flex: 1,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  workerName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.text,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  workerRole: {
    fontSize: 13,
    color: COLORS.textMuted,
  },
  shiftBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    height: 32,
    justifyContent: 'center',
  },
  shiftText: {
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'capitalize',
  },
  workerDetails: {
    gap: 8,
    marginBottom: 12,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  detailText: {
    fontSize: 13,
    color: COLORS.textMuted,
  },
  workerMetrics: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  metricItem: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  metricDivider: {
    width: 1,
    height: 40,
    backgroundColor: COLORS.border,
    marginHorizontal: 12,
  },
  metricInfo: {
    flex: 1,
  },
  metricLabel: {
    fontSize: 11,
    color: COLORS.textMuted,
    marginBottom: 2,
  },
  metricValue: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 16,
    color: COLORS.textMuted,
    marginTop: 16,
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
  infoSection: {
    marginBottom: 24,
  },
  profileHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  profileIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: COLORS.primary + '20',
    alignItems: 'center',
    justifyContent: 'center',
  },
  profileInfo: {
    flex: 1,
  },
  profileName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: 4,
  },
  profileRole: {
    fontSize: 14,
    color: COLORS.textMuted,
    marginBottom: 8,
  },
  profileStatus: {
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 6,
  },
  profileStatusText: {
    fontSize: 12,
    fontWeight: '600',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: 12,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 12,
  },
  infoLabel: {
    fontSize: 14,
    color: COLORS.textMuted,
    width: 100,
  },
  infoValue: {
    flex: 1,
    fontSize: 14,
    color: COLORS.text,
    fontWeight: '500',
  },
  metricsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  metricCard: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: COLORS.card,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  metricCardValue: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  metricCardLabel: {
    fontSize: 12,
    color: COLORS.textMuted,
    textAlign: 'center',
  },
  certificationsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  certBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: COLORS.primary + '20',
    borderRadius: 8,
  },
  certText: {
    fontSize: 13,
    color: COLORS.primary,
    fontWeight: '500',
  },
  emergencyCard: {
    backgroundColor: COLORS.card,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
});
