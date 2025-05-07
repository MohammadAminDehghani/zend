import { NotificationService, NotificationPayload } from './notifications';

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

export class EventNotificationService {
  private static instance: EventNotificationService;
  private notificationService: NotificationService;

  private constructor() {
    console.log('Creating EventNotificationService instance');
    this.notificationService = NotificationService.getInstance();
  }

  public static getInstance(): EventNotificationService {
    if (!EventNotificationService.instance) {
      EventNotificationService.instance = new EventNotificationService();
    }
    return EventNotificationService.instance;
  }

  private getNotificationContent(data: EventNotificationData): NotificationPayload {
    console.log('Creating notification content for:', data);
    
    switch (data.type) {
      case 'EVENT_EDIT':
        const editPayload = {
          title: `Event Updated: ${data.eventTitle}`,
          body: this.generateEditMessage(data),
          data: {
            eventId: data.eventId,
            type: data.type,
          },
        };
        console.log('Generated edit notification payload:', editPayload);
        return editPayload;
        
      case 'EVENT_CANCEL':
        const cancelPayload = {
          title: `Event Cancelled: ${data.eventTitle}`,
          body: 'This event has been cancelled by the creator.',
          data: {
            eventId: data.eventId,
            type: data.type,
          },
        };
        console.log('Generated cancel notification payload:', cancelPayload);
        return cancelPayload;
        
      case 'EVENT_REMINDER':
        const reminderPayload = {
          title: `Reminder: ${data.eventTitle}`,
          body: 'Your event is starting soon!',
          data: {
            eventId: data.eventId,
            type: data.type,
          },
        };
        console.log('Generated reminder notification payload:', reminderPayload);
        return reminderPayload;
        
      default:
        throw new Error('Invalid notification type');
    }
  }

  private generateEditMessage(data: EventNotificationData): string {
    if (!data.changes || data.changes.length === 0) {
      return 'The event has been updated.';
    }

    const changeMessages = data.changes.map(change => {
      const field = change.field.toLowerCase().replace(/_/g, ' ');
      return `${field} changed from "${change.oldValue}" to "${change.newValue}"`;
    });

    const message = `Event updates: ${changeMessages.join(', ')}`;
    console.log('Generated edit message:', message);
    return message;
  }

  public async notifyEventEdit(data: EventNotificationData) {
    console.log('Sending event edit notification:', data);
    const payload = this.getNotificationContent(data);
    try {
      console.log('Scheduling notification with payload:', payload);
      const identifier = await this.notificationService.scheduleLocalNotification(payload);
      console.log('Notification scheduled successfully with identifier:', identifier);
      return identifier;
    } catch (error) {
      console.error('Error sending event edit notification:', error);
      throw error;
    }
  }

  public async notifyEventCancel(data: EventNotificationData) {
    console.log('Sending event cancel notification:', data);
    const payload = this.getNotificationContent(data);
    try {
      console.log('Scheduling cancel notification with payload:', payload);
      const identifier = await this.notificationService.scheduleLocalNotification(payload);
      console.log('Cancel notification scheduled successfully with identifier:', identifier);
      return identifier;
    } catch (error) {
      console.error('Error sending event cancel notification:', error);
      throw error;
    }
  }

  public async scheduleEventReminder(data: EventNotificationData, triggerTime: Date) {
    console.log('Scheduling event reminder:', { data, triggerTime });
    const payload = this.getNotificationContent(data);
    try {
      console.log('Scheduling reminder notification with payload:', payload);
      const identifier = await this.notificationService.scheduleLocalNotification(payload, {
        date: triggerTime,
      });
      console.log('Reminder notification scheduled successfully with identifier:', identifier);
      return identifier;
    } catch (error) {
      console.error('Error scheduling event reminder:', error);
      throw error;
    }
  }

  public async cancelEventNotifications(eventId: string) {
    console.log('Cancelling all notifications for event:', eventId);
    try {
      await this.notificationService.cancelAllNotifications();
      console.log('Successfully cancelled all notifications for event:', eventId);
    } catch (error) {
      console.error('Error cancelling event notifications:', error);
      throw error;
    }
  }
} 