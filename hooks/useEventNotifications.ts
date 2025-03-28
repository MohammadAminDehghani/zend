import { EventNotificationService, EventNotificationData } from '../services/eventNotifications';

export const useEventNotifications = () => {
  const eventNotificationService = EventNotificationService.getInstance();

  const notifyEventEdit = async (
    eventId: string,
    eventTitle: string,
    changes: { field: string; oldValue: any; newValue: any }[]
  ) => {
    const data: EventNotificationData = {
      eventId,
      eventTitle,
      type: 'EVENT_EDIT',
      changes,
    };
    return eventNotificationService.notifyEventEdit(data);
  };

  const notifyEventCancel = async (eventId: string, eventTitle: string) => {
    const data: EventNotificationData = {
      eventId,
      eventTitle,
      type: 'EVENT_CANCEL',
    };
    return eventNotificationService.notifyEventCancel(data);
  };

  const scheduleEventReminder = async (
    eventId: string,
    eventTitle: string,
    reminderTime: Date
  ) => {
    const data: EventNotificationData = {
      eventId,
      eventTitle,
      type: 'EVENT_REMINDER',
    };
    return eventNotificationService.scheduleEventReminder(data, reminderTime);
  };

  const cancelEventNotifications = async (eventId: string) => {
    return eventNotificationService.cancelEventNotifications(eventId);
  };

  return {
    notifyEventEdit,
    notifyEventCancel,
    scheduleEventReminder,
    cancelEventNotifications,
  };
}; 