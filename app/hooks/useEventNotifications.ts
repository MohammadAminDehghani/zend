import { useCallback } from 'react';
import { EventNotificationService } from '../services/eventNotifications';
import { Event } from '../types/event';

export const useEventNotifications = () => {
  const eventNotificationService = EventNotificationService.getInstance();

  const notifyEventEdit = useCallback(async (event: Event) => {
    try {
      return await eventNotificationService.notifyEventEdit(event);
    } catch (error) {
      console.error('Error in notifyEventEdit:', error);
      throw error;
    }
  }, []);

  const notifyEventCancel = useCallback(async (event: Event) => {
    try {
      return await eventNotificationService.notifyEventCancel(event);
    } catch (error) {
      console.error('Error in notifyEventCancel:', error);
      throw error;
    }
  }, []);

  const scheduleEventReminder = useCallback(async (event: Event) => {
    try {
      return await eventNotificationService.scheduleEventReminder(event);
    } catch (error) {
      console.error('Error in scheduleEventReminder:', error);
      throw error;
    }
  }, []);

  return {
    notifyEventEdit,
    notifyEventCancel,
    scheduleEventReminder
  };
}; 