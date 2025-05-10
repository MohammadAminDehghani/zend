import React from 'react';
import { render, renderHook } from '@testing-library/react-native';
import { NotificationProvider } from '../../../src/contexts/NotificationContext';
import { act } from '@testing-library/react-native';

// Mock AuthContext
const mockAuthContext = {
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

// Create a mock AuthContext
const AuthContext = React.createContext(mockAuthContext);

// Create a mock AuthProvider component
const MockAuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <AuthContext.Provider value={mockAuthContext}>
      {children}
    </AuthContext.Provider>
  );
};

// Mock the auth module
jest.mock('../../app/context/auth', () => ({
  AuthProvider: MockAuthProvider,
  useAuth: () => mockAuthContext
}));

// Mock AsyncStorage
jest.mock('@react-native-async-storage/async-storage', () => ({
  getItem: jest.fn().mockResolvedValue(null),
  setItem: jest.fn().mockResolvedValue(undefined),
  removeItem: jest.fn().mockResolvedValue(undefined)
}));

// Mock jwtDecode
jest.mock('jwt-decode', () => ({
  jwtDecode: jest.fn().mockReturnValue({ userId: 'mock-user-id' })
}));

// Mock expo-notifications
jest.mock('expo-notifications', () => ({
  getPermissionsAsync: jest.fn().mockResolvedValue({ status: 'granted' }),
  addNotificationReceivedListener: jest.fn().mockReturnValue({ remove: jest.fn() }),
  addNotificationResponseReceivedListener: jest.fn().mockReturnValue({ remove: jest.fn() })
}));

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
    <MockAuthProvider>
      <NotificationProvider>
        {children}
      </NotificationProvider>
    </MockAuthProvider>
  );
};

export const renderWithProviders = (ui: React.ReactElement) => {
  return render(
    <MockAuthProvider>
      <NotificationProvider>
        {ui}
      </NotificationProvider>
    </MockAuthProvider>
  );
};

// Helper function for testing hooks with providers
export const renderHookWithProviders = (hook: any) => {
  return renderHook(hook, { wrapper: TestWrapper });
};

// Helper function to wait for state updates
export const waitForStateUpdate = async () => {
  await act(async () => {
    await new Promise(resolve => setTimeout(resolve, 0));
  });
}; 