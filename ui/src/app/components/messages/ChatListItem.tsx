import React from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity } from 'react-native';
import { ChatPreview } from '../../types/message';
import { useNavigation } from '@react-navigation/native';

interface ChatListItemProps {
  chat: ChatPreview;
  onPress: (chat: ChatPreview) => void;
}

export const ChatListItem: React.FC<ChatListItemProps> = ({ chat, onPress }) => {
  const navigation = useNavigation();

  const getAvatar = () => {
    if (chat.type === 'one-to-one' && chat.participants?.[0]) {
      return chat.participants[0].pictures[0]?.url;
    }
    // For group chats, you might want to show a group avatar or the first participant's avatar
    return chat.participants?.[0]?.pictures[0]?.url;
  };

  const getLastMessagePreview = () => {
    if (!chat.lastMessage) return 'No messages yet';
    return chat.lastMessage.content.length > 30
      ? `${chat.lastMessage.content.substring(0, 30)}...`
      : chat.lastMessage.content;
  };

  return (
    <TouchableOpacity
      style={styles.container}
      onPress={() => onPress(chat)}
    >
      <Image
        source={{ uri: getAvatar() }}
        style={styles.avatar}
      />
      <View style={styles.content}>
        <View style={styles.header}>
          <Text style={styles.name}>{chat.name}</Text>
          {chat.lastMessage && (
            <Text style={styles.time}>
              {new Date(chat.lastMessage.createdAt).toLocaleTimeString([], {
                hour: '2-digit',
                minute: '2-digit'
              })}
            </Text>
          )}
        </View>
        <View style={styles.messageContainer}>
          <Text style={styles.lastMessage} numberOfLines={1}>
            {getLastMessagePreview()}
          </Text>
          {chat.unreadCount > 0 && (
            <View style={styles.unreadBadge}>
              <Text style={styles.unreadCount}>{chat.unreadCount}</Text>
            </View>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5EA',
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
  },
  content: {
    flex: 1,
    marginLeft: 12,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  name: {
    fontSize: 16,
    fontWeight: '600',
  },
  time: {
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