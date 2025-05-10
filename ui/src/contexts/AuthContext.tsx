import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { router } from 'expo-router';
import { API_URL } from '../app/config/api';

interface AuthContextType {
  token: string | null;
  setToken: (token: string | null) => void;
  isLoading: boolean;
  isAuthenticated: boolean;
  setIsAuthenticated: (value: boolean) => void;
  logout: () => Promise<void>;
  user: {
    id: string;
    name: string;
    email: string;
    pictures: Array<{
      url: string;
      uploadedAt: string;
      _id: string;
    }>;
    phone: string;
    gender: 'man' | 'woman' | 'other';
    interests: string[];
    bio: string;
  } | null;
}

const AuthContext = createContext<AuthContextType>({
  token: null,
  setToken: () => {},
  isLoading: true,
  isAuthenticated: false,
  setIsAuthenticated: () => {},
  logout: async () => {},
  user: null
});

export const useAuth = () => useContext(AuthContext);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState<AuthContextType['user']>(null);

  useEffect(() => {
    loadToken();
  }, []);

  const loadToken = async () => {
    try {
      const storedToken = await AsyncStorage.getItem('token');
      setToken(storedToken);
      setIsAuthenticated(!!storedToken);
      if (storedToken) {
        // Load user data if token exists
        await loadUserData(storedToken);
      }
    } catch (error) {
      console.error('Error loading token:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const loadUserData = async (authToken: string) => {
    try {
      const response = await fetch(`${API_URL}/api/auth/profile`, {
        headers: {
          'Authorization': `Bearer ${authToken}`
        }
      });
      
      if (response.ok) {
        const userData = await response.json();
        setUser(userData);
      } else {
        // If the token is invalid, clear it
        await handleSetToken(null);
      }
    } catch (error) {
      console.error('Error loading user data:', error);
      // If there's a network error, clear the token
      await handleSetToken(null);
    }
  };

  const handleSetToken = async (newToken: string | null) => {
    try {
      if (newToken) {
        await AsyncStorage.setItem('token', newToken);
        await loadUserData(newToken);
      } else {
        await AsyncStorage.removeItem('token');
        setUser(null);
      }
      setToken(newToken);
      setIsAuthenticated(!!newToken);
    } catch (error) {
      console.error('Error saving token:', error);
    }
  };

  const logout = async () => {
    try {
      await AsyncStorage.removeItem('token');
      setToken(null);
      setIsAuthenticated(false);
      setUser(null);
      router.replace('/login');
    } catch (error) {
      console.error('Error during logout:', error);
    }
  };

  return (
    <AuthContext.Provider value={{ 
      token, 
      setToken: handleSetToken, 
      isLoading,
      isAuthenticated,
      setIsAuthenticated,
      logout,
      user
    }}>
      {children}
    </AuthContext.Provider>
  );
} 