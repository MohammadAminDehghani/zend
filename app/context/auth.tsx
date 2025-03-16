import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { jwtDecode } from 'jwt-decode';

type AuthContextType = {
  isAuthenticated: boolean;
  setIsAuthenticated: (value: boolean) => void;
  isLoading: boolean;
  token: string | null;
  userId: string | null;
  user: {
    id: string;
  };
  setToken: (token: string | null) => void;
  logout: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [token, setToken] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [user, setUser] = useState<{ id: string | null }>({ id: null });

  const processToken = (token: string | null) => {
    if (token) {
      try {
        const decoded = jwtDecode<{ userId: string }>(token);
        console.log('Decoded token:', decoded);
        setUserId(decoded.userId);
        setUser({ id: decoded.userId });
      } catch (error) {
        console.error('Error decoding token:', error);
        setUserId(null);
        setUser({ id: null });
      }
    } else {
      setUserId(null);
      setUser({ id: null });
    }
  };

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const storedToken = await AsyncStorage.getItem('userToken');
        console.log('Stored token:', storedToken);
        if (storedToken) {
          setToken(storedToken);
          processToken(storedToken);
          setIsAuthenticated(true);
        }
      } catch (error) {
        console.error('Error checking auth state:', error);
      } finally {
        setIsLoading(false);
      }
    };

    checkAuth();
  }, []);

  const logout = async () => {
    try {
      await AsyncStorage.removeItem('userToken');
      setToken(null);
      setUserId(null);
      setUser({ id: null });
      setIsAuthenticated(false);
    } catch (error) {
      console.error('Error during logout:', error);
    }
  };

  const wrappedSetToken = (newToken: string | null) => {
    console.log('Setting new token:', newToken);
    setToken(newToken);
    processToken(newToken);
  };

  return (
    <AuthContext.Provider 
      value={{ 
        isAuthenticated, 
        setIsAuthenticated, 
        isLoading,
        token,
        userId,
        user,
        setToken: wrappedSetToken,
        logout
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

export default AuthProvider; 