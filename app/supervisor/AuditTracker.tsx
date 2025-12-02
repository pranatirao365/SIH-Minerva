import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Alert, Modal, TextInput } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { ArrowLeft, Plus, CheckCircle, XCircle, AlertTriangle, Calendar, MapPin, User, FileText, Clock } from '../../components/Icons';
import { COLORS } from '../../constants/styles';

interface AuditItem {
  id: string;
  question: string;
  status: 'pass' | 'fail' | 'na';
  notes: string;
}

interface Audit {
  id: string;
  title: string;
  location: string;
  auditor: string;
  date: string;
  time: string;
  status: 'pending' | 'in-progress' | 'completed';
  score: number;
  items: AuditItem[];
  overallNotes: string;
}

const defaultAuditChecklist: Omit<AuditItem, 'status' | 'notes'>[] = [
  { id: '1', question: 'All workers wearing proper PPE (helmet, boots, gloves)?' },
  { id: '2', question: 'Emergency exits clearly marked and unobstructed?' },
  { id: '3', question: 'Fire extinguishers present and accessible?' },
  { id: '4', question: 'First aid kits stocked and available?' },
  { id: '5', question: 'Ventilation systems functioning properly?' },
  { id: '6', question: 'No exposed electrical wiring or hazards?' },
  { id: '7', question: 'Proper lighting in all work areas?' },
  { id: '8', question: 'Safety signs and warnings visible?' },
  { id: '9', question: 'Equipment in good working condition?' },
  { id: '10', question: 'Housekeeping and cleanliness maintained?' },
];

export default function AuditTracker() {
  const router = useRouter();
  const [selectedFilter, setSelectedFilter] = useState<'all' | 'pending' | 'in-progress' | 'completed'>('all');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [selectedAudit, setSelectedAudit] = useState<Audit | null>(null);
  
  const [newAudit, setNewAudit] = useState({
    title: '',
    location: 'Section A',
    date: new Date().toISOString().split('T')[0],
    time: new Date().toTimeString().slice(0, 5),
  });

  // Mock data
  const [audits, setAudits] = useState<Audit[]>([
    {
      id: '1',
      title: 'Monthly Safety Inspection',
      location: 'Section A',
      auditor: 'Supervisor John',
      date: '2025-12-01',
      time: '10:00',
      status: 'completed',
      score: 92,
      items: defaultAuditChecklist.map(item => ({
        ...item,
        status: Math.random() > 0.2 ? 'pass' : 'fail' as 'pass' | 'fail',
        notes: '',
      })),
      overallNotes: 'Overall good compliance. Minor issues with housekeeping in storage area.',
    },
    {
      id: '2',
      title: 'Weekly Equipment Check',
      location: 'Section B',
      auditor: 'Supervisor John',
      date: '2025-12-02',
      time: '14:00',
      status: 'in-progress',
      score: 0,
      items: defaultAuditChecklist.map(item => ({
        ...item,
        status: 'na' as 'na',
        notes: '',
      })),
      overallNotes: '',
    },
    {
      id: '3',
      title: 'PPE Compliance Audit',
      location: 'Section C',
      auditor: 'Supervisor John',
      date: '2025-12-03',
      time: '09:00',
      status: 'pending',
      score: 0,
      items: defaultAuditChecklist.map(item => ({
        ...item,
        status: 'na' as 'na',
        notes: '',
      })),
      overallNotes: '',
    },
  ]);

  const handleCreateAudit = () => {
    if (!newAudit.title.trim()) {
      Alert.alert('Error', 'Please enter audit title');
      return;
    }

    const audit: Audit = {
      id: Date.now().toString(),
      title: newAudit.title,
      location: newAudit.location,
      auditor: 'Supervisor John',
      date: newAudit.date,
      time: newAudit.time,
      status: 'pending',
      score: 0,
      items: defaultAuditChecklist.map(item => ({
        ...item,
        status: 'na',
        notes: '',
      })),
      overallNotes: '',
    };

    setAudits([audit, ...audits]);
    setShowCreateModal(false);
    setNewAudit({
      title: '',
      location: 'Section A',
      date: new Date().toISOString().split('T')[0],
      time: new Date().toTimeString().slice(0, 5),
    });
    Alert.alert('Success', 'Audit created successfully');
  };

  const handleViewDetails = (audit: Audit) => {
    setSelectedAudit(audit);
    setShowDetailsModal(true);
  };

  const updateAuditItemStatus = (itemId: string, status: 'pass' | 'fail' | 'na') => {
    if (!selectedAudit) return;
    
    const updatedItems = selectedAudit.items.map(item =>
      item.id === itemId ? { ...item, status } : item
    );
    
    const passCount = updatedItems.filter(i => i.status === 'pass').length;
    const totalAnswered = updatedItems.filter(i => i.status !== 'na').length;
    const score = totalAnswered > 0 ? Math.round((passCount / totalAnswered) * 100) : 0;
    
    const updatedAudit = {
      ...selectedAudit,
      items: updatedItems,
      score,
      status: (updatedItems.every(i => i.status !== 'na') ? 'completed' : 'in-progress') as Audit['status'],
    };
    
    setSelectedAudit(updatedAudit);
    setAudits(audits.map(a => a.id === updatedAudit.id ? updatedAudit : a));
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return '#F59E0B';
      case 'in-progress': return '#06B6D4';
      case 'completed': return '#10B981';
      default: return COLORS.textMuted;
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 90) return '#10B981';
    if (score >= 75) return '#F59E0B';
    return '#EF4444';
  };

  const filteredAudits = audits.filter(audit =>
    selectedFilter === 'all' || audit.status === selectedFilter
  );

  const stats = {
    total: audits.length,
    pending: audits.filter(a => a.status === 'pending').length,
    inProgress: audits.filter(a => a.status === 'in-progress').length,
    completed: audits.filter(a => a.status === 'completed').length,
    avgScore: audits.filter(a => a.status === 'completed').length > 0
      ? Math.round(audits.filter(a => a.status === 'completed').reduce((sum, a) => sum + a.score, 0) / audits.filter(a => a.status === 'completed').length)
      : 0,
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <ArrowLeft size={24} color={COLORS.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Audit Tracker</Text>
        <TouchableOpacity onPress={() => setShowCreateModal(true)} style={styles.addButton}>
          <Plus size={24} color="#FFFFFF" />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content}>
        {/* Stats Cards */}
        <View style={styles.statsContainer}>
          <View style={styles.statCard}>
            <Text style={[styles.statValue, { color: COLORS.primary }]}>{stats.total}</Text>
            <Text style={styles.statLabel}>Total Audits</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={[styles.statValue, { color: '#F59E0B' }]}>{stats.pending}</Text>
            <Text style={styles.statLabel}>Pending</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={[styles.statValue, { color: '#06B6D4' }]}>{stats.inProgress}</Text>
            <Text style={styles.statLabel}>In Progress</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={[styles.statValue, { color: '#10B981' }]}>{stats.completed}</Text>
            <Text style={styles.statLabel}>Completed</Text>
          </View>
        </View>

        {/* Average Score Card */}
        {stats.completed > 0 && (
          <View style={styles.scoreCard}>
            <Text style={styles.scoreCardTitle}>Average Safety Score</Text>
            <Text style={[styles.scoreCardValue, { color: getScoreColor(stats.avgScore) }]}>
              {stats.avgScore}%
            </Text>
            <Text style={styles.scoreCardSubtext}>Based on {stats.completed} completed audits</Text>
          </View>
        )}

        {/* Filter Tabs */}
        <View style={styles.filterContainer}>
          {(['all', 'pending', 'in-progress', 'completed'] as const).map((filter) => (
            <TouchableOpacity
              key={filter}
              style={[styles.filterTab, selectedFilter === filter && styles.filterTabActive]}
              onPress={() => setSelectedFilter(filter)}
            >
              <Text style={[styles.filterText, selectedFilter === filter && styles.filterTextActive]}>
                {filter === 'all' ? 'All' : filter === 'in-progress' ? 'In Progress' : filter.charAt(0).toUpperCase() + filter.slice(1)}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Audits List */}
        <View style={styles.auditsContainer}>
          {filteredAudits.length === 0 ? (
            <View style={styles.emptyState}>
              <FileText size={48} color={COLORS.textMuted} />
              <Text style={styles.emptyText}>No audits found</Text>
            </View>
          ) : (
            filteredAudits.map((audit) => (
              <TouchableOpacity
                key={audit.id}
                style={styles.auditCard}
                onPress={() => handleViewDetails(audit)}
              >
                <View style={styles.auditHeader}>
                  <View style={styles.auditMainInfo}>
                    <Text style={styles.auditTitle}>{audit.title}</Text>
                    <View style={styles.auditMeta}>
                      <MapPin size={14} color={COLORS.textMuted} />
                      <Text style={styles.auditMetaText}>{audit.location}</Text>
                      <Calendar size={14} color={COLORS.textMuted} />
                      <Text style={styles.auditMetaText}>{audit.date}</Text>
                      <Clock size={14} color={COLORS.textMuted} />
                      <Text style={styles.auditMetaText}>{audit.time}</Text>
                    </View>
                  </View>
                  <View style={[styles.statusBadge, { backgroundColor: getStatusColor(audit.status) + '20' }]}>
                    <Text style={[styles.statusText, { color: getStatusColor(audit.status) }]}>
                      {audit.status === 'in-progress' ? 'In Progress' : audit.status.charAt(0).toUpperCase() + audit.status.slice(1)}
                    </Text>
                  </View>
                </View>

                <View style={styles.auditFooter}>
                  <View style={styles.auditorInfo}>
                    <User size={16} color={COLORS.textMuted} />
                    <Text style={styles.auditorText}>{audit.auditor}</Text>
                  </View>
                  {audit.status === 'completed' && (
                    <View style={styles.scoreDisplay}>
                      <Text style={[styles.scoreText, { color: getScoreColor(audit.score) }]}>
                        Score: {audit.score}%
                      </Text>
                    </View>
                  )}
                </View>
              </TouchableOpacity>
            ))
          )}
        </View>
      </ScrollView>

      {/* Create Audit Modal */}
      <Modal
        visible={showCreateModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowCreateModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Create New Audit</Text>
              <TouchableOpacity onPress={() => setShowCreateModal(false)}>
                <Text style={styles.modalClose}>✕</Text>
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalBody}>
              <Text style={styles.label}>Audit Title *</Text>
              <TextInput
                style={styles.input}
                placeholder="e.g., Weekly Safety Inspection"
                placeholderTextColor={COLORS.textMuted}
                value={newAudit.title}
                onChangeText={(text) => setNewAudit({ ...newAudit, title: text })}
              />

              <Text style={styles.label}>Location *</Text>
              <View style={styles.locationSelector}>
                {['Section A', 'Section B', 'Section C'].map((location) => (
                  <TouchableOpacity
                    key={location}
                    style={[
                      styles.locationOption,
                      newAudit.location === location && styles.locationOptionActive
                    ]}
                    onPress={() => setNewAudit({ ...newAudit, location })}
                  >
                    <Text style={[
                      styles.locationText,
                      newAudit.location === location && styles.locationTextActive
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
                value={newAudit.date}
                onChangeText={(text) => setNewAudit({ ...newAudit, date: text })}
              />

              <Text style={styles.label}>Time *</Text>
              <TextInput
                style={styles.input}
                placeholder="HH:MM"
                placeholderTextColor={COLORS.textMuted}
                value={newAudit.time}
                onChangeText={(text) => setNewAudit({ ...newAudit, time: text })}
              />

              <View style={styles.infoBox}>
                <Text style={styles.infoText}>
                  A standard safety checklist will be created for this audit.
                </Text>
              </View>
            </ScrollView>

            <View style={styles.modalFooter}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => setShowCreateModal(false)}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.createButton]}
                onPress={handleCreateAudit}
              >
                <Text style={styles.createButtonText}>Create Audit</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Audit Details Modal */}
      <Modal
        visible={showDetailsModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowDetailsModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            {selectedAudit && (
              <>
                <View style={styles.modalHeader}>
                  <Text style={styles.modalTitle}>{selectedAudit.title}</Text>
                  <TouchableOpacity onPress={() => setShowDetailsModal(false)}>
                    <Text style={styles.modalClose}>✕</Text>
                  </TouchableOpacity>
                </View>

                <ScrollView style={styles.modalBody}>
                  {/* Audit Info */}
                  <View style={styles.auditInfoCard}>
                    <View style={styles.infoRow}>
                      <MapPin size={18} color={COLORS.textMuted} />
                      <Text style={styles.infoLabel}>Location:</Text>
                      <Text style={styles.infoValue}>{selectedAudit.location}</Text>
                    </View>
                    <View style={styles.infoRow}>
                      <Calendar size={18} color={COLORS.textMuted} />
                      <Text style={styles.infoLabel}>Date:</Text>
                      <Text style={styles.infoValue}>{selectedAudit.date}</Text>
                    </View>
                    <View style={styles.infoRow}>
                      <Clock size={18} color={COLORS.textMuted} />
                      <Text style={styles.infoLabel}>Time:</Text>
                      <Text style={styles.infoValue}>{selectedAudit.time}</Text>
                    </View>
                    <View style={styles.infoRow}>
                      <User size={18} color={COLORS.textMuted} />
                      <Text style={styles.infoLabel}>Auditor:</Text>
                      <Text style={styles.infoValue}>{selectedAudit.auditor}</Text>
                    </View>
                  </View>

                  {/* Checklist */}
                  <Text style={styles.sectionTitle}>Safety Checklist</Text>
                  {selectedAudit.items.map((item, index) => (
                    <View key={item.id} style={styles.checklistItem}>
                      <Text style={styles.checklistQuestion}>
                        {index + 1}. {item.question}
                      </Text>
                      <View style={styles.checklistActions}>
                        <TouchableOpacity
                          style={[
                            styles.checklistButton,
                            item.status === 'pass' && styles.checklistButtonPass
                          ]}
                          onPress={() => updateAuditItemStatus(item.id, 'pass')}
                        >
                          <CheckCircle size={18} color={item.status === 'pass' ? '#FFFFFF' : '#10B981'} />
                          <Text style={[
                            styles.checklistButtonText,
                            item.status === 'pass' && styles.checklistButtonTextActive
                          ]}>Pass</Text>
                        </TouchableOpacity>
                        
                        <TouchableOpacity
                          style={[
                            styles.checklistButton,
                            item.status === 'fail' && styles.checklistButtonFail
                          ]}
                          onPress={() => updateAuditItemStatus(item.id, 'fail')}
                        >
                          <XCircle size={18} color={item.status === 'fail' ? '#FFFFFF' : '#EF4444'} />
                          <Text style={[
                            styles.checklistButtonText,
                            item.status === 'fail' && styles.checklistButtonTextActive
                          ]}>Fail</Text>
                        </TouchableOpacity>
                        
                        <TouchableOpacity
                          style={[
                            styles.checklistButton,
                            item.status === 'na' && styles.checklistButtonNA
                          ]}
                          onPress={() => updateAuditItemStatus(item.id, 'na')}
                        >
                          <Text style={[
                            styles.checklistButtonText,
                            item.status === 'na' && styles.checklistButtonTextActive
                          ]}>N/A</Text>
                        </TouchableOpacity>
                      </View>
                    </View>
                  ))}

                  {/* Score Display */}
                  {selectedAudit.status !== 'pending' && (
                    <View style={styles.scoreSection}>
                      <Text style={styles.scoreSectionTitle}>Current Score</Text>
                      <Text style={[styles.scoreSectionValue, { color: getScoreColor(selectedAudit.score) }]}>
                        {selectedAudit.score}%
                      </Text>
                      <Text style={styles.scoreSectionSubtext}>
                        {selectedAudit.items.filter(i => i.status === 'pass').length} of{' '}
                        {selectedAudit.items.filter(i => i.status !== 'na').length} items passed
                      </Text>
                    </View>
                  )}
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
  scoreCard: {
    marginHorizontal: 20,
    marginBottom: 20,
    backgroundColor: COLORS.card,
    padding: 20,
    borderRadius: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  scoreCardTitle: {
    fontSize: 14,
    color: COLORS.textMuted,
    marginBottom: 8,
  },
  scoreCardValue: {
    fontSize: 48,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  scoreCardSubtext: {
    fontSize: 12,
    color: COLORS.textMuted,
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
  auditsContainer: {
    padding: 20,
  },
  auditCard: {
    backgroundColor: COLORS.card,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  auditHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  auditMainInfo: {
    flex: 1,
  },
  auditTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: 8,
  },
  auditMeta: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: 6,
  },
  auditMetaText: {
    fontSize: 12,
    color: COLORS.textMuted,
    marginRight: 8,
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    height: 32,
    justifyContent: 'center',
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
  },
  auditFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  auditorInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  auditorText: {
    fontSize: 13,
    color: COLORS.textMuted,
  },
  scoreDisplay: {
    backgroundColor: COLORS.background,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  scoreText: {
    fontSize: 13,
    fontWeight: '600',
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
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 8,
    marginTop: 12,
  },
  input: {
    backgroundColor: COLORS.card,
    borderRadius: 12,
    padding: 14,
    fontSize: 16,
    color: COLORS.text,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  locationSelector: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 8,
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
  infoBox: {
    backgroundColor: COLORS.primary + '20',
    padding: 16,
    borderRadius: 12,
    marginTop: 16,
  },
  infoText: {
    fontSize: 13,
    color: COLORS.text,
    lineHeight: 20,
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
  auditInfoCard: {
    backgroundColor: COLORS.card,
    padding: 16,
    borderRadius: 12,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: COLORS.border,
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
    width: 80,
  },
  infoValue: {
    flex: 1,
    fontSize: 14,
    color: COLORS.text,
    fontWeight: '500',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: 16,
  },
  checklistItem: {
    backgroundColor: COLORS.card,
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  checklistQuestion: {
    fontSize: 14,
    color: COLORS.text,
    marginBottom: 12,
    lineHeight: 20,
  },
  checklistActions: {
    flexDirection: 'row',
    gap: 8,
  },
  checklistButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    borderRadius: 8,
    backgroundColor: COLORS.background,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  checklistButtonPass: {
    backgroundColor: '#10B981',
    borderColor: '#10B981',
  },
  checklistButtonFail: {
    backgroundColor: '#EF4444',
    borderColor: '#EF4444',
  },
  checklistButtonNA: {
    backgroundColor: COLORS.textMuted,
    borderColor: COLORS.textMuted,
  },
  checklistButtonText: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.text,
  },
  checklistButtonTextActive: {
    color: '#FFFFFF',
  },
  scoreSection: {
    backgroundColor: COLORS.card,
    padding: 24,
    borderRadius: 16,
    alignItems: 'center',
    marginTop: 20,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  scoreSectionTitle: {
    fontSize: 14,
    color: COLORS.textMuted,
    marginBottom: 8,
  },
  scoreSectionValue: {
    fontSize: 48,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  scoreSectionSubtext: {
    fontSize: 13,
    color: COLORS.textMuted,
  },
});
