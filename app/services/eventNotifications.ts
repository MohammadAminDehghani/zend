import { NotificationService } from './notifications';
import { Event } from '../types/event';

export class EventNotificationService {
  private static instance: EventNotificationService;
  private notificationService: NotificationService;

  private constructor() {
    this.notificationService = NotificationService.getInstance();
  }

  public static getInstance(): EventNotificationService {
    if (!EventNotificationService.instance) {
      EventNotificationService.instance = new EventNotificationService();
    }
    return EventNotificationService.instance;
  }

  public async notifyEventEdit(event: Event) {
    try {
      return await this.notificationService.scheduleLocalNotification({
        title: 'Event Updated',
        body: `The event "${event.title}" has been updated`,
        data: { 
          type: 'event_edit',
          eventId: event.id 
        }
      });
    } catch (error) {
      console.error('Error sending event edit notification:', error);
      throw error;
    }
  }

  public async notifyEventCancel(event: Event) {
    try {
      return await this.notificationService.scheduleLocalNotification({
        title: 'Event Cancelled',
        body: `The event "${event.title}" has been cancelled`,
        data: { 
          type: 'event_cancel',
          eventId: event.id 
        }
      });
    } catch (error) {
      console.error('Error sending event cancel notification:', error);
      throw error;
    }
  }

  public async scheduleEventReminder(event: Event) {
    try {
      const reminderTime = new Date(event.startTime);
      reminderTime.setHours(reminderTime.getHours() - 1); // 1 hour before

      if (reminderTime.getTime() <= Date.now()) {
        return; // Don't schedule if reminder time has passed
      }

      return await this.notificationService.scheduleLocalNotification({
        title: 'Upcoming Event',
        body: `The event "${event.title}" starts in 1 hour`,
        data: { 
          type: 'event_reminder',
          eventId: event.id 
        }
      }, {
        date: reminderTime
      });
    } catch (error) {
      console.error('Error scheduling event reminder:', error);
      throw error;
    }
  }
} 