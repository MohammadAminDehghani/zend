import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useAuth } from '../context/auth';
import { MessageBubble } from '../components/messages/MessageBubble';
import { API_URL } from '../config/api';
import SocketService from '../services/socket';
import { Ionicons } from '@expo/vector-icons';
import { Message } from '../types/message';

export default function ChatScreen() {
  const { recipientId, recipientName, recipientPicture, chatType } = useLocalSearchParams();
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const flatListRef = useRef<FlatList>(null);
  const { user, token } = useAuth();
  const router = useRouter();
  const socketService = SocketService.getInstance();

  useEffect(() => {
    if (!user) {
      Alert.alert('Error', 'You must be logged in to chat');
      router.back();
      return;
    }

    console.log('ChatScreen mounted with params:', {
      recipientId,
      recipientName,
      chatType,
      userId: user.id
    });

    // Connect to socket if not already connected
    socketService.connect(user.id);

    // Load existing messages
    fetchMessages();

    // Set up message listeners
    socketService.onNewMessage((message: Message) => {
      if (
        (message.sender._id.toString() === recipientId && message.recipient?._id.toString() === user.id) ||
        (message.sender._id.toString() === user.id && message.recipient?._id.toString() === recipientId)
      ) {
        setMessages(prev => {
          // Check if message already exists
          if (prev.some(m => m._id === message._id)) {
            return prev;
          }
          return [...prev, message];
        });
      }
    });

    // Mark messages as read when entering chat
    const unreadMessages = messages.filter(msg => 
      msg.sender._id.toString() !== user.id && 
      !msg.readBy.some(r => r.userId === user.id)
    );

    if (unreadMessages.length > 0) {
      const messageIds = unreadMessages.map(msg => msg._id);
      socketService.markAsRead(messageIds, user.id);
    }

    return () => {
      socketService.removeAllListeners();
    };
  }, [user, recipientId]);

  const fetchMessages = async () => {
    try {
      console.log('Fetching messages with params:', {
        recipientId,
        chatType,
        token: token ? 'present' : 'missing'
      });

      // Use the correct endpoint based on chat type
      const endpoint = chatType === 'one-to-one' 
        ? `/api/messages/one-to-one/${recipientId}`
        : `/api/messages/group/${recipientId}`;

      const url = `${API_URL}${endpoint}`;
      console.log('Fetching from URL:', url);

      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        console.error('Response not OK:', {
          status: response.status,
          statusText: response.statusText,
          errorData
        });
        throw new Error(`Failed to fetch messages: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      console.log('Received messages:', data);
      setMessages(data);
    } catch (error) {
      console.error('Error fetching messages:', error);
      Alert.alert(
        'Error',
        'Failed to load messages. Please check your connection and try again.'
      );
    } finally {
      setLoading(false);
    }
  };

  const sendMessage = async () => {
    if (!newMessage.trim() || !user) return;

    try {
      console.log('Sending message:', {
        sender: user.id,
        content: newMessage.trim(),
        chatType: chatType as 'one-to-one' | 'group',
        recipient: recipientId as string,
      });

      // Send message through socket
      socketService.sendMessage({
        sender: user.id,
        content: newMessage.trim(),
        chatType: chatType as 'one-to-one' | 'group',
        recipient: recipientId as string,
      });

      // Clear input
      setNewMessage('');

      // Scroll to bottom
      flatListRef.current?.scrollToEnd({ animated: true });
    } catch (error) {
      console.error('Error sending message:', error);
      Alert.alert('Error', 'Failed to send message');
    }
  };

  const renderHeader = () => (
    <View style={styles.header}>
      <TouchableOpacity
        style={styles.backButton}
        onPress={() => router.back()}
      >
        <Ionicons name="arrow-back" size={24} color="#333" />
      </TouchableOpacity>
      <View style={styles.headerInfo}>
        <Text style={styles.headerName}>{recipientName}</Text>
        <Text style={styles.headerStatus}>Offline</Text>
      </View>
    </View>
  );

  const renderMessage = ({ item, index }: { item: Message; index: number }) => {
    const currentDate = new Date(item.createdAt).toDateString();
    const prevMessage = messages[index - 1];
    const prevDate = prevMessage ? new Date(prevMessage.createdAt).toDateString() : null;
    const showDate = currentDate !== prevDate;

    return <MessageBubble message={item} showDate={showDate} />;
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#0000ff" />
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
    >
      {renderHeader()}
      
      <FlatList
        ref={flatListRef}
        data={messages}
        renderItem={renderMessage}
        keyExtractor={(item) => item._id}
        contentContainerStyle={styles.messagesList}
        onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
      />

      <View style={styles.inputContainer}>
        <TextInput
          style={styles.input}
          value={newMessage}
          onChangeText={setNewMessage}
          placeholder="Type a message..."
          multiline
        />
        <TouchableOpacity
          style={[styles.sendButton, !newMessage.trim() && styles.sendButtonDisabled]}
          onPress={sendMessage}
          disabled={!newMessage.trim()}
        >
          <Ionicons
            name="send"
            size={24}
            color={newMessage.trim() ? '#007AFF' : '#999'}
          />
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e1e1e1',
  },
  backButton: {
    marginRight: 16,
  },
  headerInfo: {
    flex: 1,
  },
  headerName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  headerStatus: {
    fontSize: 14,
    color: '#666',
  },
  messagesList: {
    padding: 16,
  },
  inputContainer: {
    flexDirection: 'row',
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#e1e1e1',
    alignItems: 'flex-end',
  },
  input: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginRight: 8,
    maxHeight: 100,
    fontSize: 16,
  },
  sendButton: {
    padding: 8,
  },
  sendButtonDisabled: {
    opacity: 0.5,
  },
}); 