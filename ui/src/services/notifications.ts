import * as Notifications from 'expo-notifications';
import AsyncStorage from '@react-native-async-storage/async-storage';

export interface NotificationPayload {
  title: string;
  body: string;
  data?: any;
}

export class NotificationService {
  private static instance: NotificationService;
  private readonly STORAGE_KEY = '@notifications';

  private constructor() {
    this.setupNotifications();
  }

  public static getInstance(): NotificationService {
    if (!NotificationService.instance) {
      NotificationService.instance = new NotificationService();
    }
    return NotificationService.instance;
  }

  private async setupNotifications() {
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;
    
    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    if (finalStatus !== 'granted') {
      console.log('Failed to get push token for push notification!');
      return;
    }

    // Configure notification behavior
    await Notifications.setNotificationHandler({
      handleNotification: async () => ({
        shouldShowAlert: true,
        shouldPlaySound: true,
        shouldSetBadge: true,
      }),
    });
  }

  public async getStoredNotifications(): Promise<any[]> {
    try {
      const stored = await AsyncStorage.getItem(this.STORAGE_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch (error) {
      console.error('Error getting stored notifications:', error);
      return [];
    }
  }

  public async storeNotification(notification: any): Promise<void> {
    try {
      const stored = await this.getStoredNotifications();
      stored.push({
        ...notification,
        id: Date.now().toString(),
        createdAt: new Date().toISOString()
      });
      await AsyncStorage.setItem(this.STORAGE_KEY, JSON.stringify(stored));
    } catch (error) {
      console.error('Error storing notification:', error);
    }
  }

  public async scheduleLocalNotification(
    payload: NotificationPayload,
    trigger?: Notifications.NotificationTriggerInput
  ): Promise<string> {
    try {
      const identifier = await Notifications.scheduleNotificationAsync({
        content: {
          title: payload.title,
          body: payload.body,
          data: payload.data || {},
        },
        trigger: trigger || null,
      });

      await this.storeNotification({
        id: identifier,
        payload,
        createdAt: new Date().toISOString(),
      });

      return identifier;
    } catch (error) {
      console.error('Error scheduling notification:', error);
      throw error;
    }
  }

  public async cancelNotification(identifier: string): Promise<void> {
    try {
      await Notifications.cancelScheduledNotificationAsync(identifier);
      const stored = await this.getStoredNotifications();
      const updated = stored.filter(n => n.id !== identifier);
      await AsyncStorage.setItem(this.STORAGE_KEY, JSON.stringify(updated));
    } catch (error) {
      console.error('Error canceling notification:', error);
      throw error;
    }
  }

  public async cancelAllNotifications(): Promise<void> {
    try {
      await Notifications.cancelAllScheduledNotificationsAsync();
      await AsyncStorage.removeItem(this.STORAGE_KEY);
    } catch (error) {
      console.error('Error canceling notifications:', error);
      throw error;
    }
  }
} 