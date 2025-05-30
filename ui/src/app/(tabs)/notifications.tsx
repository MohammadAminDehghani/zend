import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity } from 'react-native';
import { NotificationService } from '../../services/notifications';
import { colors } from '../theme';
import { useNotificationHook } from '../../hooks/useNotificationHook';

export default function NotificationsDebugScreen() {
  const [notifications, setNotifications] = useState<any[]>([]);
  const notificationService = NotificationService.getInstance();
  const { testNotification } = useNotificationHook();

  useEffect(() => {
    loadNotifications();
  }, []);

  const loadNotifications = async () => {
    try {
      const stored = await notificationService.getStoredNotifications();
      setNotifications(stored);
    } catch (error) {
      console.error('Error loading notifications:', error);
    }
  };

  const clearNotifications = async () => {
    try {
      await notificationService.cancelAllNotifications();
      setNotifications([]);
    } catch (error) {
      console.error('Error clearing notifications:', error);
    }
  };

  const handleTestNotification = async () => {
    try {
      await testNotification();
      await loadNotifications();
    } catch (error) {
      console.error('Error testing notification:', error);
    }
  };

  const renderNotification = (notification: any) => {
    try {
      // Safely extract values with fallbacks
      const title = typeof notification?.payload?.title === 'string' ? notification.payload.title :
                   typeof notification?.title === 'string' ? notification.title : 'No Title';
      
      const body = typeof notification?.payload?.body === 'string' ? notification.payload.body :
                  typeof notification?.body === 'string' ? notification.body :
                  typeof notification?.message === 'string' ? notification.message : 'No Body';
      
      const data = notification?.payload?.data || notification?.data || {};
      const createdAt = notification?.createdAt || notification?.timestamp || new Date().toISOString();

      return (
        <View key={notification.id} style={styles.notificationCard}>
          <Text style={styles.notificationTitle}>{title}</Text>
          <Text style={styles.notificationBody}>{body}</Text>
          <Text style={styles.notificationData}>
            Data: {Object.keys(data).length > 0 ? JSON.stringify(data, null, 2) : 'No Data'}
          </Text>
          <Text style={styles.notificationDate}>
            Created: {new Date(createdAt).toLocaleString()}
          </Text>
        </View>
      );
    } catch (error) {
      console.error('Error rendering notification:', error);
      return (
        <View key={notification.id} style={styles.notificationCard}>
          <Text style={styles.notificationTitle}>Error Rendering Notification</Text>
          <Text style={styles.notificationBody}>Failed to render notification data</Text>
        </View>
      );
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Stored Notifications</Text>
        <TouchableOpacity onPress={clearNotifications} style={styles.clearButton}>
          <Text style={styles.clearButtonText}>Clear All</Text>
        </TouchableOpacity>
      </View>

      <TouchableOpacity onPress={handleTestNotification} style={styles.testButton}>
        <Text style={styles.testButtonText}>Send Test Notification</Text>
      </TouchableOpacity>
      
      <ScrollView style={styles.scrollView}>
        {notifications.length === 0 ? (
          <Text style={styles.emptyText}>No notifications stored</Text>
        ) : (
          notifications.map(renderNotification)
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: colors.white,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.text,
  },
  clearButton: {
    backgroundColor: colors.error,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  clearButtonText: {
    color: colors.white,
    fontWeight: '600',
  },
  testButton: {
    backgroundColor: colors.primary,
    margin: 16,
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  testButtonText: {
    color: colors.white,
    fontWeight: '600',
    fontSize: 16,
  },
  scrollView: {
    flex: 1,
    padding: 16,
  },
  emptyText: {
    textAlign: 'center',
    color: colors.textSecondary,
    marginTop: 32,
  },
  notificationCard: {
    backgroundColor: colors.white,
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  notificationTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 8,
  },
  notificationBody: {
    fontSize: 16,
    color: colors.textSecondary,
    marginBottom: 8,
  },
  notificationData: {
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: 8,
  },
  notificationDate: {
    fontSize: 12,
    color: colors.textTertiary,
  },
}); 