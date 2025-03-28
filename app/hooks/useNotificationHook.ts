import { useCallback } from 'react';
import { NotificationService, NotificationPayload } from '../services/notifications';

export const useNotificationHook = () => {
  const notificationService = NotificationService.getInstance();

  const showImmediateNotification = useCallback(async (payload: NotificationPayload) => {
    try {
      return await notificationService.scheduleLocalNotification(payload, { seconds: 1 });
    } catch (error) {
      console.error('Error showing immediate notification:', error);
      throw error;
    }
  }, []);

  const testNotification = useCallback(async () => {
    try {
      return await showImmediateNotification({
        title: 'Test Notification',
        body: 'This is a test notification',
        data: { type: 'test' }
      });
    } catch (error) {
      console.error('Error sending test notification:', error);
      throw error;
    }
  }, [showImmediateNotification]);

  return {
    showImmediateNotification,
    testNotification
  };
}; 