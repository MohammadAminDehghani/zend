import React from 'react';
import { View, Text, StyleSheet, Image } from 'react-native';
import { Message } from '../../types/message';
import { useAuth } from '../../../contexts/AuthContext';

interface MessageBubbleProps {
  message: Message;
  showDate?: boolean;
}

const DateSeparator: React.FC<{ date: Date }> = ({ date }) => (
  <View style={styles.dateSeparator}>
    <Text style={styles.dateText}>
      {date.toLocaleDateString([], { 
        weekday: 'long', 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
      })}
    </Text>
  </View>
);

export const MessageBubble: React.FC<MessageBubbleProps> = ({ message, showDate = false }) => {
  const { user } = useAuth();
  const isOwnMessage = message.sender._id === user?.id;

  return (
    <View>
      {showDate && <DateSeparator date={new Date(message.createdAt)} />}
      <View style={[
        styles.container,
        isOwnMessage ? styles.ownMessage : styles.otherMessage
      ]}>
        {!isOwnMessage && (
          <Image
            source={{ uri: message.sender.pictures[0]?.url }}
            style={styles.avatar}
          />
        )}
        <View style={[
          styles.bubble,
          isOwnMessage ? styles.ownBubble : styles.otherBubble
        ]}>
          <Text style={[
            styles.messageText,
            isOwnMessage ? styles.ownMessageText : styles.otherMessageText
          ]}>{message.content}</Text>
          <Text style={[
            styles.timeText,
            isOwnMessage ? styles.ownTimeText : styles.otherTimeText
          ]}>
            {new Date(message.createdAt).toLocaleTimeString([], { 
              hour: '2-digit', 
              minute: '2-digit' 
            })}
          </Text>
        </View>
        {isOwnMessage && (
          <Image
            source={{ uri: message.sender.pictures[0]?.url }}
            style={styles.avatar}
          />
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    marginVertical: 4,
    paddingHorizontal: 8,
    alignItems: 'flex-end',
  },
  ownMessage: {
    justifyContent: 'flex-end',
  },
  otherMessage: {
    justifyContent: 'flex-start',
  },
  bubble: {
    maxWidth: '70%',
    padding: 12,
    borderRadius: 20,
    marginHorizontal: 8,
  },
  ownBubble: {
    backgroundColor: '#007AFF',
  },
  otherBubble: {
    backgroundColor: '#E5E5EA',
  },
  messageText: {
    fontSize: 16,
  },
  ownMessageText: {
    color: '#FFFFFF',
  },
  otherMessageText: {
    color: '#000000',
  },
  timeText: {
    fontSize: 12,
    marginTop: 4,
    alignSelf: 'flex-end',
  },
  ownTimeText: {
    color: '#FFFFFF',
  },
  otherTimeText: {
    color: '#666666',
  },
  avatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
  },
  dateSeparator: {
    alignItems: 'center',
    marginVertical: 16,
  },
  dateText: {
    fontSize: 14,
    color: '#666',
    backgroundColor: '#f5f5f5',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
}); 