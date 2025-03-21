import Constants from 'expo-constants';
import { Platform } from 'react-native';

class SocketService {
  private ws: WebSocket | null = null;
  private static instance: SocketService;
  private messageHandlers: Map<string, Function[]> = new Map();
  private reconnectAttempts: number = 0;
  private maxReconnectAttempts: number = 5;
  private reconnectTimeout: number = 3000;
  private currentUserId: string | null = null;
  private isConnecting: boolean = false;

  private constructor() {}

  static getInstance(): SocketService {
    if (!SocketService.instance) {
      SocketService.instance = new SocketService();
    }
    return SocketService.instance;
  }

  private getWebSocketUrl(): string {
    const serverUrl = Constants.expoConfig?.extra?.serverUrl;
    if (serverUrl) {
      return serverUrl.replace(/^http/, 'ws');
    }

    // For Android emulator, use 10.0.2.2 instead of localhost
    const baseUrl = Platform.OS === 'android' 
      ? 'http://10.0.2.2:3000'
      : 'http://localhost:3000';

    return baseUrl.replace(/^http/, 'ws');
  }

  connect(userId: string) {
    if (this.isConnecting || (this.ws && this.ws.readyState === WebSocket.OPEN)) {
      return;
    }

    this.currentUserId = userId;
    this.isConnecting = true;
    this.reconnectAttempts = 0;

    this.establishConnection();
  }

  private establishConnection() {
    if (!this.currentUserId) return;

    const wsUrl = this.getWebSocketUrl();
    console.log('Connecting to WebSocket:', wsUrl);
    
    this.ws = new WebSocket(wsUrl);

    this.ws.onopen = () => {
      console.log('WebSocket connected');
      this.isConnecting = false;
      this.reconnectAttempts = 0;
      this.sendSocketMessage('join', { userId: this.currentUserId });
    };

    this.ws.onclose = () => {
      console.log('WebSocket disconnected');
      this.isConnecting = false;
      this.ws = null;
      this.handleReconnect();
    };

    this.ws.onerror = (error) => {
      console.error('WebSocket error:', error);
      this.isConnecting = false;
    };

    this.ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        const { type, payload } = data;
        this.notifyHandlers(type, payload);
      } catch (error) {
        console.error('Error parsing WebSocket message:', error);
      }
    };
  }

  private handleReconnect() {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.log('Max reconnection attempts reached');
      return;
    }

    this.reconnectAttempts++;
    console.log(`Attempting to reconnect (${this.reconnectAttempts}/${this.maxReconnectAttempts})...`);
    
    setTimeout(() => {
      this.establishConnection();
    }, this.reconnectTimeout);
  }

  disconnect() {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
      this.currentUserId = null;
      this.isConnecting = false;
      this.reconnectAttempts = 0;
    }
  }

  private sendSocketMessage(type: string, payload: any) {
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify({ type, payload }));
    } else {
      console.log('WebSocket not connected, attempting to reconnect...');
      this.handleReconnect();
    }
  }

  joinEvent(eventId: string) {
    this.sendSocketMessage('joinEvent', { eventId });
  }

  leaveEvent(eventId: string) {
    this.sendSocketMessage('leaveEvent', { eventId });
  }

  sendMessage(messageData: {
    sender: string;
    content: string;
    chatType: 'one-to-one' | 'group';
    recipient?: string;
    eventId?: string;
  }) {
    this.sendSocketMessage('sendMessage', messageData);
  }

  markAsRead(messageIds: string[], userId: string) {
    this.sendSocketMessage('markAsRead', { messageIds, userId });
  }

  onNewMessage(callback: (message: any) => void) {
    this.addHandler('newMessage', callback);
  }

  onMessageSent(callback: (message: any) => void) {
    this.addHandler('messageSent', callback);
  }

  onMessagesRead(callback: (data: { messageIds: string[] }) => void) {
    this.addHandler('messagesRead', callback);
  }

  private addHandler(type: string, callback: Function) {
    if (!this.messageHandlers.has(type)) {
      this.messageHandlers.set(type, []);
    }
    this.messageHandlers.get(type)?.push(callback);
  }

  private notifyHandlers(type: string, payload: any) {
    const handlers = this.messageHandlers.get(type);
    if (handlers) {
      handlers.forEach(callback => callback(payload));
    }
  }

  removeAllListeners() {
    this.messageHandlers.clear();
  }
}

export default SocketService; 