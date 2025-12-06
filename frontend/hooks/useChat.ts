import { useState, useEffect } from 'react';
import { socket, Message, ChatRoom } from '../services/socket';

export const useChat = () => {
  const [rooms, setRooms] = useState<ChatRoom[]>([]);
  const [messages, setMessages] = useState<Record<string, Message[]>>({});
  const [currentRoom, setCurrentRoom] = useState<string | null>(null);

  useEffect(() => {
    socket.connect();

    // Initial rooms
    setRooms(socket.getRooms());

    // Listen for room updates
    const unsubscribeRooms = socket.onRoomUpdate((updatedRooms) => {
      setRooms([...updatedRooms]);
    });

    // Listen for new messages
    const unsubscribeMessages = socket.onMessage((message) => {
      setMessages(prev => {
        const roomMessages = prev[message.roomId] || [];
        return {
          ...prev,
          [message.roomId]: [...roomMessages, message],
        };
      });
    });

    return () => {
      unsubscribeRooms();
      unsubscribeMessages();
      socket.disconnect();
    };
  }, []);

  const joinRoom = (roomId: string) => {
    socket.joinRoom(roomId);
    setCurrentRoom(roomId);
    
    // Load existing messages
    if (!messages[roomId]) {
      setMessages(prev => ({
        ...prev,
        [roomId]: socket.getMessages(roomId),
      }));
    }
  };

  const sendMessage = (text: string, userName: string = 'You') => {
    if (currentRoom) {
      socket.sendMessage(currentRoom, text, userName);
    }
  };

  const getRoomMessages = (roomId: string): Message[] => {
    return messages[roomId] || [];
  };

  return {
    rooms,
    messages,
    currentRoom,
    joinRoom,
    sendMessage,
    getRoomMessages,
  };
};
