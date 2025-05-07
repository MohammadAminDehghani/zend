import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import { router } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';

// Configure notification behavior
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

// Handle notification response (when user taps notification)
Notifications.addNotificationResponseReceivedListener(response => {
  const data = response.notification.request.content.data;
  console.log('Notification tapped:', data);
  
  if (data?.eventId) {
    console.log('Navigating to event:', data.eventId);
    router.push(`/events/${data.eventId}`);
  }
});

// Handle received notification while app is foregrounded
Notifications.addNotificationReceivedListener(notification => {
  console.log('Received notification while app is open:', notification);
});

export interface NotificationPayload {
  title: string;
  body: string;
  data?: Record<string, any>;
}

export class NotificationService {
  private static instance: NotificationService;
  private static readonly STORAGE_KEY = '@notifications';
  private readonly projectId: string;

  private constructor() {
    this.projectId = Constants.expoConfig?.extra?.eas?.projectId;
    this.registerForPushNotifications();
  }

  public static getInstance(): NotificationService {
    if (!NotificationService.instance) {
      NotificationService.instance = new NotificationService();
    }
    return NotificationService.instance;
  }

  private async registerForPushNotifications() {
    try {
      console.log('Setting up notifications...');
      
      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      console.log('Existing notification status:', existingStatus);
      
      let finalStatus = existingStatus;

      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
        console.log('New notification status:', status);
      }

      if (finalStatus !== 'granted') {
        console.warn('Permission not granted for notifications');
        return;
      }

      if (Platform.OS === 'android') {
        console.log('Setting up Android notification channel...');
        await Notifications.setNotificationChannelAsync('default', {
          name: 'default',
          importance: Notifications.AndroidImportance.MAX,
          vibrationPattern: [0, 250, 250, 250],
          lightColor: '#FF231F7C',
        });
        console.log('Android notification channel created');
      }

      // For development/emulator, we'll just log the token
      if (this.projectId) {
        const tokenData = await Notifications.getExpoPushTokenAsync({
          projectId: this.projectId,
        });
        console.log('Development push token:', tokenData.data);
      }
    } catch (error) {
      console.error('Error setting up notifications:', error);
    }
  }

  public async scheduleLocalNotification(payload: NotificationPayload, trigger?: Notifications.NotificationTriggerInput) {
    try {
      console.log('Scheduling notification:', payload);
      
      // Store notification in AsyncStorage for development
      const storedNotifications = await this.getStoredNotifications();
      const newNotification = {
        id: Date.now().toString(),
        payload,
        trigger,
        createdAt: new Date().toISOString(),
      };
      
      storedNotifications.push(newNotification);
      await AsyncStorage.setItem(NotificationService.STORAGE_KEY, JSON.stringify(storedNotifications));
      console.log('Notification stored in AsyncStorage');

      // For emulator testing, we'll use immediate trigger if none specified
      const notificationTrigger = trigger || { seconds: 1 }; // Show after 1 second

      // Schedule the actual notification
      const identifier = await Notifications.scheduleNotificationAsync({
        content: {
          title: payload.title,
          body: payload.body,
          data: payload.data,
        },
        trigger: notificationTrigger,
      });

      console.log('Notification scheduled successfully:', {
        id: newNotification.id,
        identifier,
        payload,
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

  public async cancelNotification(identifier: string) {
    try {
      await Notifications.cancelScheduledNotificationAsync(identifier);
      
      // Remove from stored notifications
      const storedNotifications = await this.getStoredNotifications();
      const updatedNotifications = storedNotifications.filter(
        (n: any) => n.identifier !== identifier
      );
      await AsyncStorage.setItem(NotificationService.STORAGE_KEY, JSON.stringify(updatedNotifications));
    } catch (error) {
      console.error('Error canceling notification:', error);
      throw error;
    }
  }

  public async cancelAllNotifications() {
    try {
      await Notifications.cancelAllScheduledNotificationsAsync();
      await AsyncStorage.removeItem(NotificationService.STORAGE_KEY);
    } catch (error) {
      console.error('Error canceling all notifications:', error);
      throw error;
    }
  }
} 