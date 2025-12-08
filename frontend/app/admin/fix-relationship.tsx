/**
 * Admin Tool: Fix Test Supervisor → Test Miner Relationship
 * 
 * Access this at: /admin/fix-relationship
 * This tool updates the database to ensure Test Supervisor's assignedMiners array includes Test Miner
 */

import React, { useState } from 'react';
import { View, Text, Pressable, ScrollView, ActivityIndicator, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { fixTestSupervisorMinerRelationship, checkSupervisorMinerRelationship } from '../../scripts/fixTestSupervisorMinerRelationship';

export default function FixRelationshipScreen() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [checkResult, setCheckResult] = useState<string>('');

  const handleFix = async () => {
    setLoading(true);
    setResult(null);
    
    try {
      console.log('🔧 Starting fix from UI...');
      const res = await fixTestSupervisorMinerRelationship();
      setResult(res);
      console.log('✅ Fix completed:', res);
    } catch (error: any) {
      console.error('❌ Fix failed:', error);
      setResult({ success: false, error: error.message });
    } finally {
      setLoading(false);
    }
  };

  const handleCheck = async () => {
    setLoading(true);
    setCheckResult('Checking... (see console for details)');
    
    try {
      await checkSupervisorMinerRelationship();
      setCheckResult('Check completed. See console for full details.');
    } catch (error: any) {
      console.error('❌ Check failed:', error);
      setCheckResult(`Error: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backButton}>
          <Text style={styles.backButtonText}>← Back</Text>
        </Pressable>
        <Text style={styles.title}>Fix Test Supervisor → Test Miner</Text>
      </View>

      <View style={styles.content}>
        <View style={styles.infoBox}>
          <Text style={styles.infoTitle}>🔍 Issue</Text>
          <Text style={styles.infoText}>
            Test Supervisor has an empty <Text style={styles.code}>assignedMiners</Text> array,
            even though Test Miner has <Text style={styles.code}>supervisorId: "SUP-TEST"</Text>.
          </Text>
          <Text style={styles.infoText} style={{ marginTop: 10 }}>
            This tool will add Test Miner's document ID to the Test Supervisor's assignedMiners array.
          </Text>
        </View>

        <View style={styles.buttonContainer}>
          <Pressable
            style={[styles.button, styles.checkButton, loading && styles.buttonDisabled]}
            onPress={handleCheck}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.buttonText}>1️⃣ Check Relationship</Text>
            )}
          </Pressable>

          <Pressable
            style={[styles.button, styles.fixButton, loading && styles.buttonDisabled]}
            onPress={handleFix}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.buttonText}>2️⃣ Fix Relationship</Text>
            )}
          </Pressable>
        </View>

        {checkResult && (
          <View style={styles.resultBox}>
            <Text style={styles.resultTitle}>Check Result:</Text>
            <Text style={styles.resultText}>{checkResult}</Text>
          </View>
        )}

        {result && (
          <View style={[styles.resultBox, result.success ? styles.successBox : styles.errorBox]}>
            <Text style={styles.resultTitle}>
              {result.success ? '✅ Success!' : '❌ Failed'}
            </Text>
            
            {result.success && result.message && (
              <Text style={styles.resultText}>{result.message}</Text>
            )}
            
            {result.supervisorName && (
              <View style={styles.detailsBox}>
                <Text style={styles.detailLabel}>Supervisor:</Text>
                <Text style={styles.detailValue}>
                  {result.supervisorName} (ID: {result.supervisorId})
                </Text>
              </View>
            )}
            
            {result.minerName && (
              <View style={styles.detailsBox}>
                <Text style={styles.detailLabel}>Miner:</Text>
                <Text style={styles.detailValue}>
                  {result.minerName} (ID: {result.minerId})
                </Text>
              </View>
            )}
            
            {result.assignedMiners && (
              <View style={styles.detailsBox}>
                <Text style={styles.detailLabel}>Updated assignedMiners:</Text>
                <Text style={styles.detailValue}>
                  {JSON.stringify(result.assignedMiners, null, 2)}
                </Text>
              </View>
            )}
            
            {result.error && (
              <Text style={styles.errorText}>{result.error}</Text>
            )}
          </View>
        )}

        <View style={styles.instructionsBox}>
          <Text style={styles.instructionsTitle}>📋 Next Steps:</Text>
          <Text style={styles.instructionItem}>1. Click "Check Relationship" to see current status</Text>
          <Text style={styles.instructionItem}>2. Click "Fix Relationship" to update the database</Text>
          <Text style={styles.instructionItem}>3. Check the console logs for detailed output</Text>
          <Text style={styles.instructionItem}>4. Log in as Test Supervisor to verify the fix</Text>
          <Text style={styles.instructionItem}>   Phone: 1234567892, OTP: 333333</Text>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    backgroundColor: '#fff',
    padding: 20,
    paddingTop: 60,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  backButton: {
    marginBottom: 10,
  },
  backButtonText: {
    fontSize: 16,
    color: '#007AFF',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
  },
  content: {
    padding: 20,
  },
  infoBox: {
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 12,
    marginBottom: 20,
    borderLeftWidth: 4,
    borderLeftColor: '#FF9800',
  },
  infoTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 10,
  },
  infoText: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
  code: {
    fontFamily: 'monospace',
    backgroundColor: '#f0f0f0',
    paddingHorizontal: 4,
    borderRadius: 3,
  },
  buttonContainer: {
    gap: 12,
    marginBottom: 20,
  },
  button: {
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkButton: {
    backgroundColor: '#2196F3',
  },
  fixButton: {
    backgroundColor: '#4CAF50',
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  resultBox: {
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 12,
    marginBottom: 20,
  },
  successBox: {
    borderLeftWidth: 4,
    borderLeftColor: '#4CAF50',
  },
  errorBox: {
    borderLeftWidth: 4,
    borderLeftColor: '#F44336',
  },
  resultTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 10,
  },
  resultText: {
    fontSize: 14,
    color: '#666',
    marginBottom: 10,
  },
  detailsBox: {
    backgroundColor: '#f9f9f9',
    padding: 12,
    borderRadius: 8,
    marginTop: 8,
  },
  detailLabel: {
    fontSize: 12,
    color: '#999',
    marginBottom: 4,
  },
  detailValue: {
    fontSize: 14,
    color: '#333',
    fontFamily: 'monospace',
  },
  errorText: {
    fontSize: 14,
    color: '#F44336',
    marginTop: 8,
  },
  instructionsBox: {
    backgroundColor: '#E3F2FD',
    padding: 20,
    borderRadius: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#2196F3',
  },
  instructionsTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 12,
  },
  instructionItem: {
    fontSize: 14,
    color: '#555',
    marginBottom: 6,
    paddingLeft: 8,
  },
});
