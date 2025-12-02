import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, TextInput, StyleSheet, Alert, Modal } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { ArrowLeft, Plus, CheckCircle, Clock, AlertTriangle, User, Calendar } from '../../components/Icons';
import { COLORS } from '../../constants/styles';
import { useSupervisor } from '@/contexts/SupervisorContext';

interface Task {
  id: string;
  title: string;
  description: string;
  assignedTo: string[];
  priority: 'low' | 'medium' | 'high';
  status: 'pending' | 'in-progress' | 'completed';
  dueDate: string;
  createdAt: string;
}

interface Miner {
  id: string;
  name: string;
  role: string;
  status: 'active' | 'inactive';
}

export default function TaskAssignment() {
  const router = useRouter();
  const { assignedMiners, loading: minersLoading } = useSupervisor();
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedFilter, setSelectedFilter] = useState<'all' | 'pending' | 'in-progress' | 'completed'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [miners, setMiners] = useState<Miner[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  
  // New task form state
  const [newTask, setNewTask] = useState({
    title: '',
    description: '',
    priority: 'medium' as 'low' | 'medium' | 'high',
    assignedTo: [] as string[],
    dueDate: new Date().toISOString().split('T')[0],
  });

  useEffect(() => {
    if (assignedMiners.length > 0) {
      generateData();
    }
  }, [assignedMiners]);

  const generateData = () => {
    console.log('📋 Generating task assignment data for', assignedMiners.length, 'miners');
    
    // Convert to Miner[] format
    const minerData: Miner[] = assignedMiners.map((miner) => ({
      id: miner.id,
      name: miner.name,
      role: miner.role || 'Miner',
      status: 'active' as const,
    }));
    setMiners(minerData);
    
    // Generate sample tasks
    const taskTitles = [
      'Safety Equipment Check',
      'Tunnel Wall Inspection',
      'Ventilation System Maintenance',
    ];
    const taskDescriptions = [
      'Inspect all safety equipment in assigned section',
      'Check for cracks and structural issues',
      'Clean and test ventilation fans',
    ];
    const priorities: ('high' | 'medium' | 'low')[] = ['high', 'medium', 'high'];
    const statuses: ('in-progress' | 'pending' | 'completed')[] = ['in-progress', 'pending', 'completed'];
    
    const tasksData: Task[] = minerData.slice(0, 3).map((miner, index) => ({
      id: miner.id + '_task',
      title: taskTitles[index % 3],
      description: taskDescriptions[index % 3],
      assignedTo: [miner.id],
      priority: priorities[index % 3],
      status: statuses[index % 3],
      dueDate: new Date(Date.now() + (index + 1) * 86400000).toISOString().split('T')[0],
      createdAt: new Date().toISOString().split('T')[0],
    }));
    
    setTasks(tasksData);
    console.log('✅ Generated', tasksData.length, 'tasks for', minerData.length, 'miners');
  };

  const handleCreateTask = () => {
    if (!newTask.title.trim()) {
      Alert.alert('Error', 'Please enter a task title');
      return;
    }
    if (newTask.assignedTo.length === 0) {
      Alert.alert('Error', 'Please assign at least one miner');
      return;
    }

    const task: Task = {
      id: Date.now().toString(),
      title: newTask.title,
      description: newTask.description,
      assignedTo: newTask.assignedTo,
      priority: newTask.priority,
      status: 'pending',
      dueDate: newTask.dueDate,
      createdAt: new Date().toISOString().split('T')[0],
    };

    setTasks([task, ...tasks]);
    setShowCreateModal(false);
    setNewTask({
      title: '',
      description: '',
      priority: 'medium',
      assignedTo: [],
      dueDate: new Date().toISOString().split('T')[0],
    });
    Alert.alert('Success', 'Task created successfully');
  };

  const toggleMinerSelection = (minerId: string) => {
    setNewTask(prev => ({
      ...prev,
      assignedTo: prev.assignedTo.includes(minerId)
        ? prev.assignedTo.filter(id => id !== minerId)
        : [...prev.assignedTo, minerId]
    }));
  };

  const updateTaskStatus = (taskId: string, newStatus: Task['status']) => {
    setTasks(tasks.map(task => 
      task.id === taskId ? { ...task, status: newStatus } : task
    ));
  };

  const getMinerName = (minerId: string) => {
    return miners.find(m => m.id === minerId)?.name || 'Unknown';
  };

  const filteredTasks = tasks.filter(task => {
    const matchesFilter = selectedFilter === 'all' || task.status === selectedFilter;
    const matchesSearch = task.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          task.description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return '#EF4444';
      case 'medium': return '#F59E0B';
      case 'low': return '#10B981';
      default: return COLORS.textMuted;
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed': return CheckCircle;
      case 'in-progress': return Clock;
      default: return AlertTriangle;
    }
  };

  const stats = {
    total: tasks.length,
    pending: tasks.filter(t => t.status === 'pending').length,
    inProgress: tasks.filter(t => t.status === 'in-progress').length,
    completed: tasks.filter(t => t.status === 'completed').length,
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <ArrowLeft size={24} color={COLORS.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Task Assignment</Text>
        <TouchableOpacity onPress={() => setShowCreateModal(true)} style={styles.addButton}>
          <Plus size={24} color="#FFFFFF" />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content}>
        {/* Stats Cards */}
        <View style={styles.statsContainer}>
          <View style={styles.statCard}>
            <Text style={[styles.statValue, { color: COLORS.primary }]}>{stats.total}</Text>
            <Text style={styles.statLabel}>Total Tasks</Text>
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

        {/* Search Bar */}
        <View style={styles.searchContainer}>
          <TextInput
            style={styles.searchInput}
            placeholder="Search tasks..."
            placeholderTextColor={COLORS.textMuted}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>

        {/* Filter Tabs */}
        <View style={styles.filterContainer}>
          {(['all', 'pending', 'in-progress', 'completed'] as const).map((filter) => (
            <TouchableOpacity
              key={filter}
              style={[styles.filterTab, selectedFilter === filter && styles.filterTabActive]}
              onPress={() => setSelectedFilter(filter)}
            >
              <Text style={[styles.filterText, selectedFilter === filter && styles.filterTextActive]}>
                {filter.charAt(0).toUpperCase() + filter.slice(1).replace('-', ' ')}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Tasks List */}
        <View style={styles.tasksContainer}>
          {filteredTasks.length === 0 ? (
            <View style={styles.emptyState}>
              <AlertTriangle size={48} color={COLORS.textMuted} />
              <Text style={styles.emptyText}>No tasks found</Text>
            </View>
          ) : (
            filteredTasks.map((task) => {
              const StatusIcon = getStatusIcon(task.status);
              return (
                <View key={task.id} style={styles.taskCard}>
                  <View style={styles.taskHeader}>
                    <View style={styles.taskTitleRow}>
                      <Text style={styles.taskTitle}>{task.title}</Text>
                      <View style={[styles.priorityBadge, { backgroundColor: getPriorityColor(task.priority) + '20' }]}>
                        <Text style={[styles.priorityText, { color: getPriorityColor(task.priority) }]}>
                          {task.priority}
                        </Text>
                      </View>
                    </View>
                    <Text style={styles.taskDescription}>{task.description}</Text>
                  </View>

                  <View style={styles.taskMeta}>
                    <View style={styles.metaRow}>
                      <User size={16} color={COLORS.textMuted} />
                      <Text style={styles.metaText}>
                        {task.assignedTo.map(id => getMinerName(id)).join(', ')}
                      </Text>
                    </View>
                    <View style={styles.metaRow}>
                      <Calendar size={16} color={COLORS.textMuted} />
                      <Text style={styles.metaText}>Due: {task.dueDate}</Text>
                    </View>
                  </View>

                  <View style={styles.taskActions}>
                    <View style={styles.statusBadge}>
                      <StatusIcon size={16} color={COLORS.text} />
                      <Text style={styles.statusText}>{task.status}</Text>
                    </View>
                    
                    {task.status !== 'completed' && (
                      <View style={styles.actionButtons}>
                        {task.status === 'pending' && (
                          <TouchableOpacity
                            style={[styles.actionButton, { backgroundColor: '#06B6D4' + '20' }]}
                            onPress={() => updateTaskStatus(task.id, 'in-progress')}
                          >
                            <Text style={[styles.actionButtonText, { color: '#06B6D4' }]}>Start</Text>
                          </TouchableOpacity>
                        )}
                        {task.status === 'in-progress' && (
                          <TouchableOpacity
                            style={[styles.actionButton, { backgroundColor: '#10B981' + '20' }]}
                            onPress={() => updateTaskStatus(task.id, 'completed')}
                          >
                            <Text style={[styles.actionButtonText, { color: '#10B981' }]}>Complete</Text>
                          </TouchableOpacity>
                        )}
                      </View>
                    )}
                  </View>
                </View>
              );
            })
          )}
        </View>
      </ScrollView>

      {/* Create Task Modal */}
      <Modal
        visible={showCreateModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowCreateModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Create New Task</Text>
              <TouchableOpacity onPress={() => setShowCreateModal(false)}>
                <Text style={styles.modalClose}>✕</Text>
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalBody}>
              <Text style={styles.label}>Task Title *</Text>
              <TextInput
                style={styles.input}
                placeholder="Enter task title"
                placeholderTextColor={COLORS.textMuted}
                value={newTask.title}
                onChangeText={(text) => setNewTask({ ...newTask, title: text })}
              />

              <Text style={styles.label}>Description</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                placeholder="Enter task description"
                placeholderTextColor={COLORS.textMuted}
                value={newTask.description}
                onChangeText={(text) => setNewTask({ ...newTask, description: text })}
                multiline
                numberOfLines={4}
              />

              <Text style={styles.label}>Priority</Text>
              <View style={styles.prioritySelector}>
                {(['low', 'medium', 'high'] as const).map((priority) => (
                  <TouchableOpacity
                    key={priority}
                    style={[
                      styles.priorityOption,
                      newTask.priority === priority && styles.priorityOptionActive,
                      { borderColor: getPriorityColor(priority) }
                    ]}
                    onPress={() => setNewTask({ ...newTask, priority })}
                  >
                    <Text style={[
                      styles.priorityOptionText,
                      newTask.priority === priority && { color: getPriorityColor(priority) }
                    ]}>
                      {priority}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              <Text style={styles.label}>Due Date</Text>
              <TextInput
                style={styles.input}
                placeholder="YYYY-MM-DD"
                placeholderTextColor={COLORS.textMuted}
                value={newTask.dueDate}
                onChangeText={(text) => setNewTask({ ...newTask, dueDate: text })}
              />

              <Text style={styles.label}>Assign To *</Text>
              <View style={styles.minersList}>
                {miners.map((miner) => (
                  <TouchableOpacity
                    key={miner.id}
                    style={[
                      styles.minerOption,
                      newTask.assignedTo.includes(miner.id) && styles.minerOptionSelected
                    ]}
                    onPress={() => toggleMinerSelection(miner.id)}
                  >
                    <View style={styles.minerInfo}>
                      <User size={20} color={COLORS.text} />
                      <Text style={styles.minerName}>{miner.name}</Text>
                    </View>
                    {newTask.assignedTo.includes(miner.id) && (
                      <CheckCircle size={20} color={COLORS.primary} />
                    )}
                  </TouchableOpacity>
                ))}
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
                onPress={handleCreateTask}
              >
                <Text style={styles.createButtonText}>Create Task</Text>
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
    fontSize: 12,
    color: COLORS.textMuted,
  },
  searchContainer: {
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  searchInput: {
    backgroundColor: COLORS.card,
    borderRadius: 12,
    padding: 14,
    fontSize: 16,
    color: COLORS.text,
    borderWidth: 1,
    borderColor: COLORS.border,
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
    paddingHorizontal: 12,
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
  tasksContainer: {
    padding: 20,
  },
  taskCard: {
    backgroundColor: COLORS.card,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  taskHeader: {
    marginBottom: 12,
  },
  taskTitleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  taskTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.text,
    flex: 1,
  },
  priorityBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
    marginLeft: 8,
  },
  priorityText: {
    fontSize: 11,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  taskDescription: {
    fontSize: 14,
    color: COLORS.textMuted,
    lineHeight: 20,
  },
  taskMeta: {
    gap: 8,
    marginBottom: 12,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  metaText: {
    fontSize: 13,
    color: COLORS.textMuted,
  },
  taskActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: COLORS.background,
    borderRadius: 8,
  },
  statusText: {
    fontSize: 13,
    color: COLORS.text,
    fontWeight: '500',
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  actionButtonText: {
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
  textArea: {
    height: 100,
    textAlignVertical: 'top',
  },
  prioritySelector: {
    flexDirection: 'row',
    gap: 12,
  },
  priorityOption: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 2,
    alignItems: 'center',
    backgroundColor: COLORS.card,
  },
  priorityOptionActive: {
    backgroundColor: COLORS.background,
  },
  priorityOptionText: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.textMuted,
    textTransform: 'capitalize',
  },
  minersList: {
    gap: 8,
  },
  minerOption: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 14,
    backgroundColor: COLORS.card,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  minerOptionSelected: {
    borderColor: COLORS.primary,
    backgroundColor: COLORS.primary + '10',
  },
  minerInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  minerName: {
    fontSize: 15,
    color: COLORS.text,
    fontWeight: '500',
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
