import { useNotification } from '../contexts/NotificationContext';
import * as Notifications from 'expo-notifications';

export interface EventNotificationData {
  eventId: string;
  eventTitle: string;
  type: 'EVENT_EDIT' | 'EVENT_CANCEL' | 'EVENT_REMINDER';
  changes?: {
    field: string;
    oldValue: any;
    newValue: any;
  }[];
}

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

  // Event-specific notification functions
  const notifyEventEdit = async (data: EventNotificationData) => {
    const payload = {
      title: `Event Updated: ${data.eventTitle}`,
      body: generateEditMessage(data),
      data: {
        eventId: data.eventId,
        type: data.type,
      },
    };
    return notificationContext.scheduleNotification(payload);
  };

  const notifyEventCancel = async (data: EventNotificationData) => {
    const payload = {
      title: `Event Cancelled: ${data.eventTitle}`,
      body: 'This event has been cancelled by the creator.',
      data: {
        eventId: data.eventId,
        type: data.type,
      },
    };
    return notificationContext.scheduleNotification(payload);
  };

  const scheduleEventReminder = async (data: EventNotificationData, triggerTime: Date) => {
    const payload = {
      title: `Reminder: ${data.eventTitle}`,
      body: 'Your event is starting soon!',
      data: {
        eventId: data.eventId,
        type: data.type,
      },
    };
    return notificationContext.scheduleNotification(payload, { date: triggerTime });
  };

  const generateEditMessage = (data: EventNotificationData): string => {
    if (!data.changes || data.changes.length === 0) {
      return 'The event has been updated.';
    }

    const changeMessages = data.changes.map(change => {
      const field = change.field.toLowerCase().replace(/_/g, ' ');
      return `${field} changed from "${change.oldValue}" to "${change.newValue}"`;
    });

    return `Event updates: ${changeMessages.join(', ')}`;
  };

  return {
    ...notificationContext,
    testNotification,
    showImmediateNotification,
    scheduleDelayedNotification,
    scheduleDailyNotification,
    scheduleWeeklyNotification,
    notifyEventEdit,
    notifyEventCancel,
    scheduleEventReminder,
  };
}; 