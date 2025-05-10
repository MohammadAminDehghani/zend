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
  Keyboard,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useAuth } from '../../contexts/AuthContext';
import { MessageBubble } from '../components/messages/MessageBubble';
import { API_URL } from '../config/api';
import SocketService from '../services/socket';
import { Ionicons } from '@expo/vector-icons';
import { Message } from '../types/message';
import { colors, spacing, commonStyles } from '../theme';

export default function ChatScreen() {
  const { recipientId, recipientName, recipientPicture, chatType } = useLocalSearchParams();
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const flatListRef = useRef<FlatList>(null);
  const { user, token } = useAuth();
  const router = useRouter();
  const socketService = SocketService.getInstance();

  // Add new ref for keyboard
  const keyboardHeight = useRef(0);

  useEffect(() => {
    if (!user || !user.id) {
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

    // Add messageSent handler to show sent messages immediately
    socketService.onMessageSent((message: Message) => {
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

    return () => {
      socketService.removeAllListeners();
    };
  }, [user, recipientId]);

  // Separate effect for marking messages as read
  useEffect(() => {
    if (!user || !user.id || messages.length === 0) return;

    const unreadMessages = messages.filter(msg => 
      msg.sender._id.toString() !== user.id && 
      !msg.readBy.some(r => r.userId === user.id)
    );

    if (unreadMessages.length > 0) {
      const messageIds = unreadMessages.map(msg => msg._id);
      socketService.markAsRead(messageIds, user.id);
    }
  }, [messages, user]);

  useEffect(() => {
    const keyboardWillShow = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow',
      (e) => {
        keyboardHeight.current = e.endCoordinates.height;
      }
    );

    const keyboardWillHide = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide',
      () => {
        keyboardHeight.current = 0;
      }
    );

    return () => {
      keyboardWillShow.remove();
      keyboardWillHide.remove();
    };
  }, []);

  // Add effect to scroll to bottom when messages change
  useEffect(() => {
    if (messages.length > 0) {
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 100);
    }
  }, [messages]);

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
    if (!newMessage.trim() || !user || !user.id) return;

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
      {/* Header */}
      <View style={{
        backgroundColor: colors.white,
        borderBottomWidth: 1,
        borderBottomColor: colors.gray[200],
        paddingHorizontal: spacing.base,
        paddingTop: spacing.xl,
        paddingBottom: spacing.lg,
      }}>
        <View style={[commonStyles.row, { justifyContent: 'space-between', alignItems: 'center' }]}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.push('/(tabs)/messages')}
          >
            <Ionicons name="arrow-back" size={24} color={colors.gray[900]} />
          </TouchableOpacity>
          <View style={styles.headerInfo}>
            <Text style={[commonStyles.title, { 
              color: colors.gray[900], 
              marginBottom: 0,
              fontSize: 16,
              fontWeight: '600'
            }]}>
              {recipientName}
            </Text>
            <Text style={[commonStyles.textSecondary, { fontSize: 12 }]}>Offline</Text>
          </View>
        </View>
      </View>
      
      <FlatList
        ref={flatListRef}
        data={messages}
        renderItem={renderMessage}
        keyExtractor={(item) => item._id}
        contentContainerStyle={[
          styles.messagesList,
          { paddingBottom: keyboardHeight.current + 80 }
        ]}
        onContentSizeChange={() => {
          setTimeout(() => {
            flatListRef.current?.scrollToEnd({ animated: true });
          }, 100);
        }}
        onLayout={() => {
          setTimeout(() => {
            flatListRef.current?.scrollToEnd({ animated: true });
          }, 100);
        }}
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
            color={newMessage.trim() ? colors.primary : colors.gray[400]}
          />
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.white,
  },
  backButton: {
    padding: spacing.xs,
  },
  headerInfo: {
    flex: 1,
    marginLeft: spacing.base,
  },
  messagesList: {
    paddingHorizontal: 2,
    paddingVertical: 4,
    flexGrow: 1,
  },
  inputContainer: {
    flexDirection: 'row',
    paddingHorizontal: 2,
    paddingVertical: 4,
    borderTopWidth: 1,
    borderTopColor: colors.gray[200],
    alignItems: 'flex-end',
    backgroundColor: colors.white,
  },
  input: {
    flex: 1,
    backgroundColor: colors.gray[100],
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginRight: 4,
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