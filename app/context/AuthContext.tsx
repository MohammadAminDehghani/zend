import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface AuthContextType {
  token: string | null;
  setToken: (token: string | null) => void;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType>({
  token: null,
  setToken: () => {},
  isLoading: true,
});

export const useAuth = () => useContext(AuthContext);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadToken();
  }, []);

  const loadToken = async () => {
    try {
      const storedToken = await AsyncStorage.getItem('token');
      setToken(storedToken);
    } catch (error) {
      console.error('Error loading token:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSetToken = async (newToken: string | null) => {
    try {
      if (newToken) {
        await AsyncStorage.setItem('token', newToken);
      } else {
        await AsyncStorage.removeItem('token');
      }
      setToken(newToken);
    } catch (error) {
      console.error('Error saving token:', error);
    }
  };

  return (
    <AuthContext.Provider value={{ token, setToken: handleSetToken, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
} 