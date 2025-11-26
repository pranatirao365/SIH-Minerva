// Fully simulated offline chat service

export interface Message {
  id: string;
  roomId: string;
  userId: string;
  userName: string;
  text: string;
  timestamp: number;
}

export interface ChatRoom {
  id: string;
  name: string;
  lastMessage?: string;
  unreadCount: number;
}

type MessageListener = (message: Message) => void;
type RoomListener = (rooms: ChatRoom[]) => void;
type TypingListener = (roomId: string, userId: string, isTyping: boolean) => void;

class SimulatedSocket {
  private messages: Map<string, Message[]> = new Map();
  private rooms: ChatRoom[] = [];
  private messageListeners: MessageListener[] = [];
  private roomListeners: RoomListener[] = [];
  private typingListeners: TypingListener[] = [];
  private currentUserId: string = 'user-' + Math.random().toString(36).substr(2, 9);

  constructor() {
    this.initializeDefaultRooms();
  }

  private initializeDefaultRooms() {
    this.rooms = [
      { id: 'general', name: 'General Chat', unreadCount: 0 },
      { id: 'safety', name: 'Safety Alerts', unreadCount: 0 },
      { id: 'team', name: 'Team Discussion', unreadCount: 0 },
    ];

    // Add some default messages
    this.addMockMessage('general', 'System', 'Welcome to MinerVa chat!');
    this.addMockMessage('safety', 'Safety Bot', 'Remember to wear your helmet at all times.');
  }

  private addMockMessage(roomId: string, userName: string, text: string) {
    const message: Message = {
      id: Math.random().toString(36).substr(2, 9),
      roomId,
      userId: 'system',
      userName,
      text,
      timestamp: Date.now(),
    };

    const roomMessages = this.messages.get(roomId) || [];
    roomMessages.push(message);
    this.messages.set(roomId, roomMessages);

    const room = this.rooms.find(r => r.id === roomId);
    if (room) {
      room.lastMessage = text;
    }
  }

  connect() {
    console.log('Socket connected (simulated)');
  }

  disconnect() {
    console.log('Socket disconnected (simulated)');
  }

  joinRoom(roomId: string) {
    console.log(`Joined room: ${roomId}`);
    const room = this.rooms.find(r => r.id === roomId);
    if (room) {
      room.unreadCount = 0;
      this.notifyRoomListeners();
    }
  }

  sendMessage(roomId: string, text: string, userName: string = 'You') {
    const message: Message = {
      id: Math.random().toString(36).substr(2, 9),
      roomId,
      userId: this.currentUserId,
      userName,
      text,
      timestamp: Date.now(),
    };

    const roomMessages = this.messages.get(roomId) || [];
    roomMessages.push(message);
    this.messages.set(roomId, roomMessages);

    const room = this.rooms.find(r => r.id === roomId);
    if (room) {
      room.lastMessage = text;
    }

    // Simulate network delay
    setTimeout(() => {
      this.notifyMessageListeners(message);
      this.notifyRoomListeners();
      
      // Simulate bot response in safety room
      if (roomId === 'safety') {
        this.simulateBotResponse(roomId);
      }
    }, 100);
  }

  private simulateBotResponse(roomId: string) {
    const responses = [
      'Message received. Stay safe!',
      'Thank you for the update.',
      'Acknowledged. Monitoring the situation.',
    ];

    setTimeout(() => {
      const botMessage: Message = {
        id: Math.random().toString(36).substr(2, 9),
        roomId,
        userId: 'bot',
        userName: 'Safety Bot',
        text: responses[Math.floor(Math.random() * responses.length)],
        timestamp: Date.now(),
      };

      const roomMessages = this.messages.get(roomId) || [];
      roomMessages.push(botMessage);
      this.messages.set(roomId, roomMessages);

      this.notifyMessageListeners(botMessage);
    }, 1500);
  }

  getMessages(roomId: string): Message[] {
    return this.messages.get(roomId) || [];
  }

  getRooms(): ChatRoom[] {
    return this.rooms;
  }

  onMessage(listener: MessageListener) {
    this.messageListeners.push(listener);
    return () => {
      this.messageListeners = this.messageListeners.filter(l => l !== listener);
    };
  }

  onRoomUpdate(listener: RoomListener) {
    this.roomListeners.push(listener);
    return () => {
      this.roomListeners = this.roomListeners.filter(l => l !== listener);
    };
  }

  onTyping(listener: TypingListener) {
    this.typingListeners.push(listener);
    return () => {
      this.typingListeners = this.typingListeners.filter(l => l !== listener);
    };
  }

  emitTyping(roomId: string, isTyping: boolean) {
    this.typingListeners.forEach(listener => 
      listener(roomId, this.currentUserId, isTyping)
    );
  }

  private notifyMessageListeners(message: Message) {
    this.messageListeners.forEach(listener => listener(message));
  }

  private notifyRoomListeners() {
    this.roomListeners.forEach(listener => listener(this.rooms));
  }
}

export const socket = new SimulatedSocket();
