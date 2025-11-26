import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TextInput, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { ArrowLeft, Send } from '../../components/Icons';
import { useChat } from '../../hooks/useChat';
import { useRoleStore } from '../../hooks/useRoleStore';

export default function ChatRoom() {
  const router = useRouter();
  const { roomId } = useLocalSearchParams<{ roomId: string }>();
  const { joinRoom, sendMessage, getRoomMessages, rooms } = useChat();
  const { user } = useRoleStore();
  const [message, setMessage] = useState('');
  
  const room = rooms.find(r => r.id === roomId);
  const messages = getRoomMessages(roomId || '');

  useEffect(() => {
    if (roomId) {
      joinRoom(roomId);
    }
  }, [roomId]);

  const handleSend = () => {
    if (message.trim()) {
      sendMessage(message, user.name || 'User');
      setMessage('');
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-background">
      <View className="px-6 py-4 flex-row items-center border-b border-border">
        <TouchableOpacity onPress={() => router.back()}>
          <ArrowLeft size={24} color="#FFFFFF" />
        </TouchableOpacity>
        <Text className="text-foreground text-lg font-bold ml-4">
          {room?.name || 'Chat'}
        </Text>
      </View>

      <ScrollView className="flex-1 px-6 py-4">
        {messages.map((msg) => {
          const isOwnMessage = msg.userName === (user.name || 'You');
          
          return (
            <View
              key={msg.id}
              className={`mb-4 ${isOwnMessage ? 'items-end' : 'items-start'}`}
            >
              {!isOwnMessage && (
                <Text className="text-neutral-400 text-xs mb-1">{msg.userName}</Text>
              )}
              <View
                className={`max-w-[80%] rounded-lg p-3 ${
                  isOwnMessage
                    ? 'bg-primary'
                    : 'bg-neutral-900 border border-border'
                }`}
              >
                <Text className={isOwnMessage ? 'text-white' : 'text-foreground'}>
                  {msg.text}
                </Text>
              </View>
              <Text className="text-neutral-600 text-xs mt-1">
                {new Date(msg.timestamp).toLocaleTimeString([], { 
                  hour: '2-digit', 
                  minute: '2-digit' 
                })}
              </Text>
            </View>
          );
        })}
      </ScrollView>

      <View className="px-6 py-4 border-t border-border flex-row items-center">
        <TextInput
          value={message}
          onChangeText={setMessage}
          placeholder="Type a message..."
          placeholderTextColor="#737373"
          className="flex-1 bg-neutral-900 border border-border rounded-lg px-4 py-3 text-foreground mr-3"
        />
        <TouchableOpacity
          onPress={handleSend}
          className="bg-primary rounded-lg p-3"
        >
          <Send size={24} color="#FFFFFF" />
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}
