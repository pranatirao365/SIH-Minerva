import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, TextInput, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { AlertTriangle, ArrowLeft, Upload } from '../../components/Icons';

export default function IncidentReport() {
  const router = useRouter();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [severity, setSeverity] = useState<'low' | 'medium' | 'high'>('medium');

  const handleSubmit = () => {
    if (!title || !description) {
      Alert.alert('Error', 'Please fill all required fields');
      return;
    }

    Alert.alert(
      'Report Submitted',
      'Your incident report has been submitted successfully. Safety team will review it shortly.',
      [{ text: 'OK', onPress: () => router.back() }]
    );
  };

  return (
    <SafeAreaView className="flex-1 bg-background">
      <View className="px-6 py-4 flex-row items-center border-b border-border">
        <TouchableOpacity onPress={() => router.back()}>
          <ArrowLeft size={24} color="#FFFFFF" />
        </TouchableOpacity>
        <Text className="text-foreground text-lg font-bold ml-4">Report Incident</Text>
      </View>

      <ScrollView className="flex-1 px-6 py-6">
        <View className="bg-primary/20 rounded-lg border border-primary p-4 mb-6">
          <Text className="text-primary font-bold mb-1">Quick Reporting</Text>
          <Text className="text-foreground text-sm">
            Report any safety concerns or incidents immediately. Your report helps keep everyone safe.
          </Text>
        </View>

        <Text className="text-foreground font-semibold mb-2">Incident Title *</Text>
        <TextInput
          value={title}
          onChangeText={setTitle}
          placeholder="E.g., Gas leak in Shaft A"
          placeholderTextColor="#737373"
          className="bg-neutral-900 border border-border rounded-lg px-4 py-3 text-foreground mb-4"
        />

        <Text className="text-foreground font-semibold mb-2">Description *</Text>
        <TextInput
          value={description}
          onChangeText={setDescription}
          placeholder="Provide detailed description..."
          placeholderTextColor="#737373"
          multiline
          numberOfLines={6}
          className="bg-neutral-900 border border-border rounded-lg px-4 py-3 text-foreground mb-4"
          style={{ textAlignVertical: 'top' }}
        />

        <Text className="text-foreground font-semibold mb-3">Severity Level *</Text>
        <View className="flex-row space-x-3 mb-6">
          {[
            { level: 'low' as const, label: 'Low', color: '#10B981' },
            { level: 'medium' as const, label: 'Medium', color: '#F59E0B' },
            { level: 'high' as const, label: 'High', color: '#EF4444' },
          ].map((item) => (
            <TouchableOpacity
              key={item.level}
              onPress={() => setSeverity(item.level)}
              className={`flex-1 p-3 rounded-lg border-2 ${
                severity === item.level
                  ? 'border-primary bg-primary/20'
                  : 'border-border bg-neutral-900'
              }`}
            >
              <Text
                className={`text-center font-semibold ${
                  severity === item.level ? 'text-foreground' : 'text-neutral-400'
                }`}
              >
                {item.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <TouchableOpacity className="bg-neutral-900 border border-border rounded-lg p-4 mb-6 flex-row items-center justify-center">
          <Upload size={20} color="#FF6B00" />
          <Text className="text-primary font-semibold ml-2">Upload Photos/Videos</Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={handleSubmit}
          className="bg-primary rounded-lg p-4 items-center"
        >
          <Text className="text-white text-lg font-bold">Submit Report</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}
