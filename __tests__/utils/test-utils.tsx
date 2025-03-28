import React from 'react';
import { render, act } from '@testing-library/react-native';
import { renderHook } from '@testing-library/react-hooks';
import { AuthProvider } from '../../app/context/auth';
import { NotificationProvider } from '../../app/context/NotificationContext';

export const mockAuthContext = {
  isAuthenticated: true,
  setIsAuthenticated: jest.fn(),
  isLoading: false,
  token: 'mock-token',
  userId: 'mock-user-id',
  user: {
    id: 'mock-user-id'
  },
  setToken: jest.fn(),
  logout: jest.fn()
};

export const mockNotificationContext = {
  notificationService: {
    getInstance: jest.fn(),
    scheduleLocalNotification: jest.fn(),
    cancelNotification: jest.fn(),
    cancelAllNotifications: jest.fn()
  },
  hasPermission: true,
  scheduleNotification: jest.fn(),
  cancelNotification: jest.fn(),
  cancelAllNotifications: jest.fn()
};

export const TestWrapper = ({ children }: { children: React.ReactNode }) => {
  return (
    <AuthProvider>
      <NotificationProvider>
        {children}
      </NotificationProvider>
    </AuthProvider>
  );
};

export const renderWithProviders = (ui: React.ReactElement) => {
  return render(ui, { wrapper: TestWrapper });
};

// Helper function for testing hooks with providers
export const renderHookWithProviders = (hook: any) => {
  return renderHook(hook, { wrapper: TestWrapper });
}; 