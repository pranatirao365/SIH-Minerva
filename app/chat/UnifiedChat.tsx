import React from 'react';
import { View, Text, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { MessageCircle, Users, Shield, ArrowLeft } from '../../components/Icons';
import { useChat } from '../../hooks/useChat';

export default function UnifiedChat() {
  const router = useRouter();
  const { rooms } = useChat();

  return (
    <SafeAreaView className="flex-1 bg-background">
      <View className="px-6 py-4 flex-row items-center border-b border-border">
        <TouchableOpacity onPress={() => router.back()}>
          <ArrowLeft size={24} color="#FFFFFF" />
        </TouchableOpacity>
        <Text className="text-foreground text-lg font-bold ml-4">Chat Rooms</Text>
      </View>

      <ScrollView className="flex-1 px-6 py-6">
        {rooms.map((room) => (
          <TouchableOpacity
            key={room.id}
            onPress={() => router.push(`/chat/ChatRoom?roomId=${room.id}` as any)}
            className="bg-neutral-900 rounded-lg border border-border p-4 mb-3"
          >
            <View className="flex-row items-center justify-between">
              <View className="flex-row items-center flex-1">
                <View className="w-12 h-12 bg-primary/20 rounded-full items-center justify-center mr-4">
                  {room.id === 'general' && <MessageCircle size={24} color="#FF6B00" />}
                  {room.id === 'safety' && <Shield size={24} color="#10B981" />}
                  {room.id === 'team' && <Users size={24} color="#1E40AF" />}
                </View>
                <View className="flex-1">
                  <Text className="text-foreground font-bold text-lg">{room.name}</Text>
                  {room.lastMessage && (
                    <Text className="text-neutral-400 text-sm mt-1" numberOfLines={1}>
                      {room.lastMessage}
                    </Text>
                  )}
                </View>
              </View>
              {room.unreadCount > 0 && (
                <View className="bg-primary rounded-full w-6 h-6 items-center justify-center">
                  <Text className="text-white text-xs font-bold">{room.unreadCount}</Text>
                </View>
              )}
            </View>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}
