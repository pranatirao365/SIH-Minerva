import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import React, { useEffect, useRef, useState } from 'react';
import {
    FlatList,
    KeyboardAvoidingView,
    Platform,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ArrowLeft, MessageCircle, Send, User as UserIcon } from '../../components/Icons';
import { COLORS } from '../../constants/styles';
import { useRoleStore } from '../../hooks/useRoleStore';

interface Message {
  id: string;
  text: string;
  isUser: boolean;
  timestamp: number;
}

export default function AIChatbot() {
  const router = useRouter();
  const { user } = useRoleStore();
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const flatListRef = useRef<FlatList>(null);

  useEffect(() => {
    loadChatHistory();
    // Send welcome message
    setTimeout(() => {
      addBotMessage(
        `Hello ${user.name}! 👋\n\nI'm your AI Safety Assistant. I can help you with:\n\n• Safety protocols and procedures\n• PPE requirements\n• Emergency procedures\n• Hazard identification\n• Equipment usage\n• Health and safety guidelines\n\nHow can I assist you today?`
      );
    }, 500);
  }, []);

  const loadChatHistory = async () => {
    try {
      const key = `chat_history_${user.id}`;
      const stored = await AsyncStorage.getItem(key);
      if (stored) {
        setMessages(JSON.parse(stored));
      }
    } catch (error) {
      console.error('Error loading chat history:', error);
    }
  };

  const saveChatHistory = async (updatedMessages: Message[]) => {
    try {
      const key = `chat_history_${user.id}`;
      await AsyncStorage.setItem(key, JSON.stringify(updatedMessages));
    } catch (error) {
      console.error('Error saving chat history:', error);
    }
  };

  const addUserMessage = (text: string) => {
    const newMessage: Message = {
      id: Date.now().toString(),
      text,
      isUser: true,
      timestamp: Date.now(),
    };

    const updated = [...messages, newMessage];
    setMessages(updated);
    saveChatHistory(updated);
    
    // Simulate AI response
    setIsTyping(true);
    setTimeout(() => {
      const response = generateAIResponse(text);
      addBotMessage(response);
      setIsTyping(false);
    }, 1000 + Math.random() * 1000);
  };

  const addBotMessage = (text: string) => {
    const botMessage: Message = {
      id: Date.now().toString(),
      text,
      isUser: false,
      timestamp: Date.now(),
    };

    const updated = [...messages, botMessage];
    setMessages(updated);
    saveChatHistory(updated);
  };

  const generateAIResponse = (userMessage: string): string => {
    const lowerMessage = userMessage.toLowerCase();

    // PPE-related queries
    if (lowerMessage.includes('ppe') || lowerMessage.includes('equipment') || lowerMessage.includes('gear')) {
      return `📋 **PPE Requirements**\n\nEssential PPE for mining operations:\n\n1. **Hard Hat** - Protects from falling objects\n2. **Safety Boots** - Steel-toed, slip-resistant\n3. **Reflective Vest** - High-visibility clothing\n4. **Safety Gloves** - Cut and abrasion-resistant\n5. **Eye Protection** - Safety goggles or face shield\n6. **Headlamp** - For illumination in dark areas\n7. **Respirator** - When working in dusty areas\n\nAlways inspect your PPE before use and report any damage immediately.`;
    }

    // Emergency procedures
    if (lowerMessage.includes('emergency') || lowerMessage.includes('evacuation') || lowerMessage.includes('sos')) {
      return `🚨 **Emergency Procedures**\n\n**In case of emergency:**\n\n1. Stay calm and assess the situation\n2. Use emergency button on smart helmet\n3. Alert nearby workers verbally\n4. Proceed to nearest emergency exit\n5. Follow evacuation route markers\n6. Report to assembly point\n7. Do NOT re-enter until cleared\n\n**Emergency Contacts:**\n• Supervisor: Ext 911\n• Safety Officer: Ext 912\n• Medical Team: Ext 913\n\nYour smart helmet will automatically send your location during emergencies.`;
    }

    // Gas detection
    if (lowerMessage.includes('gas') || lowerMessage.includes('methane') || lowerMessage.includes('air quality')) {
      return `💨 **Gas Detection & Air Quality**\n\n**Safe Levels:**\n• Oxygen: 19.5% - 23.5%\n• Methane: < 1.25%\n• Carbon Monoxide: < 50 ppm\n• Hydrogen Sulfide: < 10 ppm\n\n**Warning Signs:**\n⚠️ Gas detector alarm\n⚠️ Unusual odors\n⚠️ Difficulty breathing\n⚠️ Dizziness or headache\n\n**Action Required:**\n1. Stop work immediately\n2. Move to fresh air\n3. Notify supervisor\n4. Do not return until area is cleared\n\nYour smart helmet monitors air quality in real-time.`;
    }

    // Health & safety
    if (lowerMessage.includes('health') || lowerMessage.includes('injury') || lowerMessage.includes('first aid')) {
      return `❤️ **Health & Safety Guidelines**\n\n**Daily Health Checks:**\n✓ Complete daily checklist\n✓ Monitor vital signs via smart helmet\n✓ Stay hydrated (3-4L water/shift)\n✓ Take scheduled breaks\n✓ Report any discomfort immediately\n\n**Common Issues:**\n• Heat stress - Rest in cool area\n• Fatigue - Take break, hydrate\n• Respiratory issues - Exit area, seek medical help\n• Cuts/bruises - Apply first aid, report\n\n**First Aid Stations:**\nLocated at main entrance and Section B.\n\nRemember: Your health is the top priority!`;
    }

    // Equipment
    if (lowerMessage.includes('equipment check') || lowerMessage.includes('inspection') || lowerMessage.includes('tools')) {
      return `🔧 **Equipment Inspection**\n\n**Daily Inspection Required:**\n\n1. **Hard Hat**\n   • No cracks or dents\n   • Straps intact\n   • Headlamp functional\n\n2. **Safety Boots**\n   • No sole separation\n   • Laces intact\n   • Steel toe undamaged\n\n3. **Gas Detector**\n   • Battery charged\n   • Sensor calibrated\n   • Alarm functional\n\n4. **Radio**\n   • Clear communication\n   • Battery charged\n   • Clip secure\n\n**Report Issues:**\nUse Equipment Check screen in app or notify supervisor immediately.\n\nNever use damaged equipment!`;
    }

    // Training
    if (lowerMessage.includes('training') || lowerMessage.includes('video') || lowerMessage.includes('quiz')) {
      return `📚 **Safety Training**\n\n**Available Training:**\n• Safety orientation videos\n• Hazard recognition modules\n• Emergency response procedures\n• Equipment operation guides\n• Health monitoring tutorials\n\n**Progress Tracking:**\nView your progress in the Progress Tracker section. Complete all assigned videos and quizzes to unlock advanced modules.\n\n**Tips for Success:**\n✓ Watch videos without distractions\n✓ Take notes on key points\n✓ Complete quizzes within 48 hours\n✓ Review materials regularly\n\nTraining completion affects your safety score and leaderboard ranking!`;
    }

    // Hazards
    if (lowerMessage.includes('hazard') || lowerMessage.includes('danger') || lowerMessage.includes('risk')) {
      return `⚠️ **Hazard Identification**\n\n**Common Mine Hazards:**\n\n1. **Structural**\n   • Ground instability\n   • Roof falls\n   • Wall cracks\n\n2. **Environmental**\n   • Poor ventilation\n   • Excessive heat/cold\n   • High humidity\n\n3. **Chemical**\n   • Toxic gases\n   • Dust exposure\n   • Chemical spills\n\n4. **Mechanical**\n   • Moving equipment\n   • Electrical hazards\n   • Noise exposure\n\n**Reporting:**\nUse Hazard Scan feature to photograph and report hazards immediately. Include location and description.\n\nWhen in doubt, report it!`;
    }

    // Smart helmet
    if (lowerMessage.includes('helmet') || lowerMessage.includes('smart helmet') || lowerMessage.includes('sensor')) {
      return `⛑️ **Smart Helmet Features**\n\n**Monitoring:**\n• Heart rate and SpO2\n• Environmental temperature\n• Humidity levels\n• Gas detection\n• GPS location\n\n**Alerts:**\n• Abnormal vital signs\n• Hazardous gas levels\n• Emergency button pressed\n• Low battery warning\n\n**Maintenance:**\n✓ Charge daily (8-10 hours)\n✓ Clean sensors weekly\n✓ Check straps and fit\n✓ Report malfunctions immediately\n\n**Battery Life:**\nTypically 12-16 hours per charge. Red light indicates <20% battery.\n\nYour helmet is your lifeline - treat it well!`;
    }

    // Default response for unrecognized queries
    return `I understand you're asking about "${userMessage}". While I don't have specific information on that exact topic, I can help with:\n\n• Safety procedures and protocols\n• PPE requirements\n• Emergency procedures\n• Equipment checks\n• Health guidelines\n• Hazard reporting\n• Training materials\n\nCould you rephrase your question or ask about one of these topics?`;
  };

  const handleSend = () => {
    if (inputText.trim()) {
      addUserMessage(inputText);
      setInputText('');
    }
  };

  const renderMessage = ({ item }: { item: Message }) => (
    <View style={[styles.messageContainer, item.isUser ? styles.userMessageContainer : styles.botMessageContainer]}>
      <View style={[styles.avatarContainer, item.isUser ? styles.userAvatar : styles.botAvatar]}>
        {item.isUser ? <UserIcon size={20} color="#FFFFFF" /> : <MessageCircle size={20} color="#FFFFFF" />}
      </View>
      <View style={[styles.messageBubble, item.isUser ? styles.userBubble : styles.botBubble]}>
        <Text style={[styles.messageText, item.isUser ? styles.userMessageText : styles.botMessageText]}>
          {item.text}
        </Text>
        <Text style={styles.timestamp}>
          {new Date(item.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </Text>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <ArrowLeft size={24} color={COLORS.text} />
        </TouchableOpacity>
        <View style={styles.headerInfo}>
          <View style={styles.headerAvatar}>
            <MessageCircle size={24} color="#FFFFFF" />
          </View>
          <View>
            <Text style={styles.headerTitle}>AI Safety Assistant</Text>
            <Text style={styles.headerStatus}>● Always available</Text>
          </View>
        </View>
        <View style={{ width: 40 }} />
      </View>

      {/* Messages */}
      <FlatList
        ref={flatListRef}
        data={messages}
        renderItem={renderMessage}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.messagesList}
        onContentSizeChange={() => flatListRef.current?.scrollToEnd()}
        onLayout={() => flatListRef.current?.scrollToEnd()}
      />

      {/* Typing Indicator */}
      {isTyping && (
        <View style={styles.typingContainer}>
          <View style={styles.typingBubble}>
            <View style={styles.typingDot} />
            <View style={styles.typingDot} />
            <View style={styles.typingDot} />
          </View>
        </View>
      )}

      {/* Input */}
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={90}
      >
        <View style={styles.inputContainer}>
          <TextInput
            style={styles.input}
            placeholder="Ask about safety protocols..."
            placeholderTextColor={COLORS.textMuted}
            value={inputText}
            onChangeText={setInputText}
            multiline
            maxLength={500}
          />
          <TouchableOpacity
            style={[styles.sendButton, !inputText.trim() && styles.sendButtonDisabled]}
            onPress={handleSend}
            disabled={!inputText.trim()}
          >
            <Send size={20} color="#FFFFFF" />
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
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
  headerInfo: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  headerAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.text,
  },
  headerStatus: {
    fontSize: 12,
    color: '#10B981',
  },
  messagesList: {
    padding: 20,
    paddingBottom: 10,
  },
  messageContainer: {
    flexDirection: 'row',
    marginBottom: 16,
    gap: 12,
  },
  userMessageContainer: {
    flexDirection: 'row-reverse',
  },
  botMessageContainer: {
    flexDirection: 'row',
  },
  avatarContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  userAvatar: {
    backgroundColor: COLORS.primary,
  },
  botAvatar: {
    backgroundColor: '#8B5CF6',
  },
  messageBubble: {
    maxWidth: '70%',
    borderRadius: 16,
    padding: 12,
  },
  userBubble: {
    backgroundColor: COLORS.primary,
    borderTopRightRadius: 4,
  },
  botBubble: {
    backgroundColor: COLORS.card,
    borderTopLeftRadius: 4,
  },
  messageText: {
    fontSize: 15,
    lineHeight: 22,
    marginBottom: 4,
  },
  userMessageText: {
    color: '#FFFFFF',
  },
  botMessageText: {
    color: COLORS.text,
  },
  timestamp: {
    fontSize: 11,
    color: 'rgba(255, 255, 255, 0.7)',
    alignSelf: 'flex-end',
  },
  typingContainer: {
    paddingHorizontal: 20,
    paddingBottom: 10,
  },
  typingBubble: {
    flexDirection: 'row',
    backgroundColor: COLORS.card,
    borderRadius: 16,
    padding: 12,
    gap: 6,
    alignSelf: 'flex-start',
    marginLeft: 48,
  },
  typingDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: COLORS.textMuted,
  },
  inputContainer: {
    flexDirection: 'row',
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    gap: 12,
    alignItems: 'flex-end',
  },
  input: {
    flex: 1,
    backgroundColor: COLORS.card,
    borderRadius: 24,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 15,
    color: COLORS.text,
    maxHeight: 100,
  },
  sendButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendButtonDisabled: {
    opacity: 0.5,
  },
});
