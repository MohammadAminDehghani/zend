import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  FlatList,
  ActivityIndicator,
  Text,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { ChatListItem } from '../components/messages/ChatListItem';
import { ChatPreview } from '../types/message';
import { useAuth } from '../context/auth';
import axios from 'axios';
import { API_URL } from '../config/api';

type RootStackParamList = {
  Chat: { chat: ChatPreview };
};

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

export const ChatListScreen: React.FC = () => {
  const navigation = useNavigation<NavigationProp>();
  const { user } = useAuth();
  const [chats, setChats] = useState<ChatPreview[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadChats();
  }, []);

  const loadChats = async () => {
    try {
      setIsLoading(true);
      // Fetch one-to-one chats
      const oneToOneResponse = await axios.get(`${API_URL}/api/messages/chats/one-to-one`);
      // Fetch group chats
      const groupResponse = await axios.get(`${API_URL}/api/messages/chats/group`);
      
      const allChats = [
        ...oneToOneResponse.data.map((chat: any) => ({
          ...chat,
          type: 'one-to-one' as const,
        })),
        ...groupResponse.data.map((chat: any) => ({
          ...chat,
          type: 'group' as const,
        })),
      ];

      // Sort by last message time
      allChats.sort((a, b) => {
        if (!a.lastMessage && !b.lastMessage) return 0;
        if (!a.lastMessage) return 1;
        if (!b.lastMessage) return -1;
        return new Date(b.lastMessage.createdAt).getTime() - new Date(a.lastMessage.createdAt).getTime();
      });

      setChats(allChats);
    } catch (error) {
      console.error('Error loading chats:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleChatPress = (chat: ChatPreview) => {
    navigation.navigate('Chat', { chat });
  };

  const renderChat = ({ item }: { item: ChatPreview }) => (
    <ChatListItem chat={item} onPress={handleChatPress} />
  );

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
      </View>
    );
  }

  if (chats.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyText}>No conversations yet</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={chats}
        renderItem={renderChat}
        keyExtractor={item => item._id}
        contentContainerStyle={styles.listContent}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F2F2F7',
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
  },
  emptyText: {
    fontSize: 16,
    color: '#666',
  },
  listContent: {
    paddingBottom: 16,
  },
}); 