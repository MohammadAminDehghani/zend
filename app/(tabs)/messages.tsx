import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { useAuth } from '../context/auth';
import { API_URL } from '../config/api';
import { ChatPreview } from '../types/message';
import { Ionicons } from '@expo/vector-icons';

export default function MessagesScreen() {
  const [chats, setChats] = useState<ChatPreview[]>([]);
  const [loading, setLoading] = useState(true);
  const { user, token } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!user) return;
    fetchChats();
  }, [user]);

  // Refresh chats when returning to this screen
  useFocusEffect(
    React.useCallback(() => {
      if (user) {
        fetchChats();
      }
    }, [user])
  );

  const fetchChats = async () => {
    try {
      const response = await fetch(`${API_URL}/api/messages/chats`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch chats');
      }

      const data = await response.json();
      setChats(data);
    } catch (error) {
      Alert.alert('Error', 'Failed to load conversations');
    } finally {
      setLoading(false);
    }
  };

  const handleChatPress = (chat: ChatPreview) => {
    if (chat.type === 'one-to-one') {
      router.push({
        pathname: '/chat',
        params: {
          recipientId: chat.participants?.[0]?._id,
          recipientName: chat.participants?.[0]?.name,
          recipientPicture: chat.participants?.[0]?.pictures[0]?.url,
          chatType: 'one-to-one'
        }
      });
    } else {
      router.push({
        pathname: '/chat',
        params: {
          recipientId: chat.eventId,
          recipientName: chat.name,
          chatType: 'group'
        }
      });
    }
  };

  const renderChatItem = ({ item }: { item: ChatPreview }) => (
    <TouchableOpacity
      style={styles.chatItem}
      onPress={() => handleChatPress(item)}
    >
      <Image
        source={{ uri: item.type === 'one-to-one' 
          ? item.participants?.[0]?.pictures[0]?.url 
          : 'https://via.placeholder.com/50' // Group chat placeholder
        }}
        style={styles.avatar}
      />
      <View style={styles.chatInfo}>
        <View style={styles.chatHeader}>
          <Text style={styles.chatName}>{item.name}</Text>
          {item.lastMessage && (
            <Text style={styles.timeText}>
              {new Date(item.lastMessage.createdAt).toLocaleTimeString([], {
                hour: '2-digit',
                minute: '2-digit'
              })}
            </Text>
          )}
        </View>
        <View style={styles.messageContainer}>
          <Text style={styles.lastMessage} numberOfLines={1}>
            {item.lastMessage?.content || 'No messages yet'}
          </Text>
          {item.unreadCount > 0 && (
            <View style={styles.unreadBadge}>
              <Text style={styles.unreadCount}>{item.unreadCount}</Text>
            </View>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
      </View>
    );
  }

  if (chats.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Ionicons name="chatbubbles-outline" size={64} color="#999" />
        <Text style={styles.emptyText}>No conversations yet</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={chats}
        renderItem={renderChatItem}
        keyExtractor={(item) => item._id}
        contentContainerStyle={styles.listContent}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  emptyText: {
    fontSize: 16,
    color: '#666',
    marginTop: 12,
  },
  listContent: {
    padding: 16,
  },
  chatItem: {
    flexDirection: 'row',
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e1e1e1',
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
  },
  chatInfo: {
    flex: 1,
    marginLeft: 12,
  },
  chatHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  chatName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  timeText: {
    fontSize: 12,
    color: '#666',
  },
  messageContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  lastMessage: {
    flex: 1,
    fontSize: 14,
    color: '#666',
    marginRight: 8,
  },
  unreadBadge: {
    backgroundColor: '#007AFF',
    borderRadius: 12,
    minWidth: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 6,
  },
  unreadCount: {
    color: '#FFF',
    fontSize: 12,
    fontWeight: '600',
  },
}); 