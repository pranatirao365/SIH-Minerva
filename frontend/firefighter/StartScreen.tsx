import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';

interface StartScreenProps {
  onStart: () => void;
  onBack: () => void;
}

export default function StartScreen({ onStart, onBack }: StartScreenProps) {
  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <Text style={styles.title}>🔥 Fire Extinguisher Challenge</Text>
          <Text style={styles.subtitle}>Mine Safety Training Game</Text>
        </View>
        
        <View style={styles.rulesContainer}>
          <Text style={styles.rulesTitle}>📋 How to Play</Text>
          
          <View style={styles.rule}>
            <Text style={styles.ruleNumber}>1️⃣</Text>
            <Text style={styles.ruleText}>
              Navigate through 4 checkpoints to reach the Safe Zone
            </Text>
          </View>
          
          <View style={styles.rule}>
            <Text style={styles.ruleNumber}>2️⃣</Text>
            <Text style={styles.ruleText}>
              Each checkpoint has a different fire hazard - choose the correct extinguisher
            </Text>
          </View>
          
          <View style={styles.rule}>
            <Text style={styles.ruleNumber}>3️⃣</Text>
            <Text style={styles.ruleText}>
              You have only 2 lives and 50 seconds to reach safety
            </Text>
          </View>
          
          <View style={styles.rule}>
            <Text style={styles.ruleNumber}>4️⃣</Text>
            <Text style={styles.ruleText}>
              Start from the left end - pass all checkpoints to win!
            </Text>
          </View>
        </View>
        
        <View style={styles.extinguisherGuide}>
          <Text style={styles.guideTitle}>🧯 Extinguisher Guide</Text>
          
          <View style={styles.guideItem}>
            <Text style={styles.guideIcon}>🟥</Text>
            <View style={styles.guideInfo}>
              <Text style={styles.guideName}>CO₂</Text>
              <Text style={styles.guideUse}>→ Electrical Fires</Text>
            </View>
          </View>
          
          <View style={styles.guideItem}>
            <Text style={styles.guideIcon}>🟧</Text>
            <View style={styles.guideInfo}>
              <Text style={styles.guideName}>ABC Dry Chemical</Text>
              <Text style={styles.guideUse}>→ Oil, Gas, Wood Fires</Text>
            </View>
          </View>
          
          <View style={styles.guideItem}>
            <Text style={styles.guideIcon}>🟨</Text>
            <View style={styles.guideInfo}>
              <Text style={styles.guideName}>Foam</Text>
              <Text style={styles.guideUse}>→ Oil/Fuel Fires</Text>
            </View>
          </View>
          
          <View style={styles.guideItem}>
            <Text style={styles.guideIcon}>🟦</Text>
            <View style={styles.guideInfo}>
              <Text style={styles.guideName}>Water</Text>
              <Text style={styles.guideUse}>→ Wood/Trash Fires</Text>
            </View>
          </View>
          
          <View style={styles.guideItem}>
            <Text style={styles.guideIcon}>🟩</Text>
            <View style={styles.guideInfo}>
              <Text style={styles.guideName}>Wet Chemical</Text>
              <Text style={styles.guideUse}>→ Grease/Kitchen Fires</Text>
            </View>
          </View>
        </View>
        
        <View style={styles.tipContainer}>
          <Text style={styles.tipIcon}>💡</Text>
          <Text style={styles.tipText}>
            Tip: Read the fire description carefully before choosing!
          </Text>
        </View>
      </ScrollView>
      
      <View style={styles.buttonContainer}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={onBack}
        >
          <Text style={styles.backButtonText}>← Back</Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={styles.startButton}
          onPress={onStart}
        >
          <Text style={styles.startButtonText}>🎮 Start Game</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 100,
  },
  header: {
    alignItems: 'center',
    marginBottom: 32,
    marginTop: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#FFA500',
    fontStyle: 'italic',
  },
  rulesContainer: {
    backgroundColor: 'rgba(255, 107, 0, 0.1)',
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: '#FF6B00',
  },
  rulesTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 16,
  },
  rule: {
    flexDirection: 'row',
    marginBottom: 12,
    alignItems: 'flex-start',
  },
  ruleNumber: {
    fontSize: 24,
    marginRight: 12,
  },
  ruleText: {
    fontSize: 15,
    color: '#CCCCCC',
    flex: 1,
    lineHeight: 22,
  },
  extinguisherGuide: {
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: '#10B981',
  },
  guideTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 16,
  },
  guideItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    padding: 12,
    borderRadius: 8,
  },
  guideIcon: {
    fontSize: 28,
    marginRight: 12,
  },
  guideInfo: {
    flex: 1,
  },
  guideName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 2,
  },
  guideUse: {
    fontSize: 14,
    color: '#10B981',
  },
  tipContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(59, 130, 246, 0.1)',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#3B82F6',
  },
  tipIcon: {
    fontSize: 24,
    marginRight: 12,
  },
  tipText: {
    fontSize: 14,
    color: '#93C5FD',
    flex: 1,
    lineHeight: 20,
  },
  buttonContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    padding: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.9)',
    borderTopWidth: 1,
    borderTopColor: '#FF6B00',
    gap: 12,
  },
  backButton: {
    flex: 1,
    backgroundColor: '#333',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#666',
  },
  backButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  startButton: {
    flex: 2,
    backgroundColor: '#FF6B00',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: '#FF6B00',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.5,
    shadowRadius: 8,
    elevation: 8,
  },
  startButtonText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});
