import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
    Alert,
    RefreshControl,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ArrowLeft, Calendar, CheckCircle, CheckSquare, Clock } from '../../components/Icons';
import { COLORS } from '../../constants/styles';
import { useRoleStore } from '../../hooks/useRoleStore';

interface ChecklistItem {
  id: string;
  title: string;
  description: string;
  category: 'PPE' | 'Equipment' | 'Environment' | 'Health';
  required: boolean;
  checked: boolean;
}

interface ChecklistHistory {
  date: string;
  completedAt: number;
  items: ChecklistItem[];
  completionRate: number;
}

export default function DailyChecklist() {
  const router = useRouter();
  const { user } = useRoleStore();
  const [refreshing, setRefreshing] = useState(false);
  const [items, setItems] = useState<ChecklistItem[]>([
    {
      id: '1',
      title: 'Hard Hat',
      description: 'Check for cracks, adjust straps, ensure proper fit',
      category: 'PPE',
      required: true,
      checked: false,
    },
    {
      id: '2',
      title: 'Safety Boots',
      description: 'Inspect for damage, check steel toe, ensure laces are secure',
      category: 'PPE',
      required: true,
      checked: false,
    },
    {
      id: '3',
      title: 'Reflective Vest',
      description: 'Check visibility, ensure vest is clean and intact',
      category: 'PPE',
      required: true,
      checked: false,
    },
    {
      id: '4',
      title: 'Safety Gloves',
      description: 'Check for tears, ensure proper fit',
      category: 'PPE',
      required: true,
      checked: false,
    },
    {
      id: '5',
      title: 'Headlamp / Torch',
      description: 'Test battery, check beam strength, carry spare batteries',
      category: 'Equipment',
      required: true,
      checked: false,
    },
    {
      id: '6',
      title: 'Gas Detector',
      description: 'Calibrate sensor, test alarm, verify battery level',
      category: 'Equipment',
      required: true,
      checked: false,
    },
    {
      id: '7',
      title: 'Smart Helmet',
      description: 'Check WiFi connection, test sensors, verify battery',
      category: 'Equipment',
      required: true,
      checked: false,
    },
    {
      id: '8',
      title: 'Emergency Exits',
      description: 'Verify you know all emergency exit routes',
      category: 'Environment',
      required: true,
      checked: false,
    },
    {
      id: '9',
      title: 'Ventilation Check',
      description: 'Confirm adequate air circulation in work area',
      category: 'Environment',
      required: false,
      checked: false,
    },
    {
      id: '10',
      title: 'Physical Wellness',
      description: 'Check if you feel fit for work (rest, hydration, no injuries)',
      category: 'Health',
      required: true,
      checked: false,
    },
    {
      id: '11',
      title: 'Medication Check',
      description: 'Ensure you have necessary medications if required',
      category: 'Health',
      required: false,
      checked: false,
    },
  ]);

  const [todayCompleted, setTodayCompleted] = useState(false);
  const [history, setHistory] = useState<ChecklistHistory[]>([]);

  useEffect(() => {
    loadTodayChecklist();
    loadHistory();
  }, []);

  const loadTodayChecklist = async () => {
    try {
      const today = new Date().toDateString();
      const key = `checklist_${user.id}_${today}`;
      const stored = await AsyncStorage.getItem(key);
      
      if (stored) {
        const savedItems = JSON.parse(stored);
        setItems(savedItems);
        setTodayCompleted(savedItems.every((item: ChecklistItem) => !item.required || item.checked));
      }
    } catch (error) {
      console.error('Error loading checklist:', error);
    }
  };

  const loadHistory = async () => {
    try {
      const key = `checklist_history_${user.id}`;
      const stored = await AsyncStorage.getItem(key);
      
      if (stored) {
        const parsedHistory = JSON.parse(stored);
        setHistory(parsedHistory.slice(0, 7)); // Last 7 days
      }
    } catch (error) {
      console.error('Error loading history:', error);
    }
  };

  const toggleItem = async (itemId: string) => {
    const updatedItems = items.map(item =>
      item.id === itemId ? { ...item, checked: !item.checked } : item
    );
    
    setItems(updatedItems);

    // Save to AsyncStorage
    try {
      const today = new Date().toDateString();
      const key = `checklist_${user.id}_${today}`;
      await AsyncStorage.setItem(key, JSON.stringify(updatedItems));

      // Check if all required items are checked
      const allRequiredChecked = updatedItems.every(item => !item.required || item.checked);
      setTodayCompleted(allRequiredChecked);

      if (allRequiredChecked && !todayCompleted) {
        await saveToHistory(updatedItems);
        Alert.alert(
          '✅ Checklist Complete!',
          'All required safety checks completed. You\'re ready for work!',
          [{ text: 'Great!' }]
        );
      }
    } catch (error) {
      console.error('Error saving checklist:', error);
    }
  };

  const saveToHistory = async (completedItems: ChecklistItem[]) => {
    try {
      const today = new Date().toDateString();
      const completionRate = Math.round((completedItems.filter(i => i.checked).length / completedItems.length) * 100);
      
      const newEntry: ChecklistHistory = {
        date: today,
        completedAt: Date.now(),
        items: completedItems,
        completionRate,
      };

      const key = `checklist_history_${user.id}`;
      const stored = await AsyncStorage.getItem(key);
      const existingHistory: ChecklistHistory[] = stored ? JSON.parse(stored) : [];
      
      // Remove today's entry if it exists, then add new one
      const filteredHistory = existingHistory.filter(h => h.date !== today);
      const updatedHistory = [newEntry, ...filteredHistory].slice(0, 30); // Keep last 30 days
      
      await AsyncStorage.setItem(key, JSON.stringify(updatedHistory));
      setHistory(updatedHistory.slice(0, 7));
    } catch (error) {
      console.error('Error saving to history:', error);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadTodayChecklist();
    await loadHistory();
    setRefreshing(false);
  };

  const requiredItems = items.filter(i => i.required);
  const completedRequired = requiredItems.filter(i => i.checked).length;
  const completionPercentage = Math.round((completedRequired / requiredItems.length) * 100);

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'PPE': return '🦺';
      case 'Equipment': return '🔧';
      case 'Environment': return '🌍';
      case 'Health': return '❤️';
      default: return '✓';
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <ArrowLeft size={24} color={COLORS.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Daily Safety Checklist</Text>
        <View style={styles.backButton} />
      </View>

      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={COLORS.primary} />
        }
      >
        {/* Progress Card */}
        <View style={styles.progressCard}>
          <View style={styles.progressHeader}>
            <Calendar size={24} color={COLORS.primary} />
            <Text style={styles.progressDate}>{new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}</Text>
          </View>
          
          <View style={styles.progressBar}>
            <View style={[styles.progressFill, { width: `${completionPercentage}%` }]} />
          </View>
          
          <View style={styles.progressStats}>
            <Text style={styles.progressText}>
              {completedRequired} / {requiredItems.length} Required Items
            </Text>
            <Text style={[styles.progressPercentage, todayCompleted && styles.completedText]}>
              {completionPercentage}%
            </Text>
          </View>

          {todayCompleted && (
            <View style={styles.completedBadge}>
              <CheckCircle size={20} color="#10B981" />
              <Text style={styles.completedBadgeText}>All Required Checks Complete!</Text>
            </View>
          )}
        </View>

        {/* Checklist Items by Category */}
        {['PPE', 'Equipment', 'Environment', 'Health'].map(category => {
          const categoryItems = items.filter(i => i.category === category);
          
          return (
            <View key={category} style={styles.categorySection}>
              <Text style={styles.categoryTitle}>
                {getCategoryIcon(category)} {category}
              </Text>
              
              {categoryItems.map(item => (
                <TouchableOpacity
                  key={item.id}
                  style={[styles.checklistItem, item.checked && styles.checkedItem]}
                  onPress={() => toggleItem(item.id)}
                  activeOpacity={0.7}
                >
                  <View style={styles.checkboxContainer}>
                    {item.checked ? (
                      <CheckSquare size={24} color={COLORS.primary} />
                    ) : (
                      <View style={styles.uncheckedBox} />
                    )}
                  </View>
                  
                  <View style={styles.itemContent}>
                    <View style={styles.itemHeader}>
                      <Text style={[styles.itemTitle, item.checked && styles.checkedText]}>
                        {item.title}
                      </Text>
                      {item.required && !item.checked && (
                        <View style={styles.requiredBadge}>
                          <Text style={styles.requiredText}>Required</Text>
                        </View>
                      )}
                    </View>
                    <Text style={styles.itemDescription}>{item.description}</Text>
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          );
        })}

        {/* History Section */}
        {history.length > 0 && (
          <View style={styles.historySection}>
            <Text style={styles.sectionTitle}>📊 Recent History</Text>
            
            {history.map((entry, index) => (
              <View key={index} style={styles.historyCard}>
                <View style={styles.historyHeader}>
                  <Text style={styles.historyDate}>{entry.date}</Text>
                  <Text style={styles.historyRate}>{entry.completionRate}%</Text>
                </View>
                <View style={styles.historyBar}>
                  <View style={[styles.historyFill, { width: `${entry.completionRate}%` }]} />
                </View>
                <Text style={styles.historyTime}>
                  <Clock size={12} color={COLORS.textMuted} /> Completed at{' '}
                  {new Date(entry.completedAt).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                </Text>
              </View>
            ))}
          </View>
        )}

        <View style={{ height: 40 }} />
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
  progressDate: {
    fontSize: 16,
    fontWeight: '600',
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
  progressStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  progressText: {
    fontSize: 14,
    color: COLORS.textMuted,
  },
  progressPercentage: {
    fontSize: 24,
    fontWeight: '700',
    color: COLORS.text,
  },
  completedText: {
    color: '#10B981',
  },
  completedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  completedBadgeText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#10B981',
    marginLeft: 8,
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
  checklistItem: {
    flexDirection: 'row',
    backgroundColor: COLORS.card,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  checkedItem: {
    borderColor: COLORS.primary,
    backgroundColor: `${COLORS.primary}10`,
  },
  checkboxContainer: {
    marginRight: 12,
    paddingTop: 2,
  },
  uncheckedBox: {
    width: 24,
    height: 24,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: COLORS.border,
  },
  itemContent: {
    flex: 1,
  },
  itemHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  itemTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text,
    flex: 1,
  },
  checkedText: {
    textDecorationLine: 'line-through',
    color: COLORS.textMuted,
  },
  requiredBadge: {
    backgroundColor: '#EF4444',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  requiredText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  itemDescription: {
    fontSize: 13,
    color: COLORS.textMuted,
    lineHeight: 18,
  },
  historySection: {
    marginHorizontal: 20,
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: 12,
  },
  historyCard: {
    backgroundColor: COLORS.card,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  historyHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  historyDate: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.text,
  },
  historyRate: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.primary,
  },
  historyBar: {
    height: 6,
    backgroundColor: COLORS.background,
    borderRadius: 3,
    overflow: 'hidden',
    marginBottom: 8,
  },
  historyFill: {
    height: '100%',
    backgroundColor: COLORS.primary,
    borderRadius: 3,
  },
  historyTime: {
    fontSize: 12,
    color: COLORS.textMuted,
  },
});
