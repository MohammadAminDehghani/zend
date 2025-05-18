import React, { useState } from 'react';
import { View, TextInput, TouchableOpacity, Text, StyleSheet, Alert } from 'react-native';
import { router } from 'expo-router';
import { API_URL } from './../config/api';
import { useAuth } from '../../contexts/AuthContext';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { colors } from '../theme';

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const { setIsAuthenticated, setToken } = useAuth();

  const handleLogin = async () => {
    try {
      const response = await fetch(`${API_URL}/api/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Login failed');
      }

      // Store the token
      await AsyncStorage.setItem('userToken', data.token);
      setToken(data.token);
      setIsAuthenticated(true);
      
      // Navigate to the main app
      router.replace('/(tabs)');
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'An error occurred';
      Alert.alert('Error', errorMessage);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Login</Text>
      <TextInput
        style={styles.input}
        placeholder="Email"
        value={email}
        onChangeText={setEmail}
        keyboardType="email-address"
        autoCapitalize="none"
      />
      <TextInput
        style={styles.input}
        placeholder="Password"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
      />
      <TouchableOpacity style={styles.button} onPress={handleLogin}>
        <Text style={styles.buttonText}>Login</Text>
      </TouchableOpacity>
      <TouchableOpacity onPress={() => router.push('/register')}>
        <Text style={styles.link}>Don't have an account? Register</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    padding: 20,
    backgroundColor: colors.white,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
  },
  input: {
    borderWidth: 1,
    borderColor: colors.gray[300],
    padding: 10,
    borderRadius: 5,
    marginBottom: 15,
  },
  button: {
    backgroundColor: colors.primary,
    padding: 15,
    borderRadius: 5,
    marginBottom: 15,
  },
  buttonText: {
    color: colors.white,
    textAlign: 'center',
    fontWeight: 'bold',
  },
  link: {
    color: colors.primary,
    textAlign: 'center',
  },
}); 