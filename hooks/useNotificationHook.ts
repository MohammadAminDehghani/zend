import { useNotification } from '../contexts/NotificationContext';
import * as Notifications from 'expo-notifications';

export const useNotificationHook = () => {
  const notificationContext = useNotification();

  const testNotification = async () => {
    console.log('Testing notification...');
    try {
      const result = await notificationContext.scheduleNotification({
        title: 'Test Notification',
        body: 'This is a test notification',
        data: { test: true }
      });
      console.log('Test notification scheduled:', result);
      return result;
    } catch (error) {
      console.error('Error sending test notification:', error);
      throw error;
    }
  };

  const showImmediateNotification = async (title: string, body: string, data?: Record<string, any>) => {
    return notificationContext.scheduleNotification({ title, body, data });
  };

  const scheduleDelayedNotification = async (
    title: string,
    body: string,
    delayInSeconds: number,
    data?: Record<string, any>
  ) => {
    return notificationContext.scheduleNotification(
      { title, body, data },
      { seconds: delayInSeconds }
    );
  };

  const scheduleDailyNotification = async (
    title: string,
    body: string,
    hour: number,
    minute: number,
    data?: Record<string, any>
  ) => {
    return notificationContext.scheduleNotification(
      { title, body, data },
      {
        hour,
        minute,
        repeats: true,
      }
    );
  };

  const scheduleWeeklyNotification = async (
    title: string,
    body: string,
    weekday: number,
    hour: number,
    minute: number,
    data?: Record<string, any>
  ) => {
    return notificationContext.scheduleNotification(
      { title, body, data },
      {
        weekday,
        hour,
        minute,
        repeats: true,
      }
    );
  };

  return {
    ...notificationContext,
    testNotification,
    showImmediateNotification,
    scheduleDelayedNotification,
    scheduleDailyNotification,
    scheduleWeeklyNotification,
  };
}; 