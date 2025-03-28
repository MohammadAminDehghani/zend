import * as Notifications from 'expo-notifications';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { router } from 'expo-router';

// Configure notification behavior
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

export interface NotificationPayload {
  title: string;
  body: string;
  data?: Record<string, any>;
}

export class NotificationService {
  private static instance: NotificationService;
  private static readonly STORAGE_KEY = '@notifications';

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
    try {
      const { status } = await Notifications.getPermissionsAsync();
      if (status !== 'granted') {
        const { status: newStatus } = await Notifications.requestPermissionsAsync();
        if (newStatus !== 'granted') {
          return;
        }
      }

      // Handle notification response (when user taps notification)
      Notifications.addNotificationResponseReceivedListener(response => {
        const data = response.notification.request.content.data;
        if (data?.eventId) {
          router.push('/events/[id]' as any, { id: data.eventId });
        }
      });

      // Handle received notification while app is foregrounded
      Notifications.addNotificationReceivedListener(notification => {
        console.log('Received notification:', notification);
      });
    } catch (error) {
      console.error('Error setting up notifications:', error);
    }
  }

  public async scheduleLocalNotification(payload: NotificationPayload, trigger?: Notifications.NotificationTriggerInput) {
    try {
      // Store notification in AsyncStorage
      const storedNotifications = await this.getStoredNotifications();
      const newNotification = {
        id: Date.now().toString(),
        payload,
        trigger,
        createdAt: new Date().toISOString(),
      };
      
      storedNotifications.push(newNotification);
      await AsyncStorage.setItem(NotificationService.STORAGE_KEY, JSON.stringify(storedNotifications));

      // For emulator testing, we'll use immediate trigger if none specified
      const notificationTrigger = trigger || {
        type: 'timeInterval',
        seconds: 1,
        repeats: false
      } as Notifications.TimeIntervalTriggerInput;

      // Schedule the actual notification
      const identifier = await Notifications.scheduleNotificationAsync({
        content: {
          title: payload.title,
          body: payload.body,
          data: payload.data,
        },
        trigger: notificationTrigger,
      });

      return identifier;
    } catch (error) {
      console.error('Error scheduling notification:', error);
      throw error;
    }
  }

  public async getStoredNotifications() {
    try {
      const stored = await AsyncStorage.getItem(NotificationService.STORAGE_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch (error) {
      console.error('Error getting stored notifications:', error);
      return [];
    }
  }

  public async cancelAllNotifications() {
    try {
      await Notifications.cancelAllScheduledNotificationsAsync();
      await AsyncStorage.setItem(NotificationService.STORAGE_KEY, JSON.stringify([]));
    } catch (error) {
      console.error('Error canceling notifications:', error);
      throw error;
    }
  }
} 