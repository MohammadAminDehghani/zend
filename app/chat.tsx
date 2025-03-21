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
import ChatScreen from './screens/ChatScreen';

interface Message {
  _id: string;
  content: string;
  sender: {
    _id: string;
    name: string;
    pictures: Array<{ url: string }>;
  };
  recipient: string;
  chatType: 'one-to-one' | 'group';
  eventId?: string;
  createdAt: string;
  read: boolean;
}

export default ChatScreen;

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