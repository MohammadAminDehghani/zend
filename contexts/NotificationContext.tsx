import React, { createContext, useContext, useEffect, useState } from 'react';
import * as Notifications from 'expo-notifications';
import { NotificationService, NotificationPayload } from '../services/notifications';

interface NotificationContextType {
  notificationService: NotificationService;
  hasPermission: boolean;
  scheduleNotification: (payload: NotificationPayload, trigger?: Notifications.NotificationTriggerInput) => Promise<string>;
  cancelNotification: (identifier: string) => Promise<void>;
  cancelAllNotifications: () => Promise<void>;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export const NotificationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [hasPermission, setHasPermission] = useState(false);
  const notificationService = NotificationService.getInstance();

  useEffect(() => {
    setupNotifications();
  }, []);

  const setupNotifications = async () => {
    try {
      const { status } = await Notifications.getPermissionsAsync();
      setHasPermission(status === 'granted');

      // Listen for notification received while app is foregrounded
      const foregroundSubscription = Notifications.addNotificationReceivedListener(notification => {
        console.log('Received notification:', notification);
      });

      // Listen for notification response (user tapped notification)
      const responseSubscription = Notifications.addNotificationResponseReceivedListener(response => {
        console.log('Notification response:', response);
      });

      return () => {
        foregroundSubscription.remove();
        responseSubscription.remove();
      };
    } catch (error) {
      console.error('Error setting up notifications:', error);
    }
  };

  const value = {
    notificationService,
    hasPermission,
    scheduleNotification: notificationService.scheduleLocalNotification.bind(notificationService),
    cancelNotification: notificationService.cancelNotification.bind(notificationService),
    cancelAllNotifications: notificationService.cancelAllNotifications.bind(notificationService),
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
};

export const useNotification = () => {
  const context = useContext(NotificationContext);
  if (context === undefined) {
    throw new Error('useNotification must be used within a NotificationProvider');
  }
  return context;
}; 